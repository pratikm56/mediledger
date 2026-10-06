package com.mediledger.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mediledger.dto.CreateSaleRequestDto;
import com.mediledger.dto.LoginRequestDto;
import com.mediledger.dto.SaleItemRequestDto;
import com.mediledger.entity.PaymentMode;
import com.mediledger.repository.CustomerRepository;
import com.mediledger.repository.MedicineBatchRepository;
import com.mediledger.repository.MedicineRepository;
import com.mediledger.repository.StockTransactionRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class SaleControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private MedicineRepository medicineRepository;

    @Autowired
    private MedicineBatchRepository medicineBatchRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private StockTransactionRepository stockTransactionRepository;

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
    void testStaffCanListSales() throws Exception {
        String staffToken = getAuthToken("staff", "Staff@123");

        mockMvc.perform(get("/api/sales?query=BILL-2026-0001")
                        .header("Authorization", "Bearer " + staffToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content.length()", greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.data.content[0].invoiceNumber").value("BILL-2026-0001"));
    }

    @Test
    void testStaffCanCreateSaleAndStockIsAtomicallyDeducted() throws Exception {
        String staffToken = getAuthToken("staff", "Staff@123");

        var batches = medicineBatchRepository.findAll();
        var availableBatch = batches.stream()
                .filter(b -> b.getQuantity() >= 10 && !b.isExpired())
                .findFirst()
                .orElseThrow();

        int initialQty = availableBatch.getQuantity();

        SaleItemRequestDto itemDto = new SaleItemRequestDto();
        itemDto.setMedicineId(availableBatch.getMedicine().getId());
        itemDto.setBatchId(availableBatch.getId());
        itemDto.setQuantity(3);
        itemDto.setUnitPrice(availableBatch.getSellingPrice());
        itemDto.setDiscountAmount(BigDecimal.ZERO);

        CreateSaleRequestDto saleDto = new CreateSaleRequestDto();
        saleDto.setCustomerName("Walk-in Counter Customer");
        saleDto.setSaleDate(LocalDate.now());
        saleDto.setPaymentMode(PaymentMode.CASH);
        saleDto.setPaidAmount(new BigDecimal("1000.00")); // Cash tendered with change expected
        saleDto.setItems(List.of(itemDto));

        var response = mockMvc.perform(post("/api/sales")
                        .header("Authorization", "Bearer " + staffToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(saleDto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.paymentStatus").value("PAID"))
                .andReturn();

        // Verify batch stock was decremented
        var updatedBatch = medicineBatchRepository.findById(availableBatch.getId()).orElseThrow();
        assertEquals(initialQty - 3, updatedBatch.getQuantity(), "Batch quantity must be reduced by sold count (3)");

        // Verify stock transaction ledger contains the SALE entry
        boolean hasSaleTxn = stockTransactionRepository.findAll().stream()
                .anyMatch(tx -> tx.getBatch().getId().equals(availableBatch.getId()) && tx.getQuantityChange() == -3);
        assertTrue(hasSaleTxn, "Audit ledger must record -3 units for the retail sale");
    }

    @Test
    void testValidationRejectsSaleWhenStockIsInsufficient() throws Exception {
        String staffToken = getAuthToken("staff", "Staff@123");

        var batch = medicineBatchRepository.findAll().stream()
                .filter(b -> !b.isExpired())
                .findFirst()
                .orElseThrow();

        SaleItemRequestDto itemDto = new SaleItemRequestDto();
        itemDto.setMedicineId(batch.getMedicine().getId());
        itemDto.setBatchId(batch.getId());
        itemDto.setQuantity(batch.getQuantity() + 500); // Exceeds available stock
        itemDto.setUnitPrice(batch.getSellingPrice());

        CreateSaleRequestDto saleDto = new CreateSaleRequestDto();
        saleDto.setCustomerName("Walk-in Counter Customer");
        saleDto.setSaleDate(LocalDate.now());
        saleDto.setPaymentMode(PaymentMode.CASH);
        saleDto.setItems(List.of(itemDto));

        mockMvc.perform(post("/api/sales")
                        .header("Authorization", "Bearer " + staffToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(saleDto)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void testValidationRejectsCreditSaleForWalkInCustomer() throws Exception {
        String staffToken = getAuthToken("staff", "Staff@123");

        var batch = medicineBatchRepository.findAll().stream()
                .filter(b -> b.getQuantity() >= 5 && !b.isExpired())
                .findFirst()
                .orElseThrow();

        SaleItemRequestDto itemDto = new SaleItemRequestDto();
        itemDto.setMedicineId(batch.getMedicine().getId());
        itemDto.setBatchId(batch.getId());
        itemDto.setQuantity(1);
        itemDto.setUnitPrice(batch.getSellingPrice());

        CreateSaleRequestDto saleDto = new CreateSaleRequestDto();
        saleDto.setCustomerId(null); // Walk-in customer without ID
        saleDto.setCustomerName("Anonymous Person");
        saleDto.setSaleDate(LocalDate.now());
        saleDto.setPaymentMode(PaymentMode.CREDIT);
        saleDto.setPaidAmount(BigDecimal.ZERO); // 100% credit
        saleDto.setItems(List.of(itemDto));

        mockMvc.perform(post("/api/sales")
                        .header("Authorization", "Bearer " + staffToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(saleDto)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void testGetSaleSummary() throws Exception {
        String staffToken = getAuthToken("staff", "Staff@123");

        mockMvc.perform(get("/api/sales/summary")
                        .header("Authorization", "Bearer " + staffToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalSalesCount", greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.data.totalSalesAmount", greaterThanOrEqualTo(50.0)));
    }
}
