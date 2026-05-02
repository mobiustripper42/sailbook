import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { createClient } from '@/lib/supabase/server'

interface AdminWaitlistCardProps {
  courseId: string
}

export default async function AdminWaitlistCard({ courseId }: AdminWaitlistCardProps) {
  const supabase = await createClient()

  const { data: entries } = await supabase
    .from('waitlist_entries')
    .select(`
      id, created_at, notified_at,
      student:profiles!waitlist_entries_student_id_fkey ( first_name, last_name, email )
    `)
    .eq('course_id', courseId)
    .order('created_at', { ascending: true })

  const rows = entries ?? []

  return (
    <Card>
      <CardHeader>
        <CardTitle>Waitlist ({rows.length})</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {rows.length === 0 ? (
          <p className="px-6 py-4 text-sm text-muted-foreground">No one on the waitlist.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Student</TableHead>
                <TableHead className="hidden sm:table-cell">Email</TableHead>
                <TableHead className="hidden md:table-cell">Joined</TableHead>
                <TableHead className="hidden md:table-cell">Last notified</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((e, i) => {
                const student = e.student as unknown as {
                  first_name: string
                  last_name: string
                  email: string
                } | null
                return (
                  <TableRow key={e.id}>
                    <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                    <TableCell>{student ? `${student.first_name} ${student.last_name}` : '—'}</TableCell>
                    <TableCell className="hidden sm:table-cell">{student?.email ?? '—'}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                      {new Date(e.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                      {e.notified_at ? new Date(e.notified_at).toLocaleString() : '—'}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
