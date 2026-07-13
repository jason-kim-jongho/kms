-- V6: use_yn 컬럼 타입을 CHAR(1) -> VARCHAR(1)로 변경
-- 원인: Hibernate의 ddl-auto=validate가 Java String 필드를 기본적으로 VARCHAR로 검증하는데,
--       V3 마이그레이션에서 CHAR(1)(bpchar)로 생성되어 스키마 검증 오류(SchemaManagementException) 발생.
-- 대상 테이블: document_categories, documents, document_files, certifications

ALTER TABLE document_categories ALTER COLUMN use_yn TYPE VARCHAR(1);
ALTER TABLE documents ALTER COLUMN use_yn TYPE VARCHAR(1);
ALTER TABLE document_files ALTER COLUMN use_yn TYPE VARCHAR(1);
ALTER TABLE certifications ALTER COLUMN use_yn TYPE VARCHAR(1);
