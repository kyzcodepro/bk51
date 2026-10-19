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
  const body = `Nom : ${d.nom}\nTéléphone : ${d.tel}\nVéhicule : ${d.vehicule || '-'}\n\n${d.message}`;
  if (!CONFIG.email) {
    note.textContent = CONFIG.phone
      ? `Envoi en ligne bientôt disponible. Appelez-nous au ${CONFIG.phone}.`
      : 'Envoi en ligne bientôt disponible. Passez nous voir au garage.';
    return;
  }
  window.location.href = `mailto:${CONFIG.email}?subject=${encodeURIComponent(d.objet + ' - ' + d.nom)}&body=${encodeURIComponent(body)}`;
  note.textContent = 'Votre messagerie va s’ouvrir pour envoyer la demande.';
});
