# 미래지기 PMS — Spring Boot + PostgreSQL + Vue.js

## 프로젝트 개요
- **이름**: 미래지기 PMS (구 KMS SI Solution, SAP B1 연계 문서관리시스템) — On-Premise SI Edition
- **목적**: `/home/user/webapp`의 Cloudflare Workers(Hono + D1 + R2) 기반 솔루션과 **동일한 기능**을
  일반적인 사내(On-Premise) SI 구축 방식으로 재구현한 버전입니다.
  클라우드 서버리스가 아닌, 전통적인 3-tier(프론트엔드 / 백엔드 서버 / DB 서버) 아키텍처로
  사내 서버·VM에 직접 설치하여 운영하는 것을 전제로 합니다.
- **핵심 기능**:
  1. **로그인 인증 + 사용자 권한관리(ACL)**: opaque 토큰 기반 로그인, 페이지별·사용자ID별
     화이트리스트 방식 접근 제어(관리자 화면에서 실시간 설정)
  2. 3개월 프로젝트 로드맵(마일스톤/태스크) 관리
  3. 개발모듈 백로그 및 리스크 관리
  4. SAP B1 ↔ KMS 메타데이터 매핑 관리
  5. 문서유형별 권한(ACL) 설계 관리
  6. 문서관리시스템(DMS): 문서 등록/파일 업로드·다운로드/SAP 전표 연계/인증서 관리
  7. **PMS(다중 뷰 프로젝트관리, `/pms/*`)**: Notion/Airtable 스타일의 테이블/칸반/갤러리/캘린더/리스트
     5가지 뷰를 전환하며 8개 테이블(projects, milestones, tasks, dev_modules,
     sap_teedy_mapping, acl_design, risks, case_studies)을 관리하는 통합 데이터베이스 UI

## 로그인 & 사용자 권한관리(ACL)

### 로그인
- 로그인 화면(`/login`)에서 아이디/비밀번호를 입력하거나, 데모 계정 버튼(admin/manager/viewer)으로 바로 로그인할 수 있습니다.
- 로그인 성공 시 서버가 발급하는 opaque 토큰(SecureRandom 32byte, Base64 URL-safe, 12시간 TTL)이
  브라우저 `localStorage`(`miraejigi_auth`)에 저장되고, 이후 모든 API 요청의 `Authorization: Bearer <token>` 헤더로 자동 첨부됩니다.
- 토큰이 없거나 만료된 상태로 보호된 페이지에 접근하면 `/login?next=원래경로`로 리다이렉트됩니다.

### 데모 계정 (seed 데이터, V8 마이그레이션)
| 아이디 | 비밀번호 | 역할 | 접근 가능 페이지 |
|---|---|---|
| `admin` | `admin123` | ADMIN | 전체 페이지(제한 없음, 시스템관리 메뉴 포함) |
| `manager` | `manager123` | USER | 대시보드, PMS, 로드맵, 개발모듈, 매핑, 문서관리 |
| `viewer` | `viewer123` | USER | 대시보드, PMS, 문서관리 |

> ⚠️ 운영 배포 전 반드시 위 데모 계정의 비밀번호를 변경하거나 계정을 삭제하세요.

### ACL(페이지별 · 사용자ID별 권한) 동작 방식
- **역할(role)**: `ADMIN` 또는 `USER`. `ADMIN`은 `page_permissions` 테이블과 무관하게 항상 모든 페이지에 접근 가능합니다.
- **`USER` 역할**: `page_permissions` 테이블에 `(username, page_key, allowed)` 화이트리스트로 등록된 페이지만 접근 가능합니다(등록 안 된 페이지는 기본 차단).
- **9개 page_key**: `dashboard`, `pms`, `roadmap`, `dev-modules`, `mapping`, `acl`, `documents`, `sap-lookup`, `certifications`
- **이중 검증**: 프론트엔드 라우터 가드(Vue Router `beforeEach`)가 UX 차원에서 즉시 리다이렉트하고,
  백엔드 `PagePermissionFilter`가 API 경로→page_key 매핑을 통해 서버사이드로도 동일하게 강제합니다(우회 불가).
