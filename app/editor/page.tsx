"use client";

import { useState } from "react";

import { MarkdownEditor } from "@/components/markdown/markdown-editor";
import { MarkdownRenderer } from "@/components/markdown/markdown-renderer";

const SAMPLE = `# O cuidado começa com atenção

Uma introdução curta ao que fazemos, escrita em **negrito**, _itálico_, <u>sublinhado</u> e ~~rasurado~~. Visite o [nosso site](https://example.com) para saber mais.

## Um subtítulo

Texto normal com uma equação em linha $E = mc^2$ e uma citação a seguir.

> "Cuidar é reconhecer a humanidade no outro."

### Um sub-subtítulo

- Primeiro ponto
- Segundo ponto
  - Sub-ponto aninhado
- Terceiro ponto

1. Passo um
2. Passo dois
3. Passo três

Lista de tarefas:

- [x] Escrever o editor
- [ ] Escrever mais artigos

![Paisagem de exemplo](https://picsum.photos/1200/700)

Uma tabela:

| Serviço | Estado |
| ------- | ------ |
| Apoio domiciliário | Ativo |
| Teleassistência | Em breve |

Um bloco de código:

\`\`\`ts
export function greet(name: string) {
  return \`Olá, \${name}!\`;
}
\`\`\`

Equação em bloco:

$$
\\int_0^\\infty e^{-x^2} \\, dx = \\frac{\\sqrt{\\pi}}{2}
$$

---

Fim do exemplo.
`;

export default function EditorTestPage() {
  const [markdown, setMarkdown] = useState(SAMPLE);

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Editor de blog — página de teste</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Alterna entre edição visual e markdown à esquerda; a pré-visualização à direita mostra
          exatamente como o artigo publicado aparece.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
        <section className="lg:sticky lg:top-6">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Editor
          </h2>
          <MarkdownEditor value={markdown} onChange={setMarkdown} />
        </section>

        <section>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Pré-visualização
          </h2>
          <div className="rounded-lg border bg-background p-6 sm:p-8">
            <MarkdownRenderer content={markdown} />
          </div>
        </section>
      </div>
    </main>
  );
}
