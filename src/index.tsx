import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import { renderer } from './renderer'

type Bindings = {
  DB: D1Database
  DOC_BUCKET: R2Bucket
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

  // 5) 문서관리(DMS) 현황 - SAP 연계 포함
  const docStats = await DB.prepare(
    `SELECT
        COUNT(*) as total_documents,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_documents
     FROM documents WHERE use_yn = 'Y'`
  ).first()

  const docFileStats = await DB.prepare(
    `SELECT COUNT(*) as total_files, COALESCE(SUM(file_size),0) as total_size_bytes
     FROM document_files WHERE use_yn = 'Y'`
  ).first()

  const docSapLinkStats = await DB.prepare(
    `SELECT
        COUNT(*) as total,
        SUM(CASE WHEN link_status = 'linked' THEN 1 ELSE 0 END) as linked,
        SUM(CASE WHEN link_status = 'missing' THEN 1 ELSE 0 END) as missing,
        SUM(CASE WHEN link_status = 'pending_review' THEN 1 ELSE 0 END) as pending_review
     FROM sap_document_links`
  ).first()

  const docSapLinkTotal = (docSapLinkStats?.total as number) || 0
  const docSapLinkRate = docSapLinkTotal
    ? Math.round((((docSapLinkStats?.linked as number) || 0) / docSapLinkTotal) * 100)
    : 0

  const missingDocuments = await DB.prepare(
    `SELECT d.id, d.title, d.storage_id, d.business_partner_name, l.sap_table, l.sap_doc_num
     FROM sap_document_links l
     JOIN documents d ON d.id = l.document_id
     WHERE l.link_status = 'missing'
     ORDER BY l.id DESC LIMIT 10`
  ).all()

  const expiringCerts = await DB.prepare(
    `SELECT id, cert_type, business_partner_name, expiry_date, status
     FROM certifications
     WHERE status = 'active' AND expiry_date <= date('now', '+90 day')
     ORDER BY expiry_date ASC LIMIT 10`
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
    },
    documents: {
      total_documents: docStats?.total_documents || 0,
      active_documents: docStats?.active_documents || 0,
      total_files: docFileStats?.total_files || 0,
      total_size_bytes: docFileStats?.total_size_bytes || 0,
      sap_link_stats: docSapLinkStats,
      sap_link_rate: docSapLinkRate,
      missing_documents: missingDocuments.results,
      expiring_certifications: expiringCerts.results
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
// DOCUMENT MANAGEMENT (DMS) — scm_solution FileStorage/CertModule 패턴 기반
// R2 오브젝트 스토리지 + D1 메타데이터, SAP B1 문서 연계
// ============================================================

function generateStorageId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let id = ''
  for (let i = 0; i < 8; i++) id += chars[Math.floor(Math.random() * chars.length)]
  return id
}

function getExt(name: string): string {
  const idx = name.lastIndexOf('.')
  return idx >= 0 ? name.substring(idx + 1).toLowerCase() : ''
}

function classifyFileType(ext: string): string {
  const image = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp']
  const video = ['mp4', 'avi', 'mov', 'wmv', 'mkv']
  const doc = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'hwp']
  if (image.includes(ext)) return 'IMAGE'
  if (video.includes(ext)) return 'VIDEO'
  if (doc.includes(ext)) return 'DOCUMENT'
  return 'OTHERS'
}

// ---- Document Categories ----
app.get('/api/doc-categories', async (c) => {
  const { DB } = c.env
  const { results } = await DB.prepare(
    `SELECT * FROM document_categories WHERE use_yn = 'Y' ORDER BY sort_order`
  ).all()
  return ok(c, results)
})

