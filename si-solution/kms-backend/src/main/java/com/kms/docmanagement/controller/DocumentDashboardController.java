package com.kms.docmanagement.controller;

import com.kms.docmanagement.dto.ApiResponse;
import com.kms.docmanagement.entity.*;
import com.kms.docmanagement.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/documents-dashboard")
@RequiredArgsConstructor
public class DocumentDashboardController {

    private final DocumentRepository documentRepository;
    private final DocumentFileRepository documentFileRepository;
    private final DocumentCategoryRepository categoryRepository;
    private final CertificationRepository certificationRepository;

    @GetMapping
    public ApiResponse<Map<String, Object>> dashboard() {
        long totalDocs = documentRepository.countByUseYn("Y");
        long totalFiles = documentFileRepository.countByUseYn("Y");
        Long totalSize = documentFileRepository.sumFileSize();

        List<DocumentCategory> categories = categoryRepository.findByUseYnOrderBySortOrder("Y");
        List<DocumentEntity> allDocs = documentRepository.search(null, null, null);

        List<Map<String, Object>> byCategory = categories.stream().map(cat -> {
            Map<String, Object> row = new LinkedHashMap<>();
            long count = allDocs.stream().filter(d -> cat.getCategoryCode().equals(d.getCategoryCode())).count();
            row.put("category_code", cat.getCategoryCode());
            row.put("category_name", cat.getCategoryName());
            row.put("document_count", count);
            return row;
        }).collect(Collectors.toList());

        List<Certification> allCerts = certificationRepository.findByUseYn("Y");
        long activeCerts = allCerts.stream().filter(c -> "active".equals(c.getStatus())).count();

        LocalDate threshold = LocalDate.now().plusDays(90);
        List<Certification> expiring = certificationRepository.findExpiringBy(threshold);

        Map<String, Object> certStats = new LinkedHashMap<>();
        certStats.put("total", allCerts.size());
        certStats.put("active", activeCerts);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("total_documents", totalDocs);
        result.put("total_files", totalFiles);
        result.put("total_size_bytes", totalSize == null ? 0 : totalSize);
        result.put("by_category", byCategory);
        result.put("cert_stats", certStats);
        result.put("expiring_certifications", expiring);
        return ApiResponse.ok(result);
    }
}
