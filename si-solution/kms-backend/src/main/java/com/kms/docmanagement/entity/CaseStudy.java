package com.kms.docmanagement.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 프로젝트 적용 사례/벤치마크(Case Study) 테이블.
 * Notion/Airtable 스타일 PMS UI의 갤러리(카드) 뷰로 대표되는 데이터.
 */
@Entity
@Table(name = "case_studies")
@Getter
@Setter
public class CaseStudy {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "project_id")
    private Long projectId;

    @Column(nullable = false, length = 300)
    private String title;

    @Column(length = 50)
    private String category; // integration | governance | automation | ux | ai

    @Column(columnDefinition = "TEXT")
    private String summary;

    @Column(columnDefinition = "TEXT")
    private String outcome;

    @Column(nullable = false, length = 20)
    private String status = "draft"; // draft | published | archived

    @Column(length = 100)
    private String owner;

    @Column(name = "published_date")
    private LocalDate publishedDate;

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
