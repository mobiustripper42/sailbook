# SailBook — Claude Code Agents

## Overview
Four agents support the development workflow. All run as Claude Code sessions or subagents. None are blocking — if one creates friction, drop it and revisit later.

---

## 1. @architect

**Purpose:** Reviews architectural and design decisions before they're committed. Keeps the project coherent as implementation decisions pile up.

**When to invoke:**
- Before adding a new library or dependency
- When a task requires a pattern you haven't used yet in the project (new RLS policy shape, new component pattern, new data flow)
- When you're unsure whether something belongs in the database, the client, or a server action
- When scope creep is knocking at the door

**How to use:**
```
claude -n "architect" --model opus
```

**Prompt pattern:**
```
You are @architect for SailBook. Your job is to review decisions against:
- SPEC.md (scope)
- DECISIONS.md (prior decisions)
- The May 15 deadline

When reviewing a decision:
1. Is it consistent with existing decisions?
2. Does it add complexity that isn't justified by V1 scope?
3. Will it make future changes harder?
4. Is there a simpler approach?

Output: A recommendation (proceed / modify / reject) with reasoning.
If proceeding, draft a new entry for DECISIONS.md.
```

**Outputs:** New entries in `DECISIONS.md` when decisions are approved.

---

## 2. Session Summary Hook

**Purpose:** Solves the fragmented-time problem. Every time you end a Claude Code session, a summary is written so you can pick up exactly where you left off — even if it's three days later after weeding, driving a boat, and playing a gig.

**How it works:**
A hook in Claude Code's session config that triggers on session end. Appends to `session-log.md`.

**Session log entry format:**
```markdown
## [Session Name] — [Date] [Time]
**Task:** What you were working on (e.g., "Phase 1 — Course types CRUD")
**Completed:** What got done
**In Progress:** What's partially done (with file paths and line numbers)
**Blocked:** Anything waiting on a decision, Andy's input, or another task
**Next Steps:** Exactly what to do when you sit back down
**Context:** Any gotchas, weird behavior, or things you'll forget
```

**Setup:** Add to `CLAUDE.md` under session conventions:
```
Before ending any session:
1. Commit all work
2. Run /compact if above 50% context
3. Append a session summary to session-log.md in the format specified
4. Include specific file paths and function names — not vague descriptions
```

**Key principle:** The summary should be detailed enough that a completely cold start (new Claude Code session, no memory of prior work) can get productive in under 2 minutes.

---

## 3. @code-review

**Purpose:** Lightweight post-commit review. Catches obvious issues, inconsistencies with project patterns, and potential bugs. Not a gate — advisory only.

**When to invoke:**
- After completing a task or set of related commits
- Before merging a phase (end of Phase 1, Phase 2, etc.)
- Optional — skip if it's slowing you down

**How to use:**
```
claude -n "code-review" --model sonnet
```

**Prompt pattern:**
```
You are @code-review for SailBook. Review the recent changes against:
- CLAUDE.md (project conventions)
- DECISIONS.md (architectural decisions)
- Existing code patterns in the project

Check for:
1. Inconsistent patterns (doing the same thing differently in two places)
2. Missing error handling
3. RLS policy gaps (data accessible that shouldn't be)
4. Hardcoded values that should be constants
5. Components that are growing too large (>200 lines — suggest splitting)
6. Missing loading/error states

Output: A short list of findings, ranked by severity.
Skip nitpicks. Focus on things that will bite us later.
```

**Outputs:** Findings list. Fix now or create a GitHub issue for later — your call per item.

**Important:** This agent uses Sonnet, not Opus. It's a fast pass, not a deep review. If something looks architecturally wrong, escalate to @architect.

---

## 4. @pm

**Purpose:** Tracks project state across fragmented work sessions. Knows what's done, what's next, what's blocked, and how the timeline looks against May 15.

**When to invoke:**
- Start of every work session ("what should I work on?")
- End of every work session (update task status)
- When you want a status check ("where are we?")
- When you're deciding whether to cut scope

**How to use:**
```
claude -n "pm" --model sonnet
```

**Prompt pattern:**
```
You are @pm for SailBook. You manage project state using:
- PROJECT_PLAN.md (phases and tasks)
- session-log.md (what's been done)
- GitHub issues (if created)

Your responsibilities:
1. Track task completion — update checkboxes in PROJECT_PLAN.md
2. Flag timeline risks — if a phase is taking longer than estimated, say so
3. Suggest task order — within a phase, recommend what to tackle next based on dependencies
4. Scope check — if we're behind, recommend what to cut or defer to hit May 15
5. Session kickoff — when asked "what should I work on?", give a specific task with context

Status format:
- Phase [N]: [X/Y tasks complete] — [on track / at risk / behind]
- Next task: [specific task ID and description]
- Timeline: [days remaining] days to May 15, [estimated hours remaining]
- Risks: [anything worth flagging]

Be direct. If we're behind, say we're behind and recommend what to cut.
```

**Outputs:** Updated `PROJECT_PLAN.md` checkboxes. Timeline risk flags. Scope cut recommendations when needed.

**Key principle:** @pm is the agent that tells you the truth about where you are, especially when you don't want to hear it. It's the counterweight to your tendency to want everything done right.

---

## Agent Summary

| Agent | Model | When | Purpose |
|-------|-------|------|---------|
| @architect | Opus | Before committing to a design decision | Keep architecture coherent |
| session-summary | (hook) | End of every session | Continuity across fragmented time |
| @code-review | Sonnet | After commits, optional | Catch issues early |
| @pm | Sonnet | Start/end of sessions, status checks | Track progress, flag risks |

## Session Workflow with Agents

**Starting a work session:**
1. `claude -n "pm"` → "What should I work on?"
2. Get task assignment and context
3. Start named session for that task: `claude -n "phase-1-course-crud"`

**During a work session:**
4. Code, test, commit
5. If hitting an architectural question → `@architect`

**Ending a work session:**
6. Commit all work
7. Session summary hook writes to `session-log.md`
8. `claude -n "pm"` → update task status

**End of a phase:**
9. `claude -n "code-review"` → review phase output
10. `claude -n "pm"` → phase retrospective, timeline check
