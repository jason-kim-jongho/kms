package com.kms.docmanagement.repository;

import com.kms.docmanagement.entity.DocumentCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DocumentCategoryRepository extends JpaRepository<DocumentCategory, Long> {
    List<DocumentCategory> findByUseYnOrderBySortOrder(String useYn);
}
