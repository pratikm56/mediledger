package com.mediledger;

import com.mediledger.dto.*;
import com.mediledger.entity.*;
import com.mediledger.exception.ApiException;
import com.mediledger.repository.*;
import com.mediledger.service.PurchaseService;
import com.mediledger.service.SaleService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class TransactionRollbackIntegrationTest {

    @Autowired
    private SaleService saleService;

    @Autowired
    private PurchaseService purchaseService;

    @Autowired
    private MedicineRepository medicineRepository;

    @Autowired
    private MedicineBatchRepository medicineBatchRepository;

    @Autowired
    private SupplierRepository supplierRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private StockTransactionRepository stockTransactionRepository;

    @Autowired
    private SaleRepository saleRepository;

    @Autowired
    private PurchaseRepository purchaseRepository;

    @Test
    @DisplayName("Critical Rule 9: Failed multi-item sale rolls back all changes atomically")
    void testRule9_FailedSaleRollsBackEverything() {
        Medicine medicine = medicineRepository.findAll().stream()
                .filter(m -> m.isActive())
                .findFirst()
                .orElseThrow();

        // Create Batch 1 with 20 items
        MedicineBatch batch1 = new MedicineBatch();
        batch1.setMedicine(medicine);
        batch1.setBatchNumber("RB-B1-" + System.currentTimeMillis());
        batch1.setExpiryDate(LocalDate.now().plusYears(1));
        batch1.setPurchasePrice(new BigDecimal("10.00"));
        batch1.setMrp(new BigDecimal("20.00"));
        batch1.setSellingPrice(new BigDecimal("20.00"));
        batch1.setGstPercentage(new BigDecimal("12.00"));
        batch1.setQuantity(20);
        batch1 = medicineBatchRepository.save(batch1);

        // Create Batch 2 with only 2 items
        MedicineBatch batch2 = new MedicineBatch();
        batch2.setMedicine(medicine);
        batch2.setBatchNumber("RB-B2-" + System.currentTimeMillis());
        batch2.setExpiryDate(LocalDate.now().plusYears(1));
        batch2.setPurchasePrice(new BigDecimal("10.00"));
        batch2.setMrp(new BigDecimal("20.00"));
        batch2.setSellingPrice(new BigDecimal("20.00"));
        batch2.setGstPercentage(new BigDecimal("12.00"));
        batch2.setQuantity(2);
        batch2 = medicineBatchRepository.save(batch2);

        int initialBatch1Qty = batch1.getQuantity();
        int initialBatch2Qty = batch2.getQuantity();
        long initialSaleCount = saleRepository.count();
        long initialTxCount = stockTransactionRepository.count();

        // Cart has Item 1 (valid: 5 units of batch 1), but Item 2 (invalid: 50 units of batch 2 which has only 2)
        SaleItemRequestDto item1 = new SaleItemRequestDto();
        item1.setMedicineId(medicine.getId());
        item1.setBatchId(batch1.getId());
        item1.setQuantity(5);
        item1.setUnitPrice(batch1.getSellingPrice());

        SaleItemRequestDto item2 = new SaleItemRequestDto();
        item2.setMedicineId(medicine.getId());
        item2.setBatchId(batch2.getId());
        item2.setQuantity(50); // Will cause failure!
        item2.setUnitPrice(batch2.getSellingPrice());

        CreateSaleRequestDto saleDto = new CreateSaleRequestDto();
        saleDto.setCustomerName("Rollback Test Customer");
        saleDto.setSaleDate(LocalDate.now());
        saleDto.setPaymentMode(PaymentMode.CASH);
        saleDto.setPaidAmount(new BigDecimal("2000.00"));
        saleDto.setItems(List.of(item1, item2));

        // Attempt creation — must fail
        assertThrows(ApiException.class, () -> saleService.createSale(saleDto, "staff"),
                "Sale creation must throw ApiException when one item exceeds available stock");

        // Verify total rollback
        MedicineBatch checkBatch1 = medicineBatchRepository.findById(batch1.getId()).orElseThrow();
        assertEquals(initialBatch1Qty, checkBatch1.getQuantity(),
                "Batch 1 quantity must NOT be deducted because the overall sale transaction failed");

        MedicineBatch checkBatch2 = medicineBatchRepository.findById(batch2.getId()).orElseThrow();
        assertEquals(initialBatch2Qty, checkBatch2.getQuantity(),
                "Batch 2 quantity must remain untouched");

        assertEquals(initialSaleCount, saleRepository.count(),
                "No sale record should be saved in database on failure");

        assertEquals(initialTxCount, stockTransactionRepository.count(),
                "No stock transaction ledger entry should be saved on failure");
    }

    @Test
    @DisplayName("Critical Rule 10: Failed purchase rolls back all changes atomically")
    void testRule10_FailedPurchaseRollsBackEverything() {
        Supplier supplier = supplierRepository.findAll().stream()
                .filter(s -> s.isActive())
                .findFirst()
                .orElseThrow();

        Medicine medicine = medicineRepository.findAll().stream()
                .filter(m -> m.isActive())
                .findFirst()
                .orElseThrow();

        long initialPurchaseCount = purchaseRepository.count();
        BigDecimal initialSupplierBal = supplier.getCurrentBalance();
        String uniqueBatch1 = "RB-PUR1-" + System.currentTimeMillis();

        // Item 1 is valid
        PurchaseItemRequestDto item1 = new PurchaseItemRequestDto();
        item1.setMedicineId(medicine.getId());
        item1.setBatchNumber(uniqueBatch1);
        item1.setExpiryDate(LocalDate.now().plusYears(1));
        item1.setQuantity(10);
        item1.setPurchasePrice(new BigDecimal("10.00"));
        item1.setMrp(new BigDecimal("20.00"));
        item1.setSellingPrice(new BigDecimal("18.00"));

        // Item 2 has non-existent medicine ID (triggers failure)
        PurchaseItemRequestDto item2 = new PurchaseItemRequestDto();
        item2.setMedicineId(999999L); // Invalid medicine ID!
        item2.setBatchNumber("RB-PUR2-" + System.currentTimeMillis());
        item2.setExpiryDate(LocalDate.now().plusYears(1));
        item2.setQuantity(10);
        item2.setPurchasePrice(new BigDecimal("10.00"));
        item2.setMrp(new BigDecimal("20.00"));
        item2.setSellingPrice(new BigDecimal("18.00"));

        CreatePurchaseRequestDto purchaseDto = new CreatePurchaseRequestDto();
        purchaseDto.setSupplierId(supplier.getId());
        purchaseDto.setSupplierInvoiceNumber("INV-FAIL-" + System.currentTimeMillis());
        purchaseDto.setPurchaseDate(LocalDate.now());
        purchaseDto.setPaymentMode(PaymentMode.CREDIT);
        purchaseDto.setPaidAmount(BigDecimal.ZERO);
        purchaseDto.setItems(List.of(item1, item2));

        // Attempt creation — must fail
        assertThrows(RuntimeException.class, () -> purchaseService.createPurchase(purchaseDto, "owner"),
                "Purchase creation must fail when medicine is invalid");

        // Verify total rollback
        assertEquals(initialPurchaseCount, purchaseRepository.count(),
                "No purchase record should exist after failed purchase");

        assertFalse(medicineBatchRepository.findByMedicineIdAndBatchNumber(medicine.getId(), uniqueBatch1).isPresent(),
                "Batch 1 must NOT be created or persisted after failed purchase transaction");

        Supplier checkSupplier = supplierRepository.findById(supplier.getId()).orElseThrow();
        assertEquals(initialSupplierBal, checkSupplier.getCurrentBalance(),
                "Supplier balance must NOT be modified after failed purchase");
    }
}