// ---- Documents: list / search ----
app.get('/api/documents', async (c) => {
  const { DB } = c.env
  const category = c.req.query('category_code')
  const partner = c.req.query('business_partner_code')
  const keyword = c.req.query('keyword')
  const linkStatus = c.req.query('link_status') // for missing-doc filter join

  let sql = `
    SELECT d.*, dc.category_name,
      (SELECT COUNT(*) FROM document_files df WHERE df.storage_id = d.storage_id AND df.use_yn='Y') as file_count,
      (SELECT sl.link_status FROM sap_document_links sl WHERE sl.document_id = d.id ORDER BY sl.id DESC LIMIT 1) as sap_link_status,
      (SELECT sl.sap_doc_num FROM sap_document_links sl WHERE sl.document_id = d.id ORDER BY sl.id DESC LIMIT 1) as sap_doc_num
    FROM documents d
    LEFT JOIN document_categories dc ON dc.category_code = d.category_code
    WHERE d.use_yn = 'Y'
  `
  const binds: any[] = []
  if (category) { sql += ` AND d.category_code = ?`; binds.push(category) }
  if (partner) { sql += ` AND d.business_partner_code = ?`; binds.push(partner) }
  if (keyword) { sql += ` AND (d.title LIKE ? OR d.file_no LIKE ? OR d.business_partner_name LIKE ?)`; binds.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`) }
  sql += ` ORDER BY d.post_date DESC`

  const stmt = binds.length ? DB.prepare(sql).bind(...binds) : DB.prepare(sql)
  const { results } = await stmt.all()

  let filtered = results as any[]
  if (linkStatus) {
    filtered = filtered.filter(r => r.sap_link_status === linkStatus)
  }
  return ok(c, filtered)
})

app.get('/api/documents/:id', async (c) => {
  const { DB } = c.env
  const id = c.req.param('id')
  const doc = await DB.prepare(`SELECT * FROM documents WHERE id = ? AND use_yn = 'Y'`).bind(id).first()
  if (!doc) return fail(c, 'Document not found', 404)
  const files = await DB.prepare(
    `SELECT * FROM document_files WHERE storage_id = ? AND use_yn = 'Y' ORDER BY file_index`
  ).bind(doc.storage_id).all()
  const sapLinks = await DB.prepare(`SELECT * FROM sap_document_links WHERE document_id = ? ORDER BY id DESC`).bind(id).all()
  const certs = await DB.prepare(`SELECT * FROM certifications WHERE document_id = ?`).bind(id).all()
  return ok(c, { ...doc, files: files.results, sap_links: sapLinks.results, certifications: certs.results })
})

// ---- Create document (metadata only, before/without file) ----
app.post('/api/documents', async (c) => {
  const { DB } = c.env
  const b = await c.req.json()
  if (!b.title || !b.category_code) return fail(c, 'title, category_code required')

  let storageId = b.storage_id
  if (!storageId) {
    // ensure uniqueness
    while (true) {
      storageId = generateStorageId()
      const exists = await DB.prepare(`SELECT id FROM documents WHERE storage_id = ?`).bind(storageId).first()
      if (!exists) break
    }
  }

  const result = await DB.prepare(
    `INSERT INTO documents (storage_id, title, category_code, doc_type, business_partner_code, business_partner_name, file_no, unc_path_ref, status, remark, post_user_id, post_user_name, company_code, use_yn)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, ?, 'Y')`
  ).bind(
    storageId, b.title, b.category_code, b.doc_type || null,
    b.business_partner_code || null, b.business_partner_name || null,
    b.file_no || null, b.unc_path_ref || null, b.remark || null,
    b.post_user_id || 'system', b.post_user_name || '시스템', b.company_code || 'UNT'
  ).run()

  return ok(c, { id: result.meta.last_row_id, storage_id: storageId })
})

app.put('/api/documents/:id', async (c) => {
  const { DB } = c.env
  const id = c.req.param('id')
  const b = await c.req.json()
  await DB.prepare(
    `UPDATE documents SET title=?, category_code=?, doc_type=?, business_partner_code=?, business_partner_name=?, file_no=?, remark=?, status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`
  ).bind(
    b.title, b.category_code, b.doc_type, b.business_partner_code, b.business_partner_name,
    b.file_no, b.remark, b.status || 'active', id
  ).run()
  return ok(c, { id })
})

app.delete('/api/documents/:id', async (c) => {
  const { DB } = c.env
  const id = c.req.param('id')
  await DB.prepare(
    `UPDATE documents SET use_yn='N', deleted_at=CURRENT_TIMESTAMP, status='deleted' WHERE id=?`
  ).bind(id).run()
  return ok(c, { id })
})

// ---- File upload (multipart) -> R2 + D1 ----
app.post('/api/documents/:id/files', async (c) => {
  const { DB, DOC_BUCKET } = c.env
  const docId = c.req.param('id')
  const doc = await DB.prepare(`SELECT * FROM documents WHERE id = ? AND use_yn='Y'`).bind(docId).first()
  if (!doc) return fail(c, 'Document not found', 404)

  const formData = await c.req.formData()
  const files = formData.getAll('file') as File[]
  if (!files.length) return fail(c, 'No file provided')

  const storageId = doc.storage_id as string
  const uploaded: any[] = []

  for (const file of files) {
    const originalName = file.name
    const ext = getExt(originalName)
    const fileType = classifyFileType(ext)
    const nameOnly = originalName.replace(/\.[^/.]+$/, '').replace(/\s+/g, '_')
    let storageFileName = ext ? `${nameOnly}.${ext}` : nameOnly

    // check existing file_index max
    const latest = await DB.prepare(
      `SELECT MAX(file_index) as maxIdx FROM document_files WHERE storage_id = ?`
    ).bind(storageId).first()
    let fileIndex = ((latest?.maxIdx as number) || 0) + 1

    const r2Key = `documents/${storageId}/${storageFileName}`
    const buffer = await file.arrayBuffer()
    await DOC_BUCKET.put(r2Key, buffer, {
      httpMetadata: { contentType: file.type || 'application/octet-stream' }
    })

    const result = await DB.prepare(
      `INSERT INTO document_files (storage_id, file_index, file_name, original_file_name, r2_object_key, file_type, mime_type, file_size, post_user_id, post_user_name, use_yn)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Y')`
    ).bind(
      storageId, fileIndex, storageFileName, originalName, r2Key, fileType,
      file.type || null, buffer.byteLength, 'system', '시스템'
    ).run()

    uploaded.push({ id: result.meta.last_row_id, fileName: storageFileName, fileIndex, fileType, size: buffer.byteLength })
  }

  await DB.prepare(
    `INSERT INTO document_access_logs (document_id, action, actor_id, actor_name, actor_group) VALUES (?, 'upload', ?, ?, ?)`
  ).bind(docId, 'system', '시스템', '시스템').run()

  return ok(c, { storage_id: storageId, uploaded })
})

