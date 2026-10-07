package com.mediledger.dto;

import java.util.ArrayList;
import java.util.List;

public class DashboardAlertsDto {

    private List<MedicineStockDto> lowStockItems = new ArrayList<>();
    private List<MedicineBatchDto> expiringItems = new ArrayList<>();
    private List<MedicineBatchDto> expiredItems = new ArrayList<>();
    private List<SaleDto> recentSales = new ArrayList<>();

    public DashboardAlertsDto() {
    }

    public List<MedicineStockDto> getLowStockItems() {
        return lowStockItems;
    }

    public void setLowStockItems(List<MedicineStockDto> lowStockItems) {
        this.lowStockItems = lowStockItems;
    }

    public List<MedicineBatchDto> getExpiringItems() {
        return expiringItems;
    }

    public void setExpiringItems(List<MedicineBatchDto> expiringItems) {
        this.expiringItems = expiringItems;
    }

    public List<MedicineBatchDto> getExpiredItems() {
        return expiredItems;
    }

    public void setExpiredItems(List<MedicineBatchDto> expiredItems) {
        this.expiredItems = expiredItems;
    }

    public List<SaleDto> getRecentSales() {
        return recentSales;
    }

    public void setRecentSales(List<SaleDto> recentSales) {
        this.recentSales = recentSales;
    }
}
