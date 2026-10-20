// Protège l'espace atelier (réservé au garage) par mot de passe.
// Définir la variable d'environnement ATELIER_PASSWORD dans Vercel.

export const config = {
  matcher: [
    '/atelier', '/atelier.html', '/assets/atelier.js', '/api/vehicule',
    '/statistiques', '/statistiques.html', '/assets/stats.js', '/api/stats',
  ],
};

export default function middleware(request) {
  const password = process.env.ATELIER_PASSWORD;
  if (!password) {
    return new Response('Espace atelier non configuré (variable ATELIER_PASSWORD manquante).', { status: 503 });
  }

  const [scheme, encoded] = (request.headers.get('authorization') || '').split(' ');
  if (scheme === 'Basic' && encoded) {
    let decoded = '';
    try {
      decoded = new TextDecoder().decode(Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0)));
    } catch {}
    if (decoded.includes(':') && decoded.slice(decoded.indexOf(':') + 1) === password) {
      return new Response(null, { headers: { 'x-middleware-next': '1' } });
    }
  }

  return new Response('Accès réservé au garage.', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Atelier BK AUTO 51", charset="UTF-8"' },
  });
}
