-- ============================================================
-- 0003_document_management.sql
-- 문서관리(DMS) 모듈: scm_solution 백엔드(FileStorage/Certification/EDReport 패턴) 분석 기반 설계
-- R2 오브젝트 스토리지 + D1 메타데이터, SAP B1 문서(전표/협력사)와 연계
-- ============================================================

-- 1) 문서 유형(카테고리) 마스터
-- scm_solution의 FileCategory(문서/이미지/검사성적서) + 인증서 유형(CR 코드) 통합 확장
CREATE TABLE IF NOT EXISTS document_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_code TEXT NOT NULL UNIQUE, -- TAX_INVOICE, PO, CONTRACT, CERT, INSPECTION_REPORT, ETC ...
  category_name TEXT NOT NULL,        -- 세금계산서, 발주서, 계약서, 인증서, 검사성적서 ...
  parent_code TEXT,                   -- 상위 분류 (없으면 NULL)
  requires_sap_link INTEGER NOT NULL DEFAULT 0, -- SAP 전표 연계가 필수인 유형인지
  retention_years INTEGER,            -- 보관 연한(년)
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  use_yn TEXT NOT NULL DEFAULT 'Y',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2) 문서(스토리지 그룹) — scm_solution의 storageId(8자리) 그룹 개념을 문서 단위로 승격
CREATE TABLE IF NOT EXISTS documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  storage_id TEXT NOT NULL UNIQUE,     -- 8자리 랜덤 스토리지 그룹 ID (scm_solution 방식 계승)
  title TEXT NOT NULL,
  category_code TEXT NOT NULL,
  doc_type TEXT,                       -- 세금계산서(매입)/세금계산서(매출)/발주서/계약서/인증서 등 (표시용, sap_teedy_mapping.doc_type과 정합)
  business_partner_code TEXT,          -- SAP CardCode (협력사)
  business_partner_name TEXT,
  file_no TEXT,                        -- Teedy 커스텀 메타데이터 "File No." 대응 필드
  unc_path_ref TEXT,                   -- 기존 UNC 경로(과거 자료) 참조용, 이전 완료 후 비움
  status TEXT NOT NULL DEFAULT 'active', -- active | archived | deleted
  remark TEXT,
  post_user_id TEXT,
  post_user_name TEXT,
  post_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  company_code TEXT,                   -- 등록 회사 코드 (유니테크형 멀티컴퍼니 대응)
  use_yn TEXT NOT NULL DEFAULT 'Y',
  deleted_at DATETIME,
  deleted_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_code) REFERENCES document_categories(category_code)
);

-- 3) 문서 파일 — scm_solution FileStorage(@W_KIS_STORAGE) 엔티티에 대응, R2 object key 저장
CREATE TABLE IF NOT EXISTS document_files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  storage_id TEXT NOT NULL,            -- documents.storage_id FK
  file_index INTEGER NOT NULL,         -- 스토리지 그룹 내 순번 (scm_solution U_FILEIDX 계승)
  file_name TEXT NOT NULL,             -- 저장 파일명(중복 시 rename)
  original_file_name TEXT NOT NULL,    -- 업로드 원본 파일명
  r2_object_key TEXT NOT NULL,         -- R2 object key: documents/{storage_id}/{file_name}
  file_type TEXT NOT NULL DEFAULT 'OTHERS', -- IMAGE | VIDEO | DOCUMENT | OTHERS (scm_solution UploadFileType 계승)
  mime_type TEXT,
  file_size INTEGER,                   -- bytes
  post_user_id TEXT,
  post_user_name TEXT,
  post_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  use_yn TEXT NOT NULL DEFAULT 'Y',
  deleted_at DATETIME,
  deleted_by TEXT,
  FOREIGN KEY (storage_id) REFERENCES documents(storage_id)
);

-- 4) SAP B1 전표 연계 — 문서(storage_id) ↔ SAP 문서(테이블/DocEntry/DocNum) 링크
-- sap_teedy_mapping 정의서에 따라 실제 전표와 스캔 문서를 매칭
CREATE TABLE IF NOT EXISTS sap_document_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  document_id INTEGER NOT NULL,
  sap_table TEXT NOT NULL,             -- OPCH, OINV, OPOR, ORDR, OCTR, OPDN ...
  sap_doc_entry TEXT,                  -- SAP DocEntry (내부키)
  sap_doc_num TEXT NOT NULL,           -- SAP DocNum (전표번호) - File No. 매핑 기준
  sap_card_code TEXT,                  -- 거래처 코드
  link_status TEXT NOT NULL DEFAULT 'linked', -- linked | missing | pending_review
  linked_by TEXT,
  linked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  FOREIGN KEY (document_id) REFERENCES documents(id)
);

-- 5) 인증서(협력사) 관리 — scm_solution CertModule/Certification 엔티티 계승
-- 협력사가 제출하는 인증서(품질/ISO/사업자등록증 등)를 문서(storage_id)에 연결하여 관리
CREATE TABLE IF NOT EXISTS certifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  document_id INTEGER NOT NULL,
  cert_type TEXT NOT NULL,             -- ISO9001 / ISO14001 / 사업자등록증 / 품질보증서 등
  business_partner_code TEXT NOT NULL, -- SAP CardCode
  business_partner_name TEXT,
  issue_date DATE,
  expiry_date DATE,                    -- 만료일 (알림 대상)
  remark TEXT,
  status TEXT NOT NULL DEFAULT 'active', -- active | expired | revoked
  submitted_by TEXT,
  submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  use_yn TEXT NOT NULL DEFAULT 'Y',
  FOREIGN KEY (document_id) REFERENCES documents(id)
);

-- 6) 문서 접근 로그(감사 추적) — acl_design 권한 체계의 실제 적용 이력
CREATE TABLE IF NOT EXISTS document_access_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  document_id INTEGER NOT NULL,
  action TEXT NOT NULL,                -- view | download | upload | delete | share
  actor_id TEXT,
  actor_name TEXT,
  actor_group TEXT,                    -- acl_design.group_name 대응
  ip_address TEXT,
  action_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (document_id) REFERENCES documents(id)
);

CREATE INDEX IF NOT EXISTS idx_documents_storage ON documents(storage_id);
CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category_code);
CREATE INDEX IF NOT EXISTS idx_documents_partner ON documents(business_partner_code);
CREATE INDEX IF NOT EXISTS idx_documents_fileno ON documents(file_no);
CREATE INDEX IF NOT EXISTS idx_document_files_storage ON document_files(storage_id);
CREATE INDEX IF NOT EXISTS idx_sap_links_document ON sap_document_links(document_id);
CREATE INDEX IF NOT EXISTS idx_sap_links_docnum ON sap_document_links(sap_doc_num);
CREATE INDEX IF NOT EXISTS idx_certifications_document ON certifications(document_id);
CREATE INDEX IF NOT EXISTS idx_certifications_partner ON certifications(business_partner_code);
CREATE INDEX IF NOT EXISTS idx_access_logs_document ON document_access_logs(document_id);
