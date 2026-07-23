-- ============================================================================
-- 미래지기 PMS (구 KMS SI Solution) - PostgreSQL 데이터베이스 생성 스크립트
-- ============================================================================
-- 대상 버전: PostgreSQL 17
-- 생성일: 2026-07-23
-- 설명: 로그인/ACL(사용자 권한관리) + PMS(다중 뷰 프로젝트관리) + DMS(문서관리시스템)
--       전체 스키마를 순서대로(FK 의존성 고려) 생성하는 스크립트입니다.
-- 사용법:
--   1) 아래 "0. 역할/데이터베이스 생성" 섹션은 postgres 슈퍼유저 계정으로 실행
--   2) 이후 섹션(테이블 생성)은 kms_db에 접속한 상태에서 실행
--   psql -h localhost -U postgres -f create_database.sql
-- ============================================================================


-- ============================================================================
-- 0. 역할(Role) 및 데이터베이스 생성  (postgres 슈퍼유저로 실행)
-- ============================================================================
-- 이미 존재하면 에러가 나므로, 신규 서버에서 최초 1회만 실행하세요.

-- CREATE USER kms_user WITH PASSWORD 'kms_pass_2026' CREATEDB;
-- CREATE DATABASE kms_db OWNER kms_user;

-- 위 두 줄의 주석을 해제하고 실행한 뒤, 아래부터는 kms_db에 접속해서 실행하세요.
-- \c kms_db


-- ============================================================================
-- 1. 로그인 / 사용자 권한관리(ACL) 관련 테이블
-- ============================================================================

