# Installation Supabase

## 1. Projet

1. Creer un projet Supabase.
2. Activer Auth avec email + mot de passe.
3. Creer ton utilisateur administrateur dans Auth.
4. Copier l'UUID de cet utilisateur.

## 2. Base

1. Ouvrir le SQL editor Supabase.
2. Executer `supabase/schema.sql`.
3. Inserer ton profil administrateur :

```sql
insert into public.profiles (id, email, is_admin)
values ('TON-UUID-UTILISATEUR', 'ton-email@example.com', true);
```

## 3. Variables Vite

Creer `.env.local` sans le commiter :

```env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=ey...
```

Ne jamais mettre la cle `service_role` dans le projet frontend.

## 4. Import initial

Connecte-toi dans le site, ouvre le panneau `Modifier`, puis sauvegarde les voyages/depenses que tu veux pousser vers Supabase. La v1 utilise du JSON valide par Zod pour limiter les requetes et garder un schema simple.

## 5. Regles de securite

- Lecture publique : dossiers et voyages avec `is_public = true`.
- Lecture privee : depenses seulement pour le proprietaire connecte.
- Ecriture : uniquement si `auth.uid()` correspond a `owner_id`.
- Les documents prives ne doivent pas etre references par un voyage public.
