# SailBook — Claude Code Agents & Skills

## Overview
Several agents and slash-command skills support the development workflow. All run as Claude Code sessions, subagents, or slash commands. None are blocking — if one creates friction, drop it and revisit later. The summary table at the end of this doc is the canonical list — the per-skill sections below cover the original session-lifecycle set; newer skills (`/start-phase`, `/retro`, `/bump-major`, `/promote-staging`, etc.) are documented in their own `SKILL.md` files under `.claude/skills/`.

---

## Agents

### 1. @architect

**Purpose:** Reviews architectural and design decisions before they're committed.

**When to invoke:**
- Before adding a new library or dependency
- When a task requires a pattern you haven't used yet
- When scope creep is knocking at the door
- When a task has a DEC-TBD flagged in PROJECT_PLAN.md

**Spec:** `.claude/agents/architect.md`

**Output:** Recommendation (proceed / modify / reject) with reasoning. Draft DECISIONS.md entry if proceeding.

---

### 2. @code-review

**Purpose:** Lightweight post-commit review. Catches issues, inconsistencies, and potential bugs.

**When to invoke:**
- After completing a task or set of related commits
- Before merging a phase
- Optional — skip if it's slowing you down

**Spec:** `.claude/agents/code-review.md`

**Output:** Findings list ranked by severity, or "Clean Bill of Health."

---

### 3. @pm

**Purpose:** Tracks project state. Knows what's done, what's next, what's blocked.

**When to invoke:**
- Start of every work session (via `/its-alive`)
- End of every work session (via `/its-dead`)
- Status checks ("where are we?")
- Scope cut decisions

**Spec:** `.claude/agents/pm.md`

**Output:** Updated `docs/PROJECT_PLAN.md`. Timeline risk flags. Scope cut recommendations.

---

### 4. @ui-reviewer

**Purpose:** Reviews visual design quality against SailBook's design system.

**When to invoke:**
- After completing a page or significant component
- At phase boundaries (formal review)
- When something "looks off" but you can't say why

**Spec:** `.claude/agents/ui-reviewer.md`

**Output:** Scored report (X/10) with prioritized issues and exact Tailwind class fixes.

---

### 5. @doc-consistency

**Purpose:** Cross-references factual claims across the project's doc set and flags mismatches and unfilled template placeholders. Report-only.

**When to invoke:**
- Mid-project, anytime the docs feel like they've drifted apart
- Before a phase boundary (clean-state check)
- After a session that touched multiple docs at once
- Via `/doc-consistency-check` (the manual surface)

**Spec:** `.claude/agents/doc-consistency.md`

**Scope:** `docs/*.md` + root `CLAUDE.md`. Type-aware via `.claude/project-type` — `webapp` must declare brand in BRAND.md; `tool` must justify any "not used"; literal `PLACEHOLDER` is always a finding regardless of type.

**Hard fences:** no structural recommendations (DEC numbering, file ownership, "you should reorganize"), no edits, no copy editing. Fact-check only.

**Output:** Per-category pass/MISMATCH report with file:line refs and verbatim conflicting quotes. Zero-finding sweeps are a valid full report.

---

## Session Skills

Six slash commands manage session lifecycle. Time tracking is automatic.

### /its-alive — Session Start

**Purpose:** Stamps start time, reads last session context, recommends next task.

**What it does:**
1. Ensures on `main` branch (DEC-005), pulls latest
2. Runs `date` to get current time
3. Appends new open entry to top of `session-log.md`, auto-commits + pushes
4. Reads last completed session's Next Steps / In Progress / Blocked / Context
5. Reads PROJECT_PLAN.md for unchecked tasks
6. Presents briefing with recommended task; waits for confirmation

**Spec:** `.claude/skills/its-alive/SKILL.md`

---

### /pause-this — Mid-Session Break

**Purpose:** Safe pause point within a session. Use when you need to walk away but aren't done with the task.

