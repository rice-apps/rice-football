# Authentication

`/login` and `/account` use Supabase Auth with shared email/password accounts that the lead creates. The Staff Q&A workflow also uses the verified account access level for its narrow read, submit, and analyst-update permissions. This does not define permissions elsewhere in the product.

## Login vs. authorization

- **Login (done):** `/login` signs in. `/account` shows the verified account and its access level, and rejects anyone without a valid session.
- **Q&A authorization (implemented):** `/questions` and its read/submit APIs require one of the four recognized account levels. `/analyst/questions` and Q&A update APIs require an analyst level. Details are in the [Q&A permission table](supabase.md#api).
- **Other authorization (not done):** `/reports` and other analyst functionality remain outside this change. Q&A access levels do not define restricted dataset access.

## Accounts

There are four shared accounts, one per role. A login identifies a role, not a person.

| Account | `access_level` |
| --- | --- |
| Coaches | `coach` |
| Front office | `front_office` |
| Analysts, full access (full-time) | `analyst_full` |
| Analysts, limited access (freshman interns) | `analyst_limited` |

To add or replace an account in the Supabase dashboard:

1. Keep **Allow new users to sign up** off (Authentication > Sign In / Providers). With it on, anyone with the public key can create an account.
2. Go to Authentication > Users > Add user > Create new user, with awuto-confirm on.
3. Set its access level in the SQL editor:

   ```sql
   update auth.users
   set raw_app_meta_data = raw_app_meta_data || '{"access_level": "analyst_limited"}'::jsonb
   where email = 'account-email';
   ```

   Users can't change their own `app_metadata`. Never put access levels in `user_metadata`, which users can edit.

Keep passwords in a password manager, never in Git, chat, or email. To remove someone from a shared account, change its password.

## Configuration

Login uses the existing `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (see `.env.example`). It doesn't use the secret key.

## How it works

- Logging in and out are Server Actions (`src/lib/auth/actions.ts`), so the browser never talks to Supabase. The session is stored in HttpOnly cookies (also Secure in production).
- `getCurrentUser()` (`src/lib/auth/session.ts`) verifies who is logged in and reads the trusted `app_metadata.access_level`. It asks Supabase instead of trusting the cookie alone, so a session Supabase has ended stops working on the next protected request.
- `authorizeAccess()` and the Q&A allowlists in `src/lib/auth/authorization.ts` centralize role checks and distinguish signed-out (401), disallowed (403), and session-verification-unavailable (503) outcomes. Protected routes must call `getCurrentUser()` and apply the relevant allowlist themselves; proxy refresh is not an authorization check.
- `/analyst/questions` uses a server-side route layout to check for an analyst level before rendering the interactive page. The Q&A API routes independently check access because UI/page protection is not sufficient for direct requests.
- `src/proxy.ts` refreshes sessions for `/login`, `/account`, `/questions`, `/analyst/questions`, and `/api/questions` (including nested question IDs). Keep the matcher aligned as additional protected session-using routes are added.
- Logging out ends only the current browser's session. Supabase's default would log out every device using the shared account.

## Shared-account limits

- Sessions don't expire on their own (session time limits need Supabase's Pro plan), so log out on shared computers.
- If an account's email is a placeholder, switch it to a real team inbox before turning on any email feature such as password reset. Changing the email keeps the account and its access level.

## How to test

1. Open `/account` while logged out: you're sent to `/login`.
2. Log in with a wrong password: "Incorrect email or password."
3. Log in with each account: `/account` shows its email and access level.
4. Refresh, open a new tab, and come back after an hour: still logged in.
5. Log in on two browsers with the same account and log out of one: the other stays logged in.
6. Log out, then press Back: the account page isn't shown.
7. Change an account's password: other browsers using it are logged out on their next page load.
8. For Q&A, directly request the API as logged out, as coach/front office, and as each analyst level. Confirm logged-out requests receive 401; staff can read/submit but receive 403 for updates; analysts can read, submit, and update. Confirm an unknown access level is denied and service-verification failure is handled without granting access.
