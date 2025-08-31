// ===== server.js (simpel & werkend) =====
import 'dotenv/config';
import express from 'express';
import cors from 'cors';

const app = express();
app.use(express.json({ limit: '1mb' }));

// HOTFIX CORS: tijdelijk alles toestaan zodat je kunt testen
app.use(cors());
app.options('*', cors());

// Healthcheck
app.get('/health', (_req, res) => res.send('ok'));

// Echo-chat: geeft ALTIJD antwoord terug als { reply: "..." }
app.post('/api/chat', (req, res) => {
  const userMsg = (req.body?.message ?? '').toString();
  res.json({ reply: `Je zei: ${userMsg}` });
});

// Render-poort
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`API luistert op :${PORT}`));
