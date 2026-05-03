import { Link, useSearchParams } from "react-router-dom";

import { ResetPasswordForm } from "../components/auth/ResetPasswordForm";

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  return (
    <main className="auth-shell">
      <section className="auth-panel auth-panel--hero">
        <span className="eyebrow">Reset credentials</span>
        <h1>Choose a stronger password and get back into the workspace.</h1>
        <p>
          Passwords must be long enough to resist trivial guessing and include mixed character
          types before the reset is accepted.
        </p>
        <div className="hero-metrics">
          <div>
            <strong>Strength check</strong>
            <span>At least 8 characters, mixed case, and one number</span>
          </div>
          <div>
            <strong>One-time link</strong>
            <span>Expired or malformed tokens should be replaced with a fresh email</span>
          </div>
        </div>
      </section>

      <section className="auth-panel auth-panel--form">
        <span className="eyebrow">Set a new password</span>
        <h2>Reset password</h2>
        <p className="auth-copy">Enter a new password for the account tied to this reset link.</p>
        <ResetPasswordForm token={token} />
        <p className="auth-switch">
          Need another link? <Link to="/forgot-password">Request a new reset email</Link>
        </p>
      </section>
    </main>
  );
}
