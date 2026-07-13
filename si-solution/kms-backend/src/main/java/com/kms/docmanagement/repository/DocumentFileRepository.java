package com.kms.docmanagement.repository;

import com.kms.docmanagement.entity.DocumentFile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface DocumentFileRepository extends JpaRepository<DocumentFile, Long> {

    List<DocumentFile> findByStorageIdAndUseYnOrderByFileIndex(String storageId, String useYn);

    long countByStorageIdAndUseYn(String storageId, String useYn);

    @Query("select coalesce(max(f.fileIndex), 0) from DocumentFile f where f.storageId = :storageId")
    Integer findMaxFileIndex(@Param("storageId") String storageId);

    long countByUseYn(String useYn);

    @Query("select coalesce(sum(f.fileSize), 0) from DocumentFile f where f.useYn = 'Y'")
    Long sumFileSize();
}
