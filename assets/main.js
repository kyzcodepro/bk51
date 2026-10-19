// Coordonnées du garage : modifiez ces valeurs, elles sont reprises partout sur le site.
const CONFIG = {
  phone: '07 49 59 12 08',
  email: '', // ex. 'contact@bkauto51.fr' (reçoit les demandes du formulaire)
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

// Formulaire : ouvre le client mail avec la demande pré-remplie (aucun serveur requis)
const form = document.getElementById('contact-form');
const note = form.querySelector('.form__note');

// Plaque : mise en forme AA-123-AA pendant la saisie
form.plaque.addEventListener('input', () => {
  const v = form.plaque.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
  form.plaque.value = /^[A-Z]{1,2}/.test(v) ? [v.slice(0, 2), v.slice(2, 5), v.slice(5, 7)].filter(Boolean).join('-') : v;
});
form.addEventListener('submit', (e) => {
  e.preventDefault();
  if (!form.checkValidity()) {
    note.textContent = 'Merci de renseigner votre nom, votre téléphone, votre plaque et votre message.';
    form.reportValidity();
    return;
  }
  const d = Object.fromEntries(new FormData(form));
  const body = `Nom : ${d.nom}\nTéléphone : ${d.tel}\nPlaque : ${d.plaque || '-'}\nVéhicule : ${d.vehicule || '-'}\n\n${d.message}`;
  if (!CONFIG.email) {
    note.textContent = CONFIG.phone
      ? `Envoi en ligne bientôt disponible. Appelez-nous au ${CONFIG.phone}.`
      : 'Envoi en ligne bientôt disponible. Passez nous voir au garage.';
    return;
  }
  window.location.href = `mailto:${CONFIG.email}?subject=${encodeURIComponent(d.objet + ' - ' + d.nom)}&body=${encodeURIComponent(body)}`;
  note.textContent = 'Votre messagerie va s’ouvrir pour envoyer la demande.';
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
