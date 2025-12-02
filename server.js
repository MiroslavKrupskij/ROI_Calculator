import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const PORT = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE = path.join(__dirname, 'data', 'scenarios.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// === Курси валют з НБУ ===
app.get('/api/rates', async (req, res) => {
  try {
    const response = await fetch(
      'https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?json'
    );

    if (!response.ok) {
      throw new Error('Bad response from NBU');
    }

    const data = await response.json();

    const usdObj = data.find((x) => x.cc === 'USD');
    const eurObj = data.find((x) => x.cc === 'EUR');

    if (!usdObj || !eurObj) {
      throw new Error('No USD/EUR in NBU response');
    }

    const usdRateUAH = usdObj.rate; // скільки UAH за 1 USD
    const eurRateUAH = eurObj.rate; // скільки UAH за 1 EUR

    res.json({
      base: 'UAH',
      rates: {
        UAH: 1,
        USD: 1 / usdRateUAH, // з UAH у USD
        EUR: 1 / eurRateUAH  // з UAH у EUR
      }
    });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: 'Не вдалося отримати курси валют з API НБУ' });
  }
});

// === Робота з файлами сценаріїв ===
async function readScenarios() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Помилка читання scenarios.json:', err);
    return [];
  }
}

async function writeScenarios(scenarios) {
  try {
    await fs.writeFile(DATA_FILE, JSON.stringify(scenarios, null, 2), 'utf-8');
  } catch (err) {
    console.error('Помилка запису scenarios.json:', err);
  }
}

app.get('/api/scenarios', async (req, res) => {
  const clientId = req.query.clientId;
  const scenarios = await readScenarios();

  if (!clientId) {
    return res.json([]);
  }

  const filtered = scenarios.filter((s) => s.clientId === clientId);
  res.json(filtered);
});

app.post('/api/scenarios', async (req, res) => {
  const clientId = req.query.clientId;

  if (!clientId) {
    return res.status(400).json({ message: 'clientId обовʼязковий' });
  }

  const scenarios = await readScenarios();

  const newScenario = {
    id: Date.now().toString(),
    clientId, // привʼязка до браузера
    createdAt: new Date().toISOString(),
    ...req.body
  };

  scenarios.push(newScenario);
  await writeScenarios(scenarios);

  res.status(201).json(newScenario);
});

app.delete('/api/scenarios/:id', async (req, res) => {
  const { id } = req.params;
  const clientId = req.query.clientId;

  if (!clientId) {
    return res.status(400).json({ message: 'clientId обовʼязковий' });
  }

  const scenarios = await readScenarios();

  const existsForClient = scenarios.some(
    (s) => s.id === id && s.clientId === clientId
  );

  if (!existsForClient) {
    return res.status(404).json({ message: 'Сценарій не знайдено' });
  }

  const filtered = scenarios.filter(
    (s) => !(s.id === id && s.clientId === clientId)
  );

  await writeScenarios(filtered);
  res.json({ message: 'Сценарій видалено' });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
