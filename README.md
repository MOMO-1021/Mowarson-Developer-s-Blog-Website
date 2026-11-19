# Mowarson Developer Journal

A Next.js blog with a private writing dashboard. Sign in with the allowed GitHub
account at `/admin`, write in Markdown, save drafts, and publish posts directly
to this repository. Publishing commits the article to GitHub; Netlify rebuilds
the public blog from `main`.

The four original articles have been migrated to Markdown in `content/posts/`.
Their former `/articles/*.html` URLs redirect to their Next.js article pages.

## Run locally

1. Install Node.js, then run `npm install`.
2. Copy `.env.example` to `.env.local` and fill in the GitHub and NextAuth values
   described below.
3. Run `npm run dev` and open `http://localhost:3000`.
4. Open `http://localhost:3000/admin` to sign in and manage articles.

## Configure GitHub access

The dashboard uses GitHub OAuth to restrict sign-in to
`ADMIN_GITHUB_USERNAME`. It uses a separate fine-grained GitHub token to commit
posts to the repository.

1. Create a GitHub OAuth App. Set its callback URL to
   `https://mowarson-developer-s-blog-website.netlify.app/api/auth/callback/github`.
   Copy its client ID and client secret to `GITHUB_ID` and `GITHUB_SECRET`.
2. Create a fine-grained personal access token for this repository only. Grant
   **Contents: Read and write** permission, then set it as `GITHUB_TOKEN`.
3. Set `GITHUB_OWNER=mowarson-developer`, `GITHUB_REPO=Mowarson-Developer-s-Blog-Website`,
   `GITHUB_BRANCH=main`, and `ADMIN_GITHUB_USERNAME=mowarson-developer`.
4. Set `NEXTAUTH_URL` to the site URL and `NEXTAUTH_SECRET` to a long random
   secret. To generate one in PowerShell, run:

   ```powershell
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```

Keep all secrets in `.env.local` locally and in Netlify's environment-variable
settings for the deployed site. Never commit them. For local OAuth sign-in,
create a separate development OAuth App with callback URL
`http://localhost:3000/api/auth/callback/github`.

## Deploy on Netlify

Connect this GitHub repository to Netlify. The build command is `npm run build`;
Netlify's Next.js integration handles the publish output. Add the environment
variables above in **Site configuration → Environment variables**, using the
production callback URL and production `NEXTAUTH_URL`, then trigger a deploy.

After setup, visit `/admin` on the deployed site. **New article** opens the
editor; use **Save draft** or **Publish article**. Both save a Markdown file in
`content/posts/`. Drafts are excluded from the public blog. Publishing a post
commits it to `main`, which triggers a Netlify deploy.

## Existing static article template

`templates/article-template.html` is retained for reference. New posts written
in the dashboard use the Markdown starter included in the editor.
