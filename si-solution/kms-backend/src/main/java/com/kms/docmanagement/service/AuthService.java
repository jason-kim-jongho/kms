package com.kms.docmanagement.service;

import com.kms.docmanagement.dto.LoginRequest;
import com.kms.docmanagement.dto.LoginResponse;
import com.kms.docmanagement.entity.PagePermission;
import com.kms.docmanagement.entity.User;
import com.kms.docmanagement.entity.UserSession;
import com.kms.docmanagement.repository.PagePermissionRepository;
import com.kms.docmanagement.repository.UserRepository;
import com.kms.docmanagement.repository.UserSessionRepository;
import com.kms.docmanagement.security.PageCatalog;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AuthService {

    private static final long SESSION_TTL_HOURS = 12;
    private final SecureRandom secureRandom = new SecureRandom();

    private final UserRepository userRepository;
    private final UserSessionRepository userSessionRepository;
    private final PagePermissionRepository pagePermissionRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    @Transactional
    public LoginResponse login(LoginRequest req) {
        if (req.getUsername() == null || req.getPassword() == null) {
            throw new IllegalArgumentException("아이디와 비밀번호를 입력해 주세요.");
        }
        User user = userRepository.findByUsername(req.getUsername().trim())
                .orElseThrow(() -> new IllegalArgumentException("아이디 또는 비밀번호가 올바르지 않습니다."));

        if (!Boolean.TRUE.equals(user.getIsActive())) {
            throw new IllegalArgumentException("비활성화된 계정입니다. 관리자에게 문의해 주세요.");
        }
        if (!passwordEncoder.matches(req.getPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("아이디 또는 비밀번호가 올바르지 않습니다.");
        }

        String token = generateToken();
        UserSession session = new UserSession();
        session.setToken(token);
        session.setUsername(user.getUsername());
        session.setExpiresAt(LocalDateTime.now().plusHours(SESSION_TTL_HOURS));
        userSessionRepository.save(session);

        List<String> pages = resolveAccessiblePages(user);
        return new LoginResponse(token, user.getUsername(), user.getDisplayName(), user.getRole(), pages);
    }

    @Transactional
    public void logout(String token) {
        if (token != null) {
            userSessionRepository.deleteByToken(token);
        }
    }

    public List<String> resolveAccessiblePages(User user) {
        if ("ADMIN".equals(user.getRole())) {
            return List.copyOf(PageCatalog.PAGES.keySet());
        }
        return pagePermissionRepository.findByUsername(user.getUsername()).stream()
                .filter(PagePermission::getAllowed)
                .map(PagePermission::getPageKey)
                .toList();
    }

    private String generateToken() {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
