package com.kms.docmanagement.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "sap_teedy_mapping")
@Getter
@Setter
public class SapTeedyMapping {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "project_id", nullable = false)
    private Long projectId;

    @Column(name = "sap_table", nullable = false, length = 50)
    private String sapTable;

    @Column(name = "sap_field", nullable = false, length = 100)
    private String sapField;

    @Column(name = "sap_field_desc", length = 300)
    private String sapFieldDesc;

    @Column(name = "teedy_metadata_name", nullable = false, length = 100)
    private String teedyMetadataName;

    @Column(name = "teedy_metadata_type", nullable = false, length = 20)
    private String teedyMetadataType = "STRING";

    @Column(name = "doc_type", length = 100)
    private String docType;

    @Column(name = "unc_path_pattern", length = 500)
    private String uncPathPattern;

    @Column(name = "mapping_status", nullable = false, length = 20)
    private String mappingStatus = "draft";

    @Column(name = "is_required", nullable = false)
    private Boolean isRequired = true;

    @Column(columnDefinition = "TEXT")
    private String notes;

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
