import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";
import { readerAuth } from "@/lib/reader-auth/server";
import { getPublishedPost } from "@/lib/posts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ slug: string }>;
}

function getSql() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to load and post comments.");
  }
  return neon(databaseUrl);
}

async function getAuthorizedSlug(
  context: RouteContext,
): Promise<{ slug: string } | NextResponse> {
  const { data: session } = await readerAuth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in to view or post comments." }, { status: 401 });
  }

  const { slug } = await context.params;
  const post = await getPublishedPost(slug);
  if (!post) {
    return NextResponse.json({ error: "Article not found." }, { status: 404 });
  }
  return { slug };
}

export async function GET(_request: Request, context: RouteContext) {
  const authorized = await getAuthorizedSlug(context);
  if (authorized instanceof NextResponse) {
    return authorized;
  }

  try {
    const sql = getSql();
    const comments = await sql`
      SELECT id::text AS id, author_name AS name, body, created_at AS "createdAt"
      FROM article_comments
      WHERE article_slug = ${authorized.slug}
      ORDER BY created_at ASC
      LIMIT 200
    `;
    return NextResponse.json({ comments });
  } catch (error) {
    console.error("Could not load article comments.", error);
    return NextResponse.json(
      { error: "Comments are temporarily unavailable. Please try again." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request, context: RouteContext) {
  const authorized = await getAuthorizedSlug(context);
  if (authorized instanceof NextResponse) {
    return authorized;
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "The request body must be valid JSON." }, { status: 400 });
  }

  if (
    !payload ||
    typeof payload !== "object" ||
    !("body" in payload) ||
    typeof payload.body !== "string"
  ) {
    return NextResponse.json({ error: "A comment is required." }, { status: 400 });
  }

  const body = payload.body.trim();
  if (!body || body.length > 1000) {
    return NextResponse.json(
      { error: "Comments must contain between 1 and 1000 characters." },
      { status: 400 },
    );
  }

  const { data: session } = await readerAuth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in to post a comment." }, { status: 401 });
  }
  const name =
    session.user.name?.trim().slice(0, 80) ||
    session.user.email?.split("@")[0]?.slice(0, 80) ||
    "Reader";

  try {
    const sql = getSql();
    const [comment] = await sql`
      INSERT INTO article_comments (article_slug, author_id, author_name, body)
      VALUES (${authorized.slug}, ${session.user.id}, ${name}, ${body})
      RETURNING id::text AS id, author_name AS name, body, created_at AS "createdAt"
    `;
    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    console.error("Could not save article comment.", error);
    return NextResponse.json(
      { error: "Your comment could not be posted. Please try again." },
      { status: 500 },
    );
  }
}
