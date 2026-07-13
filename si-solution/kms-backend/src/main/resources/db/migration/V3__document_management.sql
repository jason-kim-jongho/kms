-- ============================================================
-- V3__document_management.sql
-- 문서관리(DMS) 모듈: scm_solution(FileStorage/Certification/EDReport 패턴) 분석 기반
-- 로컬 파일시스템 스토리지 + PostgreSQL 메타데이터, SAP B1 문서(전표/협력사)와 연계
-- ============================================================

-- 1) 문서 유형(카테고리) 마스터
CREATE TABLE document_categories (
    id                  BIGSERIAL PRIMARY KEY,
    category_code       VARCHAR(50) NOT NULL UNIQUE,  -- TAX_INVOICE_AP, PURCHASE_ORDER, CONTRACT, CERT ...
    category_name       VARCHAR(100) NOT NULL,
    parent_code         VARCHAR(50),
    requires_sap_link   BOOLEAN NOT NULL DEFAULT FALSE,
    retention_years     INTEGER,
    description         TEXT,
    sort_order          INTEGER NOT NULL DEFAULT 0,
    use_yn              CHAR(1) NOT NULL DEFAULT 'Y',
    created_at          TIMESTAMP NOT NULL DEFAULT now()
);

-- 2) 문서(스토리지 그룹) — scm_solution의 storageId(8자리) 그룹 개념 계승
CREATE TABLE documents (
    id                     BIGSERIAL PRIMARY KEY,
    storage_id             VARCHAR(16) NOT NULL UNIQUE,
    title                  VARCHAR(300) NOT NULL,
    category_code          VARCHAR(50) NOT NULL REFERENCES document_categories(category_code),
    doc_type               VARCHAR(100),
    business_partner_code  VARCHAR(50),   -- SAP CardCode
    business_partner_name  VARCHAR(200),
    file_no                VARCHAR(100),  -- 커스텀 메타데이터 "File No." 대응
    unc_path_ref           VARCHAR(500),
    status                 VARCHAR(20) NOT NULL DEFAULT 'active', -- active | archived | deleted
    remark                 TEXT,
    post_user_id           VARCHAR(50),
    post_user_name         VARCHAR(100),
    post_date              TIMESTAMP NOT NULL DEFAULT now(),
    company_code           VARCHAR(20),
    use_yn                 CHAR(1) NOT NULL DEFAULT 'Y',
    deleted_at             TIMESTAMP,
    deleted_by             VARCHAR(50),
    created_at             TIMESTAMP NOT NULL DEFAULT now(),
    updated_at             TIMESTAMP NOT NULL DEFAULT now()
);

-- 3) 문서 파일 — scm_solution FileStorage(@W_KIS_STORAGE) 대응, 로컬 파일시스템 저장 경로 보관
CREATE TABLE document_files (
    id                    BIGSERIAL PRIMARY KEY,
    storage_id            VARCHAR(16) NOT NULL REFERENCES documents(storage_id),
    file_index            INTEGER NOT NULL,
    file_name             VARCHAR(300) NOT NULL,
    original_file_name    VARCHAR(300) NOT NULL,
    storage_path          VARCHAR(1000) NOT NULL, -- 로컬(NAS/서버 디스크) 저장 경로: {storage.root}/{storage_id}/{file_name}
    file_type             VARCHAR(20) NOT NULL DEFAULT 'OTHERS', -- IMAGE | VIDEO | DOCUMENT | OTHERS
    mime_type             VARCHAR(150),
    file_size             BIGINT,
    post_user_id          VARCHAR(50),
    post_user_name        VARCHAR(100),
    post_date             TIMESTAMP NOT NULL DEFAULT now(),
    use_yn                CHAR(1) NOT NULL DEFAULT 'Y',
    deleted_at            TIMESTAMP,
    deleted_by            VARCHAR(50)
);

-- 4) SAP B1 전표 연계
CREATE TABLE sap_document_links (
    id              BIGSERIAL PRIMARY KEY,
    document_id     BIGINT NOT NULL REFERENCES documents(id),
    sap_table       VARCHAR(20) NOT NULL,  -- OPCH, OINV, OPOR, ORDR, OPDN ...
    sap_doc_entry   VARCHAR(50),
    sap_doc_num     VARCHAR(50) NOT NULL,
    sap_card_code   VARCHAR(50),
    link_status     VARCHAR(20) NOT NULL DEFAULT 'linked', -- linked | missing | pending_review
    linked_by       VARCHAR(50),
    linked_at       TIMESTAMP NOT NULL DEFAULT now(),
    notes           TEXT
);

-- 5) 인증서(협력사) 관리
CREATE TABLE certifications (
    id                     BIGSERIAL PRIMARY KEY,
    document_id            BIGINT NOT NULL REFERENCES documents(id),
    cert_type               VARCHAR(100) NOT NULL,
    business_partner_code   VARCHAR(50) NOT NULL,
    business_partner_name   VARCHAR(200),
    issue_date              DATE,
    expiry_date             DATE,
    remark                  TEXT,
    status                  VARCHAR(20) NOT NULL DEFAULT 'active', -- active | expired | revoked
    submitted_by            VARCHAR(100),
    submitted_at            TIMESTAMP NOT NULL DEFAULT now(),
    use_yn                  CHAR(1) NOT NULL DEFAULT 'Y'
);

-- 6) 문서 접근 로그(감사 추적)
CREATE TABLE document_access_logs (
    id            BIGSERIAL PRIMARY KEY,
    document_id   BIGINT NOT NULL REFERENCES documents(id),
    action        VARCHAR(20) NOT NULL,  -- view | download | upload | delete | share
    actor_id      VARCHAR(50),
    actor_name    VARCHAR(100),
    actor_group   VARCHAR(100),
    ip_address    VARCHAR(50),
    action_at     TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_documents_storage ON documents(storage_id);
CREATE INDEX idx_documents_category ON documents(category_code);
CREATE INDEX idx_documents_partner ON documents(business_partner_code);
CREATE INDEX idx_documents_fileno ON documents(file_no);
CREATE INDEX idx_document_files_storage ON document_files(storage_id);
CREATE INDEX idx_sap_links_document ON sap_document_links(document_id);
CREATE INDEX idx_sap_links_docnum ON sap_document_links(sap_doc_num);
CREATE INDEX idx_certifications_document ON certifications(document_id);
CREATE INDEX idx_certifications_partner ON certifications(business_partner_code);
CREATE INDEX idx_access_logs_document ON document_access_logs(document_id);
