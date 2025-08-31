import 'dotenv/config';
import express from 'express';
import cors from 'cors';

const app = express();

// basis
app.use(express.json({ limit: '1mb' }));

// laat alleen jouw site toe
app.use(cors({
  origin: [
    'https://www.e-scooterablasserwaard.nl',
    'https://e-scooterablasserwaard.nl'
  ]
}));

// healthcheck
app.get('/health', (_req, res) => res.send('ok'));

// >>> ECHO-ROUTE (altijd antwoord) <<<
app.post('/api/chat', (req, res) => {
  const userMsg = (req.body?.message ?? '').toString();
  res.json({ reply: `Je zei: ${userMsg}` });
});

// start server (Render geeft de poort)
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`API luistert op :${PORT}`));