**What it does:**
1. Runs the build check from `CLAUDE.md §Commands` (skips if none defined)
2. Commits WIP with descriptive message
3. Notes pause point in session-log.md (but doesn't close the entry)

**Spec:** `.claude/skills/pause-this/SKILL.md`

---

### /restart-this — Resume from Pause

**Purpose:** Reload context after a mid-session break.

**What it does:**
1. Reads the pause note from session-log.md
2. Reloads context from session-log.md and PROJECT_PLAN.md
3. No new session number, no new timestamp — resuming same session

**Spec:** `.claude/skills/restart-this/SKILL.md`

---

### /kill-this — End Session (Part 1: Draft)

**Purpose:** First half of shutdown. Verification recap, build check, commits, runs code review, drafts session log.

**What it does:**
1. Asks how the session's work was verified (advisory recap, non-blocking)
2. Runs the build check from `CLAUDE.md §Commands` (skips if none defined)
3. Commits all changes with task prefix + Co-Authored-By, pushes to clear unpushed work
4. Runs @code-review agent against HEAD
5. Drafts session log entry; shows draft and asks for review

**Spec:** `.claude/skills/kill-this/SKILL.md`

---

### /its-dead — End Session (Part 2: Finalize)

**Purpose:** Second half of shutdown. Writes log, updates plan, runs PM, cleans up branches.

**What it does:**
1. Calculates session duration from start timestamp + most recent commit time
2. Applies any time adjustments from args
3. Tallies effort points for completed tasks
4. Writes approved session entry to `session-log.md`
5. Marks completed tasks in PROJECT_PLAN.md with `[x]` and date
6. Commits log + plan changes
7. Runs @pm for status assessment and next task recommendation
8. Cleans up any auto-created `claude/<slug>` feature branches (FF merge to main, delete local + remote), single push at end

**Spec:** `.claude/skills/its-dead/SKILL.md`

---

### /sync-config — Sync Workflow Improvements to Seeds

**Purpose:** Classify diffs between sailbook's live workflow files and the seeds template repo. Backport structural improvements; flag patterns.

**What it does:**
- Invokes the @sync-config agent
- Diffs live `.claude/agents/`, `.claude/skills/`, `CLAUDE.md`, `docs/` against seeds templates
- Classifies each hunk: skip (substitution) / backport / flag (cross-family pattern)
- Proposes changes for review before applying

**Spec:** `.claude/skills/sync-config/SKILL.md`

---

## Session Workflow

**Starting a work session:**
1. `/its-alive` → get briefing and task recommendation
2. Confirm what you're working on

**During a work session:**
3. Spec → Build → Test → Verify mobile screenshot
4. If hitting an architectural question → `@architect`
5. If session is getting long → `/pause-this` → break → `/restart-this`

**Ending a work session:**
6. `/kill-this` → review draft
7. `/its-dead` → finalize, push, get next recommendation

**End of a phase:**
8. `@code-review` → review phase output
9. `@ui-reviewer` → design review (if UI-heavy phase)
10. Phase Boundary Checklist (pgTAP, Playwright, external audits)
11. Return to primary planning chat → review docs against intent

---

## Agent Summary

| Agent/Skill | Model | When | Purpose |
|-------------|-------|------|---------|
| @architect | Opus | Before design decisions | Keep architecture coherent |
| @code-review | Sonnet | After commits, optional | Catch issues early |
| @pm | Sonnet | Start/end of sessions | Track progress, flag risks |
| @ui-reviewer | Sonnet | After UI work, phase boundaries | Design quality |
| @doc-consistency | Sonnet | Via `/doc-consistency-check`, mid-project, before phase boundaries | Cross-reference facts across docs; flag mismatches + placeholders. Report-only |
| @sync-config | Sonnet | Via /sync-config | Classify template diffs |
| @tape-reader | Sonnet | Via `/read-the-tape` | Audit JSONL transcripts for anti-patterns, propose skill improvements |
| /its-alive | — | Session start | Branch check, timestamp, briefing |
| /pause-this | — | Mid-session break | Safe pause with commit |
| /restart-this | — | Resume from pause | Reload context |
| /kill-this | — | Session end (part 1) | Verification + draft |
| /its-dead | — | Session end (part 2) | Finalize, PM, branch cleanup |
| /start-phase | — | Phase boundary (start) | Materialize phase as Issues |
| /retro | — | Phase boundary (end) | Close out phase, write retro, bump minor version |
| /bump-major | — | Breaking change | Manual major version bump |
| /promote-staging | — | Ship staging to prod | ff-merge `staging` → `main`, tag, push |
| /sync-config | — | After workflow changes | Backport to seeds |
| /doc-consistency-check | — | Mid-project, before phase boundaries | Invokes @doc-consistency; cross-refs `docs/*.md` + root `CLAUDE.md` |

**Per-session files:** the workflow uses `sessions/YYYY-MM-DD-HHMM-<dev>-<slug>.md` (one file per session) instead of a single monolithic `session-log.md`. `<dev>` comes from `~/.claude/devname` (one-line file, falls back to `$USER`). The slug is derived from the branch name (`task/X-foo` → `X-foo`, `main` → `main`, etc.). The active JSONL transcript path is captured in the file's frontmatter for later `/read-the-tape` audits.

**Task model (post phase-rituals rollout):** `PROJECT_PLAN.md` is a phase-boundary document — read at planning, written at retro. Current-phase tasks materialize as GitHub Issues with `phase:N` + `points:X` labels. The plan stays untouched mid-phase, eliminating merge contention with multiple devs.
