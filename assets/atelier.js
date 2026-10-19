// Espace atelier : identification du véhicule par plaque et liste de pièces.
const plateForm = document.getElementById('plate-form');
const plateInput = document.getElementById('plate-input');
const plateStatus = document.getElementById('plate-status');
const sheet = document.getElementById('sheet');
const specs = document.getElementById('specs');
const historyBox = document.getElementById('history');
const copyStatus = document.getElementById('copy-status');
let vehicle = null;

const HISTORY_KEY = 'bk51-atelier-historique';
const readHistory = () => {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY)) || []; } catch { return []; }
};
const saveHistory = (plaque, label) => {
  const list = [{ plaque, label }, ...readHistory().filter((h) => h.plaque !== plaque)].slice(0, 8);
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(list)); } catch {}
  renderHistory();
};
const renderHistory = () => {
  const list = readHistory();
  historyBox.hidden = !list.length;
  historyBox.innerHTML = '<span class="history__label">Récents :</span>';
  list.forEach((h) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'history__item';
    b.textContent = h.plaque;
    b.title = h.label || '';
    b.addEventListener('click', () => { plateInput.value = h.plaque; plateForm.requestSubmit(); });
    historyBox.append(b);
  });
};
renderHistory();

const formatPlate = (raw) => {
  const v = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
  return /^[A-Z]{1,2}/.test(v) ? [v.slice(0, 2), v.slice(2, 5), v.slice(5, 7)].filter(Boolean).join('-') : v;
};
plateInput.addEventListener('input', () => { plateInput.value = formatPlate(plateInput.value); });

const copy = async (text, msg) => {
  try { await navigator.clipboard.writeText(text); copyStatus.textContent = msg; } catch { copyStatus.textContent = 'Copie impossible sur ce navigateur.'; }
};

// Libellés lisibles pour les champs les plus utiles ; les autres s'affichent tels quels.
const LABELS = {
  marque: 'Marque', modele: 'Modèle', version: 'Version', energie: 'Énergie', cylindree: 'Cylindrée (cm³)',
  annee: 'Année', kw: 'Puissance (kW)', vin: 'VIN', codeMoteur: 'Code moteur', cnit: 'CNIT', typeMine: 'Type mine',
};
const prettify = (k) => LABELS[k] || k.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, (c) => c.toUpperCase());

const renderSpecs = (d) => {
  const rows = { ...d, ...(d.details || {}) };
  delete rows.details; delete rows.description; delete rows.plaque;
  specs.innerHTML = '';
  Object.entries(rows).forEach(([k, v]) => {
    if (v === '' || v == null || typeof v === 'object') return;
    const dt = document.createElement('dt');
    dt.textContent = prettify(k);
    const dd = document.createElement('dd');
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = v;
    b.addEventListener('click', () => copy(String(v), `${prettify(k)} copié ✓`));
    dd.append(b);
    specs.append(dt, dd);
  });
};

plateForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const plaque = plateInput.value.replace(/[^A-Z0-9]/g, '');
  if (!/^([A-Z]{2}\d{3}[A-Z]{2}|\d{1,4}[A-Z]{1,3}\d{2})$/.test(plaque)) {
    plateStatus.textContent = 'Format attendu : AB-123-CD';
    plateForm.classList.remove('shake'); void plateForm.offsetWidth; plateForm.classList.add('shake');
    return;
  }
  plateForm.classList.add('is-loading');
  plateStatus.textContent = 'Recherche du véhicule…';
  try {
    const r = await fetch(`/api/vehicule?plaque=${plaque}`);
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.error || `Erreur ${r.status}`);
    vehicle = { ...d, plaque: plateInput.value };
    const title = [d.marque, d.modele].filter(Boolean).join(' ') || d.description;
    document.getElementById('vehicle-title').textContent = `${title} · ${plateInput.value}`;
    document.getElementById('vehicle-meta').textContent = [d.version, d.energie, d.cylindree && `${d.cylindree} cm³`, d.annee].filter(Boolean).join(' · ');
    renderSpecs(d);
    sheet.hidden = false;
    plateStatus.textContent = 'Véhicule identifié ✓';
    saveHistory(plateInput.value, title);
    sheet.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (err) {
    plateStatus.textContent = `${err.message}.`;
  } finally {
    plateForm.classList.remove('is-loading');
  }
});

const listText = () => {
  const parts = [...document.querySelectorAll('#parts-grid input:checked')].map((i) => `- ${i.value}`);
  const v = vehicle || {};
  return [
    `Véhicule : ${[v.marque, v.modele, v.version].filter(Boolean).join(' ')} (${v.plaque || ''})`,
    [v.energie, v.cylindree && `${v.cylindree} cm³`, v.annee, v.details?.codeMoteur && `moteur ${v.details.codeMoteur}`].filter(Boolean).join(' · '),
    '',
    'Pièces :',
    ...(parts.length ? parts : ['- (aucune cochée)']),
    document.getElementById('notes').value ? `\nNotes : ${document.getElementById('notes').value}` : '',
  ].join('\n').trim();
};

document.getElementById('copy-list').addEventListener('click', () => copy(listText(), 'Liste copiée ✓ Collez-la chez votre fournisseur.'));
document.getElementById('print').addEventListener('click', () => window.print());
