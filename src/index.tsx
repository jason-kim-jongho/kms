import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import { renderer } from './renderer'

type Bindings = {
  DB: D1Database
}

const app = new Hono<{ Bindings: Bindings }>()

app.use('/api/*', cors())
app.use('/static/*', serveStatic({ root: './public' }))
app.use(renderer)

// ============================================================
// Helpers
// ============================================================
const ok = (c: any, data: any) => c.json({ success: true, data })
const fail = (c: any, message: string, code = 400) => c.json({ success: false, error: message }, code)

// ============================================================
// DASHBOARD SUMMARY
// ============================================================
app.get('/api/dashboard', async (c) => {
  const { DB } = c.env

  // 1) 3개월 진행률 (milestones)
  const milestones = await DB.prepare(
    `SELECT id, month_no, title, status, progress, start_date, end_date FROM milestones ORDER BY month_no`
  ).all()

  const taskStats = await DB.prepare(
    `SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN status = 'blocked' THEN 1 ELSE 0 END) as blocked,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        AVG(progress) as avg_progress
     FROM tasks`
  ).first()

  const overallProgress = milestones.results.length
    ? Math.round(
        (milestones.results as any[]).reduce((sum, m) => sum + (m.progress || 0), 0) /
          milestones.results.length
      )
    : 0

  // 2) 위험 모듈 (dev_modules)
  const riskModules = await DB.prepare(
    `SELECT id, module_key, name, category, status, risk_level, risk_note, progress, owner, planned_month
     FROM dev_modules
     WHERE risk_level IN ('high', 'critical')
     ORDER BY CASE risk_level WHEN 'critical' THEN 0 WHEN 'high' THEN 1 ELSE 2 END`
  ).all()

  const moduleStats = await DB.prepare(
    `SELECT
        COUNT(*) as total,
        SUM(CASE WHEN risk_level = 'critical' THEN 1 ELSE 0 END) as critical,
        SUM(CASE WHEN risk_level = 'high' THEN 1 ELSE 0 END) as high,
        SUM(CASE WHEN risk_level = 'medium' THEN 1 ELSE 0 END) as medium,
        SUM(CASE WHEN risk_level = 'low' THEN 1 ELSE 0 END) as low,
        AVG(progress) as avg_progress
     FROM dev_modules`
  ).first()

  // 3) 매핑 완성도 (sap_teedy_mapping)
  const mappingStats = await DB.prepare(
    `SELECT
        COUNT(*) as total,
        SUM(CASE WHEN mapping_status = 'implemented' THEN 1 ELSE 0 END) as implemented,
        SUM(CASE WHEN mapping_status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN mapping_status = 'reviewed' THEN 1 ELSE 0 END) as reviewed,
        SUM(CASE WHEN mapping_status = 'draft' THEN 1 ELSE 0 END) as draft
     FROM sap_teedy_mapping`
  ).first()

  const mappingByDocType = await DB.prepare(
    `SELECT doc_type,
        COUNT(*) as total,
        SUM(CASE WHEN mapping_status = 'implemented' THEN 1 ELSE 0 END) as implemented
     FROM sap_teedy_mapping GROUP BY doc_type`
  ).all()

  const mappingTotal = (mappingStats?.total as number) || 0
  const mappingCompleteness = mappingTotal
    ? Math.round((((mappingStats?.implemented as number) || 0) / mappingTotal) * 100)
    : 0

  // 4) ACL 커버리지 (acl_design)
  const aclStats = await DB.prepare(
    `SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'applied' THEN 1 ELSE 0 END) as applied,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'reviewed' THEN 1 ELSE 0 END) as reviewed,
        SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft
     FROM acl_design`
  ).first()

  const totalDocTypes = await DB.prepare(
    `SELECT COUNT(DISTINCT doc_type) as cnt FROM (
        SELECT doc_type FROM sap_teedy_mapping
        UNION
        SELECT doc_type FROM acl_design
     )`
  ).first()

  const coveredDocTypes = await DB.prepare(
    `SELECT COUNT(DISTINCT doc_type) as cnt FROM acl_design WHERE status IN ('approved','applied')`
  ).first()

  const totalDocTypeCount = (totalDocTypes?.cnt as number) || 0
  const coveredDocTypeCount = (coveredDocTypes?.cnt as number) || 0
  const aclCoverage = totalDocTypeCount
    ? Math.round((coveredDocTypeCount / totalDocTypeCount) * 100)
    : 0

  const aclByGroup = await DB.prepare(
    `SELECT group_name,
        COUNT(*) as total,
        SUM(CASE WHEN status IN ('approved','applied') THEN 1 ELSE 0 END) as covered
     FROM acl_design GROUP BY group_name`
  ).all()

  return ok(c, {
    project: {
      overall_progress: overallProgress,
      milestones: milestones.results,
      task_stats: taskStats
    },
    risk: {
      modules: riskModules.results,
      module_stats: moduleStats
    },
    mapping: {
      stats: mappingStats,
      completeness: mappingCompleteness,
      by_doc_type: mappingByDocType.results
    },
    acl: {
      stats: aclStats,
      coverage: aclCoverage,
      total_doc_types: totalDocTypeCount,
      covered_doc_types: coveredDocTypeCount,
      by_group: aclByGroup.results
    }
  })
})

