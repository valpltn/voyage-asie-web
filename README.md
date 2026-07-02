# Voyage Mobilite

Application web de planification de voyages avec carte interactive, itineraire, reservations et documents.

## Stack

- Vite
- React
- TypeScript strict
- Leaflet
- Zod pour valider les donnees locales au chargement

## Commandes

```bash
npm install
npm run dev
npm run build
npm test
```

## Structure

- `src/data/` contient les voyages locaux versionnes.
- `src/components/` contient les vues React.
- `src/lib/` contient les types, validations et helpers.
- `src/styles/` contient les styles globaux.
- `docs/` contient les documents Markdown de voyage.
- `public/` est reserve aux assets statiques.

## Regles donnees

- Les identifiants sont en kebab-case.
- Les dates metier sont au format ISO `YYYY-MM-DD`.
- Les coordonnees sont validees avant rendu de la carte.
- Les composants ne doivent pas contenir de donnees de voyage codees en dur.
- Les couleurs applicatives sont centralisees dans `src/styles/global.css`.
- Les couleurs utilisees par TypeScript, comme les marqueurs et routes de carte, sont centralisees dans `src/lib/theme.ts`.

## Securite

Ne pas commiter de donnees sensibles : copies de passeport, billets complets, numeros de reservation, moyens de paiement, fichiers `.env`, dossiers `private/` ou `secrets/`.

Les documents actuels sont publics dans le cadre du prototype. Les pieces justificatives reelles doivent rester hors depot.
