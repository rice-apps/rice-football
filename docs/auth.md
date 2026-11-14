# Authentication

`/login` and `/account` use Supabase Auth with shared email/password accounts that the lead creates. Logging in proves which account someone is using. It doesn't control what they can do yet.

## Login vs. authorization

- **Login (done):** `/login` signs in. `/account` shows the verified account and its access level, and rejects anyone without a valid session.
- **Authorization (not done):** nothing else checks the login yet. `/questions`, `/reports`, `/analyst/*`, and `/api/questions` are still open to anyone who can reach the app. Access levels are labels only; no permissions are attached to them.

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
- `getCurrentUser()` (`src/lib/auth/session.ts`) decides who's logged in. It asks Supabase on every call instead of trusting the cookie alone, so a session Supabase has ended stops working on the next page load. Every protected page or action must call it.
- `src/proxy.ts` refreshes expired sessions on `/login` and `/account` only. Add any page that starts using the login to its matcher, or its sessions won't stay fresh.
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
