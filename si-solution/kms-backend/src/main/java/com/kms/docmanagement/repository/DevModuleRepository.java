package com.kms.docmanagement.repository;

import com.kms.docmanagement.entity.DevModule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DevModuleRepository extends JpaRepository<DevModule, Long> {
    List<DevModule> findByRiskLevelIn(List<String> riskLevels);
}
