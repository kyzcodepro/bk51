// Fonction serverless Vercel : envoie la demande de devis par e-mail via Resend (https://resend.com),
// puis un e-mail de confirmation au client.
// Variables d'environnement :
//   RESEND_API_KEY  clé API Resend
//   DEVIS_EMAIL     adresse(s) qui reçoivent les demandes, séparées par une virgule
//   DEVIS_FROM      expéditeur (facultatif ; par défaut devis@bkauto51.com, domaine vérifié dans Resend)

import { incr } from './_stats.js';

const FIELDS = { nom: 100, tel: 30, email: 254, plaque: 12, vehicule: 120, objet: 60, message: 3000 };
const OBJETS = [
  'Demande de devis', 'Entretien / révision', 'Réparation / diagnostic', 'Freinage',
  'Distribution / embrayage', 'Nettoyage FAP', 'Déplacement à domicile', 'Autre',
];
const EMAIL = /^[^\s@<>()",;]+@[^\s@<>()",;]+\.[a-z]{2,}$/i;
const PLAQUE = /^([A-Z]{2}-?\d{3}-?[A-Z]{2}|\d{1,4} ?[A-Z]{1,3} ?\d{2})$/;

const GARAGE = {
  tel: '07 49 59 12 08',
  adresse: '3 rue Adolphe Willette, 51000 Châlons-en-Champagne',
  horaires: 'du lundi au vendredi, de 9h à 18h',
  site: 'https://www.bkauto51.com',
};

const send = (key, payload) =>
  fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(10000),
  });

// La confirmation ne reprend que des champs contrôlés (plaque, type de demande),
// pour qu'elle ne puisse pas servir à envoyer un texte libre à n'importe qui.
const confirmation = (d) => {
  const text = [
    `Bonjour,`,
    ``,
    `Nous avons bien reçu votre demande de devis et nous vous rappelons rapidement.`,
    ``,
    `Plaque   : ${d.plaque}`,
    `Demande  : ${d.objet}`,
    ``,
    `Une question en attendant ? Appelez-nous au ${GARAGE.tel} (${GARAGE.horaires}).`,
    ``,
    `BK AUTO 51`,
    GARAGE.adresse,
    GARAGE.site,
  ].join('\n');
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#141414;max-width:520px">
  <div style="background:#141414;padding:14px 18px"><span style="background:#ffd200;color:#141414;font-weight:800;padding:2px 6px">BK</span><span style="color:#eeebe3;font-weight:800;padding-left:6px">AUTO 51</span></div>
  <div style="border:2px solid #141414;border-top:0;padding:20px 18px;background:#eeebe3">
    <p style="margin:0 0 12px">Bonjour,</p>
    <p style="margin:0 0 16px">Nous avons bien reçu votre demande de devis et nous vous rappelons rapidement.</p>
    <table style="border-collapse:collapse;margin:0 0 16px;font-family:monospace,monospace;font-size:14px">
      <tr><td style="padding:4px 16px 4px 0;color:#6d695f">PLAQUE</td><td style="padding:4px 0;font-weight:bold">${d.plaque}</td></tr>
      <tr><td style="padding:4px 16px 4px 0;color:#6d695f">DEMANDE</td><td style="padding:4px 0">${d.objet}</td></tr>
    </table>
    <p style="margin:0 0 16px">Une question en attendant&nbsp;? Appelez-nous au <a href="tel:+33749591208" style="color:#141414;font-weight:bold">${GARAGE.tel}</a> (${GARAGE.horaires}).</p>
    <p style="margin:0;font-size:13px;color:#6d695f">BK AUTO 51 — ${GARAGE.adresse}<br><a href="${GARAGE.site}" style="color:#6d695f">www.bkauto51.com</a></p>
  </div>
</div>`;
  return { text, html };
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  // Champ piège invisible : rempli uniquement par les robots
  if (body.site) return res.status(200).json({ ok: true });

  const d = {};
  for (const [k, max] of Object.entries(FIELDS)) d[k] = String(body[k] || '').trim().slice(0, max);
  if (!d.nom || !d.tel || !d.email || !d.plaque || !d.message) {
    return res.status(400).json({ error: 'Champs obligatoires manquants' });
  }
  const tel = d.tel.replace(/[\s.\-()]/g, '').replace(/^(\+33|0033)/, '0');
  if (!/^0[1-9]\d{8}$/.test(tel)) {
    return res.status(400).json({ error: 'Numéro de téléphone invalide' });
  }
  d.tel = tel.replace(/(\d{2})(?=\d)/g, '$1 ');
  if (!EMAIL.test(d.email)) return res.status(400).json({ error: 'Adresse e-mail invalide' });
  d.plaque = d.plaque.toUpperCase();
  if (!PLAQUE.test(d.plaque)) return res.status(400).json({ error: "Plaque d'immatriculation invalide" });
  if (!OBJETS.includes(d.objet)) d.objet = 'Demande de devis';

  const { RESEND_API_KEY, DEVIS_EMAIL, DEVIS_FROM } = process.env;
  if (!RESEND_API_KEY || !DEVIS_EMAIL) {
    return res.status(503).json({ error: 'Envoi non configuré' });
  }
  const from = DEVIS_FROM || 'BK AUTO 51 <devis@bkauto51.com>';

  const text = [
    `Nouvelle demande de devis depuis le site`,
    ``,
    `Nom        : ${d.nom}`,
    `Téléphone  : ${d.tel}`,
    `E-mail     : ${d.email}`,
    `Plaque     : ${d.plaque}`,
    `Véhicule   : ${d.vehicule || '-'}`,
    `Demande    : ${d.objet}`,
    ``,
    d.message,
    ``,
    `Répondez directement à cet e-mail pour écrire au client.`,
  ].join('\n');

  try {
    const r = await send(RESEND_API_KEY, {
      from,
      to: DEVIS_EMAIL.split(',').map((e) => e.trim()).filter(Boolean),
      reply_to: d.email,
      subject: `Devis ${d.plaque} – ${d.objet} – ${d.nom}`,
      text,
    });
    if (!r.ok) {
      const detail = (await r.json().catch(() => ({}))).message || `Resend ${r.status}`;
      console.error('Resend:', r.status, detail);
      return res.status(502).json({ error: 'Envoi impossible', detail });
    }
  } catch {
    return res.status(502).json({ error: 'Envoi impossible' });
  }

  await incr('devis_envoye').catch((e) => console.error('stats:', e.message));

  // La demande est arrivée au garage : un échec de la confirmation ne doit pas faire échouer la requête.
  let confirmed = false;
  try {
    const r = await send(RESEND_API_KEY, {
      from,
      to: [d.email],
      reply_to: 'devis@bkauto51.com',
      subject: 'BK AUTO 51 – Nous avons bien reçu votre demande de devis',
      ...confirmation(d),
    });
    confirmed = r.ok;
    if (!r.ok) console.error('Confirmation:', r.status, (await r.json().catch(() => ({}))).message);
  } catch (e) {
    console.error('Confirmation:', e.message);
  }
  return res.status(200).json({ ok: true, confirmed });
}
