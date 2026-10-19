# BK AUTO 51 – site vitrine

Site statique (HTML/CSS/JS, sans build) du garage BK AUTO 51 à Châlons-en-Champagne, prêt pour Vercel.

## Déployer sur Vercel
1. Sur vercel.com : **Add New → Project**, importer le dépôt `bk51`.
2. Framework preset : **Other**. Pas de build command, output directory : `.` (racine).
3. **Deploy**.

## À personnaliser
- `assets/main.js` → `CONFIG.phone` et `CONFIG.email` (téléphone affiché + destinataire du formulaire).
- `index.html` → horaires (section Contact), textes des services.

## Espace atelier (privé) : pièces par plaque
Page réservée au garage : `/atelier` (protégée par mot de passe, non visible des clients, non indexée).
Saisir une plaque → version exacte et données techniques → cocher les pièces → copier ou imprimer la liste.

Configuration dans Vercel → Settings → Environment Variables :
- `ATELIER_PASSWORD` : mot de passe de l'espace atelier (identifiant : n'importe lequel).
- `REGCHECK_USERNAME` : identifiant du compte https://www.regcheck.org.uk (payant à la requête), pour l'identification par plaque.

Puis redéployer.