- **관리자 화면**:
  - `/admin/users` — 사용자 생성/수정/삭제, 활성화 여부, 역할(ADMIN/USER) 지정
  - `/admin/page-permissions` — 사용자(행) × 페이지(열) 매트릭스에서 셀을 클릭하면 즉시 서버에 반영되는 실시간 토글 UI
- 위 2개 관리자 화면은 `ADMIN` 역할만 접근 가능합니다(라우터 가드 `meta.adminOnly` + 백엔드 `hasRole("ADMIN")`).

## PMS (다중 뷰 프로젝트관리) 상세

업로드된 참조 이미지(Notion/Airtable 스타일 "Teedy 도입 통합 대시보드")를 분석하여
동일한 UX 패턴으로 구현한 신규 모듈입니다. 라우트는 `/pms` (→ `/pms/projects`로 리다이렉트)와
`/pms/:table` (table = projects|milestones|tasks|dev_modules|sap_teedy_mapping|acl_design|risks|case_studies) 입니다.

### 뷰 종류
| 뷰 | 설명 |
|---|---|
| 테이블/그리드 | 모든 필드를 컬럼으로 표시하는 스프레드시트 형태 |
| 칸반보드 | `statusField` 기준으로 컬럼 그룹핑, 카드 형태, 상태별 "+카드 추가" |
| 갤러리 | 4열 카드 그리드, status/priority 뱃지 표시 |
| 캘린더 | `dateField` 기준 월간 캘린더에 이벤트 표시 (dayjs 기반) |
| 리스트 | linked_record(연결된 레코드) 컬럼을 파란 링크로 표시, status/날짜 우선 노출 |

### 신규 테이블(백엔드)
- **risks**: 프로젝트 리스크 관리 (category/severity/probability/status/owner/dueDate/mitigation)
- **case_studies**: 도입 사례/성과 관리 (category/summary/outcome/status/owner/publishedDate)
- 기존 **projects**, **milestones** 테이블에 `priority`, `owner`, `target_date`, `progress_pct`,
  `ai_status_summary`(projects) / `name`, `target_date`, `notes`(milestones) 컬럼을 V7 마이그레이션으로 추가

## ERD 및 DB 스키마

전체 17개 테이블의 ERD(개체관계도)와 PostgreSQL 생성 스크립트는 `kms-backend/docs/`에 있습니다.

- `kms-backend/docs/ERD.png` — 전체 스키마 ERD 다이어그램(PK/FK/컬럼타입 포함)
- `kms-backend/docs/erd.mmd` — 위 ERD의 Mermaid 소스(텍스트로 편집 가능)
- `kms-backend/docs/create_database.sql` — 역할/DB 생성부터 17개 테이블·인덱스·FK·데모 계정 seed까지
  포함한 독립 실행형 PostgreSQL 스크립트 (`psql -f create_database.sql`로 신규 서버에 바로 적용 가능)

### 테이블 그룹
| 그룹 | 테이블 |
|---|---|
| 로그인/ACL | `users`, `user_sessions`, `page_permissions` |
| PMS(다중 뷰 프로젝트관리) | `projects`, `milestones`, `tasks`, `dev_modules`, `sap_teedy_mapping`, `acl_design`, `risks`, `case_studies` |
| DMS(문서관리) | `document_categories`, `documents`, `document_files`, `document_access_logs`, `sap_document_links`, `certifications` |
| 시스템 | `flyway_schema_history` (Flyway 자체 관리 테이블, `create_database.sql`에는 미포함 — 애플리케이션이 자동 생성) |

