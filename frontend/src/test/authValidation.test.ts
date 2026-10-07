import { describe, it, expect } from 'vitest';
import { z } from 'zod';

export const loginSchema = z.object({
  usernameOrEmail: z.string().min(1, 'Username or Email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const medicineFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  genericName: z.string().optional(),
  categoryId: z.number().positive('Please select a category'),
  manufacturerId: z.number().positive('Please select a manufacturer'),
  hsnCode: z.string().optional(),
  gstPercentage: z.number().min(0).max(100),
  unit: z.string().min(1, 'Unit is required'),
  packSize: z.string().optional(),
  minimumStock: z.number().int().min(0),
  prescriptionRequired: z.boolean(),
  description: z.string().optional(),
  active: z.boolean(),
});

describe('Frontend Form Validation & Auth Schemas', () => {
  it('should validate valid login inputs', () => {
    const valid = { usernameOrEmail: 'owner', password: 'Owner@123' };
    const res = loginSchema.safeParse(valid);
    expect(res.success).toBe(true);
  });

  it('should reject empty login inputs', () => {
    const invalid = { usernameOrEmail: '', password: '123' };
    const res = loginSchema.safeParse(invalid);
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('should validate complete medicine form inputs', () => {
    const validMed = {
      name: 'Azithromycin 500mg',
      genericName: 'Azithromycin',
      categoryId: 1,
      manufacturerId: 2,
      hsnCode: '30049099',
      gstPercentage: 12,
      unit: 'Strip of 3',
      packSize: '3 Tabs',
      minimumStock: 10,
      prescriptionRequired: true,
      description: 'Antibiotic',
      active: true,
    };
    const res = medicineFormSchema.safeParse(validMed);
    expect(res.success).toBe(true);
  });

  it('should reject medicine with negative minimum stock or missing category', () => {
    const invalidMed = {
      name: 'A',
      categoryId: 0,
      manufacturerId: -1,
      gstPercentage: 150,
      unit: '',
      minimumStock: -5,
      prescriptionRequired: false,
      active: true,
    };
    const res = medicineFormSchema.safeParse(invalidMed);
    expect(res.success).toBe(false);
  });
});
