package com.kms.docmanagement.controller;

import com.kms.docmanagement.dto.ApiResponse;
import com.kms.docmanagement.entity.AclDesign;
import com.kms.docmanagement.repository.AclDesignRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/acl")
@RequiredArgsConstructor
public class AclDesignController {

    private final AclDesignRepository aclDesignRepository;

    @GetMapping
    public ApiResponse<List<AclDesign>> list() {
        return ApiResponse.ok(aclDesignRepository.findAll());
    }

    @PostMapping
    public ApiResponse<AclDesign> create(@RequestBody AclDesign payload) {
        return ApiResponse.ok(aclDesignRepository.save(payload));
    }

    @PutMapping("/{id}")
    public ApiResponse<AclDesign> update(@PathVariable Long id, @RequestBody AclDesign payload) {
        AclDesign a = aclDesignRepository.findById(id).orElseThrow();
        a.setGroupName(payload.getGroupName());
        a.setRoleName(payload.getRoleName());
        a.setDocType(payload.getDocType());
        a.setPermissionRead(payload.getPermissionRead());
        a.setPermissionWrite(payload.getPermissionWrite());
        a.setPermissionDelete(payload.getPermissionDelete());
        a.setPermissionShare(payload.getPermissionShare());
        a.setScopeNote(payload.getScopeNote());
        a.setStatus(payload.getStatus());
        return ApiResponse.ok(aclDesignRepository.save(a));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        aclDesignRepository.deleteById(id);
        return ApiResponse.ok(null);
    }
}
