import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import InstructorActions from '@/components/admin/instructor-actions'

export default async function InstructorsPage() {
  const supabase = await createClient()
  const { data: instructors, error } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, email, phone, is_active, created_at')
    .eq('is_instructor', true)
    .order('last_name')

  if (error) return <div className="p-8 text-destructive">{error.message}</div>

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Instructors</h1>
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        Instructors register at <strong>/register</strong> with their email. Andy then sets their account to instructor in Supabase Auth.
      </p>

      {instructors?.length === 0 ? (
        <p className="text-muted-foreground">No instructors yet.</p>
      ) : (
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {instructors?.map((i) => (
                <TableRow key={i.id}>
                  <TableCell className="font-medium">{i.first_name} {i.last_name}</TableCell>
                  <TableCell>{i.email}</TableCell>
                  <TableCell>{i.phone ?? '—'}</TableCell>
                  <TableCell>
                    <Badge variant={i.is_active ? 'default' : 'secondary'}>
                      {i.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <InstructorActions id={i.id} isActive={i.is_active} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
