import Fastify from 'fastify';
import cron from 'node-cron';
import db from './db.js';
import { runAllScrapers } from './scrapers.js';

const fastify = Fastify({ logger: true });

fastify.get('/brands', async () => {
  return db.prepare('SELECT * FROM brands').all();
});

fastify.post('/brands', async (request) => {
  const { lines } = request.body;
  if (!lines) return { error: 'lines required' };
  const stmt = db.prepare('INSERT INTO brands (name, url) VALUES (?, ?)');
  const brands = [];
  for (const line of lines.split('\n')) {
    if (!line.trim()) continue;
    const [name, url] = line.split(',');
    const info = stmt.run(name.trim(), url.trim());
    brands.push({ id: info.lastInsertRowid, name, url });
  }
  return brands;
});

fastify.get('/traffic/latest', async (request) => {
  const days = parseInt(request.query.days || '30', 10);
  const stmt = db.prepare(`SELECT * FROM traffic WHERE captured_at >= datetime('now', ?)`);
  return stmt.all(`-${days} days`);
});

fastify.get('/ads/:brandId', async (request) => {
  const limit = parseInt(request.query.limit || '100', 10);
  const stmt = db.prepare('SELECT * FROM ads WHERE brand_id=? ORDER BY captured_at DESC LIMIT ?');
  return stmt.all(request.params.brandId, limit);
});

fastify.listen({ port: 4000, host: '0.0.0.0' }, (err, address) => {
  if (err) throw err;
  console.log(`Server listening at ${address}`);
});

cron.schedule('0 3 * * *', runAllScrapers);
