# SailBook — User Stories

## Admin (Andy)

### Dashboard
- AS-1: I log in and see a dashboard with upcoming courses, enrollment counts, sessions this week, pending confirmations, courses without instructors, and low enrollment warnings.

### Course Catalog
- AS-2: I create and edit course types (ASA 101, Open Sailing, Dinghy Sailing) — the catalog of what we offer.
- AS-3: I deactivate course types we no longer offer without deleting historical data.

### Course Management
- AS-4: I create a course offering by selecting a course type, assigning an instructor, setting capacity and price (regular + member), and adding one or more sessions with dates/times/locations.
- AS-5: I edit an existing course — change instructor, capacity, price, add/remove sessions.
- AS-6: I cancel an entire course and see which students are affected.
- AS-16: I set a course back to Draft status from Active.
- AS-17: I duplicate a course with one click and drop into edit mode.

### Session Management
- AS-7: I cancel a specific session (weather day), enter a reason, and see affected students. Notifications sent automatically.
- AS-8: I create a makeup session attached to a course and assign students who missed a cancelled session. Notifications sent automatically.
- AS-9: I swap the instructor on a specific session without changing the course default.
- AS-18: I edit a session's date, time, location, and instructor without cancelling it.

### Enrollment & Attendance
- AS-10: I view enrollments per course — who's registered, payment status, contact info, Stripe link.
- AS-11: I confirm or cancel a student's enrollment. I can issue manual refunds via the admin view.
- AS-12: I take attendance for a session — mark each student as attended, missed, or excused.
- AS-13: I see which students have missed sessions and whether they've completed makeups.
- AS-19: I see a flag when a student is enrolled in multiple sections of the same course type.
- AS-20: I see a flag when a student enrolls without a prerequisite on record, and I can override it.

### Payments
- AS-21: I see payment status for every enrollment — paid, pending, refunded.
- AS-22: I can issue refunds from the enrollment view (triggers Stripe refund).
- AS-23: I get an email/SMS notification when a new enrollment comes in.

### User Management
- AS-14: I add and deactivate instructors. Deactivating clears their course/session assignments.
- AS-15: I view the student list with contact info and enrollment history.
- AS-24: I generate an invite link for a new instructor or admin.
- AS-25: I create a student profile manually and enroll them directly (for students who can't self-register).
- AS-26: I link an admin-created student profile to a login when the student eventually creates an account.
- AS-27: I grant qualifications (ASA certifications) to students manually — "test out" equivalent.

### Notifications
- AS-28: I configure which events trigger notifications and through which channels (SMS, email).

---

## Student (Jane)

### Account
- ST-1: I create an account with my name, email, phone, ASA number (optional), and experience level using friendly language ("Just getting started", "At ASA 101 level", etc.).
- ST-2: I log in and land on my student dashboard.
- ST-11: I reset my password if I forget it.
- ST-12: I log in with Google (OAuth) as an alternative to email/password.
- ST-13: I add an "Anything you want your instructor to know?" note to my profile.

### Browsing & Registration
- ST-3: I browse available courses — see course type, dates/times, instructor, price, and spots remaining (confirmed enrollments only).
- ST-4: I register for a course and pay via Stripe checkout.
- ST-5: I cannot register for a course that is full. I can join a waitlist and get notified when a spot opens.
- ST-6: I cannot register for the same course twice. I get a warning if I'm enrolling in another section of a course type I'm already in.
- ST-14: I cannot enroll in courses that are in the past.
- ST-15: I see a flag if I'm enrolling in a course that has a prerequisite I haven't completed (but I can still enroll — admin reviews).

### Payments
- ST-16: I pay for a course during enrollment via Stripe's hosted checkout page. My spot is held while I pay.
- ST-17: I receive an SMS and/or email confirmation when my payment is confirmed.
- ST-10: I cancel my own enrollment and receive a refund based on the cancellation policy.

### My Courses
- ST-7: I see my enrolled courses with upcoming session dates/times.
- ST-8: I see my past attendance — which sessions I attended, missed, or was excused from.
- ST-9: I see available makeup sessions if I missed one.
- ST-18: I see my complete sailing history — past courses, completions, qualifications.

### Notifications
- ST-19: I receive SMS/email reminders 24 hours before a session.
- ST-20: I receive notifications when a session is cancelled or a makeup is scheduled.
- ST-21: I manage my notification preferences — opt out of SMS, email-only, etc.

### Navigation
- ST-22: If I have multiple roles (e.g., student + instructor), I can switch between views with a visible toggle.

---

## Instructor (Captain Dave)

### Dashboard
- IN-1: I log in and see my assigned courses and upcoming sessions.
- IN-2: I see my schedule — a list of upcoming sessions with dates, times, locations.

### Roster & Attendance
- IN-3: I view the roster for each of my sessions — who's expected, attendance status, phone, email, age, and any notes the student shared.
- IN-4: I see which students are makeups from other courses.
- IN-6: I see a dot/indicator on the roster if a student has filled in "Anything you want your instructor to know?"
- IN-7: I can view a student's sailing history (past courses, attendance, qualifications).

### Session Notes
- IN-5: I add notes to a session after teaching it. These are visible to other instructors and admin for continuity.

### Profile
- IN-8: I set my general availability on my profile so admin knows when I'm free.
- IN-9: My name links to my LTSC website bio on student-facing pages.

### Navigation
- IN-10: If I'm also a student (dual role), I can switch to student view with a visible toggle.

### Future (V3+)
- IN-11: I indicate interest in open/unassigned courses (instructor self-selection).
