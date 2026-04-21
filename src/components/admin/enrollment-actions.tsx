'use client'

import { useState, useTransition } from 'react'
import { confirmEnrollment, cancelEnrollment, processRefund } from '@/actions/enrollments'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

type Payment = {
  amountCents: number
  paymentIntentId: string | null
}

type Props = {
  enrollmentId: string
  courseId: string
  status: string
  payment: Payment | null
}

export default function EnrollmentActions({ enrollmentId, courseId, status, payment }: Props) {
  const [pending, startTransition] = useTransition()
  const [optimisticStatus, setOptimisticStatus] = useState(status)
  const [error, setError] = useState<string | null>(null)
  const [refundDialogOpen, setRefundDialogOpen] = useState(false)
  const [refundAmount, setRefundAmount] = useState(
    payment ? (payment.amountCents / 100).toFixed(2) : '0.00'
  )
  const [refundError, setRefundError] = useState<string | null>(null)

  if (optimisticStatus === 'cancelled' || optimisticStatus === 'completed') return null

  function handle(nextStatus: string, action: () => Promise<{ error: string | null }>) {
    const prevStatus = optimisticStatus
    setError(null)
    setOptimisticStatus(nextStatus)
    startTransition(async () => {
      try {
        const result = await action()
        if (result.error) {
          setOptimisticStatus(prevStatus)
          setError(result.error)
        }
      } catch {
        setOptimisticStatus(prevStatus)
        setError('Network error — please try again.')
      }
    })
  }

  function handleRefund() {
    setRefundError(null)
    const dollars = parseFloat(refundAmount)
    if (isNaN(dollars) || dollars <= 0) {
      setRefundError('Enter a valid amount.')
      return
    }
    const maxDollars = payment ? payment.amountCents / 100 : 0
    if (dollars > maxDollars) {
      setRefundError(`Cannot exceed original charge of $${maxDollars.toFixed(2)}.`)
      return
    }
    const refundCents = Math.round(dollars * 100)
    const isFullRefund = payment && refundCents === payment.amountCents
    setRefundDialogOpen(false)
    handle('cancelled', () =>
      processRefund(enrollmentId, courseId, isFullRefund ? undefined : refundCents)
    )
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex gap-2">
        {optimisticStatus === 'registered' && (
          <Button
            size="sm"
            disabled={pending}
            onClick={() => handle('confirmed', () => confirmEnrollment(enrollmentId, courseId))}
          >
            {pending
              ? <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
              : 'Confirm'}
          </Button>
        )}

        {optimisticStatus === 'cancel_requested' && payment ? (
          <AlertDialog open={refundDialogOpen} onOpenChange={setRefundDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="ghost" disabled={pending}>
                Process Refund
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Process Refund &amp; Cancel</AlertDialogTitle>
                <AlertDialogDescription>
                  Original charge: ${(payment.amountCents / 100).toFixed(2)}. Enter the refund
                  amount — leave as-is for a full refund.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="py-2 space-y-1">
                <Label htmlFor="refund-amount">Refund amount (USD)</Label>
                <Input
                  id="refund-amount"
                  type="number"
                  min="0.01"
                  max={(payment.amountCents / 100).toFixed(2)}
                  step="0.01"
                  value={refundAmount}
                  onChange={(e) => {
                    setRefundAmount(e.target.value)
                    setRefundError(null)
                  }}
                />
                {refundError && (
                  <p className="text-xs text-destructive">{refundError}</p>
                )}
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <Button onClick={handleRefund} disabled={pending}>
                  {pending
                    ? <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    : 'Refund & Cancel'}
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : optimisticStatus === 'cancel_requested' ? (
          <Button
            size="sm"
            variant="ghost"
            disabled={pending}
            onClick={() => handle('cancelled', () => cancelEnrollment(enrollmentId, courseId))}
          >
            {pending
              ? <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
              : 'Cancel (no refund)'}
          </Button>
        ) : null}

        {optimisticStatus !== 'cancel_requested' && (
          <Button
            size="sm"
            variant="ghost"
            disabled={pending}
            onClick={() => {
              if (!window.confirm('Cancel this enrollment?')) return
              handle('cancelled', () => cancelEnrollment(enrollmentId, courseId))
            }}
          >
            {pending
              ? <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
              : 'Cancel'}
          </Button>
        )}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
