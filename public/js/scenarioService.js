const API_SCENARIOS = '/api/scenarios';
const API_RATES = '/api/rates';

let clientId = localStorage.getItem('roi_client_id');

if (!clientId) {
    if (crypto.randomUUID) {
        clientId = crypto.randomUUID();
    } else {
        clientId = 'client-' + Date.now() + '-' + Math.random().toString(16).slice(2);
    }
    localStorage.setItem('roi_client_id', clientId);
}

function withClientId(url) {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}clientId=${encodeURIComponent(clientId)}`;
}

export async function fetchScenariosFromServer() {
    const res = await fetch(withClientId(API_SCENARIOS));
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

    const res = await fetch(withClientId(API_SCENARIOS), {
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
    const res = await fetch(withClientId(`${API_SCENARIOS}/${id}`), {
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
