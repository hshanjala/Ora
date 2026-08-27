'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import {
  Button, IconButton, Card, FormField, Input, Alert,
} from '@/components/ui'

export default function ResetPasswordPage() {
  const router = useRouter()
  const supabase = createClient()
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (password.length < 6) return
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.updateUser({ password })

    setLoading(false)
    if (error) {
      setError(error.message)
      return
    }
    setSuccess(true)
    setTimeout(() => {
      router.push('/')
      router.refresh()
    }, 2000)
  }

  return (
    <Card className="p-6">
      <h2 className="text-h2 text-primary">Set new password</h2>
      <p className="mt-0.5 text-small text-secondary">
        Choose a new password for your account
      </p>

      {error && <Alert status="danger" className="mt-4">{error}</Alert>}

      {success ? (
        <div className="mt-5 flex items-start gap-3 rounded-md border bg-surface-subtle p-4">
          <CheckCircle2 size={20} strokeWidth={1.75} className="mt-0.5 shrink-0 text-accent-text" />
          <div>
            <p className="text-body-md text-primary">Password updated</p>
            <p className="mt-0.5 text-small text-secondary">
              Redirecting you to your dashboard…
            </p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <FormField label="New password" hint="Minimum 6 characters" required>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                minLength={6}
                className="pr-10"
                required
              />
              <IconButton
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                size="sm"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-1 top-1/2 -translate-y-1/2"
              >
                {showPassword
                  ? <EyeOff size={15} strokeWidth={1.75} />
                  : <Eye size={15} strokeWidth={1.75} />}
              </IconButton>
            </div>
          </FormField>
          <Button
            type="submit"
            size="lg"
            className="w-full"
            loading={loading}
            disabled={password.length < 6}
          >
            {loading ? 'Updating…' : 'Update password'}
          </Button>
        </form>
      )}
    </Card>
  )
}
