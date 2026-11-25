"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CATEGORY_CONFIG,
  PRIORITY_CONFIG,
  formatMinutes,
  type KanbanColumn,
  type KanbanTask,
  type Priority,
  type TaskCategory,
  type TaskTemplate,
} from "@/lib/kanban";
import {
  ColumnModal,
  TaskModal,
  TemplatesModal,
  emptyTaskForm,
  type TaskFormData,
} from "./kanban-modals";

type ViewMode = "board" | "list" | "archive";
type DueFilter = "all" | "overdue" | "today" | "week" | "focus";

function formatDate(iso: string | null): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getDaysUntil(due: string | null): number | null {
  if (!due) return null;
  const [y, m, d] = due.split("-").map(Number);
  if (!y || !m || !d) return null;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(y, m - 1, d);
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function isOverdue(due: string | null, isDoneCol = false): boolean {
  if (isDoneCol) return false;
  const days = getDaysUntil(due);
  return days !== null && days < 0;
}

function TaskCard({
  task,
  canMoveLeft,
  canMoveRight,
  isDoneCol,
  isDragging,
  onEdit,
  onDelete,
  onArchive,
  onQuickMove,
  onDragStart,
  onDragEnd,
}: {
  task: KanbanTask;
  canMoveLeft: boolean;
  canMoveRight: boolean;
  isDoneCol: boolean;
  isDragging: boolean;
  onEdit: (task: KanbanTask) => void;
  onDelete: (task: KanbanTask) => void;
  onArchive: (id: string, archived: boolean) => void;
  onQuickMove: (task: KanbanTask, direction: -1 | 1) => void;
  onDragStart: (task: KanbanTask) => void;
  onDragEnd: () => void;
}) {
  const daysUntil = getDaysUntil(task.due_date);
  const overdue = isOverdue(task.due_date, isDoneCol);
  const p = PRIORITY_CONFIG[task.priority] ?? PRIORITY_CONFIG.medium;
  const cat = CATEGORY_CONFIG[task.category] ?? CATEGORY_CONFIG.blog;
  const checklist = Array.isArray(task.checklist) ? task.checklist : [];
  const checkDone = checklist.filter((c) => c.done).length;
  const checkPct = checklist.length > 0 ? Math.round((checkDone / checklist.length) * 100) : 0;

  return (
    <div
      className={`kb-task-card${isDragging ? " is-dragging" : ""}${overdue ? " is-overdue-card" : ""}`}
      draggable
      onDragStart={() => onDragStart(task)}
      onDragEnd={onDragEnd}
      role="article"
      aria-label={task.title}
    >
      <div className="kb-card-badges">
        <span className={`kb-cat-pill ${cat.badgeClass}`}>
          {cat.icon} {cat.label}
        </span>
        {task.label && <span className="kb-task-label">{task.label}</span>}
      </div>

      <p className="kb-task-title" onClick={() => onEdit(task)}>
        {task.title}
      </p>

      {task.description && <p className="kb-task-desc">{task.description}</p>}

      {checklist.length > 0 && (
        <div className="kb-card-progress" title={`${checkDone} of ${checklist.length} subtasks done`}>
          <div className="kb-progress-track">
            <div className="kb-progress-fill" style={{ width: `${checkPct}%` }} />
          </div>
          <span className="kb-progress-text">
            ✓ {checkDone}/{checklist.length}
          </span>
        </div>
      )}

      <div className="kb-task-meta">
        <span className={`kb-priority-pill ${p.className}`}>
          {p.icon} {p.label}
        </span>
        {task.estimated_minutes ? (
          <span className="kb-est-badge">⏱ {formatMinutes(task.estimated_minutes)}</span>
        ) : null}
        {task.due_date && (
          <span
            className={`kb-due-date${
              overdue
                ? " is-overdue"
                : !isDoneCol && daysUntil !== null && daysUntil <= 2
                  ? " is-soon"
                  : ""
            }`}
          >
            📅{" "}
            {overdue
              ? "Overdue · "
              : !isDoneCol && daysUntil === 0
                ? "Due today · "
                : ""}
            {formatDate(task.due_date)}
          </span>
        )}
      </div>

      {task.linked_article_slug && (
        <div className="kb-linked-slug" title={`Linked article: ${task.linked_article_slug}`}>
          🔗 /articles/{task.linked_article_slug}
        </div>
      )}

      <div className="kb-task-actions">
        {canMoveLeft && (
          <button
            type="button"
            className="kb-icon-btn"
            aria-label="Move to previous column"
            title="Move left"
            onClick={() => onQuickMove(task, -1)}
          >
            ←
          </button>
        )}
        {canMoveRight && (
          <button
            type="button"
            className="kb-icon-btn"
            aria-label="Move to next column"
            title="Move right"
            onClick={() => onQuickMove(task, 1)}
          >
            →
          </button>
        )}
        <button
          type="button"
          className="kb-icon-btn"
          aria-label="Edit task"
          title="Edit"
          onClick={() => onEdit(task)}
        >
          ✏️
        </button>
        <button
          type="button"
          className="kb-icon-btn"
          aria-label="Archive task"
          title="Archive"
          onClick={() => onArchive(task.id, true)}
        >
          📦
        </button>
        <button
          type="button"
          className="kb-icon-btn kb-icon-btn-danger"
          aria-label="Delete task"
          title="Delete"
          onClick={() => onDelete(task)}
        >
          🗑️
        </button>
      </div>
    </div>
  );
}

export default function KanbanBoard({ articleSlugs = [] }: { articleSlugs?: string[] }) {
  const [columns, setColumns] = useState<KanbanColumn[]>([]);
  const [tasks, setTasks] = useState<KanbanTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // View & filters
  const [viewMode, setViewMode] = useState<ViewMode>("board");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<TaskCategory | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<Priority | "all">("all");
  const [dueFilter, setDueFilter] = useState<DueFilter>("all");

  // Quick-add inline per column
  const [quickAddCol, setQuickAddCol] = useState<string | null>(null);
  const [quickAddTitle, setQuickAddTitle] = useState("");

  // Modals
  const [taskModal, setTaskModal] = useState<{ open: boolean; task: TaskFormData | null }>({
    open: false,
    task: null,
  });
  const [columnModal, setColumnModal] = useState<{ open: boolean; column?: KanbanColumn }>({
    open: false,
  });
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Drag state
  const [dragTask, setDragTask] = useState<KanbanTask | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  const sortedColumns = useMemo(
    () => [...columns].sort((a, b) => a.position - b.position),
    [columns],
  );

  const columnMap = useMemo(
    () => new Map(sortedColumns.map((c) => [c.id, c])),
    [sortedColumns],
  );

  const activeTasks = useMemo(() => tasks.filter((t) => !t.archived), [tasks]);
  const archivedTasks = useMemo(() => tasks.filter((t) => t.archived), [tasks]);

  // Filtered active tasks
  const filteredTasks = useMemo(() => {
    const q = search.trim().toLowerCase();
    return activeTasks.filter((t) => {
      if (categoryFilter !== "all" && t.category !== categoryFilter) return false;
      if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
      if (q) {
        const hay = `${t.title} ${t.description} ${t.label} ${t.linked_article_slug}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (dueFilter !== "all") {
        const col = columnMap.get(t.column_id);
        const isDoneCol = Boolean(col?.is_done);
        const days = getDaysUntil(t.due_date);
        if (dueFilter === "overdue" && !isOverdue(t.due_date, isDoneCol)) return false;
        if (dueFilter === "today" && (isDoneCol || days !== 0)) return false;
        if (dueFilter === "week" && (isDoneCol || days === null || days < 0 || days > 7)) {
          return false;
        }
        if (
          dueFilter === "focus" &&
          (isDoneCol || (t.priority !== "urgent" && (days === null || days > 2)))
        ) {
          return false;
        }
      }
      return true;
    });
  }, [activeTasks, categoryFilter, columnMap, dueFilter, priorityFilter, search]);

  const hasActiveFilters =
    Boolean(search.trim()) ||
    categoryFilter !== "all" ||
    priorityFilter !== "all" ||
    dueFilter !== "all";

  // Stats
  const stats = useMemo(() => {
    let done = 0;
    let urgent = 0;
    let overdue = 0;
    let dueSoon = 0;
    let remainingMinutes = 0;

    for (const t of activeTasks) {
      const col = columnMap.get(t.column_id);
      const isDoneCol = Boolean(col?.is_done);
      if (isDoneCol) {
        done += 1;
      } else {
        if (t.estimated_minutes) remainingMinutes += t.estimated_minutes;
        if (t.priority === "urgent") urgent += 1;
        const days = getDaysUntil(t.due_date);
        if (days !== null && days < 0) overdue += 1;
        else if (days !== null && days <= 2) dueSoon += 1;
      }
    }

    return {
      total: activeTasks.length,
      done,
      urgent,
      overdue,
      dueSoon,
      remainingHours: (remainingMinutes / 60).toFixed(1),
    };
  }, [activeTasks, columnMap]);

  const loadBoard = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/kanban/columns", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load board.");
      setColumns(data.columns ?? []);
      setTasks(data.tasks ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load board.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBoard();
  }, [loadBoard]);

  // Keyboard shortcut: 'N' for new task
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "n" && !e.metaKey && !e.ctrlKey && sortedColumns[0]) {
        e.preventDefault();
        setTaskModal({ open: true, task: emptyTaskForm(sortedColumns[0].id) });
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [sortedColumns]);

  // ── Task CRUD ──

  async function handleSaveTask(formData: TaskFormData) {
    setSaving(true);
    setError("");
    try {
      if (formData.id) {
        const res = await fetch("/api/admin/kanban/tasks", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to update task.");
        setTasks((prev) => prev.map((t) => (t.id === formData.id ? data.task : t)));
      } else {
        const res = await fetch("/api/admin/kanban/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to create task.");
        setTasks((prev) => [...prev, data.task]);
      }
      setTaskModal({ open: false, task: null });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save task.");
    } finally {
      setSaving(false);
    }
  }

  async function handleQuickAdd(columnId: string) {
    const title = quickAddTitle.trim();
    if (!title) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/kanban/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...emptyTaskForm(columnId), title }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to add task.");
      setTasks((prev) => [...prev, data.task]);
      setQuickAddTitle("");
      setQuickAddCol(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add task.");
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateFromTemplate(template: TaskTemplate, columnId: string) {
    setSaving(true);
    setError("");
    try {
      const checklist = template.checklistTexts.map((text, idx) => ({
        id: `tpl-${Date.now()}-${idx}`,
        text,
        done: false,
      }));
      const res = await fetch("/api/admin/kanban/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          column_id: columnId,
          title: template.title,
          description: template.description,
          priority: template.priority,
          category: template.category,
          label: template.label,
          estimated_minutes: template.estimated_minutes,
          checklist,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create task from template.");
      setTasks((prev) => [...prev, data.task]);
      setTemplatesOpen(false);
      setNotice(`Created "${template.name}" task. Click it to customize details.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to apply template.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDuplicateTask(formData: TaskFormData) {
    const copy: TaskFormData = {
      ...formData,
      id: undefined,
      title: `${formData.title} (Copy)`.slice(0, 200),
      checklist: formData.checklist.map((c, i) => ({
        ...c,
        id: `dup-${Date.now()}-${i}`,
        done: false,
      })),
    };
    await handleSaveTask(copy);
  }

  async function handleArchiveTask(id: string, archived: boolean) {
    setError("");
    try {
      const res = await fetch("/api/admin/kanban/tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, archived }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to update archive state.");
      setTasks((prev) => prev.map((t) => (t.id === id ? data.task : t)));
      if (taskModal.open && taskModal.task?.id === id) {
        setTaskModal({ open: false, task: null });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to archive task.");
    }
  }

  async function handleArchiveAllDone() {
    const doneActive = activeTasks.filter((t) => columnMap.get(t.column_id)?.is_done);
    if (doneActive.length === 0) return;
    if (!window.confirm(`Archive ${doneActive.length} completed task(s)?`)) return;
    setSaving(true);
    try {
      for (const t of doneActive) {
        await fetch("/api/admin/kanban/tasks", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: t.id, archived: true }),
        });
      }
      await loadBoard();
      setNotice(`Archived ${doneActive.length} completed task(s).`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to archive completed tasks.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteTask(task: KanbanTask) {
    if (!window.confirm(`Delete "${task.title}"? This cannot be undone.`)) return;
    try {
      const res = await fetch("/api/admin/kanban/tasks", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: task.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to delete task.");
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete task.");
    }
  }

  // ── Column CRUD & Reorder ──

  async function handleSaveColumn(formData: {
    title: string;
    color: string;
    wip_limit: number | null;
    is_done: boolean;
  }) {
    setSaving(true);
    setError("");
    try {
      if (columnModal.column) {
        const res = await fetch("/api/admin/kanban/columns", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: columnModal.column.id, ...formData }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to update column.");
        setColumns((prev) =>
          prev.map((c) => (c.id === columnModal.column!.id ? data.column : c)),
        );
      } else {
        const res = await fetch("/api/admin/kanban/columns", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to create column.");
        setColumns((prev) => [...prev, data.column]);
      }
      setColumnModal({ open: false });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save column.");
    } finally {
      setSaving(false);
    }
  }

  async function handleMoveColumn(colIndex: number, direction: -1 | 1) {
    const targetIdx = colIndex + direction;
    if (targetIdx < 0 || targetIdx >= sortedColumns.length) return;
    const reordered = [...sortedColumns];
    const [moved] = reordered.splice(colIndex, 1);
    reordered.splice(targetIdx, 0, moved);
    const updated = reordered.map((c, idx) => ({ ...c, position: idx }));
    setColumns(updated);
    try {
      await fetch("/api/admin/kanban/columns", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order: updated.map((c) => ({ id: c.id, position: c.position })),
        }),
      });
    } catch {
      void loadBoard();
    }
  }

  async function handleDeleteColumn(col: KanbanColumn) {
    const count = tasks.filter((t) => t.column_id === col.id).length;
    if (
      !window.confirm(
        `Delete column "${col.title}"?${count > 0 ? ` This will also delete ${count} task(s).` : ""} This cannot be undone.`,
      )
    ) {
      return;
    }
    try {
      const res = await fetch("/api/admin/kanban/columns", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: col.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to delete column.");
      setColumns((prev) => prev.filter((c) => c.id !== col.id));
      setTasks((prev) => prev.filter((t) => t.column_id !== col.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete column.");
    }
  }

  // ── Task Move (Drag & Drop + Quick Move) ──

  async function moveTaskToColumn(
    taskToMove: KanbanTask,
    targetColumnId: string,
    targetTaskId?: string,
  ) {
    const sourceColumnId = taskToMove.column_id;

    const targetColTasks = activeTasks
      .filter((t) => t.column_id === targetColumnId && t.id !== taskToMove.id)
      .sort((a, b) => a.position - b.position);

    let insertIdx = targetColTasks.length;
    if (targetTaskId) {
      const idx = targetColTasks.findIndex((t) => t.id === targetTaskId);
      if (idx >= 0) insertIdx = idx;
    }

    const updatedTask: KanbanTask = {
      ...taskToMove,
      column_id: targetColumnId,
      position: insertIdx,
    };
    targetColTasks.splice(insertIdx, 0, updatedTask);
    const reindexedTarget = targetColTasks.map((t, idx) => ({ ...t, position: idx }));

    let reindexedSource: KanbanTask[] = [];
    if (sourceColumnId !== targetColumnId) {
      reindexedSource = activeTasks
        .filter((t) => t.column_id === sourceColumnId && t.id !== taskToMove.id)
        .sort((a, b) => a.position - b.position)
        .map((t, idx) => ({ ...t, position: idx }));
    }

    const moves = [...reindexedTarget, ...reindexedSource].map((t) => ({
      id: t.id,
      column_id: t.column_id,
      position: t.position,
    }));

    // Optimistic update
    const updatedMap = new Map([...reindexedTarget, ...reindexedSource].map((t) => [t.id, t]));
    setTasks((prev) => prev.map((t) => updatedMap.get(t.id) ?? t));

    try {
      const res = await fetch("/api/admin/kanban/tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moves }),
      });
      if (!res.ok) throw new Error("Move failed");
    } catch {
      void loadBoard();
    }
  }

  function handleQuickMove(task: KanbanTask, direction: -1 | 1) {
    const currentIdx = sortedColumns.findIndex((c) => c.id === task.column_id);
    const nextCol = sortedColumns[currentIdx + direction];
    if (!nextCol) return;
    void moveTaskToColumn(task, nextCol.id);
  }

  function handleDrop(e: React.DragEvent, targetColumnId: string, targetTaskId?: string) {
    e.preventDefault();
    if (!dragTask) return;
    const moving = dragTask;
    setDragTask(null);
    setDragOverColumn(null);
    void moveTaskToColumn(moving, targetColumnId, targetTaskId);
  }

  // ── Render ──

  if (loading) {
    return (
      <div className="kb-loading">
        <span className="loading-spinner" aria-hidden="true" /> Loading your Kanban workspace…
      </div>
    );
  }

  return (
    <div className="kb-root">
      {/* Header */}
      <div className="kb-header">
        <div>
          <p className="eyebrow">
            <span className="eyebrow-dot" /> Solo Freelancer &amp; Blog Workflow
          </p>
          <h2 className="kb-title">Project Kanban</h2>
          <p className="kb-subtitle">
            Plan blog posts, client deliverables, and SEO tasks with WIP limits and checklists.
          </p>
        </div>
        <div className="kb-header-actions">
          {sortedColumns[0] && (
            <button
              type="button"
              className="button"
              onClick={() =>
                setTaskModal({ open: true, task: emptyTaskForm(sortedColumns[0].id) })
              }
            >
              + New task
            </button>
          )}
          <button
            type="button"
            className="button button-outline"
            onClick={() => setTemplatesOpen(true)}
          >
            📋 Templates
          </button>
          <button
            type="button"
            className="button button-outline"
            onClick={() => setColumnModal({ open: true })}
          >
            + Column
          </button>
          <button type="button" className="button button-outline" onClick={() => void loadBoard()}>
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="kb-stats">
        <div className="kb-stat">
          <span className="kb-stat-value">{stats.total}</span>
          <span className="kb-stat-label">Active tasks</span>
        </div>
        <div className="kb-stat">
          <span className="kb-stat-value kb-stat-green">{stats.done}</span>
          <span className="kb-stat-label">Done</span>
        </div>
        <div className="kb-stat">
          <span className="kb-stat-value kb-stat-orange">{stats.dueSoon}</span>
          <span className="kb-stat-label">Due ≤ 48h</span>
        </div>
        <div className="kb-stat">
          <span className="kb-stat-value kb-stat-red">{stats.overdue}</span>
          <span className="kb-stat-label">Overdue</span>
        </div>
        <div className="kb-stat">
          <span className="kb-stat-value kb-stat-orange">{stats.urgent}</span>
          <span className="kb-stat-label">Urgent</span>
        </div>
        <div className="kb-stat">
          <span className="kb-stat-value">{stats.remainingHours}h</span>
          <span className="kb-stat-label">Est. remaining</span>
        </div>
      </div>

      {/* Toolbar: View switcher + Filters */}
      <div className="kb-toolbar">
        <div className="kb-view-switch" role="tablist" aria-label="Kanban view mode">
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === "board"}
            className={`kb-view-btn${viewMode === "board" ? " is-active" : ""}`}
            onClick={() => setViewMode("board")}
          >
            Board
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === "list"}
            className={`kb-view-btn${viewMode === "list" ? " is-active" : ""}`}
            onClick={() => setViewMode("list")}
          >
            List
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === "archive"}
            className={`kb-view-btn${viewMode === "archive" ? " is-active" : ""}`}
            onClick={() => setViewMode("archive")}
          >
            Archive ({archivedTasks.length})
          </button>
        </div>

        {viewMode !== "archive" && (
          <div className="kb-filters">
            <input
              type="search"
              className="kb-search"
              placeholder="Search tasks, tags, slugs…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search tasks"
            />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as TaskCategory | "all")}
              aria-label="Filter by category"
            >
              <option value="all">All categories</option>
              {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
                <option key={key} value={key}>
                  {cfg.icon} {cfg.label}
                </option>
              ))}
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as Priority | "all")}
              aria-label="Filter by priority"
            >
              <option value="all">All priorities</option>
              <option value="urgent">⚡ Urgent</option>
              <option value="high">↑ High</option>
              <option value="medium">→ Medium</option>
              <option value="low">↓ Low</option>
            </select>
            <select
              value={dueFilter}
              onChange={(e) => setDueFilter(e.target.value as DueFilter)}
              aria-label="Filter by due date"
            >
              <option value="all">Any due date</option>
              <option value="focus">🎯 Today&apos;s Focus</option>
              <option value="overdue">🔴 Overdue</option>
              <option value="today">📅 Due today</option>
              <option value="week">🗓️ Due this week</option>
            </select>
            {hasActiveFilters && (
              <button
                type="button"
                className="text-button"
                onClick={() => {
                  setSearch("");
                  setCategoryFilter("all");
                  setPriorityFilter("all");
                  setDueFilter("all");
                }}
              >
                Clear
              </button>
            )}
          </div>
        )}
      </div>

      {error && (
        <p className="admin-alert is-error" role="alert">
          {error}{" "}
          <button type="button" className="text-button" onClick={() => setError("")}>
            Dismiss
          </button>
        </p>
      )}
      {notice && (
        <p className="admin-alert is-success" role="status">
          {notice}{" "}
          <button type="button" className="text-button" onClick={() => setNotice("")}>
            Dismiss
          </button>
        </p>
      )}

      {/* BOARD VIEW */}
      {viewMode === "board" && (
        <div className="kb-board" role="region" aria-label="Kanban board">
          {sortedColumns.map((col, colIndex) => {
            const totalInCol = activeTasks.filter((t) => t.column_id === col.id).length;
            const colTasks = filteredTasks
              .filter((t) => t.column_id === col.id)
              .sort((a, b) => a.position - b.position);
            const overWip = Boolean(col.wip_limit && totalInCol > col.wip_limit);

            return (
              <div
                key={col.id}
                className={`kb-column${dragOverColumn === col.id ? " is-drag-over" : ""}${
                  overWip ? " is-over-wip" : ""
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverColumn(col.id);
                }}
                onDrop={(e) => handleDrop(e, col.id)}
              >
                <div className="kb-col-header">
                  <div className="kb-col-header-left">
                    <span className="kb-col-dot" style={{ background: col.color }} />
                    <span className="kb-col-title">{col.title}</span>
                    <span className={`kb-col-count${overWip ? " is-over-wip" : ""}`}>
                      {col.wip_limit ? `${totalInCol}/${col.wip_limit}` : totalInCol}
                    </span>
                    {col.is_done && <span className="kb-done-badge">Done</span>}
                  </div>
                  <div className="kb-col-actions">
                    {colIndex > 0 && (
                      <button
                        type="button"
                        className="kb-icon-btn"
                        title="Move column left"
                        aria-label="Move column left"
                        onClick={() => void handleMoveColumn(colIndex, -1)}
                      >
                        ◀
                      </button>
                    )}
                    {colIndex < sortedColumns.length - 1 && (
                      <button
                        type="button"
                        className="kb-icon-btn"
                        title="Move column right"
                        aria-label="Move column right"
                        onClick={() => void handleMoveColumn(colIndex, 1)}
                      >
                        ▶
                      </button>
                    )}
                    <button
                      type="button"
                      className="kb-icon-btn"
                      title="Edit column"
                      aria-label="Edit column"
                      onClick={() => setColumnModal({ open: true, column: col })}
                    >
                      ✏️
                    </button>
                    <button
                      type="button"
                      className="kb-icon-btn kb-icon-btn-danger"
                      title="Delete column"
                      aria-label="Delete column"
                      onClick={() => void handleDeleteColumn(col)}
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {overWip && (
                  <div className="kb-wip-warning">
                    ⚠️ Over WIP limit ({totalInCol}/{col.wip_limit}) — finish one before starting more
                  </div>
                )}

                <div className="kb-col-accent" style={{ background: col.color }} />

                {col.is_done && totalInCol > 0 && (
                  <button
                    type="button"
                    className="kb-archive-done-btn"
                    onClick={() => void handleArchiveAllDone()}
                  >
                    📦 Archive {totalInCol} done task{totalInCol > 1 ? "s" : ""}
                  </button>
                )}

                <div className="kb-task-list" role="list">
                  {colTasks.length === 0 && (
                    <div
                      className="kb-col-empty"
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragOverColumn(col.id);
                      }}
                      onDrop={(e) => handleDrop(e, col.id)}
                    >
                      {hasActiveFilters ? "No matching tasks" : "Drop tasks here"}
                    </div>
                  )}
                  {colTasks.map((task) => (
                    <div
                      key={task.id}
                      role="listitem"
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragOverColumn(col.id);
                      }}
                      onDrop={(e) => {
                        e.stopPropagation();
                        handleDrop(e, col.id, task.id);
                      }}
                    >
                      <TaskCard
                        task={task}
                        canMoveLeft={colIndex > 0}
                        canMoveRight={colIndex < sortedColumns.length - 1}
                        isDoneCol={col.is_done}
                        isDragging={dragTask?.id === task.id}
                        onEdit={(t) =>
                          setTaskModal({
                            open: true,
                            task: {
                              id: t.id,
                              column_id: t.column_id,
                              title: t.title,
                              description: t.description,
                              priority: t.priority,
                              category: t.category,
                              label: t.label,
                              due_date: t.due_date,
                              estimated_minutes: t.estimated_minutes,
                              checklist: t.checklist ?? [],
                              linked_article_slug: t.linked_article_slug ?? "",
                              archived: t.archived,
                            },
                          })
                        }
                        onDelete={(t) => void handleDeleteTask(t)}
                        onArchive={(id, arch) => void handleArchiveTask(id, arch)}
                        onQuickMove={handleQuickMove}
                        onDragStart={setDragTask}
                        onDragEnd={() => {
                          setDragTask(null);
                          setDragOverColumn(null);
                        }}
                      />
                    </div>
                  ))}
                </div>

                {/* Quick-add or detailed add */}
                {quickAddCol === col.id ? (
                  <form
                    className="kb-quick-add-form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      void handleQuickAdd(col.id);
                    }}
                  >
                    <input
                      autoFocus
                      maxLength={200}
                      placeholder="Task title… (Enter to save)"
                      value={quickAddTitle}
                      onChange={(e) => setQuickAddTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") {
                          setQuickAddCol(null);
                          setQuickAddTitle("");
                        }
                      }}
                    />
                    <div className="kb-quick-add-actions">
                      <button
                        type="submit"
                        className="button"
                        disabled={saving || !quickAddTitle.trim()}
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        className="text-button"
                        onClick={() => {
                          setQuickAddCol(null);
                          setQuickAddTitle("");
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="kb-col-footer-actions">
                    <button
                      type="button"
                      className="kb-add-task-btn"
                      onClick={() => {
                        setQuickAddCol(col.id);
                        setQuickAddTitle("");
                      }}
                    >
                      + Quick add
                    </button>
                    <button
                      type="button"
                      className="kb-add-task-btn kb-add-detail-btn"
                      title="Open full task form"
                      onClick={() =>
                        setTaskModal({ open: true, task: emptyTaskForm(col.id) })
                      }
                    >
                      + Detailed
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          <button
            type="button"
            className="kb-add-column"
            onClick={() => setColumnModal({ open: true })}
          >
            <span>+</span>
            <span>New column</span>
          </button>
        </div>
      )}

      {/* LIST VIEW */}
      {viewMode === "list" && (
        <div className="kb-list-wrap">
          {filteredTasks.length === 0 ? (
            <p className="admin-empty">No tasks match your current filters.</p>
          ) : (
            <table className="kb-list-table">
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Column</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Due</th>
                  <th>Est.</th>
                  <th>Subtasks</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map((t) => {
                  const col = columnMap.get(t.column_id);
                  const cat = CATEGORY_CONFIG[t.category] ?? CATEGORY_CONFIG.blog;
                  const p = PRIORITY_CONFIG[t.priority] ?? PRIORITY_CONFIG.medium;
                  const overdue = isOverdue(t.due_date, Boolean(col?.is_done));
                  const chk = Array.isArray(t.checklist) ? t.checklist : [];
                  const chkDone = chk.filter((i) => i.done).length;
                  return (
                    <tr key={t.id}>
                      <td>
                        <button
                          type="button"
                          className="kb-list-title-btn"
                          onClick={() =>
                            setTaskModal({
                              open: true,
                              task: {
                                id: t.id,
                                column_id: t.column_id,
                                title: t.title,
                                description: t.description,
                                priority: t.priority,
                                category: t.category,
                                label: t.label,
                                due_date: t.due_date,
                                estimated_minutes: t.estimated_minutes,
                                checklist: chk,
                                linked_article_slug: t.linked_article_slug ?? "",
                                archived: t.archived,
                              },
                            })
                          }
                        >
                          {t.title}
                        </button>
                        {t.label && <span className="kb-task-label">{t.label}</span>}
                      </td>
                      <td>
                        <select
                          className="kb-list-col-select"
                          value={t.column_id}
                          onChange={(e) => void moveTaskToColumn(t, e.target.value)}
                          aria-label={`Change column for ${t.title}`}
                        >
                          {sortedColumns.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.title}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <span className={`kb-cat-pill ${cat.badgeClass}`}>
                          {cat.icon} {cat.label}
                        </span>
                      </td>
                      <td>
                        <span className={`kb-priority-pill ${p.className}`}>
                          {p.icon} {p.label}
                        </span>
                      </td>
                      <td className={overdue ? "kb-due-date is-overdue" : ""}>
                        {t.due_date ? formatDate(t.due_date) : "—"}
                      </td>
                      <td>{t.estimated_minutes ? formatMinutes(t.estimated_minutes) : "—"}</td>
                      <td>{chk.length > 0 ? `${chkDone}/${chk.length}` : "—"}</td>
                      <td>
                        <div className="kb-list-actions">
                          <button
                            type="button"
                            className="kb-icon-btn"
                            title="Archive"
                            onClick={() => void handleArchiveTask(t.id, true)}
                          >
                            📦
                          </button>
                          <button
                            type="button"
                            className="kb-icon-btn kb-icon-btn-danger"
                            title="Delete"
                            onClick={() => void handleDeleteTask(t)}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ARCHIVE VIEW */}
      {viewMode === "archive" && (
        <div className="kb-archive-wrap">
          {archivedTasks.length === 0 ? (
            <p className="admin-empty">
              No archived tasks yet. Archive completed cards from the Board or List view to keep your
              workspace clean.
            </p>
          ) : (
            <div className="kb-archive-list">
              {archivedTasks.map((t) => {
                const cat = CATEGORY_CONFIG[t.category] ?? CATEGORY_CONFIG.blog;
                return (
                  <div key={t.id} className="kb-archive-row">
                    <div>
                      <span className={`kb-cat-pill ${cat.badgeClass}`}>
                        {cat.icon} {cat.label}
                      </span>
                      <h4>{t.title}</h4>
                      {t.description && <p>{t.description}</p>}
                    </div>
                    <div className="kb-archive-actions">
                      <button
                        type="button"
                        className="button button-outline"
                        onClick={() => void handleArchiveTask(t.id, false)}
                      >
                        Restore
                      </button>
                      <button
                        type="button"
                        className="button button-danger"
                        onClick={() => void handleDeleteTask(t)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {taskModal.open && taskModal.task && (
        <TaskModal
          task={taskModal.task}
          columns={sortedColumns}
          articleSlugs={articleSlugs}
          onSave={(data) => void handleSaveTask(data)}
          onArchive={(id, arch) => void handleArchiveTask(id, arch)}
          onDuplicate={(data) => void handleDuplicateTask(data)}
          onClose={() => setTaskModal({ open: false, task: null })}
          saving={saving}
        />
      )}
      {columnModal.open && (
        <ColumnModal
          column={columnModal.column}
          onSave={(data) => void handleSaveColumn(data)}
          onClose={() => setColumnModal({ open: false })}
          saving={saving}
        />
      )}
      {templatesOpen && (
        <TemplatesModal
          columns={sortedColumns}
          onSelectTemplate={(tpl, colId) => void handleCreateFromTemplate(tpl, colId)}
          onClose={() => setTemplatesOpen(false)}
          saving={saving}
        />
      )}
    </div>
  );
}
