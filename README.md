# BrainTracker

Mini-SaaS pour suivre le trafic et les publicités des marques e-commerce.

## Lancement

1. Placez les extensions TrendTrack et SimilarWeb dézippées dans `./extensions/trendtrack` et `./extensions/similarweb`.
2. `docker-compose up` puis rendez-vous sur `http://localhost:3000` pour le front et `http://localhost:4000` pour l'API.

Les données sont stockées dans `backend/data.db`.

## Hébergement gratuit

Une solution simple pour mettre BrainTracker en ligne gratuitement consiste à utiliser **Fly.io** pour l'API et **Vercel** pour l'interface React.

### Backend sur Fly.io

1. Créez un compte sur [fly.io](https://fly.io) et installez `flyctl`.
2. Depuis le dossier `backend`, exécutez `fly launch --no-deploy` et répondez aux questions pour créer l'application.
3. Créez un volume persistant pour la base SQLite :

   ```bash
   fly volumes create data --size 1
   ```

4. Déployez ensuite le service :

   ```bash
   fly deploy --volume data:/app
   ```

L'API sera accessible via l'URL fournie par Fly.

### Frontend sur Vercel

1. Poussez ce dépôt sur GitHub.
2. Connectez-vous sur [Vercel](https://vercel.com) et importez le dépôt.
3. Dans les paramètres du projet, indiquez le chemin `frontend`, la commande de build `npm run build` et le dossier de sortie `dist`.

Vercel hébergera gratuitement le site statique et vous pourrez configurer la variable `VITE_API_URL` pour pointer vers l'API Fly.
