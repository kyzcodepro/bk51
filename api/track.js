// Enregistre un événement anonyme (visite, appel, clic devis…). Aucun cookie, aucune donnée personnelle.
import { incr } from './_stats.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  let body = req.body || {};
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  try {
    await incr(String(body.e || ''));
  } catch (e) {
    console.error('track:', e.message);
  }
  return res.status(204).end();
}
