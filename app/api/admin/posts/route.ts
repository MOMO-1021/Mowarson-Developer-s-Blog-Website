import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import {
  listRepositoryPosts,
  saveRepositoryPost,
  validatePostInput,
} from "@/lib/github-posts";

export const runtime = "nodejs";

async function isSignedIn() {
  return Boolean(await getServerSession(authOptions));
}

function errorResponse(error: unknown) {
  const status =
    error && typeof error === "object" && "status" in error
      ? Number(error.status)
      : 500;
  const message =
    error instanceof Error ? error.message : "An unexpected server error occurred.";
  return NextResponse.json(
    { error: message },
    { status: Number.isInteger(status) && status >= 400 && status < 600 ? status : 500 },
  );
}

export async function GET() {
  if (!(await isSignedIn())) {
    return NextResponse.json({ error: "Sign in to manage posts." }, { status: 401 });
  }
  try {
    return NextResponse.json({ posts: await listRepositoryPosts() });
  } catch (error) {
    return errorResponse(error);
  }
}

async function save(request: Request, update: boolean) {
  if (!(await isSignedIn())) {
    return NextResponse.json({ error: "Sign in to manage posts." }, { status: 401 });
  }
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "The request body must be valid JSON." }, { status: 400 });
  }
  try {
    const post = validatePostInput(payload);
    await saveRepositoryPost(post, update);
    return NextResponse.json({ saved: true, slug: post.slug });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  return save(request, false);
}

export async function PUT(request: Request) {
  return save(request, true);
}
