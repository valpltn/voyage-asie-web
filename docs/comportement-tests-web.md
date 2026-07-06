# Comportement de test web

Ce fichier definit le comportement a suivre pour tester les modifications du projet.

## Principe

Les tests ne sont pas lances automatiquement apres une modification. Ils sont faits uniquement quand la conversation le demande ou quand une etape de verification est explicitement ouverte dans cette meme conversation.

L'agent agit comme un expert de test web : il evalue le risque du changement, choisit la verification adaptee, puis explique ce qui a ete teste.

## Choix du niveau de test

- Changement de texte, documentation ou contenu non rendu : verification par relecture ciblee.
- Changement CSS localise : verification visuelle du composant ou de la page concernee.
- Changement de composant React : test cible du composant ou verification manuelle du parcours impacte.
- Changement de donnees de voyage : validation des donnees et verification du rendu qui les consomme.
- Changement de schema, validation ou helper partage : test unitaire cible, puis verification du parcours qui depend de ce code si necessaire.
- Changement de navigation, carte, formulaire, checklist ou interaction utilisateur : verification navigateur du parcours principal concerne.
- Changement large ou transversal : combiner test unitaire cible, build si pertinent, et verification navigateur du parcours critique.

## Regles d'execution

- Ne pas executer toute la suite de tests si un test cible suffit.
- Ne pas se limiter a une relecture si le changement peut casser un comportement utilisateur.
- Preferer `npm test -- <motif>` pour un test unitaire cible quand Vitest couvre la zone.
- Utiliser `npm run build` seulement si le changement touche TypeScript, l'import de modules, la configuration Vite ou une surface transversale.
- Utiliser une verification navigateur quand le rendu, le responsive, les interactions ou la carte sont concernes.

## Suivi obligatoire

Apres chaque modification, ajouter une entree dans `docs/changements-a-tester.md` avec :

- la date ;
- les fichiers modifies ;
- le resume du changement ;
- le niveau de risque ;
- le test prevu ;
- le statut `A tester`.

Apres verification, deplacer l'entree dans `docs/archive-changements-testes.md`, ajouter le test execute et le resultat, puis remettre `docs/changements-a-tester.md` a son etat vide.
