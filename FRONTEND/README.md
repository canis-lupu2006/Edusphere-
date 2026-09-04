# EduSphere — Frontend

Plateforme éducative Vue 3 + TypeScript + Vite + Firebase, conçue pour **EDU OS** (navigateur kiosque).

## Démarrage

```bash
cd FRONTEND
cp .env.example .env
# Remplir les clés Firebase dans .env
npm install
npm run dev
```

## Scripts

| Commande | Description |
|----------|-------------|
| `npm run dev` | Serveur de développement |
| `npm run typecheck` | Vérification TypeScript (`vue-tsc`) |
| `npm run build` | `vue-tsc` + build production |
| `npm run preview` | Prévisualiser le build |

## Déploiement Firebase Hosting

```bash
npm run build
firebase deploy --only hosting
```

## Auth EDU OS

L'OS lance : `https://edusphere.app/auto-login?token=<customToken>`

Le frontend appelle `signInWithCustomToken`, lit `users/{uid}.role`, puis redirige vers le dashboard.

## Rôles → routes

| Rôle        | Route        |
|-------------|--------------|
| eleve       | `/student`   |
| enseignant  | `/teacher`   |
| parent      | `/parent`    |
| admin       | `/admin`     |
| ministere   | `/ministere` |

## Cloud Functions utilisées

- `tutorAI({ message })`
- `analyzeAttempt({ attemptId })`
- `getTicketSummary({ classeId, courseId })`

## Types

Les modèles Firestore sont centralisés dans `src/types/models.ts`.
