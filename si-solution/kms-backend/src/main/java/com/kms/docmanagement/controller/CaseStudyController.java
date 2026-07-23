package com.kms.docmanagement.controller;

import com.kms.docmanagement.dto.ApiResponse;
import com.kms.docmanagement.entity.CaseStudy;
import com.kms.docmanagement.repository.CaseStudyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/case-studies")
@RequiredArgsConstructor
public class CaseStudyController {

    private final CaseStudyRepository caseStudyRepository;

    @GetMapping
    public ApiResponse<List<CaseStudy>> list() {
        return ApiResponse.ok(caseStudyRepository.findAll());
    }

    @GetMapping("/{id}")
    public ApiResponse<CaseStudy> get(@PathVariable Long id) {
        return ApiResponse.ok(caseStudyRepository.findById(id).orElseThrow());
    }

    @PostMapping
    public ApiResponse<CaseStudy> create(@RequestBody CaseStudy payload) {
        return ApiResponse.ok(caseStudyRepository.save(payload));
    }

    @PutMapping("/{id}")
    public ApiResponse<CaseStudy> update(@PathVariable Long id, @RequestBody CaseStudy payload) {
        CaseStudy c = caseStudyRepository.findById(id).orElseThrow();
        c.setProjectId(payload.getProjectId());
        c.setTitle(payload.getTitle());
        c.setCategory(payload.getCategory());
        c.setSummary(payload.getSummary());
        c.setOutcome(payload.getOutcome());
        c.setStatus(payload.getStatus());
        c.setOwner(payload.getOwner());
        c.setPublishedDate(payload.getPublishedDate());
        return ApiResponse.ok(caseStudyRepository.save(c));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        caseStudyRepository.deleteById(id);
        return ApiResponse.ok(null);
    }
}
