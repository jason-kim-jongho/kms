package com.kms.docmanagement.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * 문서(스토리지 그룹) 마스터.
 * scm_solution 의 storageId(8자리) 그룹 개념을 문서 단위로 승격한 엔티티.
 * 테이블명이 예약어(documents)와 충돌하지 않도록 클래스명은 DocumentEntity 사용.
 */
@Entity
@Table(name = "documents")
@Getter
@Setter
public class DocumentEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "storage_id", nullable = false, unique = true, length = 16)
    private String storageId;

    @Column(nullable = false, length = 300)
    private String title;

    @Column(name = "category_code", nullable = false, length = 50)
    private String categoryCode;

    @Column(name = "doc_type", length = 100)
    private String docType;

    @Column(name = "business_partner_code", length = 50)
    private String businessPartnerCode;

    @Column(name = "business_partner_name", length = 200)
    private String businessPartnerName;

    @Column(name = "file_no", length = 100)
    private String fileNo;

    @Column(name = "unc_path_ref", length = 500)
    private String uncPathRef;

    @Column(nullable = false, length = 20)
    private String status = "active";

    @Column(columnDefinition = "TEXT")
    private String remark;

    @Column(name = "post_user_id", length = 50)
    private String postUserId;

    @Column(name = "post_user_name", length = 100)
    private String postUserName;

    @Column(name = "post_date", nullable = false)
    private LocalDateTime postDate;

    @Column(name = "company_code", length = 20)
    private String companyCode;

    @Column(name = "use_yn", nullable = false, length = 1)
    private String useYn = "Y";

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @Column(name = "deleted_by", length = 50)
    private String deletedBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
        if (postDate == null) postDate = now;
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
