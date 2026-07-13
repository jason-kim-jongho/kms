package com.kms.docmanagement.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "certifications")
@Getter
@Setter
public class Certification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "document_id", nullable = false)
    private Long documentId;

    @Column(name = "cert_type", nullable = false, length = 100)
    private String certType;

    @Column(name = "business_partner_code", nullable = false, length = 50)
    private String businessPartnerCode;

    @Column(name = "business_partner_name", length = 200)
    private String businessPartnerName;

    @Column(name = "issue_date")
    private LocalDate issueDate;

    @Column(name = "expiry_date")
    private LocalDate expiryDate;

    @Column(columnDefinition = "TEXT")
    private String remark;

    @Column(nullable = false, length = 20)
    private String status = "active";

    @Column(name = "submitted_by", length = 100)
    private String submittedBy;

    @Column(name = "submitted_at", nullable = false)
    private LocalDateTime submittedAt;

    @Column(name = "use_yn", nullable = false, length = 1)
    private String useYn = "Y";

    @PrePersist
    void prePersist() {
        if (submittedAt == null) submittedAt = LocalDateTime.now();
    }
}
