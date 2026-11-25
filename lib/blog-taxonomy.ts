export const postCategories = [
  "web-design",
  "growth",
  "strategy",
  "brand-positioning",
] as const;

export type PostCategory = (typeof postCategories)[number];

export const postFormats = [
  "guide",
  "playbook",
  "case-study",
  "field-note",
  "checklist",
] as const;

export type PostFormat = (typeof postFormats)[number];

export const CATEGORY_META: Record<
  PostCategory,
  { label: string; slugPrefix: string; codePrefix: string; description: string }
> = {
  "web-design": {
    label: "Web design",
    slugPrefix: "wd-",
    codePrefix: "WD",
    description: "UX, conversion-focused layouts, performance, and frontend craft.",
  },
  growth: {
    label: "Growth & marketing",
    slugPrefix: "gr-",
    codePrefix: "GR",
    description: "SEO, content distribution, lead generation, and analytics.",
  },
  strategy: {
    label: "Strategy",
    slugPrefix: "st-",
    codePrefix: "ST",
    description: "Solo freelancing systems, roadmaps, and business decisions.",
  },
  "brand-positioning": {
    label: "Brand positioning & messaging",
    slugPrefix: "bp-",
    codePrefix: "BP",
    description: "Value propositions, audience clarity, and persuasive copy.",
  },
};

export const FORMAT_LABELS: Record<PostFormat, string> = {
  guide: "Guide",
  playbook: "Playbook",
  "case-study": "Case Study",
  "field-note": "Field Note",
  checklist: "Checklist",
};

export interface TocHeading {
  id: string;
  text: string;
  level: 2 | 3;
}

export function headingToId(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function extractHeadings(markdown: string): TocHeading[] {
  const headings: TocHeading[] = [];
  const lines = markdown.split(/\r?\n/);
  let inCodeFence = false;

  for (const line of lines) {
    if (/^```/.test(line.trim())) {
      inCodeFence = !inCodeFence;
      continue;
    }
    if (inCodeFence) continue;
    const match = line.match(/^(#{2,3})\s+(.+)$/);
    if (!match) continue;
    const level = match[1].length as 2 | 3;
    const text = match[2].replace(/[*_`~]/g, "").trim();
    const id = headingToId(text);
    if (text && id) {
      headings.push({ id, text, level });
    }
  }
  return headings;
}

export function buildPrefixedSlug(title: string, category: PostCategory): string {
  const prefix = CATEGORY_META[category]?.slugPrefix ?? "";
  const base = title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  if (!base) return "";
  const cleanBase = base.startsWith(prefix) ? base.slice(prefix.length) : base;
  return `${prefix}${cleanBase}`.slice(0, 80).replace(/-$/, "");
}

