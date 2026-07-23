package com.kms.docmanagement.dto;

import com.kms.docmanagement.entity.User;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class UserDto {
    private Long id;
    private String username;
    private String displayName;
    private String email;
    private String role;
    private Boolean isActive;

    public static UserDto from(User u) {
        return new UserDto(u.getId(), u.getUsername(), u.getDisplayName(), u.getEmail(), u.getRole(), u.getIsActive());
    }
}