### 프론트엔드 구조 (`kms-frontend/src/pms/`)
- `tableMeta.js`: 8개 테이블의 필드 스키마(타입/옵션/linkedTable) 선언적 레지스트리
- `usePmsData.js` / `usePmsFilter.js`: 전역 reactive 캐시 + 검색/필터/정렬 composable
- `components/views/*.vue`: TableGridView, KanbanBoardView, GalleryView, CalendarView, ListView
- `components/RecordFormModal.vue`, `PmsToolbar.vue`: 동적 레코드 생성/편집 모달, 필터/정렬/그룹/검색 툴바
- `PmsView.vue`: 좌측 테이블 목록 사이드바 + 상단 뷰 전환 탭 + 메인 컨테이너

## 기술 스택 (Cloudflare 버전과의 대응 관계)

| 계층 | Cloudflare 버전 (webapp/) | SI 버전 (si-solution/) |
|---|---|---|
| 백엔드 프레임워크 | Hono (Cloudflare Workers) | **Spring Boot 3.5.16** |
| 백엔드 언어 | TypeScript | **Java 21** |
| 데이터베이스 | Cloudflare D1 (SQLite) | **PostgreSQL 17** |
| ORM/마이그레이션 | 원시 SQL + `wrangler d1 migrations` | **Spring Data JPA(Hibernate) + Flyway** |
| 파일 저장소 | Cloudflare R2 | **로컬 파일시스템** (`kms.storage.root`) |
| 프론트엔드 | Vanilla JS + Tailwind CDN | **Vue.js 3** (Vite + Vue Router + Pinia) |
| 배포 형태 | 서버리스(Cloudflare Pages) | **온프레미스 서버 상주 프로세스** (JVM + Node/정적빌드) |
| 인증/인가 | 없음(공개) | **Opaque 토큰 로그인 + 페이지별 ACL** (Spring Security 커스텀 필터) |

## 디렉터리 구조
```
si-solution/
├── kms-backend/                 # Spring Boot 백엔드
│   ├── pom.xml
│   └── src/main/
│       ├── java/com/kms/docmanagement/
│       │   ├── entity/          # JPA 엔티티 15종 (User/UserSession/PagePermission 포함)
│       │   ├── repository/      # Spring Data JPA 리포지토리 15종
│       │   ├── controller/      # REST 컨트롤러 15종 (Auth/User/PagePermission 포함)
│       │   ├── service/         # FileStorageService, AuthService(로그인/토큰/권한 resolve)
│       │   ├── security/        # AuthenticatedUser, PageCatalog, TokenAuthenticationFilter,
│       │   │                    #   PagePermissionFilter (ACL 서버사이드 강제)
│       │   ├── config/          # WebConfig(CORS), SecurityConfig, GlobalExceptionHandler
│       │   └── dto/             # ApiResponse, LoginRequest/Response, UserDto, ...
│       └── resources/
│           ├── application.properties
│           └── db/migration/    # Flyway 마이그레이션 V1~V8
├── kms-frontend/                # Vue.js 3 프론트엔드
│   └── src/
│       ├── views/                # 10개 화면 (LoginView 포함)
│       ├── views/admin/          # UserManagementView, PagePermissionView (관리자 전용)
│       ├── components/           # 공용 컴포넌트
│       ├── stores/               # Pinia authStore (토큰/역할/접근가능페이지, localStorage 영속화)
│       ├── api/                  # axios 기반 API 클라이언트(토큰 인터셉터 포함)
│       └── router/               # beforeEach 가드(public/adminOnly/pageKey)
├── kms-storage/                 # 업로드 파일 저장 루트 (런타임 생성)
└── ecosystem.config.cjs         # PM2 프로세스 관리 설정
```

## 필수 설치 소프트웨어 (온프레미스 서버 기준)

| 소프트웨어 | 버전 | 용도 |
|---|---|---|
| Java (JDK) | 21 (LTS) | Spring Boot 실행 |
| Maven | 3.9+ | 백엔드 빌드/실행 |
| PostgreSQL | 17 | 데이터베이스 서버 |
| Node.js | 20+ | Vue.js 프론트엔드 빌드/실행 |

