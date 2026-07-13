-- ============================================================
-- V4__seed_roadmap_data.sql
-- 3개월 로드맵 + dev_modules / sap_teedy_mapping / acl_design 시드 데이터
-- ============================================================

INSERT INTO projects (id, name, description, start_date, end_date, status) VALUES
(1, 'SAP B1 연계 문서관리(KMS) 통합 프로젝트',
 'SAP Business One의 전자문서(세금계산서/발주서/계약서 등)를 문서관리시스템과 연동하여 파일을 커스텀 메타데이터(File No.)로 색인하고, 누락 문서 자동 탐지 및 접근권한(ACL) 체계를 구축하는 3개월 프로젝트',
 '2026-07-01', '2026-09-30', 'in_progress');
SELECT setval('projects_id_seq', 1, true);

INSERT INTO milestones (id, project_id, month_no, title, description, start_date, end_date, status, progress) VALUES
(1, 1, 1, '1개월차: 문서관리 서버 배포 & SAP B1/UNC 경로 매핑 & REST API 연동 테스트',
  '문서관리 서버를 구축하고 SAP B1 문서 저장소(UNC 경로)를 조사/매핑하며, REST API 연동을 검증한다.',
  '2026-07-01', '2026-07-31', 'in_progress', 55),
(2, 1, 2, '2개월차: SAP-KMS 브리지 모듈 구현 & 커스텀 메타데이터(File No.) 설정',
  'SAP B1 이벤트를 감지하여 문서관리시스템으로 문서를 자동 전송하는 브리지 모듈을 구현하고, File No. 등 커스텀 메타데이터 스키마를 설정한다.',
  '2026-08-01', '2026-08-31', 'planned', 0),
(3, 1, 3, '3개월차: 누락 점검 스크립트 배포 & 실데이터 테스트 & 사용자 교육',
  '누락 문서 자동 점검 스크립트를 배포하고 실제 부서 데이터로 파일럿 테스트를 수행한 뒤 사용자 교육을 진행한다.',
  '2026-09-01', '2026-09-30', 'planned', 0);
SELECT setval('milestones_id_seq', 3, true);

INSERT INTO tasks (id, milestone_id, title, description, owner, status, priority, start_date, due_date, progress) VALUES
(1, 1, 'KMS 서버 인프라 구성 (사내 서버/VM)', 'Spring Boot + PostgreSQL 기반 KMS를 사내 서버에 구축', '홍길동(인프라)', 'completed', 'high', '2026-07-01', '2026-07-05', 100),
(2, 1, '초기 설정 및 관리자 계정/조직 구성', '관리자 계정, 부서/그룹 초기 셋업', '홍길동(인프라)', 'completed', 'medium', '2026-07-06', '2026-07-08', 100),
(3, 1, 'SAP B1 문서 저장소 UNC 경로 전수 조사', '부서별 문서 유형별 UNC 경로 현황 조사', '김영희(SAP운영)', 'in_progress', 'high', '2026-07-08', '2026-07-18', 60),
(4, 1, 'UNC 경로 ↔ SAP B1 문서유형 매핑표 작성', '조사된 UNC 경로와 SAP B1 문서유형 매핑표 초안 작성', '김영희(SAP운영)', 'in_progress', 'high', '2026-07-15', '2026-07-25', 40),
(5, 1, 'KMS REST API 인증키 발급 및 Postman 연동 테스트', 'API Key 발급 및 기본 CRUD 호출 테스트', '이철수(개발)', 'pending', 'medium', '2026-07-20', '2026-07-27', 0),
(6, 1, 'SAP B1 Service Layer - KMS API PoC (업로드/조회)', 'SAP B1 Service Layer에서 KMS API 호출 PoC 진행', '이철수(개발)', 'pending', 'critical', '2026-07-22', '2026-07-31', 0),
(7, 2, 'SAP-KMS 브리지 모듈 아키텍처 설계', '이벤트 트리거 방식/배치 방식 검토 및 아키텍처 확정', '이철수(개발)', 'pending', 'high', '2026-08-01', '2026-08-05', 0),
(8, 2, 'SAP B1 이벤트(전표 추가/수정) 감지 트리거 구현', 'B1 Add-on 또는 DI API 기반 이벤트 감지 로직 구현', '이철수(개발)', 'pending', 'critical', '2026-08-04', '2026-08-14', 0),
(9, 2, '커스텀 메타데이터 스키마 정의 (File No. 등)', 'File No., 부서코드, 문서유형 등 커스텀 메타데이터 필드 설계', '박민준(DMS관리)', 'pending', 'high', '2026-08-10', '2026-08-17', 0),
(10, 2, '문서유형별 메타데이터 자동 매핑 로직 구현', 'SAP 필드값을 KMS 메타데이터로 자동 매핑하는 로직 구현', '이철수(개발)', 'pending', 'high', '2026-08-15', '2026-08-25', 0),
(11, 2, '브리지 모듈 통합 테스트 (스테이징)', '스테이징 환경에서 전표 발행 → 자동 업로드 통합 테스트', '김영희(SAP운영)', 'pending', 'medium', '2026-08-24', '2026-08-31', 0),
(12, 3, '누락 문서 점검 스크립트 개발', 'SAP 전표 목록과 KMS 색인 목록을 비교해 누락건 탐지', '정수아(데이터)', 'pending', 'critical', '2026-09-01', '2026-09-08', 0),
(13, 3, '스케줄러 등록 및 알림(메일/메신저) 연동', '일 1회 배치 실행 및 담당자 알림 발송 구성', '정수아(데이터)', 'pending', 'medium', '2026-09-08', '2026-09-12', 0),
(14, 3, '실데이터 기반 파일럿 테스트 (2개 부서)', '재무팀/구매팀 실데이터로 파일럿 운영 테스트', '김영희(SAP운영)', 'pending', 'high', '2026-09-10', '2026-09-20', 0),
(15, 3, '사용자 교육 자료 및 매뉴얼 제작', '부서별 사용 가이드, FAQ, 동영상 매뉴얼 제작', '박민준(DMS관리)', 'pending', 'medium', '2026-09-15', '2026-09-22', 0),
(16, 3, '부서별 사용자 교육 세션 진행', '재무/구매/영업/인사팀 대상 순차 교육', '박민준(DMS관리)', 'pending', 'medium', '2026-09-22', '2026-09-28', 0),
(17, 3, '안정화 및 Go-live 체크리스트 점검', '오픈 전 최종 점검 및 이슈 트래킹', '홍길동(인프라)', 'pending', 'high', '2026-09-26', '2026-09-30', 0);
SELECT setval('tasks_id_seq', 17, true);

