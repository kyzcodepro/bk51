// Fonction serverless Vercel : envoie la demande de devis par e-mail via Resend (https://resend.com).
// Variables d'environnement :
//   RESEND_API_KEY  clé API Resend
//   DEVIS_EMAIL     adresse qui reçoit les demandes
//   DEVIS_FROM      expéditeur (facultatif ; par défaut l'adresse de test Resend,
//                   à remplacer par ex. "BK AUTO 51 <devis@bkauto51.fr>" une fois le domaine vérifié)

const FIELDS = { nom: 100, tel: 30, plaque: 12, vehicule: 120, objet: 60, message: 3000 };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  // Champ piège invisible : rempli uniquement par les robots
  if (body.site) return res.status(200).json({ ok: true });

  const d = {};
  for (const [k, max] of Object.entries(FIELDS)) d[k] = String(body[k] || '').trim().slice(0, max);
  if (!d.nom || !d.tel || !d.plaque || !d.message) {
    return res.status(400).json({ error: 'Champs obligatoires manquants' });
  }

  const { RESEND_API_KEY, DEVIS_EMAIL, DEVIS_FROM } = process.env;
  if (!RESEND_API_KEY || !DEVIS_EMAIL) {
    return res.status(503).json({ error: 'Envoi non configuré' });
  }

  const text = [
    `Nouvelle demande de devis depuis le site`,
    ``,
    `Nom        : ${d.nom}`,
    `Téléphone  : ${d.tel}`,
    `Plaque     : ${d.plaque}`,
    `Véhicule   : ${d.vehicule || '-'}`,
    `Demande    : ${d.objet || '-'}`,
    ``,
    d.message,
  ].join('\n');

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: DEVIS_FROM || 'BK AUTO 51 <onboarding@resend.dev>',
        to: [DEVIS_EMAIL],
        subject: `Devis ${d.plaque} – ${d.objet || 'Demande'} – ${d.nom}`,
        text,
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (!r.ok) return res.status(502).json({ error: 'Envoi impossible' });
    return res.status(200).json({ ok: true });
  } catch {
    return res.status(502).json({ error: 'Envoi impossible' });
  }
}
