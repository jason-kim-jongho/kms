# KMS SI Solution — Spring Boot + PostgreSQL + Vue.js

## 프로젝트 개요
- **이름**: KMS (SAP B1 연계 문서관리시스템) — On-Premise SI Edition
- **목적**: `/home/user/webapp`의 Cloudflare Workers(Hono + D1 + R2) 기반 솔루션과 **동일한 기능**을
  일반적인 사내(On-Premise) SI 구축 방식으로 재구현한 버전입니다.
  클라우드 서버리스가 아닌, 전통적인 3-tier(프론트엔드 / 백엔드 서버 / DB 서버) 아키텍처로
  사내 서버·VM에 직접 설치하여 운영하는 것을 전제로 합니다.
- **핵심 기능**:
  1. 3개월 프로젝트 로드맵(마일스톤/태스크) 관리
  2. 개발모듈 백로그 및 리스크 관리
  3. SAP B1 ↔ KMS 메타데이터 매핑 관리
  4. 문서유형별 권한(ACL) 설계 관리
  5. 문서관리시스템(DMS): 문서 등록/파일 업로드·다운로드/SAP 전표 연계/인증서 관리

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

## 디렉터리 구조
```
si-solution/
├── kms-backend/                 # Spring Boot 백엔드
│   ├── pom.xml
│   └── src/main/
│       ├── java/com/kms/docmanagement/
│       │   ├── entity/          # JPA 엔티티 12종
│       │   ├── repository/      # Spring Data JPA 리포지토리 12종
│       │   ├── controller/      # REST 컨트롤러 12종
│       │   ├── service/         # FileStorageService (로컬 파일 저장)
│       │   ├── config/          # WebConfig(CORS), SecurityConfig
│       │   └── dto/             # ApiResponse
│       └── resources/
│           ├── application.properties
│           └── db/migration/    # Flyway 마이그레이션 V1~V6
├── kms-frontend/                # Vue.js 3 프론트엔드
│   └── src/
│       ├── views/                # 9개 화면
│       ├── components/           # 공용 컴포넌트
│       ├── api/                  # axios 기반 API 클라이언트
│       └── router/
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
`db/migration/` 하위 `V1__initial_schema.sql` ~ `V6__fix_use_yn_column_type.sql`을
순서대로 적용합니다. 최초 실행 시 로드맵/개발모듈/문서관리 예시(seed) 데이터도 함께 삽입됩니다.

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

## 향후 개선 과제 (미구현)
- Spring Security를 실제 JWT/사내 SSO 인증으로 전환 (현재는 `permitAll()` 개방 상태)
- SAP B1 Service Layer 실제 연동 (현재 Mock)
- 프론트엔드 운영 빌드(`npm run build`)를 백엔드 정적 리소스 또는 Nginx로 서빙하는 배포 파이프라인 구성
- 파일 저장소를 NAS/공유폴더(UNC 경로) 또는 별도 파일서버로 이전 (현재는 로컬 디스크)
- 감사로그(document_access_logs) 조회 API 및 화면 추가

## 최종 검증 상태 (2026-07-13 기준)
- Flyway 마이그레이션 V1~V6 전체 적용 완료
- REST API 전체 엔드포인트 curl 검증 완료 (CRUD, 파일 업로드/다운로드 포함)
- Vue.js 프론트엔드 9개 화면 Playwright 콘솔 검증 완료 (JS 에러 없음)
- 프론트-백엔드 CORS 연동 검증 완료
