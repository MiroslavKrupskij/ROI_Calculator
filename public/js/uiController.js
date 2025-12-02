import { calculateScenario } from './calculator.js';
import { updateIncomeChart, resetChart } from './chartService.js';
import {
  fetchScenariosFromServer,
  saveScenarioToServer,
  deleteScenarioOnServer,
  fetchRatesFromServer
} from './scenarioService.js';

let currentCurrency = 'UAH';
let exchangeRates = { UAH: 1, USD: 1, EUR: 1 };
const currencySymbols = { UAH: 'грн', USD: '$', EUR: '€' };

let lastScenario = null;
let lastCalc = null;
let lastYearlyTable = null;

// Допоміжні функції
function convertFromUAH(amountUAH) {
    const rate = exchangeRates[currentCurrency] || 1;
    return amountUAH * rate;
}

function formatMoney(amountUAH) {
    const converted = convertFromUAH(amountUAH);
    return (
        converted.toLocaleString('uk-UA', { maximumFractionDigits: 0 }) +
        ' ' +
        currencySymbols[currentCurrency]
    );
}

function formatPercent(value) {
    return value.toFixed(1).replace('.', ',') + ' %';
}

function formatYears(value) {
    return value.toFixed(1).replace('.', ',') + ' років';
}

function getNumberValue(id) {
    const el = document.getElementById(id);
    const raw = el.value.trim().replace(',', '.');
    const value = parseFloat(raw);
    return isNaN(value) ? 0 : value;
}

function getIntValue(id) {
    const el = document.getElementById(id);
    const value = parseInt(el.value, 10);
    return isNaN(value) ? 0 : value;
}

function setLoanInputsEnabled(enabled) {
    const ids = [
        'loanAmount',
        'loanAnnualRate',
        'loanYears',
        'useManualLoanPayment',
        'loanMonthlyPayment'
    ];
    ids.forEach((id) => {
        const el = document.getElementById(id);
        if (el) {
        el.disabled = !enabled;
        }
    });
}

function setManualPaymentEnabled(enabled) {
    const input = document.getElementById('loanMonthlyPayment');
    if (input) {
        input.disabled = !enabled;
    }
}

function buildScenarioFromForm() {
    const hasLoan = document.getElementById('hasLoan').checked;
    const useManualLoanPayment = hasLoan && document.getElementById('useManualLoanPayment').checked;

    return {
        name: document.getElementById('scenarioName').value.trim(),
        purchasePrice: getNumberValue('purchasePrice'),
        ownMoney: getNumberValue('ownMoney'),
        extraCosts: getNumberValue('extraCosts'),
        hasLoan,
        loanAmount: hasLoan ? getNumberValue('loanAmount') : 0,
        loanAnnualRate: hasLoan ? getNumberValue('loanAnnualRate') : 0,
        loanYears: hasLoan ? getIntValue('loanYears') : 0,
        useManualLoanPayment,
        loanMonthlyPayment: hasLoan && useManualLoanPayment ? getNumberValue('loanMonthlyPayment') : 0,
        rentPerMonth: getNumberValue('rentPerMonth'),
        monthlyExpenses: getNumberValue('monthlyExpenses'),
        years: getIntValue('years') || 1
    };
}

function fillFormFromScenario(scenario) {
    const hasLoanEl = document.getElementById('hasLoan');
    const manualPaymentEl = document.getElementById('useManualLoanPayment');

    document.getElementById('scenarioName').value = scenario.name || '';

    document.getElementById('purchasePrice').value = scenario.purchasePrice ?? '';
    document.getElementById('ownMoney').value = scenario.ownMoney ?? '';
    document.getElementById('extraCosts').value = scenario.extraCosts ?? '0';

    hasLoanEl.checked = !!scenario.hasLoan;
    setLoanInputsEnabled(!!scenario.hasLoan);

    if (scenario.hasLoan) {
        document.getElementById('loanAmount').value = scenario.loanAmount ?? '';
        document.getElementById('loanAnnualRate').value = scenario.loanAnnualRate ?? '';
        document.getElementById('loanYears').value = scenario.loanYears ?? '';

        manualPaymentEl.checked = !!scenario.useManualLoanPayment;
        setManualPaymentEnabled(!!scenario.useManualLoanPayment);

        document.getElementById('loanMonthlyPayment').value = scenario.loanMonthlyPayment ?? '';
    } else {
        manualPaymentEl.checked = false;
        setManualPaymentEnabled(false);
    }

    document.getElementById('rentPerMonth').value = scenario.rentPerMonth ?? '';
    document.getElementById('monthlyExpenses').value = scenario.monthlyExpenses ?? '0';
    document.getElementById('years').value = scenario.years ?? 10;
}