// ---- File download/view ----
app.get('/api/documents/:id/files/:fileId/content', async (c) => {
  const { DB, DOC_BUCKET } = c.env
  const fileId = c.req.param('fileId')
  const fileRow = await DB.prepare(`SELECT * FROM document_files WHERE id = ? AND use_yn='Y'`).bind(fileId).first()
  if (!fileRow) return fail(c, 'File not found', 404)

  const obj = await DOC_BUCKET.get(fileRow.r2_object_key as string)
  if (!obj) return fail(c, 'File content not found in storage (R2)', 404)

  await DB.prepare(
    `INSERT INTO document_access_logs (document_id, action, actor_id, actor_name, actor_group) VALUES (?, 'download', ?, ?, ?)`
  ).bind(c.req.param('id'), 'system', '시스템', '시스템').run()

  const headers = new Headers()
  headers.set('Content-Type', (fileRow.mime_type as string) || 'application/octet-stream')
  headers.set('Content-Disposition', `inline; filename="${encodeURIComponent(fileRow.original_file_name as string)}"`)
  return new Response(obj.body, { headers })
})

app.delete('/api/documents/:id/files/:fileId', async (c) => {
  const { DB, DOC_BUCKET } = c.env
  const fileId = c.req.param('fileId')
  const fileRow = await DB.prepare(`SELECT * FROM document_files WHERE id = ?`).bind(fileId).first()
  if (!fileRow) return fail(c, 'File not found', 404)

  await DOC_BUCKET.delete(fileRow.r2_object_key as string).catch(() => {})
  await DB.prepare(
    `UPDATE document_files SET use_yn='N', deleted_at=CURRENT_TIMESTAMP WHERE id=?`
  ).bind(fileId).run()

  return ok(c, { id: fileId })
})

