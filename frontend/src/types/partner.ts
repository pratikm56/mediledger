export interface Customer {
  id: number;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  doctorName?: string;
  gstNumber?: string;
  openingBalance: number;
  currentBalance: number;
  creditLimit: number;
  active: boolean;
  hasOutstanding: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerRequest {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  doctorName?: string;
  gstNumber?: string;
  openingBalance?: number;
  creditLimit?: number;
}

export interface UpdateCustomerRequest {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  doctorName?: string;
  gstNumber?: string;
  creditLimit?: number;
}

export interface CustomerOutstandingSummary {
  totalCustomersWithOutstanding: number;
  totalReceivablesAmount: number;
}

export interface Supplier {
  id: number;
  name: string;
  contactPerson?: string;
  phone: string;
  email?: string;
  address?: string;
  gstNumber?: string;
  drugLicenseNumber?: string;
  openingBalance: number;
  currentBalance: number;
  paymentTermsDays: number;
  active: boolean;
  hasOutstanding: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSupplierRequest {
  name: string;
  contactPerson?: string;
  phone: string;
  email?: string;
  address?: string;
  gstNumber?: string;
  drugLicenseNumber?: string;
  openingBalance?: number;
  paymentTermsDays?: number;
}

export interface UpdateSupplierRequest {
  name: string;
  contactPerson?: string;
  phone: string;
  email?: string;
  address?: string;
  gstNumber?: string;
  drugLicenseNumber?: string;
  paymentTermsDays: number;
}

export interface SupplierOutstandingSummary {
  totalSuppliersWithOutstanding: number;
  totalPayablesAmount: number;
}
