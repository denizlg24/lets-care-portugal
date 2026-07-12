# Design Doc — Comment Moderation Panel

**Owner:** @fmbb8 &nbsp;·&nbsp; **Branch:** `feat/comment-moderation` &nbsp;·&nbsp; **Status:** Ready to implement

---

## 0. TL;DR (read this first)

The comment **backend already exists and works**. Comments are pre-moderated
(created `pending`, only shown publicly once `approved`). What is **missing is
the admin experience**: there is no page to review, filter, and act on comments,
and we keep no history of *who* moderated *what*.

Your job, in three parts:

1. **Audit log** — a new `CommentModerationLog` collection that records every
   moderation action (who, what, from→to status, when). The single
   `moderatedBy`/`moderatedAt` fields on the comment only remember the *last*
   action; we want the full trail.
2. **Cursor pagination** — replace the current offset (`page`/`limit`) pagination
   on the admin list with **id-based cursor pagination** so the queue stays fast
   and stable as comments stream in.
3. **The moderation UI** — a `/admin/blogs/comments` page with a **TanStack
   Table** fed by **TanStack Query** (both already installed), with status/blog
   filters, approve/reject/delete actions, and a per-comment history view.

Read `AGENTS.md` at the repo root before writing code: **this Next.js (16.2.10)
has breaking changes vs. what you may know** — check `node_modules/next/dist/docs/`
for anything you're unsure about (route handlers, `params` being a Promise, etc.).

---

## 1. Ground rules & conventions (non-negotiable)

Follow the patterns already in the repo. Do not invent new ones.

- **Models** live in root `models/`. Each: typed `Document` interface + a `ILean…`
  interface + `mongoose.models.X || mongoose.model(...)` guard. See
  `models/BlogComment.ts` as your template.
- **Services** live in `lib/<feature>/`. Comment logic is in `lib/blog/comments.ts`.
  Services call `await connectMongoose()` first, return **serialized** plain
  objects (ObjectIds → strings), never raw Mongoose docs.
- **Zod schemas** live per-feature in `lib/blog/schemas.ts`. Validate every
  request body / query string.
- **Route handlers** (`app/api/**/route.ts`):
  - Guard with `const { session, response } = await requireAdmin(request); if (response) return response;`
  - `params` is a **Promise**: `const { id } = await params;`
  - Validate with `schema.safeParse(...)` → `apiValidationError(parsed.error)`.
  - Wrap the body in `try/catch` → `handleRouteError("scope:METHOD", error)`.
  - Use `apiError(status, msg)` for expected failures. Error strings are in
    **Portuguese** (this is a PT site) — match the tone of existing messages.
- **Lint/format:** Biome. Run `bun run lint` and `bun run typecheck` before every
  commit. `bun run lint:fix` auto-fixes most things.
- **Auth:** admin identity comes from Better Auth. `session.user.id` is the actor
  id; resolve display names via the `user` collection (see `lib/admin/users.ts`,
  which reads `db.collection("user")`).
- **UI primitives** already exist in `components/ui/`: `table`, `badge`, `button`,
  `select`, `native-select`, `dropdown-menu`, `card`, `input`. Reuse them.
- **Commit early and often** on this branch. Small, scoped commits with
  conventional-commit messages (`feat(comments): …`, `fix(comments): …`). This is
  your first tracked work — a clean history matters.

---

## 2. What already exists (do NOT rebuild)

| Layer | File | What it gives you |
|---|---|---|
| Model | `models/BlogComment.ts` | `IBlogComment`, `COMMENT_STATUSES = [pending, approved, rejected]`, `moderatedBy`/`moderatedAt`, `isDeleted`, indexes incl. `{ status, createdAt }` |
| Service | `lib/blog/comments.ts` | `listCommentsAdmin`, `getCommentStats`, `moderateComment(id, action, moderatorId)`, `deleteComment(id)` (hard-delete if no replies, soft-delete if it has replies) |
| Schemas | `lib/blog/schemas.ts` | `commentModerationSchema` (`{ action: "approve"|"reject" }`), `commentListQuerySchema` (currently `page`/`limit`) |
| API — list | `app/api/admin/comments/route.ts` | `GET` → `{ comments, total, page, pages, stats }` |
| API — item | `app/api/admin/comments/[id]/route.ts` | `PATCH` (moderate) / `DELETE` |
| Public read | `lib/blog/comments.ts` → `listPublicComments` | already respects `approved` + own-session pending |

`moderateComment` **already stamps** `moderatedBy = session.user.id` and
`moderatedAt`. We will extend it to *also* append a log entry.

