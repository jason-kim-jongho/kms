package com.kms.docmanagement.repository;

import com.kms.docmanagement.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProjectRepository extends JpaRepository<Project, Long> {
}
