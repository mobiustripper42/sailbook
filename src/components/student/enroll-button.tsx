'use client'

import { useTransition, useState } from 'react'
import { Button } from '@/components/ui/button'
import { createCheckoutSession } from '@/app/(student)/student/courses/[id]/actions'
import AddressDialog from '@/components/student/address-dialog'

interface EnrollButtonProps {
  courseId: string
  label?: string
}

export default function EnrollButton({ courseId, label }: EnrollButtonProps) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [addressOpen, setAddressOpen] = useState(false)

  function handleEnroll() {
    setError(null)
    startTransition(async () => {
      const result = await createCheckoutSession(courseId)
      if ('url' in result) {
        window.location.href = result.url
      } else if (result.needsAddress) {
        // ASA course needs a mailing address first — collect it, then retry.
        setAddressOpen(true)
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <div className="space-y-2">
      <Button onClick={handleEnroll} disabled={pending} className="w-full sm:w-auto">
        {pending ? 'Preparing checkout…' : (label ?? 'Register & Pay')}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <AddressDialog open={addressOpen} onOpenChange={setAddressOpen} onSaved={handleEnroll} />
    </div>
  )
}
