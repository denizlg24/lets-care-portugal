"use client";

import { type Editor, useEditorState } from "@tiptap/react";
import {
  BoldIcon,
  ChevronDownIcon,
  Code2Icon,
  ImageIcon,
  ItalicIcon,
  Link2Icon,
  ListIcon,
  ListOrderedIcon,
  MinusIcon,
  PilcrowIcon,
  PlusIcon,
  QuoteIcon,
  Redo2Icon,
  StrikethroughIcon,
  TableIcon,
  UnderlineIcon,
  Undo2Icon,
} from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Toggle } from "@/components/ui/toggle";
import { cn } from "@/lib/utils";

/** Friendly, non-technical block-style labels (Word-like, not "H1/H2/H3"). */
const BLOCK_STYLES = [
  { id: "paragraph", label: "Texto normal", hint: "Parágrafo" },
  { id: "h1", label: "Título", hint: "Maior" },
  { id: "h2", label: "Subtítulo", hint: "Médio" },
  { id: "h3", label: "Sub-subtítulo", hint: "Menor" },
  { id: "quote", label: "Citação", hint: "Destaque" },
  { id: "code", label: "Bloco de código", hint: "Monoespaçado" },
] as const;

type BlockStyleId = (typeof BLOCK_STYLES)[number]["id"];

function ToolbarToggle({
  pressed,
  onPressedChange,
  label,
  children,
}: {
  pressed: boolean;
  onPressedChange: () => void;
  label: string;
  children: ReactNode;
}) {
  return (
    <Toggle
      size="sm"
      aria-label={label}
      title={label}
      pressed={pressed}
      // Keep the editor selection: don't let the button steal focus on press.
      onMouseDown={(e) => e.preventDefault()}
      onPressedChange={onPressedChange}
    >
      {children}
    </Toggle>
  );
}

function ToolbarDivider() {
  return <Separator orientation="vertical" className="mx-1 h-6 self-center" />;
}

export function EditorToolbar({
  editor,
  className,
  ...props
}: { editor: Editor } & ComponentProps<"div">) {
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      isBold: e.isActive("bold"),
      isItalic: e.isActive("italic"),
      isUnderline: e.isActive("underline"),
      isStrike: e.isActive("strike"),
      isBullet: e.isActive("bulletList"),
      isOrdered: e.isActive("orderedList"),
      blockStyle: (e.isActive("heading", { level: 1 })
        ? "h1"
        : e.isActive("heading", { level: 2 })
          ? "h2"
          : e.isActive("heading", { level: 3 })
            ? "h3"
            : e.isActive("blockquote")
              ? "quote"
              : e.isActive("codeBlock")
                ? "code"
                : "paragraph") as BlockStyleId,
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  });

  const applyBlockStyle = (id: BlockStyleId) => {
    const chain = editor.chain().focus();
    switch (id) {
      case "h1":
        chain.setHeading({ level: 1 }).run();
        break;
      case "h2":
        chain.setHeading({ level: 2 }).run();
        break;
      case "h3":
        chain.setHeading({ level: 3 }).run();
        break;
      case "quote":
        chain.toggleBlockquote().run();
        break;
      case "code":
        chain.toggleCodeBlock().run();
        break;
      default:
        chain.setParagraph().run();
    }
  };

  const promptLink = () => {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Endereço do link (deixe vazio para remover)", prev ?? "");
    if (url === null) return;
    const chain = editor.chain().focus().extendMarkRange("link");
    if (url === "") chain.unsetLink().run();
    else chain.setLink({ href: url }).run();
  };

  const promptImage = () => {
    const url = window.prompt("Endereço da imagem (URL)");
    if (!url) return;
    const alt = window.prompt("Descrição da imagem (opcional)") ?? "";
    editor.chain().focus().setImage({ src: url, alt }).run();
  };

  const currentStyle = BLOCK_STYLES.find((s) => s.id === state.blockStyle) ?? BLOCK_STYLES[0];

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-0.5 rounded-t-lg border-b bg-background px-2 py-1.5",
        className,
      )}
      {...props}
    >
      {/* Paragraph style — the prominent Word-like dropdown. */}
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="sm" className="w-40 justify-between font-normal">
              <span className="truncate">{currentStyle.label}</span>
              <ChevronDownIcon className="opacity-60" />
            </Button>
          }
        />
        <DropdownMenuContent align="start" className="w-56">
          {BLOCK_STYLES.map((s) => (
            <DropdownMenuItem
              key={s.id}
              onClick={() => applyBlockStyle(s.id)}
              className={cn(
                "flex items-center justify-between",
                state.blockStyle === s.id && "bg-muted",
              )}
            >
              <span
                className={cn(
                  s.id === "h1" && "text-lg font-bold",
                  s.id === "h2" && "text-base font-semibold",
                  s.id === "h3" && "text-sm font-semibold",
                  s.id === "quote" && "italic text-muted-foreground",
                  s.id === "code" && "font-mono text-sm",
                )}
              >
                {s.label}
              </span>
              <span className="text-xs text-muted-foreground">{s.hint}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <ToolbarDivider />

      {/* Inline formatting */}
      <ToolbarToggle
        label="Negrito"
        pressed={state.isBold}
        onPressedChange={() => editor.chain().focus().toggleBold().run()}
      >
        <BoldIcon />
      </ToolbarToggle>
      <ToolbarToggle
        label="Itálico"
        pressed={state.isItalic}
        onPressedChange={() => editor.chain().focus().toggleItalic().run()}
      >
        <ItalicIcon />
      </ToolbarToggle>
      <ToolbarToggle
        label="Sublinhado"
        pressed={state.isUnderline}
        onPressedChange={() => editor.chain().focus().toggleUnderline().run()}
      >
        <UnderlineIcon />
      </ToolbarToggle>
      <ToolbarToggle
        label="Rasurado"
        pressed={state.isStrike}
        onPressedChange={() => editor.chain().focus().toggleStrike().run()}
      >
        <StrikethroughIcon />
      </ToolbarToggle>

      <ToolbarDivider />

      {/* Lists */}
      <ToolbarToggle
        label="Lista com marcadores"
        pressed={state.isBullet}
        onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
      >
        <ListIcon />
      </ToolbarToggle>
      <ToolbarToggle
        label="Lista numerada"
        pressed={state.isOrdered}
        onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrderedIcon />
      </ToolbarToggle>

      <ToolbarDivider />

      {/* Insert — Word-like "Inserir" menu. */}
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="sm" className="font-normal">
              <PlusIcon />
              Inserir
              <ChevronDownIcon className="opacity-60" />
            </Button>
          }
        />
        <DropdownMenuContent align="start" className="w-52">
          <DropdownMenuItem onClick={promptLink}>
            <Link2Icon />
            Link
          </DropdownMenuItem>
          <DropdownMenuItem onClick={promptImage}>
            <ImageIcon />
            Imagem
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() =>
              editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
            }
          >
            <TableIcon />
            Tabela
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => editor.chain().focus().setHorizontalRule().run()}>
            <MinusIcon />
            Separador
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.chain().focus().toggleBlockquote().run()}>
            <QuoteIcon />
            Citação
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
            <Code2Icon />
            Bloco de código
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.chain().focus().setParagraph().run()}>
            <PilcrowIcon />
            Texto normal
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="ml-auto flex items-center gap-0.5">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Desfazer"
          title="Desfazer"
          disabled={!state.canUndo}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().undo().run()}
        >
          <Undo2Icon />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Refazer"
          title="Refazer"
          disabled={!state.canRedo}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().redo().run()}
        >
          <Redo2Icon />
        </Button>
      </div>
    </div>
  );
}
