# Supabase

The Staff Q&A pages store questions in a Supabase table:

- `/questions`: staff submit questions and see every question's status and answer.
- `/analyst/questions`: analysts change statuses and save answers.

The browser only calls our API routes (`/api/questions`). Only the server talks to Supabase, using the secret key, and it validates every request first.

There's no authentication yet. Use sample data only.

## Environment variables

Set these in `.env.local` (copy `.env.example`), then restart `npm run dev`:

| Variable | Notes |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | The project URL. |
| `SUPABASE_SECRET_KEY` | Server only. It bypasses Row Level Security, so never prefix it with `NEXT_PUBLIC_` or commit it. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public by design. The Q&A pages don't use it. |

## Database

The `public.questions` table has `id`, `submitter_name`, `submitter_title`, `question`, `answer` (nullable), `status` (`open`, `in-progress`, or `answered`), `created_at`, and `updated_at`.

- Row Level Security is on with no policies, so the publishable key can't read or write the table.
- The `service_role` needs `select`, `insert`, and `update` privileges on the table. Without them, every request fails with `permission denied for table questions`.

## API

| Request | Body | Response |
| --- | --- | --- |
| `GET /api/questions` | none | `{ questions }`, newest first |
| `POST /api/questions` | `{ submittedBy, submitterTitle, text }` | `201 { question }`, always `open` with no answer |
| `PATCH /api/questions/[id]` | `{ status?, answer? }`, at least one | `{ question }`, or `404` if the id doesn't exist |

Invalid requests get `400 { error, fieldErrors }`. Database errors get `500 { error }`, with details in the server log.
