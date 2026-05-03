import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import { extractApiErrorMessage } from "../../services/api";
import { resetPassword, validatePasswordStrength } from "../../services/authService";

interface ResetPasswordFormProps {
  token: string | null;
}

interface ResetPasswordErrors {
  password?: string;
  confirmPassword?: string;
  form?: string;
}

function validate(password: string, confirmPassword: string): ResetPasswordErrors {
  const errors: ResetPasswordErrors = {};
  const passwordError = validatePasswordStrength(password);

  if (passwordError) {
    errors.password = passwordError;
  }

  if (!confirmPassword.trim()) {
    errors.confirmPassword = "Please confirm your new password";
  } else if (password !== confirmPassword) {
    errors.confirmPassword = "Passwords do not match";
  }

  return errors;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<ResetPasswordErrors>(
    token ? {} : { form: "This password reset link is missing a token. Request a new email." },
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!isSuccess) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      navigate("/?reset=success", { replace: true });
    }, 1500);

    return () => window.clearTimeout(timeoutId);
  }, [isSuccess, navigate]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token) {
      setErrors({
        form: "This password reset link is missing a token. Request a new email.",
      });
      return;
    }

    const nextErrors = validate(password, confirmPassword);

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      await resetPassword(token, password);
      setIsSuccess(true);
    } catch (error) {
      setErrors({
        form: extractApiErrorMessage(
          error,
          "We couldn't reset your password. Request a new reset link and try again.",
        ),
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isSuccess) {
    return (
      <div aria-live="polite" className="form-success" role="status">
        Password updated. Redirecting you to sign in...
      </div>
    );
  }

  return (
    <form className="auth-form" noValidate onSubmit={handleSubmit}>
      <label className="field">
        <span>New password</span>
        <input
          aria-invalid={errors.password ? "true" : "false"}
          autoComplete="new-password"
          name="password"
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Use at least 8 characters, upper and lower case, and a number"
          type="password"
          value={password}
        />
        {errors.password ? <span className="field-error">{errors.password}</span> : null}
      </label>

      <label className="field">
        <span>Confirm new password</span>
        <input
          aria-invalid={errors.confirmPassword ? "true" : "false"}
          autoComplete="new-password"
          name="confirmPassword"
          onChange={(event) => setConfirmPassword(event.target.value)}
          placeholder="Repeat your new password"
          type="password"
          value={confirmPassword}
        />
        {errors.confirmPassword ? (
          <span className="field-error">{errors.confirmPassword}</span>
        ) : null}
      </label>

      {errors.form ? (
        <div aria-live="assertive" className="form-error" role="alert">
          {errors.form}
        </div>
      ) : null}

      <button className="primary-button" disabled={isSubmitting || !token} type="submit">
        {isSubmitting ? "Resetting password..." : "Reset password"}
      </button>
    </form>
  );
}
