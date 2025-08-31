// server.js — AI-VERSIE (met CORS + fallback)
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';

const app = express();
app.use(express.json({ limit: '1mb' }));

// Alleen jouw site(s) mogen de API gebruiken
const allowedOrigins = [
  'https://www.e-scooterablasserwaard.nl',
  'https://e-scooterablasserwaard.nl'
];
app.use(cors({
  origin(origin, cb) {
    if (!origin) return cb(null, true);
    cb(null, allowedOrigins.includes(origin));
  },
  methods: ['GET','POST','OPTIONS'],
  allowedHeaders: ['Content-Type'],
}));
app.options('*', cors());

// Health
app.get('/health', (_req, res) => res.send('ok'));

// Chat: gebruikt AI als key aanwezig is, anders echo
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post('/api/chat', async (req, res) => {
  const userMsg = (req.body?.message ?? '').toString().slice(0, 1000);

  // Geen key gevonden? Netjes terugvallen op echo
  if (!process.env.OPENAI_API_KEY) {
    return res.json({ reply: `Je zei: ${userMsg}` });
  }

  try {
    const out = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Je bent een vriendelijke assistent voor bezoekers van e-scooterablasserwaard.nl.' },
        { role: 'user', content: userMsg }
      ],
    });
    const text = out.choices?.[0]?.message?.content?.trim() || '';
    res.json({ reply: text || 'Ik had even geen tekst terug, probeer het nog eens.' });
  } catch (e) {
    console.error('Chat error:', e);
    res.json({ reply: 'Er ging iets mis aan de serverkant.' }); // nooit 500 naar de browser
  }
});

// Start
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`API luistert op :${PORT}`));
