package com.kms.docmanagement.controller;

import com.kms.docmanagement.dto.ApiResponse;
import com.kms.docmanagement.entity.Task;
import com.kms.docmanagement.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskRepository taskRepository;

    @GetMapping
    public ApiResponse<List<Task>> list(@RequestParam(required = false) Long milestoneId) {
        List<Task> result = (milestoneId != null)
                ? taskRepository.findByMilestoneId(milestoneId)
                : taskRepository.findAll();
        return ApiResponse.ok(result);
    }

    @PostMapping
    public ApiResponse<Task> create(@RequestBody Task payload) {
        return ApiResponse.ok(taskRepository.save(payload));
    }

    @PutMapping("/{id}")
    public ApiResponse<Task> update(@PathVariable Long id, @RequestBody Task payload) {
        Task t = taskRepository.findById(id).orElseThrow();
        t.setTitle(payload.getTitle());
        t.setDescription(payload.getDescription());
        t.setOwner(payload.getOwner());
        t.setStatus(payload.getStatus());
        t.setPriority(payload.getPriority());
        t.setStartDate(payload.getStartDate());
        t.setDueDate(payload.getDueDate());
        t.setProgress(payload.getProgress());
        return ApiResponse.ok(taskRepository.save(t));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        taskRepository.deleteById(id);
        return ApiResponse.ok(null);
    }
}
