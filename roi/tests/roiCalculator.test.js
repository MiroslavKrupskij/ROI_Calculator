import { describe, it, expect } from '@jest/globals';
import {
  calculateLoanMonthlyPayment,
  calculateScenario
} from '../public/js/calculator.js';

describe('calculateLoanMonthlyPayment', () => {
  it('Рахує щомісячний платіж при ненульовій ставці', () => {
    const payment = calculateLoanMonthlyPayment(100_000, 12, 10);
    // очікуваний платіж ≈ 1434.71
    expect(payment).toBeCloseTo(1434.71, 2);
  });

  it('Коректно працює при нульовій ставці (просте ділення)', () => {
    const payment = calculateLoanMonthlyPayment(60_000, 0, 5);
    // 60 000 / (5 років * 12 міс) = 1000
    expect(payment).toBe(1000);
  });

  it('Повертає 0, якщо сума або термін некоректні', () => {
    expect(calculateLoanMonthlyPayment(0, 12, 10)).toBe(0);
    expect(calculateLoanMonthlyPayment(100_000, 12, 0)).toBe(0);
  });
});

describe('calculateScenario', () => {
  it('Рахує ROI для сценарію без кредиту', () => {
    const scenario = {
      hasLoan: false,
      useManualLoanPayment: false,
      loanMonthlyPayment: 0,
      loanAmount: 0,
      loanAnnualRate: 0,
      loanYears: 0,

      rentPerMonth: 20_000,
      monthlyExpenses: 5_000,
      ownMoney: 300_000,
      extraCosts: 50_000,
      years: 5
    };

    const result = calculateScenario(scenario);

    // netMonthly = 20000 - 5000 = 15000
    // netYearly = 15000 * 12 = 180000
    // initialInvestment = 300000 + 50000 = 350000
    // roiPercent ≈ 51.43
    // paybackYears ≈ 1.94
    expect(result.loanMonthly).toBe(0);
    expect(result.netMonthly).toBe(15_000);
    expect(result.netYearly).toBe(180_000);
    expect(result.initialInvestment).toBe(350_000);

    expect(result.roiPercent).toBeCloseTo(51.43, 2);
    expect(result.paybackYears).toBeCloseTo(1.94, 2);

    expect(result.yearlyTable).toHaveLength(5);
    expect(result.yearlyTable[0]).toEqual({
      year: 1,
      netYearly: 180_000,
      cumulative: 180_000
    });
    expect(result.yearlyTable[4].cumulative).toBe(180_000 * 5);

    expect(result.totalProfit).toBe(180_000 * 5);
  });

  it('Використовує ручний платіж по кредиту, якщо він заданий', () => {
    const scenario = {
      hasLoan: true,
      useManualLoanPayment: true,
      loanMonthlyPayment: 3_000,

      loanAmount: 100_000,
      loanAnnualRate: 12,
      loanYears: 10,

      rentPerMonth: 15_000,
      monthlyExpenses: 4_000,
      ownMoney: 200_000,
      extraCosts: 20_000,
      years: 3
    };

    const result = calculateScenario(scenario);

    expect(result.loanMonthly).toBe(3_000);
    expect(result.netMonthly).toBe(15_000 - 4_000 - 3_000);
  });

  it('Повертає roiPercent = 0 і paybackYears = null, якщо чистий дохід не позитивний', () => {
    const scenario = {
      hasLoan: false,
      useManualLoanPayment: false,
      loanMonthlyPayment: 0,
      loanAmount: 0,
      loanAnnualRate: 0,
      loanYears: 0,

      rentPerMonth: 5_000,
      monthlyExpenses: 7_000,
      ownMoney: 100_000,
      extraCosts: 0,
      years: 2
    };

    const result = calculateScenario(scenario);

    expect(result.netYearly).toBeLessThanOrEqual(0);
    expect(result.roiPercent).toBe(0);
    expect(result.paybackYears).toBeNull();
  });
});