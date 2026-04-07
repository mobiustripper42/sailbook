import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
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
import CourseTypeActions from '@/components/admin/course-type-actions'

export default async function CourseTypesPage() {
  const supabase = await createClient()
  const { data: courseTypes, error } = await supabase
    .from('course_types')
    .select('*')
    .order('name')

  if (error) return <div className="p-8 text-destructive">{error.message}</div>

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Course Types</h1>
        <Button asChild>
          <Link href="/admin/course-types/new">New Course Type</Link>
        </Button>
      </div>

      {courseTypes?.length === 0 ? (
        <EmptyState
          message="No course types yet."
          action={
            <Button asChild>
              <Link href="/admin/course-types/new">New Course Type</Link>
            </Button>
          }
        />
      ) : (
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Cert Body</TableHead>
                <TableHead>Max Students</TableHead>
                <TableHead>Min Hours</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {courseTypes?.map((ct) => (
                <TableRow key={ct.id}>
                  <TableCell className="font-medium">{ct.name}</TableCell>
                  <TableCell className="font-mono text-sm">{ct.short_code}</TableCell>
                  <TableCell>{ct.certification_body ?? '—'}</TableCell>
                  <TableCell>{ct.max_students}</TableCell>
                  <TableCell>{ct.min_hours ?? '—'}</TableCell>
                  <TableCell>
                    <Badge variant={ct.is_active ? 'default' : 'secondary'}>
                      {ct.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <CourseTypeActions id={ct.id} isActive={ct.is_active} />
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
