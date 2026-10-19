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
      : 'Merci de renseigner votre nom, votre téléphone, votre plaque et votre message.';
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
    form.reset();
    note.textContent = 'Demande envoyée ✓ On vous rappelle rapidement.';
  } catch {
    note.textContent = `L'envoi n'a pas fonctionné. Appelez-nous au ${CONFIG.phone}.`;
  } finally {
    submitBtn.disabled = false;
  }
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
