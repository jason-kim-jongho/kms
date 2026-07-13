# SAP B1 - Teedy 문서관리 통합 프로젝트 대시보드

> 📌 **참고**: 이 저장소에는 아래 두 가지 버전의 동일한 솔루션이 함께 들어 있습니다.
> 1. **본 문서(Cloudflare Pages 버전)** — Hono + TypeScript + Cloudflare D1/R2 (서버리스)
> 2. **`si-solution/` 디렉터리 (온프레미스 SI 버전)** — Spring Boot 3.5 + Java 21 + PostgreSQL 17 + Vue.js 3
>    (일반 SI/사내 서버 구축 방식을 원하는 경우 이 버전을 사용하세요. 상세 가이드는 [`si-solution/README.md`](./si-solution/README.md) 참고)

## 프로젝트 개요
- **이름**: SAP B1 연계 문서관리(DMS) 통합 프로젝트
- **목표**: SAP Business One의 전자문서(세금계산서/발주서/계약서 등)를 문서관리 시스템과 연동하여 UNC 경로 기반 파일을 커스텀 메타데이터(File No.)로 색인하고, 누락 문서 자동 탐지 및 접근권한(ACL) 체계를 구축. 실제 SAP B1 연계 SCM 솔루션(`scm_solution`) 코드베이스를 분석하여 파일 스토리지/SAP Service Layer/인증서관리 패턴을 반영한 **문서관리(DMS) 모듈**을 추가 구현
- **기간**: 2026-07-01 ~ 2026-09-30
- **주요 기능**:
  1. 3개월 로드맵(프로젝트/마일스톤/태스크) 관리
  2. 개발 모듈 백로그(4개 모듈) 및 리스크 트래킹
  3. SAP B1 필드 ↔ Teedy 커스텀 메타데이터 매핑 정의서
  4. 사용자/그룹/역할별 문서유형 접근권한(ACL) 설계
  5. **문서관리(DMS)** — 문서 등록/파일 업로드·다운로드(R2), SAP B1 전표 연계/누락 탐지, 인증서(자격증명) 관리
  6. **SAP B1 연계조회** — Service Layer 조회 시뮬레이터(OPCH/OINV/OPOR/ORDR/OPDN) + 문서-전표 연계 현황
  7. 통합 대시보드(진행률·위험모듈·매핑완성도·ACL커버리지·문서관리 KPI 한눈에 확인)

## URLs
- **로컬 개발**: http://localhost:3000 (PM2 + wrangler pages dev --local)
- **공개 URL(샌드박스)**: https://3000-it2nlhxz00zq3xkz2jnz6-ecea8f22.sandbox.novita.ai
- **GitHub**: (미설정 - 필요 시 setup_github_environment 후 push)
- **프로덕션(Cloudflare Pages)**: (미배포 - 배포 시 안내 예정)

## API 엔드포인트

### 대시보드
- `GET /api/dashboard` — 3개월 진행률, 위험 모듈, 매핑 완성도, ACL 커버리지 **+ 문서관리(DMS) KPI(문서수/SAP연계율/미연계건/만료인증서)** 통합 요약
- `GET /api/documents-dashboard` — 문서관리 전용 상세 대시보드(카테고리별 현황, 미연계 문서 목록, 만료 예정 인증서 등)

### 프로젝트 / 로드맵
- `GET /api/projects` , `GET /api/projects/:id` , `PUT /api/projects/:id`
- `GET /api/milestones?project_id=` , `GET /api/milestones/:id` (태스크 포함), `POST/PUT/DELETE /api/milestones/:id`
- `GET /api/tasks?milestone_id=` , `POST /api/tasks` , `PUT/DELETE /api/tasks/:id`

### 개발 모듈 백로그 / 매핑 / ACL
- `GET /api/dev-modules` , `POST /api/dev-modules` , `PUT/DELETE /api/dev-modules/:id`
- `GET /api/mappings` , `POST /api/mappings` , `PUT/DELETE /api/mappings/:id`
- `GET /api/acl` , `POST /api/acl` , `PUT/DELETE /api/acl/:id`

