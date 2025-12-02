let incomeChart = null;

export function resetChart() {
    if (incomeChart) {
        incomeChart.destroy();
        incomeChart = null;
    }
}

export function updateIncomeChart(labels, data, yAxisLabel) {
    const canvas = document.getElementById('incomeChart');
    if (!canvas || typeof Chart === 'undefined') return;

    const ctx = canvas.getContext('2d');

    if (incomeChart) {
        incomeChart.destroy();
    }

    incomeChart = new Chart(ctx, {
        type: 'line',
        data: {
        labels,
        datasets: [
            {
            label: yAxisLabel,
            data,
            borderWidth: 2,
            pointRadius: 2,
            tension: 0.2
            }
        ]
        },
        options: {
        plugins: {
            legend: {
            display: false
            }
        },
        scales: {
            x: {
            title: {
                display: true,
                text: 'Рік'
            }
            },
            y: {
            title: {
                display: true,
                text: yAxisLabel
            }
            }
        }
        }
    });
}