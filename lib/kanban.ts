export type Priority = "low" | "medium" | "high" | "urgent";

export type TaskCategory = "blog" | "client" | "seo" | "admin" | "learning";

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface KanbanColumn {
  id: string;
  title: string;
  position: number;
  color: string;
  wip_limit: number | null;
  is_done: boolean;
  created_at: string;
  updated_at: string;
}

export interface KanbanTask {
  id: string;
  column_id: string;
  title: string;
  description: string;
  priority: Priority;
  category: TaskCategory;
  label: string;
  due_date: string | null;
  estimated_minutes: number | null;
  checklist: ChecklistItem[];
  linked_article_slug: string;
  archived: boolean;
  completed_at: string | null;
  position: number;
  created_at: string;
  updated_at: string;
}

export const VALID_PRIORITIES: readonly Priority[] = ["low", "medium", "high", "urgent"];

export const VALID_CATEGORIES: readonly TaskCategory[] = [
  "blog",
  "client",
  "seo",
  "admin",
  "learning",
];

export const PRIORITY_CONFIG: Record<
  Priority,
  { label: string; className: string; icon: string; weight: number }
> = {
  low: { label: "Low", className: "kb-priority-low", icon: "↓", weight: 1 },
  medium: { label: "Medium", className: "kb-priority-medium", icon: "→", weight: 2 },
  high: { label: "High", className: "kb-priority-high", icon: "↑", weight: 3 },
  urgent: { label: "Urgent", className: "kb-priority-urgent", icon: "⚡", weight: 4 },
};

export const CATEGORY_CONFIG: Record<
  TaskCategory,
  { label: string; icon: string; badgeClass: string }
> = {
  blog: { label: "Blog Post", icon: "✍️", badgeClass: "kb-cat-blog" },
  client: { label: "Client Work", icon: "💼", badgeClass: "kb-cat-client" },
  seo: { label: "SEO & Growth", icon: "📈", badgeClass: "kb-cat-seo" },
  admin: { label: "Admin & Ops", icon: "🗂️", badgeClass: "kb-cat-admin" },
  learning: { label: "Learning", icon: "📚", badgeClass: "kb-cat-learning" },
};

export const COLUMN_COLORS = [
  "#8b5cf6",
  "#3b82f6",
  "#f59e0b",
  "#06b6d4",
  "#10b981",
  "#ef4444",
  "#f97316",
  "#ec4899",
];

export interface TaskTemplate {
  id: string;
  name: string;
  summary: string;
  title: string;
  description: string;
  priority: Priority;
  category: TaskCategory;
  label: string;
  estimated_minutes: number;
  checklistTexts: string[];
}

export const TASK_TEMPLATES: TaskTemplate[] = [
  {
    id: "blog-post-pipeline",
    name: "New Blog Post Pipeline",
    summary: "End-to-end checklist from keyword idea to published article.",
    title: "Write blog post: [Topic]",
    description:
      "Target audience & takeaway:\nKey examples or code snippets to include:\nInternal links to add:",
    priority: "medium",
    category: "blog",
    label: "Content",
    estimated_minutes: 180,
    checklistTexts: [
      "Pick target keyword & clear reader angle",
      "Draft H2/H3 outline",
      "Write first draft & practical examples",
      "Write short excerpt & check reading time",
      "Proofread, test links & publish",
      "Share on socials / newsletter",
    ],
  },
  {
    id: "client-deliverable",
    name: "Client Deliverable",
    summary: "Scope, build, review, and invoice a freelance milestone.",
    title: "Client milestone: [Project Name]",
    description:
      "Client expectations & acceptance criteria:\nRepo / staging link:",
    priority: "high",
    category: "client",
    label: "Freelance",
    estimated_minutes: 240,
    checklistTexts: [
      "Confirm scope & deadline with client",
      "Implement core deliverable",
      "Self-QA on mobile & desktop",
      "Send preview link for client feedback",
      "Log hours & send invoice",
    ],
  },
  {
    id: "seo-refresh",
    name: "SEO & Content Refresh",
    summary: "Improve rankings and click-through rate on an existing article.",
    title: "SEO refresh: [Article Title]",
    description:
      "Target search query:\nCurrent gaps compared to top results:",
    priority: "medium",
    category: "seo",
    label: "SEO",
    estimated_minutes: 90,
    checklistTexts: [
      "Audit title, excerpt & heading structure",
      "Add missing practical examples or FAQ",
      "Add 2-3 internal links from newer posts",
      "Verify sitemap & index status",
    ],
  },
  {
    id: "weekly-solo-ops",
    name: "Weekly Solo Review",
    summary: "Keep freelance admin, finances, and content calendar on track.",
    title: "Weekly solo business & blog review",
    description: "Review upcoming deadlines, invoices, and next week's top 3 priorities.",
    priority: "low",
    category: "admin",
    label: "Weekly",
    estimated_minutes: 45,
    checklistTexts: [
      "Send pending client invoices & follow-ups",
      "Pick 1 blog topic for next week",
      "Archive completed Done cards",
      "Clear inbox & calendar blockers",
    ],
  },
];

export function formatMinutes(minutes: number | null): string {
  if (!minutes || minutes <= 0) return "";
  if (minutes < 60) return `${minutes}m`;
  const hrs = Math.floor(minutes / 60);
  const rem = minutes % 60;
  return rem > 0 ? `${hrs}h ${rem}m` : `${hrs}h`;
}

export function normalizeDueDate(value: unknown): string | null {
  if (!value) return null;
  const str = String(value).trim();
  if (!str) return null;
  const match = str.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : null;
}

export function sanitizeChecklist(raw: unknown): ChecklistItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object"))
    .map((item, idx) => ({
      id: typeof item.id === "string" && item.id.trim() ? item.id.trim() : `item-${idx}-${Date.now()}`,
      text: typeof item.text === "string" ? item.text.trim().slice(0, 200) : "",
      done: Boolean(item.done),
    }))
    .filter((item) => item.text.length > 0);
}
