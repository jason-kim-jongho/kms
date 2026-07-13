package com.kms.docmanagement.controller;

import com.kms.docmanagement.dto.ApiResponse;
import com.kms.docmanagement.entity.*;
import com.kms.docmanagement.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final MilestoneRepository milestoneRepository;
    private final TaskRepository taskRepository;
    private final DevModuleRepository devModuleRepository;
    private final SapTeedyMappingRepository mappingRepository;
    private final AclDesignRepository aclDesignRepository;
    private final DocumentRepository documentRepository;
    private final DocumentFileRepository documentFileRepository;
    private final SapDocumentLinkRepository sapDocumentLinkRepository;
    private final CertificationRepository certificationRepository;

    @GetMapping
    public ApiResponse<Map<String, Object>> dashboard() {
        Map<String, Object> result = new LinkedHashMap<>();

        // 1) 3개월 진행률
        List<Milestone> milestones = milestoneRepository.findAllByOrderByMonthNo();
        int overallProgress = milestones.isEmpty() ? 0 :
                (int) Math.round(milestones.stream().mapToInt(Milestone::getProgress).average().orElse(0));

        List<Task> tasks = taskRepository.findAll();
        Map<String, Object> taskStats = new LinkedHashMap<>();
        taskStats.put("total", tasks.size());
        taskStats.put("completed", tasks.stream().filter(t -> "completed".equals(t.getStatus())).count());
        taskStats.put("in_progress", tasks.stream().filter(t -> "in_progress".equals(t.getStatus())).count());
        taskStats.put("blocked", tasks.stream().filter(t -> "blocked".equals(t.getStatus())).count());
        taskStats.put("pending", tasks.stream().filter(t -> "pending".equals(t.getStatus())).count());
        taskStats.put("avg_progress", tasks.stream().mapToInt(Task::getProgress).average().orElse(0));

        Map<String, Object> project = new LinkedHashMap<>();
        project.put("overall_progress", overallProgress);
        project.put("milestones", milestones);
        project.put("task_stats", taskStats);
        result.put("project", project);

        // 2) 위험 모듈
        List<DevModule> allModules = devModuleRepository.findAll();
        List<DevModule> riskModules = allModules.stream()
                .filter(m -> "high".equals(m.getRiskLevel()) || "critical".equals(m.getRiskLevel()))
                .sorted(Comparator.comparing(m -> "critical".equals(m.getRiskLevel()) ? 0 : 1))
                .collect(Collectors.toList());

        Map<String, Object> moduleStats = new LinkedHashMap<>();
        moduleStats.put("total", allModules.size());
        moduleStats.put("critical", allModules.stream().filter(m -> "critical".equals(m.getRiskLevel())).count());
        moduleStats.put("high", allModules.stream().filter(m -> "high".equals(m.getRiskLevel())).count());
        moduleStats.put("medium", allModules.stream().filter(m -> "medium".equals(m.getRiskLevel())).count());
        moduleStats.put("low", allModules.stream().filter(m -> "low".equals(m.getRiskLevel())).count());
        moduleStats.put("avg_progress", allModules.stream().mapToInt(DevModule::getProgress).average().orElse(0));

        Map<String, Object> risk = new LinkedHashMap<>();
        risk.put("modules", riskModules);
        risk.put("module_stats", moduleStats);
        result.put("risk", risk);

        // 3) 매핑 완성도
        List<SapTeedyMapping> mappings = mappingRepository.findAll();
        Map<String, Object> mappingStats = new LinkedHashMap<>();
        long mTotal = mappings.size();
        long mImplemented = mappings.stream().filter(m -> "implemented".equals(m.getMappingStatus())).count();
        mappingStats.put("total", mTotal);
        mappingStats.put("implemented", mImplemented);
        mappingStats.put("approved", mappings.stream().filter(m -> "approved".equals(m.getMappingStatus())).count());
        mappingStats.put("reviewed", mappings.stream().filter(m -> "reviewed".equals(m.getMappingStatus())).count());
        mappingStats.put("draft", mappings.stream().filter(m -> "draft".equals(m.getMappingStatus())).count());
        int mappingCompleteness = mTotal == 0 ? 0 : (int) Math.round(mImplemented * 100.0 / mTotal);

        Map<String, Long> byDocTypeTotal = mappings.stream()
                .collect(Collectors.groupingBy(m -> Optional.ofNullable(m.getDocType()).orElse("기타"), Collectors.counting()));
        Map<String, Long> byDocTypeImpl = mappings.stream()
                .filter(m -> "implemented".equals(m.getMappingStatus()))
                .collect(Collectors.groupingBy(m -> Optional.ofNullable(m.getDocType()).orElse("기타"), Collectors.counting()));
        List<Map<String, Object>> mappingByDocType = byDocTypeTotal.entrySet().stream()
                .map(e -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("doc_type", e.getKey());
                    row.put("total", e.getValue());
                    row.put("implemented", byDocTypeImpl.getOrDefault(e.getKey(), 0L));
                    return row;
                }).collect(Collectors.toList());

        Map<String, Object> mapping = new LinkedHashMap<>();
        mapping.put("stats", mappingStats);
        mapping.put("completeness", mappingCompleteness);
        mapping.put("by_doc_type", mappingByDocType);
        result.put("mapping", mapping);

        // 4) ACL 커버리지
        List<AclDesign> acls = aclDesignRepository.findAll();
        Map<String, Object> aclStats = new LinkedHashMap<>();
        aclStats.put("total", acls.size());
        aclStats.put("applied", acls.stream().filter(a -> "applied".equals(a.getStatus())).count());
        aclStats.put("approved", acls.stream().filter(a -> "approved".equals(a.getStatus())).count());
        aclStats.put("reviewed", acls.stream().filter(a -> "reviewed".equals(a.getStatus())).count());
        aclStats.put("draft", acls.stream().filter(a -> "draft".equals(a.getStatus())).count());

        Set<String> mappingDocTypes = mappings.stream().map(SapTeedyMapping::getDocType).filter(Objects::nonNull).collect(Collectors.toSet());
        Set<String> aclDocTypes = acls.stream().map(AclDesign::getDocType).collect(Collectors.toSet());
        Set<String> totalDocTypes = new HashSet<>(mappingDocTypes);
        totalDocTypes.addAll(aclDocTypes);
        Set<String> coveredDocTypes = acls.stream()
                .filter(a -> "approved".equals(a.getStatus()) || "applied".equals(a.getStatus()))
                .map(AclDesign::getDocType).collect(Collectors.toSet());

        int aclCoverage = totalDocTypes.isEmpty() ? 0 : (int) Math.round(coveredDocTypes.size() * 100.0 / totalDocTypes.size());

        Map<String, long[]> byGroupMap = new LinkedHashMap<>();
        for (AclDesign a : acls) {
            long[] arr = byGroupMap.computeIfAbsent(a.getGroupName(), k -> new long[2]);
            arr[0]++;
            if ("approved".equals(a.getStatus()) || "applied".equals(a.getStatus())) arr[1]++;
        }
        List<Map<String, Object>> aclByGroup = byGroupMap.entrySet().stream()
                .map(e -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("group_name", e.getKey());
                    row.put("total", e.getValue()[0]);
                    row.put("covered", e.getValue()[1]);
                    return row;
                }).collect(Collectors.toList());

        Map<String, Object> acl = new LinkedHashMap<>();
        acl.put("stats", aclStats);
        acl.put("coverage", aclCoverage);
        acl.put("total_doc_types", totalDocTypes.size());
        acl.put("covered_doc_types", coveredDocTypes.size());
        acl.put("by_group", aclByGroup);
        result.put("acl", acl);

        // 5) 문서관리(DMS) KPI
        long totalDocuments = documentRepository.countByUseYn("Y");
        long activeDocuments = documentRepository.countByUseYnAndStatus("Y", "active");
        long totalFiles = documentFileRepository.countByUseYn("Y");
        Long totalSizeBytes = documentFileRepository.sumFileSize();

        long linkedCount = sapDocumentLinkRepository.countByLinkStatus("linked");
        long missingCount = sapDocumentLinkRepository.countByLinkStatus("missing");
        long pendingCount = sapDocumentLinkRepository.countByLinkStatus("pending_review");
        long linkTotal = linkedCount + missingCount + pendingCount;
        int sapLinkRate = linkTotal == 0 ? 0 : (int) Math.round(linkedCount * 100.0 / linkTotal);

        Map<String, Object> sapLinkStats = new LinkedHashMap<>();
        sapLinkStats.put("total", linkTotal);
        sapLinkStats.put("linked", linkedCount);
        sapLinkStats.put("missing", missingCount);
        sapLinkStats.put("pending_review", pendingCount);

        List<Map<String, Object>> missingDocuments = sapDocumentLinkRepository.findByLinkStatus("missing").stream()
                .limit(10)
                .map(link -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    DocumentEntity doc = documentRepository.findById(link.getDocumentId()).orElse(null);
                    row.put("id", doc != null ? doc.getId() : null);
                    row.put("title", doc != null ? doc.getTitle() : null);
                    row.put("storage_id", doc != null ? doc.getStorageId() : null);
                    row.put("business_partner_name", doc != null ? doc.getBusinessPartnerName() : null);
                    row.put("sap_table", link.getSapTable());
                    row.put("sap_doc_num", link.getSapDocNum());
                    return row;
                }).collect(Collectors.toList());

        LocalDate threshold = LocalDate.now().plusDays(90);
        List<Map<String, Object>> expiringCerts = certificationRepository.findExpiringBy(threshold).stream()
                .limit(10)
                .map(cert -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("id", cert.getId());
                    row.put("cert_type", cert.getCertType());
                    row.put("business_partner_name", cert.getBusinessPartnerName());
                    row.put("expiry_date", cert.getExpiryDate());
                    row.put("status", cert.getStatus());
                    return row;
                }).collect(Collectors.toList());

        Map<String, Object> documents = new LinkedHashMap<>();
        documents.put("total_documents", totalDocuments);
        documents.put("active_documents", activeDocuments);
        documents.put("total_files", totalFiles);
        documents.put("total_size_bytes", totalSizeBytes == null ? 0 : totalSizeBytes);
        documents.put("sap_link_stats", sapLinkStats);
        documents.put("sap_link_rate", sapLinkRate);
        documents.put("missing_documents", missingDocuments);
        documents.put("expiring_certifications", expiringCerts);
        result.put("documents", documents);

        return ApiResponse.ok(result);
    }
}
