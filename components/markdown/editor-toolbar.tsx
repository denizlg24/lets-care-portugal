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
  ListIndentDecreaseIcon,
  ListIndentIncreaseIcon,
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
import type { ComponentProps, FormEvent, ReactNode } from "react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
type LinkRange = { from: number; to: number };

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
  onImageUpload,
  ...props
}: {
  editor: Editor;
  onImageUpload?: (file: File) => Promise<string>;
} & ComponentProps<"div">) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const linkRangeRef = useRef<LinkRange | null>(null);
  const [uploading, setUploading] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkHref, setLinkHref] = useState("");
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => {
      const { selection } = e.state;
      const selectedText = selection.empty
        ? ""
        : e.state.doc.textBetween(selection.from, selection.to, " ").trim();

      return {
        isBold: e.isActive("bold"),
        isItalic: e.isActive("italic"),
        isUnderline: e.isActive("underline"),
        isStrike: e.isActive("strike"),
        isBullet: e.isActive("bulletList"),
        isOrdered: e.isActive("orderedList"),
        canIndentList: e.can().sinkListItem("listItem"),
        canOutdentList: e.can().liftListItem("listItem"),
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
        hasTextSelection: selectedText.length > 0,
        canUndo: e.can().undo(),
        canRedo: e.can().redo(),
      };
    },
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

  // With an upload handler, "Imagem" opens a file picker and uploads to storage;
  // otherwise it falls back to pasting a URL by hand.
  const insertImage = () => {
    if (onImageUpload) {
      fileInputRef.current?.click();
      return;
    }
    const url = window.prompt("Endereço da imagem (URL)");
    if (!url) return;
    const alt = window.prompt("Descrição da imagem (opcional)") ?? "";
    editor.chain().focus().setImage({ src: url, alt, title: alt }).run();
  };

  const handleFilePicked = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Reset so picking the same file twice still fires onChange.
    event.target.value = "";
    if (!file || !onImageUpload) return;

    setUploading(true);
    try {
      const src = await onImageUpload(file);
      editor.chain().focus().setImage({ src, alt: "", title: "" }).run();
    } catch {
      window.alert("Não foi possível carregar a imagem. Tente novamente.");
    } finally {
      setUploading(false);
    }
  };

  const openLinkDialog = () => {
    if (!state.hasTextSelection) return;

    const { from, to } = editor.state.selection;
    linkRangeRef.current = { from, to };
    setLinkHref((editor.getAttributes("link").href as string | undefined) ?? "");
    setLinkDialogOpen(true);
  };

  const applyLink = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const range = linkRangeRef.current;
    const href = linkHref.trim();
    if (!range || !href) return;

    editor.chain().focus().setTextSelection(range).setLink({ href }).run();
    setLinkDialogOpen(false);
    linkRangeRef.current = null;
    setLinkHref("");
  };

  const closeLinkDialog = () => {
    setLinkDialogOpen(false);
    linkRangeRef.current = null;
    setLinkHref("");
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
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFilePicked}
      />

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
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Diminuir recuo"
        title="Diminuir recuo"
        disabled={!state.canOutdentList}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().liftListItem("listItem").run()}
      >
        <ListIndentDecreaseIcon />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Aumentar recuo"
        title="Aumentar recuo"
        disabled={!state.canIndentList}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().sinkListItem("listItem").run()}
      >
        <ListIndentIncreaseIcon />
      </Button>

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
          <DropdownMenuItem onClick={openLinkDialog} disabled={!state.hasTextSelection}>
            <Link2Icon />
            Link
          </DropdownMenuItem>
          <DropdownMenuItem onClick={insertImage} disabled={uploading}>
            <ImageIcon />
            {uploading ? "A carregar imagem…" : "Imagem"}
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

      <Dialog
        open={linkDialogOpen}
        onOpenChange={(open) => {
          setLinkDialogOpen(open);
          if (!open) {
            linkRangeRef.current = null;
            setLinkHref("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <form className="space-y-4" onSubmit={applyLink}>
            <DialogHeader>
              <DialogTitle>Adicionar link</DialogTitle>
              <DialogDescription>
                O link será aplicado ao texto selecionado no editor.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="markdown-editor-link-url">Endereço</Label>
              <Input
                id="markdown-editor-link-url"
                autoFocus
                inputMode="url"
                value={linkHref}
                onChange={(event) => setLinkHref(event.target.value)}
                placeholder="https://example.com"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeLinkDialog}>
                Cancelar
              </Button>
              <Button type="submit" disabled={!linkHref.trim()}>
                Aplicar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
