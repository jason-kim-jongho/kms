package com.kms.docmanagement.controller;

import com.kms.docmanagement.dto.ApiResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * SAP B1 Service Layer 연동 지점(Mock).
 *
 * [SAP 연동 지점]
 * 운영 환경에서는 아래 lookup() 메서드 내부를 실제 SAP Business One Service Layer 호출로 교체해야 한다.
 * 참고 패턴(scm_solution ServiceLayerClient):
 *   1) POST {ServiceLayerBaseUrl}/Login  { CompanyDB, UserName, Password } → B1SESSION 쿠키 획득
 *   2) GET  {ServiceLayerBaseUrl}/{entityName}?$filter=DocNum eq {docNum}  (쿠키 첨부)
 *   3) 엔티티명 매핑: OPCH(매입세금계산서) / OINV(매출세금계산서) / OPOR(발주서) / ORDR(수주서) / OPDN(입고증)
 * 이 Mock은 실제 Service Layer가 연결되기 전까지 프론트엔드/통합 테스트를 위해 더미 데이터를 반환한다.
 */
@RestController
@RequestMapping("/api/sap")
public class SapLookupController {

    @GetMapping("/lookup")
    public ApiResponse<Map<String, Object>> lookup(@RequestParam String table, @RequestParam(name = "doc_num") String docNum) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("source", "mock (SAP Service Layer 연동 대기)");
        data.put("sap_table", table);
        data.put("doc_num", docNum);

        switch (table) {
            case "OPCH":
                data.put("DocEntry", docNum);
                data.put("DocNum", docNum);
                data.put("CardCode", "V10001");
                data.put("CardName", "삼성전자(주)");
                data.put("DocDate", LocalDate.now().minusDays(5).toString());
                data.put("DocTotal", 12500000);
                break;
            case "OINV":
                data.put("DocEntry", docNum);
                data.put("DocNum", docNum);
                data.put("CardCode", "C20001");
                data.put("CardName", "대한전자");
                data.put("DocDate", LocalDate.now().minusDays(2).toString());
                data.put("DocTotal", 8900000);
                break;
            case "OPOR":
                data.put("DocEntry", docNum);
                data.put("DocNum", docNum);
                data.put("CardCode", "V10002");
                data.put("CardName", "(주)한국물류");
                data.put("DocDate", LocalDate.now().minusDays(10).toString());
                data.put("DocTotal", 4300000);
                break;
            case "ORDR":
                data.put("DocEntry", docNum);
                data.put("DocNum", docNum);
                data.put("CardCode", "C20001");
                data.put("CardName", "대한전자");
                data.put("DocDate", LocalDate.now().minusDays(7).toString());
                data.put("DocTotal", 15600000);
                break;
            case "OPDN":
                data.put("DocEntry", docNum);
                data.put("DocNum", docNum);
                data.put("CardCode", "V10002");
                data.put("CardName", "(주)한국물류");
                data.put("DocDate", LocalDate.now().minusDays(3).toString());
                break;
            default:
                return ApiResponse.error("지원하지 않는 SAP 테이블입니다: " + table);
        }
        return ApiResponse.ok(data);
    }
}
