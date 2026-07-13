package com.kms.docmanagement.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "acl_design")
@Getter
@Setter
public class AclDesign {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "project_id", nullable = false)
    private Long projectId;

    @Column(name = "group_name", nullable = false, length = 100)
    private String groupName;

    @Column(name = "role_name", nullable = false, length = 50)
    private String roleName;

    @Column(name = "doc_type", nullable = false, length = 100)
    private String docType;

    @Column(name = "permission_read", nullable = false)
    private Boolean permissionRead = false;

    @Column(name = "permission_write", nullable = false)
    private Boolean permissionWrite = false;

    @Column(name = "permission_delete", nullable = false)
    private Boolean permissionDelete = false;

    @Column(name = "permission_share", nullable = false)
    private Boolean permissionShare = false;

    @Column(name = "scope_note", length = 300)
    private String scopeNote;

    @Column(nullable = false, length = 20)
    private String status = "draft";

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
