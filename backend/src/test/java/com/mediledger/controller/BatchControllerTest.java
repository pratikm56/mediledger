package com.mediledger.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mediledger.dto.CreateMedicineBatchRequestDto;
import com.mediledger.dto.LoginRequestDto;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class BatchControllerTest {

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
    void testGetBatchesByMedicineAndFefoAvailability() throws Exception {
        String staffToken = getAuthToken("staff", "Staff@123");

        // Paracetamol (ID 1) has 2 seeded batches
        mockMvc.perform(get("/api/batches/medicine/1")
                        .header("Authorization", "Bearer " + staffToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.length()", greaterThanOrEqualTo(2)));

        // Available for sale should return non-expired batches ordered by expiryDate ASC
        mockMvc.perform(get("/api/batches/medicine/1/available-for-sale")
                        .header("Authorization", "Bearer " + staffToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].batchNumber").value("PARA-2025-NEAR")) // Expires in 25 days, so first FEFO!
                .andExpect(jsonPath("$.data[1].batchNumber").value("PARA-2026A"));
    }

    @Test
    void testAdminCanCreateBatch() throws Exception {
        String adminToken = getAuthToken("admin", "Admin@123");

        String batchNum = "TEST-B-" + System.currentTimeMillis();
        CreateMedicineBatchRequestDto dto = new CreateMedicineBatchRequestDto();
        dto.setMedicineId(1L);
        dto.setBatchNumber(batchNum);
        dto.setManufacturingDate(LocalDate.now().minusMonths(1));
        dto.setExpiryDate(LocalDate.now().plusMonths(24));
        dto.setPurchasePrice(new BigDecimal("15.00"));
        dto.setMrp(new BigDecimal("22.00"));
        dto.setSellingPrice(new BigDecimal("21.50"));
        dto.setGstPercentage(new BigDecimal("12.00"));
        dto.setInitialQuantity(80);

        mockMvc.perform(post("/api/batches")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.batchNumber").value(batchNum))
                .andExpect(jsonPath("$.data.quantity").value(80));
    }

    @Test
    void testSellingPriceCannotExceedMrp() throws Exception {
        String adminToken = getAuthToken("admin", "Admin@123");

        CreateMedicineBatchRequestDto dto = new CreateMedicineBatchRequestDto();
        dto.setMedicineId(1L);
        dto.setBatchNumber("EXCEED-MRP-" + System.currentTimeMillis());
        dto.setExpiryDate(LocalDate.now().plusMonths(12));
        dto.setPurchasePrice(new BigDecimal("15.00"));
        dto.setMrp(new BigDecimal("20.00"));
        dto.setSellingPrice(new BigDecimal("25.00")); // Illegal: Selling price > MRP
        dto.setGstPercentage(new BigDecimal("12.00"));
        dto.setInitialQuantity(10);

        mockMvc.perform(post("/api/batches")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void testStaffCannotCreateBatch() throws Exception {
        String staffToken = getAuthToken("staff", "Staff@123");

        CreateMedicineBatchRequestDto dto = new CreateMedicineBatchRequestDto();
        dto.setMedicineId(1L);
        dto.setBatchNumber("STAFF-UNAUTH");
        dto.setExpiryDate(LocalDate.now().plusMonths(12));
        dto.setPurchasePrice(new BigDecimal("10.00"));
        dto.setMrp(new BigDecimal("20.00"));
        dto.setSellingPrice(new BigDecimal("20.00"));

        mockMvc.perform(post("/api/batches")
                        .header("Authorization", "Bearer " + staffToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false));
    }
}
