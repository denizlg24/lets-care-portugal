"use client";

import type { ReactNodeViewProps } from "@tiptap/react";
import { NodeViewWrapper } from "@tiptap/react";
import katex from "katex";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * Math node views that show the rendered KaTeX by default but reveal the raw
 * LaTeX source in an editable field while the node is selected — so equations
 * can actually be edited instead of only ever displaying. Clicking a formula
 * selects its node (`selected`), which flips it into edit mode; clicking away
 * re-renders it.
 */

function useKatex(latex: string, displayMode: boolean, render: boolean) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!render || !ref.current) return;
    try {
      katex.render(latex, ref.current, {
        displayMode,
        throwOnError: false,
        strict: false,
      });
    } catch {
      ref.current.textContent = latex;
    }
  }, [latex, displayMode, render]);
  return ref;
}

function MathView({
  node,
  selected,
  editor,
  updateAttributes,
  block,
}: ReactNodeViewProps & { block: boolean }) {
  const latex = String(node.attrs.latex ?? "");
  const editing = selected && editor.isEditable;
  const [draft, setDraft] = useState(latex);
  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);
  const wasEditing = useRef(false);
  const commitRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const draftRef = useRef(draft);

  // On entering edit mode: seed the draft from the node and focus the field.
  useEffect(() => {
    if (editing && !wasEditing.current) {
      setDraft(latex);
      const el = inputRef.current;
      if (el) {
        el.focus();
        el.setSelectionRange(el.value.length, el.value.length);
      }
    }
    wasEditing.current = editing;
  }, [editing, latex]);

  const renderRef = useKatex(latex || "\\;", block, !editing);

  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  useEffect(() => {
    return () => {
      if (commitRef.current) clearTimeout(commitRef.current);
    };
  }, []);

  useEffect(() => {
    if (editing || !commitRef.current) return;

    clearTimeout(commitRef.current);
    commitRef.current = null;
    if (draftRef.current !== latex) {
      updateAttributes({ latex: draftRef.current });
    }
  }, [editing, latex, updateAttributes]);

  const onChange = (value: string) => {
    setDraft(value);
    draftRef.current = value;
    if (commitRef.current) clearTimeout(commitRef.current);
    commitRef.current = setTimeout(() => {
      updateAttributes({ latex: value });
      commitRef.current = null;
    }, 300);
  };

  const commonFieldProps = {
    value: draft,
    "aria-label": block ? "Equação LaTeX em bloco" : "Equação LaTeX",
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) =>
      onChange(e.target.value),
    // Keep keystrokes/clicks in the field, away from ProseMirror.
    onKeyDown: (e: React.KeyboardEvent) => e.stopPropagation(),
    onMouseDown: (e: React.MouseEvent) => e.stopPropagation(),
    spellCheck: false,
    placeholder: "LaTeX…",
  };

  return (
    <NodeViewWrapper
      as={block ? "div" : "span"}
      className={cn(
        "tiptap-math",
        block ? "tiptap-math--block" : "tiptap-math--inline",
        selected && "tiptap-math--selected",
      )}
    >
      {editing ? (
        block ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            rows={Math.max(1, draft.split("\n").length)}
            className="tiptap-math-input tiptap-math-input--block"
            {...commonFieldProps}
          />
        ) : (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            className="tiptap-math-input tiptap-math-input--inline"
            {...commonFieldProps}
          />
        )
      ) : (
        <span ref={renderRef} contentEditable={false} />
      )}
    </NodeViewWrapper>
  );
}

export function BlockMathView(props: ReactNodeViewProps) {
  return <MathView {...props} block />;
}

export function InlineMathView(props: ReactNodeViewProps) {
  return <MathView {...props} block={false} />;
}
