// Tableau de bord : lit /api/stats et affiche indicateurs, graphique par jour et tableau.
const METRICS = [
  { key: 'visite', label: 'Visites' },
  { key: 'appel', label: 'Appels' },
  { key: 'devis_clic', label: 'Clics « devis »' },
  { key: 'devis_envoye', label: 'Devis envoyés' },
  { key: 'itineraire', label: 'Itinéraires' },
  { key: 'avis', label: 'Clics « avis »' },
];

const tiles = document.getElementById('tiles');
const chart = document.getElementById('chart');
const tip = document.getElementById('chart-tip');
const table = document.getElementById('table');
const sub = document.getElementById('dash-sub');
const errorBox = document.getElementById('dash-error');
const nf = new Intl.NumberFormat('fr-FR');
const dayFmt = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
const shortFmt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', timeZone: 'UTC' });
const asDate = (s) => new Date(`${s}T00:00:00Z`);

let rows = [];
let metric = 'visite';
let days = 30;

const sum = (key) => rows.reduce((t, r) => t + r[key], 0);

const renderTiles = () => {
  const visites = sum('visite');
  const contacts = sum('appel') + sum('devis_envoye');
  const taux = visites ? `${Math.round((contacts / visites) * 100)} %` : '–';
  tiles.innerHTML = '';
  METRICS.forEach((m) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'tile';
    b.setAttribute('role', 'tab');
    b.setAttribute('aria-selected', String(m.key === metric));
    b.innerHTML = `<span class="tile__label">${m.label}</span><span class="tile__value">${nf.format(sum(m.key))}</span>`;
    b.addEventListener('click', () => { metric = m.key; render(); });
    tiles.append(b);
  });
  const t = document.createElement('div');
  t.className = 'tile tile--static';
  t.innerHTML = `<span class="tile__label">Taux de contact</span><span class="tile__value">${taux}</span><span class="tile__hint">appels + devis / visites</span>`;
  tiles.append(t);
};

const niceMax = (v) => {
  if (v <= 4) return 4;
  const p = 10 ** Math.floor(Math.log10(v));
  return [1, 2, 2.5, 5, 10].map((m) => m * p).find((m) => m >= v);
};

const renderChart = () => {
  const label = METRICS.find((m) => m.key === metric).label;
  document.getElementById('chart-title').textContent = `${label} par jour`;
  const W = Math.max(320, chart.clientWidth || 900), H = W < 600 ? 220 : 260, L = 34, R = 8, T = 10, B = 26;
  const max = niceMax(Math.max(1, ...rows.map((r) => r[metric])));
  const slot = (W - L - R) / rows.length;
  const bw = Math.max(1, Math.min(28, slot - 2));
  const y = (v) => T + (H - T - B) * (1 - v / max);
  const ticks = [0, max / 2, max];
  const every = Math.ceil(rows.length / (W < 600 ? 4 : 8));

  let svg = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${label} par jour, ${rows.length} derniers jours">`;
  ticks.forEach((t) => {
    svg += `<line class="grid" x1="${L}" x2="${W - R}" y1="${y(t)}" y2="${y(t)}"/><text class="axis" x="${L - 6}" y="${y(t) + 4}" text-anchor="end">${nf.format(t)}</text>`;
  });
  rows.forEach((r, i) => {
    const x = L + i * slot + (slot - bw) / 2;
    const v = r[metric];
    const h = H - B - y(v);
    const rad = Math.min(4, bw / 2, h);
    if (v > 0) {
      svg += `<path class="bar" d="M${x} ${H - B} V${y(v) + rad} Q${x} ${y(v)} ${x + rad} ${y(v)} H${x + bw - rad} Q${x + bw} ${y(v)} ${x + bw} ${y(v) + rad} V${H - B} Z"/>`;
    }
    svg += `<rect class="hit" data-i="${i}" x="${L + i * slot}" y="${T}" width="${slot}" height="${H - T - B}"/>`;
    if (i % every === 0) svg += `<text class="axis" x="${x + bw / 2}" y="${H - 8}" text-anchor="middle">${shortFmt.format(asDate(r.date))}</text>`;
  });
  svg += `<line class="base" x1="${L}" x2="${W - R}" y1="${H - B}" y2="${H - B}"/></svg>`;
  chart.innerHTML = svg;

  chart.querySelectorAll('.hit').forEach((h) => {
    const show = () => {
      const r = rows[h.dataset.i];
      chart.querySelectorAll('.hit.on').forEach((o) => o.classList.remove('on'));
      h.classList.add('on');
      tip.innerHTML = `<strong>${dayFmt.format(asDate(r.date))}</strong><br>${label} : ${nf.format(r[metric])}`;
      tip.hidden = false;
      const box = chart.getBoundingClientRect();
      const hb = h.getBoundingClientRect();
      tip.style.left = `${Math.min(Math.max(hb.left - box.left + hb.width / 2, 60), box.width - 60)}px`;
    };
    h.addEventListener('pointerenter', show);
    h.addEventListener('click', show);
  });
  chart.onpointerleave = () => { tip.hidden = true; chart.querySelectorAll('.hit.on').forEach((o) => o.classList.remove('on')); };
};

const renderTable = () => {
  const head = `<thead><tr><th>Jour</th>${METRICS.map((m) => `<th>${m.label}</th>`).join('')}</tr></thead>`;
  const body = [...rows].reverse().map((r) =>
    `<tr><td>${dayFmt.format(asDate(r.date))}</td>${METRICS.map((m) => `<td>${nf.format(r[m.key])}</td>`).join('')}</tr>`).join('');
  table.innerHTML = head + `<tbody>${body}</tbody>`;
};

const render = () => { renderTiles(); renderChart(); renderTable(); };

const load = async () => {
  sub.textContent = 'Chargement…';
  errorBox.hidden = true;
  try {
    const r = await fetch(`/api/stats?days=${days}`);
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.error || `Erreur ${r.status}`);
    rows = d.days;
    sub.textContent = `${days === 365 ? '12 derniers mois' : `${days} derniers jours`} · mis à jour à ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    render();
  } catch (e) {
    sub.textContent = '';
    errorBox.textContent = `${e.message}.`;
    errorBox.hidden = false;
  }
};

document.querySelectorAll('.range button').forEach((b) => {
  b.addEventListener('click', () => {
    document.querySelectorAll('.range button').forEach((o) => o.setAttribute('aria-pressed', String(o === b)));
    days = Number(b.dataset.days);
    load();
  });
});

let resizeTimer;
addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => rows.length && renderChart(), 150);
});

load();
