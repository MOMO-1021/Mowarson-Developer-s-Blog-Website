# Mowarson Developer Journal

A lightweight static blog that follows the visual style of the Mowarson Developer portfolio. It has no build step, database, or runtime dependency.

## Preview

Open `index.html` in a browser, or serve this folder with any static-file server. For example, with Node.js installed:

```powershell
npx serve .
```

## Publish

Deploy this folder as the publish directory on a static host such as Netlify or GitHub Pages. Connect the blog's production domain to the portfolio by adding that final URL to the portfolio's blog page after the domain is assigned.

## Add an article

1. Copy `templates/article-template.html` into `articles/` and give it a short, descriptive filename.
2. Replace every `{{PLACEHOLDER}}`, follow the writing notes in the file, and remove the authoring comments before publishing.
3. Update the title, description, social metadata, structured data, category, date, image, and article content. Add a canonical URL after the Netlify site URL is assigned.
4. Add a matching card in `index.html` inside `#article-grid`. Set `data-category` to `web-design`, `growth`, `strategy`, or `brand-positioning`, and add search terms to `data-search`.
5. Add the new article to the JSON-LD `blogPost` list in `index.html` and add it to the related links on relevant article pages.

Article pages are regular HTML, so each post remains directly accessible and indexable without client-side rendering. The detailed Brand Positioning & Messaging template includes a table of contents, summary, takeaways, positioning framework, worked example, implementation checklist, FAQs, author card, related posts, and CTA. Use the existing portfolio palette and shared `style.css` classes when adding components.

The portfolio's Blog page still needs the live Netlify URL before its article links can be pointed to this separate site. After creating the Netlify site, update the portfolio links with the assigned `*.netlify.app` address (or your custom domain).

# Mowarson-Developer-s-Blog-Website

A Website dedicated to blogs written by Mowarson Developer
