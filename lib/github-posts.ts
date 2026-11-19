import "server-only";
import matter from "gray-matter";
import {
  parsePost,
  postCategories,
  type BlogPost,
  type PostCategory,
} from "@/lib/posts";

interface GitHubFile {
  name: string;
  path: string;
  type: string;
  content?: string;
  sha?: string;
}

export interface PostInput {
  slug: string;
  title: string;
  excerpt: string;
  category: PostCategory;
  date: string;
  readingTime: number;
  draft: boolean;
  body: string;
}

class GitHubError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

function config() {
  const { GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO, GITHUB_BRANCH } = process.env;
  if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO || !GITHUB_BRANCH) {
    throw new Error(
      "GitHub publishing is not configured. Set GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO, and GITHUB_BRANCH.",
    );
  }
  return { token: GITHUB_TOKEN, owner: GITHUB_OWNER, repo: GITHUB_REPO, branch: GITHUB_BRANCH };
}

function apiUrl(filePath: string) {
  const { owner, repo } = config();
  const encodedPath = filePath.split("/").map(encodeURIComponent).join("/");
  return `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${encodedPath}`;
}

async function requestGitHub(
  url: string,
  init: RequestInit = {},
): Promise<Response> {
  const { token } = config();
  const response = await fetch(url, {
    ...init,
    cache: "no-store",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      ...init.headers,
    },
  });
  if (!response.ok && response.status !== 404) {
    throw new GitHubError(
      `GitHub could not complete the request (HTTP ${response.status}). Check the repository and token permissions.`,
      response.status,
    );
  }
  return response;
}

function decodeFile(file: GitHubFile): string {
  if (typeof file.content !== "string") {
    throw new Error(`GitHub did not return content for ${file.path}.`);
  }
  return Buffer.from(file.content, "base64").toString("utf8");
}

export async function listRepositoryPosts(): Promise<BlogPost[]> {
  const { branch } = config();
  const response = await requestGitHub(
    `${apiUrl("content/posts")}?ref=${encodeURIComponent(branch)}`,
  );
  if (response.status === 404) {
    throw new GitHubError(
      "GitHub could not find the posts folder. Verify the configured repository and that the content/posts folder has been pushed.",
      404,
    );
  }
  const files = (await response.json()) as GitHubFile[];
  if (!Array.isArray(files)) {
    throw new Error("GitHub returned an unexpected post-list response.");
  }
  const posts = await Promise.all(
    files
      .filter((file) => file.type === "file" && file.name.endsWith(".md"))
      .map(async (file) => {
        const fileResponse = await requestGitHub(
          `${apiUrl(file.path)}?ref=${encodeURIComponent(branch)}`,
        );
        if (!fileResponse.ok) {
          throw new GitHubError(`Could not read ${file.path} from GitHub.`, fileResponse.status);
        }
        const contents = (await fileResponse.json()) as GitHubFile;
        return parsePost(decodeFile(contents), file.name.slice(0, -3));
      }),
  );
  return posts.sort((left, right) => right.date.localeCompare(left.date));
}

export function validatePostInput(value: unknown): PostInput {
  if (!value || typeof value !== "object") {
    throw new Error("Post data is required.");
  }
  const post = value as Record<string, unknown>;
  if (
    typeof post.slug !== "string" ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(post.slug) ||
    post.slug.length > 80
  ) {
    throw new Error("Use a short lowercase slug with letters, numbers, and hyphens.");
  }
  if (typeof post.title !== "string" || !post.title.trim() || post.title.length > 160) {
    throw new Error("Enter a title between 1 and 160 characters.");
  }
  if (
    typeof post.excerpt !== "string" ||
    !post.excerpt.trim() ||
    post.excerpt.length > 300
  ) {
    throw new Error("Enter an article summary between 1 and 300 characters.");
  }
  if (
    typeof post.category !== "string" ||
    !postCategories.includes(post.category as PostCategory)
  ) {
    throw new Error("Choose a valid article category.");
  }
  if (typeof post.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(post.date)) {
    throw new Error("Enter a publication date in YYYY-MM-DD format.");
  }
  const date = new Date(`${post.date}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== post.date) {
    throw new Error("Enter a valid publication date.");
  }
  const readingTime = Number(post.readingTime);
  if (!Number.isInteger(readingTime) || readingTime < 1 || readingTime > 120) {
    throw new Error("Reading time must be between 1 and 120 minutes.");
  }
  if (typeof post.draft !== "boolean") {
    throw new Error("Choose whether the article is a draft or published.");
  }
  if (typeof post.body !== "string" || !post.body.trim() || post.body.length > 200_000) {
    throw new Error("Article content is required and must be under 200,000 characters.");
  }
  return {
    slug: post.slug,
    title: post.title.trim(),
    excerpt: post.excerpt.trim(),
    category: post.category as PostCategory,
    date: post.date,
    readingTime,
    draft: post.draft,
    body: post.body.trim(),
  };
}

export async function saveRepositoryPost(
  post: PostInput,
  update: boolean,
): Promise<void> {
  const { branch } = config();
  const filePath = `content/posts/${post.slug}.md`;
  const fileUrl = `${apiUrl(filePath)}?ref=${encodeURIComponent(branch)}`;
  const existingResponse = await requestGitHub(fileUrl);
  let sha: string | undefined;

  if (update) {
    if (existingResponse.status === 404) {
      throw new GitHubError("That article no longer exists in the repository.", 404);
    }
    const existing = (await existingResponse.json()) as GitHubFile;
    sha = existing.sha;
    if (!sha) {
      throw new Error("GitHub did not return the existing article's file hash.");
    }
  } else if (existingResponse.status !== 404) {
    throw new GitHubError("That article slug is already in use.", 409);
  }

  const source = matter.stringify(post.body, {
    title: post.title,
    excerpt: post.excerpt,
    category: post.category,
    date: post.date,
    readingTime: post.readingTime,
    draft: post.draft,
  });
  const payload = {
    message: `${post.draft ? "Save draft" : "Publish"}: ${post.title}`,
    content: Buffer.from(source, "utf8").toString("base64"),
    branch,
    ...(sha ? { sha } : {}),
  };
  const response = await requestGitHub(apiUrl(filePath), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new GitHubError("GitHub rejected the article update.", response.status);
  }
}
