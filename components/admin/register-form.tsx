"use client";

import { AlertCircle, CheckCircle2, Send } from "lucide-react";
import Link from "next/link";
import type { FormEvent } from "react";
import { useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function RegisterForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [requested, setRequested] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/admin/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          email: formData.get("email"),
          password: formData.get("password"),
        }),
      });

      if (!response.ok) {
        setError("Não foi possível pedir acesso. Verifique os campos e tente novamente.");
        return;
      }

      setRequested(true);
    } catch {
      setError("Não foi possível pedir acesso. Tente novamente.");
    } finally {
      setPending(false);
    }
  }

  if (requested) {
    return (
      <div className="space-y-5">
        <div className="border-y border-foreground/10 py-5">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-secondary" />
            <div className="space-y-1">
              <h2 className="text-base font-medium">Acesso de administração solicitado</h2>
              <p className="text-sm leading-6 text-muted-foreground">
                Um administrador principal tem de aprovar esta conta antes de ela poder entrar no
                painel de administração.
              </p>
            </div>
          </div>
        </div>
        <Link className={cn(buttonVariants({ variant: "outline" }), "w-full")} href="/admin/login">
          Voltar ao início de sessão
        </Link>
      </div>
    );
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="space-y-1.5">
        <Label className="text-sm font-medium" htmlFor="name">
          Nome
        </Label>
        <Input id="name" name="name" autoComplete="name" required minLength={2} maxLength={120} />
      </div>
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
          autoComplete="new-password"
          minLength={8}
          maxLength={128}
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
        <Send data-icon="inline-start" />
        {pending ? "A pedir acesso" : "Pedir acesso"}
      </Button>
    </form>
  );
}
