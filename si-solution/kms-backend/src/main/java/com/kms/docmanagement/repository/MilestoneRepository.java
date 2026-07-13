package com.kms.docmanagement.repository;

import com.kms.docmanagement.entity.Milestone;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MilestoneRepository extends JpaRepository<Milestone, Long> {
    List<Milestone> findByProjectIdOrderByMonthNo(Long projectId);
    List<Milestone> findAllByOrderByMonthNo();
}
