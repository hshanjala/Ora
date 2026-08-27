'use client'
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Mail } from 'lucide-react'
import {
  Button, Card, FormField, Input, Alert,
} from '@/components/ui'

export default function ForgotPasswordPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    })

    setLoading(false)
    if (error) {
      setError(error.message)
      return
    }
    setSent(true)
  }

  return (
    <Card className="p-6">
      <h2 className="text-h2 text-primary">Reset password</h2>
      <p className="mt-0.5 text-small text-secondary">
        Enter your email and we&apos;ll send you a reset link
      </p>

      {error && <Alert status="danger" className="mt-4">{error}</Alert>}

      {sent ? (
        <div className="mt-5 space-y-4">
          <div className="flex items-start gap-3 rounded-md border bg-surface-subtle p-4">
            <Mail size={20} strokeWidth={1.75} className="mt-0.5 shrink-0 text-accent-text" />
            <div>
              <p className="text-body-md text-primary">Check your inbox</p>
              <p className="mt-0.5 text-small text-secondary">
                We sent a password reset link to <span className="font-medium text-primary">{email}</span>.
                Click the link in the email to set a new password.
              </p>
            </div>
          </div>
          <p className="text-center text-small text-tertiary">
            Didn&apos;t receive it? Check your spam folder or{' '}
            <button
              onClick={() => setSent(false)}
              className="text-accent-text hover:underline"
            >
              try again
            </button>
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <FormField label="Email address" required>
            <Input
              type="email"
              placeholder="doctor@clinic.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </FormField>
          <Button type="submit" size="lg" className="w-full" loading={loading}>
            {loading ? 'Sending…' : 'Send reset link'}
          </Button>
        </form>
      )}

      <p className="mt-5 text-center text-small text-secondary">
        <Link href="/login" className="inline-flex items-center gap-1 text-accent-text hover:underline">
          <ArrowLeft size={14} strokeWidth={1.75} /> Back to sign in
        </Link>
      </p>
    </Card>
  )
}
