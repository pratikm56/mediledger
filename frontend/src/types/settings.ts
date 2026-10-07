export interface BusinessSettingsMap {
  shop_name?: string;
  owner_name?: string;
  shop_address?: string;
  shop_phone?: string;
  shop_email?: string;
  gstin?: string;
  invoice_prefix?: string;
  invoice_counter?: string;
  currency?: string;
  currency_symbol?: string;
  default_gst_rate?: string;
  invoice_footer?: string;
  [key: string]: string | undefined;
}

export interface UpdateBusinessSettingsRequest {
  shopName: string;
  ownerName?: string;
  shopAddress?: string;
  shopPhone?: string;
  shopEmail?: string;
  gstin?: string;
  invoicePrefix?: string;
  invoiceCounter?: string;
  currency?: string;
  currencySymbol?: string;
  defaultGstRate?: string;
  invoiceFooter?: string;
}
