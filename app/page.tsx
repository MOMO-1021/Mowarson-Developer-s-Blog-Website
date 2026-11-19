import Link from "next/link";
import { ArticleBrowser, type ArticleCardData } from "./components/article-browser";
import { SiteFooter } from "./components/site-footer";
import { SiteHeader } from "./components/site-header";
import { getPublishedPosts } from "@/lib/posts";

export const dynamic = "force-dynamic";

const categoryLabels: Record<string, string> = {
  "web-design": "Web design",
  growth: "Growth & marketing",
  strategy: "Strategy",
  "brand-positioning": "Brand positioning & messaging",
};

export default async function HomePage() {
  const authoredPosts = await getPublishedPosts();
  const posts: ArticleCardData[] = [
    ...authoredPosts.map((post) => ({
      title: post.title,
      excerpt: post.excerpt,
      category: post.category,
      categoryLabel: categoryLabels[post.category],
      date: post.date,
      readingTime: post.readingTime,
      href: `/articles/${post.slug}`,
    })),
  ];

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <SiteHeader />
      <main id="main">
        <section className="hero">
          <div className="container hero-inner">
            <div className="hero-copy">
              <p className="eyebrow">
                <span className="eyebrow-dot" /> The Mowarson Developer Journal
              </p>
              <h1>
                Ideas for a stronger <span>digital presence.</span>
              </h1>
              <p className="hero-description">
                Straightforward lessons on websites, search, and growing a brand
                online. Written for people building something real.
              </p>
              <Link className="button" href="#articles">
                Explore the articles 
                {/* <span aria-hidden="true">↓</span> */}
              </Link>
            </div>
          </div>
        </section>
        <section className="article-section container" id="articles">
          <ArticleBrowser posts={posts} />
        </section>
        <section className="portfolio-callout container">
          <div>
            <p className="eyebrow">
              <span className="eyebrow-dot" /> Built for your next step
            </p>
            <h2>Have a project in mind?</h2>
            <p>Explore my work and services, or get in touch to talk through your goals.</p>
          </div>
          <a
            className="button button-light"
            href="https://mowarsondeveloper.netlify.app/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Visit my portfolio <span aria-hidden="true">↗</span>
          </a>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
