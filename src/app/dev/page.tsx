import { notFound } from 'next/navigation'
import { CopyButton } from './copy-button'

export default function DevPage() {
  const allowed =
    process.env.NODE_ENV === 'development' ||
    process.env.VERCEL_ENV === 'preview' ||
    process.env.CODESPACES === 'true'
  if (!allowed) notFound()

  return (
    <div className="min-h-screen bg-white text-sm font-sans">
      <div className="max-w-4xl mx-auto px-8 py-10 space-y-12">

        {/* Header */}
        <div className="border-b pb-6">
          <div className="flex items-baseline justify-between">
            <h1 className="text-2xl font-semibold tracking-tight">SailBook — Walkthrough Guide</h1>
            <span className="text-xs bg-yellow-100 text-yellow-800 border border-yellow-300 px-2 py-0.5 rounded font-mono">
              DEV + PREVIEW ONLY
            </span>
          </div>
          <p className="text-muted-foreground mt-1 text-xs">
            Demo seed: <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono">docs/demo-seed.sql</code>
            &nbsp;· Password for all accounts: <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono">qwert12345</code><CopyButton text="qwert12345" />
          </p>
        </div>

        {/* Accounts */}
        <section>
          <h2 className="font-semibold text-base mb-3">Test Accounts</h2>
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-b bg-gray-50 text-left">
                <th className="px-3 py-2 font-medium">Name</th>
                <th className="px-3 py-2 font-medium">Email</th>
                <th className="px-3 py-2 font-medium">Role</th>
                <th className="px-3 py-2 font-medium">Good for</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              <tr>
                <td className="px-3 py-2 font-medium">Andy Kaminski</td>
                <td className="px-3 py-2 font-mono">andy@ltsc.test <CopyButton text="andy@ltsc.test" /></td>
                <td className="px-3 py-2"><RoleBadge role="admin" /></td>
                <td className="px-3 py-2 text-muted-foreground">The full admin tour — course management, enrollments, attendance</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-medium">Mike Theriault</td>
                <td className="px-3 py-2 font-mono">mike@ltsc.test <CopyButton text="mike@ltsc.test" /></td>
                <td className="px-3 py-2"><RoleBadge role="instructor" /></td>
                <td className="px-3 py-2 text-muted-foreground">Instructor view — dashboard and session roster</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-medium">Lisa Chen</td>
                <td className="px-3 py-2 font-mono">lisa@ltsc.test <CopyButton text="lisa@ltsc.test" /></td>
                <td className="px-3 py-2"><RoleBadge role="instructor" /></td>
                <td className="px-3 py-2 text-muted-foreground">Instructor with no current sessions assigned</td>
              </tr>
              <tr className="bg-blue-50/40">
                <td className="px-3 py-2 font-medium">Chris Marino</td>
                <td className="px-3 py-2 font-mono">chris@ltsc.test <CopyButton text="chris@ltsc.test" /></td>
                <td className="px-3 py-2"><span className="inline-flex gap-1"><RoleBadge role="instructor" /><RoleBadge role="student" /></span></td>
                <td className="px-3 py-2 text-muted-foreground">Dual role — teaches Evening Series, also enrolled in Open Sailing as a student</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-medium">Sam Davies</td>
                <td className="px-3 py-2 font-mono">sam@ltsc.test <CopyButton text="sam@ltsc.test" /></td>
                <td className="px-3 py-2"><RoleBadge role="student" /></td>
                <td className="px-3 py-2 text-muted-foreground">Active student — confirmed in 2 upcoming courses, completed April course</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-medium">Alex Rivera</td>
                <td className="px-3 py-2 font-mono">alex@ltsc.test <CopyButton text="alex@ltsc.test" /></td>
                <td className="px-3 py-2"><RoleBadge role="student" /></td>
                <td className="px-3 py-2 text-muted-foreground">Pending enrollment — shows in Andy&apos;s &ldquo;Pending Confirmation&rdquo; alert</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-medium">Jordan Park</td>
                <td className="px-3 py-2 font-mono">jordan@ltsc.test <CopyButton text="jordan@ltsc.test" /></td>
                <td className="px-3 py-2"><RoleBadge role="student" /></td>
                <td className="px-3 py-2 text-muted-foreground">No current enrollments — use for live demo enrollment during the walkthrough</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* ── ADMIN TOUR ── */}
        <section>
          <SectionHeader label="Admin" title="Andy&apos;s Tour" />
          <div className="space-y-4">

            <WalkthroughPart number={1} title="Dashboard — School at a Glance" account="andy@ltsc.test">
              <Step n={1}>Log in as Andy. You&apos;ll land on <strong>/admin/dashboard</strong>.</Step>
              <Step n={2}>Stat cards show: total courses, upcoming sessions, total students, and total enrollments.</Step>
              <Step n={3}>The <strong>Pending Confirmation</strong> tile shows Alex Rivera&apos;s enrollment in ASA 101 Weekend — waiting for Andy to confirm it.</Step>
              <Step n={4}>The <strong>Courses Without Instructor</strong> tile flags ASA 103 Coastal as unassigned.</Step>
              <Step n={5}>Upcoming sessions list shows the next few sessions across all active courses.</Step>
            </WalkthroughPart>

            <WalkthroughPart number={2} title="Course Catalog" account="andy@ltsc.test">
              <Step n={1}>Navigate to <strong>Courses</strong> in the sidebar.</Step>
              <Step n={2}>You&apos;ll see all 6 courses: 3 active, 1 completed, 1 draft, 1 without instructor.</Step>
              <Step n={3}>Click <strong>ASA 101 Weekend May</strong>. The detail page shows the session schedule, enrolled students, and enrollment counts.</Step>
              <Step n={4}>Sam Davies shows status <em>Confirmed</em>. Alex Rivera shows <em>Pending</em>.</Step>
              <Step n={5}>Click <strong>ASA 103 Coastal June</strong>. No instructor assigned, no sessions yet — notice the empty states.</Step>
              <Step n={6}>Click <strong>Dinghy Sailing for Adults</strong> — status is <em>Draft</em>. Students can&apos;t see or enroll in draft courses.</Step>
            </WalkthroughPart>

            <WalkthroughPart number={3} title="Course Types" account="andy@ltsc.test">
              <Step n={1}>Navigate to <strong>Course Types</strong>.</Step>
              <Step n={2}>Five types are seeded: ASA 101, ASA 103, Dinghy, Open Sailing, and Advanced Racing.</Step>
              <Step n={3}><strong>Advanced Racing</strong> is <em>inactive</em> — it won&apos;t appear in the New Course dropdown. Any active type will.</Step>
              <Step n={4}>Click a course type to edit its name, description, certification body, or max students.</Step>
              <Step n={5}>Try creating a new course type — it will immediately appear in the New Course form.</Step>
            </WalkthroughPart>

            <WalkthroughPart number={4} title="Creating a New Course" account="andy@ltsc.test">
              <Step n={1}>Go to <strong>Courses → New Course</strong>.</Step>
              <Step n={2}>Select a course type (e.g., ASA 103), set capacity and price. Leave Instructor as <em>Unassigned</em> — saves fine.</Step>
              <Step n={3}>After saving, you&apos;re on the course detail page. Add sessions: click <strong>Add Session</strong>, set a future date, time, and location.</Step>
              <Step n={4}>The course is <em>Active</em> by default and immediately visible to students. Change to <em>Draft</em> if you want to hide it while setting up.</Step>
              <Step n={5}>Notice that a course saved without an instructor shows a warning — it will also appear in the dashboard warning tile.</Step>
            </WalkthroughPart>

            <WalkthroughPart number={5} title="Confirming an Enrollment" account="andy@ltsc.test">
              <Step n={1}>Go to <strong>Courses → ASA 101 Weekend May</strong>.</Step>
              <Step n={2}>In the enrollments list, find <strong>Alex Rivera</strong> — status is <em>Pending</em>.</Step>
              <Step n={3}>Click the enrollment to confirm it. Alex&apos;s status changes to <em>Confirmed</em>.</Step>
              <Step n={4}>Return to Dashboard — the Pending Confirmation count drops by one.</Step>
            </WalkthroughPart>

            <WalkthroughPart number={6} title="Taking Attendance" account="andy@ltsc.test">
              <Step n={1}>Go to <strong>Courses → ASA 101 Weekend May → Session: May 9</strong>.</Step>
              <Step n={2}>The attendance roster shows Sam Davies and Alex Rivera, both <em>Expected</em>.</Step>
              <Step n={3}>Mark Sam as <strong>Attended</strong> and Alex as <strong>Missed</strong>. Changes save immediately.</Step>
              <Step n={4}>For completed history: open <strong>ASA 101 April Weekend</strong>. Sam attended both days. Jordan attended Day 1 and missed Day 2.</Step>
            </WalkthroughPart>

            <WalkthroughPart number={7} title="Cancelling a Session &amp; Scheduling a Makeup" account="andy@ltsc.test">
              <Step n={1}>Go to <strong>Courses → ASA 101 Evening Series May → Session: May 6</strong>.</Step>
              <Step n={2}>Click <strong>Cancel Session</strong>. Enter a reason (e.g., &ldquo;Weather — thunderstorms&rdquo;). Confirm.</Step>
              <Step n={3}>Sam&apos;s attendance for May 6 automatically flips to <em>Missed</em>.</Step>
              <Step n={4}>On the session detail (or course detail), click <strong>Schedule Makeup</strong>. Set a date and time for the makeup session.</Step>
              <Step n={5}>Students with a missed session for that date are automatically linked to the makeup.</Step>
            </WalkthroughPart>

            <WalkthroughPart number={8} title="Student Management" account="andy@ltsc.test">
              <Step n={1}>Go to <strong>Students</strong> in the sidebar.</Step>
              <Step n={2}>All 4 students are listed. Click any student to see their profile and enrollment history.</Step>
              <Step n={3}>Edit a student&apos;s name or experience level — changes save immediately.</Step>
            </WalkthroughPart>

          </div>
        </section>

        {/* ── STUDENT EXPERIENCE ── */}
        <section>
          <SectionHeader label="Student" title="What Your Students See" />
          <div className="space-y-4">

            <WalkthroughPart number={1} title="Student Dashboard" account="sam@ltsc.test">
              <Step n={1}>Log in as Sam Davies. You land on <strong>/student/dashboard</strong>.</Step>
              <Step n={2}>Stat cards show: enrolled courses, upcoming sessions, and next session date.</Step>
              <Step n={3}>The upcoming sessions list shows the ASA 101 Weekend (May 9–10) and Evening Series (May 6, 13, 20, 27).</Step>
            </WalkthroughPart>

            <WalkthroughPart number={2} title="Browsing &amp; Enrolling" account="jordan@ltsc.test">
              <Step n={1}>Log in as Jordan Park (no current enrollments).</Step>
              <Step n={2}>Go to <strong>Browse Courses</strong>. Active courses appear with spots remaining, session dates, and price.</Step>
              <Step n={3}><strong>Dinghy Sailing for Adults</strong> does not appear — it&apos;s in draft.</Step>
              <Step n={4}>Click <strong>ASA 101 Weekend May</strong>. The detail page shows the full session schedule, instructor, and an <em>Enroll</em> button.</Step>
              <Step n={5}>Click <strong>Enroll in This Course</strong>. Jordan is now enrolled (status: <em>Pending confirmation</em>).</Step>
              <Step n={6}>Go to <strong>My Courses</strong> — ASA 101 Weekend now appears with the pending badge.</Step>
            </WalkthroughPart>

            <WalkthroughPart number={3} title="My Courses &amp; Attendance" account="sam@ltsc.test">
              <Step n={1}>Log in as Sam Davies.</Step>
              <Step n={2}>Go to <strong>My Courses</strong>. Sam has two upcoming courses and one completed (April Weekend).</Step>
              <Step n={3}>Toggle between <em>Upcoming</em> and <em>Past</em> filters. The April course appears under Past.</Step>
              <Step n={4}>Click <strong>ASA 101 April Weekend</strong> in the Past view — the session schedule shows both sessions with <em>Attended</em> status.</Step>
              <Step n={5}>Go to <strong>My Attendance</strong>. A per-course breakdown shows all sessions and their status.</Step>
            </WalkthroughPart>

          </div>
        </section>

        {/* ── INSTRUCTOR VIEW ── */}
        <section>
          <SectionHeader label="Instructor" title="What Your Instructors See" />
          <div className="space-y-4">

            <WalkthroughPart number={1} title="Instructor Dashboard" account="mike@ltsc.test">
              <Step n={1}>Log in as Mike Theriault. You land on <strong>/instructor/dashboard</strong>.</Step>
              <Step n={2}>Stat cards show upcoming sessions count and total enrolled students across Mike&apos;s courses.</Step>
              <Step n={3}>Upcoming sessions list shows <strong>ASA 101 Weekend May 9</strong> and <strong>May 10</strong>.</Step>
              <Step n={4}>Each row has a <em>Roster</em> link — click it to go to the full enrollment and attendance view for that session.</Step>
            </WalkthroughPart>

            <WalkthroughPart number={2} title="Session Roster" account="mike@ltsc.test">
              <Step n={1}>From the dashboard, click <strong>Roster</strong> on the May 9 session.</Step>
              <Step n={2}>The roster lists Sam Davies and Alex Rivera, each with current attendance status (<em>Expected</em>).</Step>
              <Step n={3}>If any student is making up a missed session from another course, a <em>Makeup</em> badge appears on their row.</Step>
            </WalkthroughPart>

          </div>
        </section>

        {/* ── DUAL ROLE ── */}
        <section>
          <SectionHeader label="Dual Role" title="Instructor + Student — Chris Marino" />
          <div className="space-y-4">

            <WalkthroughPart number={1} title="Logging In as a Dual-Role User" account="chris@ltsc.test">
              <Step n={1}>Log in as Chris Marino. Chris is both an instructor and a student.</Step>
              <Step n={2}>The app routes to <strong>/instructor/dashboard</strong> (instructor takes priority).</Step>
              <Step n={3}>Chris teaches the <strong>ASA 101 Evening Series</strong> — it appears in the upcoming sessions list.</Step>
            </WalkthroughPart>

            <WalkthroughPart number={2} title="Accessing the Student View" account="chris@ltsc.test">
              <Step n={1}>While logged in as Chris, navigate directly to <strong>/student/dashboard</strong>.</Step>
              <Step n={2}>Chris is enrolled in <strong>Open Sailing July</strong> as a student — it appears here.</Step>
              <Step n={3}>Go to <strong>Browse Courses</strong> — the Open Sailing card shows Chris&apos;s <em>Enrolled</em> badge.</Step>
              <Step n={4}>This reflects a real scenario: an instructor taking a course outside their teaching role.</Step>
            </WalkthroughPart>

          </div>
        </section>

        {/* Reset */}
        <section className="border-t pt-6">
          <h2 className="font-semibold text-base mb-2">Resetting Demo Data</h2>
          <ol className="space-y-1 text-xs text-muted-foreground list-decimal list-inside">
            <li>Open Supabase → SQL Editor</li>
            <li>Run the <strong>WIPE DEV DATA — FULL RESET</strong> block from <code className="bg-gray-100 px-1 rounded">docs/sql-helpers.sql</code></li>
            <li>Run all of <code className="bg-gray-100 px-1 rounded">docs/demo-seed.sql</code></li>
            <li>Refresh this page — you&apos;re back to baseline</li>
          </ol>
          <p className="text-xs text-muted-foreground mt-3">
            For QA edge-case testing (full/cancelled/draft scenarios), use{' '}
            <code className="bg-gray-100 px-1 rounded">docs/dev-seed-qa.sql</code> instead.
          </p>
        </section>

      </div>
    </div>
  )
}

