package com.kms.docmanagement.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * 문서 파일 — scm_solution FileStorage(@W_KIS_STORAGE) 엔티티에 대응.
 * SI(On-premise) 환경에서는 R2 대신 로컬/NAS 파일시스템 경로(storagePath)를 저장한다.
 */
@Entity
@Table(name = "document_files")
@Getter
@Setter
public class DocumentFile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "storage_id", nullable = false, length = 16)
    private String storageId;

    @Column(name = "file_index", nullable = false)
    private Integer fileIndex;

    @Column(name = "file_name", nullable = false, length = 300)
    private String fileName;

    @Column(name = "original_file_name", nullable = false, length = 300)
    private String originalFileName;

    @Column(name = "storage_path", nullable = false, length = 1000)
    private String storagePath;

    @Column(name = "file_type", nullable = false, length = 20)
    private String fileType = "OTHERS";

    @Column(name = "mime_type", length = 150)
    private String mimeType;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "post_user_id", length = 50)
    private String postUserId;

    @Column(name = "post_user_name", length = 100)
    private String postUserName;

    @Column(name = "post_date", nullable = false)
    private LocalDateTime postDate;

    @Column(name = "use_yn", nullable = false, length = 1)
    private String useYn = "Y";

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @Column(name = "deleted_by", length = 50)
    private String deletedBy;

    @PrePersist
    void prePersist() {
        if (postDate == null) postDate = LocalDateTime.now();
    }
}
