import('node-fetch').catch(() => null); // polyfill fallback
const res = await fetch('http://localhost:4000/api/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'admin@salmonera.com', password: 'admin123' })
});
const data = await res.json();
console.log('Login result:', JSON.stringify(data, null, 2));
