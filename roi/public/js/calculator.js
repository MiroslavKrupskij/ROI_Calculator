export function calculateLoanMonthlyPayment(loanAmount, annualRate, years) {
    const P = Number(loanAmount) || 0;
    const n = (Number(years) || 0) * 12; // кількість платежів

    if (P <= 0 || n <= 0) return 0;

    const r = Number(annualRate) / 100 / 12 || 0;

    if (r === 0) {
        return P / n;
    }

    const payment = (P * r) / (1 - Math.pow(1 + r, -n));
    return payment;
}

export function calculateNetMonthly(rentPerMonth, monthlyExpenses, loanMonthly) {
    const rent = Number(rentPerMonth) || 0;
    const expenses = Number(monthlyExpenses) || 0;
    const loan = Number(loanMonthly) || 0;

    return rent - expenses - loan;
}

export function calculateNetYearly(netMonthly) {
    return (Number(netMonthly) || 0) * 12;
}

export function calculateInitialInvestment(ownMoney, extraCosts) {
    const own = Number(ownMoney) || 0;
    const extra = Number(extraCosts) || 0;
    return own + extra;
}

export function calculateRoiPercent(netYearly, initialInvestment) {
    const ny = Number(netYearly) || 0;
    const inv = Number(initialInvestment) || 0;

    if (ny <= 0 || inv <= 0) return 0;
    return (ny / inv) * 100;
}

export function calculatePaybackYears(initialInvestment, netYearly) {
    const ny = Number(netYearly) || 0;
    const inv = Number(initialInvestment) || 0;

    if (ny <= 0 || inv <= 0) {
        // інвестиція не окупається
        return null;
    }

    return inv / ny;
}

export function buildYearlyTable(netYearly, years) {
    const ny = Number(netYearly) || 0;
    const totalYears = Number(years) || 0;

    const yearlyTable = [];
    let cumulative = 0;

    for (let year = 1; year <= totalYears; year++) {
        cumulative += ny;
        yearlyTable.push({
            year,
            netYearly: ny,
            cumulative
        });
    }

    return yearlyTable;
}

export function calculateTotalProfit(netYearly, years) {
    const ny = Number(netYearly) || 0;
    const totalYears = Number(years) || 0;
    return ny * totalYears;
}

export function calculateScenario(scenario) {
    let loanMonthly = 0;

    if (scenario.hasLoan) {
        const useManual = !!scenario.useManualLoanPayment;
        const manualPayment = Number(scenario.loanMonthlyPayment) || 0;

        if (useManual && manualPayment > 0) {
            loanMonthly = manualPayment;
        } else {
            loanMonthly = calculateLoanMonthlyPayment(
                scenario.loanAmount,
                scenario.loanAnnualRate,
                scenario.loanYears
            );
        }
    }

    const netMonthly = calculateNetMonthly(
        scenario.rentPerMonth,
        scenario.monthlyExpenses,
        loanMonthly
    );

    const netYearly = calculateNetYearly(netMonthly);

    const initialInvestment = calculateInitialInvestment(
        scenario.ownMoney,
        scenario.extraCosts
    );

    const roiPercent = calculateRoiPercent(netYearly, initialInvestment);

    const paybackYears = calculatePaybackYears(initialInvestment, netYearly);

    const years = Number(scenario.years) || 0;

    const yearlyTable = buildYearlyTable(netYearly, years);
    const totalProfit = calculateTotalProfit(netYearly, years);

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