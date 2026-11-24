# Mowarson Developer Journal

A Next.js journal with account-gated reading and a private writing dashboard.
Readers sign in with email/password to access articles and comments. The allowed
GitHub account at `/admin` can write in Markdown, save drafts, and publish posts
directly to this repository. Publishing commits the article to GitHub; Netlify
rebuilds the journal from `main`.

The four original articles have been migrated to Markdown in `content/posts/`.
Their former `/articles/*.html` URLs redirect to their Next.js article pages.

## Run locally

1. Install Node.js, then run `npm install`.
2. Copy `.env.example` to `.env.local` and fill in the GitHub, NextAuth, and
   Neon values described below.
3. Run `npm run dev` and open `http://localhost:3000`.
4. Open `http://localhost:3000/admin` to sign in and manage articles.

## Configure GitHub access

The dashboard uses GitHub OAuth to restrict sign-in to
`ADMIN_GITHUB_USERNAME`. It uses a separate fine-grained GitHub token to commit
posts to the repository.

1. Create a GitHub OAuth App. Set its callback URL to
   `https://mowarsondeveloper-blog-website.netlify.app/api/admin-auth/callback/github`.
   Copy its client ID and client secret to `GITHUB_ID` and `GITHUB_SECRET`.
2. Create a fine-grained personal access token for this repository only. Grant
   **Contents: Read and write** permission, then set it as `GITHUB_TOKEN`.
3. Set `GITHUB_OWNER=MOMO-1021`, `GITHUB_REPO=Mowarson-Developer-s-Blog-Website`,
   `GITHUB_BRANCH=main`, and `ADMIN_GITHUB_USERNAME=MOMO-1021`.
4. Set `NEXTAUTH_URL` to the full admin auth endpoint (for example
   `https://mowarsondeveloper-blog-website.netlify.app/api/admin-auth`) and
   `NEXTAUTH_SECRET` to a long random secret. To generate one in PowerShell, run:

   ```powershell
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```

Keep all secrets in `.env.local` locally and in Netlify's environment-variable
settings for the deployed site. Never commit them. For local OAuth sign-in,
create a separate development OAuth App with callback URL
`http://localhost:3000/api/admin-auth/callback/github`.

## Reader accounts and comments

The journal and article pages require a reader account. Email/password
registration, sign-in, password reset, and article comments use Neon Managed
Auth and the project's Postgres database. The existing GitHub-only writing
dashboard remains separate.

1. Select or create a Neon project, enable Managed Auth and **Sign-in with
   Email**, and add the local and production site origins to its trusted domains.
2. Set `NEON_AUTH_BASE_URL` to the branch's Managed Auth URL and
   `DATABASE_URL` to its pooled Postgres connection string. Generate a
   `NEON_AUTH_COOKIE_SECRET` with at least 32 characters. In PowerShell, run:

   ```powershell
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```
3. Apply `db/migrations/001_article_comments.sql` to that database. With `psql`
   in PowerShell, run:

   ```powershell
   psql $env:DATABASE_URL -f db\migrations\001_article_comments.sql
   ```

4. Add these values to Netlify's environment settings as well. Configure a
   custom SMTP provider in Neon before production so password-reset emails are
   delivered reliably.

Readers can comment while signed in; comments appear immediately. LinkedIn,
Facebook, and Threads use their share dialogs. Instagram sharing uses the
device's share sheet when available, with a copy-link fallback.

## Deploy on Netlify

Connect this GitHub repository to Netlify. The build command is `npm run build`;
Netlify's Next.js integration handles the publish output. Add the environment
variables above in **Site configuration → Environment variables**, using the
production callback URL and production `NEXTAUTH_URL`, then trigger a deploy.

After setup, visit `/admin` on the deployed site. **New article** opens the
editor; use **Save draft** or **Publish article**. Both save a Markdown file in
`content/posts/`. Drafts are excluded from the public blog. Publishing a post
commits it to `main`, which triggers a Netlify deploy.
Use **Delete** in the post list to remove an article after confirming; the
deletion is committed to GitHub and Netlify redeploys without that article.

## Existing static article template

`templates/article-template.html` is retained for reference. New posts written
in the dashboard use the Markdown starter included in the editor.
