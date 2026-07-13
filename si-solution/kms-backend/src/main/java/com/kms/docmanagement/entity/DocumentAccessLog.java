package com.kms.docmanagement.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "document_access_logs")
@Getter
@Setter
public class DocumentAccessLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "document_id", nullable = false)
    private Long documentId;

    @Column(nullable = false, length = 20)
    private String action;

    @Column(name = "actor_id", length = 50)
    private String actorId;

    @Column(name = "actor_name", length = 100)
    private String actorName;

    @Column(name = "actor_group", length = 100)
    private String actorGroup;

    @Column(name = "ip_address", length = 50)
    private String ipAddress;

    @Column(name = "action_at", nullable = false)
    private LocalDateTime actionAt;

    @PrePersist
    void prePersist() {
        if (actionAt == null) actionAt = LocalDateTime.now();
    }
}
