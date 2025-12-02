import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  fetchScenariosFromServer,
  saveScenarioToServer,
  deleteScenarioOnServer,
  fetchRatesFromServer
} from '../public/js/scenarioService.js';

global.fetch = jest.fn();

beforeEach(() => {
  fetch.mockReset();
});

describe('fetchScenariosFromServer', () => {
  it('Повертає сценарії, якщо відповідь ок', async () => {
    const fakeScenarios = [{ id: '1', name: 'Test scenario' }];

    fetch.mockResolvedValue({
      ok: true,
      json: async () => fakeScenarios
    });

    const result = await fetchScenariosFromServer();

    expect(fetch).toHaveBeenCalledWith('/api/scenarios');
    expect(result).toEqual(fakeScenarios);
  });

  it('Видає помилку, якщо відповідь не ок', async () => {
    fetch.mockResolvedValue({ ok: false });

    await expect(fetchScenariosFromServer()).rejects.toThrow(
      'Помилка завантаження сценаріїв'
    );
  });
});

describe('saveScenarioToServer', () => {
  it('Надсилає POST з правильним тілом і повертає збережений сценарій', async () => {
    const inputScenario = {
      name: '',
      someField: 123
    };

    const serverResponse = { id: '42', name: 'Сценарій від ...', someField: 123 };

    fetch.mockImplementation((url, options) => {
      // емулюємо відповідь сервера
      return Promise.resolve({
        ok: true,
        json: async () => serverResponse
      });
    });

    const result = await saveScenarioToServer(inputScenario);

    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, options] = fetch.mock.calls[0];

    expect(url).toBe('/api/scenarios');
    expect(options.method).toBe('POST');
    expect(options.headers['Content-Type']).toBe('application/json');

    const sentPayload = JSON.parse(options.body);

    expect(sentPayload.name).toBeTruthy();
    expect(sentPayload.someField).toBe(123);

    expect(result).toEqual(serverResponse);
  });

  it('Видає помилку, якщо сервер повертає не ок', async () => {
    fetch.mockResolvedValue({ ok: false });

    await expect(
      saveScenarioToServer({ name: 'Bad' })
    ).rejects.toThrow('Помилка збереження сценарію');
  });
});

describe('deleteScenarioOnServer', () => {
  it('Надсилає DELETE на правильний URL', async () => {
    fetch.mockResolvedValue({ ok: true });

    await deleteScenarioOnServer('10');

    expect(fetch).toHaveBeenCalledWith('/api/scenarios/10', {
      method: 'DELETE'
    });
  });

  it('Кидає помилку, якщо видалення не вдалося', async () => {
    fetch.mockResolvedValue({ ok: false });

    await expect(deleteScenarioOnServer('10')).rejects.toThrow(
      'Помилка видалення сценарію'
    );
  });
});

describe('fetchRatesFromServer', () => {
  it('Повертає курси валют, якщо все добре', async () => {
    const fakeRates = { base: 'UAH', rates: { UAH: 1, USD: 0.025 } };

    fetch.mockResolvedValue({
      ok: true,
      json: async () => fakeRates
    });

    const result = await fetchRatesFromServer();

    expect(fetch).toHaveBeenCalledWith('/api/rates');
    expect(result).toEqual(fakeRates);
  });

  it('Видає помилку, якщо не вдалося отримати курси', async () => {
    fetch.mockResolvedValue({ ok: false });

    await expect(fetchRatesFromServer()).rejects.toThrow(
      'Помилка завантаження курсів валют'
    );
  });
});
