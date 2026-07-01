# Tiller: The "What's Next" progression engine — walk the prereq graph forward

*Draft pitch from Tiller, 2026-07-01. Not a directive — Eric is the gate. One changed file (this doc). Never auto-merges.*

---

## The pitch

### The idea

SailBook already contains a complete model of where every student sits on the ASA
ladder — it just reads it in only one direction. `course_type_prerequisites` is a
directed graph (`course_type → required_course_type`). Today it's read **backward**:
on the student course page, "does this course list something you haven't taken?" →
show a soft warning. That's a *gate*.

Walk the **same edges forward** and the gate becomes a growth engine. When a student
completes course type X, the graph already knows which course types name X as a
prerequisite — the next rungs (101 → 103 → 104). Cross that with "which of those
rungs has an active future course with open seats," and you can send one personalized
email on the rail that's already live:

> **You finished ASA 101 — you're ready for ASA 103 Coastal Cruising.**
> The next one starts **Sat, Aug 16**. A few seats are open. → *See dates*

A new 4th nightly cron, one `notify*` trigger, one template, one small state table.
No new dependency, no new service, no schema on the hot path. It reuses
`fetchStudentHistory()`, the prereq graph, the `get_course_active_enrollment_count`
capacity RPC, and the channel-isolated per-recipient fan-out in `triggers.ts`.

### Why it's worth it — and why now

- **It is the school's business.** LTSC/Simply Sailing makes money on *repeat
  enrollment up the certification ladder*. Every other feature so far serves a single
  enrollment; nothing yet turns a finished course into the next one. This is the only
  idea that touches the revenue thesis directly, and it does it for the price of a
  cron.
- **It's the SPEC philosophy, operationalized.** "Meet people where they are in their
  sailing journey and help them grow from there" is written into the spec as
  *philosophy*. The prereq graph + completion history *is* "where they are." Nobody has
  read it as the map it already is.
- **Now, because the rail is finished and idle.** Phases 2–6 built the crons, the
  per-recipient email fan-out, Resend live in prod. Email is currently the *only* live
  notification channel (SMS is A2P-blocked) and it's carrying transactional traffic
  only. This gives the rail something intelligent to say without building anything
  under it. And with Stripe live-mode still dark, a *free* re-engagement lever that
  needs no card processing is exactly the kind of leverage available right now.

### Why you haven't already

