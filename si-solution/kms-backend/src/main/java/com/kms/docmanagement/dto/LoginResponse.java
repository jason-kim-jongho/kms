package com.kms.docmanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@Getter
@AllArgsConstructor
public class LoginResponse {
    private String token;
    private String username;
    private String displayName;
    private String role;
    private List<String> pages; // 접근 가능한 page_key 목록 (ADMIN이면 전체)
}
