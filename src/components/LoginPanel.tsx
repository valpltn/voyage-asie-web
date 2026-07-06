import { FormEvent, useState } from "react";
import { isSupabaseConfigured } from "../lib/supabase";
import { signInWithPassword } from "../lib/travelRepository";

export function LoginPanel({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await signInWithPassword(email, password);
      onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Connexion impossible.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="auth-panel" aria-label="Connexion administrateur">
      <div>
        <h2>Connexion</h2>
        <button className="plain-btn" onClick={onClose} type="button">
          Fermer
        </button>
      </div>
      {!isSupabaseConfigured && (
        <p className="form-error">Configure VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY pour activer la connexion.</p>
      )}
      <form className="admin-form" onSubmit={handleSubmit}>
        <label>
          Email
          <input autoComplete="email" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} />
        </label>
        <label>
          Mot de passe
          <input
            autoComplete="current-password"
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
        </label>
        {error && <p className="form-error">{error}</p>}
        <button className="primary-btn" disabled={!isSupabaseConfigured || isSubmitting} type="submit">
          {isSubmitting ? "Connexion..." : "Se connecter"}
        </button>
      </form>
    </section>
  );
}
