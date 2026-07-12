import { CommentModerationTable } from "@/components/admin/comment-moderation-table";

export default function CommentsModerationPage() {
  return (
    <section className="space-y-8">
      <header className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Blogue</p>
        <h1 className="text-xl font-semibold text-foreground">Moderação de comentários</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Reveja comentários e respostas, aplique ações em grupo e consulte o histórico de
          moderação.
        </p>
      </header>

      <CommentModerationTable />
    </section>
  );
}
