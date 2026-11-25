import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import { normalizeDueDate, sanitizeChecklist } from "@/lib/kanban";
import {
  getKanbanDb,
  parseCategory,
  parsePositiveInt,
  parsePriority,
} from "@/lib/kanban-server";

export const runtime = "nodejs";

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "An unexpected error occurred.";
  return NextResponse.json({ error: message }, { status: 500 });
}

// POST /api/admin/kanban/tasks — create a new task (admin only)
export async function POST(request: Request) {
  if (!(await requireAdminSession())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const payload = body as {
    column_id?: string;
    title?: string;
    description?: string;
    priority?: string;
    category?: string;
    label?: string;
    due_date?: string | null;
    estimated_minutes?: number | null;
    checklist?: unknown;
    linked_article_slug?: string;
  };

  if (!payload.column_id || !payload.title?.trim()) {
    return NextResponse.json({ error: "column_id and title are required." }, { status: 400 });
  }

  const priority = parsePriority(payload.priority);
  const category = parseCategory(payload.category);
  const dueDate = normalizeDueDate(payload.due_date);
  const estimatedMinutes = parsePositiveInt(payload.estimated_minutes);
  const checklist = sanitizeChecklist(payload.checklist);
  const linkedSlug = (payload.linked_article_slug ?? "").trim().slice(0, 120);

  try {
    const sql = getKanbanDb();
    const [col] = await sql`
      SELECT id, is_done FROM kanban_columns WHERE id = ${payload.column_id}
    `;
    if (!col) {
      return NextResponse.json({ error: "Target column not found." }, { status: 404 });
    }

    const [maxRow] = await sql`
      SELECT COALESCE(MAX(position), -1) AS max
      FROM kanban_tasks
      WHERE column_id = ${payload.column_id} AND archived = false
    `;
    const position = Number(maxRow.max) + 1;
    const completedAt = col.is_done ? new Date().toISOString() : null;

    const [task] = await sql`
      INSERT INTO kanban_tasks (
        column_id,
        title,
        description,
        priority,
        category,
        label,
        due_date,
        estimated_minutes,
        checklist,
        linked_article_slug,
        completed_at,
        position
      )
      VALUES (
        ${payload.column_id},
        ${payload.title.trim().slice(0, 200)},
        ${(payload.description ?? "").slice(0, 4000)},
        ${priority},
        ${category},
        ${(payload.label ?? "").trim().slice(0, 40)},
        ${dueDate},
        ${estimatedMinutes},
        ${JSON.stringify(checklist)}::jsonb,
        ${linkedSlug},
        ${completedAt},
        ${position}
      )
      RETURNING
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
    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

// PUT /api/admin/kanban/tasks — update task fields OR move/reorder (admin only)
export async function PUT(request: Request) {
  if (!(await requireAdminSession())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const payload = body as {
    id?: string;
    column_id?: string;
    title?: string;
    description?: string;
    priority?: string;
    category?: string;
    label?: string;
    due_date?: string | null;
    estimated_minutes?: number | null;
    checklist?: unknown;
    linked_article_slug?: string;
    archived?: boolean;
    position?: number;
    moves?: Array<{ id: string; column_id: string; position: number }>;
  };

  try {
    const sql = getKanbanDb();

    if (Array.isArray(payload.moves) && payload.moves.length > 0) {
      const doneCols = await sql`SELECT id FROM kanban_columns WHERE is_done = true`;
      const doneColIds = new Set(doneCols.map((c) => String(c.id)));

      for (const move of payload.moves) {
        const isDoneCol = doneColIds.has(move.column_id);
        await sql`
          UPDATE kanban_tasks
          SET
            column_id = ${move.column_id},
            position = ${move.position},
            completed_at = CASE
              WHEN ${isDoneCol} THEN COALESCE(completed_at, now())
              ELSE NULL
            END,
            updated_at = now()
          WHERE id = ${move.id}
        `;
      }
      return NextResponse.json({ updated: true });
    }

    if (!payload.id) {
      return NextResponse.json({ error: "Task id is required." }, { status: 400 });
    }

    const hasColumn = payload.column_id !== undefined;
    let isMovingToDone: boolean | null = null;
    if (hasColumn && payload.column_id) {
      const [col] = await sql`
        SELECT id, is_done FROM kanban_columns WHERE id = ${payload.column_id}
      `;
      if (!col) {
        return NextResponse.json({ error: "Target column not found." }, { status: 404 });
      }
      isMovingToDone = Boolean(col.is_done);
    }

    const hasPriority = payload.priority !== undefined;
    const priority = hasPriority ? parsePriority(payload.priority) : null;

    const hasCategory = payload.category !== undefined;
    const category = hasCategory ? parseCategory(payload.category) : null;

    const hasDueDate = payload.due_date !== undefined;
    const dueDate = hasDueDate ? normalizeDueDate(payload.due_date) : null;

    const hasEstimate = payload.estimated_minutes !== undefined;
    const estimatedMinutes = hasEstimate ? parsePositiveInt(payload.estimated_minutes) : null;

    const hasChecklist = payload.checklist !== undefined;
    const checklistJson = hasChecklist
      ? JSON.stringify(sanitizeChecklist(payload.checklist))
      : null;

    const hasArchived = payload.archived !== undefined;
    const hasLinkedSlug = payload.linked_article_slug !== undefined;
    const linkedSlug = hasLinkedSlug
      ? (payload.linked_article_slug ?? "").trim().slice(0, 120)
      : null;

    const [task] = await sql`
      UPDATE kanban_tasks
      SET
        column_id = COALESCE(${payload.column_id ?? null}, column_id),
        title = COALESCE(NULLIF(${payload.title?.trim().slice(0, 200) ?? ""}, ''), title),
        description = COALESCE(${payload.description !== undefined ? payload.description.slice(0, 4000) : null}, description),
        priority = COALESCE(${priority}, priority),
        category = COALESCE(${category}, category),
        label = COALESCE(${payload.label !== undefined ? payload.label.trim().slice(0, 40) : null}, label),
        due_date = CASE WHEN ${hasDueDate} THEN ${dueDate}::DATE ELSE due_date END,
        estimated_minutes = CASE WHEN ${hasEstimate} THEN ${estimatedMinutes}::INTEGER ELSE estimated_minutes END,
        checklist = CASE WHEN ${hasChecklist} THEN ${checklistJson ?? "[]"}::jsonb ELSE checklist END,
        linked_article_slug = COALESCE(${linkedSlug}, linked_article_slug),
        archived = CASE WHEN ${hasArchived} THEN ${Boolean(payload.archived)} ELSE archived END,
        completed_at = CASE
          WHEN ${isMovingToDone === true} THEN COALESCE(completed_at, now())
          WHEN ${isMovingToDone === false} THEN NULL
          ELSE completed_at
        END,
        position = COALESCE(${payload.position ?? null}, position),
        updated_at = now()
      WHERE id = ${payload.id}
      RETURNING
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

    if (!task) {
      return NextResponse.json({ error: "Task not found." }, { status: 404 });
    }

    return NextResponse.json({ task });
  } catch (error) {
    return errorResponse(error);
  }
}

// DELETE /api/admin/kanban/tasks — delete a task (admin only)
export async function DELETE(request: Request) {
  if (!(await requireAdminSession())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const { id } = body as { id?: string };
  if (!id) {
    return NextResponse.json({ error: "Task id is required." }, { status: 400 });
  }

  try {
    const sql = getKanbanDb();
    const deleted = await sql`
      DELETE FROM kanban_tasks WHERE id = ${id} RETURNING id
    `;
    if (deleted.length === 0) {
      return NextResponse.json({ error: "Task not found." }, { status: 404 });
    }
    return NextResponse.json({ deleted: true, id });
  } catch (error) {
    return errorResponse(error);
  }
}
