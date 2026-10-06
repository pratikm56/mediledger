package com.mediledger.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mediledger.dto.CreateMedicineRequestDto;
import com.mediledger.dto.LoginRequestDto;
import com.mediledger.dto.UpdateMedicineRequestDto;
import com.mediledger.entity.AuditLog;
import com.mediledger.repository.AuditLogRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.util.List;

import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class MedicineControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private AuditLogRepository auditLogRepository;

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
    void testGetMedicinesAndSearch() throws Exception {
        String staffToken = getAuthToken("staff", "Staff@123");

        // List medicines
        mockMvc.perform(get("/api/medicines")
                        .header("Authorization", "Bearer " + staffToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content.length()", greaterThanOrEqualTo(5)));

        // Search for Paracetamol
        mockMvc.perform(get("/api/medicines?query=Paracetamol")
                        .header("Authorization", "Bearer " + staffToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content[0].name").value("Paracetamol 500mg"));
    }

    @Test
    void testGetAllActiveMedicines() throws Exception {
        String staffToken = getAuthToken("staff", "Staff@123");

        mockMvc.perform(get("/api/medicines/all-active")
                        .header("Authorization", "Bearer " + staffToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.length()", greaterThanOrEqualTo(5)));
    }

    @Test
    void testAdminCreateUpdateAndToggleMedicine() throws Exception {
        String adminToken = getAuthToken("admin", "Admin@123");

        CreateMedicineRequestDto createDto = new CreateMedicineRequestDto();
        String medName = "Pantocid 40mg " + System.currentTimeMillis();
        createDto.setName(medName);
        createDto.setGenericName("Pantoprazole 40mg");
        createDto.setCategoryId(1L); // Tablets
        createDto.setManufacturerId(1L); // Sun Pharma
        createDto.setHsnCode("30049099");
        createDto.setGstPercentage(new BigDecimal("12.00"));
        createDto.setUnit("STRIP");
        createDto.setPackSize("15 Tablets");
        createDto.setPrescriptionRequired(false);
        createDto.setMinimumStock(30);
        createDto.setDescription("Proton pump inhibitor for acidity");

        MvcResult createResult = mockMvc.perform(post("/api/medicines")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createDto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value(medName))
                .andExpect(jsonPath("$.data.active").value(true))
                .andReturn();

        long medId = objectMapper.readTree(createResult.getResponse().getContentAsString())
                .path("data").path("id").asLong();

        // Update medicine
        UpdateMedicineRequestDto updateDto = new UpdateMedicineRequestDto();
        updateDto.setName(medName + " Updated");
        updateDto.setGenericName("Pantoprazole Sodium 40mg");
        updateDto.setCategoryId(1L);
        updateDto.setManufacturerId(1L);
        updateDto.setHsnCode("30049099");
        updateDto.setGstPercentage(new BigDecimal("12.00"));
        updateDto.setUnit("STRIP");
        updateDto.setPackSize("15 Tablets");
        updateDto.setPrescriptionRequired(true);
        updateDto.setMinimumStock(40);
        updateDto.setDescription("Updated PPI description");

        mockMvc.perform(put("/api/medicines/" + medId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value(medName + " Updated"))
                .andExpect(jsonPath("$.data.prescriptionRequired").value(true))
                .andExpect(jsonPath("$.data.minimumStock").value(40));

        // Toggle status to inactive
        mockMvc.perform(patch("/api/medicines/" + medId + "/toggle-status")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.active").value(false));

        // Verify Audit Log
        List<AuditLog> auditLogs = auditLogRepository.findByActionOrderByCreatedAtDesc("CREATE_MEDICINE");
        assertFalse(auditLogs.isEmpty());
    }

    @Test
    void testStaffCannotCreateMedicine() throws Exception {
        String staffToken = getAuthToken("staff", "Staff@123");

        CreateMedicineRequestDto createDto = new CreateMedicineRequestDto();
        createDto.setName("Unauthorized Med");
        createDto.setCategoryId(1L);
        createDto.setManufacturerId(1L);
        createDto.setUnit("STRIP");
        createDto.setPackSize("10 Tablets");
        createDto.setGstPercentage(new BigDecimal("12.00"));

        mockMvc.perform(post("/api/medicines")
                        .header("Authorization", "Bearer " + staffToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createDto)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false));
    }
}