INSERT INTO dev_modules (id, project_id, module_key, name, description, category, status, risk_level, risk_note, progress, owner, planned_month, target_milestone_id) VALUES
(1, 1, 'sap_kms_bridge', 'SAP-KMS 브리지 모듈',
  'SAP B1 전표 이벤트를 감지하여 관련 문서를 KMS로 자동 업로드/색인하는 핵심 통합 모듈',
  'integration', 'in_progress', 'medium',
  'SAP B1 DI API 이벤트 감지 방식의 성능/안정성 검증 필요. 대량 전표 발생 시 지연 가능성 존재',
  30, '이철수(개발)', 2, 2),
(2, 1, 'missing_detection_engine', '누락 탐지 검증엔진',
  'SAP 전표 목록과 KMS 색인 데이터를 비교하여 누락된 문서를 자동으로 탐지하는 검증엔진',
  'validation', 'backlog', 'high',
  '부서별 문서 판단 기준(필수/선택 문서유형)이 아직 확정되지 않아 요구사항 변경 리스크 존재',
  0, '정수아(데이터)', 3, 3),
(3, 1, 'easy_upload_ui', '간편 업로드 UI',
  '현업 사용자가 SAP 화면에서 바로 문서를 업로드할 수 있는 간편 업로드 UI/위젯',
  'ui', 'backlog', 'low',
  'UI 자체 리스크는 낮으나 브리지 모듈 API 완성 이후에만 개발 가능(선행 의존성)',
  0, '박민준(DMS관리)', 3, 3),
(4, 1, 'ai_preprocessing', 'AI 데이터 전처리',
  'OCR/AI를 활용해 스캔 문서의 File No. 등 메타데이터를 자동 추출/전처리하는 모듈',
  'ai', 'backlog', 'critical',
  'OCR 인식률 및 비정형 문서 처리 기술 검증이 선행되어야 하며, 3개월 내 완료가 어려울 수 있어 4개월차 이후로 이전 검토 필요',
  0, '정수아(데이터)', 3, 3);
SELECT setval('dev_modules_id_seq', 4, true);

