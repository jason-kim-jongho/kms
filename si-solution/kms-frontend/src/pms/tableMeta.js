// ============================================================
// PMS (Notion/Airtable 스타일 다중 뷰 프로젝트관리) 테이블 메타 레지스트리
// 각 테이블의 필드 스키마(타입/옵션/필수여부)를 선언적으로 정의하여
// TableView/KanbanView/GalleryView/CalendarView/ListView 및
// 동적 레코드 생성/편집 폼에서 공통으로 사용한다.
// ============================================================
import {
  projectApi, milestoneApi, taskApi, devModuleApi,
  mappingApi, aclApi, riskApi, caseStudyApi
} from '../api/services'

// 필드 타입: text | textarea | select | date | integer | boolean | linked_record | timestamp

const PROJECT_STATUS = [
  { value: 'planning', label: 'planning', color: '#94a3b8' },
  { value: 'active', label: 'active', color: '#3b82f6' },
  { value: 'on_hold', label: 'on_hold', color: '#f59e0b' },
  { value: 'completed', label: 'completed', color: '#22c55e' },
  { value: 'cancelled', label: 'cancelled', color: '#ef4444' }
]

const PRIORITY_OPTS = [
  { value: 'p0', label: 'p0', color: '#ef4444' },
  { value: 'p1', label: 'p1', color: '#f97316' },
  { value: 'p2', label: 'p2', color: '#eab308' },
  { value: 'p3', label: 'p3', color: '#94a3b8' }
]

const MILESTONE_STATUS = [
  { value: 'upcoming', label: 'upcoming', color: '#94a3b8' },
  { value: 'in_progress', label: 'in_progress', color: '#3b82f6' },
  { value: 'completed', label: 'completed', color: '#22c55e' },
  { value: 'delayed', label: 'delayed', color: '#ef4444' }
]

const TASK_STATUS = [
  { value: 'pending', label: 'pending', color: '#94a3b8' },
  { value: 'in_progress', label: 'in_progress', color: '#3b82f6' },
  { value: 'completed', label: 'completed', color: '#22c55e' },
  { value: 'blocked', label: 'blocked', color: '#ef4444' }
]

const TASK_PRIORITY = [
  { value: 'low', label: 'low', color: '#94a3b8' },
  { value: 'medium', label: 'medium', color: '#eab308' },
  { value: 'high', label: 'high', color: '#f97316' },
  { value: 'critical', label: 'critical', color: '#ef4444' }
]

const MODULE_STATUS = [
  { value: 'backlog', label: 'backlog', color: '#94a3b8' },
  { value: 'design', label: 'design', color: '#818cf8' },
  { value: 'in_progress', label: 'in_progress', color: '#3b82f6' },
  { value: 'testing', label: 'testing', color: '#eab308' },
  { value: 'done', label: 'done', color: '#22c55e' },
  { value: 'at_risk', label: 'at_risk', color: '#ef4444' }
]

const RISK_LEVEL_OPTS = [
  { value: 'low', label: 'low', color: '#94a3b8' },
  { value: 'medium', label: 'medium', color: '#eab308' },
  { value: 'high', label: 'high', color: '#f97316' },
  { value: 'critical', label: 'critical', color: '#ef4444' }
]

const MAPPING_STATUS = [
  { value: 'draft', label: 'draft', color: '#94a3b8' },
  { value: 'reviewed', label: 'reviewed', color: '#eab308' },
  { value: 'approved', label: 'approved', color: '#818cf8' },
  { value: 'implemented', label: 'implemented', color: '#22c55e' }
]

const ACL_STATUS = [
  { value: 'draft', label: 'draft', color: '#94a3b8' },
  { value: 'reviewed', label: 'reviewed', color: '#eab308' },
  { value: 'approved', label: 'approved', color: '#818cf8' },
  { value: 'applied', label: 'applied', color: '#22c55e' }
]

const RISK_CATEGORY = ['technical', 'schedule', 'resource', 'vendor', 'quality', 'security']
const RISK_STATUS = [
  { value: 'identified', label: 'identified', color: '#94a3b8' },
  { value: 'monitoring', label: 'monitoring', color: '#3b82f6' },
  { value: 'mitigating', label: 'mitigating', color: '#eab308' },
  { value: 'resolved', label: 'resolved', color: '#22c55e' }
]
const RISK_PROBABILITY = ['low', 'medium', 'high']

const CASE_CATEGORY = ['integration', 'governance', 'automation', 'ux', 'ai']
const CASE_STATUS = [
  { value: 'draft', label: 'draft', color: '#94a3b8' },
  { value: 'published', label: 'published', color: '#22c55e' },
  { value: 'archived', label: 'archived', color: '#64748b' }
]

function toOptions(arr) {
  return arr.map(v => ({ value: v, label: v }))
}

