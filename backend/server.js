import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import twilio from 'twilio';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Load catalog
const catalogPath = path.join(__dirname, 'catalog.json');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

// ── Gemini SDK ──────────────────────────────────────────────────────────────
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: { baseUrl: 'https://generativelanguage.googleapis.com' },
});

// Model pool — round-robin rotation + quota fallback
// Names must match the exact model IDs accepted by the Gemini API
const MODELS = [
  'gemini-3.1-flash-lite',      // Gemini 3.5 Flash
  'gemini-2.5-flash',      // Gemini 2.5 Flash
];
let modelIndex = 0; // Tracks the current round-robin position

/**
 * Calls Gemini with automatic round-robin + quota fallback.
 * - Starts at the current round-robin position.
 * - On quota/rate-limit error (HTTP 429 / RESOURCE_EXHAUSTED), tries the next model.
 * - Cycles through all models before giving up.
 * - Advances the round-robin pointer after every successful request.
 */
async function callGemini({ contents, config = {} }) {
  const total = MODELS.length;
  let lastError;

  for (let attempt = 0; attempt < total; attempt++) {
    const idx   = (modelIndex + attempt) % total;
    const model = MODELS[idx];
    try {
      console.log(`🤖 Trying model [${idx + 1}/${total}]: ${model}`);
      const response = await ai.models.generateContent({ model, contents, config });
      // Success — advance round-robin for next request
      modelIndex = (idx + 1) % total;
      console.log(`✅ Success with: ${model}`);
      return response;
    } catch (err) {
      const isQuota = err?.status === 429
        || err?.message?.includes('RESOURCE_EXHAUSTED')
        || err?.message?.includes('quota')
        || err?.message?.includes('rate limit');

      if (isQuota) {
        console.warn(`⚠️  Model ${model} quota exhausted — trying next model…`);
        lastError = err;
        continue; // Try next model
      }
      // Non-quota error — don't retry with other models
      throw err;
    }
  }
  // All models exhausted
  throw new Error(
    `All Gemini models exhausted their quota. Last error: ${lastError?.message}`
  );
}

// ── Twilio ───────────────────────────────────────────────────────────────────
const rawAuthToken = process.env.TWILIO_AUTH_TOKEN || '';
const twilioAuthToken = rawAuthToken.includes(':') ? rawAuthToken.split(':')[1] : rawAuthToken;

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  twilioAuthToken
);

app.post('/api/parse-list', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const prompt = `You are a witty Blinkit-style store manager. Compare the user's requested items against the provided catalog.
You must return a strict JSON object with two keys:
- "cartItems": array of matched items, each with { "id": number, "item": string, "qty": number, "totalPrice": number }
- "missingItems": array of items NOT in the catalog, each with { "item": string, "funnyMessage": string }

For each missing item, write a "funnyMessage" in a soft, humorous Indian tone.
Examples: "Sorry boss, Mukesh Ambani bought all our stock!", "Neighbour aunty took the last one!", "Yeh toh out of stock hai ji, try next time!"

IMPORTANT: Return ONLY the raw JSON object. No markdown, no explanation, no code blocks.

Catalog:
${JSON.stringify(catalog)}

User's grocery list:
${text}`;

    const response = await callGemini({
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    });

    const resultText = response.text;
    console.log(`✅ Gemini response received, length: ${resultText?.length}`);

    const parsedData = JSON.parse(resultText);
    res.json(parsedData);
  } catch (error) {
    const errMsg = error?.message || JSON.stringify(error);
    console.error('\n❌ Error in /api/parse-list:');
    console.error('Status:', error?.status);
    console.error('Message:', errMsg.slice(0, 800));
    res.status(500).json({ error: errMsg.slice(0, 400) });
  }
});

app.post('/api/send-whatsapp', async (req, res) => {
  try {
    const { phone, cartItems, total } = req.body;

    if (!phone || !cartItems || cartItems.length === 0) {
      return res.status(400).json({ error: 'Phone and cart items are required' });
    }

    // Clean phone number — keep + and digits only
    const cleanPhone = phone.replace(/[^\d+]/g, '');

    // Build receipt message
    let messageBody = `🛒 *Smart Kirana Order*\n\n`;
    cartItems.forEach((item, index) => {
      messageBody += `${index + 1}. ${item.item} x ${item.qty} — ₹${item.totalPrice}\n`;
    });
    messageBody += `\n🧾 *Total: ₹${total}*\n\nThank you for shopping! 🚀`;

    const message = await twilioClient.messages.create({
      body: messageBody,
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to: `whatsapp:${cleanPhone}`,
    });

    console.log('✅ WhatsApp sent, SID:', message.sid);
    res.json({ success: true, messageId: message.sid });
  } catch (error) {
    const errMsg = error?.message || JSON.stringify(error);
    console.error('\n❌ Error in /api/send-whatsapp:', errMsg.slice(0, 400));
    res.status(500).json({ error: errMsg.slice(0, 300) });
  }
});

const PORT = process.env.PORT || 3002;
const server = app.listen(PORT, () => {
  console.log(`\n🚀 Smart Kirana backend running on http://localhost:${PORT}`);
  console.log(`📦 Catalog loaded: ${catalog.length} items`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Port ${PORT} is already in use! Kill the process using it or change PORT in .env`);
  } else {
    console.error('Server error:', err);
  }
  process.exit(1);
});
