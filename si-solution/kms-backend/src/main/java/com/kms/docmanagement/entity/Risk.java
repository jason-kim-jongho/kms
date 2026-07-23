package com.kms.docmanagement.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 프로젝트 위험(Risk) 관리 테이블.
 * Notion/Airtable 스타일 PMS UI에서 카테고리/심각도/상태별로 조회, 칸반보드로 관리하는 엔티티.
 */
@Entity
@Table(name = "risks")
@Getter
@Setter
public class Risk {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "project_id")
    private Long projectId;

    @Column(nullable = false, length = 300)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, length = 50)
    private String category = "technical"; // technical | schedule | resource | vendor | quality | security

    @Column(nullable = false, length = 20)
    private String severity = "medium"; // low | medium | high | critical

    @Column(nullable = false, length = 20)
    private String probability = "medium"; // low | medium | high

    @Column(nullable = false, length = 20)
    private String status = "identified"; // identified | monitoring | mitigating | resolved

    @Column(length = 100)
    private String owner;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Column(columnDefinition = "TEXT")
    private String mitigation;

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
