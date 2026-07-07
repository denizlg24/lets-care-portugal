"use client";

import "katex/dist/katex.min.css";

import Image from "@tiptap/extension-image";
import { TableKit } from "@tiptap/extension-table";
import { Placeholder } from "@tiptap/extensions";
import type { Editor } from "@tiptap/react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { CodeIcon, PenLineIcon } from "lucide-react";
import { useState } from "react";
import { Markdown } from "tiptap-markdown";

import { cn } from "@/lib/utils";
import { EditorToolbar } from "./editor-toolbar";
import { BlockMathMarkdown, InlineMathMarkdown } from "./tiptap-math-markdown";

type EditorMode = "rich" | "raw";

/** tiptap-markdown augments editor.storage at runtime but not in the types. */
const getMarkdown = (editor: Editor): string =>
  (
    editor.storage as unknown as {
      markdown: { getMarkdown: () => string };
    }
  ).markdown.getMarkdown();

export type MarkdownEditorProps = {
  value: string;
  onChange: (markdown: string) => void;
  placeholder?: string;
  className?: string;
};

const markdownConfig = {
  html: true,
  tightLists: true,
  linkify: true,
  breaks: true,
  transformPastedText: true,
  transformCopiedText: true,
};

/**
 * The visual (WYSIWYG) half. Kept in its own component so that toggling to raw
 * mode unmounts it and toggling back remounts it fresh from the latest markdown
 * — that's our sync mechanism between the two modes, with no update loops.
 */
function RichTextEditor({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (markdown: string) => void;
  placeholder?: string;
}) {
  const editor = useEditor({
    // Required under Next SSR to avoid hydration mismatches.
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        link: {
          openOnClick: false,
          autolink: true,
          HTMLAttributes: { rel: "noopener noreferrer nofollow" },
        },
      }),
      Placeholder.configure({
        placeholder: placeholder ?? "Escreva o seu artigo…",
      }),
      Image.configure({ inline: false }),
      TableKit.configure({ table: { resizable: true } }),
      InlineMathMarkdown,
      BlockMathMarkdown,
      Markdown.configure(markdownConfig),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: "markdown-body px-6 py-5 min-h-80 max-w-none",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(getMarkdown(editor));
    },
  });

  return (
    <div>
      {editor ? <EditorToolbar editor={editor} /> : null}
      <EditorContent editor={editor} />
    </div>
  );
}

/**
 * Blog markdown editor with two modes:
 *  - "rich": WYSIWYG in-place editing with a Word-like toolbar, for non-technical
 *    authors. Renders content exactly as the published post looks.
 *  - "raw": plain markdown textarea, for people who want to type markdown directly.
 *
 * Both modes read/write the same markdown string via `value` / `onChange`.
 */
export function MarkdownEditor({ value, onChange, placeholder, className }: MarkdownEditorProps) {
  const [mode, setMode] = useState<EditorMode>("rich");

  return (
    <div className={cn("overflow-hidden rounded-lg border bg-card", className)}>
      <div className="flex items-center justify-between gap-2 border-b bg-muted/40 px-2 py-1.5">
        <span className="px-1 text-xs font-medium text-muted-foreground">
          {mode === "rich" ? "Edição visual" : "Markdown"}
        </span>
        <div className="flex items-center rounded-md border bg-background p-0.5">
          <ModeButton
            active={mode === "rich"}
            onClick={() => setMode("rich")}
            icon={<PenLineIcon />}
            label="Visual"
          />
          <ModeButton
            active={mode === "raw"}
            onClick={() => setMode("raw")}
            icon={<CodeIcon />}
            label="Markdown"
          />
        </div>
      </div>

      {mode === "rich" ? (
        <RichTextEditor value={value} onChange={onChange} placeholder={placeholder} />
      ) : (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? "Escreva em markdown…"}
          spellCheck={false}
          className="min-h-80 w-full resize-y bg-transparent px-6 py-5 font-mono text-sm leading-relaxed outline-none placeholder:text-muted-foreground"
        />
      )}
    </div>
  );
}

function ModeButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors [&_svg]:size-3.5",
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {icon}
      {label}
    </button>
  );
}
