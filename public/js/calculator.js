export function calculateLoanMonthlyPayment(loanAmount, annualRate, years) {
    const P = loanAmount;
    const r = annualRate / 100 / 12; // місячна ставка
    const n = years * 12; // к-сть платежів

    if (!P || !n) return 0;

    if (r === 0) {
        return P / n;
    }

    const payment = (P * r) / (1 - Math.pow(1 + r, -n));
    return payment;
}

export function calculateScenario(scenario) {
    let loanMonthly = 0;

    if (scenario.hasLoan) {
        if (scenario.useManualLoanPayment && scenario.loanMonthlyPayment > 0) {
        loanMonthly = scenario.loanMonthlyPayment;
        } else {
        loanMonthly = calculateLoanMonthlyPayment(
            scenario.loanAmount,
            scenario.loanAnnualRate,
            scenario.loanYears
        );
        }
    }

    const netMonthly = scenario.rentPerMonth - scenario.monthlyExpenses - loanMonthly;

    const netYearly = netMonthly * 12;
    const initialInvestment = scenario.ownMoney + scenario.extraCosts;

    let roiPercent = 0;
    if (netYearly > 0 && initialInvestment > 0) {
        roiPercent = (netYearly / initialInvestment) * 100;
    }

    let paybackYears = null;
    if (netYearly > 0) {
        paybackYears = initialInvestment / netYearly;
    }

    let cumulative = 0;
    const yearlyTable = [];
    for (let year = 1; year <= scenario.years; year++) {
        cumulative += netYearly;
        yearlyTable.push({
        year,
        netYearly,
        cumulative
        });
    }

    const totalProfit = netYearly * scenario.years;

    return {
        loanMonthly,
        netMonthly,
        netYearly,
        initialInvestment,
        roiPercent,
        paybackYears,
        totalProfit,
        yearlyTable
    };
}