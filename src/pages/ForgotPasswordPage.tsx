import { Link } from "react-router-dom";

import { ForgotPasswordForm } from "../components/auth/ForgotPasswordForm";

export function ForgotPasswordPage() {
  return (
    <main className="auth-shell">
      <section className="auth-panel auth-panel--hero">
        <span className="eyebrow">Password reset</span>
        <h1>Recover access without exposing whether an account exists.</h1>
        <p>
          Enter the email tied to your workspace and we will send a secure reset link if the
          account is registered.
        </p>
        <div className="hero-metrics">
          <div>
            <strong>15 minutes</strong>
            <span>Reset tokens expire quickly to reduce replay risk</span>
          </div>
          <div>
            <strong>Private flow</strong>
            <span>The response stays generic even when the email is unknown</span>
          </div>
        </div>
      </section>

      <section className="auth-panel auth-panel--form">
        <span className="eyebrow">Need a reset link?</span>
        <h2>Forgot password</h2>
        <p className="auth-copy">We will email a secure link so you can choose a new password.</p>
        <ForgotPasswordForm />
        <p className="auth-switch">
          Remembered it? <Link to="/">Back to login</Link>
        </p>
      </section>
    </main>
  );
}