export const TABLES = {
  projects: {
    key: 'projects',
    label: 'projects',
    icon: 'fa-diagram-project',
    api: projectApi,
    titleField: 'name',
    subtitleField: 'description',
    statusField: 'status',
    statusOptions: PROJECT_STATUS,
    dateField: 'targetDate',
    dateRangeStart: 'startDate',
    fields: [
      { key: 'name', label: 'name', type: 'text', required: true },
      { key: 'description', label: 'description', type: 'textarea' },
      { key: 'status', label: 'status', type: 'select', options: PROJECT_STATUS },
      { key: 'priority', label: 'priority', type: 'select', options: PRIORITY_OPTS },
      { key: 'owner', label: 'owner', type: 'text' },
      { key: 'startDate', label: 'start_date', type: 'date' },
      { key: 'targetDate', label: 'target_date', type: 'date' },
      { key: 'progressPct', label: 'progress_pct', type: 'integer' },
      { key: 'aiStatusSummary', label: 'ai_status_summary', type: 'textarea' },
      { key: 'createdAt', label: 'created_at', type: 'timestamp', readOnly: true }
    ]
  },
  milestones: {
    key: 'milestones',
    label: 'milestones',
    icon: 'fa-flag-checkered',
    api: milestoneApi,
    titleField: 'name',
    subtitleField: 'description',
    statusField: 'status',
    statusOptions: MILESTONE_STATUS,
    dateField: 'targetDate',
    dateRangeStart: 'startDate',
    fields: [
      { key: 'name', label: 'name', type: 'text', required: true },
      { key: 'projectId', label: 'project_id', type: 'linked_record', linkedTable: 'projects', required: true },
      { key: 'monthNo', label: 'month_no', type: 'integer' },
      { key: 'description', label: 'description', type: 'textarea' },
      { key: 'startDate', label: 'start_date', type: 'date' },
      { key: 'targetDate', label: 'target_date', type: 'date' },
      { key: 'status', label: 'status', type: 'select', options: MILESTONE_STATUS },
      { key: 'progress', label: 'progress', type: 'integer' },
      { key: 'notes', label: 'notes', type: 'textarea' },
      { key: 'createdAt', label: 'created_at', type: 'timestamp', readOnly: true }
    ]
  },
  tasks: {
    key: 'tasks',
    label: 'tasks',
    icon: 'fa-list-check',
    api: taskApi,
    titleField: 'title',
    subtitleField: 'description',
    statusField: 'status',
    statusOptions: TASK_STATUS,
    dateField: 'dueDate',
    dateRangeStart: 'startDate',
    fields: [
      { key: 'title', label: 'title', type: 'text', required: true },
      { key: 'milestoneId', label: 'milestone_id', type: 'linked_record', linkedTable: 'milestones', required: true },
      { key: 'description', label: 'description', type: 'textarea' },
      { key: 'owner', label: 'owner', type: 'text' },
      { key: 'status', label: 'status', type: 'select', options: TASK_STATUS },
      { key: 'priority', label: 'priority', type: 'select', options: TASK_PRIORITY },
      { key: 'startDate', label: 'start_date', type: 'date' },
      { key: 'dueDate', label: 'due_date', type: 'date' },
      { key: 'progress', label: 'progress', type: 'integer' },
      { key: 'createdAt', label: 'created_at', type: 'timestamp', readOnly: true }
    ]
  },
  dev_modules: {
    key: 'dev_modules',
    label: 'dev_modules',
    icon: 'fa-cubes',
    api: devModuleApi,
    titleField: 'name',
    subtitleField: 'description',
    statusField: 'status',
    statusOptions: MODULE_STATUS,
    fields: [
      { key: 'name', label: 'name', type: 'text', required: true },
      { key: 'projectId', label: 'project_id', type: 'linked_record', linkedTable: 'projects', required: true },
      { key: 'moduleKey', label: 'module_key', type: 'text' },
      { key: 'description', label: 'description', type: 'textarea' },
      { key: 'category', label: 'category', type: 'select', options: toOptions(['integration', 'validation', 'ui', 'ai']) },
      { key: 'status', label: 'status', type: 'select', options: MODULE_STATUS },
      { key: 'riskLevel', label: 'risk_level', type: 'select', options: RISK_LEVEL_OPTS },
      { key: 'riskNote', label: 'risk_note', type: 'textarea' },
      { key: 'progress', label: 'progress', type: 'integer' },
      { key: 'owner', label: 'owner', type: 'text' },
      { key: 'plannedMonth', label: 'planned_month', type: 'integer' },
      { key: 'targetMilestoneId', label: 'target_milestone_id', type: 'linked_record', linkedTable: 'milestones' },
      { key: 'createdAt', label: 'created_at', type: 'timestamp', readOnly: true }
    ]
  },
  sap_teedy_mapping: {
    key: 'sap_teedy_mapping',
    label: 'sap_teedy_mapping',
    icon: 'fa-link',
    api: mappingApi,
    titleField: 'teedyMetadataName',
    subtitleField: 'sapFieldDesc',
    statusField: 'mappingStatus',
    statusOptions: MAPPING_STATUS,
    fields: [
      { key: 'projectId', label: 'project_id', type: 'linked_record', linkedTable: 'projects', required: true },
      { key: 'sapTable', label: 'sap_table', type: 'text', required: true },
      { key: 'sapField', label: 'sap_field', type: 'text', required: true },
      { key: 'sapFieldDesc', label: 'sap_field_desc', type: 'text' },
      { key: 'teedyMetadataName', label: 'teedy_metadata_name', type: 'text', required: true },
      { key: 'teedyMetadataType', label: 'teedy_metadata_type', type: 'select', options: toOptions(['STRING', 'NUMBER', 'DATE', 'ENUM']) },
      { key: 'docType', label: 'doc_type', type: 'text' },
      { key: 'uncPathPattern', label: 'unc_path_pattern', type: 'text' },
      { key: 'mappingStatus', label: 'mapping_status', type: 'select', options: MAPPING_STATUS },
      { key: 'isRequired', label: 'is_required', type: 'boolean' },
      { key: 'notes', label: 'notes', type: 'textarea' },
      { key: 'createdAt', label: 'created_at', type: 'timestamp', readOnly: true }
    ]
  },
  acl_design: {
    key: 'acl_design',
    label: 'acl_design',
    icon: 'fa-shield-halved',
    api: aclApi,
    titleField: 'groupName',
    subtitleField: 'docType',
    statusField: 'status',
    statusOptions: ACL_STATUS,
    fields: [
      { key: 'projectId', label: 'project_id', type: 'linked_record', linkedTable: 'projects', required: true },
      { key: 'groupName', label: 'group_name', type: 'text', required: true },
      { key: 'roleName', label: 'role_name', type: 'text', required: true },
      { key: 'docType', label: 'doc_type', type: 'text', required: true },
      { key: 'permissionRead', label: 'permission_read', type: 'boolean' },
      { key: 'permissionWrite', label: 'permission_write', type: 'boolean' },
      { key: 'permissionDelete', label: 'permission_delete', type: 'boolean' },
      { key: 'permissionShare', label: 'permission_share', type: 'boolean' },
      { key: 'scopeNote', label: 'scope_note', type: 'text' },
      { key: 'status', label: 'status', type: 'select', options: ACL_STATUS },
      { key: 'createdAt', label: 'created_at', type: 'timestamp', readOnly: true }
    ]
  },
  risks: {
    key: 'risks',
    label: 'risks',
    icon: 'fa-triangle-exclamation',
    api: riskApi,
    titleField: 'name',
    subtitleField: 'description',
    statusField: 'status',
    statusOptions: RISK_STATUS,
    dateField: 'dueDate',
    fields: [
      { key: 'name', label: 'name', type: 'text', required: true },
      { key: 'projectId', label: 'project_id', type: 'linked_record', linkedTable: 'projects' },
      { key: 'description', label: 'description', type: 'textarea' },
      { key: 'category', label: 'category', type: 'select', options: toOptions(RISK_CATEGORY) },
      { key: 'severity', label: 'severity', type: 'select', options: RISK_LEVEL_OPTS },
      { key: 'probability', label: 'probability', type: 'select', options: toOptions(RISK_PROBABILITY) },
      { key: 'status', label: 'status', type: 'select', options: RISK_STATUS },
      { key: 'owner', label: 'owner', type: 'text' },
      { key: 'dueDate', label: 'due_date', type: 'date' },
      { key: 'mitigation', label: 'mitigation', type: 'textarea' },
      { key: 'createdAt', label: 'created_at', type: 'timestamp', readOnly: true }
    ]
  },
  case_studies: {
    key: 'case_studies',
    label: 'case_studies',
    icon: 'fa-book-open',
    api: caseStudyApi,
    titleField: 'title',
    subtitleField: 'summary',
    statusField: 'status',
    statusOptions: CASE_STATUS,
    dateField: 'publishedDate',
    fields: [
      { key: 'title', label: 'title', type: 'text', required: true },
      { key: 'projectId', label: 'project_id', type: 'linked_record', linkedTable: 'projects' },
      { key: 'category', label: 'category', type: 'select', options: toOptions(CASE_CATEGORY) },
      { key: 'summary', label: 'summary', type: 'textarea' },
      { key: 'outcome', label: 'outcome', type: 'textarea' },
      { key: 'status', label: 'status', type: 'select', options: CASE_STATUS },
      { key: 'owner', label: 'owner', type: 'text' },
      { key: 'publishedDate', label: 'published_date', type: 'date' },
      { key: 'createdAt', label: 'created_at', type: 'timestamp', readOnly: true }
    ]
  }
}

export const TABLE_ORDER = [
  'projects', 'milestones', 'tasks', 'dev_modules',
  'sap_teedy_mapping', 'acl_design', 'risks', 'case_studies'
]

export function getTableMeta(key) {
  return TABLES[key]
}

export function selectFields(meta) {
  return meta.fields.filter(f => f.type === 'select')
}

export function emptyRecord(meta) {
  const obj = {}
  for (const f of meta.fields) {
    if (f.type === 'boolean') obj[f.key] = false
    else if (f.type === 'integer') obj[f.key] = 0
    else obj[f.key] = null
  }
  return obj
}
