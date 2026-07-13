# SAP B1 - Teedy 문서관리 통합 프로젝트 대시보드

## 프로젝트 개요
- **이름**: SAP B1 - Teedy 문서관리 통합 프로젝트
- **목표**: SAP Business One의 전자문서(세금계산서/발주서/계약서 등)를 Teedy DMS와 연동하여 UNC 경로 기반 파일을 커스텀 메타데이터(File No.)로 색인하고, 누락 문서 자동 탐지 및 접근권한(ACL) 체계를 구축하는 **3개월 로드맵 프로젝트**
- **기간**: 2026-07-01 ~ 2026-09-30
- **주요 기능**:
  1. 3개월 로드맵(프로젝트/마일스톤/태스크) 관리
  2. 개발 모듈 백로그(4개 모듈) 및 리스크 트래킹
  3. SAP B1 필드 ↔ Teedy 커스텀 메타데이터 매핑 정의서
  4. 사용자/그룹/역할별 문서유형 접근권한(ACL) 설계
  5. 통합 대시보드(진행률·위험모듈·매핑완성도·ACL커버리지 한눈에 확인)

## URLs
- **로컬 개발**: http://localhost:3000 (PM2 + wrangler pages dev --local)
- **공개 URL(샌드박스)**: https://3000-it2nlhxz00zq3xkz2jnz6-ecea8f22.sandbox.novita.ai
- **GitHub**: (미설정 - 필요 시 setup_github_environment 후 push)
- **프로덕션(Cloudflare Pages)**: (미배포 - 배포 시 안내 예정)

## API 엔드포인트

### 대시보드
- `GET /api/dashboard` — 3개월 진행률, 위험 모듈, 매핑 완성도, ACL 커버리지 통합 요약

### 프로젝트 / 로드맵
- `GET /api/projects` , `GET /api/projects/:id` , `PUT /api/projects/:id`
- `GET /api/milestones?project_id=` , `GET /api/milestones/:id` (태스크 포함), `POST/PUT/DELETE /api/milestones/:id`
- `GET /api/tasks?milestone_id=` , `POST /api/tasks` , `PUT/DELETE /api/tasks/:id`

### 개발 모듈 백로그
- `GET /api/dev-modules` , `POST /api/dev-modules` , `PUT/DELETE /api/dev-modules/:id`

### SAP-Teedy 매핑
- `GET /api/mappings` , `POST /api/mappings` , `PUT/DELETE /api/mappings/:id`

### ACL 설계
- `GET /api/acl` , `POST /api/acl` , `PUT/DELETE /api/acl/:id`

## 데이터 아키텍처

### 저장소
- **Cloudflare D1** (SQLite 기반, 바인딩명 `DB`, 데이터베이스명 `webapp-production`)
- 로컬 개발: `wrangler d1 --local` 자동 생성 SQLite (`.wrangler/state/v3/d1`)

### 테이블 구조 (총 6개)

| 테이블 | 설명 |
|---|---|
| `projects` | 프로젝트 기본 정보 (기간/상태) |
| `milestones` | 월차별 마일스톤 (1~3개월차), 진행률 포함 |
| `tasks` | 마일스톤별 세부 태스크 (담당자/우선순위/진행률/상태) |
| `dev_modules` **(신규)** | 4개 모듈 백로그: SAP-Teedy 브리지 / 누락 탐지 검증엔진 / 간편 업로드 UI / AI 데이터 전처리 — 리스크 레벨/노트 포함 |
| `sap_teedy_mapping` **(신규)** | SAP B1 필드(테이블/필드명) ↔ Teedy 커스텀 메타데이터(File No. 등) 매핑 정의서, UNC 경로 패턴 포함 |
| `acl_design` **(신규)** | 그룹/역할별 문서유형 접근권한(읽기/쓰기/삭제/공유) 설계 |

### 3개월 로드맵 시드 데이터
- **1개월차**: Teedy 서버 배포 + SAP B1/UNC 경로 매핑 + REST API 연동 테스트 (6개 태스크)
- **2개월차**: SAP-Teedy 브리지 모듈 구현 + 커스텀 메타데이터(File No.) 설정 (5개 태스크)
- **3개월차**: 누락 점검 파이썬 스크립트 배포 + 실데이터 테스트 + 사용자 교육 (6개 태스크)
- 총 17개 태스크 시딩, 10건 SAP-Teedy 매핑 정의, 15건 ACL 설계 규칙

## 사용자 가이드
1. 상단 탭에서 원하는 화면으로 이동:
   - **통합 대시보드**: KPI 카드(진행률/위험모듈/매핑완성도/ACL커버리지) + 차트
   - **3개월 로드맵**: 월차별 마일스톤과 태스크 목록, 태스크 상태를 직접 변경 가능
   - **개발 모듈 백로그**: 4개 모듈 카드, 리스크 레벨과 노트 확인, 상태 변경 가능
   - **SAP-Teedy 매핑**: SAP 필드 ↔ Teedy 메타데이터 매핑표 전체 조회
   - **ACL 설계**: 그룹/역할별 문서유형 권한 매트릭스 조회
2. 데이터는 Cloudflare D1에 저장되며, 태스크/모듈 상태 변경 시 즉시 DB에 반영됩니다.

## 개발/실행 방법
```bash
# 빌드
npm run build

# D1 로컬 마이그레이션 적용 (최초 1회 또는 스키마 변경 시)
npm run db:migrate:local

# PM2로 서비스 시작
pm2 start ecosystem.config.cjs

# 확인
curl http://localhost:3000/api/dashboard
```

## 완료된 기능
- [x] D1 스키마 설계 (기존 3 + 신규 3 = 총 6개 테이블)
- [x] 3개월 로드맵 시드 데이터 (프로젝트 1 / 마일스톤 3 / 태스크 17)
- [x] 신규 테이블 3개 및 시드: `dev_modules`(4) / `sap_teedy_mapping`(10) / `acl_design`(15)
- [x] Hono 백엔드 REST API (CRUD 전체)
- [x] 통합 대시보드 프론트엔드 (Chart.js 시각화)
- [x] 로컬 PM2 실행 및 동작 검증

## 아직 구현되지 않은 기능 / 다음 단계
- [ ] Cloudflare Pages 프로덕션 배포 (D1 프로덕션 DB 생성 및 `wrangler d1 create` 필요)
- [ ] GitHub 리포지토리 연동 및 push (`setup_github_environment` 필요)
- [ ] 로그인/인증 및 사용자별 권한 제어(현재는 관리자 단일 화면)
- [ ] 태스크/모듈/매핑/ACL 추가·수정용 프론트엔드 폼 UI (현재 API는 지원, UI는 조회+상태변경 위주)
- [ ] 실제 SAP B1 Service Layer / Teedy REST API 연동(현재는 계획/설계 데이터만 관리)
- [ ] 누락 탐지 파이썬 스크립트 실행 결과 연동 뷰

## 배포 상태
- **플랫폼**: Cloudflare Pages (예정) / 현재 샌드박스 로컬 실행 중
- **상태**: ✅ 로컬 개발 서버 정상 동작 (PM2 + wrangler pages dev --local + D1 local)
- **기술 스택**: Hono + TypeScript + Cloudflare D1 + TailwindCSS(CDN) + Chart.js(CDN)
- **최종 업데이트**: 2026-07-13
