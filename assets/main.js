// Coordonnées du garage : modifiez ces valeurs, elles sont reprises partout sur le site.
const CONFIG = {
  phone: '', // ex. '06 12 34 56 78'
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
form.addEventListener('submit', (e) => {
  e.preventDefault();
  if (!form.checkValidity()) {
    note.textContent = 'Merci de renseigner votre nom, votre téléphone et votre message.';
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

// Barre de lecture + ombre de l'en-tête
const progress = document.querySelector('.progress');
const header = document.querySelector('.header');
const onScroll = () => {
  const max = document.documentElement.scrollHeight - innerHeight;
  progress.style.setProperty('--p', max > 0 ? scrollY / max : 0);
  header.classList.toggle('is-scrolled', scrollY > 10);
};
addEventListener('scroll', onScroll, { passive: true });
onScroll();

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

  const steps = document.querySelector('.steps');
  const lineIo = new IntersectionObserver(([e]) => {
    if (e.isIntersecting) { steps.classList.add('is-drawn'); lineIo.disconnect(); }
  }, { threshold: 0.3 });
  lineIo.observe(steps);
} else {
  reveals.forEach((el) => el.classList.add('is-visible'));
}

// Mot qui change dans le titre
const word = document.querySelector('.rotator__word');
const words = ['voiture', 'citadine', 'familiale', 'SUV', 'utilitaire'];
let w = 0;
if (!reduce) {
  setInterval(() => {
    word.classList.remove('in');
    word.classList.add('out');
    setTimeout(() => {
      w = (w + 1) % words.length;
      word.textContent = words[w];
      word.classList.remove('out');
      word.classList.add('in');
    }, 350);
  }, 2600);
}

// Halo des cartes qui suit la souris
document.querySelectorAll('.card').forEach((card) => {
  card.addEventListener('pointermove', (e) => {
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${e.clientX - r.left}px`);
    card.style.setProperty('--my', `${e.clientY - r.top}px`);
  });
});

