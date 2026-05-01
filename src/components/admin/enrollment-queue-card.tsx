import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export type QueueRow = {
  id: string
  studentName: string
  courseName: string
  courseId: string | null
  date: string
}

type Props = {
  title: string
  emptyMessage: string
  rows: QueueRow[]
  totalCount: number
}

function fmt(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function EnrollmentQueueCard({ title, emptyMessage, rows, totalCount }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">
          {title}{totalCount > 0 && ` (${totalCount})`}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="text-left pb-2 font-medium">Student</th>
                  <th className="text-left pb-2 font-medium">Course</th>
                  <th className="text-right pb-2 font-medium">Enrolled</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b last:border-0">
                    <td className="py-2 pr-4">{row.studentName}</td>
                    <td className="py-2 pr-4">
                      {row.courseId ? (
                        <Link href={`/admin/courses/${row.courseId}`} className="hover:underline">
                          {row.courseName}
                        </Link>
                      ) : row.courseName}
                    </td>
                    <td className="py-2 text-right whitespace-nowrap">{fmt(row.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {totalCount > 10 && (
              <p className="mt-3 text-xs text-muted-foreground text-right">
                Showing 10 of {totalCount} pending
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
