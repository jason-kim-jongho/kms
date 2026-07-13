package com.kms.docmanagement.controller;

import com.kms.docmanagement.dto.ApiResponse;
import com.kms.docmanagement.entity.DocumentEntity;
import com.kms.docmanagement.entity.SapDocumentLink;
import com.kms.docmanagement.repository.DocumentRepository;
import com.kms.docmanagement.repository.SapDocumentLinkRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/sap-links")
@RequiredArgsConstructor
public class SapDocumentLinkController {

    private final SapDocumentLinkRepository sapDocumentLinkRepository;
    private final DocumentRepository documentRepository;

    @GetMapping
    public ApiResponse<List<Map<String, Object>>> list() {
        List<SapDocumentLink> links = sapDocumentLinkRepository.findAll();
        List<Map<String, Object>> rows = links.stream().map(link -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("link", link);
            DocumentEntity doc = documentRepository.findById(link.getDocumentId()).orElse(null);
            row.put("document_title", doc != null ? doc.getTitle() : null);
            row.put("storage_id", doc != null ? doc.getStorageId() : null);
            return row;
        }).collect(Collectors.toList());
        return ApiResponse.ok(rows);
    }
}