> ⚠️ Comment moderation needs **no ISR revalidation** — public comments are
> fetched client-side, not baked into the static blog pages. Don't add revalidate
> calls here.

---

## 3. Part 1 — Moderation audit log

### 3.1 New model: `models/CommentModerationLog.ts`

One document per moderation action. Immutable append-only log.

```ts
import mongoose, { type Document, Schema, type Types } from "mongoose";
import { COMMENT_STATUSES, type CommentStatus } from "@/models/BlogComment";

export const MODERATION_ACTIONS = ["approve", "reject", "delete"] as const;
export type ModerationAction = (typeof MODERATION_ACTIONS)[number];

export interface ICommentModerationLog extends Document {
  commentId: Types.ObjectId;
  blogId: Types.ObjectId;
  action: ModerationAction;
  fromStatus: CommentStatus;
  toStatus?: CommentStatus;          // absent for `delete`
  moderatorId: string;               // Better Auth user id
  moderatorName?: string;            // denormalized snapshot for display
  createdAt: Date;
}

// …ILeanCommentModerationLog mirror (ids as strings)…

const CommentModerationLogSchema = new Schema<ICommentModerationLog>(
  {
    commentId: { type: Schema.Types.ObjectId, ref: "BlogComment", required: true },
    blogId: { type: Schema.Types.ObjectId, ref: "Blog", required: true },
    action: { type: String, enum: MODERATION_ACTIONS, required: true },
    fromStatus: { type: String, enum: COMMENT_STATUSES, required: true },
    toStatus: { type: String, enum: COMMENT_STATUSES },
    moderatorId: { type: String, required: true, trim: true },
    moderatorName: { type: String, trim: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// Per-comment history, newest first.
CommentModerationLogSchema.index({ commentId: 1, createdAt: -1 });
// Global activity feed / per-moderator audit.
CommentModerationLogSchema.index({ moderatorId: 1, createdAt: -1 });

export const CommentModerationLog = /* …|| mongoose.model guard… */;
```

**Why denormalize `moderatorName`?** Admin accounts can be revoked/renamed. We
want the log to read correctly forever, so snapshot the name at write time. Look
it up once per action from the `user` collection.

### 3.2 Writing the log — extend the service

In `lib/blog/comments.ts`, make `moderateComment` and `deleteComment` **also**
append a log entry. Pass in the moderator identity.

```ts
export async function moderateComment(
  id: string,
  action: "approve" | "reject",
  moderator: { id: string; name?: string },  // was: moderatorId: string
): Promise<ILeanBlogComment | null> {
  await connectMongoose();

  const existing = await BlogComment.findById(id).select("status blogId").lean();
  if (!existing) return null;

  const toStatus = action === "approve" ? "approved" : "rejected";
  const comment = await BlogComment.findByIdAndUpdate(
    id,
    { status: toStatus, moderatedBy: moderator.id, moderatedAt: new Date() },
    { returnDocument: "after", runValidators: true },
  ).lean();
  if (!comment) return null;

  await CommentModerationLog.create({
    commentId: id,
    blogId: existing.blogId,
    action,
    fromStatus: existing.status,
    toStatus,
    moderatorId: moderator.id,
    moderatorName: moderator.name,
  });

  return serializeComment(comment);
}
```

Do the same for `deleteComment` (`action: "delete"`, `fromStatus` = current
status, no `toStatus`). **Update both call sites** in the API routes to pass
`{ id: session.user.id, name: session.user.name }`.

> The log write is best-effort context, but a failed log after a successful
> status change leaves them inconsistent. Keep it simple for v1: `await` it in
> sequence (accept the tiny window). If you want atomicity later, wrap in a
> Mongo transaction — note that in `MEMORY`/PR description, don't gold-plate now.

### 3.3 Reading the log

Add `listCommentLog(commentId, { limit })` to the service returning serialized
entries newest-first. Expose it read-only:

- `GET /api/admin/comments/[id]/log` → `{ entries: ILeanCommentModerationLog[] }`
  (admin-guarded, same conventions).

The UI shows this in a popover/drawer when you click a comment's "history" affordance.

---

## 4. Part 2 — Cursor pagination

### 4.1 Why change it

The current admin list uses `.skip((page-1)*limit)` — offset pagination.
Problems for a moderation queue: `skip` gets slower the deeper you page, and
rows shift under you as new comments arrive (you re-see or miss rows). **Cursor
pagination** keyed on the document id is stable and O(index).

### 4.2 Design

ObjectIds are monotonic by creation time, so sorting by `_id` desc == newest
first, and the last `_id` on a page is a valid cursor.

