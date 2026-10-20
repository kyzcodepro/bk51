// Statistiques par jour pour le tableau de bord (accès protégé par middleware.js).
import { configured, read } from './_stats.js';

export default async function handler(req, res) {
  if (!configured()) return res.status(503).json({ error: 'Base de statistiques non configurée' });
  const days = Math.min(Math.max(parseInt(req.query.days, 10) || 30, 1), 365);
  try {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ days: await read(days) });
  } catch (e) {
    console.error('stats:', e.message);
    return res.status(502).json({ error: 'Lecture impossible' });
  }
}
