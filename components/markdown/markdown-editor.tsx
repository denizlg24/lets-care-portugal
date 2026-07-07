"use client";

import "katex/dist/katex.min.css";

import { TaskItem, TaskList } from "@tiptap/extension-list";
import { TableKit } from "@tiptap/extension-table";
import { Placeholder } from "@tiptap/extensions";
import type { Editor } from "@tiptap/react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { CodeIcon, PenLineIcon } from "lucide-react";
import type { KeyboardEvent, ReactNode } from "react";
import { useState } from "react";
import { Markdown } from "tiptap-markdown";

import { cn } from "@/lib/utils";
import { CaptionedImage } from "./captioned-image-extension";
import { EditorToolbar } from "./editor-toolbar";
import { IndentKeymap } from "./indent-keymap-extension";
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
  /**
   * Uploads a picked image file and resolves to its public URL. When provided,
   * the toolbar's "Imagem" action opens a file picker and uploads; otherwise it
   * falls back to prompting for a URL.
   */
  onImageUpload?: (file: File) => Promise<string>;
  /**
   * Frameless mode: drops the card border/background so the editor blends into
   * the page (used by the full-screen writing surface). The toolbar sticks to
   * the top instead of sitting inside a card.
   */
  seamless?: boolean;
};

const markdownConfig = {
  html: true,
  tightLists: true,
  linkify: true,
  breaks: true,
  transformPastedText: true,
  transformCopiedText: true,
};

const RAW_MARKDOWN_INDENT = "  ";

const getLineStart = (value: string, position: number) =>
  value.lastIndexOf("\n", Math.max(0, position - 1)) + 1;

const getOutdentLength = (line: string) => {
  if (line.startsWith("\t")) {
    return 1;
  }

  const leadingSpaces = line.match(/^ +/)?.[0].length ?? 0;
  return Math.min(RAW_MARKDOWN_INDENT.length, leadingSpaces);
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
  onImageUpload,
}: {
  value: string;
  onChange: (markdown: string) => void;
  placeholder?: string;
  onImageUpload?: (file: File) => Promise<string>;
}) {
  const editor = useEditor({
    // Required under Next SSR to avoid hydration mismatches.
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        codeBlock: {
          enableTabIndentation: true,
          tabSize: RAW_MARKDOWN_INDENT.length,
        },
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
      CaptionedImage.configure({ inline: false }),
      IndentKeymap,
      // Task lists (checkboxes). tiptap-markdown round-trips these to GFM
      // `- [ ]` / `- [x]`; without the nodes they degrade to escaped text.
      TaskList,
      TaskItem.configure({ nested: true }),
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
      {editor ? <EditorToolbar editor={editor} onImageUpload={onImageUpload} /> : null}
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
export function MarkdownEditor({
  value,
  onChange,
  placeholder,
  className,
  onImageUpload,
  seamless = false,
}: MarkdownEditorProps) {
  const [mode, setMode] = useState<EditorMode>("rich");

  const handleRawKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Tab") {
      return;
    }

    event.preventDefault();

    const textarea = event.currentTarget;
    const currentValue = textarea.value;
    const { selectionStart, selectionEnd } = textarea;

    if (selectionStart === selectionEnd) {
      if (event.shiftKey) {
        const lineStart = getLineStart(currentValue, selectionStart);
        const outdentLength = getOutdentLength(currentValue.slice(lineStart));

        if (outdentLength === 0) {
          return;
        }

        const nextValue =
          currentValue.slice(0, lineStart) + currentValue.slice(lineStart + outdentLength);
        const nextSelection = selectionStart - Math.min(outdentLength, selectionStart - lineStart);

        onChange(nextValue);
        requestAnimationFrame(() => {
          textarea.selectionStart = nextSelection;
          textarea.selectionEnd = nextSelection;
        });
        return;
      }

      const nextValue =
        currentValue.slice(0, selectionStart) +
        RAW_MARKDOWN_INDENT +
        currentValue.slice(selectionEnd);
      const nextSelection = selectionStart + RAW_MARKDOWN_INDENT.length;

      onChange(nextValue);
      requestAnimationFrame(() => {
        textarea.selectionStart = nextSelection;
        textarea.selectionEnd = nextSelection;
      });
      return;
    }

    const lineStart = getLineStart(currentValue, selectionStart);
    const lineEnd =
      selectionEnd > selectionStart && currentValue[selectionEnd - 1] === "\n"
        ? selectionEnd - 1
        : selectionEnd;
    const selectedBlock = currentValue.slice(lineStart, lineEnd);
    let firstLineDelta = 0;
    let totalDelta = 0;

    const replacement = selectedBlock
      .split("\n")
      .map((line, index) => {
        if (!event.shiftKey) {
          if (index === 0) {
            firstLineDelta = RAW_MARKDOWN_INDENT.length;
          }
          totalDelta += RAW_MARKDOWN_INDENT.length;
          return `${RAW_MARKDOWN_INDENT}${line}`;
        }

        const outdentLength = getOutdentLength(line);
        if (index === 0) {
          firstLineDelta = -outdentLength;
        }
        totalDelta -= outdentLength;
        return line.slice(outdentLength);
      })
      .join("\n");

    const nextValue = currentValue.slice(0, lineStart) + replacement + currentValue.slice(lineEnd);
    const nextSelectionStart = Math.max(lineStart, selectionStart + firstLineDelta);
    const nextSelectionEnd = Math.max(nextSelectionStart, selectionEnd + totalDelta);

    onChange(nextValue);
    requestAnimationFrame(() => {
      textarea.selectionStart = nextSelectionStart;
      textarea.selectionEnd = nextSelectionEnd;
    });
  };

  return (
    <div
      className={cn(
        seamless ? "bg-transparent" : "overflow-hidden rounded-lg border bg-card",
        className,
      )}
    >
      <div
        className={cn(
          "flex items-center justify-between gap-2 px-2 py-1.5",
          seamless
            ? "sticky top-0 z-10 border-b border-border/60 bg-background/90 backdrop-blur"
            : "border-b bg-muted/40",
        )}
      >
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
        <RichTextEditor
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          onImageUpload={onImageUpload}
        />
      ) : (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleRawKeyDown}
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
  icon: ReactNode;
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
