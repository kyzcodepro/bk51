// Fonction serverless Vercel : identifie un véhicule français à partir de sa plaque.
// Fournisseur : RegCheck (https://www.regcheck.org.uk), endpoint CheckFrance.
// Activer en ajoutant la variable d'environnement REGCHECK_USERNAME dans Vercel.

const SIV = /^[A-Z]{2}\d{3}[A-Z]{2}$/; // AA-123-AA
const FNI = /^\d{1,4}[A-Z]{1,3}\d{2}$/; // 1234 AB 51

const text = (v) => (v && typeof v === 'object' ? v.CurrentTextValue : v) || '';

export default async function handler(req, res) {
  const plaque = String(req.query.plaque || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!SIV.test(plaque) && !FNI.test(plaque)) {
    return res.status(400).json({ error: 'Plaque invalide' });
  }

  const username = process.env.REGCHECK_USERNAME;
  if (!username) {
    return res.status(503).json({ error: 'Identification automatique non configurée' });
  }

  try {
    const url = `https://www.regcheck.org.uk/api/reg.asmx/CheckFrance?RegistrationNumber=${plaque}&username=${encodeURIComponent(username)}`;
    const r = await fetch(url, { signal: AbortSignal.timeout(10000) });
    const xml = await r.text();
    const m = xml.match(/<vehicleJson>([\s\S]*?)<\/vehicleJson>/);
    if (!r.ok || !m) return res.status(404).json({ error: 'Véhicule introuvable' });

    const raw = m[1].replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
    const d = JSON.parse(raw);
    const ext = d.ExtendedData || {};

    res.setHeader('Cache-Control', 's-maxage=86400');
    return res.status(200).json({
      plaque,
      description: d.Description || '',
      marque: text(d.CarMake) || d.MakeDescription || ext.marque || '',
      modele: text(d.CarModel) || d.ModelDescription || ext.modele || '',
      version: ext.version || '',
      energie: text(d.FuelType) || ext.energieNGC || '',
      cylindree: d.EngineSize ? text(d.EngineSize) : ext.CCm || '',
      annee: d.RegistrationYear || (ext.datePremiereMiseCirculation || '').slice(-4),
      kw: ext.puissanceDyn || ext.KW || '',
      details: ext,
    });
  } catch {
    return res.status(502).json({ error: 'Service indisponible' });
  }
}