export const POST_FORMAT_TEMPLATES: Record<PostFormat, string> = {
  guide: `\`\`\`callout
type: takeaway
title: Key Takeaway (TL;DR)
body: Summarize the single biggest insight your reader should remember in 1-2 sentences.
\`\`\`

## Why this matters

Explain the real problem your reader is facing and what changes once they solve it.

## The core framework

\`\`\`infographic
{
  "type": "process-steps",
  "title": "3-Step Framework",
  "steps": [
    { "label": "Step 1: Clarify", "detail": "Define the single audience & outcome." },
    { "label": "Step 2: Build", "detail": "Create the simplest version that proves value." },
    { "label": "Step 3: Refine", "detail": "Measure results and iterate." }
  ]
}
\`\`\`

## Step-by-step walkthrough

### 1. Start with the foundation

Share specific, actionable guidance.

### 2. Avoid common pitfalls

\`\`\`callout
type: warning
title: Watch out
body: Call out the #1 mistake beginners make here and how to avoid it.
\`\`\`

## Final thoughts

Wrap up with a concise summary and one clear next action.
`,
  playbook: `\`\`\`callout
type: takeaway
title: Playbook Goal
body: State the exact outcome this repeatable playbook achieves and how long it takes.
\`\`\`

## When to use this playbook

Describe the trigger or situation where this workflow shines.

## At-a-glance metrics

\`\`\`infographic
{
  "type": "stat-grid",
  "title": "Expected Impact",
  "items": [
    { "label": "Time to execute", "value": "45 min", "caption": "Per cycle" },
    { "label": "Key bottleneck", "value": "Clarity", "caption": "Solved upfront" },
    { "label": "Consistency", "value": "100%", "caption": "Repeatable checklist" }
  ]
}
\`\`\`

## The exact steps

1. **Prepare:** Gather inputs and context.
2. **Execute:** Follow the core sequence.
3. **Verify:** Check quality before shipping.

## Next step

Put this playbook into your next sprint and track the result.
`,
  "case-study": `\`\`\`callout
type: takeaway
title: Result Snapshot
body: Summarize the before/after transformation in one clear sentence.
\`\`\`

## The starting point (Before)

Describe the initial challenge, constraints, and goals.

## Before vs. After

\`\`\`infographic
{
  "type": "comparison",
  "title": "What Changed",
  "leftTitle": "Before",
  "leftItems": [
    "Unclear value proposition",
    "High bounce rate on landing page",
    "Manual, inconsistent workflow"
  ],
  "rightTitle": "After",
  "rightItems": [
    "Sharp, audience-specific headline",
    "Clear call-to-action above the fold",
    "Repeatable system with measurable leads"
  ]
}
\`\`\`

## What we did

Walk through the key decisions and trade-offs.

## Lessons you can apply

Share 2-3 takeaways readers can use on their own projects.
`,
  "field-note": `## What I noticed

Share a quick, candid observation from your learning or client work.

## Why it clicked

Explain the insight behind the observation.

\`\`\`callout
type: tip
title: Practical Takeaway
body: Turn the observation into one concrete habit or rule of thumb.
\`\`\`

## What I'm testing next

Share your next experiment or question for readers.
`,
  checklist: `\`\`\`callout
type: takeaway
title: How to use this checklist
body: Run through these items before you publish or ship.
\`\`\`

## Core checklist

- [ ] **Clarity:** Does the headline state who it's for and the outcome?
- [ ] **Structure:** Are headings scannable with short paragraphs?
- [ ] **Proof:** Did you include a concrete example or visual?
- [ ] **SEO:** Are title, excerpt, and slug clean and descriptive?
- [ ] **Next step:** Is there a clear call-to-action at the end?

## Impact breakdown

\`\`\`infographic
{
  "type": "bar-chart",
  "title": "Where Readers Drop Off",
  "items": [
    { "label": "Weak headline", "value": 85, "display": "85%" },
    { "label": "Wall of text", "value": 68, "display": "68%" },
    { "label": "No clear next step", "value": 52, "display": "52%" }
  ]
}
\`\`\`
`,
};

export const INFOGRAPHIC_SNIPPETS = {
  "stat-grid": `\`\`\`infographic
{
  "type": "stat-grid",
  "title": "Key Numbers",
  "items": [
    { "label": "Metric One", "value": "+42%", "caption": "Short context" },
    { "label": "Metric Two", "value": "3x", "caption": "Short context" },
    { "label": "Metric Three", "value": "15 min", "caption": "Short context" }
  ]
}
\`\`\``,
  "process-steps": `\`\`\`infographic
{
  "type": "process-steps",
  "title": "Step-by-Step Flow",
  "steps": [
    { "label": "1. Research", "detail": "Understand the audience problem." },
    { "label": "2. Draft", "detail": "Structure the core argument." },
    { "label": "3. Publish", "detail": "Ship, share, and measure." }
  ]
}
\`\`\``,
  comparison: `\`\`\`infographic
{
  "type": "comparison",
  "title": "Before vs. After",
  "leftTitle": "Without a System",
  "leftItems": ["Inconsistent posting", "Unclear positioning", "Ad-hoc formatting"],
  "rightTitle": "With a System",
  "rightItems": ["Clear topic pillars", "Sharp brand voice", "Reusable templates"]
}
\`\`\``,
  "bar-chart": `\`\`\`infographic
{
  "type": "bar-chart",
  "title": "Channel Breakdown",
  "items": [
    { "label": "Organic Search", "value": 78, "display": "78%" },
    { "label": "Direct / Brand", "value": 54, "display": "54%" },
    { "label": "Social", "value": 32, "display": "32%" }
  ]
}
\`\`\``,
  callout: `\`\`\`callout
type: takeaway
title: Key Takeaway
body: Highlight an important insight, tip, or warning here.
\`\`\``,
};
