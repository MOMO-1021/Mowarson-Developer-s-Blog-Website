import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <Link className="logo logo-footer" href="/">
          Mowarson<span>Developer</span>
        </Link>
        <p>Thoughtful websites. Clearer brands. Better growth.</p>
        <div className="footer-links">
          <a
            href="https://mowarsondeveloper.netlify.app/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Portfolio
          </a>
          <a
            href="https://mowarsondeveloper.netlify.app/contact.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            Contact
          </a>
          <a
            href="https://www.instagram.com/mowarson_developer/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Instagram
          </a>
          <a
            href="https://www.linkedin.com/in/mowarson-developer-298404302/"
            target="_blank"
            rel="noopener noreferrer"
          >
            LinkedIn
          </a>
        </div>
        <small>© {new Date().getFullYear()} Mowarson Developer. All rights reserved.</small>
      </div>
    </footer>
  );
}
