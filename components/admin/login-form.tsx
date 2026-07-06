"use client";

import { AlertCircle, LogIn } from "lucide-react";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/auth/sign-in/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.get("email"),
          password: formData.get("password"),
          rememberMe: true,
        }),
      });

      if (!response.ok) {
        setError("Credenciais inválidas ou acesso de administração indisponível.");
        return;
      }

      const sessionResponse = await fetch("/api/admin/session", { cache: "no-store" });
      if (!sessionResponse.ok) {
        await fetch("/api/auth/sign-out", { method: "POST" });
        setError("Esta conta ainda não foi aprovada para acesso de administração.");
        return;
      }

      router.replace("/admin");
      router.refresh();
    } catch {
      setError("Não foi possível iniciar sessão. Tente novamente.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="space-y-1.5">
        <Label className="text-sm font-medium" htmlFor="email">
          Email
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="admin@exemplo.pt"
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-sm font-medium" htmlFor="password">
          Palavra-passe
        </Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>
      {error ? (
        <p className="flex items-start gap-2 border-l-2 border-destructive pl-3 text-sm leading-6 text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </p>
      ) : null}
      <Button className="w-full" type="submit" disabled={pending}>
        <LogIn data-icon="inline-start" />
        {pending ? "A iniciar sessão" : "Iniciar sessão"}
      </Button>
    </form>
  );
}
