package com.mediledger.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mediledger.dto.CreateExpenseCategoryRequestDto;
import com.mediledger.dto.CreateExpenseRequestDto;
import com.mediledger.dto.LoginRequestDto;
import com.mediledger.entity.PaymentMode;
import com.mediledger.repository.ExpenseCategoryRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class ExpenseControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private ExpenseCategoryRepository expenseCategoryRepository;

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
    void testStaffCanListExpenseCategories() throws Exception {
        String staffToken = getAuthToken("staff", "Staff@123");

        mockMvc.perform(get("/api/expenses/categories")
                        .header("Authorization", "Bearer " + staffToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.length()", greaterThanOrEqualTo(5)));
    }

    @Test
    void testAdminCanCreateExpenseCategory() throws Exception {
        String adminToken = getAuthToken("admin", "Admin@123");

        CreateExpenseCategoryRequestDto dto = new CreateExpenseCategoryRequestDto();
        dto.setName("Security & CCTV " + System.currentTimeMillis());
        dto.setDescription("CCTV maintenance and security services");

        mockMvc.perform(post("/api/expenses/categories")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value(dto.getName()));
    }

    @Test
    void testStaffCannotCreateExpenseCategory() throws Exception {
        String staffToken = getAuthToken("staff", "Staff@123");

        CreateExpenseCategoryRequestDto dto = new CreateExpenseCategoryRequestDto();
        dto.setName("Unauthorized Category");

        mockMvc.perform(post("/api/expenses/categories")
                        .header("Authorization", "Bearer " + staffToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void testStaffCanRecordExpense() throws Exception {
        String staffToken = getAuthToken("staff", "Staff@123");

        var category = expenseCategoryRepository.findAll().get(0);

        CreateExpenseRequestDto dto = new CreateExpenseRequestDto();
        dto.setCategoryId(category.getId());
        dto.setExpenseDate(LocalDate.now());
        dto.setAmount(new BigDecimal("120.00"));
        dto.setPaymentMode(PaymentMode.CASH);
        dto.setRecipientName("Local Tea Vendor");
        dto.setNotes("Staff afternoon tea and biscuits");

        mockMvc.perform(post("/api/expenses")
                        .header("Authorization", "Bearer " + staffToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.amount").value(120.0))
                .andExpect(jsonPath("$.data.recipientName").value("Local Tea Vendor"));
    }

    @Test
    void testCashFlowSummary() throws Exception {
        String adminToken = getAuthToken("admin", "Admin@123");

        mockMvc.perform(get("/api/expenses/cash-flow")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalExpenses", greaterThanOrEqualTo(0.0)));
    }
}
