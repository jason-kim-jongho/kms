package com.kms.docmanagement.repository;

import com.kms.docmanagement.entity.DocumentAccessLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DocumentAccessLogRepository extends JpaRepository<DocumentAccessLog, Long> {
}
