"use client";

import { Loader2, X } from "lucide-react";
import { type KeyboardEvent, useMemo, useState } from "react";
import { fetchWithTimeout } from "@/components/admin/fetch-with-timeout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAILS = 20;

interface NotificationEmailsManagerProps {
  initial: string[];
}

export function NotificationEmailsManager({ initial }: NotificationEmailsManagerProps) {
  const [saved, setSaved] = useState<string[]>(initial);
  const [emails, setEmails] = useState<string[]>(initial);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const dirty = useMemo(() => JSON.stringify(emails) !== JSON.stringify(saved), [emails, saved]);

  function addEmail(raw: string): void {
    const email = raw.trim().toLowerCase();
    if (!email) return;
    if (!EMAIL_PATTERN.test(email)) {
      setError(`“${raw.trim()}” não é um email válido.`);
      return;
    }
    if (emails.includes(email)) {
      setDraft("");
      return;
    }
    if (emails.length >= MAX_EMAILS) {
      setError(`No máximo ${MAX_EMAILS} endereços.`);
      return;
    }
    setError(null);
    setSuccess(false);
    setEmails((prev) => [...prev, email]);
    setDraft("");
  }

  function removeEmail(email: string): void {
    setSuccess(false);
    setEmails((prev) => prev.filter((item) => item !== email));
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addEmail(draft);
    } else if (event.key === "Backspace" && draft === "" && emails.length > 0) {
      removeEmail(emails[emails.length - 1]);
    }
  }

  async function handleSave(): Promise<void> {
    setError(null);
    setSuccess(false);
    setSaving(true);
    try {
      const response = await fetchWithTimeout("/api/admin/contact-notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationEmails: emails }),
      });
      if (!response.ok) {
        setError("Não foi possível guardar as alterações.");
        return;
      }
      const data: { notificationEmails?: string[] } = await response.json();
      const next = data.notificationEmails ?? emails;
      setEmails(next);
      setSaved(next);
      setSuccess(true);
    } catch {
      setError("Não foi possível guardar as alterações.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="max-w-2xl space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Notificações de contactos</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Endereços que recebem um email sempre que chega um novo contacto. Escreva um email e prima
          Enter para adicionar.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notification-email">Emails de notificação</Label>
        {emails.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {emails.map((email) => (
              <Badge key={email} variant="secondary" className="h-6 pr-1 text-xs">
                {email}
                <button
                  type="button"
                  onClick={() => removeEmail(email)}
                  aria-label={`Remover ${email}`}
                  className="ml-0.5 rounded-full p-0.5 transition-colors hover:bg-foreground/10"
                >
                  <X className="size-3" />
                </button>
              </Badge>
            ))}
          </div>
        ) : null}
        <Input
          id="notification-email"
          type="email"
          inputMode="email"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => addEmail(draft)}
          placeholder="nome@exemplo.pt"
        />
      </div>

      {error ? (
        <p className="border-l-2 border-destructive pl-3 text-sm leading-6 text-destructive">
          {error}
        </p>
      ) : null}

      <div className="flex items-center gap-3">
        <Button type="button" onClick={handleSave} disabled={saving || !dirty}>
          {saving ? <Loader2 data-icon="inline-start" className="animate-spin" /> : null}
          Guardar alterações
        </Button>
        {success && !dirty ? (
          <span className="text-sm text-muted-foreground">Alterações guardadas.</span>
        ) : null}
      </div>
    </section>
  );
}
