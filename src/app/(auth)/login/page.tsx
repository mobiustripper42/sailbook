"use client";

import { Suspense, useActionState, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
import { login } from "../actions";
import { safeNextPath } from "@/lib/auth/safe-next";
import GoogleSignInButton from "@/components/auth/google-sign-in-button";
import DevLoginHelper from "@/components/dev-login-helper";

export default function LoginPage() {
  // useSearchParams() requires a Suspense boundary for static-render bailout.
  return (
    <Suspense>
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageContent() {
  const [state, action, pending] = useActionState(login, null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const searchParams = useSearchParams();
  const next = safeNextPath(searchParams.get("next")) ?? undefined;

  return (
    <div className="flex flex-col items-center w-full max-w-sm">
      <Card className="w-full max-w-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>SailBook</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </div>
        <Image
          src="/logo.png"
          alt="Simply Sailing"
          width={80}
          height={80}
          className="h-20 w-auto"
          priority
        />
      </CardHeader>
      <CardContent className="space-y-4 pb-0">
        <GoogleSignInButton next={next} />
        <div className="flex items-center gap-3 py-1">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">or</span>
          <div className="h-px flex-1 bg-border" />
        </div>
      </CardContent>
      <form action={action} noValidate>
        {next ? <input type="hidden" name="next" value={next} /> : null}
        <CardContent className="space-y-4">
          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                href="/forgot-password"
                className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 pt-4">
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Signing in…" : "Sign in"}
          </Button>
          <p className="text-sm text-muted-foreground text-center">
            No account?{" "}
            <Link
              href={next ? `/register?next=${next}` : "/register"}
              className="underline underline-offset-4 hover:text-foreground"
            >
              Register
            </Link>
          </p>
        </CardFooter>
      </form>
      </Card>
      <DevLoginHelper />
    </div>
  );
}