INSERT INTO sap_teedy_mapping (id, project_id, sap_table, sap_field, sap_field_desc, teedy_metadata_name, teedy_metadata_type, doc_type, unc_path_pattern, mapping_status, is_required, notes) VALUES
(1, 1, 'OPCH', 'DocNum', '구매 세금계산서(AP Invoice) 문서번호', 'File No.', 'STRING', '세금계산서(매입)', '\\SAPFILE\AP\Invoice\{DocNum}\', 'implemented', true, 'DocNum 기준 File No. 생성 규칙: AP-{DocNum}'),
(2, 1, 'OPCH', 'CardCode', '거래처(공급업체) 코드', 'Vendor Code', 'STRING', '세금계산서(매입)', NULL, 'approved', true, NULL),
(3, 1, 'OINV', 'DocNum', '판매 세금계산서(AR Invoice) 문서번호', 'File No.', 'STRING', '세금계산서(매출)', '\\SAPFILE\AR\Invoice\{DocNum}\', 'reviewed', true, 'AR-{DocNum} 규칙 검토 중'),
(4, 1, 'OINV', 'DocDate', '세금계산서 발행일', 'Doc Date', 'DATE', '세금계산서(매출)', NULL, 'implemented', false, NULL),
(5, 1, 'OPOR', 'DocNum', '발주서(Purchase Order) 문서번호', 'File No.', 'STRING', '발주서', '\\SAPFILE\Purchasing\PO\{DocNum}\', 'reviewed', true, NULL),
(6, 1, 'OPOR', 'CardName', '공급업체명', 'Vendor Name', 'STRING', '발주서', NULL, 'draft', false, '한글/영문 표기 표준화 필요'),
(7, 1, 'ORDR', 'DocNum', '수주(Sales Order) 문서번호', 'File No.', 'STRING', '수주서', '\\SAPFILE\Sales\SO\{DocNum}\', 'draft', true, NULL),
(8, 1, 'OCTR', 'ContractNum', '계약 문서번호', 'File No.', 'STRING', '계약서', '\\SAPFILE\Legal\Contract\{ContractNum}\', 'draft', true, '법무팀 계약관리 프로세스와 별도 협의 필요'),
(9, 1, 'OCTR', 'ValidTo', '계약 만료일', 'Contract Expiry', 'DATE', '계약서', NULL, 'draft', false, '만료 임박 알림 연동 예정'),
(10, 1, 'OPDN', 'DocNum', '입고증(GRPO) 문서번호', 'File No.', 'STRING', '입고증', '\\SAPFILE\Warehouse\GRPO\{DocNum}\', 'draft', false, '3개월차 이후 확장 검토');
SELECT setval('sap_teedy_mapping_id_seq', 10, true);

INSERT INTO acl_design (id, project_id, group_name, role_name, doc_type, permission_read, permission_write, permission_delete, permission_share, scope_note, status) VALUES
(1, 1, '재무팀', 'Manager', '세금계산서(매입)', true, true, true, true, '전체 문서', 'applied'),
(2, 1, '재무팀', 'Staff', '세금계산서(매입)', true, true, false, false, '본인 담당 거래처만', 'applied'),
(3, 1, '재무팀', 'Staff', '세금계산서(매출)', true, true, false, false, '본인 담당 거래처만', 'approved'),
(4, 1, '구매팀', 'Manager', '발주서', true, true, true, true, '전체 문서', 'applied'),
(5, 1, '구매팀', 'Staff', '발주서', true, true, false, false, '본인 발주 건만', 'approved'),
(6, 1, '구매팀', 'Staff', '입고증', true, false, false, false, '본인 부서 문서만', 'reviewed'),
(7, 1, '영업팀', 'Manager', '수주서', true, true, true, true, '전체 문서', 'approved'),
(8, 1, '영업팀', 'Staff', '수주서', true, true, false, false, '본인 담당 고객만', 'reviewed'),
(9, 1, '영업팀', 'Staff', '세금계산서(매출)', true, false, false, false, '본인 담당 고객만', 'draft'),
(10, 1, '인사팀', 'Manager', '인사문서', true, true, true, false, '전체 문서', 'draft'),
(11, 1, '인사팀', 'Staff', '인사문서', true, false, false, false, '본인 소속 부서만', 'draft'),
(12, 1, '경영진', 'Admin', '계약서', true, true, true, true, '전체 문서', 'draft'),
(13, 1, '경영진', 'Admin', '세금계산서(매출)', true, false, false, true, '전체 문서(조회 중심)', 'reviewed'),
(14, 1, '시스템관리자', 'Admin', '계약서', true, true, true, true, '전체 문서 + 시스템 설정', 'applied'),
(15, 1, '시스템관리자', 'Admin', '인사문서', true, true, true, true, '전체 문서 + 시스템 설정', 'applied');
SELECT setval('acl_design_id_seq', 15, true);
