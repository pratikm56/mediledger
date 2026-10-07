package com.mediledger.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mediledger.dto.CreatePaymentRequestDto;
import com.mediledger.dto.LoginRequestDto;
import com.mediledger.entity.PaymentMode;
import com.mediledger.entity.PaymentType;
import com.mediledger.repository.CustomerRepository;
import com.mediledger.repository.SupplierRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class PaymentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private SupplierRepository supplierRepository;

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
    void testStaffCanListPayments() throws Exception {
        String staffToken = getAuthToken("staff", "Staff@123");

        mockMvc.perform(get("/api/payments")
                        .header("Authorization", "Bearer " + staffToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content.length()", greaterThanOrEqualTo(1)));
    }

    @Test
    void testRecordCustomerReceiptReducesCustomerBalance() throws Exception {
        String staffToken = getAuthToken("staff", "Staff@123");

        var customer = customerRepository.findAll().stream()
                .filter(c -> c.getCurrentBalance().compareTo(BigDecimal.ZERO) > 0)
                .findFirst()
                .orElseThrow();

        BigDecimal initialBal = customer.getCurrentBalance();
        BigDecimal payAmount = new BigDecimal("50.00");

        CreatePaymentRequestDto dto = new CreatePaymentRequestDto();
        dto.setPaymentType(PaymentType.CUSTOMER_RECEIPT);
        dto.setCustomerId(customer.getId());
        dto.setPaymentDate(LocalDate.now());
        dto.setAmount(payAmount);
        dto.setPaymentMode(PaymentMode.CASH);
        dto.setNotes("Counter cash receipt for credit bill");

        mockMvc.perform(post("/api/payments")
                        .header("Authorization", "Bearer " + staffToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.paymentType").value("CUSTOMER_RECEIPT"))
                .andExpect(jsonPath("$.data.amount").value(50.0));

        var updatedCustomer = customerRepository.findById(customer.getId()).orElseThrow();
        assertEquals(0, initialBal.subtract(payAmount).compareTo(updatedCustomer.getCurrentBalance()),
                "Customer current balance must be reduced by payment receipt amount");
    }

    @Test
    void testRecordSupplierPaymentReducesSupplierBalance() throws Exception {
        String adminToken = getAuthToken("admin", "Admin@123");

        var supplier = supplierRepository.findAll().stream()
                .filter(s -> s.getCurrentBalance().compareTo(BigDecimal.ZERO) > 0)
                .findFirst()
                .orElseThrow();

        BigDecimal initialBal = supplier.getCurrentBalance();
        BigDecimal payAmount = new BigDecimal("1000.00");

        CreatePaymentRequestDto dto = new CreatePaymentRequestDto();
        dto.setPaymentType(PaymentType.SUPPLIER_PAYMENT);
        dto.setSupplierId(supplier.getId());
        dto.setPaymentDate(LocalDate.now());
        dto.setAmount(payAmount);
        dto.setPaymentMode(PaymentMode.BANK_TRANSFER);
        dto.setReferenceNumber("IMPS-902194");
        dto.setNotes("Cheque/NEFT supplier settlement");

        mockMvc.perform(post("/api/payments")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.paymentType").value("SUPPLIER_PAYMENT"))
                .andExpect(jsonPath("$.data.amount").value(1000.0));

        var updatedSupplier = supplierRepository.findById(supplier.getId()).orElseThrow();
        assertEquals(0, initialBal.subtract(payAmount).compareTo(updatedSupplier.getCurrentBalance()),
                "Supplier payable balance must be reduced by payment disbursement amount");
    }
}
