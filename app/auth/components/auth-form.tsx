"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { readerAuthClient } from "@/lib/reader-auth/client";

type AuthView = "sign-in" | "sign-up" | "forgot-password" | "reset-password";

interface AuthFormProps {
  view: AuthView;
  token?: string;
  invalidToken?: boolean;
}

const viewCopy: Record<AuthView, { title: string; description: string }> = {
  "sign-in": {
    title: "Welcome back",
    description: "Sign in to continue reading the journal.",
  },
  "sign-up": {
    title: "Create your reader account",
    description: "Join the journal to read articles and share your thoughts.",
  },
  "forgot-password": {
    title: "Reset your password",
    description: "We’ll email you a secure link to choose a new password.",
  },
  "reset-password": {
    title: "Choose a new password",
    description: "Use at least 8 characters for your new password.",
  },
};

function Spinner() {
  return <span className="loading-spinner" aria-hidden="true" />;
}

export function AuthForm({ view, token, invalidToken = false }: AuthFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const copy = viewCopy[view];

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (view === "reset-password" && password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    if (view === "reset-password" && !token) {
      setError("This reset link is invalid or has expired. Request a new one.");
      return;
    }

    setPending(true);
    try {
      if (view === "sign-in") {
        const result = await readerAuthClient.signIn.email({ email, password });
        if (result.error) {
          throw new Error(result.error.message || "Could not sign in.");
        }
        router.replace("/");
        router.refresh();
      } else if (view === "sign-up") {
        const result = await readerAuthClient.signUp.email({
          name: name.trim(),
          email,
          password,
        });
        if (result.error) {
          throw new Error(result.error.message || "Could not create your account.");
        }
        router.replace("/");
        router.refresh();
      } else if (view === "forgot-password") {
        const result = await readerAuthClient.requestPasswordReset({
          email,
          redirectTo: `${window.location.origin}/auth/reset-password`,
        });
        if (result.error) {
          throw new Error(result.error.message || "Could not request a password reset.");
        }
        setMessage(
          "If an account exists for that email, a password reset link is on its way.",
        );
      } else {
        const result = await readerAuthClient.resetPassword({
          newPassword: password,
          token: token!,
        });
        if (result.error) {
          throw new Error(result.error.message || "Could not reset your password.");
        }
        setMessage("Your password has been reset. You can now sign in.");
        setPassword("");
        setConfirmPassword("");
      }
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Something went wrong. Please try again.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="auth-heading">
        <Link className="logo" href="/" aria-label="Mowarson Developer Journal">
          Mowarson<span>Developer</span>
        </Link>
        <p className="eyebrow"><span className="eyebrow-dot" /> Reader account</p>
        <h1 id="auth-heading">{copy.title}</h1>
        <p className="auth-description">{copy.description}</p>

        {invalidToken && token && (
          <p className="auth-alert is-error" role="alert">
            This reset link is invalid or has expired. Request a new one below.
          </p>
        )}

        {view === "reset-password" && !token ? (
          <p className="auth-alert is-error" role="alert">
            {invalidToken
              ? "This reset link is invalid or has expired. Request a new one below."
              : "A password reset link is required. Request a new one below."}
          </p>
        ) : (
          <form className="auth-form" onSubmit={submit} aria-busy={pending}>
            {view === "sign-up" && (
              <label>
                Name
                <input
                  type="text"
                  name="name"
                  autoComplete="name"
                  maxLength={80}
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </label>
            )}

            {(view === "sign-in" ||
              view === "sign-up" ||
              view === "forgot-password") && (
              <label>
                Email address
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </label>
            )}

            {(view === "sign-in" ||
              view === "sign-up" ||
              view === "reset-password") && (
              <label>
                {view === "reset-password" ? "New password" : "Password"}
                <input
                  type="password"
                  name="password"
                  autoComplete={view === "sign-in" ? "current-password" : "new-password"}
                  minLength={8}
                  maxLength={128}
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </label>
            )}

            {view === "reset-password" && (
              <label>
                Confirm new password
                <input
                  type="password"
                  name="confirm-password"
                  autoComplete="new-password"
                  minLength={8}
                  maxLength={128}
                  required
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                />
              </label>
            )}

            {error && <p className="auth-alert is-error" role="alert">{error}</p>}
            {message && <p className="auth-alert is-success" role="status">{message}</p>}

            <button className="button auth-submit" type="submit" disabled={pending}>
              {pending && <Spinner />}
              {pending
                ? "Please wait…"
                : view === "sign-in"
                  ? "Sign in"
                  : view === "sign-up"
                    ? "Create account"
                    : view === "forgot-password"
                      ? "Send reset link"
                      : "Reset password"}
            </button>
          </form>
        )}

        <nav className="auth-links" aria-label="Account options">
          {view === "sign-in" && (
            <>
              <Link href="/auth/forgot-password">Forgot password?</Link>
              <span>New here? <Link href="/auth/sign-up">Create an account</Link></span>
            </>
          )}
          {view === "sign-up" && (
            <span>Already have an account? <Link href="/auth/sign-in">Sign in</Link></span>
          )}
          {view === "forgot-password" && (
            <Link href="/auth/sign-in">Back to sign in</Link>
          )}
          {view === "reset-password" && (
            <Link href="/auth/sign-in">Back to sign in</Link>
          )}
        </nav>
      </section>
    </main>
  );
}
