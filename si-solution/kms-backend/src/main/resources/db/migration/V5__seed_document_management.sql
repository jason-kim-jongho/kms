-- ============================================================
-- V5__seed_document_management.sql
-- 문서관리(DMS) 모듈 시드 데이터
-- ============================================================

INSERT INTO document_categories (id, category_code, category_name, parent_code, requires_sap_link, retention_years, description, sort_order) VALUES
(1, 'TAX_INVOICE_AP', '세금계산서(매입)', NULL, true, 5, 'SAP OPCH(AP Invoice) 연계 매입 세금계산서', 1),
(2, 'TAX_INVOICE_AR', '세금계산서(매출)', NULL, true, 5, 'SAP OINV(AR Invoice) 연계 매출 세금계산서', 2),
(3, 'PURCHASE_ORDER', '발주서', NULL, true, 5, 'SAP OPOR(Purchase Order) 연계 발주서', 3),
(4, 'SALES_ORDER', '수주서', NULL, true, 5, 'SAP ORDR(Sales Order) 연계 수주서', 4),
(5, 'CONTRACT', '계약서', NULL, false, 10, 'SAP OCTR 연계 또는 법무팀 자체 계약서', 5),
(6, 'GRPO', '입고증', NULL, true, 3, 'SAP OPDN(GRPO) 연계 입고증', 6),
(7, 'CERT', '인증서', NULL, false, 3, '협력사 제출 인증서(ISO/사업자등록증/품질보증서 등)', 7),
(8, 'INSPECTION_REPORT', '검사성적서', NULL, false, 5, '수입검사/품질검사 성적서', 8),
(9, 'HR_DOCUMENT', '인사문서', NULL, false, 10, '인사팀 내부문서(근로계약서 등)', 9),
(10, 'ETC', '기타문서', NULL, false, 1, '기타 분류되지 않은 문서', 10);
SELECT setval('document_categories_id_seq', 10, true);

