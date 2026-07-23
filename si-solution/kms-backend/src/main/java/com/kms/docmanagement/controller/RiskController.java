package com.kms.docmanagement.controller;

import com.kms.docmanagement.dto.ApiResponse;
import com.kms.docmanagement.entity.Risk;
import com.kms.docmanagement.repository.RiskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/risks")
@RequiredArgsConstructor
public class RiskController {

    private final RiskRepository riskRepository;

    @GetMapping
    public ApiResponse<List<Risk>> list() {
        return ApiResponse.ok(riskRepository.findAll());
    }

    @GetMapping("/{id}")
    public ApiResponse<Risk> get(@PathVariable Long id) {
        return ApiResponse.ok(riskRepository.findById(id).orElseThrow());
    }

    @PostMapping
    public ApiResponse<Risk> create(@RequestBody Risk payload) {
        return ApiResponse.ok(riskRepository.save(payload));
    }

    @PutMapping("/{id}")
    public ApiResponse<Risk> update(@PathVariable Long id, @RequestBody Risk payload) {
        Risk r = riskRepository.findById(id).orElseThrow();
        r.setProjectId(payload.getProjectId());
        r.setName(payload.getName());
        r.setDescription(payload.getDescription());
        r.setCategory(payload.getCategory());
        r.setSeverity(payload.getSeverity());
        r.setProbability(payload.getProbability());
        r.setStatus(payload.getStatus());
        r.setOwner(payload.getOwner());
        r.setDueDate(payload.getDueDate());
        r.setMitigation(payload.getMitigation());
        return ApiResponse.ok(riskRepository.save(r));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        riskRepository.deleteById(id);
        return ApiResponse.ok(null);
    }
}
