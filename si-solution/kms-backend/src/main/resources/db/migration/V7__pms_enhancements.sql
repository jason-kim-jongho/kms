-- ============================================================
-- V7__pms_enhancements.sql
-- Notion/Airtable 스타일 다중 뷰 PMS(프로젝트 관리 시스템) 확장
-- 1) projects / milestones 필드 보강
-- 2) risks / case_studies 신규 테이블 + 시드 데이터
-- ============================================================

-- 1) projects 필드 보강 --------------------------------------
ALTER TABLE projects ADD COLUMN priority VARCHAR(10) NOT NULL DEFAULT 'p2';          -- p0 | p1 | p2 | p3
ALTER TABLE projects ADD COLUMN owner VARCHAR(100);
ALTER TABLE projects ADD COLUMN target_date DATE;
ALTER TABLE projects ADD COLUMN progress_pct INTEGER NOT NULL DEFAULT 0;
ALTER TABLE projects ADD COLUMN ai_status_summary TEXT;

UPDATE projects SET
    status = 'active',
    priority = 'p0',
    owner = '홍길동(PM)',
    target_date = end_date,
    progress_pct = 25,
    ai_status_summary = '1개월차 서버 배포/경로 매핑 진행 중. REST API 연동 테스트 착수 예정.'
WHERE id = 1;

-- 2) milestones 필드 보강 --------------------------------------
ALTER TABLE milestones ADD COLUMN name VARCHAR(300);
ALTER TABLE milestones ADD COLUMN target_date DATE;
ALTER TABLE milestones ADD COLUMN notes TEXT;

UPDATE milestones SET
    name = COALESCE(name, title),
    target_date = COALESCE(target_date, end_date);

UPDATE milestones SET name = '[M1] Teedy 서버 배포 & SAP B1 연동 기반 구축', notes = 'Docker 기반 배포, HTTPS 인증서 적용' WHERE id = 1;
UPDATE milestones SET name = '[M2] SAP-Teedy 브리지 & 커스텀 메타데이터 구현', notes = 'SAP B1과 Teedy를 연결하는 브리지 모듈 개발' WHERE id = 2;
UPDATE milestones SET name = '[M3] 누락 점검 파이프라인 & 실데이터 검증', notes = '누락 문서 점검 파이프라인 배포, 실데이터로 파일럿 검증' WHERE id = 3;