The prereq table was **built as a constraint** (task 5.4: "flag, not block"). Its whole
framing — `required_course_type_id`, the warning banner, the pgTAP that asserts it
*doesn't* block — points backward. Once a table is named `prerequisites` and its job is
"warn before enrollment," the forward reading ("this is the list of who's ready for
what next") is sitting right there but pointed away from you. The reframe that makes it
obvious — *a gate walked in reverse is a recommendation* — only lands once you stop
seeing the graph as a fence around students and start seeing it as a forecast of the
business. The data's been complete for two months; only the direction of the arrow was
missing.

---

## The build handoff

An execute-ready plan for a Claude Code session on the Hetzner box. Scale: one contained
feature — file-by-file below. Follow the SailBook micro-workflow (branch → build → test →
`/kill-this`).

### Approach

Mirror the **`session-reminders` cron** end to end — it's the closest existing shape
(nightly, batch, per-recipient email, best-effort). Four pieces:

1. **`progression_nudges` state table** — the idempotency ledger. This is the real work;
   everything else is assembly.
2. **`notifyProgressionUnlocks()`** trigger in `triggers.ts` — compute eligible unlocks
   per student, guard, send.
3. **A pure template** `progressionUnlock(...)` in `templates.ts`.
4. **`/api/cron/progression-nudges`** route + a 4th entry in `vercel.json`.

**Idempotency — the load-bearing decision (write-then-send insert-guard).**
Completion is a *durable state*, not an event, so a naive nightly scan re-emails every
eligible student every night forever. The fix is a dedup keyed on the **unlock**, not the
send, with the insert itself as the guard:

- `progression_nudges (id, student_id, unlocked_course_type_id, notified_at, notified_course_ids uuid[] NULL)`,
  `UNIQUE (student_id, unlocked_course_type_id)`.
- Per student, per eligible unlock:
  `INSERT ... ON CONFLICT (student_id, unlocked_course_type_id) DO NOTHING RETURNING id`.
  **Row back → you won, send the email. No row → already handled, skip.**
- **Write-then-send**, not send-then-write: email is best-effort, so a crash between
  insert and send costs *one recoverable missed email* — cheap — whereas send-then-write
  risks the nightly-spam this table exists to prevent. Bias to under-send.
- Do the insert-guard **inside the per-recipient unit** (like the existing fan-out), so a
  mid-batch crash never marks unsent students as notified.
- **v1 cut:** one email per unlock, full stop. Leave `notified_course_ids` nullable and
  unused. The column is there so a later "a new cohort opened for a rung we already told
  you about" branch is a forward-compatible addition, not a migration — but don't build
  that branch now.

This convention is worth getting right because `triggers.ts` currently has **no**
`notified_at`/dedup pattern (its header explicitly delegates idempotency to callers).
This is the first recurring notification that needs one; every future nightly notification
reuses it. Log it as a DECISION (draft entry at the bottom).

### File-by-file

- **`supabase/migrations/<ts>_progression_nudges.sql`** (new)
  - Create `progression_nudges` as above. `student_id uuid REFERENCES profiles(id) ON
    DELETE CASCADE`, `unlocked_course_type_id uuid REFERENCES course_types(id) ON DELETE
    CASCADE`, `notified_at timestamptz NOT NULL DEFAULT now()`, `notified_course_ids
    uuid[]`, `UNIQUE (student_id, unlocked_course_type_id)`.
  - RLS: `ENABLE ROW LEVEL SECURITY`. Admins full access (mirror the
    `course_type_prerequisites` admin policy). No student/anon policy — this is a
    service-role-written internal ledger; the cron uses the admin client. (A student
    "why am I getting these" view is a later idea, not v1.)

- **`src/lib/notifications/templates.ts`** (edit)
  - Add `ProgressionUnlockData` type + `progressionUnlock(data)` pure function returning
    `{ smsBody, emailSubject, emailHtml, emailText }`, same shape as the others. Fields:
    `studentFirstName`, `completedCourseTypeName`, `unlockedCourseTypeName`,
    `nextCourseTitle`, `nextCourseFirstSessionDate`, `courseUrl`. Copy stays
    **enrollment-neutral** ("See dates") — do NOT say "Reserve your spot": Stripe is dark
    in prod, so the CTA must land on the course page, not imply a purchase.

- **`src/lib/notifications/triggers.ts`** (edit)
  - Add `notifyProgressionUnlocks(referenceDate?: Date): Promise<number>` (optional
    `referenceDate` for testability, like `notifyUpcomingSessionReminders`). Steps, all on
    the admin client:
    1. Build the forward index once: `SELECT required_course_type_id, course_type_id FROM
       course_type_prerequisites` → `Map<required → unlockedTypes[]>`.
    2. Enumerate students who have **completed** at least one course type. Use the *same
       completion signal `fetchStudentHistory()` uses* — pick one definition and route
       everything through it (see gotcha). Practically: iterate students with completed
       history, derive their set of completed course-type IDs and their set of
       already-taken (any non-cancelled enrollment) course-type IDs.
    3. For each completed type, look up unlocked types; drop any the student has already
       taken/enrolled in. That's the candidate unlock set.
    4. For each candidate unlock, find **active, future** courses of that type with open
       seats: `courses.status='active'` + a future first session; open seats via
       `get_course_active_enrollment_count(courseId) < course.capacity`. If none, skip
       (no row written — re-evaluated fine tomorrow when a course appears).
    5. If ≥1 actionable course exists: `INSERT ... ON CONFLICT DO NOTHING RETURNING id`.
       Row back → render `progressionUnlock` (pick the soonest course) → `tryEmail(...)`
       gated by `isStudentChannelEnabled(profile, 'email')`. Increment a counter.
    - Wrap each student in try/catch and swallow-and-log, matching the file's contract.

- **`src/app/api/cron/progression-nudges/route.ts`** (new) — copy `low-enrollment/route.ts`
  verbatim: `verifyCron(req)` guard, then `const n = await notifyProgressionUnlocks();
  return NextResponse.json({ nudged: n })`.

- **`vercel.json`** (edit) — add a 4th cron. Suggest `"0 15 * * *"` (11:00 ET), after the
  existing reminders tick. Confirm the Vercel plan's cron-count limit isn't hit.

- **Tests**
  - **pgTAP** `supabase/tests/<n>_progression_nudges.sql` — RLS: admin can read/write,
    student/anon cannot; the `UNIQUE` constraint rejects a duplicate `(student,
    unlocked_type)`.
  - **Playwright** `tests/progression-nudges.spec.ts` — seed a student with a completed
    101 and an active future 103 that lists 101 as prereq; hit the cron route with the
    `CRON_SECRET` header; assert one email in the mock buffer (`GET
    /api/test/notifications`, `NOTIFICATIONS_ENABLED` unset path); hit it a **second**
    time and assert **no** new email (idempotency). Add a negative: student who already
    took 103 gets nothing.

### Gotchas / risks

- **Completion must actually be set in prod (pre-flight — do this first).** The whole
  engine is silent if nobody marks courses complete. `courses.status='completed'` is
  admin-set; verify in the prod DB that completed spring courses are actually flagged
  before building. If admins aren't marking completion, either (a) add a fallback "all
  sessions in the past" completion signal, or (b) get Andy to mark them — but decide
  *before* coding, or you'll ship an engine that does nothing.
- **One completion signal only.** `enrollments` has its own `completed` status *and*
  `courses.status='completed'` exists. Do not let the engine read two signals. Route
  everything through whatever `fetchStudentHistory()` already uses.
- **The first run is a back-catalog blast.** Night one, every student who finished a
  course this season and hasn't taken the next rung gets an email at once. That's likely
  a *feature* (re-engagement), but it's a surprise if unplanned and could read as spam if
  the volume is high against Resend's free tier (100/day). **Decide with Andy:** let it
  fire as intentional re-engagement, OR pre-seed `progression_nudges` with all current
  historical unlocks marked notified on deploy (one INSERT…SELECT) so only *future*
  completions trigger. Either is one line; the choice is Andy's.
- **Resend tier.** Free is 100/day. A back-catalog blast + steady drip may want the Pro
  upgrade already queued in the launch checklist. Check headroom.
- **Graph is the leash (do not become a CRM).** Every email must be grounded in a real
  prereq edge *and* a real open seat. No "you might like…", no aspirational two-rungs-up
  guesses. The moment it emails about a course a student isn't eligible for, it's a
  different, worse product.
- **Cycle safety.** `course_type_prerequisites` has a no-self-reference CHECK but nothing
  stops A→B→A across rows. The "drop already-taken" filter makes a cycle harmless (you
  can't be unlocked for something you've taken), but don't write recursive traversal —
  this is a *one-hop* forward lookup (direct dependents of a completed type), not a
  transitive closure. Keep it one hop.

### Done when

- A student with a completed prerequisite and an eligible open future course receives
  exactly **one** email; a second cron run sends **zero**.
- A student who already took the next rung receives nothing.
- No email names a course with no open seats or no future session.
- pgTAP green (RLS + unique constraint); Playwright green (send-once, idempotent-twice,
  negative-already-taken); lint clean.
- `DECISIONS.md` carries the idempotency-convention entry.

### Kickoff (paste to a CC session on the Hetzner box)

> Implement the "What's next" progression engine per `docs/tiller/2026-07-01-progression-engine.md`.
> **Before any code**, connect to the prod DB and confirm `courses.status='completed'` is
> actually being set on finished spring courses — report what you find and we'll decide the
> completion signal + the first-run back-catalog policy together. Then branch
> `task/progression-nudges`, build the migration + trigger + template + 4th cron mirroring
> `session-reminders`, using the write-then-send insert-guard on `progression_nudges`
> `(student_id, unlocked_course_type_id)`. v1 = one email per unlock; leave
> `notified_course_ids` unused. Wire pgTAP + Playwright (send-once / idempotent-twice /
> already-taken-negative), then `/kill-this`.

---

### Draft DECISIONS.md entry

> **DEC-NNN — Nightly notification idempotency via write-then-send insert-guard.**
> Recurring notifications that lack a natural dedup key (starting with progression nudges)
> guard against re-fire with a dedicated state table carrying a UNIQUE constraint on the
> notification's semantic identity (e.g. `(student_id, unlocked_course_type_id)`). The
> nightly job does `INSERT … ON CONFLICT DO NOTHING RETURNING` **before** sending; only a
> returned row triggers the email. Write-then-send is chosen over send-then-write because
> email is best-effort — a crash between write and send costs one recoverable missed email,
> whereas send-then-write risks nightly duplicate sends. The insert-guard lives inside the
> per-recipient fan-out so a mid-batch failure never marks unsent recipients as notified.
> Establishes the `notified_at` convention `triggers.ts` previously delegated to callers.

---

*Panel notes (for the curious): three alternates were considered and cut. A payments-dark
"reserve / express interest" bridge — killed: the shipped waitlist subsystem
(`waitlist_entries` + `notifyWaitlistSpotOpened`) plus `pending_payment`/`hold_expires_at`
and the manual-enrollment path already cover "bank demand now, convert offline." A
cross-instructor continuity roster view — real but small, reuses this same journey
read-model, and carries an RLS-scope decision; a good fast-follow, not the lead. A standing
`@schema-reviewer` agent — folded down to a one-shot review of this feature's migration
rather than permanent per-task infra, since `@code-review` + the migration protocol already
cover the steady state.*
