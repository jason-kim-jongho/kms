package com.kms.docmanagement.controller;

import com.kms.docmanagement.dto.ApiResponse;
import com.kms.docmanagement.entity.Milestone;
import com.kms.docmanagement.entity.Task;
import com.kms.docmanagement.repository.MilestoneRepository;
import com.kms.docmanagement.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/milestones")
@RequiredArgsConstructor
public class MilestoneController {

    private final MilestoneRepository milestoneRepository;
    private final TaskRepository taskRepository;

    @GetMapping
    public ApiResponse<List<Milestone>> list(@RequestParam(required = false) Long projectId) {
        List<Milestone> result = (projectId != null)
                ? milestoneRepository.findByProjectIdOrderByMonthNo(projectId)
                : milestoneRepository.findAllByOrderByMonthNo();
        return ApiResponse.ok(result);
    }

    @GetMapping("/{id}")
    public ApiResponse<Map<String, Object>> get(@PathVariable Long id) {
        Milestone m = milestoneRepository.findById(id).orElseThrow();
        List<Task> tasks = taskRepository.findByMilestoneId(id);
        Map<String, Object> result = new HashMap<>();
        result.put("milestone", m);
        result.put("tasks", tasks);
        return ApiResponse.ok(result);
    }

    @PostMapping
    public ApiResponse<Milestone> create(@RequestBody Milestone payload) {
        return ApiResponse.ok(milestoneRepository.save(payload));
    }

    @PutMapping("/{id}")
    public ApiResponse<Milestone> update(@PathVariable Long id, @RequestBody Milestone payload) {
        Milestone m = milestoneRepository.findById(id).orElseThrow();
        m.setTitle(payload.getTitle());
        m.setDescription(payload.getDescription());
        m.setStartDate(payload.getStartDate());
        m.setEndDate(payload.getEndDate());
        m.setStatus(payload.getStatus());
        m.setProgress(payload.getProgress());
        return ApiResponse.ok(milestoneRepository.save(m));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        milestoneRepository.deleteById(id);
        return ApiResponse.ok(null);
    }
}
