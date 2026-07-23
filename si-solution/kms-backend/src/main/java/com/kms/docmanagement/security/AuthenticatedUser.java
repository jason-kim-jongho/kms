package com.kms.docmanagement.security;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * 토큰 인증 필터에서 SecurityContext에 담기는 인증 주체(principal).
 */
@Getter
@AllArgsConstructor
public class AuthenticatedUser {
    private final Long id;
    private final String username;
    private final String displayName;
    private final String role; // ADMIN | USER
}
