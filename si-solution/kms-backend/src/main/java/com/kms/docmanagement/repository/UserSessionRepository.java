package com.kms.docmanagement.repository;

import com.kms.docmanagement.entity.UserSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.Optional;

public interface UserSessionRepository extends JpaRepository<UserSession, Long> {
    Optional<UserSession> findByToken(String token);
    void deleteByToken(String token);
    void deleteByExpiresAtBefore(LocalDateTime time);
}
