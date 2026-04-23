'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { regenerateInvite } from '@/actions/invites'

type Props = {
  token: string | null
  createdAt: string | null
}

function formatCreatedAt(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default function InstructorInvitePanel({ token, createdAt }: Props) {
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const path = token ? `/invite/instructor/${token}` : null

  async function handleCopy() {
    if (!path) return
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${path}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('Copy failed. Select the link and copy manually.')
    }
  }

  function handleRegenerate() {
    const confirmMsg = token
      ? 'Regenerating will invalidate the existing link. Anyone holding it will no longer be able to join. Continue?'
      : 'Generate a shareable instructor invite link?'
    if (!window.confirm(confirmMsg)) return
    setError(null)
    startTransition(async () => {
      const result = await regenerateInvite('instructor')
      if (result.error) setError(result.error)
    })
  }

  return (
    <Card size="sm" className="mb-6">
      <CardHeader>
        <CardTitle>Instructor invite link</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-muted-foreground text-sm">
          Anyone with this link becomes an instructor on sign-in. Regenerate to revoke.
        </p>

        {path ? (
          <div className="space-y-2">
            <div
              className="bg-muted rounded-sm px-3 py-2 font-mono text-xs break-all"
              data-testid="invite-url"
            >
              {path}
            </div>
            {createdAt && (
              <p className="text-muted-foreground text-xs">
                Generated {formatCreatedAt(createdAt)}
              </p>
            )}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm italic">No invite link yet.</p>
        )}

        <div className="flex flex-wrap gap-2">
          {path && (
            <Button variant="outline" size="sm" onClick={handleCopy} disabled={pending}>
              {copied ? 'Copied' : 'Copy link'}
            </Button>
          )}
          <Button
            variant={token ? 'outline' : 'default'}
            size="sm"
            onClick={handleRegenerate}
            disabled={pending}
          >
            {pending && <span className="mr-1 inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />}
            {token ? 'Regenerate link' : 'Generate link'}
          </Button>
        </div>

        {error && <p className="text-destructive text-xs">{error}</p>}
      </CardContent>
    </Card>
  )
}