- **Query params** (extend `commentListQuerySchema`):
  ```ts
  export const commentListQuerySchema = z.object({
    status: z.enum(COMMENT_STATUSES).optional(),
    blogId: objectIdSchema.optional(),
    cursor: objectIdSchema.optional(),        // last _id seen; omit for page 1
    limit: z.coerce.number().int().min(1).max(100).default(20),
  });
  ```
  (Drop `page`. Keep `limit`.)

- **Service** `listCommentsAdmin`:
  ```ts
  const query: Record<string, unknown> = { isDeleted: false };
  if (status) query.status = status;
  if (blogId) query.blogId = blogId;
  if (cursor) query._id = { $lt: new mongoose.Types.ObjectId(cursor) };

  // Fetch limit + 1 to know if there's a next page without a count query.
  const rows = await BlogComment.find(query).sort({ _id: -1 }).limit(limit + 1).lean();
  const hasMore = rows.length > limit;
  const comments = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore ? String(comments[comments.length - 1]._id) : null;
  ```
  Return `{ comments, nextCursor, hasMore }`. Keep the blog-title enrichment
  (`blogsById`) exactly as-is.

- **Stats stay separate.** `getCommentStats()` (the pending/approved/rejected
  counts) is cheap and independent of pagination — keep returning it from the
  list route so the UI can show tab badges. You no longer need `total`/`pages`.

- **Filter changes reset the cursor.** Any change to `status`/`blogId` starts a
  fresh query from `cursor = undefined`. Handle this in the client (below).

> Edge case: two comments created in the same millisecond still have distinct,
> ordered `_id`s, so `_id`-cursor is strictly correct — that's *why* we page on
> `_id` and not on `createdAt`.

---

## 5. Part 3 — The moderation UI

### 5.1 Route & files

Put it **inside the existing blogs section** so it inherits the panel guard and
feels like "quick access" next to blog management:

```
app/admin/(panel)/blogs/comments/page.tsx        # server wrapper (thin)
app/admin/(panel)/blogs/comments/loading.tsx      # skeleton, mirror blogs/loading.tsx
components/admin/comment-moderation-table.tsx      # client — the TanStack table
components/admin/comment-history-popover.tsx        # client — per-row log viewer
lib/query/client.ts                                 # QueryClient factory
components/providers/query-provider.tsx             # "use client" QueryClientProvider
```

`page.tsx` stays a server component and just renders the client table (all data
is fetched client-side via TanStack Query so filtering/paging feels instant):

```tsx
export default function CommentsModerationPage() {
  return (
    <section className="…">
      <header>…title + description…</header>
      <CommentModerationTable />
    </section>
  );
}
```

### 5.2 Wire up TanStack Query (once, app-wide)

