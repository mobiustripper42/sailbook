# SailBook — Claude Code Agents & Skills

## Overview
Four agents and five session skills support the development workflow. All run as Claude Code sessions, subagents, or slash commands. None are blocking — if one creates friction, drop it and revisit later.

---

## Agents

### 1. @architect

**Purpose:** Reviews architectural and design decisions before they're committed.

**When to invoke:**
- Before adding a new library or dependency
- When a task requires a pattern you haven't used yet
- When scope creep is knocking at the door
- When a task has a DEC-TBD flagged in PROJECT_PLAN.md

**How to use:**
```
claude -n "architect" --model opus
```

**Prompt pattern:**
```
You are @architect for SailBook. Review decisions against:
- SPEC.md (scope)
- DECISIONS.md (prior decisions)
- PROJECT_PLAN.md (timeline and phases)

When reviewing a decision:
1. Is it consistent with existing decisions?
2. Does it add complexity that isn't justified by current phase scope?
3. Will it make future changes harder?
4. Is there a simpler approach?

Output: A recommendation (proceed / modify / reject) with reasoning.
If proceeding, draft a new DEC entry for DECISIONS.md.
```

**Outputs:** New entries in `DECISIONS.md`.

---

### 2. @code-review

**Purpose:** Lightweight post-commit review. Catches issues, inconsistencies, and potential bugs.

**When to invoke:**
- After completing a task or set of related commits
- Before merging a phase
- Optional — skip if it's slowing you down

**How to use:**
```
claude -n "code-review" --model sonnet
```

**Prompt pattern:**
```
You are @code-review for SailBook. Review recent changes against:
- CLAUDE.md (project conventions)
- DECISIONS.md (architectural decisions)
- Existing code patterns

Check for:
1. Inconsistent patterns
2. Missing error handling
3. RLS policy gaps
4. Hardcoded values that should be constants or codes table entries
5. Components over 200 lines
6. Missing loading/error/empty states
7. Missing Playwright or pgTAP tests for the change

Skip nitpicks. Focus on things that will bite us later.
```

**Outputs:** Findings list ranked by severity.

---

### 3. @pm

**Purpose:** Tracks project state. Knows what's done, what's next, what's blocked.

**When to invoke:**
- Start of every work session (via `/its-alive`)
- End of every work session (via `/its-dead`)
- Status checks ("where are we?")
- Scope cut decisions

**How to use:**
```
claude -n "pm" --model sonnet
```

**Prompt pattern:**
```
You are @pm for SailBook. You manage project state using:
- PROJECT_PLAN.md (phases, tasks, velocity)
- session-log.md (what's been done)

Your responsibilities:
1. Track task completion — update checkboxes in PROJECT_PLAN.md
2. Flag timeline risks — if a phase is taking longer than estimated, say so
3. Suggest task order — based on dependencies and value
4. Scope check — recommend what to cut if behind
5. Session kickoff — give a specific task with context
6. Phase boundary — run the Phase Boundary Checklist
7. Velocity update — log actual hours and points in the velocity table

Status format:
- Phase [N]: [X/Y tasks complete] — [on track / at risk / behind]
- Next task: [specific task ID and description]
- Timeline: [estimated hours remaining at current velocity]
- Risks: [anything worth flagging]

Be direct. If we're behind, say we're behind and recommend what to cut.
```

**Outputs:** Updated `PROJECT_PLAN.md`. Timeline risk flags. Scope cut recommendations.

---

### 4. @ui-reviewer

**Purpose:** Reviews visual design quality against SailBook's design system.

**When to invoke:**
- After completing a page or significant component
- At phase boundaries (formal review)
- When something "looks off" but you can't say why

**How to use:**
```
claude -n "ui-reviewer" --model sonnet
```

**Full spec:** See `.claude/agents/ui-reviewer.md` for the complete agent prompt with design principles, anti-patterns, output format, and Playwright screenshot workflow.

**Summary of what it checks:**
- Typography scale (max 3 sizes per screen, 16px minimum body)
- Spacing rhythm (Tailwind 4px scale, no arbitrary values)
- Color consistency (zinc family, contrast ratios, no mixed grays)
- Component consistency (one border radius, consistent shadows)
- Visual hierarchy (one focal point per screen)
- Accessibility (focus states, color not as sole indicator, visible labels)
- Mobile responsiveness (375px, 768px, 1440px)

**Outputs:** Scored report (X/10) with prioritized issues and exact Tailwind class fixes.

---

## Session Skills

Five slash commands manage session lifecycle. Time tracking is automatic.

### /its-alive — Session Start

**Purpose:** Stamps start time, reads last session context, recommends next task.

**What it does:**
1. Runs `date` to get current time
2. Appends new open entry to top of `session-log.md`
3. Reads last completed session's Next Steps / In Progress / Blocked / Context
4. Reads PROJECT_PLAN.md for current phase and task state
5. Presents briefing with recommended task
6. Waits for confirmation before proceeding

**Spec:** `~/.claude/skills/its-alive/SKILL.md`

---

### /pause-this — Mid-Session Break

**Purpose:** Safe pause point within a session. Use when you need to walk away but aren't done with the task.

**What it does:**
1. Runs `npm run build` — fixes errors before pausing
2. Commits WIP with descriptive message
3. Runs `/compact`
4. Notes pause point in session-log.md (but doesn't close the entry)

**Spec:** `~/.claude/skills/pause-this/SKILL.md`

---

### /restart-this — Resume from Pause

**Purpose:** Reload context after a mid-session break.

**What it does:**
1. Reads the pause note from session-log.md
2. Reloads context from session-log.md and PROJECT_PLAN.md
3. No new session number, no new timestamp — resuming same session

**Spec:** `~/.claude/skills/restart-this/SKILL.md`

---

### /kill-this — End Session (Part 1: Draft)

**Purpose:** First half of shutdown. Checks build, commits, calculates time, drafts session log.

**What it does:**
1. Runs `npm run build` — fixes errors before committing
2. Commits all changes with phase/task prefix + Co-Authored-By
3. Runs `date` for end time, calculates duration from session start, applies any time adjustments
4. Pulls effort points from PROJECT_PLAN.md for completed tasks
5. Drafts session log entry (does NOT write yet)
6. Shows draft and asks for review

**Spec:** `~/.claude/skills/kill-this/SKILL.md`

---

### /its-dead — End Session (Part 2: Finalize)

**Purpose:** Second half of shutdown. Writes log, updates plan, pushes, runs PM.

**What it does:**
1. Writes approved session entry to `session-log.md`
2. Marks completed tasks in PROJECT_PLAN.md with `[x]` and date
3. Commits log + plan changes and pushes to remote
4. Runs @pm for status assessment and next task recommendation

**Spec:** `~/.claude/skills/its-dead/SKILL.md`

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
| /its-alive | — | Session start | Timestamp + briefing |
| /pause-this | — | Mid-session break | Safe pause with commit |
| /restart-this | — | Resume from pause | Reload context |
| /kill-this | — | Session end (part 1) | Draft log entry |
| /its-dead | — | Session end (part 2) | Finalize + push |
