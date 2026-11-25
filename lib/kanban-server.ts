import { neon } from "@neondatabase/serverless";
import {
  VALID_CATEGORIES,
  VALID_PRIORITIES,
  type Priority,
  type TaskCategory,
} from "./kanban";

export function getKanbanDb() {
  const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL ?? "";
  if (!url) {
    throw new Error("Database connection string is not configured.");
  }
  return neon(url);
}

export function parsePriority(value: unknown): Priority {
  if (typeof value === "string" && (VALID_PRIORITIES as readonly string[]).includes(value)) {
    return value as Priority;
  }
  return "medium";
}

export function parseCategory(value: unknown): TaskCategory {
  if (typeof value === "string" && (VALID_CATEGORIES as readonly string[]).includes(value)) {
    return value as TaskCategory;
  }
  return "blog";
}

export function parsePositiveInt(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return null;
  return Math.round(num);
}

export const TASK_SELECT_COLUMNS = `
  id,
  column_id,
  title,
  description,
  priority,
  category,
  label,
  TO_CHAR(due_date, 'YYYY-MM-DD') AS due_date,
  estimated_minutes,
  checklist,
  linked_article_slug,
  archived,
  completed_at,
  position,
  created_at,
  updated_at
`;
