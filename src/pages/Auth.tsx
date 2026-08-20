import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export function AuthPage() {
  const { signInWithPassword, signUp } = useAuth()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [confirmSent, setConfirmSent] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    const fn = mode === 'signin' ? signInWithPassword : signUp
    const { error } = await fn(email, password)
    setBusy(false)
    if (error) {
      setError(error)
    } else if (mode === 'signup') {
      setConfirmSent(true)
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <h1>Scrapbook</h1>
        <div className="sub">{mode === 'signin' ? 'Welcome back' : 'Start your loose pile'}</div>

        {confirmSent ? (
          <p style={{ fontSize: 14, color: 'var(--ink-soft)' }}>
            Check your email to confirm your account, then sign in.
          </p>
        ) : (
          <form onSubmit={submit}>
            <div className="field">
              <label>Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            </div>
            <div className="field">
              <label>Password</label>
              <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} />
            </div>
            {error && <div className="auth-error">{error}</div>}
            <button className="cta" type="submit" disabled={busy}>
              {busy ? 'Working…' : mode === 'signin' ? 'Sign in' : 'Sign up'}
            </button>
          </form>
        )}

        <div className="auth-toggle">
          {mode === 'signin' ? (
            <>No account yet? <button onClick={() => { setMode('signup'); setError(null); setConfirmSent(false) }}>Sign up</button></>
          ) : (
            <>Already have one? <button onClick={() => { setMode('signin'); setError(null); setConfirmSent(false) }}>Sign in</button></>
          )}
        </div>
      </div>
    </div>
  )
}
