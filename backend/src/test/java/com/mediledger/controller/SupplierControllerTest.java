package com.mediledger.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mediledger.dto.CreateSupplierRequestDto;
import com.mediledger.dto.LoginRequestDto;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.greaterThan;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class SupplierControllerTest {

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
    void testStaffCanListSuppliers() throws Exception {
        String staffToken = getAuthToken("staff", "Staff@123");

        mockMvc.perform(get("/api/suppliers")
                        .header("Authorization", "Bearer " + staffToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content.length()", greaterThanOrEqualTo(4)));
    }

    @Test
    void testAdminCanCreateSupplier() throws Exception {
        String adminToken = getAuthToken("admin", "Admin@123");

        CreateSupplierRequestDto dto = new CreateSupplierRequestDto();
        dto.setName("Zenith Pharma Dist " + System.currentTimeMillis());
        dto.setContactPerson("Harish Chawla");
        dto.setPhone("98990" + String.valueOf(System.currentTimeMillis()).substring(8));
        dto.setEmail("orders@zenithpharma.local");
        dto.setAddress("Unit 5, Logistics Park, Pune");
        dto.setGstNumber("27AABCZ9999F1ZQ");
        dto.setDrugLicenseNumber("DL-20B-MH-99999");
        dto.setPaymentTermsDays(30);

        mockMvc.perform(post("/api/suppliers")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value(dto.getName()))
                .andExpect(jsonPath("$.data.drugLicenseNumber").value("DL-20B-MH-99999"));
    }

    @Test
    void testStaffCannotCreateSupplier() throws Exception {
        String staffToken = getAuthToken("staff", "Staff@123");

        CreateSupplierRequestDto dto = new CreateSupplierRequestDto();
        dto.setName("Unauthorized Supplier");
        dto.setPhone("9800000001");

        mockMvc.perform(post("/api/suppliers")
                        .header("Authorization", "Bearer " + staffToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void testSupplierPayablesSummary() throws Exception {
        String adminToken = getAuthToken("admin", "Admin@123");

        // Outstanding payables summary
        mockMvc.perform(get("/api/suppliers/outstanding-summary")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalSuppliersWithOutstanding", greaterThan(0)))
                .andExpect(jsonPath("$.data.totalPayablesAmount", greaterThan(20000.0)));
    }
}
