package com.kms.docmanagement.controller;

import com.kms.docmanagement.dto.ApiResponse;
import com.kms.docmanagement.entity.SapTeedyMapping;
import com.kms.docmanagement.repository.SapTeedyMappingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/mappings")
@RequiredArgsConstructor
public class SapTeedyMappingController {

    private final SapTeedyMappingRepository mappingRepository;

    @GetMapping
    public ApiResponse<List<SapTeedyMapping>> list() {
        return ApiResponse.ok(mappingRepository.findAll());
    }

    @PostMapping
    public ApiResponse<SapTeedyMapping> create(@RequestBody SapTeedyMapping payload) {
        return ApiResponse.ok(mappingRepository.save(payload));
    }

    @PutMapping("/{id}")
    public ApiResponse<SapTeedyMapping> update(@PathVariable Long id, @RequestBody SapTeedyMapping payload) {
        SapTeedyMapping m = mappingRepository.findById(id).orElseThrow();
        m.setSapTable(payload.getSapTable());
        m.setSapField(payload.getSapField());
        m.setSapFieldDesc(payload.getSapFieldDesc());
        m.setTeedyMetadataName(payload.getTeedyMetadataName());
        m.setTeedyMetadataType(payload.getTeedyMetadataType());
        m.setDocType(payload.getDocType());
        m.setUncPathPattern(payload.getUncPathPattern());
        m.setMappingStatus(payload.getMappingStatus());
        m.setIsRequired(payload.getIsRequired());
        m.setNotes(payload.getNotes());
        return ApiResponse.ok(mappingRepository.save(m));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        mappingRepository.deleteById(id);
        return ApiResponse.ok(null);
    }
}
