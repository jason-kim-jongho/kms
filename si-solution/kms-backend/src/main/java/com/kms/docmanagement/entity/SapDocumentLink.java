package com.kms.docmanagement.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "sap_document_links")
@Getter
@Setter
public class SapDocumentLink {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "document_id", nullable = false)
    private Long documentId;

    @Column(name = "sap_table", nullable = false, length = 20)
    private String sapTable;

    @Column(name = "sap_doc_entry", length = 50)
    private String sapDocEntry;

    @Column(name = "sap_doc_num", nullable = false, length = 50)
    private String sapDocNum;

    @Column(name = "sap_card_code", length = 50)
    private String sapCardCode;

    @Column(name = "link_status", nullable = false, length = 20)
    private String linkStatus = "linked";

    @Column(name = "linked_by", length = 50)
    private String linkedBy;

    @Column(name = "linked_at", nullable = false)
    private LocalDateTime linkedAt;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @PrePersist
    void prePersist() {
        if (linkedAt == null) linkedAt = LocalDateTime.now();
    }
}
