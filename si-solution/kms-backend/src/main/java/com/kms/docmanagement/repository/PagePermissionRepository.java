package com.kms.docmanagement.repository;

import com.kms.docmanagement.entity.PagePermission;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PagePermissionRepository extends JpaRepository<PagePermission, Long> {
    List<PagePermission> findByUsername(String username);
    Optional<PagePermission> findByUsernameAndPageKey(String username, String pageKey);
    void deleteByUsernameAndPageKey(String username, String pageKey);
}
