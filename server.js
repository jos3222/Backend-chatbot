import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import fs from 'fs/promises';
import OpenAI from 'openai';

const app = express();
app.use(express.json({ limit: '1mb' }));

// ✅ CORS: alleen jouw site mag deze API aanroepen
app.use(cors({
  origin: [
    "https://www.e-scooteralblasserwaard.nl",
    "https://e-scooteralblasserwaard.nl"
  ],
}));

// simpele rate limit (optioneel)
app.use('/api/', rateLimit({ windowMs: 60_000, max: 60 }));

// knowledgebase laden
let KB = { practice: {}, faqs: [] };
try {
  KB = JSON.parse(await fs.readFile('knowledgebase.json', 'utf8'));
} catch {
  console.warn('Geen knowledgebase.json gevonden, ga door met leeg KB');
}

// OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MODEL = process.env.MODEL || 'gpt-4o-mini';

app.get('/health', (_, res) => res.json({ ok: true }));

app.post('/api/chat', async (req, res) => {
  try {
    const { message, website } = req.body || {};
    if (!message) return res.status(400).json({ error: 'message ontbreekt' });

    const system = `Je bent een behulpzame assistent voor een praktijk/zaak.
Gebruik deze gegevens als bron van waarheid. Geef geen medische diagnoses.
Als je het niet zeker weet, zeg dat en verwijs door.
--- DATA ---
${JSON.stringify(KB, null, 2)}`;

    const user = `Website: ${website}\nVraag: ${message}`;

    const out = await openai.chat.completions.create({
      model: MODEL,
      temperature: 0.2,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user }
      ],
    });

    res.json({ reply: out.choices?.[0]?.message?.content?.trim() || '—' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Serverfout of AI-provider niet bereikbaar' });
  }
});

const port = process.env.PORT || 8787;
app.listen(port, () => console.log(`API luistert op http://localhost:${port}`));