// Рендер результатів
function renderResults(calc, scenario) {
    const summaryContainer = document.getElementById('summary-cards');
    const textSummary = document.getElementById('text-summary');
    const yearlyTableBody = document.querySelector('#yearly-table tbody');
    const saveBtn = document.getElementById('saveScenarioBtn');

    summaryContainer.innerHTML = '';
    yearlyTableBody.innerHTML = '';

    lastScenario = scenario;
    lastCalc = calc;
    lastYearlyTable = calc.yearlyTable;

    const cards = [
        {
        label: 'Початкові вкладення',
        value: formatMoney(calc.initialInvestment)
        },
        {
        label: 'Чистий дохід / місяць',
        value: formatMoney(calc.netMonthly)
        },
        {
        label: 'Чистий дохід / рік',
        value: formatMoney(calc.netYearly)
        },
        {
        label: 'ROI (Cash-on-Cash)',
        value: formatPercent(calc.roiPercent)
        }
    ];

    if (calc.paybackYears !== null) {
        cards.push({
        label: 'Строк окупності',
        value: formatYears(calc.paybackYears)
        });
    }

    if (scenario.hasLoan) {
        cards.push({
        label: 'Платіж за кредитом / місяць',
        value: formatMoney(calc.loanMonthly)
        });
    }

    cards.forEach((card) => {
        const div = document.createElement('div');
        div.className = 'summary-card';
        div.innerHTML = `
        <div class="label">${card.label}</div>
        <div class="value">${card.value}</div>
        `;
        summaryContainer.appendChild(div);
    });

    if (calc.paybackYears === null || calc.netYearly <= 0) {
        textSummary.innerHTML = `
        <p>
            При поточних параметрах інвестиція не окупається:
            чистий річний дохід менший або рівний нулю.
        </p>
        `;
    } else {
        textSummary.innerHTML = `
        <p>
            За заданих параметрів інвестиція окупиться приблизно за
            <strong>${formatYears(calc.paybackYears)}</strong>.
        </p>
        <p>
            Середній чистий річний дохід становить
            <strong>${formatMoney(calc.netYearly)}</strong>, що дає
            <strong>${formatPercent(calc.roiPercent)}</strong> річної
            дохідності від вкладених власних коштів.
        </p>
        <p>
            За весь період у <strong>${scenario.years} років</strong>
            очікуваний сумарний прибуток становить
            <strong>${formatMoney(calc.totalProfit)}</strong>.
        </p>
        `;
    }

    calc.yearlyTable.forEach((row) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
        <td>${row.year}</td>
        <td>${formatMoney(row.netYearly)}</td>
        <td>${formatMoney(row.cumulative)}</td>
        `;
        yearlyTableBody.appendChild(tr);
    });

    const labels = calc.yearlyTable.map((r) => r.year.toString());
    const data = calc.yearlyTable.map((r) => convertFromUAH(r.cumulative));
    updateIncomeChart(labels, data, `Накопичений дохід, ${currentCurrency}`);

    saveBtn.disabled = false;
}

// Експорт в CSV
function exportYearlyTableToCsv() {
    if (!lastYearlyTable || lastYearlyTable.length === 0) {
        alert('Немає даних для експорту');
        return;
    }

    const header = 'Рік;Чистий дохід за рік;Накопичений дохід;Валюта';
    const rows = lastYearlyTable.map((row) => {
        const net = Math.round(convertFromUAH(row.netYearly));
        const cum = Math.round(convertFromUAH(row.cumulative));
        return `${row.year};${net};${cum};${currentCurrency}`;
    });

    const csvText = [header, ...rows].join('\n');
    const blob = new Blob([csvText], {
        type: 'text/csv;charset=utf-8;'
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'roi_yearly.csv';
    a.click();
    URL.revokeObjectURL(url);
}

// Список сценаріїв
function renderScenarioList(scenarios) {
    const listEl = document.getElementById('scenarios-list');
    listEl.innerHTML = '';

    if (!scenarios || scenarios.length === 0) {
        listEl.innerHTML =
        '<p>Поки що немає збережених сценаріїв. Зробіть розрахунок і натисніть "Зберегти сценарій".</p>';
        return;
    }

    scenarios.forEach((scenario) => {
        const calc = calculateScenario({
        ...scenario,
        years: scenario.years || 1
        });

        const card = document.createElement('div');
        card.className = 'scenario-card';
        card.dataset.id = scenario.id;

        const name =
        scenario.name && scenario.name.trim().length > 0
            ? scenario.name
            : 'Сценарій ' + new Date(scenario.createdAt).toLocaleString('uk-UA');

        const paybackText =
        calc.paybackYears !== null
            ? formatYears(calc.paybackYears)
            : 'не окупається';

        card.innerHTML = `
        <div class="scenario-info">
            <div class="scenario-name"><strong>${name}</strong></div>
            <div class="scenario-meta">
            ROI: ${formatPercent(calc.roiPercent)},
            окупність: ${paybackText}
            </div>
        </div>
        <div class="scenario-actions">
            <button type="button" class="apply-btn">Відкрити</button>
            <button type="button" class="delete-btn">Видалити</button>
        </div>
        `;

        const applyBtn = card.querySelector('.apply-btn');
        const deleteBtn = card.querySelector('.delete-btn');

        applyBtn.addEventListener('click', () => {
        fillFormFromScenario(scenario);
        const calcAgain = calculateScenario(scenario);
        renderResults(calcAgain, scenario);
        });

        deleteBtn.addEventListener('click', async () => {
        if (!confirm('Видалити цей сценарій?')) return;
        try {
            await deleteScenarioOnServer(scenario.id);
            await fetchAndRenderScenarios();
        } catch (err) {
            console.error(err);
            alert('Не вдалося видалити сценарій');
        }
        });

        listEl.appendChild(card);
    });
}

// Робота з API 
async function fetchAndRenderScenarios() {
    const listEl = document.getElementById('scenarios-list');
    try {
        const scenarios = await fetchScenariosFromServer();
        renderScenarioList(scenarios);
    } catch (err) {
        console.error(err);
        listEl.innerHTML = '<p>Не вдалося завантажити сценарії.</p>';
    }
}

async function loadRates() {
    try {
        const data = await fetchRatesFromServer();
        if (data && data.rates) {
        exchangeRates = { ...exchangeRates, ...data.rates };
        console.log('Курси валют:', exchangeRates);
        }
    } catch (err) {
        console.error('Не вдалося завантажити курси валют', err);
    }
}

// Ініціалізація UI
function initFormLogic() {
    const hasLoanEl = document.getElementById('hasLoan');
    const manualPaymentEl = document.getElementById('useManualLoanPayment');
    const form = document.getElementById('investment-form');
    const resetBtn = document.getElementById('resetBtn');
    const saveBtn = document.getElementById('saveScenarioBtn');
    const exportBtn = document.getElementById('exportCsvBtn');

    hasLoanEl.addEventListener('change', () => {
        const enabled = hasLoanEl.checked;
        setLoanInputsEnabled(enabled);
        if (!enabled) {
        manualPaymentEl.checked = false;
        setManualPaymentEnabled(false);
        }
    });

    manualPaymentEl.addEventListener('change', () => {
        const enabled = manualPaymentEl.checked;
        setManualPaymentEnabled(enabled);
    });

    form.addEventListener('submit', (event) => {
        event.preventDefault();

        const scenario = buildScenarioFromForm();
        const calc = calculateScenario(scenario);
        renderResults(calc, scenario);
    });

    resetBtn.addEventListener('click', () => {
        form.reset();
        setLoanInputsEnabled(false);
        setManualPaymentEnabled(false);

        document.getElementById('summary-cards').innerHTML = '';
        document.querySelector('#yearly-table tbody').innerHTML = '';
        document.getElementById('text-summary').innerHTML = `
        <p>
            Поки що немає результатів. Заповніть форму й натисніть
            <strong>"Розрахувати"</strong>.
        </p>
        `;
        saveBtn.disabled = true;
        lastScenario = null;
        lastCalc = null;
        lastYearlyTable = null;
        resetChart();
    });

    saveBtn.addEventListener('click', async () => {
        try {
        const scenario = buildScenarioFromForm();
        await saveScenarioToServer(scenario);
        saveBtn.disabled = true;
        await fetchAndRenderScenarios();
        alert('Сценарій збережено');
        } catch (err) {
        console.error(err);
        alert('Не вдалося зберегти сценарій');
        }
    });

    exportBtn.addEventListener('click', () => {
        exportYearlyTableToCsv();
    });
}

function initCurrencySwitcher() {
    const buttons = document.querySelectorAll('.currency-btn');

    buttons.forEach((btn) => {
        btn.addEventListener('click', () => {
        const newCurrency = btn.dataset.currency;
        if (!newCurrency || newCurrency === currentCurrency) return;

        currentCurrency = newCurrency;

        buttons.forEach((b) =>
            b.classList.toggle('currency-btn--active', b === btn)
        );

        if (lastScenario && lastCalc) {
            // просто перемальовуємо з новою валютою
            renderResults(lastCalc, lastScenario);
        }
        });
    });
}

export async function initApp() {
    setLoanInputsEnabled(false);
    setManualPaymentEnabled(false);
    initFormLogic();
    initCurrencySwitcher();
    await loadRates();
    await fetchAndRenderScenarios();
}