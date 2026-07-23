package com.kms.docmanagement.security;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 프론트엔드 라우트 최상위 구획과 매핑되는 "페이지" 카탈로그.
 * 사용자ID별 페이지 접근권한(page_permissions.page_key)의 화이트리스트 기준이 된다.
 * ADMIN 역할은 이 카탈로그와 무관하게 항상 전체 접근이 허용된다.
 */
public final class PageCatalog {

    private PageCatalog() {}

    public static final Map<String, String> PAGES = new LinkedHashMap<>();

    static {
        PAGES.put("dashboard", "통합 대시보드");
        PAGES.put("pms", "PMS (다중 뷰)");
        PAGES.put("roadmap", "3개월 로드맵");
        PAGES.put("dev-modules", "개발모듈 백로그");
        PAGES.put("mapping", "SAP-KMS 매핑");
        PAGES.put("acl", "권한(ACL) 설계");
        PAGES.put("documents", "문서관리(DMS)");
        PAGES.put("sap-lookup", "SAP 조회");
        PAGES.put("certifications", "인증서 관리");
    }
}
