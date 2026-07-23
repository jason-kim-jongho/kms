package com.kms.docmanagement.controller;

import com.kms.docmanagement.dto.ApiResponse;
import com.kms.docmanagement.dto.UserDto;
import com.kms.docmanagement.dto.UserUpsertRequest;
import com.kms.docmanagement.entity.User;
import com.kms.docmanagement.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 사용자 계정 관리 API. SecurityConfig에서 ADMIN 역할만 접근하도록 제한됨.
 */
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    @GetMapping
    public ApiResponse<List<UserDto>> list() {
        return ApiResponse.ok(userRepository.findAll().stream().map(UserDto::from).toList());
    }

    @PostMapping
    public ApiResponse<UserDto> create(@RequestBody UserUpsertRequest req) {
        if (req.getUsername() == null || req.getUsername().isBlank()) {
            return ApiResponse.error("아이디를 입력해 주세요.");
        }
        if (userRepository.existsByUsername(req.getUsername().trim())) {
            return ApiResponse.error("이미 존재하는 아이디입니다.");
        }
        if (req.getPassword() == null || req.getPassword().isBlank()) {
            return ApiResponse.error("비밀번호를 입력해 주세요.");
        }
        User u = new User();
        u.setUsername(req.getUsername().trim());
        u.setPasswordHash(passwordEncoder.encode(req.getPassword()));
        u.setDisplayName(req.getDisplayName() != null ? req.getDisplayName() : req.getUsername());
        u.setEmail(req.getEmail());
        u.setRole(req.getRole() != null ? req.getRole() : "USER");
        u.setIsActive(req.getIsActive() == null || req.getIsActive());
        return ApiResponse.ok(UserDto.from(userRepository.save(u)));
    }

    @PutMapping("/{id}")
    public ApiResponse<UserDto> update(@PathVariable Long id, @RequestBody UserUpsertRequest req) {
        User u = userRepository.findById(id).orElseThrow();
        if (req.getDisplayName() != null) u.setDisplayName(req.getDisplayName());
        if (req.getEmail() != null) u.setEmail(req.getEmail());
        if (req.getRole() != null) u.setRole(req.getRole());
        if (req.getIsActive() != null) u.setIsActive(req.getIsActive());
        if (req.getPassword() != null && !req.getPassword().isBlank()) {
            u.setPasswordHash(passwordEncoder.encode(req.getPassword()));
        }
        return ApiResponse.ok(UserDto.from(userRepository.save(u)));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        userRepository.deleteById(id);
        return ApiResponse.ok(null);
    }
}
