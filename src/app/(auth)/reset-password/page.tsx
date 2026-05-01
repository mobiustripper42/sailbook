"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { updatePassword } from "../actions";
import { PASSWORD_MIN_LENGTH, PASSWORD_RULES_HELP } from "@/lib/auth/password-rules";

export default function ResetPasswordPage() {
  const [ready, setReady] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [state, action, pending] = useActionState(updatePassword, null);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    // PKCE flow (local Supabase and new cloud projects): Supabase redirects here
    // with ?code=... instead of #access_token=...&type=recovery. Exchange it
    // explicitly so the recovery session is established before the event fires.
    const code = new URLSearchParams(window.location.search).get("code");
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) {
          setTokenError("Your reset link has expired. Please request a new one.");
        } else {
          setReady(true);
          window.history.replaceState({}, "", "/reset-password");
        }
      });
    }

    // Implicit flow (older cloud projects): Supabase delivers the recovery token
    // as a hash fragment; the client SDK fires PASSWORD_RECOVERY automatically.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === "PASSWORD_RECOVERY") {
          setReady(true);
        } else if (event === "SIGNED_OUT") {
          setTokenError("Your reset link has expired. Please request a new one.");
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  if (tokenError) {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Link expired</CardTitle>
          <CardDescription>{tokenError}</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button
            className="w-full"
            onClick={() => router.push("/forgot-password")}
          >
            Request a new link
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (!ready) {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Reset password</CardTitle>
          <CardDescription>Verifying your reset link…</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Please wait.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Reset password</CardTitle>
        <CardDescription>Choose a new password for your account.</CardDescription>
      </CardHeader>
      <form action={action} noValidate>
        <CardContent className="space-y-4">
          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
          <div className="space-y-2">
            <Label htmlFor="password">New password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              minLength={PASSWORD_MIN_LENGTH}
              autoComplete="new-password"
            />
            <p className="text-xs text-muted-foreground">{PASSWORD_RULES_HELP}</p>
          </div>
        </CardContent>
        <CardFooter className="pt-4">
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Saving…" : "Set new password"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
