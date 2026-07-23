package com.kms.docmanagement.config;

import com.kms.docmanagement.security.PagePermissionFilter;
import com.kms.docmanagement.security.TokenAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * 인증/인가 정책.
 * - /api/auth/login, /api/auth/health 는 공개(permitAll)
 * - 그 외 /api/** 는 TokenAuthenticationFilter가 세팅한 인증 정보가 있어야 접근 가능
 * - 사용자 관리(/api/users/**), 페이지권한 관리(/api/page-permissions/**)는 ADMIN 역할만 접근 가능
 * - PagePermissionFilter가 USER 역할 사용자에 대해 페이지별 화이트리스트를 추가로 검사
 */
@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final TokenAuthenticationFilter tokenAuthenticationFilter;
    private final PagePermissionFilter pagePermissionFilter;

    @Bean
    public BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/users/**", "/api/page-permissions/**", "/api/page-catalog").hasRole("ADMIN")
                .anyRequest().authenticated()
            )
            .httpBasic(httpBasic -> httpBasic.disable())
            .formLogin(formLogin -> formLogin.disable())
            .exceptionHandling(eh -> eh
                .authenticationEntryPoint((request, response, ex) -> {
                    response.setStatus(401);
                    response.setContentType("application/json;charset=UTF-8");
                    response.getWriter().write("{\"success\":false,\"data\":null,\"message\":\"로그인이 필요합니다.\"}");
                })
                .accessDeniedHandler((request, response, ex) -> {
                    response.setStatus(403);
                    response.setContentType("application/json;charset=UTF-8");
                    response.getWriter().write("{\"success\":false,\"data\":null,\"message\":\"접근 권한이 없습니다.\"}");
                })
            )
            .addFilterBefore(tokenAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterAfter(pagePermissionFilter, TokenAuthenticationFilter.class);
        return http.build();
    }
}
