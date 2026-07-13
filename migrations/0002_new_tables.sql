-- ============================================================
-- 0002_new_tables.sql
-- 신규 테이블 3개: dev_modules / sap_teedy_mapping / acl_design
-- ============================================================

-- 1) 개발 모듈 백로그 (4개 모듈)
CREATE TABLE IF NOT EXISTS dev_modules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  module_key TEXT NOT NULL UNIQUE, -- sap_teedy_bridge | missing_detection_engine | easy_upload_ui | ai_preprocessing
  name TEXT NOT NULL,
  description TEXT,
  category TEXT, -- integration | validation | ui | ai
  status TEXT NOT NULL DEFAULT 'backlog', -- backlog | design | in_progress | testing | done | at_risk
  risk_level TEXT NOT NULL DEFAULT 'low', -- low | medium | high | critical
  risk_note TEXT,
  progress INTEGER NOT NULL DEFAULT 0, -- 0-100
  owner TEXT,
  planned_month INTEGER, -- 1,2,3 : 어느 개월차에 주로 작업되는지
  target_milestone_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (target_milestone_id) REFERENCES milestones(id)
);

-- 2) SAP B1 <-> Teedy 커스텀 메타데이터 매핑 정의서
CREATE TABLE IF NOT EXISTS sap_teedy_mapping (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  sap_table TEXT NOT NULL,       -- 예: OPCH, OINV, OPOR ...
  sap_field TEXT NOT NULL,       -- 예: DocNum, CardCode ...
  sap_field_desc TEXT,
  teedy_metadata_name TEXT NOT NULL, -- 예: File No.
  teedy_metadata_type TEXT NOT NULL DEFAULT 'STRING', -- STRING | NUMBER | DATE | ENUM
  doc_type TEXT,                 -- 문서유형: 세금계산서 / 발주서 / 계약서 등
  unc_path_pattern TEXT,         -- UNC 경로 매핑 패턴, 예: \\SAPFILE\Docs\{DocNum}\
  mapping_status TEXT NOT NULL DEFAULT 'draft', -- draft | reviewed | approved | implemented
  is_required INTEGER NOT NULL DEFAULT 1, -- 1 = 필수, 0 = 선택
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id)
);

-- 3) 사용자/그룹/역할별 문서유형 접근권한(ACL) 설계
CREATE TABLE IF NOT EXISTS acl_design (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  group_name TEXT NOT NULL,      -- 예: 재무팀, 구매팀, 영업팀, 경영진, 시스템관리자
  role_name TEXT NOT NULL,       -- 예: Read, Write, Admin, Manager
  doc_type TEXT NOT NULL,        -- 문서유형: 세금계산서 / 발주서 / 계약서 / 인사문서 ...
  permission_read INTEGER NOT NULL DEFAULT 0,
  permission_write INTEGER NOT NULL DEFAULT 0,
  permission_delete INTEGER NOT NULL DEFAULT 0,
  permission_share INTEGER NOT NULL DEFAULT 0,
  scope_note TEXT,               -- 예: 본인 부서 문서만 / 전체 문서
  status TEXT NOT NULL DEFAULT 'draft', -- draft | reviewed | approved | applied
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id)
);

CREATE INDEX IF NOT EXISTS idx_dev_modules_project ON dev_modules(project_id);
CREATE INDEX IF NOT EXISTS idx_dev_modules_status ON dev_modules(status);
CREATE INDEX IF NOT EXISTS idx_mapping_project ON sap_teedy_mapping(project_id);
CREATE INDEX IF NOT EXISTS idx_mapping_status ON sap_teedy_mapping(mapping_status);
CREATE INDEX IF NOT EXISTS idx_acl_project ON acl_design(project_id);
CREATE INDEX IF NOT EXISTS idx_acl_doctype ON acl_design(doc_type);
