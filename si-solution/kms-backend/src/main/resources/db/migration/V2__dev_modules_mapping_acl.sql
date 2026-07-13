-- ============================================================
-- V2__dev_modules_mapping_acl.sql
-- 신규 테이블: dev_modules / sap_teedy_mapping / acl_design (PostgreSQL)
-- ============================================================

-- 1) 개발 모듈 백로그 (4개 모듈)
CREATE TABLE dev_modules (
    id                  BIGSERIAL PRIMARY KEY,
    project_id          BIGINT NOT NULL REFERENCES projects(id),
    module_key          VARCHAR(100) NOT NULL UNIQUE, -- sap_teedy_bridge | missing_detection_engine | easy_upload_ui | ai_preprocessing
    name                VARCHAR(200) NOT NULL,
    description         TEXT,
    category            VARCHAR(50),          -- integration | validation | ui | ai
    status              VARCHAR(20) NOT NULL DEFAULT 'backlog', -- backlog | design | in_progress | testing | done | at_risk
    risk_level          VARCHAR(20) NOT NULL DEFAULT 'low',      -- low | medium | high | critical
    risk_note           TEXT,
    progress            INTEGER NOT NULL DEFAULT 0,
    owner               VARCHAR(100),
    planned_month        INTEGER,
    target_milestone_id BIGINT REFERENCES milestones(id),
    created_at          TIMESTAMP NOT NULL DEFAULT now(),
    updated_at          TIMESTAMP NOT NULL DEFAULT now()
);

-- 2) SAP B1 <-> 문서관리 커스텀 메타데이터 매핑 정의서
CREATE TABLE sap_teedy_mapping (
    id                    BIGSERIAL PRIMARY KEY,
    project_id            BIGINT NOT NULL REFERENCES projects(id),
    sap_table             VARCHAR(50) NOT NULL,   -- OPCH, OINV, OPOR ...
    sap_field             VARCHAR(100) NOT NULL,  -- DocNum, CardCode ...
    sap_field_desc        VARCHAR(300),
    teedy_metadata_name   VARCHAR(100) NOT NULL,  -- File No.
    teedy_metadata_type   VARCHAR(20) NOT NULL DEFAULT 'STRING', -- STRING | NUMBER | DATE | ENUM
    doc_type              VARCHAR(100),
    unc_path_pattern      VARCHAR(500),
    mapping_status        VARCHAR(20) NOT NULL DEFAULT 'draft',  -- draft | reviewed | approved | implemented
    is_required           BOOLEAN NOT NULL DEFAULT TRUE,
    notes                 TEXT,
    created_at            TIMESTAMP NOT NULL DEFAULT now(),
    updated_at            TIMESTAMP NOT NULL DEFAULT now()
);

-- 3) 사용자/그룹/역할별 문서유형 접근권한(ACL) 설계
CREATE TABLE acl_design (
    id                  BIGSERIAL PRIMARY KEY,
    project_id          BIGINT NOT NULL REFERENCES projects(id),
    group_name          VARCHAR(100) NOT NULL,
    role_name           VARCHAR(50) NOT NULL,
    doc_type            VARCHAR(100) NOT NULL,
    permission_read     BOOLEAN NOT NULL DEFAULT FALSE,
    permission_write    BOOLEAN NOT NULL DEFAULT FALSE,
    permission_delete   BOOLEAN NOT NULL DEFAULT FALSE,
    permission_share    BOOLEAN NOT NULL DEFAULT FALSE,
    scope_note          VARCHAR(300),
    status              VARCHAR(20) NOT NULL DEFAULT 'draft', -- draft | reviewed | approved | applied
    created_at          TIMESTAMP NOT NULL DEFAULT now(),
    updated_at          TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_dev_modules_project ON dev_modules(project_id);
CREATE INDEX idx_dev_modules_status ON dev_modules(status);
CREATE INDEX idx_mapping_project ON sap_teedy_mapping(project_id);
CREATE INDEX idx_mapping_status ON sap_teedy_mapping(mapping_status);
CREATE INDEX idx_acl_project ON acl_design(project_id);
CREATE INDEX idx_acl_doctype ON acl_design(doc_type);
