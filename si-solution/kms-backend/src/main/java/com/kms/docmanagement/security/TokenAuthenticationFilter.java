package com.kms.docmanagement.security;

import com.kms.docmanagement.entity.User;
import com.kms.docmanagement.entity.UserSession;
import com.kms.docmanagement.repository.UserRepository;
import com.kms.docmanagement.repository.UserSessionRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Authorization: Bearer <token> 헤더를 조회하여 user_sessions 테이블과 대조,
 * 유효한 토큰이면 SecurityContext에 AuthenticatedUser를 principal로 세팅한다.
 * (JWT 미사용 - opaque 토큰을 DB에 저장하는 단순 세션 방식)
 */
@Component
@RequiredArgsConstructor
public class TokenAuthenticationFilter extends OncePerRequestFilter {

    private final UserSessionRepository userSessionRepository;
    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                     @NonNull HttpServletResponse response,
                                     @NonNull FilterChain filterChain) throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7).trim();
            Optional<UserSession> sessionOpt = userSessionRepository.findByToken(token);
            if (sessionOpt.isPresent() && sessionOpt.get().getExpiresAt().isAfter(LocalDateTime.now())) {
                UserSession session = sessionOpt.get();
                Optional<User> userOpt = userRepository.findByUsername(session.getUsername());
                if (userOpt.isPresent() && Boolean.TRUE.equals(userOpt.get().getIsActive())) {
                    User user = userOpt.get();
                    AuthenticatedUser principal = new AuthenticatedUser(
                            user.getId(), user.getUsername(), user.getDisplayName(), user.getRole());
                    var authorities = List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole()));
                    var authentication = new UsernamePasswordAuthenticationToken(principal, null, authorities);
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                }
            }
        }
        filterChain.doFilter(request, response);
    }
}
