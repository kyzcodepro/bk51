// Coordonnées du garage : modifiez ces valeurs, elles sont reprises partout sur le site.
const CONFIG = {
  phone: '07 49 59 12 08',
};

const telHref = (n) => 'tel:' + n.replace(/[^\d+]/g, '').replace(/^0/, '+33');

if (CONFIG.phone) {
  document.querySelectorAll('.js-phone').forEach((a) => (a.href = telHref(CONFIG.phone)));
  document.querySelectorAll('.js-phone-text').forEach((a) => (a.textContent = CONFIG.phone));
} else {
  document.querySelectorAll('.js-phone').forEach((a) => (a.href = '#contact'));
}

document.getElementById('year').textContent = new Date().getFullYear();

// Menu mobile
const toggle = document.querySelector('.nav-toggle');
const nav = document.getElementById('nav');
toggle.addEventListener('click', () => {
  const open = nav.classList.toggle('is-open');
  toggle.setAttribute('aria-expanded', String(open));
});
nav.addEventListener('click', (e) => {
  if (e.target.closest('a')) {
    nav.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
  }
});

// Formulaire de devis : envoyé par e-mail via /api/devis
const form = document.getElementById('contact-form');
const note = form.querySelector('.form__note');

// Plaque : mise en forme AA-123-AA pendant la saisie
form.plaque.addEventListener('input', () => {
  const v = form.plaque.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
  form.plaque.value = /^[A-Z]{1,2}/.test(v) ? [v.slice(0, 2), v.slice(2, 5), v.slice(5, 7)].filter(Boolean).join('-') : v;
});
// Téléphone : numéro français (06…, 01…, +33…, 0033…), remis au format 06 12 34 56 78
const telDigits = (v) => {
  const d = v.replace(/[\s.\-()]/g, '').replace(/^(\+33|0033)/, '0');
  return /^0[1-9]\d{8}$/.test(d) ? d : null;
};
const checkTel = () => {
  const d = telDigits(form.tel.value);
  form.tel.setCustomValidity(d || !form.tel.value ? '' : 'Numéro français attendu, ex. 06 12 34 56 78');
  return d;
};
form.tel.addEventListener('input', checkTel);
form.tel.addEventListener('blur', () => {
  const d = checkTel();
  if (d) form.tel.value = d.replace(/(\d{2})(?=\d)/g, '$1 ');
});

const submitBtn = form.querySelector('button[type=submit]');
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  checkTel();
  if (!form.checkValidity()) {
    note.textContent = form.tel.validationMessage && form.tel.value
      ? 'Numéro de téléphone invalide : un numéro français est attendu, ex. 06 12 34 56 78.'
      : form.email.validity.typeMismatch
        ? 'Adresse e-mail invalide, ex. vous@exemple.fr.'
        : 'Merci de renseigner votre nom, votre téléphone, votre e-mail, votre plaque et votre message.';
    form.reportValidity();
    return;
  }
  submitBtn.disabled = true;
  note.textContent = 'Envoi en cours…';
  try {
    const r = await fetch('/api/devis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(new FormData(form))),
    });
    if (!r.ok) throw new Error();
    const { confirmed } = await r.json();
    const email = form.email.value;
    form.reset();
    note.textContent = confirmed
      ? `Demande envoyée ✓ Une confirmation vous a été envoyée à ${email}.`
      : 'Demande envoyée ✓ On vous rappelle rapidement.';
  } catch {
    note.textContent = `L'envoi n'a pas fonctionné. Appelez-nous au ${CONFIG.phone}.`;
  } finally {
    submitBtn.disabled = false;
  }
});

// Ouvert / fermé (heure de Paris) : lundi-vendredi 9h-18h
const openStatus = document.querySelector('[data-open-status]');
if (openStatus) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('fr-FR', {
    timeZone: 'Europe/Paris', weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23',
  }).formatToParts(new Date()).map((p) => [p.type, p.value]));
  const day = ['lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.', 'dim.'].indexOf(parts.weekday);
  const mins = Number(parts.hour) * 60 + Number(parts.minute);
  const weekday = day >= 0 && day <= 4;
  const open = weekday && mins >= 540 && mins < 1080;
  let text;
  if (open) text = 'Ouvert maintenant · ferme à 18h';
  else if (weekday && mins < 540) text = 'Fermé · ouvre aujourd\'hui à 9h';
  else if (day >= 0 && day <= 3) text = 'Fermé · ouvre demain à 9h';
  else text = 'Fermé · ouvre lundi à 9h';
  openStatus.textContent = text;
  openStatus.classList.toggle('is-open', open);
  openStatus.hidden = false;
}

// Barre d'action mobile : visible après le haut de page, masquée sur le formulaire
const actionBar = document.querySelector('.action-bar');
if (actionBar && 'IntersectionObserver' in window) {
  const seen = new Map();
  const update = () => actionBar.classList.toggle('is-visible', !seen.get('hero') && !seen.get('contact'));
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => seen.set(e.target.dataset.bar, e.isIntersecting));
    update();
  });
  const hero = document.querySelector('.hero');
  const contact = document.getElementById('contact-form');
  hero.dataset.bar = 'hero';
  contact.dataset.bar = 'contact';
  io.observe(hero);
  io.observe(contact);
}

// ---------- Statistiques anonymes (sans cookie) ----------
const track = (e) => {
  const data = new Blob([JSON.stringify({ e })], { type: 'application/json' });
  if (!(navigator.sendBeacon && navigator.sendBeacon('/api/track', data))) {
    fetch('/api/track', { method: 'POST', body: data, keepalive: true }).catch(() => {});
  }
};
try {
  if (!sessionStorage.getItem('bk51-vu')) { sessionStorage.setItem('bk51-vu', '1'); track('visite'); }
} catch { track('visite'); }
document.addEventListener('click', (e) => {
  const a = e.target.closest('a');
  if (!a) return;
  const href = a.getAttribute('href') || '';
  if (href.startsWith('tel:')) track('appel');
  else if (href === '#contact') track('devis_clic');
  else if (href.includes('google.com/maps')) track(a.dataset.track || 'itineraire');
});

// ---------- Animations ----------
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Apparition au défilement, avec décalage entre éléments voisins
const reveals = document.querySelectorAll('[data-reveal]');
reveals.forEach((el) => {
  const siblings = [...el.parentElement.children].filter((c) => c.hasAttribute('data-reveal'));
  el.style.setProperty('--i', siblings.indexOf(el));
});
if ('IntersectionObserver' in window && !reduce) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-visible');
      io.unobserve(e.target);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  reveals.forEach((el) => io.observe(el));
} else {
  reveals.forEach((el) => el.classList.add('is-visible'));
}
