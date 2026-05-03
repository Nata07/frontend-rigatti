import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";

import { extractApiErrorMessage } from "../../services/api";
import { useAuth } from "../../contexts/useAuth";

interface RegisterErrors {
  name?: string;
  email?: string;
  password?: string;
  companyName?: string;
  form?: string;
}

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validate(name: string, email: string, password: string, companyName: string): RegisterErrors {
  const errors: RegisterErrors = {};

  if (!name.trim()) {
    errors.name = "Name is required";
  }

  if (!email.trim()) {
    errors.email = "Email is required";
  } else if (!validateEmail(email)) {
    errors.email = "Enter a valid email address";
  }

  if (!password.trim()) {
    errors.password = "Password is required";
  } else if (password.trim().length < 8) {
    errors.password = "Password must contain at least 8 characters";
  }

  if (!companyName.trim()) {
    errors.companyName = "Company name is required";
  }

  return errors;
}

export function RegisterForm() {
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [errors, setErrors] = useState<RegisterErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validate(name, email, password, companyName);

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const trimmedEmail = email.trim();
      await register({
        name: name.trim(),
        email: trimmedEmail,
        password,
        companyName: companyName.trim(),
      });
      setSubmittedEmail(trimmedEmail);
    } catch (error) {
      setErrors({
        form: extractApiErrorMessage(error, "Unable to create your account"),
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submittedEmail) {
    return (
      <div aria-live="polite" className="form-success" role="status">
        <p className="form-success__title">Check your email to verify your account.</p>
        <p className="form-success__body">
          We sent a verification link to <strong>{submittedEmail}</strong>. Open it to activate
          your workspace access.
        </p>
        <p className="auth-switch">
          Already verified? <Link to="/">Go to sign in</Link>
        </p>
      </div>
    );
  }

  return (
    <form className="auth-form" noValidate onSubmit={handleSubmit}>
      <label className="field">
        <span>Name</span>
        <input
          autoComplete="name"
          name="name"
          onChange={(event) => setName(event.target.value)}
          placeholder="Ada Lovelace"
          type="text"
          value={name}
        />
        {errors.name ? <span className="field-error">{errors.name}</span> : null}
      </label>

      <label className="field">
        <span>Email</span>
        <input
          autoComplete="email"
          name="email"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="ada@company.com"
          type="email"
          value={email}
        />
        {errors.email ? <span className="field-error">{errors.email}</span> : null}
      </label>

      <label className="field">
        <span>Password</span>
        <input
          autoComplete="new-password"
          name="password"
          onChange={(event) => setPassword(event.target.value)}
          placeholder="At least 8 characters"
          type="password"
          value={password}
        />
        {errors.password ? <span className="field-error">{errors.password}</span> : null}
      </label>

      <label className="field">
        <span>Company name</span>
        <input
          autoComplete="organization"
          name="companyName"
          onChange={(event) => setCompanyName(event.target.value)}
          placeholder="Nova Commerce"
          type="text"
          value={companyName}
        />
        {errors.companyName ? <span className="field-error">{errors.companyName}</span> : null}
      </label>

      {errors.form ? <div className="form-error">{errors.form}</div> : null}

      <button className="primary-button" disabled={isSubmitting} type="submit">
        {isSubmitting ? "Creating account..." : "Create account"}
      </button>

      <p className="auth-switch">
        Already registered? <Link to="/">Back to login</Link>
      </p>
    </form>
  );
}
