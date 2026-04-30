# SailBook — Claude Code Agents & Skills

## Overview
Four agents and six session skills support the development workflow. All run as Claude Code sessions, subagents, or slash commands. None are blocking — if one creates friction, drop it and revisit later.

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
| @sync-config | Sonnet | Via /sync-config | Classify template diffs |
| /its-alive | — | Session start | Branch check, timestamp, briefing |
| /pause-this | — | Mid-session break | Safe pause with commit |
| /restart-this | — | Resume from pause | Reload context |
| /kill-this | — | Session end (part 1) | Verification + draft |
| /its-dead | — | Session end (part 2) | Finalize, PM, branch cleanup |
| /sync-config | — | After workflow changes | Backport to seeds |