### 문서관리(DMS) — 신규
- `GET /api/doc-categories` — 문서 카테고리(세금계산서/발주서/계약서 등 10종)
- `GET /api/documents` — 문서 목록(카테고리/거래처/키워드 필터, SAP 연계상태·파일수 포함)
- `GET /api/documents/:id` — 문서 상세(파일 목록/SAP 연계/인증서 포함)
- `POST /api/documents` — 문서 등록(storage_id 자동 생성, 8자 랜덤 ID)
- `PUT /api/documents/:id` , `DELETE /api/documents/:id`(소프트 삭제)
- `POST /api/documents/:id/files` — 파일 업로드(multipart/form-data → Cloudflare R2 저장, file_index 자동 증가)
- `GET /api/documents/:id/files/:fileId/content` — 파일 다운로드(R2에서 스트리밍)
- `DELETE /api/documents/:id/files/:fileId` — 파일 소프트 삭제(R2 객체도 삭제)
- `GET /api/sap-links` — 전체 SAP 전표 연계 현황
- `POST /api/documents/:id/sap-link` — SAP 전표 연계 등록
- `GET /api/sap/lookup?table=&doc_num=` — **SAP B1 Service Layer 연동 지점(Mock)**. 실제 운영 시 Service Layer 호출로 교체할 위치를 코드 주석으로 명시
- `GET /api/certifications` , `POST /api/certifications` , `DELETE /api/certifications/:id`(효력정지)

## 데이터 아키텍처

### 저장소
- **Cloudflare D1** (SQLite, 바인딩 `DB`, DB명 `webapp-production`) — 모든 정형 데이터
- **Cloudflare R2** (바인딩 `DOC_BUCKET`, 버킷명 `webapp-documents`) — 문서 첨부파일 실물 저장 (`documents/{storageId}/{fileName}` 키 구조)
- 로컬 개발: `wrangler --local` 자동 생성 SQLite/R2 (`.wrangler/state/v3`)

### 테이블 구조 (총 12개)

| 테이블 | 설명 |
|---|---|
| `projects` / `milestones` / `tasks` | 3개월 로드맵 |
| `dev_modules` | 개발 모듈 백로그(4개) 및 리스크 |
| `sap_teedy_mapping` | SAP B1 ↔ Teedy 메타데이터 매핑 정의 |
| `acl_design` | 그룹/역할별 문서유형 ACL |
| `document_categories` **(신규)** | 문서 카테고리 10종(세금계산서/발주서/계약서/입고증/인증서 등) |
| `documents` **(신규)** | 문서 마스터 (storage_id, 거래처, File No., UNC 경로 참조, 상태) |
| `document_files` **(신규)** | storage_id 그룹 내 개별 파일(R2 객체키, 타입/크기, file_index) |
| `sap_document_links` **(신규)** | 문서 ↔ SAP 전표(OINV/OPCH/OPOR/ORDR/OPDN) 연계, 연계상태(linked/missing/pending_review) |
| `certifications` **(신규)** | 거래처 제출 인증서(ISO 등) 유효기간 관리 |
| `document_access_logs` **(신규)** | 조회/업로드/다운로드/삭제/공유 이력 |

### 참고 코드베이스 분석 (`scm_solution-master`)
Spring Boot + React + SAP B1 연계 SCM 솔루션 실제 코드를 분석하여 다음 패턴을 반영:
- **StorageModule.java** → `storageId`(8자 랜덤) + `file_index` 그룹핑 방식을 그대로 채택 (파일시스템 대신 R2로 대체 구현, Workers는 로컬 fs 접근 불가)
- **FileCategory/UploadFileType enum** → `classifyFileType()` (IMAGE/VIDEO/DOCUMENT/OTHERS)
- **ServiceLayerClient(Feign) + "SL 우회" 스텁 패턴** → `/api/sap/lookup` mock 엔드포인트로 재현, 실 연동 지점을 코드 주석(`[SAP 연동 지점]`)으로 명시
- **CertModule.java / CertificateManagement.jsx** → `certifications` 테이블 + 인증서관리 탭(만료 D-day 표시)
- **FileStorage 엔티티가 EDReport/WebNotice 등 업무 테이블의 FK로 쓰이는 구조** → `documents`가 `sap_document_links`/`certifications`의 FK로 연결되는 구조에 반영