### Ubuntu/Debian 설치 예시
```bash
sudo apt-get update
sudo apt-get install -y openjdk-21-jdk-headless maven postgresql postgresql-contrib nodejs npm
```

## 데이터베이스 설정
```bash
# PostgreSQL 서비스 시작
sudo pg_ctlcluster 17 main start   # 또는: sudo service postgresql start

# 사용자/DB 생성
sudo -u postgres psql -c "CREATE USER kms_user WITH PASSWORD 'kms_pass_2026' CREATEDB;"
sudo -u postgres psql -c "CREATE DATABASE kms_db OWNER kms_user;"
```

> ⚠️ 운영 배포 시에는 `application.properties`의 DB 접속 정보(`spring.datasource.*`)와
> 비밀번호를 반드시 환경에 맞게 변경하고, 평문 비밀번호를 코드에 커밋하지 않도록
> 환경변수(`SPRING_DATASOURCE_PASSWORD` 등)로 주입하는 것을 권장합니다.

## 백엔드 실행 (kms-backend)

### 최초 실행 (마이그레이션 자동 적용)
```bash
cd si-solution/kms-backend
mvn compile               # 최초 컴파일(온라인, 의존성 다운로드)
mvn spring-boot:run       # 실행 시 Flyway가 V1~V6 마이그레이션을 자동 적용
```
Flyway는 `spring.flyway.enabled=true` 설정에 따라 기동 시 자동으로
`db/migration/` 하위 `V1__initial_schema.sql` ~ `V8__auth_and_page_permissions.sql`을
순서대로 적용합니다. 최초 실행 시 로드맵/개발모듈/문서관리 예시(seed) 데이터와
admin/manager/viewer 데모 계정 + 초기 페이지권한도 함께 삽입됩니다.

### 서버 정보
- 포트: `8080` (기본값, `server.port`로 변경 가능)
- Context path: `/`
- 파일 저장 루트: `kms.storage.root` (기본값 `/home/user/webapp/si-solution/kms-storage`)
- CORS 허용 origin: `kms.cors.allowed-origins` (기본: `localhost:5173`, `localhost:3000`)

### PM2로 데몬 실행 (권장, 온프레미스 서버 운영 방식)
```bash
cd si-solution
pm2 start ecosystem.config.cjs --only kms-backend
pm2 logs kms-backend --nostream
```

## 프론트엔드 실행 (kms-frontend)

### 개발 서버
```bash
cd si-solution/kms-frontend
npm install
npm run dev   # Vite dev server, 기본 포트 5173
```

### 환경변수 (`.env`)
```
VITE_API_BASE_URL=http://localhost:8080
```
백엔드가 다른 호스트/포트에서 서비스되는 경우 이 값을 변경하세요.

### 운영 빌드 (정적 배포용)
```bash
npm run build     # dist/ 에 정적 파일 생성
# 이후 Nginx/Apache 등 웹서버로 dist/ 서빙, 또는 spring-boot 정적 리소스로 통합 가능
```

### PM2로 데몬 실행
```bash
cd si-solution
pm2 start ecosystem.config.cjs --only kms-frontend
```

## 두 프로세스 동시 실행
```bash
cd si-solution
pm2 start ecosystem.config.cjs   # kms-backend + kms-frontend 동시 기동
pm2 list
```

## API 엔드포인트 요약

