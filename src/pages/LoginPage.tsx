import { LoginForm } from "../components/auth/LoginForm";

export function LoginPage() {
  return (
    <main className="auth-shell">
      <section className="auth-panel auth-panel--hero">
        <span className="eyebrow">Mini SaaS AI Agent</span>
        <h1>Tenant-safe commerce starts with a clear sign-in flow.</h1>
        <p>
          Access your company workspace, keep JWT auth local, and move straight into the shared
          dashboard once the session is valid.
        </p>
        <div className="hero-metrics">
          <div>
            <strong>JWT</strong>
            <span>Stored in localStorage and attached to each request</span>
          </div>
          <div>
            <strong>Roles</strong>
            <span>Admin and user personas land in the same protected workspace</span>
          </div>
        </div>
      </section>

      <section className="auth-panel auth-panel--form">
        <span className="eyebrow">Welcome back</span>
        <h2>Sign in</h2>
        <p className="auth-copy">Use your email and password to access the dashboard.</p>
        <LoginForm />
      </section>
    </main>
  );
}
