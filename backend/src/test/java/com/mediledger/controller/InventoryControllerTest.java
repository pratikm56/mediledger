package com.mediledger.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mediledger.dto.LoginRequestDto;
import com.mediledger.dto.StockAdjustmentRequestDto;
import com.mediledger.entity.StockTransactionType;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.hamcrest.Matchers.greaterThan;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class InventoryControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String getAuthToken(String username, String password) throws Exception {
        LoginRequestDto request = new LoginRequestDto(username, password);
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andReturn();

        return objectMapper.readTree(result.getResponse().getContentAsString())
                .path("data").path("token").asText();
    }

    @Test
    void testGetInventorySummary() throws Exception {
        String staffToken = getAuthToken("staff", "Staff@123");

        mockMvc.perform(get("/api/inventory/summary")
                        .header("Authorization", "Bearer " + staffToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalInventoryUnits", greaterThan(100)))
                .andExpect(jsonPath("$.data.totalPurchaseValuation", greaterThan(1000.0)))
                .andExpect(jsonPath("$.data.lowStockCount", greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.data.expiringWithin30DaysCount", greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.data.expiredBatchesCount", greaterThanOrEqualTo(1)));
    }

    @Test
    void testGetExpiringAndExpiredBatches() throws Exception {
        String staffToken = getAuthToken("staff", "Staff@123");

        // Expiring within 30 days
        mockMvc.perform(get("/api/inventory/expiring?days=30")
                        .header("Authorization", "Bearer " + staffToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content.length()", greaterThanOrEqualTo(1)));

        // Expired batches
        mockMvc.perform(get("/api/inventory/expired")
                        .header("Authorization", "Bearer " + staffToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content[0].batchNumber").value("CR-EXP-01"));
    }

    @Test
    void testAdminCanAdjustStockWithReason() throws Exception {
        String adminToken = getAuthToken("admin", "Admin@123");

        StockAdjustmentRequestDto adjDto = new StockAdjustmentRequestDto();
        adjDto.setBatchId(1L); // PARA-2026A
        adjDto.setTransactionType(StockTransactionType.DAMAGED);
        adjDto.setQuantityChange(-2);
        adjDto.setReason("Two blister packs damaged during rack maintenance");

        mockMvc.perform(post("/api/inventory/adjust")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(adjDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.quantityChange").value(-2))
                .andExpect(jsonPath("$.data.transactionType").value("DAMAGED"))
                .andExpect(jsonPath("$.data.notes").value("Two blister packs damaged during rack maintenance"));
    }

    @Test
    void testStockAdjustmentPreventsNegativeStock() throws Exception {
        String adminToken = getAuthToken("admin", "Admin@123");

        StockAdjustmentRequestDto adjDto = new StockAdjustmentRequestDto();
        adjDto.setBatchId(1L);
        adjDto.setTransactionType(StockTransactionType.ADJUSTMENT);
        adjDto.setQuantityChange(-99999); // Exceeds all stock
        adjDto.setReason("Attempt to create negative stock");

        mockMvc.perform(post("/api/inventory/adjust")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(adjDto)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void testStockAdjustmentRequiresReason() throws Exception {
        String adminToken = getAuthToken("admin", "Admin@123");

        StockAdjustmentRequestDto adjDto = new StockAdjustmentRequestDto();
        adjDto.setBatchId(1L);
        adjDto.setTransactionType(StockTransactionType.ADJUSTMENT);
        adjDto.setQuantityChange(5);
        adjDto.setReason(""); // Missing mandatory reason!

        mockMvc.perform(post("/api/inventory/adjust")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(adjDto)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }
}
