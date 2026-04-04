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
      <div className="max-w-5xl mx-auto px-8 py-10 space-y-10">

        {/* Header */}
        <div className="border-b pb-6">
          <div className="flex items-baseline justify-between">
            <h1 className="text-2xl font-semibold tracking-tight">SailBook — Dev Test Reference</h1>
            <span className="text-xs bg-yellow-100 text-yellow-800 border border-yellow-300 px-2 py-0.5 rounded font-mono">
              DEV + PREVIEW ONLY · not visible in production
            </span>
          </div>
          <p className="text-muted-foreground mt-1">
            All test users share password: <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono text-xs">Test1234!</code><CopyButton text="Test1234!" />
            &nbsp;· Seed script: <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono text-xs">docs/dev-seed.sql</code>
            &nbsp;· Wipe script: <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono text-xs">docs/sql-helpers.sql</code>
          </p>
        </div>

        {/* Credentials */}
        <section>
          <h2 className="font-semibold text-base mb-3">Test Accounts</h2>
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-b bg-gray-50 text-left">
                <th className="px-3 py-2 font-medium">Name</th>
                <th className="px-3 py-2 font-medium">Email</th>
                <th className="px-3 py-2 font-medium">Role</th>
                <th className="px-3 py-2 font-medium">Scenario</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              <tr>
                <td className="px-3 py-2 font-medium">Andy Admin</td>
                <td className="px-3 py-2 font-mono">andy@ltsc.test <CopyButton text="andy@ltsc.test" /></td>
                <td className="px-3 py-2"><RoleBadge role="admin" /></td>
                <td className="px-3 py-2 text-muted-foreground">Full admin access. Manages everything.</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-medium">Dave Instructor</td>
                <td className="px-3 py-2 font-mono">dave@ltsc.test <CopyButton text="dave@ltsc.test" /></td>
                <td className="px-3 py-2"><RoleBadge role="instructor" /></td>
                <td className="px-3 py-2 text-muted-foreground">Assigned to ASA 101 Weekend + March. Instructor-only account.</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-medium">Sarah Instructor</td>
                <td className="px-3 py-2 font-mono">sarah@ltsc.test <CopyButton text="sarah@ltsc.test" /></td>
                <td className="px-3 py-2"><span className="inline-flex gap-1"><RoleBadge role="instructor" /><RoleBadge role="student" /></span></td>
                <td className="px-3 py-2 text-muted-foreground">Instructor + student — tests multi-role access. Assigned to Evening Series as instructor, also enrolled as student.</td>
              </tr>
              <tr className="bg-blue-50/50">
                <td className="px-3 py-2 font-medium">Alice Student</td>
                <td className="px-3 py-2 font-mono">alice@ltsc.test <CopyButton text="alice@ltsc.test" /></td>
                <td className="px-3 py-2"><RoleBadge role="student" /></td>
                <td className="px-3 py-2 text-muted-foreground">Enrolled in 2 upcoming courses (Weekend + Evening Series). Good default test account.</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-medium">Bob Student</td>
                <td className="px-3 py-2 font-mono">bob@ltsc.test <CopyButton text="bob@ltsc.test" /></td>
                <td className="px-3 py-2"><RoleBadge role="student" /></td>
                <td className="px-3 py-2 text-muted-foreground">Has a <em>cancelled</em> enrollment in ASA 101 Weekend — use to test re-enrollment.</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-medium">Carol Student</td>
                <td className="px-3 py-2 font-mono">carol@ltsc.test <CopyButton text="carol@ltsc.test" /></td>
                <td className="px-3 py-2"><RoleBadge role="student" /></td>
                <td className="px-3 py-2 text-muted-foreground">Enrolled in the <em>full</em> Evening Series (4/4). Use to test capacity display.</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-medium">Dan Student</td>
                <td className="px-3 py-2 font-mono">dan@ltsc.test <CopyButton text="dan@ltsc.test" /></td>
                <td className="px-3 py-2"><RoleBadge role="student" /></td>
                <td className="px-3 py-2 text-muted-foreground">Zero enrollments. Tests empty states across My Courses and Dashboard.</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-medium">Eve Student</td>
                <td className="px-3 py-2 font-mono">eve@ltsc.test <CopyButton text="eve@ltsc.test" /></td>
                <td className="px-3 py-2"><RoleBadge role="student" /></td>
                <td className="px-3 py-2 text-muted-foreground">Only has a completed past course. Tests &quot;past&quot; filter and empty upcoming state.</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* Course state */}
        <section>
          <h2 className="font-semibold text-base mb-3">Course Inventory</h2>
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-b bg-gray-50 text-left">
                <th className="px-3 py-2 font-medium">Course</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Capacity</th>
                <th className="px-3 py-2 font-medium">Instructor</th>
                <th className="px-3 py-2 font-medium">Sessions</th>
                <th className="px-3 py-2 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              <tr>
                <td className="px-3 py-2 font-medium">ASA 101 Weekend Intensive</td>
                <td className="px-3 py-2"><StatusBadge status="active" /></td>
                <td className="px-3 py-2">1 / 4</td>
                <td className="px-3 py-2">Dave</td>
                <td className="px-3 py-2">May 9–10</td>
                <td className="px-3 py-2 text-muted-foreground">Alice enrolled. Bob has cancelled enrollment — re-enroll test.</td>
              </tr>
              <tr className="bg-red-50/50">
                <td className="px-3 py-2 font-medium">ASA 101 Evening Series</td>
                <td className="px-3 py-2"><StatusBadge status="active" /></td>
                <td className="px-3 py-2 font-semibold text-red-700">4 / 4 FULL</td>
                <td className="px-3 py-2">Sarah</td>
                <td className="px-3 py-2">May 6–27 (4 sessions)</td>
                <td className="px-3 py-2 text-muted-foreground">Alice, Bob, Sarah, Carol enrolled. &quot;Course Full&quot; badge test.</td>
              </tr>
              <tr className="bg-yellow-50/50">
                <td className="px-3 py-2 font-medium">ASA 103 Basic Coastal</td>
                <td className="px-3 py-2"><StatusBadge status="active" /></td>
                <td className="px-3 py-2">0 / 4</td>
                <td className="px-3 py-2 text-orange-600 font-medium">⚠ Unassigned</td>
                <td className="px-3 py-2 text-muted-foreground">None yet</td>
                <td className="px-3 py-2 text-muted-foreground">Tests no-instructor + no-sessions empty states.</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-medium">Dinghy Sailing Intro</td>
                <td className="px-3 py-2"><StatusBadge status="draft" /></td>
                <td className="px-3 py-2">0 / 6</td>
                <td className="px-3 py-2">Dave</td>
                <td className="px-3 py-2">Jun 7</td>
                <td className="px-3 py-2 text-muted-foreground">Invisible to students. Verify it doesn&apos;t appear in Browse.</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-medium">Open Sailing — April</td>
                <td className="px-3 py-2"><StatusBadge status="cancelled" /></td>
                <td className="px-3 py-2">0 / 8</td>
                <td className="px-3 py-2">Dave</td>
                <td className="px-3 py-2">Apr 12 (cancelled)</td>
                <td className="px-3 py-2 text-muted-foreground">Tests cancelled course handling.</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-medium">ASA 101 March Weekend</td>
                <td className="px-3 py-2"><StatusBadge status="completed" /></td>
                <td className="px-3 py-2">1 / 4</td>
                <td className="px-3 py-2">Dave</td>
                <td className="px-3 py-2">Mar 14–15 (past)</td>
                <td className="px-3 py-2 text-muted-foreground">Eve enrolled. Tests Past filter in My Courses.</td>
              </tr>
            </tbody>
          </table>
          <p className="text-xs text-muted-foreground mt-2">
            Course type <strong>Advanced Racing</strong> is inactive — verify it does not appear in the New Course dropdown.
          </p>
        </section>

        {/* Edge case checklist */}
        <section>
          <h2 className="font-semibold text-base mb-3">Edge Case Scenarios</h2>
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-b bg-gray-50 text-left">
                <th className="px-3 py-2 font-medium">Scenario</th>
                <th className="px-3 py-2 font-medium">How to test</th>
                <th className="px-3 py-2 font-medium">Expected result</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {/* Alice */}
              <tr className="bg-gray-50/60"><td colSpan={3} className="px-3 py-1.5 font-medium text-muted-foreground text-[11px] uppercase tracking-wide">Alice</td></tr>
              <tr>
                <td className="px-3 py-2 font-medium">Duplicate enrollment blocked</td>
                <td className="px-3 py-2">Log in as Alice → ASA 101 Weekend detail page</td>
                <td className="px-3 py-2 text-muted-foreground">&quot;Enrolled&quot; badge shown, no enroll button</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-medium">Multi-enrollment student</td>
                <td className="px-3 py-2">Log in as Alice → My Courses</td>
                <td className="px-3 py-2 text-muted-foreground">Two courses: Weekend (registered) + Evening Series (confirmed)</td>
              </tr>
              {/* Bob */}
              <tr className="bg-gray-50/60"><td colSpan={3} className="px-3 py-1.5 font-medium text-muted-foreground text-[11px] uppercase tracking-wide">Bob</td></tr>
              <tr>
                <td className="px-3 py-2 font-medium">Re-enroll after cancellation</td>
                <td className="px-3 py-2">Log in as Bob → Browse → ASA 101 Weekend Intensive → Enroll</td>
                <td className="px-3 py-2 text-muted-foreground">Enrollment succeeds (cancelled row is updated, not duplicated)</td>
              </tr>
              {/* Dan */}
              <tr className="bg-gray-50/60"><td colSpan={3} className="px-3 py-1.5 font-medium text-muted-foreground text-[11px] uppercase tracking-wide">Dan</td></tr>
              <tr>
                <td className="px-3 py-2 font-medium">Course at capacity</td>
                <td className="px-3 py-2">Log in as Dan → Browse Courses → ASA 101 Evening Series</td>
                <td className="px-3 py-2 text-muted-foreground">&quot;Course Full&quot; badge and disabled enroll button</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-medium">Draft course invisible</td>
                <td className="px-3 py-2">Log in as Dan → Browse Courses</td>
                <td className="px-3 py-2 text-muted-foreground">Dinghy Sailing Intro does not appear</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-medium">Empty student dashboard</td>
                <td className="px-3 py-2">Log in as Dan → Dashboard</td>
                <td className="px-3 py-2 text-muted-foreground">0 enrolled, 0 sessions, &quot;Browse Available Courses&quot; CTA</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-medium">Course with no sessions</td>
                <td className="px-3 py-2">Log in as Dan → Browse → ASA 103 detail</td>
                <td className="px-3 py-2 text-muted-foreground">&quot;No sessions scheduled yet&quot; empty state in schedule table</td>
              </tr>
              {/* Eve */}
              <tr className="bg-gray-50/60"><td colSpan={3} className="px-3 py-1.5 font-medium text-muted-foreground text-[11px] uppercase tracking-wide">Eve</td></tr>
              <tr>
                <td className="px-3 py-2 font-medium">Empty My Courses (upcoming)</td>
                <td className="px-3 py-2">Log in as Eve → My Courses → Upcoming filter</td>
                <td className="px-3 py-2 text-muted-foreground">Empty state with link to Browse</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-medium">Past courses filter</td>
                <td className="px-3 py-2">Log in as Eve → My Courses → Past filter</td>
                <td className="px-3 py-2 text-muted-foreground">ASA 101 March Weekend appears</td>
              </tr>
              {/* Sarah */}
              <tr className="bg-gray-50/60"><td colSpan={3} className="px-3 py-1.5 font-medium text-muted-foreground text-[11px] uppercase tracking-wide">Sarah</td></tr>
              <tr>
                <td className="px-3 py-2 font-medium">Multi-role account</td>
                <td className="px-3 py-2">Log in as Sarah</td>
                <td className="px-3 py-2 text-muted-foreground">Redirected to /instructor/dashboard (primary role). Student features TBD.</td>
              </tr>
              {/* Andy (Admin) */}
              <tr className="bg-gray-50/60"><td colSpan={3} className="px-3 py-1.5 font-medium text-muted-foreground text-[11px] uppercase tracking-wide">Andy (Admin)</td></tr>
              <tr>
                <td className="px-3 py-2 font-medium">Course with no instructor</td>
                <td className="px-3 py-2">Admin → Courses → ASA 103</td>
                <td className="px-3 py-2 text-muted-foreground">Instructor shows as &quot;—&quot;; edit form defaults to Unassigned</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-medium">Inactive course type hidden</td>
                <td className="px-3 py-2">Admin → New Course → Course Type dropdown</td>
                <td className="px-3 py-2 text-muted-foreground">Advanced Racing does not appear</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-medium">Optional instructor on create</td>
                <td className="px-3 py-2">Admin → New Course → leave Instructor as Unassigned → save</td>
                <td className="px-3 py-2 text-muted-foreground">Course saves with null instructor_id, shows &quot;—&quot; on detail page</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* Testing workflows */}
        <section>
          <h2 className="font-semibold text-base mb-3">End-to-End Workflows</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Workflow title="Student Registration Flow">
              <Step n={1}>Log in as <strong>Dan</strong> (dan@ltsc.test)</Step>
              <Step n={2}>Dashboard → &quot;Browse Available Courses&quot;</Step>
              <Step n={3}>Click ASA 101 Weekend Intensive → View &amp; Enroll</Step>
              <Step n={4}>Click &quot;Enroll in This Course&quot;</Step>
              <Step n={5}>Go to My Courses — Dan&apos;s course should appear</Step>
              <Step n={6}>Log in as Andy → Courses → ASA 101 Weekend → enrollment should appear</Step>
            </Workflow>

            <Workflow title="Full Course Rejection">
              <Step n={1}>Log in as <strong>Dan</strong></Step>
              <Step n={2}>Browse → ASA 101 Evening Series</Step>
              <Step n={3}>Card shows &quot;Course Full&quot; badge</Step>
              <Step n={4}>Course detail shows &quot;Course Full&quot; disabled button</Step>
            </Workflow>

            <Workflow title="Re-Enroll After Cancellation">
              <Step n={1}>Log in as <strong>Bob</strong> (bob@ltsc.test)</Step>
              <Step n={2}>Browse → ASA 101 Weekend Intensive → Enroll</Step>
              <Step n={3}>Enrollment succeeds — Bob&apos;s previous cancelled row is reactivated</Step>
              <Step n={4}>My Courses shows the course; course detail shows &quot;Enrolled&quot;</Step>
            </Workflow>

            <Workflow title="Admin Course Creation">
              <Step n={1}>Log in as <strong>Andy</strong></Step>
              <Step n={2}>Courses → New Course</Step>
              <Step n={3}>Select course type, leave Instructor as Unassigned, set capacity + price</Step>
              <Step n={4}>Add at least one session with a future date</Step>
              <Step n={5}>Save → course lands in draft. Publish to make student-visible.</Step>
            </Workflow>

            <Workflow title="Instructor Dashboard Check">
              <Step n={1}>Log in as <strong>Dave</strong> (dave@ltsc.test)</Step>
              <Step n={2}>Dashboard shows Active Courses, Upcoming Sessions, Total Students</Step>
              <Step n={3}>Upcoming sessions list shows ASA 101 Weekend (May 9 + 10)</Step>
              <Step n={4}>Roster link on each row goes to admin course detail</Step>
            </Workflow>

            <Workflow title="Past Courses History">
              <Step n={1}>Log in as <strong>Eve</strong> (eve@ltsc.test)</Step>
              <Step n={2}>Dashboard — 0 upcoming sessions, 0 enrolled (past course not counted)</Step>
              <Step n={3}>My Courses → Upcoming filter → empty state</Step>
              <Step n={4}>My Courses → Past filter → ASA 101 March Weekend appears</Step>
            </Workflow>
          </div>
        </section>

        {/* Reset instructions */}
        <section className="border-t pt-6">
          <h2 className="font-semibold text-base mb-2">Resetting Test Data</h2>
          <ol className="space-y-1 text-xs text-muted-foreground list-decimal list-inside">
            <li>Open the Supabase dashboard → SQL Editor</li>
            <li>Run the <strong>WIPE DEV DATA — FULL RESET</strong> block from <code className="bg-gray-100 px-1 rounded">docs/sql-helpers.sql</code></li>
            <li>Run all of <code className="bg-gray-100 px-1 rounded">docs/dev-seed.sql</code></li>
            <li>Refresh this page to confirm you&apos;re back to baseline</li>
          </ol>
        </section>

      </div>
    </div>
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

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active:    'bg-green-100 text-green-800 border-green-200',
    draft:     'bg-gray-100 text-gray-600 border-gray-200',
    completed: 'bg-blue-100 text-blue-800 border-blue-200',
    cancelled: 'bg-red-100 text-red-700 border-red-200',
  }
  return (
    <span className={`inline-block text-xs border px-1.5 py-0.5 rounded capitalize ${colors[status] ?? ''}`}>
      {status}
    </span>
  )
}

function Workflow({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border rounded-lg p-4 space-y-2">
      <h3 className="font-medium text-xs uppercase tracking-wide text-muted-foreground">{title}</h3>
      <ol className="space-y-1">{children}</ol>
    </div>
  )
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-2 text-xs">
      <span className="text-muted-foreground shrink-0">{n}.</span>
      <span>{children}</span>
    </li>
  )
}
