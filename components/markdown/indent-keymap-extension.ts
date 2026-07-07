import { Extension } from "@tiptap/core";

const INDENT = "  ";

export const IndentKeymap = Extension.create({
  name: "indentKeymap",
  priority: 1000,

  addKeyboardShortcuts() {
    return {
      Tab: () => {
        if (this.editor.isActive("codeBlock")) {
          return false;
        }

        if (this.editor.isActive("table")) {
          return false;
        }

        if (this.editor.isActive("listItem")) {
          if (this.editor.can().sinkListItem("listItem")) {
            return this.editor.commands.sinkListItem("listItem");
          }

          return true;
        }

        if (!this.editor.state.selection.$from.parent.isTextblock) {
          return true;
        }

        return this.editor.commands.command(({ tr }) => {
          tr.insertText(INDENT, tr.selection.from, tr.selection.to);
          return true;
        });
      },
      "Shift-Tab": () => {
        if (this.editor.isActive("codeBlock")) {
          return false;
        }

        if (this.editor.isActive("table")) {
          return false;
        }

        if (this.editor.can().liftListItem("listItem")) {
          return this.editor.commands.liftListItem("listItem");
        }

        return true;
      },
    };
  },
});
