package com.kms.docmanagement.controller;

import com.kms.docmanagement.dto.ApiResponse;
import com.kms.docmanagement.dto.PagePermissionUpsertRequest;
import com.kms.docmanagement.entity.PagePermission;
import com.kms.docmanagement.repository.PagePermissionRepository;
import com.kms.docmanagement.security.PageCatalog;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 페이지별(page_key) 사용자ID(username) 단위 접근권한 관리 API.
 * SecurityConfig에서 ADMIN 역할만 접근하도록 제한됨.
 */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class PagePermissionController {

    private final PagePermissionRepository pagePermissionRepository;

    @GetMapping("/page-catalog")
    public ApiResponse<Map<String, String>> pageCatalog() {
        return ApiResponse.ok(PageCatalog.PAGES);
    }

    @GetMapping("/page-permissions")
    public ApiResponse<List<PagePermission>> list(@RequestParam(required = false) String username) {
        if (username != null && !username.isBlank()) {
            return ApiResponse.ok(pagePermissionRepository.findByUsername(username));
        }
        return ApiResponse.ok(pagePermissionRepository.findAll());
    }

    /** username + pageKey 조합에 대해 allowed 값을 upsert(있으면 갱신, 없으면 생성) */
    @PutMapping("/page-permissions")
    public ApiResponse<PagePermission> upsert(@RequestBody PagePermissionUpsertRequest req) {
        PagePermission pp = pagePermissionRepository
                .findByUsernameAndPageKey(req.getUsername(), req.getPageKey())
                .orElseGet(() -> {
                    PagePermission p = new PagePermission();
                    p.setUsername(req.getUsername());
                    p.setPageKey(req.getPageKey());
                    return p;
                });
        pp.setAllowed(req.getAllowed() != null && req.getAllowed());
        return ApiResponse.ok(pagePermissionRepository.save(pp));
    }

    @DeleteMapping("/page-permissions/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        pagePermissionRepository.deleteById(id);
        return ApiResponse.ok(null);
    }
}
