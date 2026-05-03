import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { useAuth } from "../contexts/useAuth";
import { extractApiErrorMessage } from "../services/api";
import { verifyEmail } from "../services/authService";

export function VerifyEmailPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, markEmailVerified } = useAuth();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    token ? "loading" : "error",
  );
  const [message, setMessage] = useState(
    token
      ? "Verifying your email..."
      : "This verification link is missing a token. Request a new verification email.",
  );

  useEffect(() => {
    if (!token) {
      return;
    }

    let isActive = true;

    void (async () => {
      try {
        await verifyEmail(token);

        if (!isActive) {
          return;
        }

        markEmailVerified();
        setStatus("success");
        setMessage(
          isAuthenticated
            ? "Email verified. Redirecting you to the dashboard..."
            : "Email verified. Redirecting you to sign in...",
        );

        window.setTimeout(() => {
          if (!isActive) {
            return;
          }

          navigate(isAuthenticated ? "/dashboard" : "/?verified=success", { replace: true });
        }, 1500);
      } catch (error) {
        if (!isActive) {
          return;
        }

        setStatus("error");
        setMessage(
          extractApiErrorMessage(
            error,
            "We couldn't verify this email. Request a new verification link and try again.",
          ),
        );
      }
    })();

    return () => {
      isActive = false;
    };
  }, [isAuthenticated, markEmailVerified, navigate, token]);

  return (
    <main className="auth-shell">
      <section className="auth-panel auth-panel--hero">
        <span className="eyebrow">Account activation</span>
        <h1>One last confirmation secures the workspace behind this account.</h1>
        <p>
          Verification activates the email address attached to your tenant access and removes the
          limits applied to unverified sessions.
        </p>
        <div className="hero-metrics">
          <div>
            <strong>Single-use token</strong>
            <span>Expired or malformed links should be replaced with a fresh verification email</span>
          </div>
          <div>
            <strong>Protected access</strong>
            <span>Verified users regain the full dashboard experience immediately</span>
          </div>
        </div>
      </section>

      <section className="auth-panel auth-panel--form">
        <span className="eyebrow">Verify email</span>
        <h2>Email verification</h2>
        <p className="auth-copy">We are validating the token attached to this verification link.</p>

        {status === "loading" ? (
          <div aria-live="polite" className="form-success" role="status">
            {message}
          </div>
        ) : null}

        {status === "success" ? (
          <div aria-live="polite" className="form-success" role="status">
            {message}
          </div>
        ) : null}

        {status === "error" ? (
          <div aria-live="assertive" className="form-error" role="alert">
            {message}
          </div>
        ) : null}

        <p className="auth-switch">
          Need another email?{" "}
          <Link to={isAuthenticated ? "/dashboard" : "/"}>
            {isAuthenticated ? "Go back to the dashboard" : "Go to sign in"}
          </Link>
        </p>
      </section>
    </main>
  );
}
