package com.kms.docmanagement.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "dev_modules")
@Getter
@Setter
public class DevModule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "project_id", nullable = false)
    private Long projectId;

    @Column(name = "module_key", nullable = false, unique = true, length = 100)
    private String moduleKey;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 50)
    private String category;

    @Column(nullable = false, length = 20)
    private String status = "backlog";

    @Column(name = "risk_level", nullable = false, length = 20)
    private String riskLevel = "low";

    @Column(name = "risk_note", columnDefinition = "TEXT")
    private String riskNote;

    @Column(nullable = false)
    private Integer progress = 0;

    @Column(length = 100)
    private String owner;

    @Column(name = "planned_month")
    private Integer plannedMonth;

    @Column(name = "target_milestone_id")
    private Long targetMilestoneId;

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
