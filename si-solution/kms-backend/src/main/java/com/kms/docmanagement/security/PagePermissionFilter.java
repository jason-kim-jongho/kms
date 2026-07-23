package com.kms.docmanagement.security;

import com.kms.docmanagement.entity.PagePermission;
import com.kms.docmanagement.repository.PagePermissionRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;

/**
 * TokenAuthenticationFilter 이후 실행되어, 인증된 USER 역할 사용자가
 * page_key에 매핑된 /api/** 경로에 접근할 때 page_permissions 화이트리스트를 검사한다.
 * ADMIN은 항상 통과. /api/auth/**, /api/page-catalog 등 공용 경로는 통과.
 */
@Component
@RequiredArgsConstructor
public class PagePermissionFilter extends OncePerRequestFilter {

    private final PagePermissionRepository pagePermissionRepository;

    // API 경로 접두사 → page_key 매핑 (프론트 라우트와 1:1 대응)
    private static final Map<String, String> API_PREFIX_TO_PAGE = Map.ofEntries(
            Map.entry("/api/dashboard", "dashboard"),
            Map.entry("/api/pms", "pms"),
            Map.entry("/api/projects", "pms"),
            Map.entry("/api/milestones", "pms"),
            Map.entry("/api/tasks", "pms"),
            Map.entry("/api/dev-modules", "dev-modules"),
            Map.entry("/api/mappings", "mapping"),
            Map.entry("/api/acl", "acl"),
            Map.entry("/api/documents-dashboard", "documents"),
            Map.entry("/api/documents", "documents"),
            Map.entry("/api/sap-links", "documents"),
            Map.entry("/api/sap", "sap-lookup"),
            Map.entry("/api/certifications", "certifications"),
            Map.entry("/api/risks", "pms"),
            Map.entry("/api/case-studies", "pms"),
            Map.entry("/api/doc-categories", "documents")
    );

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                     @NonNull HttpServletResponse response,
                                     @NonNull FilterChain filterChain) throws ServletException, IOException {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        String path = request.getRequestURI();

        if (auth != null && auth.isAuthenticated() && auth.getPrincipal() instanceof AuthenticatedUser user) {
            if (!"ADMIN".equals(user.getRole())) {
                String matchedPage = null;
                for (var entry : API_PREFIX_TO_PAGE.entrySet()) {
                    if (path.startsWith(entry.getKey())) {
                        matchedPage = entry.getValue();
                        break;
                    }
                }
                if (matchedPage != null) {
                    boolean allowed = pagePermissionRepository
                            .findByUsernameAndPageKey(user.getUsername(), matchedPage)
                            .map(PagePermission::getAllowed)
                            .orElse(false);
                    if (!allowed) {
                        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                        response.setContentType("application/json;charset=UTF-8");
                        response.getWriter().write("{\"success\":false,\"data\":null,\"message\":\"해당 페이지에 대한 접근 권한이 없습니다.\"}");
                        return;
                    }
                }
            }
        }
        filterChain.doFilter(request, response);
    }
}
