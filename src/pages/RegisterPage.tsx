import { RegisterForm } from "../components/auth/RegisterForm";

export function RegisterPage() {
  return (
    <main className="auth-shell">
      <section className="auth-panel auth-panel--hero">
        <span className="eyebrow">Fast onboarding</span>
        <h1>Create your company access in one pass.</h1>
        <p>
          New companies create an admin automatically. Existing companies add the user directly to
          the tenant and keep the same route structure.
        </p>
        <div className="hero-metrics">
          <div>
            <strong>One form</strong>
            <span>Name, email, password, and company identity in a single step</span>
          </div>
          <div>
            <strong>Email check</strong>
            <span>Registration sends a verification link before the workspace unlocks fully</span>
          </div>
        </div>
      </section>

      <section className="auth-panel auth-panel--form">
        <span className="eyebrow">Create account</span>
        <h2>Register</h2>
        <p className="auth-copy">
          Set your credentials, connect them to the right company, then verify your email to
          finish activation.
        </p>
        <RegisterForm />
      </section>
    </main>
  );
}
