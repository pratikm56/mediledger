package com.mediledger.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mediledger.dto.LoginRequestDto;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class ReportControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String getAuthToken(String username, String password) throws Exception {
        LoginRequestDto request = new LoginRequestDto(username, password);
        var result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andReturn();

        return objectMapper.readTree(result.getResponse().getContentAsString())
                .path("data").path("token").asText();
    }

    @Test
    void testUnauthenticatedCannotAccessReports() throws Exception {
        mockMvc.perform(get("/api/reports/sales"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/reports/profit"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/reports/stock-summary"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void testOwnerCanAccessAllReports() throws Exception {
        String ownerToken = getAuthToken("owner", "Owner@123");

        // 1. Sales Report
        mockMvc.perform(get("/api/reports/sales")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.items.content").isArray());

        // 2. Purchase Report
        mockMvc.perform(get("/api/reports/purchases")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        // 3. Expense Report
        mockMvc.perform(get("/api/reports/expenses")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        // 4. Basic Profit Report
        mockMvc.perform(get("/api/reports/profit")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.dailyBreakdowns").isArray());

        // 5. Customer Outstanding
        mockMvc.perform(get("/api/reports/customer-outstanding")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        // 6. Supplier Outstanding
        mockMvc.perform(get("/api/reports/supplier-outstanding")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void testStaffCanAccessStockReportsOnly() throws Exception {
        String staffToken = getAuthToken("staff", "Staff@123");

        // Stock Summary
        mockMvc.perform(get("/api/reports/stock-summary")
                        .header("Authorization", "Bearer " + staffToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalMedicines", greaterThanOrEqualTo(1)));

        // Detailed Stock
        mockMvc.perform(get("/api/reports/stock-detailed")
                        .header("Authorization", "Bearer " + staffToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        // Low Stock
        mockMvc.perform(get("/api/reports/low-stock")
                        .header("Authorization", "Bearer " + staffToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        // Expiry
        mockMvc.perform(get("/api/reports/expiry")
                        .header("Authorization", "Bearer " + staffToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        // Staff should be forbidden from Profit Report
        mockMvc.perform(get("/api/reports/profit")
                        .header("Authorization", "Bearer " + staffToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void testOwnerCanExportCsv() throws Exception {
        String ownerToken = getAuthToken("owner", "Owner@123");

        mockMvc.perform(get("/api/reports/export/csv/sales")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(content().contentType("text/csv"))
                .andExpect(header().string("Content-Disposition", "attachment; filename=\"sales_report.csv\""));

        mockMvc.perform(get("/api/reports/export/csv/profit")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(content().contentType("text/csv"));
    }
}
