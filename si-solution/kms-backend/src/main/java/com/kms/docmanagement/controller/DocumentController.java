package com.kms.docmanagement.controller;

import com.kms.docmanagement.dto.ApiResponse;
import com.kms.docmanagement.entity.DocumentAccessLog;
import com.kms.docmanagement.entity.DocumentEntity;
import com.kms.docmanagement.entity.DocumentFile;
import com.kms.docmanagement.entity.SapDocumentLink;
import com.kms.docmanagement.repository.*;
import com.kms.docmanagement.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentRepository documentRepository;
    private final DocumentFileRepository documentFileRepository;
    private final SapDocumentLinkRepository sapDocumentLinkRepository;
    private final CertificationRepository certificationRepository;
    private final DocumentAccessLogRepository accessLogRepository;
    private final FileStorageService fileStorageService;

    // ---------------------------------------------------------
    // 목록 / 상세 / 등록 / 수정 / 삭제
    // ---------------------------------------------------------

    @GetMapping
    public ApiResponse<List<Map<String, Object>>> list(
            @RequestParam(required = false) String categoryCode,
            @RequestParam(required = false) String partnerCode,
            @RequestParam(required = false) String keyword) {

        List<DocumentEntity> docs = documentRepository.search(categoryCode, partnerCode, keyword);
        List<Map<String, Object>> rows = docs.stream().map(this::toListRow).collect(Collectors.toList());
        return ApiResponse.ok(rows);
    }

    private Map<String, Object> toListRow(DocumentEntity d) {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("id", d.getId());
        row.put("storage_id", d.getStorageId());
        row.put("title", d.getTitle());
        row.put("category_code", d.getCategoryCode());
        row.put("doc_type", d.getDocType());
        row.put("business_partner_code", d.getBusinessPartnerCode());
        row.put("business_partner_name", d.getBusinessPartnerName());
        row.put("file_no", d.getFileNo());
        row.put("status", d.getStatus());
        row.put("post_date", d.getPostDate());
        long fileCount = documentFileRepository.countByStorageIdAndUseYn(d.getStorageId(), "Y");
        row.put("file_count", fileCount);
        List<SapDocumentLink> links = sapDocumentLinkRepository.findByDocumentId(d.getId());
        row.put("sap_link_status", links.isEmpty() ? null : links.get(0).getLinkStatus());
        return row;
    }

    @GetMapping("/{id}")
    public ApiResponse<Map<String, Object>> detail(@PathVariable Long id) {
        DocumentEntity doc = documentRepository.findById(id).orElseThrow();
        List<DocumentFile> files = documentFileRepository.findByStorageIdAndUseYnOrderByFileIndex(doc.getStorageId(), "Y");
        List<SapDocumentLink> links = sapDocumentLinkRepository.findByDocumentId(id);
        var certs = certificationRepository.findAll().stream()
                .filter(c -> c.getDocumentId().equals(id) && "Y".equals(c.getUseYn()))
                .collect(Collectors.toList());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("document", doc);
        result.put("files", files);
        result.put("sap_links", links);
        result.put("certifications", certs);
        return ApiResponse.ok(result);
    }

    @PostMapping
    public ApiResponse<Map<String, Object>> create(@RequestBody DocumentEntity payload) {
        if (payload.getStorageId() == null || payload.getStorageId().isBlank()) {
            String sid;
            do {
                sid = fileStorageService.generateStorageId();
            } while (documentRepository.findByStorageId(sid).isPresent());
            payload.setStorageId(sid);
        }
        if (payload.getStatus() == null) payload.setStatus("active");
        if (payload.getUseYn() == null) payload.setUseYn("Y");
        DocumentEntity saved = documentRepository.save(payload);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", saved.getId());
        result.put("storage_id", saved.getStorageId());
        return ApiResponse.ok(result);
    }

    @PutMapping("/{id}")
    public ApiResponse<DocumentEntity> update(@PathVariable Long id, @RequestBody DocumentEntity payload) {
        DocumentEntity doc = documentRepository.findById(id).orElseThrow();
        doc.setTitle(payload.getTitle());
        doc.setCategoryCode(payload.getCategoryCode());
        doc.setDocType(payload.getDocType());
        doc.setBusinessPartnerCode(payload.getBusinessPartnerCode());
        doc.setBusinessPartnerName(payload.getBusinessPartnerName());
        doc.setFileNo(payload.getFileNo());
        doc.setUncPathRef(payload.getUncPathRef());
        doc.setStatus(payload.getStatus());
        doc.setRemark(payload.getRemark());
        return ApiResponse.ok(documentRepository.save(doc));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        DocumentEntity doc = documentRepository.findById(id).orElseThrow();
        doc.setUseYn("N");
        doc.setStatus("deleted");
        doc.setDeletedAt(LocalDateTime.now());
        documentRepository.save(doc);
        return ApiResponse.ok(null);
    }

    // ---------------------------------------------------------
    // 파일 업로드 / 다운로드 / 삭제
    // ---------------------------------------------------------

    @PostMapping("/{id}/files")
    public ApiResponse<Map<String, Object>> uploadFile(@PathVariable Long id,
                                                         @RequestParam("file") MultipartFile file) throws IOException {
        DocumentEntity doc = documentRepository.findById(id).orElseThrow();
        String storageId = doc.getStorageId();

        String originalFileName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "unnamed";
        String savedFileName = fileStorageService.dedupeFileName(storageId, originalFileName);
        String ext = fileStorageService.getExt(savedFileName);
        String fileType = fileStorageService.classifyFileType(ext);

        String storagePath = fileStorageService.store(storageId, savedFileName, file);

        int nextIndex = documentFileRepository.findMaxFileIndex(storageId) + 1;

        DocumentFile df = new DocumentFile();
        df.setStorageId(storageId);
        df.setFileIndex(nextIndex);
        df.setFileName(savedFileName);
        df.setOriginalFileName(originalFileName);
        df.setStoragePath(storagePath);
        df.setFileType(fileType);
        df.setMimeType(file.getContentType());
        df.setFileSize(file.getSize());
        DocumentFile saved = documentFileRepository.save(df);

        logAccess(id, "upload", null, null, null);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", saved.getId());
        result.put("file_index", saved.getFileIndex());
        result.put("file_name", saved.getFileName());
        return ApiResponse.ok(result);
    }

    @GetMapping("/{id}/files/{fileId}/content")
    public ResponseEntity<InputStreamResource> downloadFile(@PathVariable Long id, @PathVariable Long fileId) throws IOException {
        DocumentFile df = documentFileRepository.findById(fileId).orElseThrow();
        InputStream is = fileStorageService.read(df.getStoragePath());
        logAccess(id, "download", null, null, null);

        String mime = df.getMimeType() != null ? df.getMimeType() : "application/octet-stream";
        ContentDisposition cd = ContentDisposition.attachment()
                .filename(df.getOriginalFileName(), StandardCharsets.UTF_8)
                .build();

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(mime))
                .header(HttpHeaders.CONTENT_DISPOSITION, cd.toString())
                .body(new InputStreamResource(is));
    }

    @DeleteMapping("/{id}/files/{fileId}")
    public ApiResponse<Void> deleteFile(@PathVariable Long id, @PathVariable Long fileId) {
        DocumentFile df = documentFileRepository.findById(fileId).orElseThrow();
        fileStorageService.delete(df.getStoragePath());
        df.setUseYn("N");
        df.setDeletedAt(LocalDateTime.now());
        documentFileRepository.save(df);
        logAccess(id, "delete", null, null, null);
        return ApiResponse.ok(null);
    }

    // ---------------------------------------------------------
    // SAP 전표 연계
    // ---------------------------------------------------------

    @PostMapping("/{id}/sap-link")
    public ApiResponse<SapDocumentLink> addSapLink(@PathVariable Long id, @RequestBody SapDocumentLink payload) {
        payload.setDocumentId(id);
        if (payload.getLinkStatus() == null) payload.setLinkStatus("linked");
        return ApiResponse.ok(sapDocumentLinkRepository.save(payload));
    }

    private void logAccess(Long documentId, String action, String actorId, String actorName, String actorGroup) {
        DocumentAccessLog log = new DocumentAccessLog();
        log.setDocumentId(documentId);
        log.setAction(action);
        log.setActorId(actorId);
        log.setActorName(actorName);
        log.setActorGroup(actorGroup);
        accessLogRepository.save(log);
    }
}
