package com.mediledger.service.impl;

import com.mediledger.dto.*;
import com.mediledger.entity.Medicine;
import com.mediledger.entity.MedicineBatch;
import com.mediledger.mapper.MedicineBatchMapper;
import com.mediledger.mapper.SaleMapper;
import com.mediledger.repository.*;
import com.mediledger.service.DashboardService;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class DashboardServiceImpl implements DashboardService {

    private final SaleRepository saleRepository;
    private final SaleItemRepository saleItemRepository;
    private final PurchaseRepository purchaseRepository;
    private final ExpenseRepository expenseRepository;
    private final MedicineBatchRepository batchRepository;
    private final MedicineRepository medicineRepository;
    private final CustomerRepository customerRepository;
    private final SupplierRepository supplierRepository;
    private final SaleMapper saleMapper;
    private final MedicineBatchMapper batchMapper;

    public DashboardServiceImpl(SaleRepository saleRepository,
                                SaleItemRepository saleItemRepository,
                                PurchaseRepository purchaseRepository,
                                ExpenseRepository expenseRepository,
                                MedicineBatchRepository batchRepository,
                                MedicineRepository medicineRepository,
                                CustomerRepository customerRepository,
                                SupplierRepository supplierRepository,
                                SaleMapper saleMapper,
                                MedicineBatchMapper batchMapper) {
        this.saleRepository = saleRepository;
        this.saleItemRepository = saleItemRepository;
        this.purchaseRepository = purchaseRepository;
        this.expenseRepository = expenseRepository;
        this.batchRepository = batchRepository;
        this.medicineRepository = medicineRepository;
        this.customerRepository = customerRepository;
        this.supplierRepository = supplierRepository;
        this.saleMapper = saleMapper;
        this.batchMapper = batchMapper;
    }

    @Override
    public DashboardSummaryDto getDashboardSummary() {
        LocalDate today = LocalDate.now();
        DashboardSummaryDto summary = new DashboardSummaryDto();

        // 1. Today's Financial Metrics
        BigDecimal todaySales = saleRepository.sumSalesTodayAmount(today);
        summary.setTodaySalesAmount(todaySales != null ? todaySales : BigDecimal.ZERO);
        Long todaySalesCount = saleRepository.countSalesToday(today);
        summary.setTodaySalesCount(todaySalesCount != null ? todaySalesCount : 0L);

        BigDecimal todayPurchases = purchaseRepository.sumPurchasesToday(today);
        summary.setTodayPurchasesAmount(todayPurchases != null ? todayPurchases : BigDecimal.ZERO);
        Long todayPurchasesCount = purchaseRepository.countPurchasesToday(today);
        summary.setTodayPurchasesCount(todayPurchasesCount != null ? todayPurchasesCount : 0L);

        BigDecimal todayExpenses = expenseRepository.sumExpensesToday(today);
        summary.setTodayExpensesAmount(todayExpenses != null ? todayExpenses : BigDecimal.ZERO);
        Long todayExpensesCount = expenseRepository.countExpensesToday(today);
        summary.setTodayExpensesCount(todayExpensesCount != null ? todayExpensesCount : 0L);

        BigDecimal todayCogs = saleItemRepository.sumCostOfGoodsSoldByDate(today);
        summary.setTodayCostOfGoodsSold(todayCogs != null ? todayCogs : BigDecimal.ZERO);

        BigDecimal todayGross = summary.getTodaySalesAmount().subtract(summary.getTodayCostOfGoodsSold());
        summary.setTodayGrossProfit(todayGross);

        BigDecimal todayNet = todayGross.subtract(summary.getTodayExpensesAmount());
        summary.setTodayNetProfit(todayNet);

        // 2. Cumulative / Overall Financials
        BigDecimal totalSales = saleRepository.sumTotalSalesAmount();
        summary.setTotalSalesAmount(totalSales != null ? totalSales : BigDecimal.ZERO);

        BigDecimal totalPurchases = purchaseRepository.sumTotalPurchasesAmount();
        summary.setTotalPurchasesAmount(totalPurchases != null ? totalPurchases : BigDecimal.ZERO);

        BigDecimal totalExpenses = expenseRepository.sumTotalExpenses();
        summary.setTotalExpensesAmount(totalExpenses != null ? totalExpenses : BigDecimal.ZERO);

        BigDecimal totalCogs = saleItemRepository.sumTotalCostOfGoodsSold();
        summary.setTotalCostOfGoodsSold(totalCogs != null ? totalCogs : BigDecimal.ZERO);

        BigDecimal totalGross = summary.getTotalSalesAmount().subtract(summary.getTotalCostOfGoodsSold());
        summary.setTotalGrossProfit(totalGross);

        BigDecimal totalNet = totalGross.subtract(summary.getTotalExpensesAmount());
        summary.setTotalNetProfit(totalNet);

        // 3. Inventory & Valuation Metrics
        summary.setTotalMedicines(medicineRepository.countByActiveTrue());

        Long totalBatches = batchRepository.countActiveBatches();
        summary.setTotalBatches(totalBatches != null ? totalBatches : 0L);

        Long totalUnits = batchRepository.sumTotalInventoryUnits();
        summary.setTotalStockUnits(totalUnits != null ? totalUnits : 0L);

        BigDecimal purchaseVal = batchRepository.sumTotalPurchaseValuation();
        summary.setTotalStockPurchaseValue(purchaseVal != null ? purchaseVal : BigDecimal.ZERO);

        BigDecimal sellingVal = batchRepository.sumTotalSellingValuation();
        summary.setTotalStockSellingValue(sellingVal != null ? sellingVal : BigDecimal.ZERO);

        BigDecimal mrpVal = batchRepository.sumTotalMrpValuation();
        summary.setTotalStockMrpValue(mrpVal != null ? mrpVal : BigDecimal.ZERO);

        // 4. Operational Alerts
        Long expiredCount = batchRepository.countExpiredBatches(today);
        summary.setExpiredBatchesCount(expiredCount != null ? expiredCount : 0L);

        Long expiring30 = batchRepository.countExpiringBatches(today, today.plusDays(30));
        summary.setExpiringWithin30DaysCount(expiring30 != null ? expiring30 : 0L);

        Long expiring90 = batchRepository.countExpiringBatches(today, today.plusDays(90));
        summary.setExpiringWithin90DaysCount(expiring90 != null ? expiring90 : 0L);

        List<Medicine> activeMedicines = medicineRepository.findAllActive();
        long lowStockCount = 0L;
        for (Medicine med : activeMedicines) {
            Integer currentStock = batchRepository.findTotalQuantityByMedicineId(med.getId());
            if (currentStock != null && currentStock <= med.getMinimumStock()) {
                lowStockCount++;
            }
        }
        summary.setLowStockCount(lowStockCount);

        // 5. Ledger Outstanding Balances
        BigDecimal receivables = customerRepository.sumTotalReceivables();
        summary.setCustomerOutstanding(receivables != null ? receivables : BigDecimal.ZERO);

        BigDecimal payables = supplierRepository.sumTotalPayables();
        summary.setSupplierOutstanding(payables != null ? payables : BigDecimal.ZERO);

        return summary;
    }

    @Override
    public List<DashboardTrendDto> getDashboardTrends(int days) {
        if (days <= 0) {
            days = 7;
        } else if (days > 90) {
            days = 90;
        }

        LocalDate today = LocalDate.now();
        LocalDate startDate = today.minusDays(days - 1);
        LocalDate endDate = today;

        // Populate Daily Sales & Volume Map
        Map<LocalDate, BigDecimal> salesMap = new HashMap<>();
        Map<LocalDate, Long> salesCountMap = new HashMap<>();
        for (Object[] row : saleRepository.getDailySalesSummary(startDate, endDate)) {
            LocalDate d = toLocalDate(row[0]);
            if (d != null) {
                salesMap.put(d, (BigDecimal) row[1]);
                salesCountMap.put(d, ((Number) row[2]).longValue());
            }
        }

        // Populate Daily Cost of Goods Sold (COGS) Map
        Map<LocalDate, BigDecimal> cogsMap = new HashMap<>();
        for (Object[] row : saleItemRepository.getDailyCogsSummary(startDate, endDate)) {
            LocalDate d = toLocalDate(row[0]);
            if (d != null) {
                cogsMap.put(d, (BigDecimal) row[1]);
            }
        }

        // Populate Daily Purchases Map
        Map<LocalDate, BigDecimal> purchaseMap = new HashMap<>();
        Map<LocalDate, Long> purchaseCountMap = new HashMap<>();
        for (Object[] row : purchaseRepository.getDailyPurchasesSummary(startDate, endDate)) {
            LocalDate d = toLocalDate(row[0]);
            if (d != null) {
                purchaseMap.put(d, (BigDecimal) row[1]);
                purchaseCountMap.put(d, ((Number) row[2]).longValue());
            }
        }

        // Populate Daily Expenses Map
        Map<LocalDate, BigDecimal> expenseMap = new HashMap<>();
        Map<LocalDate, Long> expenseCountMap = new HashMap<>();
        for (Object[] row : expenseRepository.getDailyExpensesSummary(startDate, endDate)) {
            LocalDate d = toLocalDate(row[0]);
            if (d != null) {
                expenseMap.put(d, (BigDecimal) row[1]);
                expenseCountMap.put(d, ((Number) row[2]).longValue());
            }
        }

        // Build Continuous Date Range
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM dd");
        List<DashboardTrendDto> trends = new ArrayList<>();
        LocalDate current = startDate;

        while (!current.isAfter(endDate)) {
            DashboardTrendDto dto = new DashboardTrendDto(current, current.format(formatter));

            BigDecimal daySales = salesMap.getOrDefault(current, BigDecimal.ZERO);
            Long daySalesCount = salesCountMap.getOrDefault(current, 0L);
            BigDecimal dayCogs = cogsMap.getOrDefault(current, BigDecimal.ZERO);
            BigDecimal dayPurchases = purchaseMap.getOrDefault(current, BigDecimal.ZERO);
            Long dayPurchasesCount = purchaseCountMap.getOrDefault(current, 0L);
            BigDecimal dayExpenses = expenseMap.getOrDefault(current, BigDecimal.ZERO);
            Long dayExpensesCount = expenseCountMap.getOrDefault(current, 0L);

            BigDecimal grossProfit = daySales.subtract(dayCogs);
            BigDecimal netProfit = grossProfit.subtract(dayExpenses);

            dto.setSalesAmount(daySales);
            dto.setSalesCount(daySalesCount);
            dto.setCogsAmount(dayCogs);
            dto.setPurchasesAmount(dayPurchases);
            dto.setPurchasesCount(dayPurchasesCount);
            dto.setExpensesAmount(dayExpenses);
            dto.setExpensesCount(dayExpensesCount);
            dto.setGrossProfit(grossProfit);
            dto.setNetProfit(netProfit);

            trends.add(dto);
            current = current.plusDays(1);
        }

        return trends;
    }

    @Override
    public DashboardAlertsDto getDashboardAlerts() {
        LocalDate today = LocalDate.now();
        DashboardAlertsDto alerts = new DashboardAlertsDto();

        // 1. Top Low Stock Items (top 5)
        List<Medicine> activeMedicines = medicineRepository.findAllActive();
        List<MedicineStockDto> lowStockList = new ArrayList<>();
        for (Medicine med : activeMedicines) {
            List<MedicineBatch> batches = batchRepository.findByMedicineIdOrderByExpiryDateAsc(med.getId());
            int totalStock = batches.stream().mapToInt(MedicineBatch::getQuantity).sum();
            if (totalStock <= med.getMinimumStock()) {
                MedicineStockDto dto = new MedicineStockDto();
                dto.setMedicineId(med.getId());
                dto.setMedicineName(med.getName());
                dto.setGenericName(med.getGenericName());
                dto.setCategoryId(med.getCategory() != null ? med.getCategory().getId() : null);
                dto.setCategoryName(med.getCategory() != null ? med.getCategory().getName() : null);
                dto.setManufacturerId(med.getManufacturer() != null ? med.getManufacturer().getId() : null);
                dto.setManufacturerName(med.getManufacturer() != null ? med.getManufacturer().getName() : null);
                dto.setUnit(med.getUnit());
                dto.setPackSize(med.getPackSize());
                dto.setMinimumStock(med.getMinimumStock());
                dto.setCurrentStock(totalStock);
                dto.setLowStock(true);
                dto.setBatchCount(batches.size());
                dto.setBatches(batches.stream().map(batchMapper::toDto).collect(Collectors.toList()));
                lowStockList.add(dto);
            }
        }
        alerts.setLowStockItems(lowStockList.stream().limit(5).collect(Collectors.toList()));

        // 2. Top Expiring Batches (≤30 Days, top 5)
        List<MedicineBatchDto> expiring = batchRepository.findExpiringBatches(today, today.plusDays(30), PageRequest.of(0, 5))
                .getContent().stream().map(batchMapper::toDto).collect(Collectors.toList());
        alerts.setExpiringItems(expiring);

        // 3. Top Expired Batches (top 5)
        List<MedicineBatchDto> expired = batchRepository.findExpiredBatches(today, PageRequest.of(0, 5))
                .getContent().stream().map(batchMapper::toDto).collect(Collectors.toList());
        alerts.setExpiredItems(expired);

        // 4. Top Recent Sales (top 5)
        List<SaleDto> recentSales = saleRepository.findTop5ByOrderByCreatedAtDesc()
                .stream().map(saleMapper::toDto).collect(Collectors.toList());
        alerts.setRecentSales(recentSales);

        return alerts;
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
