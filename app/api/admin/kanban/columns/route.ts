import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import { getKanbanDb, parsePositiveInt } from "@/lib/kanban-server";

export const runtime = "nodejs";

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "An unexpected error occurred.";
  return NextResponse.json({ error: message }, { status: 500 });
}

// GET /api/admin/kanban/columns — list all columns and tasks (admin only)
export async function GET() {
  if (!(await requireAdminSession())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  try {
    const sql = getKanbanDb();
    const columns = await sql`
      SELECT id, title, position, color, wip_limit, is_done, created_at, updated_at
      FROM kanban_columns
      ORDER BY position ASC
    `;
    const tasks = await sql`
      SELECT
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
      FROM kanban_tasks
      ORDER BY position ASC, created_at ASC
    `;
    return NextResponse.json({ columns, tasks });
  } catch (error) {
    return errorResponse(error);
  }
}

// POST /api/admin/kanban/columns — create a new column (admin only)
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

  const {
    title,
    color = "#6366f1",
    wip_limit = null,
    is_done = false,
  } = body as {
    title?: string;
    color?: string;
    wip_limit?: number | null;
    is_done?: boolean;
  };

  if (!title?.trim()) {
    return NextResponse.json({ error: "Column title is required." }, { status: 400 });
  }

  const parsedWip = parsePositiveInt(wip_limit);

  try {
    const sql = getKanbanDb();
    const [maxRow] = await sql`SELECT COALESCE(MAX(position), -1) AS max FROM kanban_columns`;
    const position = Number(maxRow.max) + 1;
    const [column] = await sql`
      INSERT INTO kanban_columns (title, position, color, wip_limit, is_done)
      VALUES (${title.trim().slice(0, 60)}, ${position}, ${color}, ${parsedWip}, ${Boolean(is_done)})
      RETURNING id, title, position, color, wip_limit, is_done, created_at, updated_at
    `;
    return NextResponse.json({ column }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

// PUT /api/admin/kanban/columns — update column or batch reorder (admin only)
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
    title?: string;
    color?: string;
    wip_limit?: number | null;
    is_done?: boolean;
    order?: Array<{ id: string; position: number }>;
  };

  try {
    const sql = getKanbanDb();

    if (Array.isArray(payload.order) && payload.order.length > 0) {
      for (const item of payload.order) {
        await sql`
          UPDATE kanban_columns
          SET position = ${item.position}, updated_at = now()
          WHERE id = ${item.id}
        `;
      }
      return NextResponse.json({ updated: true });
    }

    if (!payload.id) {
      return NextResponse.json({ error: "Column id is required." }, { status: 400 });
    }

    const setTitle = payload.title?.trim().slice(0, 60);
    const setColor = payload.color;
    const hasWipLimit = payload.wip_limit !== undefined;
    const parsedWip = hasWipLimit ? parsePositiveInt(payload.wip_limit) : null;
    const hasIsDone = payload.is_done !== undefined;

    if (!setTitle && !setColor && !hasWipLimit && !hasIsDone) {
      return NextResponse.json({ error: "No fields to update." }, { status: 400 });
    }

    const [column] = await sql`
      UPDATE kanban_columns
      SET
        title = COALESCE(NULLIF(${setTitle ?? ""}, ''), title),
        color = COALESCE(NULLIF(${setColor ?? ""}, ''), color),
        wip_limit = CASE WHEN ${hasWipLimit} THEN ${parsedWip}::INTEGER ELSE wip_limit END,
        is_done = CASE WHEN ${hasIsDone} THEN ${Boolean(payload.is_done)} ELSE is_done END,
        updated_at = now()
      WHERE id = ${payload.id}
      RETURNING id, title, position, color, wip_limit, is_done, created_at, updated_at
    `;

    if (!column) {
      return NextResponse.json({ error: "Column not found." }, { status: 404 });
    }

    return NextResponse.json({ column });
  } catch (error) {
    return errorResponse(error);
  }
}

// DELETE /api/admin/kanban/columns — delete a column and its tasks (admin only)
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
    return NextResponse.json({ error: "Column id is required." }, { status: 400 });
  }

  try {
    const sql = getKanbanDb();
    const deleted = await sql`
      DELETE FROM kanban_columns WHERE id = ${id} RETURNING id
    `;
    if (deleted.length === 0) {
      return NextResponse.json({ error: "Column not found." }, { status: 404 });
    }
    return NextResponse.json({ deleted: true, id });
  } catch (error) {
    return errorResponse(error);
  }
}
