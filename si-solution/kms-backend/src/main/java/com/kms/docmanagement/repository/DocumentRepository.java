package com.kms.docmanagement.repository;

import com.kms.docmanagement.entity.DocumentEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface DocumentRepository extends JpaRepository<DocumentEntity, Long> {

    Optional<DocumentEntity> findByStorageId(String storageId);

    List<DocumentEntity> findByIdAndUseYn(Long id, String useYn);

    @Query("""
        select d from DocumentEntity d
        where d.useYn = 'Y'
          and (:categoryCode is null or d.categoryCode = cast(:categoryCode as string))
          and (:partnerCode is null or d.businessPartnerCode = cast(:partnerCode as string))
          and (:keyword is null or lower(d.title) like lower(concat('%', cast(:keyword as string), '%'))
               or lower(coalesce(d.fileNo,'')) like lower(concat('%', cast(:keyword as string), '%')))
        order by d.id desc
        """)
    List<DocumentEntity> search(@Param("categoryCode") String categoryCode,
                                 @Param("partnerCode") String partnerCode,
                                 @Param("keyword") String keyword);

    long countByUseYn(String useYn);

    long countByUseYnAndStatus(String useYn, String status);
}
