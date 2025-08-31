// ===== server.js — AI-versie (veilig & simpel) =====
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';

const app = express();
app.use(express.json({ limit: '1mb' }));

// Alleen jouw site mag de API gebruiken
const allowedOrigins = [
  'https://www.e-scooterablasserwaard.nl',
  'https://e-scooterablasserwaard.nl'
];
app.use(cors({
  origin(origin, cb) {
    if (!origin) return cb(null, true); // bv. healthchecks
    cb(null, allowedOrigins.includes(origin));
  },
  methods: ['GET','POST','OPTIONS'],
  allowedHeaders: ['Content-Type'],
}));
app.options('*', cors());

// Healthcheck
app.get('/health', (_req, res) => res.send('ok'));

// AI-chat met veilige fallback (valt nooit stuk)
const HAS_KEY = !!process.env.OPENAI_API_KEY;
console.log('Has OPENAI_API_KEY:', HAS_KEY);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post('/api/chat', async (req, res) => {
  const userMsg = (req.body?.message ?? '').toString().slice(0, 1000);

  // Geen key gevonden? Vriendelijk terugvallen op echo
  if (!HAS_KEY) {
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
    // Geen 500 naar de browser; altijd iets terug
    res.json({ reply: 'Er ging iets mis aan de serverkant.' });
  }
});

// Start server (Render zet de poort)
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`API luistert op :${PORT}`));
