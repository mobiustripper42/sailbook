# SailBook redesign mockups

**`sailbook-redesign.html`** — the reference implementation for the V3 UI redesign (PROJECT_PLAN Phase 10). A single self-contained HTML mockup of every screen in the Muster design system (DEC-039): Public landing · Login · Register · Admin (dashboard, schedule, course detail, new-course, attendance, course types, users, profiles, missed sessions, activity/audit, notifications) · Instructor (dashboard, schedule, session roster, student view) · Student (home, browse, course, my courses, account).

- **Viewing:** open the file in any browser. Fonts (IBM Plex Sans/Mono) load from Google Fonts; offline they fall back to a system sans/mono — layout and color are unaffected. Use the top "View as" switcher (Public / Admin / Instructor / Student) and the ◐ theme toggle. Each screen shows a one-line note on what changed vs. the old version.
- **Authoritative tokens:** `docs/BRAND.md` (DEC-039). The mockup is the *reference*, BRAND.md is the *source of truth* — if they ever disagree, BRAND.md wins.
- **Reviews on file:** @architect (structural/data-model) and @ui-reviewer (visual + a11y) both reviewed this; findings are folded into the Phase 10 tasks and the accessibility carry-forward (muster#469).
- **Build against tokens, not pixels:** reverse-engineer the token system and component vocabulary, not exact px values. The accessibility layer (focus token, form-label wiring, keyboard reachability) is specified in task 10.1 + 10.11, not fully realized in this static mockup.
