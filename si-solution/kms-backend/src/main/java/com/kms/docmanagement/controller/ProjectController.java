package com.kms.docmanagement.controller;

import com.kms.docmanagement.dto.ApiResponse;
import com.kms.docmanagement.entity.Project;
import com.kms.docmanagement.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectRepository projectRepository;

    @GetMapping
    public ApiResponse<List<Project>> list() {
        return ApiResponse.ok(projectRepository.findAll());
    }

    @GetMapping("/{id}")
    public ApiResponse<Project> get(@PathVariable Long id) {
        return ApiResponse.ok(projectRepository.findById(id).orElseThrow());
    }

    @PostMapping
    public ApiResponse<Project> create(@RequestBody Project payload) {
        return ApiResponse.ok(projectRepository.save(payload));
    }

    @PutMapping("/{id}")
    public ApiResponse<Project> update(@PathVariable Long id, @RequestBody Project payload) {
        Project p = projectRepository.findById(id).orElseThrow();
        p.setName(payload.getName());
        p.setDescription(payload.getDescription());
        p.setStartDate(payload.getStartDate());
        p.setEndDate(payload.getEndDate());
        p.setStatus(payload.getStatus());
        p.setPriority(payload.getPriority());
        p.setOwner(payload.getOwner());
        p.setTargetDate(payload.getTargetDate());
        p.setProgressPct(payload.getProgressPct());
        p.setAiStatusSummary(payload.getAiStatusSummary());
        return ApiResponse.ok(projectRepository.save(p));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        projectRepository.deleteById(id);
        return ApiResponse.ok(null);
    }
}
