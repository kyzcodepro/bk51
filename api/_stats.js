// Compteurs de statistiques dans Upstash Redis (API REST, sans dépendance).
// Variables d'environnement créées par l'intégration Upstash de Vercel :
//   KV_REST_API_URL / KV_REST_API_TOKEN  (ou UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN)
// Une clé par jour (heure de Paris) : stats:AAAA-MM-JJ -> { evenement: nombre }

export const EVENTS = ['visite', 'appel', 'devis_clic', 'devis_envoye', 'itineraire', 'avis'];

const URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const KEEP_SECONDS = 400 * 24 * 3600;

export const configured = () => Boolean(URL && TOKEN);

const day = (date) => new Intl.DateTimeFormat('fr-CA', { timeZone: 'Europe/Paris' }).format(date);

const pipeline = async (commands) => {
  const r = await fetch(`${URL}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(commands),
    signal: AbortSignal.timeout(5000),
  });
  if (!r.ok) throw new Error(`Redis ${r.status}`);
  return r.json();
};

export const incr = async (event) => {
  if (!configured() || !EVENTS.includes(event)) return;
  const key = `stats:${day(new Date())}`;
  await pipeline([['HINCRBY', key, event, 1], ['EXPIRE', key, KEEP_SECONDS]]);
};

export const read = async (days) => {
  const dates = [];
  for (let i = days - 1; i >= 0; i--) dates.push(day(new Date(Date.now() - i * 86400000)));
  const results = await pipeline(dates.map((d) => ['HGETALL', `stats:${d}`]));
  return dates.map((date, i) => {
    const row = { date };
    EVENTS.forEach((e) => (row[e] = 0));
    const flat = results[i]?.result || [];
    for (let j = 0; j < flat.length; j += 2) if (EVENTS.includes(flat[j])) row[flat[j]] = Number(flat[j + 1]) || 0;
    return row;
  });
};
