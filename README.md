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

## Consignes de test

- Ne pas lancer les tests automatiquement apres chaque modification.
- Les tests sont decides et executes uniquement dans la conversation en cours.
- Le comportement de test a appliquer est decrit dans `docs/comportement-tests-web.md`.
- Pour chaque changement, choisir un test proportionne au risque : ni trop lourd pour une modification mineure, ni trop leger pour une modification qui touche un parcours utilisateur, des donnees ou une validation.
- Apres chaque modification, noter ce qui doit etre teste dans `docs/changements-a-tester.md`.
- Une fois le test effectue, vider `docs/changements-a-tester.md` et recopier la modification testee dans `docs/archive-changements-testes.md` avec le test realise et le resultat.

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
