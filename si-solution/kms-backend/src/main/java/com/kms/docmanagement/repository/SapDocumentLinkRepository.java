package com.kms.docmanagement.repository;

import com.kms.docmanagement.entity.SapDocumentLink;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SapDocumentLinkRepository extends JpaRepository<SapDocumentLink, Long> {
    List<SapDocumentLink> findByDocumentId(Long documentId);
    List<SapDocumentLink> findByLinkStatus(String linkStatus);
    long countByLinkStatus(String linkStatus);
}
