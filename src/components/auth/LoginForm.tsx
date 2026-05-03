import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { extractApiErrorMessage } from "../../services/api";
import { useAuth } from "../../contexts/useAuth";

interface LoginErrors {
  email?: string;
  password?: string;
  form?: string;
}

function validate(email: string, password: string): LoginErrors {
  const errors: LoginErrors = {};

  if (!email.trim()) {
    errors.email = "Email is required";
  }

  if (!password.trim()) {
    errors.password = "Password is required";
  }

  return errors;
}

export function LoginForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const params = new URLSearchParams(location.search);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<LoginErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validate(email, password);

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      await login(email.trim(), password);
      navigate((location.state as { from?: string } | null)?.from ?? "/dashboard", {
        replace: true,
      });
    } catch (error) {
      setErrors({
        form: extractApiErrorMessage(error, "Unable to sign in with these credentials"),
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="auth-form" noValidate onSubmit={handleSubmit}>
      {params.get("reset") === "success" ? (
        <div aria-live="polite" className="form-success" role="status">
          Password updated. Sign in with your new password.
        </div>
      ) : null}

      {params.get("verified") === "success" ? (
        <div aria-live="polite" className="form-success" role="status">
          Email verified. Sign in to continue to your dashboard.
        </div>
      ) : null}

      <label className="field">
        <span>Email</span>
        <input
          aria-invalid={errors.email ? "true" : "false"}
          autoComplete="email"
          name="email"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@company.com"
          type="email"
          value={email}
        />
        {errors.email ? <span className="field-error">{errors.email}</span> : null}
      </label>

      <label className="field">
        <span>Password</span>
        <input
          aria-invalid={errors.password ? "true" : "false"}
          autoComplete="current-password"
          name="password"
          onChange={(event) => setPassword(event.target.value)}
          placeholder="At least 8 characters"
          type="password"
          value={password}
        />
        {errors.password ? <span className="field-error">{errors.password}</span> : null}
      </label>

      {errors.form ? (
        <div aria-live="assertive" className="form-error" role="alert">
          {errors.form}
        </div>
      ) : null}

      <button className="primary-button" disabled={isSubmitting} type="submit">
        {isSubmitting ? "Signing in..." : "Sign in"}
      </button>

      <p className="auth-switch">
        <Link to="/forgot-password">Forgot password?</Link>
      </p>

      <p className="auth-switch">
        Need an account? <Link to="/register">Create one</Link>
      </p>
    </form>
  );
}
