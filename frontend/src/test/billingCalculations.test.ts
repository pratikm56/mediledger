import { describe, it, expect } from 'vitest';

export interface CartItem {
  medicineId: number;
  batchId: number;
  medicineName: string;
  batchNumber: string;
  quantity: number;
  unitPrice: number;
  gstRate: number;
  discountAmount: number;
}

export function calculateLineTotal(item: CartItem): {
  grossAmount: number;
  taxableAmount: number;
  gstAmount: number;
  netAmount: number;
} {
  const gross = item.quantity * item.unitPrice;
  const taxable = Math.max(0, gross - item.discountAmount);
  const gstAmount = Number(((taxable * item.gstRate) / 100).toFixed(2));
  const net = Number((taxable + gstAmount).toFixed(2));
  return {
    grossAmount: Number(gross.toFixed(2)),
    taxableAmount: Number(taxable.toFixed(2)),
    gstAmount,
    netAmount: net,
  };
}

export function calculateBillSummary(items: CartItem[], overallDiscount: number = 0, paidAmount: number = 0): {
  totalGross: number;
  totalDiscount: number;
  totalTaxable: number;
  totalGst: number;
  finalTotal: number;
  roundOff: number;
  changeDue: number;
  balanceDue: number;
} {
  let gross = 0;
  let lineDiscounts = 0;
  let totalTaxable = 0;
  let totalGst = 0;

  for (const item of items) {
    const res = calculateLineTotal(item);
    gross += res.grossAmount;
    lineDiscounts += item.discountAmount;
    totalTaxable += res.taxableAmount;
    totalGst += res.gstAmount;
  }

  const rawNet = totalTaxable + totalGst - overallDiscount;
  const roundedTotal = Math.round(rawNet);
  const roundOff = Number((roundedTotal - rawNet).toFixed(2));
  const changeDue = paidAmount > roundedTotal ? Number((paidAmount - roundedTotal).toFixed(2)) : 0;
  const balanceDue = paidAmount < roundedTotal ? Number((roundedTotal - paidAmount).toFixed(2)) : 0;

  return {
    totalGross: Number(gross.toFixed(2)),
    totalDiscount: Number((lineDiscounts + overallDiscount).toFixed(2)),
    totalTaxable: Number(totalTaxable.toFixed(2)),
    totalGst: Number(totalGst.toFixed(2)),
    finalTotal: roundedTotal,
    roundOff,
    changeDue,
    balanceDue,
  };
}

describe('Pharmacy Billing Calculations Unit Tests', () => {
  it('should correctly calculate individual line item without discount', () => {
    const item: CartItem = {
      medicineId: 1,
      batchId: 101,
      medicineName: 'Paracetamol 500mg',
      batchNumber: 'P1001',
      quantity: 5,
      unitPrice: 20.00,
      gstRate: 12,
      discountAmount: 0,
    };

    const result = calculateLineTotal(item);
    expect(result.grossAmount).toBe(100.00);
    expect(result.taxableAmount).toBe(100.00);
    expect(result.gstAmount).toBe(12.00);
    expect(result.netAmount).toBe(112.00);
  });

  it('should correctly calculate individual line item with item discount', () => {
    const item: CartItem = {
      medicineId: 2,
      batchId: 102,
      medicineName: 'Amoxicillin 500mg',
      batchNumber: 'AMX-01',
      quantity: 2,
      unitPrice: 50.00,
      gstRate: 18,
      discountAmount: 10.00,
    };

    const result = calculateLineTotal(item);
    expect(result.grossAmount).toBe(100.00);
    expect(result.taxableAmount).toBe(90.00);
    expect(result.gstAmount).toBe(16.20);
    expect(result.netAmount).toBe(106.20);
  });

  it('should accurately aggregate multiple cart items with cash tendered and change calculation', () => {
    const items: CartItem[] = [
      {
        medicineId: 1,
        batchId: 101,
        medicineName: 'Paracetamol 500mg',
        batchNumber: 'P1001',
        quantity: 2,
        unitPrice: 25.00,
        gstRate: 12,
        discountAmount: 0,
      },
      {
        medicineId: 2,
        batchId: 102,
        medicineName: 'Cough Syrup 100ml',
        batchNumber: 'CS-88',
        quantity: 1,
        unitPrice: 90.00,
        gstRate: 12,
        discountAmount: 5.00,
      },
    ];

    // Item 1: gross = 50, tax = 6.00, net = 56.00
    // Item 2: gross = 90, discount = 5, tax = 85 * 0.12 = 10.20, net = 95.20
    // Total raw net = 56.00 + 95.20 = 151.20 -> rounded: 151, roundoff: -0.20
    const bill = calculateBillSummary(items, 0, 200.00);
    expect(bill.totalGross).toBe(140.00);
    expect(bill.totalDiscount).toBe(5.00);
    expect(bill.totalTaxable).toBe(135.00);
    expect(bill.totalGst).toBe(16.20);
    expect(bill.finalTotal).toBe(151);
    expect(bill.roundOff).toBe(-0.20);
    expect(bill.changeDue).toBe(49.00);
    expect(bill.balanceDue).toBe(0);
  });

  it('should calculate balance due for partial payment / credit bill', () => {
    const items: CartItem[] = [
      {
        medicineId: 1,
        batchId: 101,
        medicineName: 'Paracetamol',
        batchNumber: 'P1',
        quantity: 4,
        unitPrice: 25.00,
        gstRate: 0,
        discountAmount: 0,
      },
    ];

    // gross = 100, finalTotal = 100, paid = 30 -> balanceDue = 70
    const bill = calculateBillSummary(items, 0, 30.00);
    expect(bill.finalTotal).toBe(100);
    expect(bill.changeDue).toBe(0);
    expect(bill.balanceDue).toBe(70.00);
  });
});
