"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import { headingToId } from "@/lib/blog-taxonomy";

interface StatGridData {
  type: "stat-grid";
  title?: string;
  items: Array<{ label: string; value: string; caption?: string }>;
}

interface ProcessStepsData {
  type: "process-steps";
  title?: string;
  steps: Array<{ label: string; detail?: string }>;
}

interface ComparisonData {
  type: "comparison";
  title?: string;
  leftTitle: string;
  leftItems: string[];
  rightTitle: string;
  rightItems: string[];
}

interface BarChartData {
  type: "bar-chart";
  title?: string;
  items: Array<{ label: string; value: number; display?: string }>;
}

type InfographicData = StatGridData | ProcessStepsData | ComparisonData | BarChartData;

function InfographicBlock({ raw }: { raw: string }) {
  let data: InfographicData | null = null;
  try {
    data = JSON.parse(raw) as InfographicData;
  } catch {
    return (
      <div className="info-card info-error">
        <strong>Infographic syntax note:</strong> Check JSON formatting inside the{" "}
        <code>```infographic</code> block.
      </div>
    );
  }

  if (!data || !("type" in data)) return null;

  if (data.type === "stat-grid" && Array.isArray(data.items)) {
    return (
      <figure className="info-card" aria-label={data.title ?? "Statistics infographic"}>
        {data.title && <figcaption className="info-title">{data.title}</figcaption>}
        <div className="info-stat-grid">
          {data.items.map((item, idx) => (
            <div key={idx} className="info-stat-item">
              <span className="info-stat-value">{item.value}</span>
              <span className="info-stat-label">{item.label}</span>
              {item.caption && <span className="info-stat-caption">{item.caption}</span>}
            </div>
          ))}
        </div>
      </figure>
    );
  }

  if (data.type === "process-steps" && Array.isArray(data.steps)) {
    return (
      <figure className="info-card" aria-label={data.title ?? "Process infographic"}>
        {data.title && <figcaption className="info-title">{data.title}</figcaption>}
        <div className="info-steps">
          {data.steps.map((step, idx) => (
            <div key={idx} className="info-step">
              <span className="info-step-num">{idx + 1}</span>
              <div className="info-step-body">
                <strong>{step.label}</strong>
                {step.detail && <p>{step.detail}</p>}
              </div>
            </div>
          ))}
        </div>
      </figure>
    );
  }

  if (data.type === "comparison") {
    return (
      <figure className="info-card" aria-label={data.title ?? "Comparison infographic"}>
        {data.title && <figcaption className="info-title">{data.title}</figcaption>}
        <div className="info-compare-grid">
          <div className="info-compare-col is-left">
            <h4>{data.leftTitle || "Before"}</h4>
            <ul>
              {(data.leftItems ?? []).map((item, idx) => (
                <li key={idx}>✕ {item}</li>
              ))}
            </ul>
          </div>
          <div className="info-compare-col is-right">
            <h4>{data.rightTitle || "After"}</h4>
            <ul>
              {(data.rightItems ?? []).map((item, idx) => (
                <li key={idx}>✓ {item}</li>
              ))}
            </ul>
          </div>
        </div>
      </figure>
    );
  }

  if (data.type === "bar-chart" && Array.isArray(data.items)) {
    const max = Math.max(100, ...data.items.map((i) => Number(i.value) || 0));
    return (
      <figure className="info-card" aria-label={data.title ?? "Bar chart infographic"}>
        {data.title && <figcaption className="info-title">{data.title}</figcaption>}
        <div className="info-bars">
          {data.items.map((item, idx) => {
            const pct = Math.max(0, Math.min(100, Math.round(((Number(item.value) || 0) / max) * 100)));
            return (
              <div key={idx} className="info-bar-row">
                <div className="info-bar-head">
                  <span>{item.label}</span>
                  <strong>{item.display ?? item.value}</strong>
                </div>
                <div className="info-bar-track">
                  <div className="info-bar-fill" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </figure>
    );
  }

  return null;
}

function CalloutBlock({ raw }: { raw: string }) {
  const lines = raw.split(/\r?\n/);
  let type = "takeaway";
  let title = "Key Takeaway";
  const bodyLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith("type:")) {
      type = line.slice(5).trim().toLowerCase() || "takeaway";
    } else if (line.startsWith("title:")) {
      title = line.slice(6).trim() || "Note";
    } else if (line.startsWith("body:")) {
      bodyLines.push(line.slice(5).trim());
    } else if (line.trim()) {
      bodyLines.push(line.trim());
    }
  }

  const icon =
    type === "warning" ? "⚠️" : type === "tip" ? "💡" : type === "info" ? "ℹ️" : "✨";

  return (
    <aside className={`post-callout is-${type}`} role="note">
      <div className="post-callout-title">
        <span aria-hidden="true">{icon}</span> {title}
      </div>
      <p>{bodyLines.join(" ")}</p>
    </aside>
  );
}

function extractNodeText(children: React.ReactNode): string {
  if (typeof children === "string" || typeof children === "number") return String(children);
  if (Array.isArray(children)) return children.map(extractNodeText).join("");
  if (React.isValidElement<{ children?: React.ReactNode }>(children)) {
    return extractNodeText(children.props.children);
  }
  return "";
}

export function ArticleMarkdown({ content }: { content: string }) {
  return (
    <ReactMarkdown
      components={{
        h2({ children }) {
          const id = headingToId(extractNodeText(children));
          return (
            <h2 id={id}>
              {children}
              {id && (
                <a className="heading-anchor" href={`#${id}`} aria-label="Link to section">
                  #
                </a>
              )}
            </h2>
          );
        },
        h3({ children }) {
          const id = headingToId(extractNodeText(children));
          return <h3 id={id}>{children}</h3>;
        },
        pre({ children }) {
          if (React.isValidElement<{ className?: string; children?: React.ReactNode }>(children)) {
            const cls = children.props.className ?? "";
            const raw = extractNodeText(children.props.children).trim();
            if (cls.includes("language-infographic")) {
              return <InfographicBlock raw={raw} />;
            }
            if (cls.includes("language-callout")) {
              return <CalloutBlock raw={raw} />;
            }
          }
          return <pre>{children}</pre>;
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
