package com.mediledger.service.impl;

import com.mediledger.dto.report.*;
import com.mediledger.entity.*;
import com.mediledger.repository.*;
import com.mediledger.service.ReportService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class ReportServiceImpl implements ReportService {

    private final SaleRepository saleRepository;
    private final SaleItemRepository saleItemRepository;
    private final PurchaseRepository purchaseRepository;
    private final ExpenseRepository expenseRepository;
    private final ExpenseCategoryRepository expenseCategoryRepository;
    private final MedicineRepository medicineRepository;
    private final MedicineBatchRepository batchRepository;
    private final CategoryRepository categoryRepository;
    private final CustomerRepository customerRepository;
    private final SupplierRepository supplierRepository;

    public ReportServiceImpl(SaleRepository saleRepository,
                             SaleItemRepository saleItemRepository,
                             PurchaseRepository purchaseRepository,
                             ExpenseRepository expenseRepository,
                             ExpenseCategoryRepository expenseCategoryRepository,
                             MedicineRepository medicineRepository,
                             MedicineBatchRepository batchRepository,
                             CategoryRepository categoryRepository,
                             CustomerRepository customerRepository,
                             SupplierRepository supplierRepository) {
        this.saleRepository = saleRepository;
        this.saleItemRepository = saleItemRepository;
        this.purchaseRepository = purchaseRepository;
        this.expenseRepository = expenseRepository;
        this.expenseCategoryRepository = expenseCategoryRepository;
        this.medicineRepository = medicineRepository;
        this.batchRepository = batchRepository;
        this.categoryRepository = categoryRepository;
        this.customerRepository = customerRepository;
        this.supplierRepository = supplierRepository;
    }

    @Override
    public SalesReportDto getSalesReport(LocalDate startDate, LocalDate endDate, Long customerId,
                                         PaymentStatus paymentStatus, PaymentMode paymentMode,
                                         String query, Pageable pageable) {
        Page<Sale> salesPage = saleRepository.searchSales(query, customerId, paymentStatus, startDate, endDate, pageable);

        SalesReportDto report = new SalesReportDto();
        BigDecimal totalSales = BigDecimal.ZERO;
        BigDecimal totalDiscount = BigDecimal.ZERO;
        BigDecimal totalTax = BigDecimal.ZERO;
        BigDecimal totalPaid = BigDecimal.ZERO;
        BigDecimal totalBalance = BigDecimal.ZERO;

        List<SalesReportItemDto> items = new ArrayList<>();
        for (Sale s : salesPage.getContent()) {
            if (paymentMode != null && s.getPaymentMode() != paymentMode) {
                continue;
            }

            SalesReportItemDto item = new SalesReportItemDto();
            item.setId(s.getId());
            item.setInvoiceNumber(s.getInvoiceNumber());
            item.setSaleDate(s.getSaleDate());
            if (s.getCustomer() != null) {
                item.setCustomerId(s.getCustomer().getId());
            }
            item.setCustomerName(s.getCustomerName());
            item.setCustomerPhone(s.getCustomerPhone());
            item.setSubtotal(s.getSubtotal());
            item.setDiscountAmount(s.getDiscountAmount());
            item.setTaxAmount(s.getTaxAmount());
            item.setTotalAmount(s.getTotalAmount());
            item.setPaidAmount(s.getPaidAmount());
            BigDecimal balance = s.getTotalAmount().subtract(s.getPaidAmount());
            item.setBalanceAmount(balance.compareTo(BigDecimal.ZERO) > 0 ? balance : BigDecimal.ZERO);
            item.setPaymentMode(s.getPaymentMode());
            item.setPaymentStatus(s.getPaymentStatus());
            item.setCreatedBy(s.getCreatedBy());

            totalSales = totalSales.add(item.getTotalAmount());
            totalDiscount = totalDiscount.add(item.getDiscountAmount());
            totalTax = totalTax.add(item.getTaxAmount());
            totalPaid = totalPaid.add(item.getPaidAmount());
            totalBalance = totalBalance.add(item.getBalanceAmount());

            items.add(item);
        }

        report.setTotalSalesAmount(totalSales);
        report.setTotalDiscountAmount(totalDiscount);
        report.setTotalTaxAmount(totalTax);
        report.setTotalPaidAmount(totalPaid);
        report.setTotalBalanceAmount(totalBalance);
        report.setTotalBillsCount(salesPage.getTotalElements());
        report.setItems(new PageImpl<>(items, pageable, salesPage.getTotalElements()));

        return report;
    }

    @Override
    public PurchaseReportDto getPurchaseReport(LocalDate startDate, LocalDate endDate, Long supplierId,
                                              PaymentStatus paymentStatus, String query, Pageable pageable) {
        Page<Purchase> purchasesPage = purchaseRepository.searchPurchases(query, supplierId, paymentStatus, startDate, endDate, pageable);

        PurchaseReportDto report = new PurchaseReportDto();
        BigDecimal totalPurchases = BigDecimal.ZERO;
        BigDecimal totalDiscount = BigDecimal.ZERO;
        BigDecimal totalTax = BigDecimal.ZERO;
        BigDecimal totalPaid = BigDecimal.ZERO;
        BigDecimal totalBalance = BigDecimal.ZERO;

        List<PurchaseReportItemDto> items = new ArrayList<>();
        for (Purchase p : purchasesPage.getContent()) {
            PurchaseReportItemDto item = new PurchaseReportItemDto();
            item.setId(p.getId());
            item.setPurchaseNumber(p.getPurchaseNumber());
            item.setSupplierInvoiceNumber(p.getSupplierInvoiceNumber());
            item.setPurchaseDate(p.getPurchaseDate());
            if (p.getSupplier() != null) {
                item.setSupplierId(p.getSupplier().getId());
                item.setSupplierName(p.getSupplier().getName());
            }
            item.setSubtotal(p.getSubtotal());
            item.setDiscountAmount(p.getDiscountAmount());
            item.setTaxAmount(p.getTaxAmount());
            item.setTotalAmount(p.getTotalAmount());
            item.setPaidAmount(p.getPaidAmount());
            BigDecimal balance = p.getTotalAmount().subtract(p.getPaidAmount());
            item.setBalanceAmount(balance.compareTo(BigDecimal.ZERO) > 0 ? balance : BigDecimal.ZERO);
            item.setPaymentMode(p.getPaymentMode());
            item.setPaymentStatus(p.getPaymentStatus());
            item.setCreatedBy(p.getCreatedBy());

            totalPurchases = totalPurchases.add(item.getTotalAmount());
            totalDiscount = totalDiscount.add(item.getDiscountAmount());
            totalTax = totalTax.add(item.getTaxAmount());
            totalPaid = totalPaid.add(item.getPaidAmount());
            totalBalance = totalBalance.add(item.getBalanceAmount());

            items.add(item);
        }

        report.setTotalPurchasesAmount(totalPurchases);
        report.setTotalDiscountAmount(totalDiscount);
        report.setTotalTaxAmount(totalTax);
        report.setTotalPaidAmount(totalPaid);
        report.setTotalBalanceAmount(totalBalance);
        report.setTotalInvoicesCount(purchasesPage.getTotalElements());
        report.setItems(new PageImpl<>(items, pageable, purchasesPage.getTotalElements()));

        return report;
    }

    @Override
    public ExpenseReportDto getExpenseReport(LocalDate startDate, LocalDate endDate, Long categoryId,
                                            String query, Pageable pageable) {
        Page<Expense> expensePage = expenseRepository.searchExpenses(query, categoryId, startDate, endDate, pageable);

        ExpenseReportDto report = new ExpenseReportDto();
        BigDecimal totalAmount = BigDecimal.ZERO;
        Map<String, BigDecimal> breakdown = new HashMap<>();
        List<ExpenseReportItemDto> items = new ArrayList<>();

        for (Expense e : expensePage.getContent()) {
            ExpenseReportItemDto item = new ExpenseReportItemDto();
            item.setId(e.getId());
            item.setVoucherNumber(e.getVoucherNumber());
            item.setExpenseDate(e.getExpenseDate());
            if (e.getCategory() != null) {
                item.setCategoryId(e.getCategory().getId());
                item.setCategoryName(e.getCategory().getName());
            }
            item.setRecipientName(e.getRecipientName());
            item.setReferenceNumber(e.getReferenceNumber());
            item.setNotes(e.getNotes());
            item.setAmount(e.getAmount());
            item.setPaymentMode(e.getPaymentMode());
            item.setCreatedBy(e.getCreatedBy());

            totalAmount = totalAmount.add(e.getAmount());
            String catName = item.getCategoryName() != null ? item.getCategoryName() : "General";
            breakdown.put(catName, breakdown.getOrDefault(catName, BigDecimal.ZERO).add(e.getAmount()));

            items.add(item);
        }

        report.setTotalExpenseAmount(totalAmount);
        report.setTotalVouchersCount(expensePage.getTotalElements());
        report.setCategoryBreakdown(breakdown);
        report.setItems(new PageImpl<>(items, pageable, expensePage.getTotalElements()));

        return report;
    }

    @Override
    public BasicProfitReportDto getBasicProfitReport(LocalDate startDate, LocalDate endDate) {
        if (endDate == null) {
            endDate = LocalDate.now();
        }
        if (startDate == null) {
            startDate = endDate.minusDays(29); // Default 30-day window
        }

        BasicProfitReportDto report = new BasicProfitReportDto();
        report.setStartDate(startDate);
        report.setEndDate(endDate);

        Map<LocalDate, BigDecimal> salesMap = new HashMap<>();
        for (Object[] row : saleRepository.getDailySalesSummary(startDate, endDate)) {
            LocalDate d = toLocalDate(row[0]);
            if (d != null) {
                salesMap.put(d, (BigDecimal) row[1]);
            }
        }

        Map<LocalDate, BigDecimal> cogsMap = new HashMap<>();
        for (Object[] row : saleItemRepository.getDailyCogsSummary(startDate, endDate)) {
            LocalDate d = toLocalDate(row[0]);
            if (d != null) {
                cogsMap.put(d, (BigDecimal) row[1]);
            }
        }

        Map<LocalDate, BigDecimal> expenseMap = new HashMap<>();
        for (Object[] row : expenseRepository.getDailyExpensesSummary(startDate, endDate)) {
            LocalDate d = toLocalDate(row[0]);
            if (d != null) {
                expenseMap.put(d, (BigDecimal) row[1]);
            }
        }

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd MMM yyyy");
        List<DailyProfitBreakdownDto> breakdowns = new ArrayList<>();
        LocalDate current = startDate;

        BigDecimal totalSales = BigDecimal.ZERO;
        BigDecimal totalCogs = BigDecimal.ZERO;
        BigDecimal totalGross = BigDecimal.ZERO;
        BigDecimal totalExpenses = BigDecimal.ZERO;
        BigDecimal totalNet = BigDecimal.ZERO;

        while (!current.isAfter(endDate)) {
            DailyProfitBreakdownDto dto = new DailyProfitBreakdownDto();
            dto.setDate(current);
            dto.setFormattedDate(current.format(formatter));

            BigDecimal daySales = salesMap.getOrDefault(current, BigDecimal.ZERO);
            BigDecimal dayCogs = cogsMap.getOrDefault(current, BigDecimal.ZERO);
            BigDecimal dayGross = daySales.subtract(dayCogs);
            BigDecimal dayExpenses = expenseMap.getOrDefault(current, BigDecimal.ZERO);
            BigDecimal dayNet = dayGross.subtract(dayExpenses);

            BigDecimal grossMargin = daySales.compareTo(BigDecimal.ZERO) > 0
                    ? dayGross.multiply(BigDecimal.valueOf(100)).divide(daySales, 2, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;
            BigDecimal netMargin = daySales.compareTo(BigDecimal.ZERO) > 0
                    ? dayNet.multiply(BigDecimal.valueOf(100)).divide(daySales, 2, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;

            dto.setSalesRevenue(daySales);
            dto.setCostOfGoodsSold(dayCogs);
            dto.setGrossProfit(dayGross);
            dto.setGrossMarginPercentage(grossMargin);
            dto.setOperatingExpenses(dayExpenses);
            dto.setNetProfit(dayNet);
            dto.setNetMarginPercentage(netMargin);

            totalSales = totalSales.add(daySales);
            totalCogs = totalCogs.add(dayCogs);
            totalGross = totalGross.add(dayGross);
            totalExpenses = totalExpenses.add(dayExpenses);
            totalNet = totalNet.add(dayNet);

            breakdowns.add(dto);
            current = current.plusDays(1);
        }

        report.setTotalSalesRevenue(totalSales);
        report.setTotalCostOfGoodsSold(totalCogs);
        report.setGrossProfit(totalGross);
        BigDecimal totalGrossMargin = totalSales.compareTo(BigDecimal.ZERO) > 0
                ? totalGross.multiply(BigDecimal.valueOf(100)).divide(totalSales, 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;
        report.setGrossMarginPercentage(totalGrossMargin);
        report.setTotalOperatingExpenses(totalExpenses);
        report.setBasicNetProfit(totalNet);
        BigDecimal totalNetMargin = totalSales.compareTo(BigDecimal.ZERO) > 0
                ? totalNet.multiply(BigDecimal.valueOf(100)).divide(totalSales, 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;
        report.setNetMarginPercentage(totalNetMargin);
        report.setDailyBreakdowns(breakdowns);

        return report;
    }

    @Override
    public StockSummaryReportDto getStockSummaryReport() {
        StockSummaryReportDto report = new StockSummaryReportDto();
        LocalDate today = LocalDate.now();

        report.setTotalMedicines(medicineRepository.countByActiveTrue());
        Long totalBatches = batchRepository.countActiveBatches();
        report.setTotalBatches(totalBatches != null ? totalBatches : 0L);
        Long totalUnits = batchRepository.sumTotalInventoryUnits();
        report.setTotalStockUnits(totalUnits != null ? totalUnits : 0L);

        BigDecimal purchaseVal = batchRepository.sumTotalPurchaseValuation();
        report.setTotalPurchaseValue(purchaseVal != null ? purchaseVal : BigDecimal.ZERO);

        BigDecimal mrpVal = batchRepository.sumTotalMrpValuation();
        report.setTotalMrpValue(mrpVal != null ? mrpVal : BigDecimal.ZERO);

        report.setPotentialMargin(report.getTotalMrpValue().subtract(report.getTotalPurchaseValue()));

        Long expired = batchRepository.countExpiredBatches(today);
        report.setExpiredBatchesCount(expired != null ? expired : 0L);

        Long expiring30 = batchRepository.countExpiringBatches(today, today.plusDays(30));
        report.setExpiringWithin30DaysCount(expiring30 != null ? expiring30 : 0L);

        Long expiring90 = batchRepository.countExpiringBatches(today, today.plusDays(90));
        report.setExpiringWithin90DaysCount(expiring90 != null ? expiring90 : 0L);

        // Low stock count
        List<Medicine> activeMedicines = medicineRepository.findAllActive();
        long lowStockCount = 0L;
        for (Medicine med : activeMedicines) {
            Integer curStock = batchRepository.findTotalQuantityByMedicineId(med.getId());
            if (curStock != null && curStock <= med.getMinimumStock()) {
                lowStockCount++;
            }
        }
        report.setLowStockCount(lowStockCount);

        // Category-wise distribution
        List<CategoryStockDistributionDto> categoryDist = new ArrayList<>();
        List<Category> categories = categoryRepository.findAll();
        for (Category cat : categories) {
            CategoryStockDistributionDto cDto = new CategoryStockDistributionDto();
            cDto.setCategoryId(cat.getId());
            cDto.setCategoryName(cat.getName());

            long medCount = 0L;
            long bCount = 0L;
            long units = 0L;
            BigDecimal catPurchase = BigDecimal.ZERO;
            BigDecimal catMrp = BigDecimal.ZERO;

            for (Medicine med : activeMedicines) {
                if (med.getCategory().getId().equals(cat.getId())) {
                    medCount++;
                    List<MedicineBatch> batches = batchRepository.findByMedicineIdOrderByExpiryDateAsc(med.getId());
                    bCount += batches.size();
                    for (MedicineBatch b : batches) {
                        units += b.getQuantity();
                        BigDecimal qty = BigDecimal.valueOf(b.getQuantity());
                        catPurchase = catPurchase.add(b.getPurchasePrice().multiply(qty));
                        catMrp = catMrp.add(b.getMrp().multiply(qty));
                    }
                }
            }

            cDto.setMedicineCount(medCount);
            cDto.setBatchCount(bCount);
            cDto.setStockUnits(units);
            cDto.setPurchaseValue(catPurchase);
            cDto.setMrpValue(catMrp);
            categoryDist.add(cDto);
        }
        report.setCategoryDistribution(categoryDist);

        return report;
    }

    @Override
    public Page<DetailedStockItemDto> getDetailedStockReport(String query, Long categoryId, Long manufacturerId,
                                                            String stockStatus, String expiryStatus, Pageable pageable) {
        LocalDate today = LocalDate.now();
        List<Medicine> medicines = medicineRepository.findAllActive();

        List<DetailedStockItemDto> allItems = new ArrayList<>();
        for (Medicine med : medicines) {
            if (categoryId != null && !med.getCategory().getId().equals(categoryId)) {
                continue;
            }
            if (manufacturerId != null && (med.getManufacturer() == null || !med.getManufacturer().getId().equals(manufacturerId))) {
                continue;
            }
            if (query != null && !query.isBlank()) {
                String q = query.toLowerCase();
                boolean matchesMed = med.getName().toLowerCase().contains(q) ||
                        (med.getGenericName() != null && med.getGenericName().toLowerCase().contains(q));
                if (!matchesMed) continue;
            }

            List<MedicineBatch> batches = batchRepository.findByMedicineIdOrderByExpiryDateAsc(med.getId());
            for (MedicineBatch b : batches) {
                DetailedStockItemDto item = new DetailedStockItemDto();
                item.setMedicineId(med.getId());
                item.setMedicineName(med.getName());
                item.setGenericName(med.getGenericName());
                item.setCategoryName(med.getCategory().getName());
                item.setManufacturerName(med.getManufacturer() != null ? med.getManufacturer().getName() : "-");
                item.setBatchId(b.getId());
                item.setBatchNumber(b.getBatchNumber());
                item.setExpiryDate(b.getExpiryDate());
                item.setQuantity(b.getQuantity());
                item.setPurchasePrice(b.getPurchasePrice());
                item.setMrp(b.getMrp());
                item.setSellingPrice(b.getSellingPrice());
                BigDecimal qty = BigDecimal.valueOf(b.getQuantity());
                item.setPurchaseValue(b.getPurchasePrice().multiply(qty));
                item.setMrpValue(b.getMrp().multiply(qty));

                // Stock Status
                if (b.getQuantity() == 0) {
                    item.setStockStatus("OUT_OF_STOCK");
                } else if (b.getQuantity() <= med.getMinimumStock()) {
                    item.setStockStatus("LOW_STOCK");
                } else {
                    item.setStockStatus("NORMAL");
                }

                // Expiry Status
                if (b.getExpiryDate().isBefore(today)) {
                    item.setExpiryStatus("EXPIRED");
                } else if (!b.getExpiryDate().isAfter(today.plusDays(30))) {
                    item.setExpiryStatus("EXPIRING_SOON");
                } else {
                    item.setExpiryStatus("NORMAL");
                }

                if (stockStatus != null && !stockStatus.isBlank() && !item.getStockStatus().equalsIgnoreCase(stockStatus)) {
                    continue;
                }
                if (expiryStatus != null && !expiryStatus.isBlank() && !item.getExpiryStatus().equalsIgnoreCase(expiryStatus)) {
                    continue;
                }

                allItems.add(item);
            }
        }

        return paginateList(allItems, pageable);
    }

    @Override
    public Page<LowStockReportItemDto> getLowStockReport(String query, Long categoryId, Pageable pageable) {
        List<Medicine> medicines = medicineRepository.findAllActive();
        List<LowStockReportItemDto> lowStockList = new ArrayList<>();

        for (Medicine med : medicines) {
            if (categoryId != null && !med.getCategory().getId().equals(categoryId)) {
                continue;
            }
            if (query != null && !query.isBlank()) {
                String q = query.toLowerCase();
                boolean matchesMed = med.getName().toLowerCase().contains(q) ||
                        (med.getGenericName() != null && med.getGenericName().toLowerCase().contains(q));
                if (!matchesMed) continue;
            }

            Integer curStock = batchRepository.findTotalQuantityByMedicineId(med.getId());
            int stock = curStock != null ? curStock : 0;
            if (stock <= med.getMinimumStock()) {
                LowStockReportItemDto dto = new LowStockReportItemDto();
                dto.setMedicineId(med.getId());
                dto.setMedicineName(med.getName());
                dto.setGenericName(med.getGenericName());
                dto.setCategoryName(med.getCategory().getName());
                dto.setManufacturerName(med.getManufacturer() != null ? med.getManufacturer().getName() : "-");
                dto.setUnit(med.getUnit());
                dto.setPackSize(med.getPackSize());
                dto.setMinimumStock(med.getMinimumStock());
                dto.setCurrentStock(stock);
                int deficit = med.getMinimumStock() - stock;
                dto.setDeficit(Math.max(deficit, 0));
                dto.setStockStatus(stock == 0 ? "OUT_OF_STOCK" : "LOW_STOCK");
                dto.setSuggestedReorderQuantity(Math.max(deficit * 2, med.getMinimumStock() + 10));

                lowStockList.add(dto);
            }
        }

        return paginateList(lowStockList, pageable);
    }

    @Override
    public Page<ExpiryReportItemDto> getExpiryReport(String window, String query, Pageable pageable) {
        LocalDate today = LocalDate.now();
        List<Medicine> medicines = medicineRepository.findAllActive();
        List<ExpiryReportItemDto> expiryList = new ArrayList<>();

        for (Medicine med : medicines) {
            if (query != null && !query.isBlank()) {
                String q = query.toLowerCase();
                boolean matchesMed = med.getName().toLowerCase().contains(q) ||
                        (med.getGenericName() != null && med.getGenericName().toLowerCase().contains(q));
                if (!matchesMed) continue;
            }

            List<MedicineBatch> batches = batchRepository.findByMedicineIdOrderByExpiryDateAsc(med.getId());
            for (MedicineBatch b : batches) {
                if (b.getQuantity() <= 0) continue;

                long daysLeft = ChronoUnit.DAYS.between(today, b.getExpiryDate());
                String status;
                if (daysLeft < 0) {
                    status = "EXPIRED";
                } else if (daysLeft <= 30) {
                    status = "EXPIRING_30";
                } else if (daysLeft <= 60) {
                    status = "EXPIRING_60";
                } else if (daysLeft <= 90) {
                    status = "EXPIRING_90";
                } else {
                    status = "NORMAL";
                }

                // Filter window
                if (window != null && !window.isBlank()) {
                    if ("EXPIRED".equalsIgnoreCase(window) && !"EXPIRED".equals(status)) continue;
                    if ("WITHIN_30".equalsIgnoreCase(window) && !"EXPIRING_30".equals(status)) continue;
                    if ("WITHIN_60".equalsIgnoreCase(window) && !("EXPIRING_30".equals(status) || "EXPIRING_60".equals(status))) continue;
                    if ("WITHIN_90".equalsIgnoreCase(window) && !("EXPIRING_30".equals(status) || "EXPIRING_60".equals(status) || "EXPIRING_90".equals(status))) continue;
                    if ("ALL_AT_RISK".equalsIgnoreCase(window) && "NORMAL".equals(status)) continue;
                } else {
                    // Default to showing all at risk (<= 90 days or expired)
                    if ("NORMAL".equals(status)) continue;
                }

                ExpiryReportItemDto dto = new ExpiryReportItemDto();
                dto.setBatchId(b.getId());
                dto.setMedicineId(med.getId());
                dto.setMedicineName(med.getName());
                dto.setGenericName(med.getGenericName());
                dto.setCategoryName(med.getCategory().getName());
                dto.setBatchNumber(b.getBatchNumber());
                dto.setExpiryDate(b.getExpiryDate());
                dto.setQuantity(b.getQuantity());
                dto.setPurchasePrice(b.getPurchasePrice());
                dto.setMrp(b.getMrp());
                dto.setTotalAtRiskPurchaseValue(b.getPurchasePrice().multiply(BigDecimal.valueOf(b.getQuantity())));
                dto.setDaysUntilExpiry(daysLeft);
                dto.setExpiryStatus(status);

                expiryList.add(dto);
            }
        }

        return paginateList(expiryList, pageable);
    }

    @Override
    public Page<CustomerOutstandingReportItemDto> getCustomerOutstandingReport(String query, Pageable pageable) {
        Page<Customer> customerPage = customerRepository.searchCustomers(query, true, pageable);
        List<CustomerOutstandingReportItemDto> list = new ArrayList<>();

        for (Customer c : customerPage.getContent()) {
            CustomerOutstandingReportItemDto dto = new CustomerOutstandingReportItemDto();
            dto.setCustomerId(c.getId());
            dto.setCustomerName(c.getName());
            dto.setPhone(c.getPhone());
            dto.setDoctorName(c.getDoctorName());
            dto.setOutstandingBalance(c.getCurrentBalance());

            // Get historical customer sales
            List<Sale> sales = saleRepository.searchSales("", c.getId(), null, null, null, PageRequest.of(0, 500)).getContent();
            BigDecimal totalInvoiced = sales.stream().map(Sale::getTotalAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal totalPaid = sales.stream().map(Sale::getPaidAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
            dto.setTotalBillsCount((long) sales.size());
            dto.setTotalInvoiced(totalInvoiced);
            dto.setTotalPaid(totalPaid);

            list.add(dto);
        }

        return new PageImpl<>(list, pageable, customerPage.getTotalElements());
    }

    @Override
    public Page<SupplierOutstandingReportItemDto> getSupplierOutstandingReport(String query, Pageable pageable) {
        Page<Supplier> supplierPage = supplierRepository.searchSuppliers(query, true, pageable);
        List<SupplierOutstandingReportItemDto> list = new ArrayList<>();

        for (Supplier sp : supplierPage.getContent()) {
            SupplierOutstandingReportItemDto dto = new SupplierOutstandingReportItemDto();
            dto.setSupplierId(sp.getId());
            dto.setSupplierName(sp.getName());
            dto.setPhone(sp.getPhone());
            dto.setContactPerson(sp.getContactPerson());
            dto.setGstNumber(sp.getGstNumber());
            dto.setOutstandingBalance(sp.getCurrentBalance());

            // Get historical purchases
            List<Purchase> purchases = purchaseRepository.searchPurchases("", sp.getId(), null, null, null, PageRequest.of(0, 500)).getContent();
            BigDecimal totalInvoiced = purchases.stream().map(Purchase::getTotalAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal totalPaid = purchases.stream().map(Purchase::getPaidAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
            dto.setTotalPurchasesCount((long) purchases.size());
            dto.setTotalInvoiced(totalInvoiced);
            dto.setTotalPaid(totalPaid);

            list.add(dto);
        }

        return new PageImpl<>(list, pageable, supplierPage.getTotalElements());
    }

    @Override
    public byte[] exportReportToCsv(String reportType, LocalDate startDate, LocalDate endDate, String query) {
        StringBuilder csv = new StringBuilder();

        switch (reportType.toLowerCase()) {
            case "sales" -> {
                csv.append("Invoice Number,Sale Date,Customer,Phone,Subtotal,Discount,Tax,Total,Paid,Balance,Payment Mode,Status\n");
                SalesReportDto sales = getSalesReport(startDate, endDate, null, null, null, query, PageRequest.of(0, 5000));
                for (SalesReportItemDto item : sales.getItems().getContent()) {
                    csv.append(escape(item.getInvoiceNumber())).append(",")
                            .append(item.getSaleDate()).append(",")
                            .append(escape(item.getCustomerName())).append(",")
                            .append(escape(item.getCustomerPhone())).append(",")
                            .append(item.getSubtotal()).append(",")
                            .append(item.getDiscountAmount()).append(",")
                            .append(item.getTaxAmount()).append(",")
                            .append(item.getTotalAmount()).append(",")
                            .append(item.getPaidAmount()).append(",")
                            .append(item.getBalanceAmount()).append(",")
                            .append(item.getPaymentMode()).append(",")
                            .append(item.getPaymentStatus()).append("\n");
                }
            }
            case "purchases" -> {
                csv.append("Purchase Number,Supplier Invoice,Purchase Date,Supplier,Subtotal,Discount,Tax,Total,Paid,Balance,Mode,Status\n");
                PurchaseReportDto purchases = getPurchaseReport(startDate, endDate, null, null, query, PageRequest.of(0, 5000));
                for (PurchaseReportItemDto item : purchases.getItems().getContent()) {
                    csv.append(escape(item.getPurchaseNumber())).append(",")
                            .append(escape(item.getSupplierInvoiceNumber())).append(",")
                            .append(item.getPurchaseDate()).append(",")
                            .append(escape(item.getSupplierName())).append(",")
                            .append(item.getSubtotal()).append(",")
                            .append(item.getDiscountAmount()).append(",")
                            .append(item.getTaxAmount()).append(",")
                            .append(item.getTotalAmount()).append(",")
                            .append(item.getPaidAmount()).append(",")
                            .append(item.getBalanceAmount()).append(",")
                            .append(item.getPaymentMode()).append(",")
                            .append(item.getPaymentStatus()).append("\n");
                }
            }
            case "expenses" -> {
                csv.append("Voucher Number,Date,Category,Recipient,Amount,Mode,Reference,Notes\n");
                ExpenseReportDto expenses = getExpenseReport(startDate, endDate, null, query, PageRequest.of(0, 5000));
                for (ExpenseReportItemDto item : expenses.getItems().getContent()) {
                    csv.append(escape(item.getVoucherNumber())).append(",")
                            .append(item.getExpenseDate()).append(",")
                            .append(escape(item.getCategoryName())).append(",")
                            .append(escape(item.getRecipientName())).append(",")
                            .append(item.getAmount()).append(",")
                            .append(item.getPaymentMode()).append(",")
                            .append(escape(item.getReferenceNumber())).append(",")
                            .append(escape(item.getNotes())).append("\n");
                }
            }
            case "profit" -> {
                csv.append("Date,Sales Revenue,COGS,Gross Profit,Gross Margin %,Operating Expenses,Net Profit,Net Margin %\n");
                BasicProfitReportDto profit = getBasicProfitReport(startDate, endDate);
                for (DailyProfitBreakdownDto item : profit.getDailyBreakdowns()) {
                    csv.append(item.getDate()).append(",")
                            .append(item.getSalesRevenue()).append(",")
                            .append(item.getCostOfGoodsSold()).append(",")
                            .append(item.getGrossProfit()).append(",")
                            .append(item.getGrossMarginPercentage()).append("%,")
                            .append(item.getOperatingExpenses()).append(",")
                            .append(item.getNetProfit()).append(",")
                            .append(item.getNetMarginPercentage()).append("%\n");
                }
            }
            case "stock_detailed" -> {
                csv.append("Medicine,Generic Name,Category,Manufacturer,Batch,Expiry Date,Quantity,Purchase Price,MRP,Selling Price,Purchase Value,MRP Value,Stock Status,Expiry Status\n");
                Page<DetailedStockItemDto> stock = getDetailedStockReport(query, null, null, null, null, PageRequest.of(0, 5000));
                for (DetailedStockItemDto item : stock.getContent()) {
                    csv.append(escape(item.getMedicineName())).append(",")
                            .append(escape(item.getGenericName())).append(",")
                            .append(escape(item.getCategoryName())).append(",")
                            .append(escape(item.getManufacturerName())).append(",")
                            .append(escape(item.getBatchNumber())).append(",")
                            .append(item.getExpiryDate()).append(",")
                            .append(item.getQuantity()).append(",")
                            .append(item.getPurchasePrice()).append(",")
                            .append(item.getMrp()).append(",")
                            .append(item.getSellingPrice()).append(",")
                            .append(item.getPurchaseValue()).append(",")
                            .append(item.getMrpValue()).append(",")
                            .append(item.getStockStatus()).append(",")
                            .append(item.getExpiryStatus()).append("\n");
                }
            }
            case "low_stock" -> {
                csv.append("Medicine,Generic Name,Category,Manufacturer,Unit,Min Stock,Current Stock,Deficit,Status,Suggested Reorder\n");
                Page<LowStockReportItemDto> lowStock = getLowStockReport(query, null, PageRequest.of(0, 5000));
                for (LowStockReportItemDto item : lowStock.getContent()) {
                    csv.append(escape(item.getMedicineName())).append(",")
                            .append(escape(item.getGenericName())).append(",")
                            .append(escape(item.getCategoryName())).append(",")
                            .append(escape(item.getManufacturerName())).append(",")
                            .append(item.getUnit()).append(",")
                            .append(item.getMinimumStock()).append(",")
                            .append(item.getCurrentStock()).append(",")
                            .append(item.getDeficit()).append(",")
                            .append(item.getStockStatus()).append(",")
                            .append(item.getSuggestedReorderQuantity()).append("\n");
                }
            }
            case "expiry" -> {
                csv.append("Medicine,Category,Batch,Expiry Date,Days Left,Quantity,Purchase Price,MRP,At-Risk Value,Status\n");
                Page<ExpiryReportItemDto> expiry = getExpiryReport(null, query, PageRequest.of(0, 5000));
                for (ExpiryReportItemDto item : expiry.getContent()) {
                    csv.append(escape(item.getMedicineName())).append(",")
                            .append(escape(item.getCategoryName())).append(",")
                            .append(escape(item.getBatchNumber())).append(",")
                            .append(item.getExpiryDate()).append(",")
                            .append(item.getDaysUntilExpiry()).append(",")
                            .append(item.getQuantity()).append(",")
                            .append(item.getPurchasePrice()).append(",")
                            .append(item.getMrp()).append(",")
                            .append(item.getTotalAtRiskPurchaseValue()).append(",")
                            .append(item.getExpiryStatus()).append("\n");
                }
            }
            case "customer_outstanding" -> {
                csv.append("Customer,Phone,Doctor,Bills Count,Total Invoiced,Total Paid,Outstanding Balance\n");
                Page<CustomerOutstandingReportItemDto> cust = getCustomerOutstandingReport(query, PageRequest.of(0, 5000));
                for (CustomerOutstandingReportItemDto item : cust.getContent()) {
                    csv.append(escape(item.getCustomerName())).append(",")
                            .append(escape(item.getPhone())).append(",")
                            .append(escape(item.getDoctorName())).append(",")
                            .append(item.getTotalBillsCount()).append(",")
                            .append(item.getTotalInvoiced()).append(",")
                            .append(item.getTotalPaid()).append(",")
                            .append(item.getOutstandingBalance()).append("\n");
                }
            }
            case "supplier_outstanding" -> {
                csv.append("Supplier,Phone,Contact Person,GSTIN,Purchases Count,Total Invoiced,Total Paid,Outstanding Balance\n");
                Page<SupplierOutstandingReportItemDto> supp = getSupplierOutstandingReport(query, PageRequest.of(0, 5000));
                for (SupplierOutstandingReportItemDto item : supp.getContent()) {
                    csv.append(escape(item.getSupplierName())).append(",")
                            .append(escape(item.getPhone())).append(",")
                            .append(escape(item.getContactPerson())).append(",")
                            .append(escape(item.getGstNumber())).append(",")
                            .append(item.getTotalPurchasesCount()).append(",")
                            .append(item.getTotalInvoiced()).append(",")
                            .append(item.getTotalPaid()).append(",")
                            .append(item.getOutstandingBalance()).append("\n");
                }
            }
            default -> csv.append("Unsupported report type: ").append(reportType).append("\n");
        }

        return csv.toString().getBytes(StandardCharsets.UTF_8);
    }

    private String escape(String s) {
        if (s == null) return "";
        if (s.contains(",") || s.contains("\"") || s.contains("\n")) {
            return "\"" + s.replace("\"", "\"\"") + "\"";
        }
        return s;
    }

    private <T> Page<T> paginateList(List<T> list, Pageable pageable) {
        int start = (int) pageable.getOffset();
        if (start >= list.size()) {
            return new PageImpl<>(Collections.emptyList(), pageable, list.size());
        }
        int end = Math.min((start + pageable.getPageSize()), list.size());
        return new PageImpl<>(list.subList(start, end), pageable, list.size());
    }

    private LocalDate toLocalDate(Object obj) {
        if (obj instanceof LocalDate ld) {
            return ld;
        } else if (obj instanceof java.sql.Date sd) {
            return sd.toLocalDate();
        } else if (obj != null) {
            return LocalDate.parse(obj.toString());
        }
        return null;
    }
}
