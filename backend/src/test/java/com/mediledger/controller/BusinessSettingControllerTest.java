package com.mediledger.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mediledger.dto.LoginRequestDto;
import com.mediledger.dto.UpdateBusinessSettingsRequestDto;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class BusinessSettingControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private com.mediledger.repository.BusinessSettingRepository businessSettingRepository;

    @org.junit.jupiter.api.AfterEach
    void tearDown() {
        businessSettingRepository.findByKey("shop_name").ifPresent(setting -> {
            setting.setValue("MediLedger Pharmacy");
            businessSettingRepository.save(setting);
        });
    }

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
    void testUnauthenticatedCannotAccessSettings() throws Exception {
        mockMvc.perform(get("/api/settings"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(put("/api/settings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void testStaffCanReadSettings() throws Exception {
        String staffToken = getAuthToken("staff", "Staff@123");

        mockMvc.perform(get("/api/settings")
                        .header("Authorization", "Bearer " + staffToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.shop_name").exists());
    }

    @Test
    void testStaffForbiddenFromUpdatingSettings() throws Exception {
        String staffToken = getAuthToken("staff", "Staff@123");

        UpdateBusinessSettingsRequestDto request = new UpdateBusinessSettingsRequestDto();
        request.setShopName("Hacked Pharmacy");

        mockMvc.perform(put("/api/settings")
                        .header("Authorization", "Bearer " + staffToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    void testOwnerCanUpdateSettings() throws Exception {
        String ownerToken = getAuthToken("owner", "Owner@123");

        UpdateBusinessSettingsRequestDto request = new UpdateBusinessSettingsRequestDto();
        request.setShopName("MediLedger Super Pharmacy");
        request.setOwnerName("Dr. Rajesh Patel");
        request.setShopAddress("123 Healthcare Road, Medical Zone");
        request.setShopPhone("+91 9988776655");
        request.setShopEmail("contact@mediledger.local");
        request.setGstin("27AAAAA0000A1Z5");
        request.setInvoicePrefix("ML-INV-");
        request.setInvoiceCounter("1050");
        request.setCurrency("INR");
        request.setCurrencySymbol("₹");
        request.setDefaultGstRate("12");
        request.setInvoiceFooter("Thank you! Visit again soon.");

        mockMvc.perform(put("/api/settings")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.shop_name").value("MediLedger Super Pharmacy"))
                .andExpect(jsonPath("$.data.owner_name").value("Dr. Rajesh Patel"));
    }
}