INSERT INTO documents (id, storage_id, title, category_code, doc_type, business_partner_code, business_partner_name, file_no, unc_path_ref, status, remark, post_user_id, post_user_name, post_date, company_code, use_yn) VALUES
(1, 'A1B2C3D4', '삼성전자(주) 매입 세금계산서 2026-07', 'TAX_INVOICE_AP', '세금계산서(매입)', 'V10001', '삼성전자(주)', 'AP-100234', '\\SAPFILE\AP\Invoice\100234\', 'active', '7월 정기 매입건', 'kim01', '김영희', '2026-07-05 09:12:00', 'UNT', 'Y'),
(2, 'E5F6G7H8', '(주)한국물류 발주서 PO-2026-0715', 'PURCHASE_ORDER', '발주서', 'V10002', '(주)한국물류', 'PO-200088', '\\SAPFILE\Purchasing\PO\200088\', 'active', '원재료 발주', 'lee02', '이철수', '2026-07-10 14:20:00', 'UNT', 'Y'),
(3, 'I9J0K1L2', '대한전자 수주서 SO-2026-0708', 'SALES_ORDER', '수주서', 'C20001', '대한전자', 'SO-300045', '\\SAPFILE\Sales\SO\300045\', 'active', '7월 정기수주', 'park03', '박민준', '2026-07-08 11:05:00', 'UNT', 'Y'),
(4, 'M3N4O5P6', '(주)미래산업 물품공급계약서', 'CONTRACT', '계약서', 'V10003', '(주)미래산업', NULL, '\\SAPFILE\Legal\Contract\CT-2026-011\', 'active', '1년 단위 갱신계약, 만료 2027-06-30', 'jung04', '정수아', '2026-06-28 10:00:00', 'UNT', 'Y'),
(5, 'Q7R8S9T0', '(주)한국물류 입고증 GRPO-450012', 'GRPO', '입고증', 'V10002', '(주)한국물류', 'GRPO-450012', '\\SAPFILE\Warehouse\GRPO\450012\', 'active', NULL, 'kim01', '김영희', '2026-07-12 16:40:00', 'UNT', 'Y'),
(6, 'U1V2W3X4', '삼성전자(주) ISO9001 인증서', 'CERT', '인증서', 'V10001', '삼성전자(주)', NULL, NULL, 'active', '2026-2029 유효', 'partner_v10001', '삼성전자(주) 담당자', '2026-06-01 09:00:00', 'UNT', 'Y'),
(7, 'Y5Z6A7B8', '(주)한국물류 사업자등록증', 'CERT', '인증서', 'V10002', '(주)한국물류', NULL, NULL, 'active', NULL, 'partner_v10002', '한국물류 담당자', '2026-05-15 13:22:00', 'UNT', 'Y'),
(8, 'C9D0E1F2', '원자재 D-RM001 수입검사 성적서', 'INSPECTION_REPORT', '검사성적서', 'V10001', '삼성전자(주)', NULL, NULL, 'active', '배치번호 관리 대상', 'jung04', '정수아', '2026-07-11 08:30:00', 'UNT', 'Y'),
(9, 'G3H4I5J6', '(주)미래산업 매입 세금계산서 2026-07', 'TAX_INVOICE_AP', '세금계산서(매입)', 'V10003', '(주)미래산업', 'AP-100235', '\\SAPFILE\AP\Invoice\100235\', 'active', NULL, 'kim01', '김영희', '2026-07-14 09:50:00', 'UNT', 'Y'),
(10, 'K7L8M9N0', '대한전자 매출 세금계산서 2026-07', 'TAX_INVOICE_AR', '세금계산서(매출)', 'C20001', '대한전자', NULL, NULL, 'active', 'File No. 미부여 - 누락 확인 필요', 'park03', '박민준', '2026-07-13 15:10:00', 'UNT', 'Y');
SELECT setval('documents_id_seq', 10, true);

-- 문서 파일: storage_path 는 SI 환경 기준 로컬(NAS) 저장 경로. 실제 파일은 애플리케이션 실행 시 storage.root 하위에 업로드되어야 하며,
-- 시드 데이터는 메타데이터 참조용(실물 파일 부재 시 다운로드 404 처리는 정상 동작).
INSERT INTO document_files (id, storage_id, file_index, file_name, original_file_name, storage_path, file_type, mime_type, file_size, post_user_id, post_user_name, post_date, use_yn) VALUES
(1, 'A1B2C3D4', 1, 'tax_invoice_100234.pdf', '삼성전자_세금계산서_202607.pdf', '/data/kms-storage/A1B2C3D4/tax_invoice_100234.pdf', 'DOCUMENT', 'application/pdf', 245678, 'kim01', '김영희', '2026-07-05 09:12:00', 'Y'),
(2, 'E5F6G7H8', 1, 'po_200088.pdf', '한국물류_발주서_PO200088.pdf', '/data/kms-storage/E5F6G7H8/po_200088.pdf', 'DOCUMENT', 'application/pdf', 189234, 'lee02', '이철수', '2026-07-10 14:20:00', 'Y'),
(3, 'I9J0K1L2', 1, 'so_300045.pdf', '대한전자_수주서_SO300045.pdf', '/data/kms-storage/I9J0K1L2/so_300045.pdf', 'DOCUMENT', 'application/pdf', 156789, 'park03', '박민준', '2026-07-08 11:05:00', 'Y'),
(4, 'M3N4O5P6', 1, 'contract_2026_011.pdf', '미래산업_공급계약서_CT2026011.pdf', '/data/kms-storage/M3N4O5P6/contract_2026_011.pdf', 'DOCUMENT', 'application/pdf', 567890, 'jung04', '정수아', '2026-06-28 10:00:00', 'Y'),
(5, 'M3N4O5P6', 2, 'contract_2026_011_appendix.pdf', '미래산업_공급계약서_부속서.pdf', '/data/kms-storage/M3N4O5P6/contract_2026_011_appendix.pdf', 'DOCUMENT', 'application/pdf', 98765, 'jung04', '정수아', '2026-06-28 10:05:00', 'Y'),
(6, 'Q7R8S9T0', 1, 'grpo_450012.pdf', '한국물류_입고증_GRPO450012.pdf', '/data/kms-storage/Q7R8S9T0/grpo_450012.pdf', 'DOCUMENT', 'application/pdf', 134567, 'kim01', '김영희', '2026-07-12 16:40:00', 'Y'),
(7, 'U1V2W3X4', 1, 'iso9001_samsung.pdf', '삼성전자_ISO9001인증서.pdf', '/data/kms-storage/U1V2W3X4/iso9001_samsung.pdf', 'DOCUMENT', 'application/pdf', 345678, 'partner_v10001', '삼성전자(주) 담당자', '2026-06-01 09:00:00', 'Y'),
(8, 'Y5Z6A7B8', 1, 'biz_license_hanguk.pdf', '한국물류_사업자등록증.pdf', '/data/kms-storage/Y5Z6A7B8/biz_license_hanguk.pdf', 'DOCUMENT', 'application/pdf', 87654, 'partner_v10002', '한국물류 담당자', '2026-05-15 13:22:00', 'Y'),
(9, 'C9D0E1F2', 1, 'inspection_drm001.pdf', 'D-RM001_수입검사성적서.pdf', '/data/kms-storage/C9D0E1F2/inspection_drm001.pdf', 'DOCUMENT', 'application/pdf', 223456, 'jung04', '정수아', '2026-07-11 08:30:00', 'Y'),
(10, 'C9D0E1F2', 2, 'inspection_drm001_photo.jpg', '검사현장사진.jpg', '/data/kms-storage/C9D0E1F2/inspection_drm001_photo.jpg', 'IMAGE', 'image/jpeg', 1567890, 'jung04', '정수아', '2026-07-11 08:32:00', 'Y'),
(11, 'G3H4I5J6', 1, 'tax_invoice_100235.pdf', '미래산업_세금계산서_202607.pdf', '/data/kms-storage/G3H4I5J6/tax_invoice_100235.pdf', 'DOCUMENT', 'application/pdf', 198765, 'kim01', '김영희', '2026-07-14 09:50:00', 'Y'),
(12, 'K7L8M9N0', 1, 'tax_invoice_dae_han.pdf', '대한전자_세금계산서_202607.pdf', '/data/kms-storage/K7L8M9N0/tax_invoice_dae_han.pdf', 'DOCUMENT', 'application/pdf', 176543, 'park03', '박민준', '2026-07-13 15:10:00', 'Y');
SELECT setval('document_files_id_seq', 12, true);

INSERT INTO sap_document_links (id, document_id, sap_table, sap_doc_entry, sap_doc_num, sap_card_code, link_status, linked_by, linked_at, notes) VALUES
(1, 1, 'OPCH', '100234', '100234', 'V10001', 'linked', 'kim01', '2026-07-05 09:15:00', NULL),
(2, 2, 'OPOR', '200088', '200088', 'V10002', 'linked', 'lee02', '2026-07-10 14:25:00', NULL),
(3, 3, 'ORDR', '300045', '300045', 'C20001', 'linked', 'park03', '2026-07-08 11:10:00', NULL),
(4, 5, 'OPDN', '450012', '450012', 'V10002', 'linked', 'kim01', '2026-07-12 16:45:00', NULL),
(5, 9, 'OPCH', '100235', '100235', 'V10003', 'linked', 'kim01', '2026-07-14 09:55:00', NULL),
(6, 10, 'OINV', NULL, '(미확인)', 'C20001', 'missing', NULL, '2026-07-13 15:10:00', 'SAP OINV 전표번호 미확인 - File No. 미부여 상태, 누락 점검 대상');
SELECT setval('sap_document_links_id_seq', 6, true);

INSERT INTO certifications (id, document_id, cert_type, business_partner_code, business_partner_name, issue_date, expiry_date, remark, status, submitted_by, submitted_at, use_yn) VALUES
(1, 6, 'ISO9001', 'V10001', '삼성전자(주)', '2026-06-01', '2029-05-31', '품질경영시스템 인증', 'active', 'partner_v10001', '2026-06-01 09:00:00', 'Y'),
(2, 7, '사업자등록증', 'V10002', '(주)한국물류', '2020-03-15', NULL, NULL, 'active', 'partner_v10002', '2026-05-15 13:22:00', 'Y');
SELECT setval('certifications_id_seq', 2, true);

-- 만료 임박 인증서 데모용 1건 추가 (오늘 기준 +30일)
INSERT INTO certifications (id, document_id, cert_type, business_partner_code, business_partner_name, issue_date, expiry_date, remark, status, submitted_by, submitted_at, use_yn) VALUES
(3, 8, 'ISO14001', 'V10001', '삼성전자(주)', '2023-08-01', CURRENT_DATE + INTERVAL '30 day', '환경경영시스템 인증 - 갱신 필요', 'active', 'partner_v10001', '2023-08-01 09:00:00', 'Y');
SELECT setval('certifications_id_seq', 3, true);

INSERT INTO document_access_logs (id, document_id, action, actor_id, actor_name, actor_group, ip_address, action_at) VALUES
(1, 1, 'upload', 'kim01', '김영희', '재무팀', '192.168.0.45', '2026-07-05 09:12:00'),
(2, 1, 'view', 'lee02', '이철수', '재무팀', '192.168.0.52', '2026-07-06 10:20:00'),
(3, 4, 'view', 'exec01', '경영진', '경영진', '192.168.0.10', '2026-07-09 09:00:00'),
(4, 6, 'download', 'kim01', '김영희', '재무팀', '192.168.0.45', '2026-07-02 11:30:00'),
(5, 10, 'view', 'park03', '박민준', '영업팀', '192.168.0.60', '2026-07-13 15:20:00');
SELECT setval('document_access_logs_id_seq', 5, true);