| 그룹 | Method/Path | 설명 |
|---|---|---|
| 대시보드 | `GET /api/dashboard` | 통합 KPI (로드맵/리스크/매핑/ACL/문서관리) |
| 대시보드 | `GET /api/documents-dashboard` | DMS 전용 대시보드 |
| 프로젝트 | `GET/PUT /api/projects[/{id}]` | 프로젝트 조회/수정 |
| 마일스톤 | `GET/POST/PUT/DELETE /api/milestones[/{id}]` | 마일스톤 CRUD (`?projectId=`) |
| 태스크 | `GET/POST/PUT/DELETE /api/tasks[/{id}]` | 태스크 CRUD (`?milestoneId=`) |
| 개발모듈 | `GET/POST/PUT/DELETE /api/dev-modules[/{id}]` | 개발모듈 백로그 CRUD |
| 매핑 | `GET/POST/PUT/DELETE /api/mappings[/{id}]` | SAP-KMS 필드 매핑 CRUD |
| ACL | `GET/POST/PUT/DELETE /api/acl[/{id}]` | 권한 설계 CRUD |
| 문서카테고리 | `GET /api/doc-categories` | 문서 카테고리 목록 |
| 문서 | `GET/POST/PUT/DELETE /api/documents[/{id}]` | 문서 목록/상세/CRUD (`?categoryCode&partnerCode&keyword`) |
| 문서파일 | `POST /api/documents/{id}/files` | 파일 업로드 (multipart) |
| 문서파일 | `GET /api/documents/{id}/files/{fileId}/content` | 파일 다운로드 |
| 문서파일 | `DELETE /api/documents/{id}/files/{fileId}` | 파일 삭제(soft) |
| SAP연계 | `POST /api/documents/{id}/sap-link` | SAP 전표 연계 등록 |
| SAP연계 | `GET /api/sap-links` | 전체 연계 목록 |
| SAP조회 | `GET /api/sap/lookup?table=&doc_num=` | SAP B1 Service Layer Mock 조회 |
| 인증서 | `GET/POST/DELETE /api/certifications[/{id}]` | 인증서 등록/조회/폐기 (`?partnerCode=`) |
| 리스크(PMS) | `GET/POST/PUT/DELETE /api/risks[/{id}]` | 프로젝트 리스크 CRUD |
| 사례(PMS) | `GET/POST/PUT/DELETE /api/case-studies[/{id}]` | 도입 사례/성과 CRUD |
| 프로젝트(PMS 확장) | `POST/DELETE /api/projects[/{id}]` | 프로젝트 생성/삭제 (기존 GET/PUT에 추가) |
| 인증 | `POST /api/auth/login` | 로그인 (username/password → 토큰+접근가능페이지 목록 발급) |
| 인증 | `POST /api/auth/logout` | 로그아웃 (토큰 무효화) |
| 인증 | `GET /api/auth/me` | 현재 로그인 사용자 정보 조회 |
| 사용자관리 (ADMIN 전용) | `GET/POST/PUT/DELETE /api/users[/{id}]` | 사용자 계정 CRUD |
| 페이지권한 (ADMIN 전용) | `GET /api/page-catalog` | 전체 page_key 목록(9종) 조회 |
| 페이지권한 (ADMIN 전용) | `GET/PUT /api/page-permissions` | 사용자별 페이지 접근권한 조회/설정(upsert) |
| 페이지권한 (ADMIN 전용) | `DELETE /api/page-permissions/{id}` | 페이지 접근권한 삭제 |

> `/api/auth/**`를 제외한 모든 API는 `Authorization: Bearer <token>` 헤더가 필요합니다.
> `/api/users/**`, `/api/page-permissions/**`, `/api/page-catalog`는 `ADMIN` 역할만 호출 가능합니다.

## SAP B1 연동 지점 (운영 전환 시 필수 작업)
`SapLookupController.lookup()` 메서드는 현재 **Mock 데이터**를 반환합니다.
실제 운영 환경에서는 다음 3단계로 구성된 SAP Business One Service Layer 연동으로 교체해야 합니다:
1. `POST /Login` — CompanyDB/UserName/Password로 로그인, 세션 쿠키(`B1SESSION`) 획득
2. 획득한 쿠키를 이후 요청의 `Cookie` 헤더에 첨부
3. `GET /{Entity}({DocEntry})` — 예: `GET /Invoices(1001)` 형태로 전표 데이터 조회