// ============================================================
// PROJECTS
// ============================================================
app.get('/api/projects', async (c) => {
  const { DB } = c.env
  const { results } = await DB.prepare(`SELECT * FROM projects ORDER BY id`).all()
  return ok(c, results)
})

app.get('/api/projects/:id', async (c) => {
  const { DB } = c.env
  const id = c.req.param('id')
  const row = await DB.prepare(`SELECT * FROM projects WHERE id = ?`).bind(id).first()
  if (!row) return fail(c, 'Project not found', 404)
  return ok(c, row)
})

app.put('/api/projects/:id', async (c) => {
  const { DB } = c.env
  const id = c.req.param('id')
  const body = await c.req.json()
  await DB.prepare(
    `UPDATE projects SET name=?, description=?, start_date=?, end_date=?, status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`
  ).bind(body.name, body.description, body.start_date, body.end_date, body.status, id).run()
  return ok(c, { id })
})

// ============================================================
// MILESTONES
// ============================================================
app.get('/api/milestones', async (c) => {
  const { DB } = c.env
  const projectId = c.req.query('project_id')
  const query = projectId
    ? DB.prepare(`SELECT * FROM milestones WHERE project_id = ? ORDER BY month_no`).bind(projectId)
    : DB.prepare(`SELECT * FROM milestones ORDER BY month_no`)
  const { results } = await query.all()
  return ok(c, results)
})

app.get('/api/milestones/:id', async (c) => {
  const { DB } = c.env
  const id = c.req.param('id')
  const milestone = await DB.prepare(`SELECT * FROM milestones WHERE id = ?`).bind(id).first()
  if (!milestone) return fail(c, 'Milestone not found', 404)
  const tasks = await DB.prepare(`SELECT * FROM tasks WHERE milestone_id = ? ORDER BY id`).bind(id).all()
  return ok(c, { ...milestone, tasks: tasks.results })
})

