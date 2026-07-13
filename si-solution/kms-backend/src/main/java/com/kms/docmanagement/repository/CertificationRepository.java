package com.kms.docmanagement.repository;

import com.kms.docmanagement.entity.Certification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface CertificationRepository extends JpaRepository<Certification, Long> {

    List<Certification> findByBusinessPartnerCodeAndUseYn(String partnerCode, String useYn);

    List<Certification> findByUseYn(String useYn);

    @Query("""
        select c from Certification c
        where c.useYn = 'Y' and c.status = 'active' and c.expiryDate is not null
          and c.expiryDate <= :threshold
        order by c.expiryDate asc
        """)
    List<Certification> findExpiringBy(@Param("threshold") LocalDate threshold);

    long countByUseYnAndStatus(String useYn, String status);
}