## 알려진 이슈 및 해결 기록
- **Hibernate 스키마 검증 오류** (`use_yn` 컬럼 타입 불일치): V6 마이그레이션으로
  `CHAR(1)` → `VARCHAR(1)`로 통일하여 해결. 엔티티는 `@Column(length = 1)` 유지.
- **PostgreSQL `lower(bytea)` 오류**: `DocumentRepository.search()`의 JPQL에서 null
  파라미터가 바인딩될 때 타입을 추론하지 못하는 문제 → `cast(:param as string)`으로 해결.
- **Vite 403 Blocked request**: 샌드박스 공개 URL 접속 시 Vite의 `allowedHosts` 기본 보안
  정책에 의해 차단됨 → `vite.config.js`에서 `server.allowedHosts: true`로 해결.
  실제 운영 서버에서는 보안을 위해 `true` 대신 구체적인 도메인 목록을 명시하는 것을 권장합니다.
- **CORS Preflight(OPTIONS) 차단**: Spring Security의 `anyRequest().authenticated()` 정책이
  브라우저의 OPTIONS preflight 요청까지 인증 대상으로 처리해 CORS 헤더가 세팅되기 전에
  401/403이 반환되는 문제 → `SecurityConfig`에 `.requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()`
  추가로 해결.
- **로그인 실패 시 빈 에러 응답**: `GlobalExceptionHandler`가 없어 `AuthService`의
  `IllegalArgumentException`이 처리되지 않고 빈 body로 응답되던 문제 → `GlobalExceptionHandler` 추가로
  `ApiResponse.error()` 형식의 명확한 에러 메시지 반환.

## 향후 개선 과제 (미구현)
- 현재 인증은 opaque 토큰(자체 구현) 방식이며, 필요 시 실제 사내 SSO(LDAP/AD, SAML, OAuth2) 연동으로 전환 가능
- SAP B1 Service Layer 실제 연동 (현재 Mock)
- 프론트엔드 운영 빌드(`npm run build`)를 백엔드 정적 리소스 또는 Nginx로 서빙하는 배포 파이프라인 구성
- 파일 저장소를 NAS/공유폴더(UNC 경로) 또는 별도 파일서버로 이전 (현재는 로컬 디스크)
- 감사로그(document_access_logs) 조회 API 및 화면 추가
- 만료된 세션 토큰 자동 정리(scheduled cleanup job) 추가

## 최종 검증 상태 (2026-07-23 기준)
- Flyway 마이그레이션 V1~V8 전체 적용 완료 (V8: users/user_sessions/page_permissions 테이블 + 데모 계정/권한 seed)
- REST API 전체 엔드포인트 curl 검증 완료 (CRUD, 파일 업로드/다운로드, risks/case-studies, 로그인/로그아웃/사용자관리/페이지권한 포함)
- Vue.js 프론트엔드 10개 화면(LoginView, 관리자 화면 2종 포함) + PMS 모듈(`/pms/*`) Playwright 콘솔 검증 완료 (JS 에러 없음)
- PMS 5가지 뷰(테이블/칸반/갤러리/캘린더/리스트) 전환 Playwright 스크린샷 시각 검증 완료
- 로그인/ACL Playwright E2E 검증 완료: 비인증 리다이렉트, 로그인 실패 에러표시, admin 전체권한 접근,
  manager/viewer 역할별 페이지 접근 제한 및 사이드바 메뉴 필터링, 관리자 화면에서 페이지권한 실시간 토글 반영,
  모바일(375px) 로그인/대시보드/드로어 네비게이션 검증
- "미래지기 PMS" 로고(컬러/화이트) 및 브랜딩 전체 적용 완료(App.vue, LoginView, index.html title)
- 프론트-백엔드 CORS 연동 검증 완료(OPTIONS preflight 포함)