app.post('/api/milestones', async (c) => {
  const { DB } = c.env
  const b = await c.req.json()
  const result = await DB.prepare(
    `INSERT INTO milestones (project_id, month_no, title, description, start_date, end_date, status, progress)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(b.project_id, b.month_no, b.title, b.description || null, b.start_date, b.end_date, b.status || 'planned', b.progress || 0).run()
  return ok(c, { id: result.meta.last_row_id })
})

app.put('/api/milestones/:id', async (c) => {
  const { DB } = c.env
  const id = c.req.param('id')
  const b = await c.req.json()
  await DB.prepare(
    `UPDATE milestones SET title=?, description=?, start_date=?, end_date=?, status=?, progress=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`
  ).bind(b.title, b.description, b.start_date, b.end_date, b.status, b.progress, id).run()
  return ok(c, { id })
})

app.delete('/api/milestones/:id', async (c) => {
  const { DB } = c.env
  const id = c.req.param('id')
  await DB.prepare(`DELETE FROM tasks WHERE milestone_id = ?`).bind(id).run()
  await DB.prepare(`DELETE FROM milestones WHERE id = ?`).bind(id).run()
  return ok(c, { id })
})

// ============================================================
// TASKS
// ============================================================
app.get('/api/tasks', async (c) => {
  const { DB } = c.env
  const milestoneId = c.req.query('milestone_id')
  const query = milestoneId
    ? DB.prepare(`SELECT * FROM tasks WHERE milestone_id = ? ORDER BY id`).bind(milestoneId)
    : DB.prepare(`SELECT * FROM tasks ORDER BY id`)
  const { results } = await query.all()
  return ok(c, results)
})

app.post('/api/tasks', async (c) => {
  const { DB } = c.env
  const b = await c.req.json()
  const result = await DB.prepare(
    `INSERT INTO tasks (milestone_id, title, description, owner, status, priority, start_date, due_date, progress)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    b.milestone_id, b.title, b.description || null, b.owner || null,
    b.status || 'pending', b.priority || 'medium', b.start_date || null, b.due_date || null, b.progress || 0
  ).run()
  return ok(c, { id: result.meta.last_row_id })
})

app.put('/api/tasks/:id', async (c) => {
  const { DB } = c.env
  const id = c.req.param('id')
  const b = await c.req.json()
  await DB.prepare(
    `UPDATE tasks SET title=?, description=?, owner=?, status=?, priority=?, start_date=?, due_date=?, progress=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`
  ).bind(b.title, b.description, b.owner, b.status, b.priority, b.start_date, b.due_date, b.progress, id).run()
  return ok(c, { id })
})

app.delete('/api/tasks/:id', async (c) => {
  const { DB } = c.env
  const id = c.req.param('id')
  await DB.prepare(`DELETE FROM tasks WHERE id = ?`).bind(id).run()
  return ok(c, { id })
})

// ============================================================
// DEV MODULES
// ============================================================
app.get('/api/dev-modules', async (c) => {
  const { DB } = c.env
  const { results } = await DB.prepare(`SELECT * FROM dev_modules ORDER BY id`).all()
  return ok(c, results)
})