// ---- SAP Document Links ----
app.get('/api/sap-links', async (c) => {
  const { DB } = c.env
  const { results } = await DB.prepare(
    `SELECT sl.*, d.title, d.storage_id, d.file_no FROM sap_document_links sl
     JOIN documents d ON d.id = sl.document_id ORDER BY sl.id DESC`
  ).all()
  return ok(c, results)
})

app.post('/api/documents/:id/sap-link', async (c) => {
  const { DB } = c.env
  const docId = c.req.param('id')
  const b = await c.req.json()
  if (!b.sap_table || !b.sap_doc_num) return fail(c, 'sap_table, sap_doc_num required')

  const result = await DB.prepare(
    `INSERT INTO sap_document_links (document_id, sap_table, sap_doc_entry, sap_doc_num, sap_card_code, link_status, linked_by, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    docId, b.sap_table, b.sap_doc_entry || null, b.sap_doc_num, b.sap_card_code || null,
    b.link_status || 'linked', b.linked_by || 'system', b.notes || null
  ).run()

  return ok(c, { id: result.meta.last_row_id })
})

// ---- SAP B1 lookup (Service Layer 연동 시뮬레이션) ----
// 참고: scm_solution의 ServiceLayerClient/ServiceLayerClientStub 패턴.
// 실제 SAP B1 Service Layer 접속정보가 설정되면 fetch()로 교체 가능한 지점.
app.get('/api/sap/lookup', async (c) => {
  const table = c.req.query('table')
  const docNum = c.req.query('doc_num')
  if (!table || !docNum) return fail(c, 'table, doc_num required')

  // [SAP 연동 지점] 운영 환경에서는 아래를 SAP B1 Service Layer 호출로 교체:
  //   POST {SL_URL}/Login  -> Cookie
  //   GET  {SL_URL}/{table}?$filter=DocNum eq {docNum}  (Cookie 헤더 포함)
  const mockDb: Record<string, any> = {
    OPCH: { DocEntry: docNum, DocNum: docNum, CardCode: 'V10001', CardName: '삼성전자(주)', DocDate: '2026-07-05', DocTotal: 12500000 },
    OINV: { DocEntry: docNum, DocNum: docNum, CardCode: 'C20001', CardName: '대한전자', DocDate: '2026-07-13', DocTotal: 8300000 },
    OPOR: { DocEntry: docNum, DocNum: docNum, CardCode: 'V10002', CardName: '(주)한국물류', DocDate: '2026-07-10', DocTotal: 4560000 },
    ORDR: { DocEntry: docNum, DocNum: docNum, CardCode: 'C20001', CardName: '대한전자', DocDate: '2026-07-08', DocTotal: 15200000 },
    OPDN: { DocEntry: docNum, DocNum: docNum, CardCode: 'V10002', CardName: '(주)한국물류', DocDate: '2026-07-12', DocTotal: 4560000 }
  }
  const data = mockDb[table]
  if (!data) return fail(c, `SAP 연동 미설정 상태(mock) - 알 수 없는 테이블: ${table}`, 404)
  return ok(c, { source: 'mock (SAP Service Layer 연동 대기)', ...data })
})

// ---- Certifications ----
app.get('/api/certifications', async (c) => {
  const { DB } = c.env
  const partner = c.req.query('business_partner_code')
  let sql = `
    SELECT ct.*, d.title as document_title, d.storage_id
    FROM certifications ct JOIN documents d ON d.id = ct.document_id
  `
  const binds: any[] = []
  if (partner) { sql += ` WHERE ct.business_partner_code = ?`; binds.push(partner) }
  sql += ` ORDER BY ct.expiry_date IS NULL, ct.expiry_date ASC`
  const stmt = binds.length ? DB.prepare(sql).bind(...binds) : DB.prepare(sql)
  const { results } = await stmt.all()
  return ok(c, results)
})

app.post('/api/certifications', async (c) => {
  const { DB } = c.env
  const b = await c.req.json()
  if (!b.document_id || !b.cert_type || !b.business_partner_code) return fail(c, 'document_id, cert_type, business_partner_code required')
  const result = await DB.prepare(
    `INSERT INTO certifications (document_id, cert_type, business_partner_code, business_partner_name, issue_date, expiry_date, remark, status, submitted_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?)`
  ).bind(
    b.document_id, b.cert_type, b.business_partner_code, b.business_partner_name || null,
    b.issue_date || null, b.expiry_date || null, b.remark || null, b.submitted_by || 'system'
  ).run()
  return ok(c, { id: result.meta.last_row_id })
})

app.delete('/api/certifications/:id', async (c) => {
  const { DB } = c.env
  const id = c.req.param('id')
  await DB.prepare(`UPDATE certifications SET use_yn='N', status='revoked' WHERE id=?`).bind(id).run()
  return ok(c, { id })
})

// ---- Document management dashboard summary ----
app.get('/api/documents-dashboard', async (c) => {
  const { DB } = c.env

  const totalDocs = await DB.prepare(`SELECT COUNT(*) as cnt FROM documents WHERE use_yn='Y'`).first()
  const totalFiles = await DB.prepare(`SELECT COUNT(*) as cnt, COALESCE(SUM(file_size),0) as totalSize FROM document_files WHERE use_yn='Y'`).first()

  const byCategory = await DB.prepare(
    `SELECT dc.category_name, dc.category_code, COUNT(d.id) as cnt
     FROM document_categories dc
     LEFT JOIN documents d ON d.category_code = dc.category_code AND d.use_yn='Y'
     GROUP BY dc.category_code ORDER BY dc.sort_order`
  ).all()

  const sapLinkStats = await DB.prepare(
    `SELECT
        SUM(CASE WHEN link_status='linked' THEN 1 ELSE 0 END) as linked,
        SUM(CASE WHEN link_status='missing' THEN 1 ELSE 0 END) as missing,
        SUM(CASE WHEN link_status='pending_review' THEN 1 ELSE 0 END) as pending,
        COUNT(*) as total
     FROM sap_document_links`
  ).first()

  const missingList = await DB.prepare(
    `SELECT sl.*, d.title, d.storage_id FROM sap_document_links sl
     JOIN documents d ON d.id = sl.document_id WHERE sl.link_status = 'missing'`
  ).all()

  const expiringCerts = await DB.prepare(
    `SELECT * FROM certifications WHERE use_yn='Y' AND expiry_date IS NOT NULL
     AND date(expiry_date) <= date('now', '+90 day') ORDER BY expiry_date ASC`
  ).all()

  const certStats = await DB.prepare(
    `SELECT COUNT(*) as total, SUM(CASE WHEN status='active' THEN 1 ELSE 0 END) as active FROM certifications WHERE use_yn='Y'`
  ).first()

  return ok(c, {
    total_documents: totalDocs?.cnt || 0,
    total_files: totalFiles?.cnt || 0,
    total_size_bytes: totalFiles?.totalSize || 0,
    by_category: byCategory.results,
    sap_link_stats: sapLinkStats,
    missing_documents: missingList.results,
    expiring_certifications: expiringCerts.results,
    cert_stats: certStats
  })
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
