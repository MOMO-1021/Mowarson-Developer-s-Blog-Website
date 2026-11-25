"use client";

import { useEffect, useRef, useState } from "react";
import {
  CATEGORY_CONFIG,
  COLUMN_COLORS,
  TASK_TEMPLATES,
  formatMinutes,
  type ChecklistItem,
  type KanbanColumn,
  type KanbanTask,
  type Priority,
  type TaskCategory,
  type TaskTemplate,
} from "@/lib/kanban";

export type TaskFormData = Omit<
  KanbanTask,
  "id" | "position" | "archived" | "completed_at" | "created_at" | "updated_at"
> & {
  id?: string;
  archived?: boolean;
};

export function emptyTaskForm(columnId: string): TaskFormData {
  return {
    column_id: columnId,
    title: "",
    description: "",
    priority: "medium",
    category: "blog",
    label: "",
    due_date: null,
    estimated_minutes: null,
    checklist: [],
    linked_article_slug: "",
  };
}

const ESTIMATE_PRESETS = [15, 30, 60, 120, 240];

export function TaskModal({
  task,
  columns,
  articleSlugs,
  onSave,
  onArchive,
  onDuplicate,
  onClose,
  saving,
}: {
  task: TaskFormData;
  columns: KanbanColumn[];
  articleSlugs: string[];
  onSave: (data: TaskFormData) => void;
  onArchive?: (id: string, archived: boolean) => void;
  onDuplicate?: (data: TaskFormData) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<TaskFormData>({
    ...task,
    checklist: Array.isArray(task.checklist) ? task.checklist : [],
  });
  const [newCheckItem, setNewCheckItem] = useState("");
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  function addChecklistItem() {
    const text = newCheckItem.trim();
    if (!text) return;
    const item: ChecklistItem = {
      id: `chk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      text: text.slice(0, 200),
      done: false,
    };
    setForm((prev) => ({ ...prev, checklist: [...prev.checklist, item] }));
    setNewCheckItem("");
  }

  function toggleChecklistItem(id: string) {
    setForm((prev) => ({
      ...prev,
      checklist: prev.checklist.map((item) =>
        item.id === id ? { ...item, done: !item.done } : item,
      ),
    }));
  }

  function removeChecklistItem(id: string) {
    setForm((prev) => ({
      ...prev,
      checklist: prev.checklist.filter((item) => item.id !== id),
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    onSave(form);
  }

  const doneCount = form.checklist.filter((i) => i.done).length;

  return (
    <div
      className="kb-modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Task editor"
    >
      <div className="kb-modal kb-modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="kb-modal-header">
          <h3>{form.id ? "Edit Task" : "New Task"}</h3>
          <button type="button" className="kb-modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="kb-modal-form">
          <label>
            Task title <span className="kb-required">*</span>
            <input
              ref={titleRef}
              required
              maxLength={200}
              value={form.title}
              placeholder="e.g. Write Next.js caching guide"
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </label>

          <label>
            Notes &amp; context
            <textarea
              rows={3}
              maxLength={4000}
              value={form.description}
              placeholder="Outline, client requirements, links, or acceptance criteria…"
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </label>

          <div className="kb-modal-row">
            <label>
              Column
              <select
                value={form.column_id}
                onChange={(e) => setForm({ ...form, column_id: e.target.value })}
              >
                {columns.map((col) => (
                  <option key={col.id} value={col.id}>
                    {col.title}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Priority
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })}
              >
                <option value="low">↓ Low</option>
                <option value="medium">→ Medium</option>
                <option value="high">↑ High</option>
                <option value="urgent">⚡ Urgent</option>
              </select>
            </label>
          </div>

          <div className="kb-modal-row">
            <label>
              Workflow category
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as TaskCategory })}
              >
                {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
                  <option key={key} value={key}>
                    {cfg.icon} {cfg.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Tag / Label
              <input
                maxLength={40}
                value={form.label}
                placeholder="e.g. Tutorial, Client A, Q4…"
                onChange={(e) => setForm({ ...form, label: e.target.value })}
              />
            </label>
          </div>

          <div className="kb-modal-row">
            <label>
              Due date
              <input
                type="date"
                value={form.due_date ?? ""}
                onChange={(e) => setForm({ ...form, due_date: e.target.value || null })}
              />
            </label>

            <label>
              Time estimate (minutes)
              <input
                type="number"
                min={0}
                max={10000}
                placeholder="e.g. 90"
                value={form.estimated_minutes ?? ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    estimated_minutes: e.target.value ? Number(e.target.value) : null,
                  })
                }
              />
              <div className="kb-preset-chips">
                {ESTIMATE_PRESETS.map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    className={`kb-chip${form.estimated_minutes === mins ? " is-active" : ""}`}
                    onClick={() => setForm({ ...form, estimated_minutes: mins })}
                  >
                    {formatMinutes(mins)}
                  </button>
                ))}
              </div>
            </label>
          </div>

          <label>
            Linked blog article slug (optional)
            <input
              list="kb-article-slugs"
              maxLength={120}
              value={form.linked_article_slug}
              placeholder="e.g. react-server-components-guide"
              onChange={(e) => setForm({ ...form, linked_article_slug: e.target.value })}
            />
            <datalist id="kb-article-slugs">
              {articleSlugs.map((slug) => (
                <option key={slug} value={slug} />
              ))}
            </datalist>
          </label>

          {/* Subtask Checklist */}
          <div className="kb-checklist-box">
            <div className="kb-checklist-header">
              <span>
                Subtasks{" "}
                {form.checklist.length > 0 && (
                  <small>
                    ({doneCount}/{form.checklist.length})
                  </small>
                )}
              </span>
            </div>

            {form.checklist.length > 0 && (
              <ul className="kb-checklist-items">
                {form.checklist.map((item) => (
                  <li key={item.id} className={item.done ? "is-done" : ""}>
                    <label className="kb-check-row">
                      <input
                        type="checkbox"
                        checked={item.done}
                        onChange={() => toggleChecklistItem(item.id)}
                      />
                      <span>{item.text}</span>
                    </label>
                    <button
                      type="button"
                      className="kb-icon-btn kb-icon-btn-danger"
                      onClick={() => removeChecklistItem(item.id)}
                      aria-label={`Remove subtask ${item.text}`}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div className="kb-checklist-add">
              <input
                type="text"
                maxLength={200}
                value={newCheckItem}
                placeholder="Add a subtask step…"
                onChange={(e) => setNewCheckItem(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addChecklistItem();
                  }
                }}
              />
              <button
                type="button"
                className="button button-outline"
                onClick={addChecklistItem}
                disabled={!newCheckItem.trim()}
              >
                Add
              </button>
            </div>
          </div>

          <div className="kb-modal-footer kb-modal-footer-split">
            <div className="kb-modal-footer-left">
              {form.id && onArchive && (
                <button
                  type="button"
                  className="button button-outline"
                  disabled={saving}
                  onClick={() => onArchive(form.id!, !form.archived)}
                >
                  {form.archived ? "Restore" : "Archive"}
                </button>
              )}
              {form.id && onDuplicate && (
                <button
                  type="button"
                  className="button button-outline"
                  disabled={saving}
                  onClick={() => onDuplicate(form)}
                >
                  Duplicate
                </button>
              )}
            </div>
            <div className="kb-modal-footer-right">
              <button type="button" className="button button-outline" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="button" disabled={saving || !form.title.trim()}>
                {saving ? "Saving…" : form.id ? "Save changes" : "Add task"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export function ColumnModal({
  column,
  onSave,
  onClose,
  saving,
}: {
  column?: KanbanColumn;
  onSave: (data: {
    title: string;
    color: string;
    wip_limit: number | null;
    is_done: boolean;
  }) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [title, setTitle] = useState(column?.title ?? "");
  const [color, setColor] = useState(column?.color ?? COLUMN_COLORS[0]);
  const [wipLimit, setWipLimit] = useState<string>(
    column?.wip_limit ? String(column.wip_limit) : "",
  );
  const [isDone, setIsDone] = useState<boolean>(column?.is_done ?? false);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="kb-modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Column editor"
    >
      <div className="kb-modal kb-modal-sm" onClick={(e) => e.stopPropagation()}>
        <div className="kb-modal-header">
          <h3>{column ? "Edit Column" : "New Column"}</h3>
          <button type="button" className="kb-modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!title.trim()) return;
            const parsedWip = wipLimit.trim() ? Number(wipLimit) : null;
            onSave({
              title: title.trim(),
              color,
              wip_limit: parsedWip && parsedWip > 0 ? Math.round(parsedWip) : null,
              is_done: isDone,
            });
          }}
          className="kb-modal-form"
        >
          <label>
            Column name <span className="kb-required">*</span>
            <input
              ref={titleRef}
              required
              maxLength={60}
              value={title}
              placeholder="e.g. Research, Writing, Client Review…"
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>

          <label>
            WIP Limit (optional)
            <input
              type="number"
              min={1}
              max={99}
              value={wipLimit}
              placeholder="Leave blank for unlimited"
              onChange={(e) => setWipLimit(e.target.value)}
            />
          </label>

          <label className="kb-checkbox-label">
            <input
              type="checkbox"
              checked={isDone}
              onChange={(e) => setIsDone(e.target.checked)}
            />
            <span>Mark as completion (&ldquo;Done&rdquo;) column</span>
          </label>

          <label>
            Column color
            <div className="kb-color-swatches">
              {COLUMN_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`kb-color-swatch${color === c ? " is-active" : ""}`}
                  style={{ background: c }}
                  onClick={() => setColor(c)}
                  aria-label={`Color ${c}`}
                />
              ))}
            </div>
          </label>

          <div className="kb-modal-footer">
            <button type="button" className="button button-outline" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="button" disabled={saving || !title.trim()}>
              {saving ? "Saving…" : column ? "Save changes" : "Add column"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function TemplatesModal({
  columns,
  onSelectTemplate,
  onClose,
  saving,
}: {
  columns: KanbanColumn[];
  onSelectTemplate: (template: TaskTemplate, columnId: string) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [targetColumnId, setTargetColumnId] = useState(columns[0]?.id ?? "");

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="kb-modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Workflow templates"
    >
      <div className="kb-modal kb-modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="kb-modal-header">
          <div>
            <h3>Solo Blogger &amp; Freelancer Templates</h3>
            <p className="kb-modal-sub">
              Create a ready-to-go task with built-in checklists and time estimates.
            </p>
          </div>
          <button type="button" className="kb-modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="kb-template-col-picker">
          <label>
            Add into column:
            <select
              value={targetColumnId}
              onChange={(e) => setTargetColumnId(e.target.value)}
            >
              {columns.map((col) => (
                <option key={col.id} value={col.id}>
                  {col.title}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="kb-templates-grid">
          {TASK_TEMPLATES.map((tpl) => {
            const cat = CATEGORY_CONFIG[tpl.category];
            return (
              <div key={tpl.id} className="kb-template-card">
                <div className="kb-template-top">
                  <span className={`kb-cat-pill ${cat.badgeClass}`}>
                    {cat.icon} {cat.label}
                  </span>
                  <span className="kb-est-badge">⏱ {formatMinutes(tpl.estimated_minutes)}</span>
                </div>
                <h4>{tpl.name}</h4>
                <p>{tpl.summary}</p>
                <ul className="kb-template-steps">
                  {tpl.checklistTexts.slice(0, 4).map((step) => (
                    <li key={step}>✓ {step}</li>
                  ))}
                  {tpl.checklistTexts.length > 4 && (
                    <li className="kb-template-more">
                      +{tpl.checklistTexts.length - 4} more steps
                    </li>
                  )}
                </ul>
                <button
                  type="button"
                  className="button"
                  disabled={saving || !targetColumnId}
                  onClick={() => onSelectTemplate(tpl, targetColumnId)}
                >
                  Use template
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
