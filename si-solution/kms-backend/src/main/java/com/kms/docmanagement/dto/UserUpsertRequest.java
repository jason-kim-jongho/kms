package com.kms.docmanagement.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserUpsertRequest {
    private String username;
    private String password;    // 신규 생성 시 필수, 수정 시 비어있으면 변경 안함
    private String displayName;
    private String email;
    private String role;        // ADMIN | USER
    private Boolean isActive;
}
