package com.kms.docmanagement.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PagePermissionUpsertRequest {
    private String username;
    private String pageKey;
    private Boolean allowed;
}
