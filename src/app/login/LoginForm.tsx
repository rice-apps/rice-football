"use client";

import { useActionState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { logIn, type LogInState } from "@/lib/auth/actions";

const INITIAL_STATE: LogInState = { error: null, email: "" };

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(logIn, INITIAL_STATE);

  return (
    <form className="stacked-form" action={formAction}>
      <Input label="Email" name="email" type="email" autoComplete="username" defaultValue={state.email} required />
      <Input label="Password" name="password" type="password" autoComplete="current-password" required />

      {state.error && (
        <div className="inline-actions" role="alert">
          <Badge variant="badge6">Not logged in</Badge>
          <span>{state.error}</span>
        </div>
      )}

      <div className="inline-actions">
        <Button type="submit" disabled={pending}>
          {pending ? "Logging in…" : "Log in"}
        </Button>
      </div>
    </form>
  );
}
