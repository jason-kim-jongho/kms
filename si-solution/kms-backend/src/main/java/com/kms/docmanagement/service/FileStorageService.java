package com.kms.docmanagement.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.SecureRandom;

/**
 * 로컬(NAS/서버 디스크) 파일 스토리지 서비스.
 * scm_solution StorageModule 의 storageId(8자리) + file_index 그룹핑 패턴을 계승하되,
 * Cloudflare R2 대신 On-prem 로컬 파일시스템 경로({storage.root}/{storageId}/{fileName})를 사용한다.
 */
@Service
public class FileStorageService {

    private static final String ALPHANUMERIC = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    @Value("${kms.storage.root}")
    private String storageRoot;

    public String generateStorageId() {
        StringBuilder sb = new StringBuilder(8);
        for (int i = 0; i < 8; i++) {
            sb.append(ALPHANUMERIC.charAt(RANDOM.nextInt(ALPHANUMERIC.length())));
        }
        return sb.toString();
    }

    public String getExt(String fileName) {
        if (fileName == null || !fileName.contains(".")) return "";
        return fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase();
    }

    public String classifyFileType(String ext) {
        if (ext == null) return "OTHERS";
        switch (ext.toLowerCase()) {
            case "jpg": case "jpeg": case "png": case "gif": case "bmp": case "webp":
                return "IMAGE";
            case "mp4": case "avi": case "mov": case "wmv": case "mkv":
                return "VIDEO";
            case "pdf": case "doc": case "docx": case "xls": case "xlsx": case "ppt": case "pptx": case "txt": case "hwp":
                return "DOCUMENT";
            default:
                return "OTHERS";
        }
    }

    /** 파일을 {storageRoot}/{storageId}/{fileName} 경로에 저장하고 절대경로를 반환한다. */
    public String store(String storageId, String fileName, MultipartFile file) throws IOException {
        Path dir = Paths.get(storageRoot, storageId);
        Files.createDirectories(dir);
        Path target = dir.resolve(fileName);
        file.transferTo(target);
        return target.toAbsolutePath().toString();
    }

    public InputStream read(String storagePath) throws IOException {
        return Files.newInputStream(Paths.get(storagePath));
    }

    public boolean delete(String storagePath) {
        try {
            return Files.deleteIfExists(Paths.get(storagePath));
        } catch (IOException e) {
            return false;
        }
    }

    /** 동일 파일명이 이미 존재하면 (1), (2) ... 접미사를 붙여 중복을 방지한다 (scm_solution FileUtil 패턴 계승). */
    public String dedupeFileName(String storageId, String originalFileName) {
        Path dir = Paths.get(storageRoot, storageId);
        String base = originalFileName;
        String ext = "";
        int dot = originalFileName.lastIndexOf('.');
        if (dot > 0) {
            base = originalFileName.substring(0, dot);
            ext = originalFileName.substring(dot);
        }
        String candidate = originalFileName;
        int idx = 1;
        while (Files.exists(dir.resolve(candidate))) {
            candidate = base + "(" + idx + ")" + ext;
            idx++;
        }
        return candidate;
    }
}
