const Groq = require('groq-sdk');
require('dotenv').config({path: '.env.local'});

async function test() {
  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const models = await groq.models.list();
    console.log("Groq models:", models.data.map(m => m.id).join(', '));
  } catch(e) {
    console.error(e);
  }
}
test();
