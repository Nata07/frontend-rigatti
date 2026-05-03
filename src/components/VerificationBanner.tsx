import axios from "axios";
import { useState } from "react";

import { resendVerification } from "../services/authService";
import { extractApiErrorMessage } from "../services/api";
import type { User } from "../types/auth";

interface VerificationBannerProps {
  user: User;
}

function getResendErrorMessage(error: unknown) {
  if (axios.isAxiosError(error) && error.response?.status === 429) {
    return "Too many verification emails requested. Please wait a moment before trying again.";
  }

  return extractApiErrorMessage(
    error,
    "We couldn't resend the verification email right now. Please try again.",
  );
}

export function VerificationBanner({ user }: VerificationBannerProps) {
  const [isSending, setIsSending] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: "success" | "error"; message: string } | null>(
    null,
  );

  if (user.verified) {
    return null;
  }

  async function handleResend() {
    setIsSending(true);
    setFeedback(null);

    try {
      const response = await resendVerification(user.email);
      setFeedback({
        tone: "success",
        message:
          response.message || "Verification email sent. Check your inbox for the new link.",
      });
    } catch (error) {
      setFeedback({
        tone: "error",
        message: getResendErrorMessage(error),
      });
    } finally {
      setIsSending(false);
    }
  }

  return (
    <section
      aria-labelledby="verification-banner-title"
      className="verification-banner"
      data-testid="verification-banner"
    >
      <div className="verification-banner__header">
        <div>
          <span className="card-label">Verification required</span>
          <h2 id="verification-banner-title">Verify your email to unlock the full workspace.</h2>
          <p>
            We sent a verification link to <strong>{user.email}</strong>. Until you confirm it,
            protected features stay limited.
          </p>
        </div>
      </div>

      <div className="verification-banner__actions">
        <button className="secondary-button" disabled={isSending} onClick={handleResend} type="button">
          {isSending ? "Sending email..." : "Resend Email"}
        </button>
      </div>

      {feedback ? (
        <p
          aria-live={feedback.tone === "error" ? "assertive" : "polite"}
          className={`verification-banner__feedback${
            feedback.tone === "error" ? " verification-banner__feedback--error" : ""
          }`}
          role={feedback.tone === "error" ? "alert" : "status"}
        >
          {feedback.message}
        </p>
      ) : null}
    </section>
  );
}
