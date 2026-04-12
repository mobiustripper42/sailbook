# SailBook — Product Specification

## Overview
Scheduling, enrollment, and payment management system for Learn To Sail Cleveland (LTSC). Single school, single season. Web app where admins manage courses, students self-register and pay, instructors view their assignments, and everyone gets notified when things change.

## Philosophy
This school is about meeting people where they are in their sailing journey. Not assuming anything, not gatekeeping — understanding where someone is and helping them grow from there. That should feel present in every touchpoint, from first enrollment to the instructor roster.

## Target Launch
- **V1 shipped:** April 9, 2026 (v1.0.0)
- **V2 critical path:** Payments live (Phases 0–2)
- **V2 full scope:** ~13 weeks from start

## Stack
- **Frontend:** Next.js 14+ (App Router), Tailwind CSS, shadcn/ui, Geist Sans
- **Backend:** Supabase (PostgreSQL + Auth + Row Level Security) — no separate API server (one webhook endpoint for Stripe)
- **Payments:** Stripe (Checkout Sessions, hosted payment page)
- **Notifications:** Twilio (SMS), Resend (email)
- **Hosting:** Vercel (frontend), Supabase Cloud (database)
- **Dev Environment:** Local Supabase via Docker, Stripe test mode
- **Testing:** pgTAP (RLS), Playwright (integration), axe-core (accessibility)
- **Dev Tools:** Claude Code as primary collaborator

## Roles
- **Admin (Andy)** — creates courses, manages enrollments, tracks attendance, handles cancellations/makeups, manages instructors and students, processes payments/refunds, configures notifications
- **Instructor (Captain Dave)** — views assigned courses/sessions, sees rosters with student details and notes, adds session notes
- **Student (Jane)** — browses courses, self-registers and pays, views own schedule and attendance, cancels enrollments (with refund), manages notification preferences

## Core Concepts
- **Course Type** — template (ASA 101, Open Sailing, Dinghy Sailing). No dates, just what the course IS.
- **Course** — specific offering of a course type with instructor, dates, capacity, price.
- **Session** — individual time block within a course. A course has one or more sessions.
- **Enrollment** — student registered for a course. Status lifecycle: registered → pending_payment → confirmed → cancelled / completed.
- **Session Attendance** — per-student, per-session tracking. Drives makeup logic.
- **Codes Table** — generic lookup table for experience levels, qualification types, and other configurable values.

## V2 Scope

### Phase 0 — Infrastructure
- Local Supabase via Docker
- Baseline migration from prod
- pgTAP RLS test suite (all tables)
- Playwright integration test suite (all flows)
- Playwright MCP + @ui-reviewer agent
- a11y-mcp-server for accessibility testing
- Session management skills (/its-alive, /pause-this, /restart-this, /kill-this, /its-dead)
- Migration protocol (no dashboard edits, everything in supabase/migrations/)
- Updated project docs

### Phase 1 — V1 Fixes & Gaps
- Session editing (currently must cancel and recreate)
- Course draft status transition
- Inactive instructor cascade
- Student history view (all roles)
- ASA number field
- Generic codes/lookup table for experience levels
- Password reset flow
- Unsaved changes guard
- Student "instructor notes" field + expanded instructor roster
- Spots remaining fix (count confirmed only)
- Past courses not enrollable
- Dual-role nav toggle
- Dashboard instructor assignment clarity

### Phase 2 — Payments (Stripe)
- Stripe Checkout Sessions (hosted payment page — no card data touches our app)
- Enrollment hold with timeout (pessimistic inventory)
- Stripe webhook for payment confirmation
- Student self-cancellation with refund (ST-10)
- Admin refund management
- Member pricing
- End-to-end payment integration tests

### Phase 3 — Notifications + Auth Hardening
- SMS via Twilio, email via Resend
- Enrollment confirmation, session cancellation, makeup assignment, session reminders
- Admin alerts on new enrollment and low enrollment
- Student + admin notification preferences
- Password strength requirements
- Email verification with custom templates
- OAuth (Google)

### Phase 4 — Identity & Profiles
- Instructor invite links
- Admin invite links
- Student profile expansion
- Admin-created students (no login)
- Link admin-created student to login
- Instructor session notes
- Instructor availability + bio/website link

### Phase 5 — Pricing & Enrollment
- Member pricing model
- Drop-in pricing for Open Sailing
- Stripe discount codes
- Prerequisite flagging (flag, not block)
- Admin qualification grants ("test out")
- Duplicate enrollment warning
- Waitlist with notifications
- Low enrollment warning dashboard

### Phase 6 — Polish & UX
- Mobile responsiveness (admin + instructor)
- Full @ui-reviewer design audit + implementation
- Accessibility audit (axe-core, WCAG 2.1 AA)
- Duplicate course
- Relative session badges
- External UX audit (WebsiteAuditAI, Attention Insight)
- Admin dashboard UX redesign
- Navigation / breadcrumb audit
- Public landing page + contact form

### Phase 7 — Skills & Tracking (future)
- Skill checklists per course type
- Two-level checkoff (instructor demonstrates → student executes)
- Student sailing record with accumulated skills
- Cross-instructor continuity

## Not V2
- Proxy enrollment ("Who are you enrolling?" — Me / Me + someone / Someone else)
- Charter module (separate app, shared infrastructure)
- General program request form
- Youth enrollment (parent/guardian co-enrollment)
- In-app messaging
- ASA API integration
- Tiered instructor roles
- Auto-enroll next available
- Calendar views (student, admin, instructor)
- Multi-school / multi-tenant
- Automated makeup suggestions
- AI season setup agent
- Admin impersonation mode
