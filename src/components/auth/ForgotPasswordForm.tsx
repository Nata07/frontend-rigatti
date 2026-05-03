import { useState, type FormEvent } from "react";

import { extractApiErrorMessage } from "../../services/api";
import { forgotPassword } from "../../services/authService";

interface ForgotPasswordFormProps {
  onSuccess?: () => void;
}

interface ForgotPasswordErrors {
  email?: string;
  form?: string;
}

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validate(email: string): ForgotPasswordErrors {
  const errors: ForgotPasswordErrors = {};

  if (!email.trim()) {
    errors.email = "Email is required";
  } else if (!validateEmail(email)) {
    errors.email = "Enter a valid email address";
  }

  return errors;
}

export function ForgotPasswordForm({ onSuccess }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<ForgotPasswordErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validate(email);

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      await forgotPassword(email.trim());
      setSubmitted(true);
      onSuccess?.();
    } catch (error) {
      setErrors({
        form: extractApiErrorMessage(
          error,
          "We couldn't send the reset link. Please try again.",
        ),
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div aria-live="polite" className="form-success" role="status">
        Check your email for a password reset link. If the account exists, the email should arrive
        shortly.
      </div>
    );
  }

  return (
    <form className="auth-form" noValidate onSubmit={handleSubmit}>
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

      {errors.form ? (
        <div aria-live="assertive" className="form-error" role="alert">
          {errors.form}
        </div>
      ) : null}

      <button className="primary-button" disabled={isSubmitting} type="submit">
        {isSubmitting ? "Sending reset link..." : "Send reset link"}
      </button>
    </form>
  );
}
