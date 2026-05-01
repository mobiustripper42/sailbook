import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function LtscMockPage() {
  const allowed =
    process.env.NODE_ENV === 'development' ||
    process.env.VERCEL_ENV === 'preview' ||
    process.env.CODESPACES === 'true'
  if (!allowed) notFound()

  const supabase = await createClient()
  const { data: courseTypes } = await supabase
    .from('course_types')
    .select('id, name, slug, short_code, description')
    .eq('is_active', true)
    .order('name')

  return (
    <div className="min-h-screen bg-[#1a3a5c] text-white font-sans">
      <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
        <div className="space-y-2">
          <div className="text-xs font-mono bg-yellow-400 text-yellow-900 inline-block px-2 py-0.5 rounded">
            DEV MOCK — simulates LTSC WordPress product-category page
          </div>
          <h1 className="text-3xl font-bold">Sailing Courses</h1>
          <p className="text-blue-200 text-sm">
            This page mocks the LTSC WordPress listing. Each &ldquo;Select options&rdquo; button links to the SailBook public course page.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {(courseTypes ?? []).map((ct) => (
            <div key={ct.id} className="bg-white text-gray-900 rounded-sm shadow-sm overflow-hidden flex flex-col">
              <div className="bg-blue-100 h-32 flex items-center justify-center text-blue-600 font-bold text-xl">
                {ct.short_code}
              </div>
              <div className="p-4 flex flex-col gap-3 flex-1">
                <div>
                  <h2 className="font-semibold text-sm leading-snug">{ct.name}</h2>
                  {ct.description && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{ct.description}</p>
                  )}
                </div>
                <div className="mt-auto">
                  <Link
                    href={`/courses/${ct.slug}`}
                    className="block w-full text-center bg-[#1a3a5c] text-white text-sm font-medium py-2 px-4 rounded-sm hover:bg-[#15304e] transition-colors"
                  >
                    Select options
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-blue-300 border-t border-blue-800 pt-4">
          Real LTSC page:{' '}
          <span className="font-mono">https://learntosailcleveland.com/product-category/course/</span>
        </p>
      </div>
    </div>
  )
}