## 사용자 가이드
1. 상단 탭에서 원하는 화면으로 이동:
   - **통합 대시보드**: KPI 카드(진행률/위험모듈/매핑완성도/ACL커버리지/**문서관리 KPI**) + 차트 + 미연계문서·만료인증서 요약
   - **3개월 로드맵** / **개발 모듈 백로그** / **SAP-Teedy 매핑** / **ACL 설계**: 기존 조회/상태변경 화면
   - **문서관리 (신규)**: 문서 등록, 파일 업로드/다운로드(드래그&드롭), SAP 전표 연계 등록, 미연계 문서 확인
   - **SAP 연계조회 (신규)**: 테이블(OPCH/OINV/OPOR/ORDR/OPDN)+전표번호로 SAP B1 조회 시뮬레이션, 전체 연계 현황표
   - **인증서관리 (신규)**: 거래처별 인증서 목록, 만료 D-day, 효력정지 처리
2. 데이터는 Cloudflare D1(정형데이터)/R2(파일)에 저장되며 상태 변경 시 즉시 반영됩니다.

## 개발/실행 방법
```bash
# 빌드
npm run build

# D1/시드 마이그레이션 적용 (최초 1회 또는 스키마 변경 시)
npm run db:migrate:local
npm run db:seed          # 로드맵/모듈/매핑/ACL 시드
npm run db:seed:doc      # 문서관리 시드

# PM2로 서비스 시작 (D1 + R2 바인딩 포함)
pm2 start ecosystem.config.cjs

# 확인
curl http://localhost:3000/api/dashboard
curl http://localhost:3000/api/documents-dashboard
```

## 완료된 기능
- [x] D1 스키마 설계 (기존 6 + 문서관리 6 = 총 12개 테이블)
- [x] 3개월 로드맵 / 개발모듈 / 매핑 / ACL 시드 데이터
- [x] Hono 백엔드 REST API (CRUD 전체 + 문서관리 API)
- [x] Cloudflare R2 연동 파일 업로드/다운로드/삭제 (curl 검증 완료: 업로드→file_index 증가→다운로드 바이트 일치 확인)
- [x] SAP B1 Service Layer 연계 Mock 엔드포인트 (`/api/sap/lookup`, 실연동 지점 주석 명시) 및 문서-전표 연계/누락탐지
- [x] 인증서관리(만료 D-day) 기능
- [x] 통합 대시보드에 문서관리 KPI(문서수/SAP연계율/미연계건수/만료인증서) 반영 및 프론트엔드 렌더링
- [x] 신규 프론트엔드 3개 탭(문서관리/SAP 연계조회/인증서관리) 구현 및 Playwright 콘솔 에러 확인(정상, favicon 404는 기존 무관 이슈)
- [x] 로컬 PM2 실행 및 동작 검증

## 아직 구현되지 않은 기능 / 다음 단계
- [ ] Cloudflare Pages 프로덕션 배포 (D1/R2 프로덕션 리소스 생성 필요)
- [ ] GitHub 리포지토리 연동 및 push (`setup_github_environment` 필요)
- [ ] 로그인/인증 및 사용자별 권한 제어(현재는 관리자 단일 화면)
- [ ] 실제 SAP B1 Service Layer 연동(현재 `/api/sap/lookup`은 Mock — 운영 전환 시 Feign/HTTP 클라이언트로 교체 필요)
- [ ] 누락 탐지 파이썬 스크립트 실행 결과 연동 뷰
- [ ] 문서 업로드 시 파일 용량/포맷 제한, 바이러스 스캔 등 운영 보안 정책 추가

## 배포 상태
- **플랫폼**: Cloudflare Pages (예정) / 현재 샌드박스 로컬 실행 중
- **상태**: ✅ 로컬 개발 서버 정상 동작 (PM2 + wrangler pages dev --local + D1/R2 local)
- **기술 스택**: Hono + TypeScript + Cloudflare D1 + Cloudflare R2 + TailwindCSS(CDN) + Chart.js(CDN) + dayjs(CDN)
- **최종 업데이트**: 2026-07-13
