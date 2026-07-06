# Changements a tester

## En attente

- Configuration Supabase : verifier que le schema `supabase/schema.sql` s'execute dans un projet Supabase neuf, puis creer le profil administrateur.
- Lecture publique : verifier que le site charge les voyages sans compte et ne montre pas les reservations, depenses, notes ni documents prives.
- Authentification : verifier la connexion email + mot de passe avec les variables `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`.
- Administration : verifier qu'un utilisateur connecte peut sauvegarder un voyage et des depenses depuis le panneau `Modifier`.
- Fallback local : verifier que le site reste utilisable sans variables Supabase.
- Edition UI : verifier que les boutons de session sont en haut a droite, que la deconnexion fonctionne, et que les boutons crayon ouvrent le panneau d'edition sur les blocs de donnees.
- Edition reservations/depenses : verifier l'ajout, la modification et la suppression depuis les formulaires UI, puis la sauvegarde Supabase.
- Depenses : verifier le filtre par voyage et le bilan par voyage quand `Tous les voyages` est selectionne.