-- 1-1. 사용자 계정
CREATE TABLE public.users (
    id            BIGSERIAL PRIMARY KEY,
    username      VARCHAR(50)  NOT NULL UNIQUE,
    password_hash VARCHAR(200) NOT NULL,           -- BCrypt 해시
    display_name  VARCHAR(100) NOT NULL,
    email         VARCHAR(150),
    role          VARCHAR(20)  NOT NULL DEFAULT 'USER',   -- 'ADMIN' | 'USER'
    is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMP    NOT NULL DEFAULT now(),
    updated_at    TIMESTAMP    NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.users IS '사용자 계정. role=ADMIN은 page_permissions 무관하게 전체 접근';

-- 1-2. 로그인 세션 (opaque 토큰)
CREATE TABLE public.user_sessions (
    id          BIGSERIAL PRIMARY KEY,
    token       VARCHAR(200) NOT NULL UNIQUE,
    username    VARCHAR(50)  NOT NULL REFERENCES public.users(username) ON DELETE CASCADE,
    expires_at  TIMESTAMP    NOT NULL,             -- 발급 시각 + 12시간
    created_at  TIMESTAMP    NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.user_sessions IS 'Authorization: Bearer 토큰 저장소 (SecureRandom 32byte, Base64 URL-safe)';

CREATE INDEX idx_user_sessions_token ON public.user_sessions USING btree (token);

-- 1-3. 페이지별 사용자ID 단위 접근권한(ACL) - 화이트리스트 방식
CREATE TABLE public.page_permissions (
    id          BIGSERIAL PRIMARY KEY,
    username    VARCHAR(50) NOT NULL REFERENCES public.users(username) ON DELETE CASCADE,
    page_key    VARCHAR(50) NOT NULL,   -- dashboard/pms/roadmap/dev-modules/mapping/acl/documents/sap-lookup/certifications
    allowed     BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP   NOT NULL DEFAULT now(),
    updated_at  TIMESTAMP   NOT NULL DEFAULT now(),
    CONSTRAINT page_permissions_username_page_key_key UNIQUE (username, page_key)
);
COMMENT ON TABLE public.page_permissions IS 'USER 역할 사용자의 페이지별(page_key) 접근 허용여부. 미등록 페이지는 기본 차단';

CREATE INDEX idx_page_permissions_username ON public.page_permissions USING btree (username);


-- ============================================================================
-- 2. PMS (다중 뷰 프로젝트관리) 관련 테이블
-- ============================================================================

-- 2-1. 프로젝트
CREATE TABLE public.projects (
    id                 BIGSERIAL PRIMARY KEY,
    name               VARCHAR(200) NOT NULL,
    description        TEXT,
    start_date         DATE         NOT NULL,
    end_date           DATE         NOT NULL,
    status             VARCHAR(20)  NOT NULL DEFAULT 'in_progress',
    priority           VARCHAR(10)  NOT NULL DEFAULT 'p2',
    owner              VARCHAR(100),
    target_date        DATE,
    progress_pct       INTEGER      NOT NULL DEFAULT 0,
    ai_status_summary  TEXT,
    created_at         TIMESTAMP    NOT NULL DEFAULT now(),
    updated_at         TIMESTAMP    NOT NULL DEFAULT now()
);

-- 2-2. 마일스톤
CREATE TABLE public.milestones (
    id           BIGSERIAL PRIMARY KEY,
    project_id   BIGINT       NOT NULL REFERENCES public.projects(id),
    month_no     INTEGER      NOT NULL,
    title        VARCHAR(300) NOT NULL,
    description  TEXT,
    start_date   DATE         NOT NULL,
    end_date     DATE         NOT NULL,
    status       VARCHAR(20)  NOT NULL DEFAULT 'planned',
    progress     INTEGER      NOT NULL DEFAULT 0,
    name         VARCHAR(300),
    target_date  DATE,
    notes        TEXT,
    created_at   TIMESTAMP    NOT NULL DEFAULT now(),
    updated_at   TIMESTAMP    NOT NULL DEFAULT now()
);

CREATE INDEX idx_milestones_project ON public.milestones USING btree (project_id);

-- 2-3. 태스크
CREATE TABLE public.tasks (
    id            BIGSERIAL PRIMARY KEY,
    milestone_id  BIGINT       NOT NULL REFERENCES public.milestones(id),
    title         VARCHAR(300) NOT NULL,
    description   TEXT,
    owner         VARCHAR(100),
    status        VARCHAR(20)  NOT NULL DEFAULT 'pending',
    priority      VARCHAR(20)  NOT NULL DEFAULT 'medium',
    start_date    DATE,
    due_date      DATE,
    progress      INTEGER      NOT NULL DEFAULT 0,
    created_at    TIMESTAMP    NOT NULL DEFAULT now(),
    updated_at    TIMESTAMP    NOT NULL DEFAULT now()
);

CREATE INDEX idx_tasks_milestone ON public.tasks USING btree (milestone_id);
CREATE INDEX idx_tasks_status    ON public.tasks USING btree (status);

-- 2-4. 개발모듈 백로그
CREATE TABLE public.dev_modules (
    id                   BIGSERIAL PRIMARY KEY,
    project_id           BIGINT       NOT NULL REFERENCES public.projects(id),
    module_key           VARCHAR(100) NOT NULL UNIQUE,
    name                 VARCHAR(200) NOT NULL,
    description          TEXT,
    category             VARCHAR(50),
    status               VARCHAR(20)  NOT NULL DEFAULT 'backlog',
    risk_level           VARCHAR(20)  NOT NULL DEFAULT 'low',
    risk_note            TEXT,
    progress             INTEGER      NOT NULL DEFAULT 0,
    owner                VARCHAR(100),
    planned_month        INTEGER,
    target_milestone_id  BIGINT       REFERENCES public.milestones(id),
    created_at           TIMESTAMP    NOT NULL DEFAULT now(),
    updated_at           TIMESTAMP    NOT NULL DEFAULT now()
);

CREATE INDEX idx_dev_modules_project ON public.dev_modules USING btree (project_id);
CREATE INDEX idx_dev_modules_status  ON public.dev_modules USING btree (status);

-- 2-5. SAP B1 ↔ KMS 메타데이터 매핑
CREATE TABLE public.sap_teedy_mapping (
    id                     BIGSERIAL PRIMARY KEY,
    project_id             BIGINT       NOT NULL REFERENCES public.projects(id),
    sap_table              VARCHAR(50)  NOT NULL,
    sap_field              VARCHAR(100) NOT NULL,
    sap_field_desc         VARCHAR(300),
    teedy_metadata_name    VARCHAR(100) NOT NULL,
    teedy_metadata_type    VARCHAR(20)  NOT NULL DEFAULT 'STRING',
    doc_type               VARCHAR(100),
    unc_path_pattern       VARCHAR(500),
    mapping_status         VARCHAR(20)  NOT NULL DEFAULT 'draft',
    is_required            BOOLEAN      NOT NULL DEFAULT TRUE,
    notes                  TEXT,
    created_at             TIMESTAMP    NOT NULL DEFAULT now(),
    updated_at             TIMESTAMP    NOT NULL DEFAULT now()
);

CREATE INDEX idx_mapping_project ON public.sap_teedy_mapping USING btree (project_id);
CREATE INDEX idx_mapping_status  ON public.sap_teedy_mapping USING btree (mapping_status);

-- 2-6. 문서유형별 권한(ACL) 설계
CREATE TABLE public.acl_design (
    id                 BIGSERIAL PRIMARY KEY,
    project_id         BIGINT       NOT NULL REFERENCES public.projects(id),
    group_name         VARCHAR(100) NOT NULL,
    role_name          VARCHAR(50)  NOT NULL,
    doc_type           VARCHAR(100) NOT NULL,
    permission_read    BOOLEAN      NOT NULL DEFAULT FALSE,
    permission_write   BOOLEAN      NOT NULL DEFAULT FALSE,
    permission_delete  BOOLEAN      NOT NULL DEFAULT FALSE,
    permission_share   BOOLEAN      NOT NULL DEFAULT FALSE,
    scope_note         VARCHAR(300),
    status             VARCHAR(20)  NOT NULL DEFAULT 'draft',
    created_at         TIMESTAMP    NOT NULL DEFAULT now(),
    updated_at         TIMESTAMP    NOT NULL DEFAULT now()
);

CREATE INDEX idx_acl_project  ON public.acl_design USING btree (project_id);
CREATE INDEX idx_acl_doctype  ON public.acl_design USING btree (doc_type);

-- 2-7. 프로젝트 리스크
CREATE TABLE public.risks (
    id            BIGSERIAL PRIMARY KEY,
    project_id    BIGINT       REFERENCES public.projects(id),
    name          VARCHAR(300) NOT NULL,
    description   TEXT,
    category      VARCHAR(50)  NOT NULL DEFAULT 'technical',
    severity      VARCHAR(20)  NOT NULL DEFAULT 'medium',
    probability   VARCHAR(20)  NOT NULL DEFAULT 'medium',
    status        VARCHAR(20)  NOT NULL DEFAULT 'identified',
    owner         VARCHAR(100),
    due_date      DATE,
    mitigation    TEXT,
    created_at    TIMESTAMP    NOT NULL DEFAULT now(),
    updated_at    TIMESTAMP    NOT NULL DEFAULT now()
);

CREATE INDEX idx_risks_project   ON public.risks USING btree (project_id);
CREATE INDEX idx_risks_severity  ON public.risks USING btree (severity);
CREATE INDEX idx_risks_status    ON public.risks USING btree (status);

-- 2-8. 도입 사례 / 성과
CREATE TABLE public.case_studies (
    id              BIGSERIAL PRIMARY KEY,
    project_id      BIGINT       REFERENCES public.projects(id),
    title           VARCHAR(300) NOT NULL,
    category        VARCHAR(50),
    summary         TEXT,
    outcome         TEXT,
    status          VARCHAR(20)  NOT NULL DEFAULT 'draft',
    owner           VARCHAR(100),
    published_date  DATE,
    created_at      TIMESTAMP    NOT NULL DEFAULT now(),
    updated_at      TIMESTAMP    NOT NULL DEFAULT now()
);

CREATE INDEX idx_case_studies_project ON public.case_studies USING btree (project_id);
CREATE INDEX idx_case_studies_status  ON public.case_studies USING btree (status);


-- ============================================================================
-- 3. DMS (문서관리시스템) 관련 테이블
-- ============================================================================

-- 3-1. 문서 카테고리
CREATE TABLE public.document_categories (
    id                 BIGSERIAL PRIMARY KEY,
    category_code      VARCHAR(50)  NOT NULL UNIQUE,
    category_name      VARCHAR(100) NOT NULL,
    parent_code        VARCHAR(50),
    requires_sap_link  BOOLEAN      NOT NULL DEFAULT FALSE,
    retention_years    INTEGER,
    description        TEXT,
    sort_order         INTEGER      NOT NULL DEFAULT 0,
    use_yn             VARCHAR(1)   NOT NULL DEFAULT 'Y',
    created_at         TIMESTAMP    NOT NULL DEFAULT now()
);

-- 3-2. 문서
CREATE TABLE public.documents (
    id                       BIGSERIAL PRIMARY KEY,
    storage_id               VARCHAR(16)  NOT NULL UNIQUE,
    title                    VARCHAR(300) NOT NULL,
    category_code            VARCHAR(50)  NOT NULL REFERENCES public.document_categories(category_code),
    doc_type                 VARCHAR(100),
    business_partner_code    VARCHAR(50),
    business_partner_name    VARCHAR(200),
    file_no                  VARCHAR(100),
    unc_path_ref             VARCHAR(500),
    status                   VARCHAR(20)  NOT NULL DEFAULT 'active',
    remark                   TEXT,
    post_user_id             VARCHAR(50),
    post_user_name           VARCHAR(100),
    post_date                TIMESTAMP    NOT NULL DEFAULT now(),
    company_code             VARCHAR(20),
    use_yn                   VARCHAR(1)   NOT NULL DEFAULT 'Y',
    deleted_at               TIMESTAMP,
    deleted_by               VARCHAR(50),
    created_at               TIMESTAMP    NOT NULL DEFAULT now(),
    updated_at               TIMESTAMP    NOT NULL DEFAULT now()
);

CREATE INDEX idx_documents_category ON public.documents USING btree (category_code);
CREATE INDEX idx_documents_fileno   ON public.documents USING btree (file_no);
CREATE INDEX idx_documents_partner  ON public.documents USING btree (business_partner_code);
CREATE INDEX idx_documents_storage  ON public.documents USING btree (storage_id);

-- 3-3. 문서 첨부파일
CREATE TABLE public.document_files (
    id                    BIGSERIAL PRIMARY KEY,
    storage_id            VARCHAR(16)   NOT NULL REFERENCES public.documents(storage_id),
    file_index            INTEGER       NOT NULL,
    file_name             VARCHAR(300)  NOT NULL,
    original_file_name    VARCHAR(300)  NOT NULL,
    storage_path          VARCHAR(1000) NOT NULL,
    file_type             VARCHAR(20)   NOT NULL DEFAULT 'OTHERS',
    mime_type             VARCHAR(150),
    file_size             BIGINT,
    post_user_id          VARCHAR(50),
    post_user_name        VARCHAR(100),
    post_date             TIMESTAMP     NOT NULL DEFAULT now(),
    use_yn                VARCHAR(1)    NOT NULL DEFAULT 'Y',
    deleted_at            TIMESTAMP,
    deleted_by            VARCHAR(50)
);

CREATE INDEX idx_document_files_storage ON public.document_files USING btree (storage_id);

-- 3-4. 문서 접근 로그(감사로그)
CREATE TABLE public.document_access_logs (
    id            BIGSERIAL PRIMARY KEY,
    document_id   BIGINT      NOT NULL REFERENCES public.documents(id),
    action        VARCHAR(20) NOT NULL,
    actor_id      VARCHAR(50),
    actor_name    VARCHAR(100),
    actor_group   VARCHAR(100),
    ip_address    VARCHAR(50),
    action_at     TIMESTAMP   NOT NULL DEFAULT now()
);

CREATE INDEX idx_access_logs_document ON public.document_access_logs USING btree (document_id);

-- 3-5. SAP 전표 연계
CREATE TABLE public.sap_document_links (
    id              BIGSERIAL PRIMARY KEY,
    document_id     BIGINT      NOT NULL REFERENCES public.documents(id),
    sap_table       VARCHAR(20) NOT NULL,
    sap_doc_entry   VARCHAR(50),
    sap_doc_num     VARCHAR(50) NOT NULL,
    sap_card_code   VARCHAR(50),
    link_status     VARCHAR(20) NOT NULL DEFAULT 'linked',
    linked_by       VARCHAR(50),
    linked_at       TIMESTAMP   NOT NULL DEFAULT now(),
    notes           TEXT
);

CREATE INDEX idx_sap_links_document ON public.sap_document_links USING btree (document_id);
CREATE INDEX idx_sap_links_docnum   ON public.sap_document_links USING btree (sap_doc_num);

-- 3-6. 인증서 관리
CREATE TABLE public.certifications (
    id                       BIGSERIAL PRIMARY KEY,
    document_id              BIGINT       NOT NULL REFERENCES public.documents(id),
    cert_type                VARCHAR(100) NOT NULL,
    business_partner_code    VARCHAR(50)  NOT NULL,
    business_partner_name    VARCHAR(200),
    issue_date               DATE,
    expiry_date              DATE,
    remark                   TEXT,
    status                   VARCHAR(20)  NOT NULL DEFAULT 'active',
    submitted_by             VARCHAR(100),
    submitted_at             TIMESTAMP    NOT NULL DEFAULT now(),
    use_yn                   VARCHAR(1)   NOT NULL DEFAULT 'Y'
);

CREATE INDEX idx_certifications_document ON public.certifications USING btree (document_id);
CREATE INDEX idx_certifications_partner  ON public.certifications USING btree (business_partner_code);


-- ============================================================================
-- 4. 초기 데모 데이터 (선택 사항) - 로그인 계정
-- ============================================================================
-- password_hash는 BCrypt(cost=10)로 해시된 값입니다. (Spring Security BCryptPasswordEncoder 호환)
--   admin   / admin123
--   manager / manager123
--   viewer  / viewer123

INSERT INTO public.users (username, password_hash, display_name, email, role, is_active) VALUES
    ('admin',   '$2b$10$SikMpDvk37/JtxNQD1ltIOajvNsMpjM0ekOVqKRpDJtfzFuN9M8c6', '시스템관리자', 'admin@miraejigi.local',   'ADMIN', TRUE),
    ('manager', '$2b$10$S5m8UABlekIf2vPfhnGqWeHBLskB/mJ97QhZAFWGgwxzs2Oy0MUQe', 'PM 매니저',   'manager@miraejigi.local', 'USER',  TRUE),
    ('viewer',  '$2b$10$JImb1T9TavgtzVDMo/JtAex96.bNYhHRuVKLWdiUh6oOrntgX0MCS', '뷰어',        'viewer@miraejigi.local',  'USER',  TRUE);

-- manager / viewer 초기 페이지 접근권한(화이트리스트)
INSERT INTO public.page_permissions (username, page_key, allowed) VALUES
    ('manager', 'dashboard',      TRUE),
    ('manager', 'pms',            TRUE),
    ('manager', 'roadmap',        TRUE),
    ('manager', 'dev-modules',    TRUE),
    ('manager', 'mapping',        TRUE),
    ('manager', 'documents',      TRUE),
    ('viewer',  'dashboard',      TRUE),
    ('viewer',  'pms',            TRUE),
    ('viewer',  'documents',      TRUE);

-- ⚠️ 위 3개 계정은 데모/테스트 용도입니다. 운영 배포 전에는 반드시
--    비밀번호를 변경하거나 계정을 삭제하세요.
--    새 해시 생성 예) Python: bcrypt.hashpw(b"새비밀번호", bcrypt.gensalt(rounds=10))

-- ============================================================================
-- 스크립트 종료
-- ============================================================================
