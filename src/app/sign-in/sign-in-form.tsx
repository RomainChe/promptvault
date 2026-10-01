"use client";

import { useActionState } from "react";
import { sendMagicLink } from "@/lib/identity/actions";

export function SignInForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(sendMagicLink, { status: "idle" });
  const invalid = state.status === "invalid";

  if (state.status === "sent") {
    return (
      <p role="status" className="rounded-lg border border-border bg-surface-2 p-4">
        <strong>Check your inbox.</strong> We sent a sign-in link to{" "}
        <span className="font-semibold">{state.email}</span>. It expires in one hour.
      </p>
    );
  }

  return (
    <form action={action} noValidate className="flex flex-col gap-3">
      <input type="hidden" name="next" value={next} />
      <label htmlFor="email" className="text-sm font-semibold">
        Email
      </label>
      <input
        id="email"
        name="email"
        type="email"
        autoComplete="email"
        required
        defaultValue={state.email}
        aria-invalid={invalid}
        aria-describedby={invalid ? "email-error" : undefined}
        className="rounded-lg border border-border bg-surface px-4 py-3 aria-invalid:border-danger"
      />
      {invalid && (
        <p id="email-error" role="alert" className="text-sm font-medium text-danger">
          Enter a valid email address.
        </p>
      )}
      {state.status === "error" && (
        <p role="alert" className="text-sm font-medium text-danger">
          We couldn’t send the link. Wait a minute and try again.
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-accent px-5 py-3 font-semibold text-on-accent disabled:opacity-60"
      >
        {pending ? "Sending…" : "Send magic link"}
      </button>
    </form>
  );
}
