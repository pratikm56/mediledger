import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// Lightweight test component for status badge
interface BadgeProps {
  status: 'PAID' | 'PARTIAL' | 'UNPAID';
}

const PaymentStatusBadge: React.FC<BadgeProps> = ({ status }) => {
  const colorMap = {
    PAID: 'bg-emerald-100 text-emerald-800',
    PARTIAL: 'bg-amber-100 text-amber-800',
    UNPAID: 'bg-rose-100 text-rose-800',
  };

  return (
    <span
      data-testid="status-badge"
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${colorMap[status]}`}
    >
      {status}
    </span>
  );
};

// Summary stat card
interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle }) => {
  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm" data-testid="stat-card">
      <p className="text-xs font-medium text-slate-500 uppercase">{title}</p>
      <h3 className="text-2xl font-bold text-slate-900 mt-1">{value}</h3>
      {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
    </div>
  );
};

describe('Frontend UI Components Unit Tests', () => {
  it('renders PaymentStatusBadge with correct label and color styling for PAID', () => {
    render(<PaymentStatusBadge status="PAID" />);
    const badge = screen.getByTestId('status-badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('PAID');
    expect(badge.className).toContain('text-emerald-800');
  });

  it('renders PaymentStatusBadge for UNPAID with rose accent', () => {
    render(<PaymentStatusBadge status="UNPAID" />);
    const badge = screen.getByTestId('status-badge');
    expect(badge).toHaveTextContent('UNPAID');
    expect(badge.className).toContain('text-rose-800');
  });

  it('renders StatCard with title, value, and subtitle', () => {
    render(
      <StatCard
        title="Today Sales"
        value="₹14,500.00"
        subtitle="18 Transactions"
      />
    );
    expect(screen.getByText('Today Sales')).toBeInTheDocument();
    expect(screen.getByText('₹14,500.00')).toBeInTheDocument();
    expect(screen.getByText('18 Transactions')).toBeInTheDocument();
  });
});
