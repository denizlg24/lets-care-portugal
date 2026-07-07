import { BlockMath, InlineMath } from "@tiptap/extension-mathematics";
import type { Node as PMNode } from "@tiptap/pm/model";
import { ReactNodeViewRenderer } from "@tiptap/react";
import katexPlugin from "@vscode/markdown-it-katex";
import type { MarkdownSerializerState } from "prosemirror-markdown";
import { BlockMathView, InlineMathView } from "./math-node-view";

/**
 * Gives the Mathematics nodes markdown fidelity through tiptap-markdown.
 *
 * Without this, the editor has no concept of math: `$$…$$` is treated as plain
 * text and tiptap-markdown escapes every backslash (`\int` → `\\int`), which
 * both corrupts the LaTeX and produces `\\` — a KaTeX display-mode newline
 * error. Here we serialize math nodes straight back to `$…$` / `$$…$$` with no
 * escaping, and teach tiptap-markdown's markdown-it instance to tokenize math
 * back into these nodes on load.
 */

/** Minimal shape of the markdown-it instance tiptap-markdown hands to us. */
type MarkdownItLike = {
  use: (plugin: unknown, ...opts: unknown[]) => MarkdownItLike;
  utils: { escapeHtml: (value: string) => string };
  renderer: {
    rules: Record<string, (tokens: Array<{ content: string }>, idx: number) => string>;
  };
  __mathSetup?: boolean;
};

/**
 * Register the `$`/`$$` tokenizer once on the shared markdown-it instance and
 * render math tokens to the exact `data-type`/`data-latex` markup the math
 * nodes' `parseHTML` recognises.
 */
function setupMarkdownItMath(markdownit: MarkdownItLike) {
  if (markdownit.__mathSetup) return;
  markdownit.__mathSetup = true;
  markdownit.use(katexPlugin);

  const esc = markdownit.utils.escapeHtml;
  const inline = (tokens: Array<{ content: string }>, idx: number) =>
    `<span data-type="inline-math" data-latex="${esc(tokens[idx].content)}"></span>`;
  const block = (tokens: Array<{ content: string }>, idx: number) =>
    `<div data-type="block-math" data-latex="${esc(tokens[idx].content)}"></div>`;

  markdownit.renderer.rules.math_inline = inline;
  markdownit.renderer.rules.math_block = block;
  markdownit.renderer.rules.math_inline_block = block;
  markdownit.renderer.rules.math_inline_bare_block = block;
}

const getLatex = (node: PMNode): string => String(node.attrs.latex ?? "").trim();

export const InlineMathMarkdown = InlineMath.extend({
  addNodeView() {
    return ReactNodeViewRenderer(InlineMathView);
  },
  addStorage() {
    return {
      ...this.parent?.(),
      markdown: {
        serialize(state: MarkdownSerializerState, node: PMNode) {
          state.write(`$${getLatex(node)}$`);
        },
        parse: { setup: setupMarkdownItMath },
      },
    };
  },
});

export const BlockMathMarkdown = BlockMath.extend({
  addNodeView() {
    return ReactNodeViewRenderer(BlockMathView);
  },
  addStorage() {
    return {
      ...this.parent?.(),
      markdown: {
        serialize(state: MarkdownSerializerState, node: PMNode) {
          state.write("$$\n");
          state.text(getLatex(node), false);
          state.ensureNewLine();
          state.write("$$");
          state.closeBlock(node);
        },
        parse: { setup: setupMarkdownItMath },
      },
    };
  },
});
