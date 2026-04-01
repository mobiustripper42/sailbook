# SailBook — Product Specification

## Overview
Scheduling and enrollment management system for Learn To Sail Cleveland (LTSC). Single school, single season. Replaces manual scheduling with a web app where admins manage courses, students self-register, and instructors view their assignments.

## Target Launch
May 15, 2026 — first day of sailing season.

## Stack
- **Frontend:** Next.js 14+ (App Router), Tailwind CSS, shadcn/ui
- **Backend:** Supabase (PostgreSQL + Auth + Row Level Security) — no separate API server
- **Hosting:** Vercel (frontend), Supabase Cloud (database)
- **Dev Tools:** Claude Code as primary collaborator

## Roles
- **Admin** — creates courses, manages enrollments, tracks attendance, handles cancellations/makeups, manages instructors
- **Instructor** — views assigned courses/sessions, sees rosters and attendance
- **Student** — browses courses, self-registers, views own schedule and attendance

## Core Concepts
- **Course Type** — template (ASA 101, Open Sailing, Dinghy Sailing). No dates, just what the course IS.
- **Course** — specific offering of a course type with instructor, dates, capacity, price.
- **Session** — individual time block within a course. A course has one or more sessions.
- **Enrollment** — student registered for a course.
- **Session Attendance** — per-student, per-session tracking. Drives makeup logic.

## V1 Scope (May 15)
- Admin CRUD for course types, courses, sessions
- Student self-registration and login
- Per-session attendance tracking
- Manual makeup scheduling (admin creates session, moves students)
- Instructor per-session swaps
- ASA + non-ASA + Open Sailing course types
- Price display (no payment processing)
- Cross-course makeup support

## Not V1
- Payment processing
- Student self-cancellation (ships with payments — admin handles cancellations for V1)
- Email/SMS notifications
- Instructor session notes (V2)
- Automated makeup suggestions
- Multi-school / multi-tenant
- Student skill tracking
- Waitlists
- Advanced analytics
