const API_SCENARIOS = '/api/scenarios';
const API_RATES = '/api/rates';

export async function fetchScenariosFromServer() {
    const res = await fetch(API_SCENARIOS);
    if (!res.ok) {
        throw new Error('Помилка завантаження сценаріїв');
    }
    return res.json();
}

export async function saveScenarioToServer(scenario) {
    const payload = {
        ...scenario,
        name:
        scenario.name && scenario.name.trim().length > 0
            ? scenario.name
            : 'Сценарій від ' + new Date().toLocaleString('uk-UA')
    };

    const res = await fetch(API_SCENARIOS, {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    if (!res.ok) {
        throw new Error('Помилка збереження сценарію');
    }

    return res.json();
}

export async function deleteScenarioOnServer(id) {
    const res = await fetch(`${API_SCENARIOS}/${id}`, {
        method: 'DELETE'
    });

    if (!res.ok) {
        throw new Error('Помилка видалення сценарію');
    }
}

export async function fetchRatesFromServer() {
    const res = await fetch(API_RATES);
    if (!res.ok) {
        throw new Error('Помилка завантаження курсів валют');
    }
    return res.json();
}