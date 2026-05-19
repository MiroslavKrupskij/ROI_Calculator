import { describe, it, expect, jest } from '@jest/globals';

global.localStorage = {
    getItem: jest.fn(() => null),
    setItem: jest.fn(),
};

global.fetch = jest.fn();

import {
    fetchScenariosFromServer,
    saveScenarioToServer,
    deleteScenarioOnServer
} from '../public/js/scenarioService.js';

describe('ScenarioService API calls', () => {

    beforeEach(() => {
        fetch.mockClear();
        localStorage.getItem.mockClear();
        localStorage.setItem.mockClear();
    });

    it('fetchScenariosFromServer calls fetch with /api/scenarios', async () => {
        fetch.mockResolvedValue({
            ok: true,
            json: async () => []
        });

        await fetchScenariosFromServer();

        expect(fetch.mock.calls[0][0]).toBe('/api/scenarios');
    });

    it('saveScenarioToServer sends POST request', async () => {
        fetch.mockResolvedValue({
            ok: true,
            json: async () => ({ id: 1 })
        });

        const scenario = { price: 1000 };
        await saveScenarioToServer(scenario);

        const [url, options] = fetch.mock.calls[0];

        expect(url).toBe('/api/scenarios');
        expect(options.method).toBe('POST');
    });

    it('deleteScenarioOnServer sends DELETE request', async () => {
        fetch.mockResolvedValue({
            ok: true
        });

        await deleteScenarioOnServer(10);

        const [url, options] = fetch.mock.calls[0];

        expect(url).toBe('/api/scenarios/10');
        expect(options.method).toBe('DELETE');
    });

});