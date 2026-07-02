require('dotenv').config();
const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

(async () => {
  console.log('--- TESTING GROQ API CONNECTION ---');
  console.log('API Key configured:', !!process.env.GROQ_API_KEY);
  
  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: 'Say hello in one word' }],
      model: 'llama-3.1-8b-instant'
    });
    console.log('✅ Groq API Success!');
    console.log('Response:', completion.choices[0].message.content);
  } catch (err) {
    console.error('❌ Groq API Failed:', err.message);
    if (err.status) console.error('Status Code:', err.status);
    if (err.headers) console.error('Headers:', err.headers);
  }
  process.exit(0);
})();
