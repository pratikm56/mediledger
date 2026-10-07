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
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class DashboardControllerTest {

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
    void testUnauthenticatedCannotAccessDashboard() throws Exception {
        mockMvc.perform(get("/api/dashboard/summary"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/dashboard/trends"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/dashboard/alerts"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void testOwnerCanGetDashboardSummary() throws Exception {
        String ownerToken = getAuthToken("owner", "Owner@123");

        mockMvc.perform(get("/api/dashboard/summary")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalMedicines", greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.data.totalStockUnits", greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.data.totalStockPurchaseValue", greaterThanOrEqualTo(0.0)))
                .andExpect(jsonPath("$.data.totalStockMrpValue", greaterThanOrEqualTo(0.0)))
                .andExpect(jsonPath("$.data.customerOutstanding", greaterThanOrEqualTo(0.0)))
                .andExpect(jsonPath("$.data.supplierOutstanding", greaterThanOrEqualTo(0.0)))
                .andExpect(jsonPath("$.data.lowStockCount", greaterThanOrEqualTo(0)))
                .andExpect(jsonPath("$.data.expiredBatchesCount", greaterThanOrEqualTo(0)));
    }

    @Test
    void testStaffCanGetDashboardSummary() throws Exception {
        String staffToken = getAuthToken("staff", "Staff@123");

        mockMvc.perform(get("/api/dashboard/summary")
                        .header("Authorization", "Bearer " + staffToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalMedicines", greaterThanOrEqualTo(1)));
    }

    @Test
    void testDashboardTrendsReturnsContinuousPoints() throws Exception {
        String adminToken = getAuthToken("admin", "Admin@123");

        mockMvc.perform(get("/api/dashboard/trends")
                        .param("days", "7")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data", hasSize(7)))
                .andExpect(jsonPath("$.data[0].date").exists())
                .andExpect(jsonPath("$.data[0].salesAmount").exists())
                .andExpect(jsonPath("$.data[0].grossProfit").exists())
                .andExpect(jsonPath("$.data[0].netProfit").exists());
    }

    @Test
    void testDashboardAlertsReturnsOperationalData() throws Exception {
        String ownerToken = getAuthToken("owner", "Owner@123");

        mockMvc.perform(get("/api/dashboard/alerts")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.lowStockItems").isArray())
                .andExpect(jsonPath("$.data.expiringItems").isArray())
                .andExpect(jsonPath("$.data.expiredItems").isArray())
                .andExpect(jsonPath("$.data.recentSales").isArray());
    }
}
