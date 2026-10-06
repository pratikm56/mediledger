export interface Category {
  id: number;
  name: string;
  description?: string;
  active: boolean;
  medicineCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryData {
  name: string;
  description?: string;
}

export interface Manufacturer {
  id: number;
  name: string;
  contact?: string;
  email?: string;
  address?: string;
  active: boolean;
  medicineCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateManufacturerData {
  name: string;
  contact?: string;
  email?: string;
  address?: string;
}

export interface Medicine {
  id: number;
  name: string;
  genericName?: string;
  categoryId: number;
  categoryName: string;
  manufacturerId?: number;
  manufacturerName?: string;
  hsnCode?: string;
  gstPercentage: number;
  unit: string;
  packSize?: string;
  prescriptionRequired: boolean;
  minimumStock: number;
  description?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMedicineData {
  name: string;
  genericName?: string;
  categoryId: number;
  manufacturerId?: number;
  hsnCode?: string;
  gstPercentage: number;
  unit: string;
  packSize?: string;
  prescriptionRequired: boolean;
  minimumStock: number;
  description?: string;
}

export interface UpdateMedicineData {
  name: string;
  genericName?: string;
  categoryId: number;
  manufacturerId?: number;
  hsnCode?: string;
  gstPercentage: number;
  unit: string;
  packSize?: string;
  prescriptionRequired: boolean;
  minimumStock: number;
  description?: string;
  active?: boolean;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}
