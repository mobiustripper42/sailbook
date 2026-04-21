import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/empty-state'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export default async function StudentsPage() {
  const supabase = await createClient()

  const { data: students, error } = await supabase
    .from('profiles')
    .select(`
      id, first_name, last_name, email, phone, experience_level, asa_number, is_active, created_at,
      enrollments:enrollments(id, status)
    `)
    .eq('is_student', true)
    .order('last_name')

  if (error) return <div className="text-destructive text-sm">{error.message}</div>

  return (
    <div className="">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Students</h1>
        <p className="text-sm text-muted-foreground">{students?.length ?? 0} total</p>
      </div>

      {students?.length === 0 ? (
        <EmptyState message="No students have registered yet." />
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>ASA #</TableHead>
                <TableHead>Experience</TableHead>
                <TableHead>Enrollments</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-16" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {students?.map((s) => {
                const enrollments = (s.enrollments ?? []) as { id: string; status: string }[]
                // Intentional: include 'registered', 'confirmed', and 'completed' — this is a
                // student activity summary, not a seat count. Only 'cancelled' is excluded.
                const activeCount = enrollments.filter((e) => e.status !== 'cancelled').length
                return (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.first_name} {s.last_name}</TableCell>
                    <TableCell>{s.email}</TableCell>
                    <TableCell>{s.phone ?? '—'}</TableCell>
                    <TableCell>{s.asa_number ?? '—'}</TableCell>
                    <TableCell className="capitalize">{s.experience_level ?? '—'}</TableCell>
                    <TableCell>{activeCount}</TableCell>
                    <TableCell>
                      <Badge variant={s.is_active ? 'ok' : 'neutral'}>
                        {s.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/admin/students/${s.id}`}
                          className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-2"
                        >
                          View
                        </Link>
                        <Link
                          href={`/admin/students/${s.id}/edit`}
                          className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-2"
                        >
                          Edit
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
