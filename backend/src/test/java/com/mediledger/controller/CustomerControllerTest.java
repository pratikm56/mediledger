package com.mediledger.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mediledger.dto.CreateCustomerRequestDto;
import com.mediledger.dto.LoginRequestDto;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;

import static org.hamcrest.Matchers.greaterThan;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class CustomerControllerTest {

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
    void testStaffCanListAndSearchCustomers() throws Exception {
        String staffToken = getAuthToken("staff", "Staff@123");

        mockMvc.perform(get("/api/customers")
                        .header("Authorization", "Bearer " + staffToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content.length()", greaterThanOrEqualTo(5)));

        // Search by phone
        mockMvc.perform(get("/api/customers?query=9820123456")
                        .header("Authorization", "Bearer " + staffToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content[0].name").value("Rajesh Sharma"));
    }

    @Test
    void testStaffCanCreateCustomer() throws Exception {
        String staffToken = getAuthToken("staff", "Staff@123");

        CreateCustomerRequestDto dto = new CreateCustomerRequestDto();
        dto.setName("Sunil Mehra " + System.currentTimeMillis());
        dto.setPhone("98123" + String.valueOf(System.currentTimeMillis()).substring(8));
        dto.setEmail("sunil@mehra.local");
        dto.setAddress("Flat 301, Sunshine Apts");
        dto.setDoctorName("Dr. B. K. Bansal");
        dto.setCreditLimit(new BigDecimal("1500.00"));

        mockMvc.perform(post("/api/customers")
                        .header("Authorization", "Bearer " + staffToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value(dto.getName()))
                .andExpect(jsonPath("$.data.phone").value(dto.getPhone()));
    }

    @Test
    void testDuplicatePhoneNumberRejected() throws Exception {
        String staffToken = getAuthToken("staff", "Staff@123");

        CreateCustomerRequestDto dto = new CreateCustomerRequestDto();
        dto.setName("Duplicate User");
        dto.setPhone("9820123456"); // Phone of Rajesh Sharma already in DB!

        mockMvc.perform(post("/api/customers")
                        .header("Authorization", "Bearer " + staffToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void testCustomerOutstandingReceivables() throws Exception {
        String staffToken = getAuthToken("staff", "Staff@123");

        // List outstanding
        mockMvc.perform(get("/api/customers/outstanding")
                        .header("Authorization", "Bearer " + staffToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content.length()", greaterThanOrEqualTo(2)));

        // Summary
        mockMvc.perform(get("/api/customers/outstanding-summary")
                        .header("Authorization", "Bearer " + staffToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalCustomersWithOutstanding", greaterThan(0)))
                .andExpect(jsonPath("$.data.totalReceivablesAmount", greaterThan(1000.0)));
    }
}
