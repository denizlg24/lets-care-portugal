"use client";

import { CheckCircle2, Loader2, Send, XCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type Status = "idle" | "loading" | "success" | "error";

interface FormValues {
  name: string;
  email: string;
  affiliation: string;
  position: string;
  subject: string;
  message: string;
}

type FormErrors = Partial<Record<keyof FormValues, string>>;

const EMPTY_VALUES: FormValues = {
  name: "",
  email: "",
  affiliation: "",
  position: "",
  subject: "",
  message: "",
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Underline-style fields: no box, just a bottom border that darkens on focus.
const inputClass =
  "h-10 rounded-none border-0 border-b border-border bg-transparent px-0 focus-visible:border-foreground focus-visible:ring-0 aria-invalid:ring-0 dark:bg-transparent";
const labelClass = "text-xs font-medium uppercase tracking-wider text-muted-foreground";

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {};
  if (!values.name.trim()) errors.name = "O nome é obrigatório";
  if (!EMAIL_PATTERN.test(values.email.trim())) errors.email = "É necessário um email válido";
  if (values.message.trim().length < 10) {
    errors.message = "A mensagem tem de ter pelo menos 10 caracteres";
  }
  return errors;
}

export function ContactForm() {
  const [values, setValues] = useState<FormValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<Status>("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [ticketId, setTicketId] = useState("");
  const [sentTo, setSentTo] = useState("");

  function update(field: keyof FormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationErrors = validate(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setStatus("loading");
    setStatusMessage("");
    setTicketId("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name.trim(),
          email: values.email.trim(),
          subject: values.subject.trim() || undefined,
          message: values.message.trim(),
          affiliation: values.affiliation.trim() || undefined,
          position: values.position.trim() || undefined,
        }),
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        setStatus("error");
        setStatusMessage(
          result?.error ?? "Não foi possível enviar a sua mensagem. Tente novamente mais tarde.",
        );
        return;
      }

      setSentTo(values.email.trim());
      setTicketId(result?.ticketId ?? "");
      setStatus("success");
      setValues(EMPTY_VALUES);
    } catch {
      setStatus("error");
      setStatusMessage("Não foi possível enviar a sua mensagem. Tente novamente mais tarde.");
    }
  }

  function handleSendAnother() {
    setStatus("idle");
    setStatusMessage("");
    setTicketId("");
  }

  if (status === "success" || status === "error") {
    return (
      <div
        className="flex min-h-100 w-full items-center justify-center"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6 text-center duration-700">
          {status === "success" ? (
            <>
              <CheckCircle2
                className="animate-in zoom-in mx-auto size-16 text-foreground duration-500"
                aria-hidden
              />
              <div className="space-y-3">
                <h3 className="text-2xl font-medium text-foreground">Recebemos a sua mensagem</h3>
                {ticketId ? (
                  <p className="text-sm text-foreground/60">
                    N.º do pedido:{" "}
                    <span className="font-mono font-semibold text-foreground/80">{ticketId}</span>
                  </p>
                ) : null}
                <p className="mx-auto max-w-md text-sm text-foreground/50">
                  Enviámos um email de confirmação para {sentTo}. Guarde o número do pedido para
                  qualquer seguimento.
                </p>
              </div>
              <Button onClick={handleSendAnother} variant="outline" className="mt-8">
                Enviar outra mensagem
              </Button>
            </>
          ) : (
            <>
              <XCircle
                className="animate-in zoom-in mx-auto size-16 text-destructive duration-500"
                aria-hidden
              />
              <div className="space-y-3">
                <h3 className="text-2xl font-medium text-foreground">Algo correu mal</h3>
                <p className="mx-auto max-w-md text-sm text-foreground/60">{statusMessage}</p>
              </div>
              <Button onClick={handleSendAnother} variant="outline" className="mt-8">
                Tentar novamente
              </Button>
            </>
          )}
        </div>
      </div>
    );
  }

  const submitting = status === "loading";

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-x-8 gap-y-8 sm:grid-cols-2">
      <Field className="relative sm:col-span-1">
        <FieldLabel htmlFor="contact-name" className={labelClass}>
          Nome *
        </FieldLabel>
        <Input
          id="contact-name"
          name="name"
          autoComplete="name"
          maxLength={120}
          value={values.name}
          onChange={(event) => update("name", event.target.value)}
          aria-invalid={Boolean(errors.name)}
          className={inputClass}
        />
        {errors.name ? <FieldError>{errors.name}</FieldError> : null}
      </Field>
      <Field className="relative sm:col-span-1">
        <FieldLabel htmlFor="contact-email" className={labelClass}>
          Email *
        </FieldLabel>
        <Input
          id="contact-email"
          name="email"
          type="email"
          autoComplete="email"
          maxLength={254}
          value={values.email}
          onChange={(event) => update("email", event.target.value)}
          aria-invalid={Boolean(errors.email)}
          className={inputClass}
        />
        {errors.email ? <FieldError>{errors.email}</FieldError> : null}
      </Field>
      <Field className="sm:col-span-1">
        <FieldLabel htmlFor="contact-affiliation" className={labelClass}>
          Instituição
        </FieldLabel>
        <Input
          id="contact-affiliation"
          name="affiliation"
          autoComplete="organization"
          maxLength={200}
          value={values.affiliation}
          onChange={(event) => update("affiliation", event.target.value)}
          className={inputClass}
        />
      </Field>
      <Field className="sm:col-span-1">
        <FieldLabel htmlFor="contact-position" className={labelClass}>
          Cargo
        </FieldLabel>
        <Input
          id="contact-position"
          name="position"
          autoComplete="organization-title"
          maxLength={120}
          value={values.position}
          onChange={(event) => update("position", event.target.value)}
          className={inputClass}
        />
      </Field>
      <Field className="sm:col-span-2">
        <FieldLabel htmlFor="contact-subject" className={labelClass}>
          Assunto
        </FieldLabel>
        <Input
          id="contact-subject"
          name="subject"
          maxLength={200}
          value={values.subject}
          onChange={(event) => update("subject", event.target.value)}
          className={inputClass}
        />
      </Field>
      <Field className="relative sm:col-span-2">
        <FieldLabel htmlFor="contact-message" className={labelClass}>
          Mensagem *
        </FieldLabel>
        <Textarea
          id="contact-message"
          name="message"
          maxLength={5000}
          value={values.message}
          onChange={(event) => update("message", event.target.value)}
          aria-invalid={Boolean(errors.message)}
          placeholder="Conte-nos como podemos ajudar — dúvidas, parcerias, participação no projeto…"
          className={cn(inputClass, "h-auto min-h-32 resize-none py-2")}
        />
        {errors.message ? <FieldError>{errors.message}</FieldError> : null}
      </Field>
      <Button type="submit" className="w-full sm:col-span-2" disabled={submitting}>
        {submitting ? "A enviar…" : "Enviar mensagem"}
        {submitting ? (
          <Loader2 className="animate-spin" data-icon="inline-end" />
        ) : (
          <Send data-icon="inline-end" />
        )}
      </Button>
      <p className="-mt-3 text-xs text-muted-foreground sm:col-span-2">
        Ao submeter este formulário, concorda com a nossa{" "}
        <Link href="/privacidade" className="underline underline-offset-2 hover:text-foreground">
          política de privacidade
        </Link>
        .
      </p>
      <p className="-mt-6 text-xs leading-relaxed text-muted-foreground sm:col-span-2">
        Depois de enviar, recebe um número de pedido e um email de confirmação para acompanhar
        facilmente qualquer seguimento.
      </p>
    </form>
  );
}