`@tanstack/react-query` is installed but has **no provider yet**. Create one and
mount it. Because this is App Router (Next 16), the provider is a client
component; mount it high enough that the admin pages are inside it. Preferred:
wrap `AdminShell` (or add it in `app/admin/(panel)/layout.tsx`'s subtree). Follow
the official "Next.js App Router" setup — create the `QueryClient` **inside** the
client component with `useState(() => new QueryClient())` so it isn't shared
across requests on the server.

```tsx
// components/providers/query-provider.tsx
"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: 30_000 } } }),
  );
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
```

### 5.3 Data hook

A `useComments` hook using **`useInfiniteQuery`** (matches cursor pagination):

```ts
function useComments(filters: { status?: CommentStatus; blogId?: string }) {
  return useInfiniteQuery({
    queryKey: ["admin-comments", filters],       // filters in the key → auto-refetch on change
    queryFn: async ({ pageParam }) => {
      const qs = new URLSearchParams();
      if (filters.status) qs.set("status", filters.status);
      if (filters.blogId) qs.set("blogId", filters.blogId);
      if (pageParam) qs.set("cursor", pageParam);
      const res = await fetch(`/api/admin/comments?${qs}`);
      if (!res.ok) throw new Error("Falha ao carregar comentários");
      return res.json() as Promise<{ comments: AdminComment[]; nextCursor: string | null; stats: CommentStats }>;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });
}
```

Flatten `data.pages.flatMap(p => p.comments)` for the table rows. `stats` comes
from the first page. A "Carregar mais" button calls `fetchNextPage()` and is
disabled when `!hasNextPage`.

### 5.4 Mutations

Approve / reject / delete are `useMutation`s hitting the existing
`PATCH`/`DELETE /api/admin/comments/[id]`. On success, **invalidate**
`["admin-comments"]` so the list + stats refresh:

```ts
const qc = useQueryClient();
const moderate = useMutation({
  mutationFn: ({ id, action }: { id: string; action: "approve" | "reject" }) =>
    fetch(`/api/admin/comments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    }).then((r) => { if (!r.ok) throw new Error("Falha ao moderar"); }),
  onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-comments"] }),
});
```

Use `sonner` `toast.success(...)` / `toast.error(...)` for feedback — it's already
in the project. Optional nicety: optimistic update that removes the row
immediately; not required for v1.

### 5.5 The table (`@tanstack/react-table`)

Use the headless `useReactTable` + `getCoreRowModel()` and render into the
existing `components/ui/table.tsx` primitives. **Filtering and pagination are
server-side** (we do them in the query), so you do *not* need
`getFilteredRowModel`/`getPaginationRowModel` — the table is purely for column
definition + rendering.

Columns:

| Column | Content |
|---|---|
| Author | `authorName` + (admin-only) `authorEmail` muted below |
| Comment | truncated `content` (title attr = full); indent/"↳ reply" tag when `parentId` is set |
| Blog | `blogTitle` → link to `/blog/[blogSlug]` |
| Status | `<Badge>` colored by status (pending=amber, approved=green, rejected=red) |
| Submitted | `createdAt` via `lib/blog/format.ts` (pt-relative) |
| Moderation | `moderatedBy`/`moderatedAt` if present + **History** button → `CommentHistoryPopover` |
| Actions | Approve / Reject / Delete buttons, gated by current status (don't show "Approve" on an already-approved row) |

Filter bar above the table:
- **Status** — segmented control / `Select` with counts from `stats`
  (`Pendentes 3`, `Aprovados`, `Rejeitados`, `Todos`). Changing it updates the
  `filters` state → new `queryKey` → refetch from a fresh cursor.
- **Blog** — optional `Select` of blogs (fetch a light list, or reuse the blogs
  the admin already has). Nice-to-have; ship status filter first.

Delete needs a confirm (`window.confirm` is acceptable — that's what
`blog-manager.tsx` does). Mention in the button that a comment **with replies is
soft-hidden**, not hard-deleted (the service already handles this).

### 5.6 Quick access

- Add **"Comentários"** to `components/admin/admin-nav.tsx` (`items` array) with
  a `MessageSquare` (lucide) icon, `href: "/admin/blogs/comments"`.
- On the admin home (`app/admin/(panel)/page.tsx`) add a small card showing the
  **pending count** (`getCommentStats().pending`) linking to the page — that's
  the real "quick access": an at-a-glance queue badge. Mirror how the Blogue card
  is done there.

---

## 6. Implementation order (suggested commits)

Do it bottom-up so each commit type-checks and lints green:

1. `feat(comments): add CommentModerationLog model` — model only.
2. `feat(comments): log moderation actions + expose per-comment history` — extend
   service (`moderateComment`, `deleteComment`, `listCommentLog`), update both
   route call sites, add `GET …/[id]/log`.
3. `refactor(comments): cursor pagination for admin list` — schema + service +
   route response shape. (Nothing else consumes the old shape yet, so safe.)
4. `feat(admin): TanStack Query provider` — provider + mount + `lib/query/client.ts`.
5. `feat(admin): comment moderation table with filters` — the table, hook,
   mutations, history popover.
6. `feat(admin): quick access nav + pending badge` — nav item + home card.

Run before **every** commit:
```bash
bun run lint && bun run typecheck
```

---

## 7. Testing / verification

There's no test runner wired up, so verify manually + statically:

- `bun run typecheck` clean, `bun run lint` clean.
- Seed/create a published blog with a couple of `pending` comments. (Heads up:
  `bun run seed` crashes on Bun 1.3.14 — run it under Node, or insert test docs
  directly.)
- Log in as an admin, open `/admin/blogs/comments`:
  - Pending filter shows the queue; counts match the badges.
  - Approve one → it flips to approved, disappears from Pending, the public blog
    page now shows it.
  - Reject / delete work; deleting a comment **with a reply** soft-hides it
    (row shows deleted state / drops out; the reply thread stays intact).
  - "Carregar mais" pages with the cursor (test with >20 comments).
  - History popover lists each action with moderator name + timestamp, newest
    first, and the log row count grows by one per action.
- Confirm a non-admin (logged out) gets 401 from the API routes.

Use the `/verify` skill to drive the flow end-to-end before you open your PR for
review.

---

## 8. Out of scope (don't build now)

- Bulk actions (approve-all). Nice later; skip for v1.
- Editing comment text as an admin.
- Email notifications to commenters.
- Real-time updates (websockets). TanStack Query refetch-on-focus is enough.
- Undo. The audit log makes actions traceable; reversing is a manual re-moderate.

Keep the first PR focused on the three parts above. Ask questions early — comment
on the PR and tag @denizlg24 if anything here is ambiguous.
