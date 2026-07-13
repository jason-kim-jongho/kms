-- ============================================================
-- V1__initial_schema.sql
-- SAP B1 연계 문서관리(KMS) 통합 프로젝트: 기본 로드맵 테이블 (PostgreSQL)
-- ============================================================

CREATE TABLE projects (
    id           BIGSERIAL PRIMARY KEY,
    name         VARCHAR(200) NOT NULL,
    description  TEXT,
    start_date   DATE NOT NULL,
    end_date     DATE NOT NULL,
    status       VARCHAR(20) NOT NULL DEFAULT 'in_progress', -- planned | in_progress | completed | on_hold
    created_at   TIMESTAMP NOT NULL DEFAULT now(),
    updated_at   TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE milestones (
    id           BIGSERIAL PRIMARY KEY,
    project_id   BIGINT NOT NULL REFERENCES projects(id),
    month_no     INTEGER NOT NULL,
    title        VARCHAR(300) NOT NULL,
    description  TEXT,
    start_date   DATE NOT NULL,
    end_date     DATE NOT NULL,
    status       VARCHAR(20) NOT NULL DEFAULT 'planned', -- planned | in_progress | completed | delayed
    progress     INTEGER NOT NULL DEFAULT 0,
    created_at   TIMESTAMP NOT NULL DEFAULT now(),
    updated_at   TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE tasks (
    id            BIGSERIAL PRIMARY KEY,
    milestone_id  BIGINT NOT NULL REFERENCES milestones(id),
    title         VARCHAR(300) NOT NULL,
    description   TEXT,
    owner         VARCHAR(100),
    status        VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending | in_progress | completed | blocked
    priority      VARCHAR(20) NOT NULL DEFAULT 'medium',  -- low | medium | high | critical
    start_date    DATE,
    due_date      DATE,
    progress      INTEGER NOT NULL DEFAULT 0,
    created_at    TIMESTAMP NOT NULL DEFAULT now(),
    updated_at    TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_milestones_project ON milestones(project_id);
CREATE INDEX idx_tasks_milestone ON tasks(milestone_id);
CREATE INDEX idx_tasks_status ON tasks(status);
