package com.kms.docmanagement.repository;

import com.kms.docmanagement.entity.Task;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findByMilestoneId(Long milestoneId);

    long countByStatus(String status);

    @org.springframework.data.jpa.repository.Query(
        "select avg(t.progress) from Task t")
    Double avgProgress();
}
