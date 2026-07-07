"use client";

import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MarkdownEditor } from "@/components/markdown/markdown-editor";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { BlogStatus } from "@/models/Blog";

interface BlogContentInitial {
  id: string;
  title: string;
  content: string;
  status: BlogStatus;
}

interface BlogContentEditorProps {
  initial?: BlogContentInitial;
}

/** Uploads a picked image to the storage bucket and returns its public URL. */
async function uploadImage(file: File): Promise<string> {
  const body = new FormData();
  body.append("file", file);
  const response = await fetch("/api/admin/upload", { method: "POST", body });
  if (!response.ok) throw new Error("upload failed");
  const data = (await response.json()) as { url: string };
  return data.url;
}

type SaveState = "idle" | "saving" | "saved";

export function BlogContentEditor({ initial }: BlogContentEditorProps) {
  const router = useRouter();
  const [id, setId] = useState<string | null>(initial?.id ?? null);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [error, setError] = useState<string | null>(null);

  // Content saves never change status; a published post should read "Guardar
  // alterações", not "Guardar rascunho".
  const isPublished = initial?.status === "published";
  const saveLabel = isPublished ? "Guardar alterações" : "Guardar rascunho";
  const savedLabel = isPublished ? "Alterações guardadas" : "Rascunho guardado";

  function markDirty() {
    if (saveState !== "idle") setSaveState("idle");
  }

  /** Creates the draft (first save) or updates it. Returns the post id. */
  async function persist(): Promise<string | null> {
    if (!title.trim()) {
      setError("Escreva um título antes de guardar.");
      return null;
    }
    setError(null);
    setSaveState("saving");

    try {
      let postId = id;
      if (postId) {
        const response = await fetch(`/api/admin/blogs/${postId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: title.trim(), content }),
        });
        if (!response.ok) throw new Error("save failed");
      } else {
        const response = await fetch("/api/admin/blogs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: title.trim(), content, status: "draft" }),
        });
        if (!response.ok) throw new Error("save failed");
        const data = (await response.json()) as { blog: { _id: string } };
        postId = data.blog._id;
        setId(postId);
        // Keep the writing context on refresh without a remount/flicker.
        window.history.replaceState(null, "", `/admin/write/${postId}`);
      }
      setSaveState("saved");
      return postId;
    } catch {
      setError("Não foi possível guardar. Tente novamente.");
      setSaveState("idle");
      return null;
    }
  }

  async function handleContinue() {
    const postId = await persist();
    if (postId) router.push(`/admin/blogs/${postId}`);
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
            href="/admin/blogs"
          >
            <ArrowLeft data-icon="inline-start" />
            Sair
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
              {saveState === "saving" ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />A guardar…
                </>
              ) : saveState === "saved" ? (
                <>
                  <Check className="size-3.5 text-accent" />
                  {savedLabel}
                </>
              ) : null}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={saveState === "saving"}
              onClick={persist}
            >
              {saveLabel}
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={saveState === "saving"}
              onClick={handleContinue}
            >
              Detalhes
              <ArrowRight data-icon="inline-end" />
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
        {error ? (
          <p className="mb-4 border-l-2 border-destructive pl-3 text-sm leading-6 text-destructive">
            {error}
          </p>
        ) : null}

        <input
          value={title}
          onChange={(event) => {
            setTitle(event.target.value);
            markDirty();
          }}
          placeholder="Título do artigo"
          maxLength={300}
          aria-label="Título"
          className="w-full bg-transparent text-3xl font-semibold leading-tight tracking-tight text-foreground outline-none placeholder:text-muted-foreground/50 sm:text-4xl"
        />

        <div className="mt-6">
          <MarkdownEditor
            seamless
            value={content}
            onChange={(next) => {
              setContent(next);
              markDirty();
            }}
            onImageUpload={uploadImage}
            placeholder="Comece a escrever o seu artigo…"
          />
        </div>
      </div>
    </div>
  );
}
