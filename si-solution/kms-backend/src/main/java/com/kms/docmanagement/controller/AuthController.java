package com.kms.docmanagement.controller;

import com.kms.docmanagement.dto.ApiResponse;
import com.kms.docmanagement.dto.LoginRequest;
import com.kms.docmanagement.dto.LoginResponse;
import com.kms.docmanagement.dto.UserDto;
import com.kms.docmanagement.repository.UserRepository;
import com.kms.docmanagement.security.AuthenticatedUser;
import com.kms.docmanagement.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UserRepository userRepository;

    @PostMapping("/login")
    public ApiResponse<LoginResponse> login(@RequestBody LoginRequest req) {
        return ApiResponse.ok(authService.login(req));
    }

    @PostMapping("/logout")
    public ApiResponse<Void> logout(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        String token = (authHeader != null && authHeader.startsWith("Bearer ")) ? authHeader.substring(7).trim() : null;
        authService.logout(token);
        return ApiResponse.ok(null);
    }

    @GetMapping("/me")
    public ApiResponse<LoginResponse> me(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof AuthenticatedUser principal)) {
            return ApiResponse.error("인증되지 않았습니다.");
        }
        var user = userRepository.findByUsername(principal.getUsername()).orElseThrow();
        List<String> pages = authService.resolveAccessiblePages(user);
        return ApiResponse.ok(new LoginResponse(null, user.getUsername(), user.getDisplayName(), user.getRole(), pages));
    }
}
