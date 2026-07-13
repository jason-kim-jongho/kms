package com.kms.docmanagement.controller;

import com.kms.docmanagement.dto.ApiResponse;
import com.kms.docmanagement.entity.Certification;
import com.kms.docmanagement.repository.CertificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/certifications")
@RequiredArgsConstructor
public class CertificationController {

    private final CertificationRepository certificationRepository;

    @GetMapping
    public ApiResponse<List<Certification>> list(@RequestParam(required = false) String partnerCode) {
        List<Certification> result = (partnerCode != null)
                ? certificationRepository.findByBusinessPartnerCodeAndUseYn(partnerCode, "Y")
                : certificationRepository.findByUseYn("Y");
        return ApiResponse.ok(result);
    }

    @PostMapping
    public ApiResponse<Certification> create(@RequestBody Certification payload) {
        if (payload.getStatus() == null) payload.setStatus("active");
        if (payload.getUseYn() == null) payload.setUseYn("Y");
        return ApiResponse.ok(certificationRepository.save(payload));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> revoke(@PathVariable Long id) {
        Certification c = certificationRepository.findById(id).orElseThrow();
        c.setStatus("revoked");
        certificationRepository.save(c);
        return ApiResponse.ok(null);
    }
}
