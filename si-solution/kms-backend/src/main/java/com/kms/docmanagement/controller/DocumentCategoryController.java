package com.kms.docmanagement.controller;

import com.kms.docmanagement.dto.ApiResponse;
import com.kms.docmanagement.entity.DocumentCategory;
import com.kms.docmanagement.repository.DocumentCategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/doc-categories")
@RequiredArgsConstructor
public class DocumentCategoryController {

    private final DocumentCategoryRepository categoryRepository;

    @GetMapping
    public ApiResponse<List<DocumentCategory>> list() {
        return ApiResponse.ok(categoryRepository.findByUseYnOrderBySortOrder("Y"));
    }
}
