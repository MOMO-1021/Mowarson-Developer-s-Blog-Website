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
        <section className="hero marketing-hero" id="about">
          <div className="container hero-inner">
            <div className="hero-copy">
              <p className="eyebrow">
                <span className="eyebrow-dot" /> Professional brand marketing specialist · Brand positioning &amp; messaging · SEO-optimized websites
              </p>
              <h1>
                Position your brand to command authority &amp; win clients
              </h1>
              <p className="hero-description">
                I help ambitious businesses and founders articulate clear brand messaging,
                establish market leadership, and convert visitors into high-paying clients
                with high-performance SEO-driven websites.
              </p>
              <div className="hero-value-bundle">
                <strong>VALUE BUNDLE</strong>
                Complete high-converting website included at zero extra cost with our Brand
                Positioning &amp; Marketing Bundle — starting at <b>₹5,000</b>
              </div>
              <div className="hero-actions">
                <Link className="button" href="#pricing">View pricing plans →</Link>
                <a className="button button-secondary" href="https://mowarsondeveloper.netlify.app/" target="_blank" rel="noopener noreferrer">Explore services</a>
              </div>
            </div>
          </div>
        </section>
        <section className="services-section container" id="services">
          <div className="marketing-section-heading">
            <h2>Strategic services engineered for real growth</h2>
            <p>Instead of generic templates, I craft disciplined positioning architectures that resonate with your ideal buyers and drive measurable growth.</p>
          </div>
          <div className="service-grid">
            <article className="service-card">
              <span className="topic-tag">Growth package · Free website included</span>
              <h3>Brand Positioning &amp; Strategic Marketing</h3>
              <p>Cut through competitive noise with a razor-sharp market position, value proposition refinement, audience-focused messaging frameworks, and search visibility.</p>
              <div className="service-note">Includes complete custom high-converting website at zero additional cost</div>
            </article>
            <article className="service-card">
              <span className="topic-tag neutral-tag">Conversion web design</span>
              <h3>High-Converting Website Design</h3>
              <p>Performance-driven websites designed for clarity, authority, and engagement. Fast-loading, mobile-first, and built to turn traffic into paying clients.</p>
              <div className="service-note">Built from scratch with on-page SEO to rank in high-intent searches</div>
            </article>
          </div>
        </section>
        <section className="pricing-section container" id="pricing">
          <div className="marketing-section-heading">
            <p className="eyebrow"><span className="eyebrow-dot" /> Minimal &amp; transparent pricing</p>
            <h2>Choose your plan</h2>
            <p>Direct founder execution with zero agency markup. Choose standalone conversion web design or our Brand Positioning &amp; Marketing Bundle.</p>
          </div>
          <div className="pricing-grid">
            <article className="price-card">
              <h3>Conversion Website Only</h3>
              <p>For businesses and founders needing an ultra-fast, search-optimized web presence.</p>
              <div className="price">₹4,000 <small>/ one-time investment</small></div>
              <ul><li>Strategic structure and custom narrative flow</li><li>100% mobile responsive experience</li><li>WhatsApp lead integration and inquiry system</li><li>Google Search Console indexing setup</li></ul>
              <a className="button button-secondary" href="https://mowarsondeveloper.netlify.app/" target="_blank" rel="noopener noreferrer">Get started (₹4,000) →</a>
            </article>
            <article className="price-card featured-price">
              <span className="recommended">Recommended · Full bundle</span>
              <h3>Brand Positioning + FREE Website</h3>
              <p>Strategic brand positioning &amp; marketing growth + full conversion website included at ₹0.</p>
              <div className="price">₹5,000 <small>/ starting package</small></div>
              <ul><li>Complete website included at ₹0</li><li>Strategic messaging architecture</li><li>Search visibility and Google optimization</li><li>Direct lead capture funnels</li><li>1-on-1 founder dedication</li></ul>
              <a className="button" href="https://mowarsondeveloper.netlify.app/" target="_blank" rel="noopener noreferrer">Claim full bundle (₹5,000) →</a>
            </article>
          </div>
        </section>
        <section className="article-section container" id="articles">
          <ArticleBrowser posts={posts} />
        </section>
        <section className="portfolio-callout container" id="contact">
          <div>
            <p className="eyebrow">
              <span className="eyebrow-dot" /> Built for your next step
            </p>
            <h2>Ready to clarify your brand &amp; accelerate growth?</h2>
            <p>Let&apos;s discuss how strategic brand positioning and conversion-focused web architecture can grow your business.</p>
          </div>
          <a
            className="button button-light"
            href="https://mowarsondeveloper.netlify.app/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Send a message <span aria-hidden="true">↗</span>
          </a>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
