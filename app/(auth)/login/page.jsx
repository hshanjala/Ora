'use client'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff } from 'lucide-react'
import {
  Button, IconButton, Card, FormField, Input, Alert, Divider,
} from '@/components/ui'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const linkError = searchParams.get('error') === 'invalid_link'
    ? 'Password reset link is invalid or has expired. Please request a new one.'
    : ''
  const [error, setError] = useState(linkError)

  async function handleGoogleLogin() {
    setGoogleLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/` },
    })
    if (error) {
      setError('Google sign-in failed. Please try again.')
      setGoogleLoading(false)
    }
  }

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Invalid email or password. Please try again.')
      setLoading(false)
    } else {
      router.push('/')
      router.refresh()
    }
  }

  return (
    <Card className="p-6">
      <h2 className="text-h2 text-primary">Welcome back</h2>
      <p className="mt-0.5 text-small text-secondary">Sign in to your clinic dashboard</p>

      {error && <Alert status="danger" className="mt-4">{error}</Alert>}

      <Button
        variant="secondary"
        size="lg"
        className="mt-5 w-full"
        onClick={handleGoogleLogin}
        loading={googleLoading}
      >
        {!googleLoading && (
          <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden="true">
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" />
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" />
            <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z" />
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z" />
          </svg>
        )}
        {googleLoading ? 'Redirecting…' : 'Continue with Google'}
      </Button>

      <div className="my-5 flex items-center gap-3">
        <Divider className="flex-1" />
        <span className="text-label text-tertiary">or sign in with email</span>
        <Divider className="flex-1" />
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
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

        <FormField
          label="Password"
          required
          labelRight={
            <Link href="/forgot-password" className="text-label text-accent-text hover:underline">
              Forgot password?
            </Link>
          }
        >
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="pr-10"
              required
            />
            <IconButton
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              size="sm"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-1 top-1/2 -translate-y-1/2"
            >
              {showPassword ? <EyeOff size={15} strokeWidth={1.75} /> : <Eye size={15} strokeWidth={1.75} />}
            </IconButton>
          </div>
        </FormField>

        <Button type="submit" size="lg" className="w-full" loading={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      <p className="mt-5 text-center text-small text-secondary">
        New clinic?{' '}
        <Link href="/register" className="text-accent-text hover:underline">
          Create an account
        </Link>
      </p>
    </Card>
  )
}
