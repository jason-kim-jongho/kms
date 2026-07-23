-- ============================================================
-- V8__auth_and_page_permissions.sql
-- 사용자 인증(로그인) + 페이지별 사용자ID 단위 접근권한(ACL) 스키마
-- ============================================================

-- 사용자 계정
CREATE TABLE users (
    id             BIGSERIAL PRIMARY KEY,
    username       VARCHAR(50) NOT NULL UNIQUE,
    password_hash  VARCHAR(200) NOT NULL,
    display_name   VARCHAR(100) NOT NULL,
    email          VARCHAR(150),
    role           VARCHAR(20) NOT NULL DEFAULT 'USER', -- ADMIN | USER  (ADMIN은 전체 페이지 접근 가능)
    is_active      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMP NOT NULL DEFAULT now(),
    updated_at     TIMESTAMP NOT NULL DEFAULT now()
);

-- 로그인 세션(토큰) - 별도 JWT 라이브러리 없이 서버 발급 opaque 토큰을 DB에 저장하여 인증 필터에서 조회
CREATE TABLE user_sessions (
    id             BIGSERIAL PRIMARY KEY,
    token          VARCHAR(200) NOT NULL UNIQUE,
    username       VARCHAR(50) NOT NULL REFERENCES users(username) ON DELETE CASCADE,
    expires_at     TIMESTAMP NOT NULL,
    created_at     TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_sessions_token ON user_sessions(token);

-- 페이지별 사용자ID 단위 접근권한(ACL)
-- page_key 는 프론트엔드 라우트 최상위 구획과 매칭되는 식별자 (dashboard, pms, roadmap, dev-modules, mapping, acl, documents, sap-lookup, certifications ...)
-- USER 역할(role='USER') 사용자는 이 테이블에 allowed=TRUE 행이 있는 페이지만 접근 가능(화이트리스트 방식).
-- ADMIN 역할 사용자는 이 테이블과 무관하게 항상 모든 페이지 접근 가능.
CREATE TABLE page_permissions (
    id             BIGSERIAL PRIMARY KEY,
    username       VARCHAR(50) NOT NULL REFERENCES users(username) ON DELETE CASCADE,
    page_key       VARCHAR(50) NOT NULL,
    allowed        BOOLEAN NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMP NOT NULL DEFAULT now(),
    updated_at     TIMESTAMP NOT NULL DEFAULT now(),
    UNIQUE(username, page_key)
);

CREATE INDEX idx_page_permissions_username ON page_permissions(username);

-- ── 초기 계정 시드 ──────────────────────────────────────────
-- admin / admin123!   (역할: ADMIN, 전체 페이지 접근)
-- manager / manager123! (역할: USER, 대시보드/PMS/로드맵/개발모듈/매핑/문서관리 접근)
-- viewer / viewer123!   (역할: USER, 대시보드/PMS/문서관리만 접근)
INSERT INTO users (username, password_hash, display_name, email, role, is_active) VALUES
    ('admin',   '$2b$10$9ZXbqfKKBtu3gTz0/MNWEurqM2OI6i.Mu5IiZHkrAZEANoiaY0VkW', '시스템 관리자', 'admin@miraejigi.local',   'ADMIN', TRUE),
    ('manager', '$2b$10$3LYvfEmopjy78jvCXdwSJeBRtv4Gbww6VNeLh/tt8mEEI5mPujmkq', 'PM 매니저',      'manager@miraejigi.local', 'USER',  TRUE),
    ('viewer',  '$2b$10$TbAHwGiaZ3AqDYGH4bCK/upikyKMPRg1WM6gpWbjgqjLcuK6LnEHm', '조회 전용 사용자', 'viewer@miraejigi.local',  'USER',  TRUE);

INSERT INTO page_permissions (username, page_key, allowed) VALUES
    ('manager', 'dashboard',      TRUE),
    ('manager', 'pms',            TRUE),
    ('manager', 'roadmap',        TRUE),
    ('manager', 'dev-modules',    TRUE),
    ('manager', 'mapping',        TRUE),
    ('manager', 'documents',      TRUE),
    ('viewer',  'dashboard',      TRUE),
    ('viewer',  'pms',            TRUE),
    ('viewer',  'documents',      TRUE);
