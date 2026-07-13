package com.kms.docmanagement.controller;

import com.kms.docmanagement.dto.ApiResponse;
import com.kms.docmanagement.entity.DevModule;
import com.kms.docmanagement.repository.DevModuleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/dev-modules")
@RequiredArgsConstructor
public class DevModuleController {

    private final DevModuleRepository devModuleRepository;

    @GetMapping
    public ApiResponse<List<DevModule>> list() {
        return ApiResponse.ok(devModuleRepository.findAll());
    }

    @PostMapping
    public ApiResponse<DevModule> create(@RequestBody DevModule payload) {
        return ApiResponse.ok(devModuleRepository.save(payload));
    }

    @PutMapping("/{id}")
    public ApiResponse<DevModule> update(@PathVariable Long id, @RequestBody DevModule payload) {
        DevModule m = devModuleRepository.findById(id).orElseThrow();
        m.setName(payload.getName());
        m.setDescription(payload.getDescription());
        m.setCategory(payload.getCategory());
        m.setStatus(payload.getStatus());
        m.setRiskLevel(payload.getRiskLevel());
        m.setRiskNote(payload.getRiskNote());
        m.setProgress(payload.getProgress());
        m.setOwner(payload.getOwner());
        m.setPlannedMonth(payload.getPlannedMonth());
        return ApiResponse.ok(devModuleRepository.save(m));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        devModuleRepository.deleteById(id);
        return ApiResponse.ok(null);
    }
}
