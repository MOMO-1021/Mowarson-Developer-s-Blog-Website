import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

export const postCategories = [
  "web-design",
  "growth",
  "strategy",
  "brand-positioning",
] as const;

export type PostCategory = (typeof postCategories)[number];

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  category: PostCategory;
  date: string;
  readingTime: number;
  draft: boolean;
  body: string;
}

const postsDirectory = path.join(process.cwd(), "content", "posts");

export function parsePost(source: string, slug: string): BlogPost {
  const { data, content } = matter(source);
  if (
    typeof data.title !== "string" ||
    typeof data.excerpt !== "string" ||
    !postCategories.includes(data.category) ||
    typeof data.date !== "string"
  ) {
    throw new Error(`Post "${slug}" has missing or invalid frontmatter.`);
  }

  const readingTime = Number(data.readingTime);
  if (!Number.isInteger(readingTime) || readingTime < 1) {
    throw new Error(`Post "${slug}" must have a positive readingTime value.`);
  }

  return {
    slug,
    title: data.title,
    excerpt: data.excerpt,
    category: data.category,
    date: data.date,
    readingTime,
    draft: data.draft === true,
    body: content.trim(),
  };
}

export async function getPublishedPosts(): Promise<BlogPost[]> {
  let filenames: string[];
  try {
    filenames = await readdir(postsDirectory);
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return [];
    }
    throw error;
  }

  const posts = await Promise.all(
    filenames
      .filter((filename) => filename.endsWith(".md"))
      .map(async (filename) => {
        const slug = filename.slice(0, -3);
        const source = await readFile(path.join(postsDirectory, filename), "utf8");
        return parsePost(source, slug);
      }),
  );

  return posts
    .filter((post) => !post.draft)
    .sort((left, right) => right.date.localeCompare(left.date));
}

export async function getPublishedPost(slug: string): Promise<BlogPost | null> {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return null;
  }

  try {
    const source = await readFile(path.join(postsDirectory, `${slug}.md`), "utf8");
    const post = parsePost(source, slug);
    return post.draft ? null : post;
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return null;
    }
    throw error;
  }
}