function SectionHeader({ label, title }: { label: string; title: string }) {
  const colors: Record<string, string> = {
    Admin:      'bg-purple-100 text-purple-800 border-purple-200',
    Student:    'bg-green-100 text-green-800 border-green-200',
    Instructor: 'bg-blue-100 text-blue-800 border-blue-200',
    'Dual Role':'bg-orange-100 text-orange-800 border-orange-200',
  }
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className={`text-xs border px-2 py-0.5 rounded font-medium ${colors[label] ?? ''}`}>{label}</span>
      <h2 className="font-semibold text-base" dangerouslySetInnerHTML={{ __html: title }} />
    </div>
  )
}

function WalkthroughPart({ number, title, account, children }: {
  number: number
  title: string
  account: string
  children: React.ReactNode
}) {
  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-baseline gap-3">
        <span className="text-xs font-mono text-muted-foreground shrink-0">Part {number}</span>
        <h3 className="font-medium text-sm">{title}</h3>
        <span className="text-xs text-muted-foreground font-mono ml-auto">{account}</span>
      </div>
      <ol className="space-y-1.5">{children}</ol>
    </div>
  )
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-2.5 text-xs">
      <span className="text-muted-foreground shrink-0 tabular-nums">{n}.</span>
      <span>{children}</span>
    </li>
  )
}

function RoleBadge({ role }: { role: string }) {
  const colors: Record<string, string> = {
    admin:      'bg-purple-100 text-purple-800 border-purple-200',
    instructor: 'bg-blue-100 text-blue-800 border-blue-200',
    student:    'bg-green-100 text-green-800 border-green-200',
  }
  return (
    <span className={`inline-block text-xs border px-1.5 py-0.5 rounded capitalize ${colors[role] ?? ''}`}>
      {role}
    </span>
  )
}
