'use client'

import { useState, useEffect } from 'react'
import { Lock, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const AUTH_KEY = 'alpha_system_auth'
const AUTH_USER = 'alpha'
const AUTH_PASS = 'system123'

function checkAuth(): boolean {
  const stored = localStorage.getItem(AUTH_KEY)
  if (!stored) return false
  try {
    const { user, pass } = JSON.parse(stored)
    return user === AUTH_USER && pass === AUTH_PASS
  } catch {
    return false
  }
}

export function AuthModal() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Check localStorage after hydration to avoid mismatch
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard hydration guard for localStorage
    setIsAuthenticated(checkAuth())
  }, [])
  const [user, setUser] = useState('')
  const [pass, setPass] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (user.trim() === AUTH_USER && pass === AUTH_PASS) {
      localStorage.setItem(AUTH_KEY, JSON.stringify({ user: AUTH_USER, pass: AUTH_PASS }))
      setIsAuthenticated(true)
    } else {
      setError('Invalid username or password')
      setPass('')
    }
  }

  if (isAuthenticated) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/95 backdrop-blur-sm">
      <div className="w-full max-w-sm mx-4">
        <div className="rounded-xl border bg-card shadow-lg p-6 space-y-6">
          {/* Header */}
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex items-center justify-center h-14 w-14 rounded-2xl bg-primary text-primary-foreground">
              <Lock className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Alpha System Database</h2>
              <p className="text-sm text-muted-foreground mt-1">Enter your credentials to continue</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="auth-user">Username</Label>
              <Input
                id="auth-user"
                type="text"
                placeholder="Username"
                value={user}
                onChange={(e) => { setUser(e.target.value); setError('') }}
                autoFocus
                autoComplete="username"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="auth-pass">Password</Label>
              <div className="relative">
                <Input
                  id="auth-pass"
                  type={showPass ? 'text' : 'password'}
                  placeholder="Password"
                  value={pass}
                  onChange={(e) => { setPass(e.target.value); setError('') }}
                  autoComplete="current-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}

            <Button type="submit" className="w-full">
              Sign In
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