app.post('/api/dev-modules', async (c) => {
  const { DB } = c.env
  const b = await c.req.json()
  const result = await DB.prepare(
    `INSERT INTO dev_modules (project_id, module_key, name, description, category, status, risk_level, risk_note, progress, owner, planned_month, target_milestone_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    b.project_id || 1, b.module_key, b.name, b.description || null, b.category || null,
    b.status || 'backlog', b.risk_level || 'low', b.risk_note || null, b.progress || 0,
    b.owner || null, b.planned_month || null, b.target_milestone_id || null
  ).run()
  return ok(c, { id: result.meta.last_row_id })
})

app.put('/api/dev-modules/:id', async (c) => {
  const { DB } = c.env
  const id = c.req.param('id')
  const b = await c.req.json()
  await DB.prepare(
    `UPDATE dev_modules SET name=?, description=?, category=?, status=?, risk_level=?, risk_note=?, progress=?, owner=?, planned_month=?, target_milestone_id=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`
  ).bind(
    b.name, b.description, b.category, b.status, b.risk_level, b.risk_note,
    b.progress, b.owner, b.planned_month, b.target_milestone_id, id
  ).run()
  return ok(c, { id })
})

app.delete('/api/dev-modules/:id', async (c) => {
  const { DB } = c.env
  const id = c.req.param('id')
  await DB.prepare(`DELETE FROM dev_modules WHERE id = ?`).bind(id).run()
  return ok(c, { id })
})

// ============================================================
// SAP-TEEDY MAPPING
// ============================================================
app.get('/api/mappings', async (c) => {
  const { DB } = c.env
  const { results } = await DB.prepare(`SELECT * FROM sap_teedy_mapping ORDER BY id`).all()
  return ok(c, results)
})

app.post('/api/mappings', async (c) => {
  const { DB } = c.env
  const b = await c.req.json()
  const result = await DB.prepare(
    `INSERT INTO sap_teedy_mapping (project_id, sap_table, sap_field, sap_field_desc, teedy_metadata_name, teedy_metadata_type, doc_type, unc_path_pattern, mapping_status, is_required, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    b.project_id || 1, b.sap_table, b.sap_field, b.sap_field_desc || null,
    b.teedy_metadata_name, b.teedy_metadata_type || 'STRING', b.doc_type || null,
    b.unc_path_pattern || null, b.mapping_status || 'draft', b.is_required ?? 1, b.notes || null
  ).run()
  return ok(c, { id: result.meta.last_row_id })
})

app.put('/api/mappings/:id', async (c) => {
  const { DB } = c.env
  const id = c.req.param('id')
  const b = await c.req.json()
  await DB.prepare(
    `UPDATE sap_teedy_mapping SET sap_table=?, sap_field=?, sap_field_desc=?, teedy_metadata_name=?, teedy_metadata_type=?, doc_type=?, unc_path_pattern=?, mapping_status=?, is_required=?, notes=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`
  ).bind(
    b.sap_table, b.sap_field, b.sap_field_desc, b.teedy_metadata_name, b.teedy_metadata_type,
    b.doc_type, b.unc_path_pattern, b.mapping_status, b.is_required, b.notes, id
  ).run()
  return ok(c, { id })
})

app.delete('/api/mappings/:id', async (c) => {
  const { DB } = c.env
  const id = c.req.param('id')
  await DB.prepare(`DELETE FROM sap_teedy_mapping WHERE id = ?`).bind(id).run()
  return ok(c, { id })
})

// ============================================================
// ACL DESIGN
// ============================================================
app.get('/api/acl', async (c) => {
  const { DB } = c.env
  const { results } = await DB.prepare(`SELECT * FROM acl_design ORDER BY id`).all()
  return ok(c, results)
})

app.post('/api/acl', async (c) => {
  const { DB } = c.env
  const b = await c.req.json()
  const result = await DB.prepare(
    `INSERT INTO acl_design (project_id, group_name, role_name, doc_type, permission_read, permission_write, permission_delete, permission_share, scope_note, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    b.project_id || 1, b.group_name, b.role_name, b.doc_type,
    b.permission_read ?? 0, b.permission_write ?? 0, b.permission_delete ?? 0, b.permission_share ?? 0,
    b.scope_note || null, b.status || 'draft'
  ).run()
  return ok(c, { id: result.meta.last_row_id })
})

app.put('/api/acl/:id', async (c) => {
  const { DB } = c.env
  const id = c.req.param('id')
  const b = await c.req.json()
  await DB.prepare(
    `UPDATE acl_design SET group_name=?, role_name=?, doc_type=?, permission_read=?, permission_write=?, permission_delete=?, permission_share=?, scope_note=?, status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`
  ).bind(
    b.group_name, b.role_name, b.doc_type, b.permission_read, b.permission_write,
    b.permission_delete, b.permission_share, b.scope_note, b.status, id
  ).run()
  return ok(c, { id })
})

app.delete('/api/acl/:id', async (c) => {
  const { DB } = c.env
  const id = c.req.param('id')
  await DB.prepare(`DELETE FROM acl_design WHERE id = ?`).bind(id).run()
  return ok(c, { id })
})

// ============================================================
// MAIN PAGE
// ============================================================
app.get('/', (c) => {
  return c.render(
    <>
      <div id="app"></div>
      <script src="/static/app.js"></script>
    </>
  )
})

export default app
