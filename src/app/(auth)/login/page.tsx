"use client";

import { useActionState } from "react";
import Link from "next/link";
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
import DevLoginHelper from "@/components/dev-login-helper";

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, null);

  return (
    <div className="flex flex-col items-center w-full max-w-sm">
      <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>SailBook</CardTitle>
        <CardDescription>Sign in to your account</CardDescription>
      </CardHeader>
      <form action={action}>
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
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
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
              href="/register"
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
