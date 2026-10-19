# BK AUTO 51 – site vitrine

Site statique (HTML/CSS/JS, sans build) du garage BK AUTO 51 à Châlons-en-Champagne, prêt pour Vercel.

## Déployer sur Vercel
1. Sur vercel.com : **Add New → Project**, importer le dépôt `bk51`.
2. Framework preset : **Other**. Pas de build command, output directory : `.` (racine).
3. **Deploy**.


## Espace atelier (privé) : pièces par plaque
Page réservée au garage : `/atelier` (protégée par mot de passe, non visible des clients, non indexée).
Saisir une plaque → version exacte et données techniques → cocher les pièces → copier ou imprimer la liste.

Configuration dans Vercel → Settings → Environment Variables :
- `ATELIER_PASSWORD` : mot de passe de l'espace atelier (identifiant : n'importe lequel).
- `REGCHECK_USERNAME` : identifiant du compte https://www.regcheck.org.uk (payant à la requête), pour l'identification par plaque.

Puis redéployer.

## Demandes de devis par e-mail
Le formulaire envoie la demande via `api/devis.js` et le service Resend (gratuit jusqu'à 3 000 e-mails/mois).
1. Créer un compte sur https://resend.com avec l'adresse qui doit recevoir les devis.
2. Resend → API Keys → Create API Key.
3. Vercel → Settings → Environment Variables :
   - `RESEND_API_KEY` = la clé
   - `DEVIS_EMAIL` = l'adresse qui reçoit les devis (celle du compte Resend tant que le domaine n'est pas vérifié)
4. Redéployer.

Avec un domaine (ex. bkauto51.fr) : le vérifier dans Resend → Domains, puis ajouter
`DEVIS_FROM` = `BK AUTO 51 <devis@bkauto51.fr>` pour envoyer depuis votre domaine.
