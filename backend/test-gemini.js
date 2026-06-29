import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

try {
  console.log('Testing Gemini API...');
  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: 'Say hello in JSON: {"hello": "world"}',
    config: { responseMimeType: 'application/json' }
  });
  console.log('SUCCESS:', response.text);
} catch (e) {
  console.error('ERROR:', e.message);
  console.error('Full error:', JSON.stringify(e, null, 2));
}
