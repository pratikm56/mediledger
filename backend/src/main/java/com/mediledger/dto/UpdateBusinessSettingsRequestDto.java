package com.mediledger.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class UpdateBusinessSettingsRequestDto {

    @NotBlank(message = "Shop name is required")
    @Size(max = 100, message = "Shop name must not exceed 100 characters")
    private String shopName;

    @Size(max = 100, message = "Owner name must not exceed 100 characters")
    private String ownerName;

    @Size(max = 255, message = "Shop address must not exceed 255 characters")
    private String shopAddress;

    @Size(max = 50, message = "Shop phone must not exceed 50 characters")
    private String shopPhone;

    @Size(max = 100, message = "Shop email must not exceed 100 characters")
    private String shopEmail;

    @Size(max = 50, message = "GSTIN must not exceed 50 characters")
    private String gstin;

    @Size(max = 20, message = "Invoice prefix must not exceed 20 characters")
    private String invoicePrefix;

    @Size(max = 20, message = "Invoice counter must not exceed 20 characters")
    private String invoiceCounter;

    @Size(max = 10, message = "Currency code must not exceed 10 characters")
    private String currency;

    @Size(max = 10, message = "Currency symbol must not exceed 10 characters")
    private String currencySymbol;

    @Size(max = 10, message = "Default GST rate must not exceed 10 characters")
    private String defaultGstRate;

    @Size(max = 255, message = "Invoice footer message must not exceed 255 characters")
    private String invoiceFooter;

    public UpdateBusinessSettingsRequestDto() {
    }

    public String getShopName() {
        return shopName;
    }

    public void setShopName(String shopName) {
        this.shopName = shopName;
    }

    public String getOwnerName() {
        return ownerName;
    }

    public void setOwnerName(String ownerName) {
        this.ownerName = ownerName;
    }

    public String getShopAddress() {
        return shopAddress;
    }

    public void setShopAddress(String shopAddress) {
        this.shopAddress = shopAddress;
    }

    public String getShopPhone() {
        return shopPhone;
    }

    public void setShopPhone(String shopPhone) {
        this.shopPhone = shopPhone;
    }

    public String getShopEmail() {
        return shopEmail;
    }

    public void setShopEmail(String shopEmail) {
        this.shopEmail = shopEmail;
    }

    public String getGstin() {
        return gstin;
    }

    public void setGstin(String gstin) {
        this.gstin = gstin;
    }

    public String getInvoicePrefix() {
        return invoicePrefix;
    }

    public void setInvoicePrefix(String invoicePrefix) {
        this.invoicePrefix = invoicePrefix;
    }

    public String getInvoiceCounter() {
        return invoiceCounter;
    }

    public void setInvoiceCounter(String invoiceCounter) {
        this.invoiceCounter = invoiceCounter;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public String getCurrencySymbol() {
        return currencySymbol;
    }

    public void setCurrencySymbol(String currencySymbol) {
        this.currencySymbol = currencySymbol;
    }

    public String getDefaultGstRate() {
        return defaultGstRate;
    }

    public void setDefaultGstRate(String defaultGstRate) {
        this.defaultGstRate = defaultGstRate;
    }

    public String getInvoiceFooter() {
        return invoiceFooter;
    }

    public void setInvoiceFooter(String invoiceFooter) {
        this.invoiceFooter = invoiceFooter;
    }
}