-- 3) risks (위험 관리) 테이블 -----------------------------------
CREATE TABLE risks (
    id           BIGSERIAL PRIMARY KEY,
    project_id   BIGINT REFERENCES projects(id),
    name         VARCHAR(300) NOT NULL,
    description  TEXT,
    category     VARCHAR(50)  NOT NULL DEFAULT 'technical', -- technical | schedule | resource | vendor | quality | security
    severity     VARCHAR(20)  NOT NULL DEFAULT 'medium',    -- low | medium | high | critical
    probability  VARCHAR(20)  NOT NULL DEFAULT 'medium',    -- low | medium | high
    status       VARCHAR(20)  NOT NULL DEFAULT 'identified',-- identified | monitoring | mitigating | resolved
    owner        VARCHAR(100),
    due_date     DATE,
    mitigation   TEXT,
    created_at   TIMESTAMP NOT NULL DEFAULT now(),
    updated_at   TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_risks_project ON risks(project_id);
CREATE INDEX idx_risks_status ON risks(status);
CREATE INDEX idx_risks_severity ON risks(severity);

INSERT INTO risks (project_id, name, description, category, severity, probability, status, owner, due_date, mitigation) VALUES
(1, 'SAP B1 DI API 이벤트 감지 성능 저하', '대량 전표 발생 시 이벤트 감지 지연으로 실시간 연동이 어려울 수 있음', 'technical', 'high', 'medium', 'monitoring', '이철수(개발)', '2026-08-10', '배치+이벤트 하이브리드 방식 검토, 부하 테스트 선행'),
(1, 'UNC 경로 표준화 지연', '부서별 UNC 경로 명명 규칙이 상이하여 매핑표 확정이 늦어질 위험', 'schedule', 'medium', 'medium', 'identified', '김영희(SAP운영)', '2026-07-25', '부서별 인터뷰 조기 착수, 표준 명명 규칙 템플릿 제공'),
(1, '문서유형별 필수/선택 기준 미확정', '누락 탐지 엔진의 판단 기준(필수 문서유형)이 아직 합의되지 않음', 'resource', 'high', 'high', 'mitigating', '정수아(데이터)', '2026-08-20', '부서별 워크숍을 통해 문서유형 우선순위 합의'),
(1, 'OCR/AI 전처리 기술 검증 지연', '비정형 스캔 문서의 인식률이 목표치에 미달할 가능성', 'technical', 'critical', 'medium', 'identified', '정수아(데이터)', '2026-09-05', 'PoC 결과에 따라 4개월차 이후로 범위 조정 검토'),
(1, '현업 사용자 교육 참여율 저조', '실무팀 업무 과중으로 교육 세션 참석률이 낮을 위험', 'resource', 'medium', 'low', 'monitoring', '박민준(DMS관리)', '2026-09-25', '부서장 사전 공지 및 온라인 녹화 세션 병행 제공'),
(1, 'SAP B1 라이선스/Service Layer 접근 제한', 'Service Layer API 호출 쿼터 제한으로 대량 연동 시 병목 발생 가능', 'vendor', 'medium', 'low', 'identified', '이철수(개발)', '2026-08-01', 'SAP 파트너사와 API 쿼터 확장 협의'),
(1, '법무팀 계약관리 프로세스 충돌', '계약서 문서유형의 접근권한/보존 규정이 법무 내부 정책과 상충될 가능성', 'quality', 'medium', 'medium', 'identified', '박민준(DMS관리)', '2026-08-15', '법무팀과 별도 협의체 구성, ACL 예외 규칙 설계'),
(1, '스테이징-운영 간 데이터 불일치', '스테이징 통합 테스트 결과가 운영 환경과 달라질 위험', 'technical', 'low', 'low', 'resolved', '김영희(SAP운영)', '2026-08-30', '운영과 동일한 마스터 데이터 셋으로 테스트 재수행 완료');

-- 4) case_studies (적용 사례/벤치마크) 테이블 --------------------
CREATE TABLE case_studies (
    id             BIGSERIAL PRIMARY KEY,
    project_id     BIGINT REFERENCES projects(id),
    title          VARCHAR(300) NOT NULL,
    category       VARCHAR(50),               -- integration | governance | automation | ux | ai
    summary        TEXT,
    outcome        TEXT,
    status         VARCHAR(20)  NOT NULL DEFAULT 'draft', -- draft | published | archived
    owner          VARCHAR(100),
    published_date DATE,
    created_at     TIMESTAMP NOT NULL DEFAULT now(),
    updated_at     TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_case_studies_project ON case_studies(project_id);
CREATE INDEX idx_case_studies_status ON case_studies(status);

INSERT INTO case_studies (project_id, title, category, summary, outcome, status, owner, published_date) VALUES
(1, 'SAP-Teedy 브리지 모듈 PoC 결과', 'integration', 'AP Invoice 전표 발행 시 자동으로 문서를 색인하는 브리지 모듈 PoC 진행', '전표 발행 후 평균 4초 내 문서 자동 색인 성공, 오탐율 2% 미만', 'published', '이철수(개발)', '2026-07-18'),
(1, '재무팀 ACL 적용 사례', 'governance', '재무팀 매니저/스탭 권한을 세금계산서 문서유형에 차등 적용', '권한 오적용 사례 0건, 감사 대응 시간 40% 단축', 'published', '박민준(DMS관리)', '2026-07-10'),
(1, '누락 문서 자동 탐지 배치 설계안', 'automation', 'SAP 전표 목록과 KMS 색인 데이터를 비교하는 배치 스크립트 설계', '설계 검토 완료, 9월 파일럿 부서 대상 시범 운영 예정', 'draft', '정수아(데이터)', NULL),
(1, '간편 업로드 위젯 UX 벤치마크', 'ux', 'SAP 화면 내 업로드 버튼 UX를 경쟁 솔루션과 비교 분석', '클릭 수 3회→1회로 단축 가능한 UI 패턴 확인', 'draft', '박민준(DMS관리)', NULL),
(1, 'OCR 기반 File No. 자동 추출 실험', 'ai', '스캔 계약서에서 File No.를 OCR로 자동 추출하는 실험 진행', '인식률 78% 달성, 정형 문서 기준 90% 목표로 추가 튜닝 필요', 'draft', '정수아(데이터)', NULL),
(1, '구매팀 발주서 매핑 적용 사례', 'integration', 'OPOR 발주서 문서번호를 File No.로 매핑하는 규칙 적용', '발주서 검색 시간 평균 6분→40초로 단축', 'published', '김영희(SAP운영)', '2026-07-20'),
(1, '인사문서 접근권한 감사 로그 사례', 'governance', '인사문서 열람/다운로드 이력을 로그로 추적하는 체계 구축', '내부 감사 시 열람 이력 즉시 조회 가능해짐', 'archived', '박민준(DMS관리)', '2026-06-30'),
(1, '메신저 알림 연동 자동화 사례', 'automation', '누락 문서 발생 시 담당자에게 메신저로 즉시 알림을 발송', '평균 인지 시간 1일→10분으로 단축(설계 단계)', 'draft', '정수아(데이터)', NULL);
