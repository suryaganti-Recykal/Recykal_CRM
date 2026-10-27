import { useState, type FormEvent } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Mail, Lock, ArrowRight, Recycle, TrendingUp, Users, ArrowLeft, KeyRound, CheckCircle2 } from 'lucide-react'

type View = 'login' | 'forgot-email' | 'forgot-otp'

export default function Login() {
  const { signIn } = useAuth()
  const [view, setView] = useState<View>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function reset() {
    setError(null)
    setInfo(null)
    setOtp('')
    setNewPassword('')
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await signIn(email, password)
    if (error) setError(error)
    setLoading(false)
  }

  async function handleRequestOtp(e: FormEvent) {
    e.preventDefault()
    if (!email) { setError('Enter your email first'); return }
    setLoading(true)
    reset()
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    setLoading(false)
    if (error) setError(error.message)
    else {
      setInfo(`We sent a 6-digit code to ${email}. Check your inbox.`)
      setView('forgot-otp')
    }
  }

  async function handleVerifyOtp(e: FormEvent) {
    e.preventDefault()
    if (otp.length !== 6) { setError('Enter the 6-digit code from your email'); return }
    if (newPassword.length < 6) { setError('Password must be at least 6 characters'); return }
    setLoading(true)
    setError(null)

    const { error: verifyErr } = await supabase.auth.verifyOtp({ email, token: otp, type: 'recovery' })
    if (verifyErr) { setLoading(false); setError(verifyErr.message); return }

    const { error: updateErr } = await supabase.auth.updateUser({ password: newPassword })
    setLoading(false)
    if (updateErr) { setError(updateErr.message); return }

    setInfo('Password updated. Signing you in…')
    // The verifyOtp above already created a session for the user, so they're
    // signed in; the ProtectedRoutes wrapper will redirect to the dashboard
    // on the next render.
  }

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950">
      {/* Left: brand side with gradient + value prop. Hidden on mobile so the
          sign-in form has the full viewport on small screens. */}
      <div className="hidden lg:flex lg:flex-1 relative overflow-hidden bg-brand-gradient-mesh">
        {/* Subtle grid pattern overlay for depth */}
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          <div className="flex items-center gap-3">
            <img src="/recykal-mark-white.png" alt="Recykal" className="h-8 w-auto" />
            <span className="text-lg font-semibold tracking-tight">Recykal</span>
          </div>

          <div className="max-w-md space-y-6">
            <h1 className="text-4xl font-bold leading-tight tracking-tight">
              Every lead, deal, and conversation — in one place.
            </h1>
            <p className="text-white/80 text-base leading-relaxed">
              The CRM built for India's circular economy. Track EPR, ITAD, Rethink+, and DDRS pipelines with the clarity your team deserves.
            </p>

            <div className="space-y-3 pt-4">
              <Feature icon={Users} text="Unified contact & company management" />
              <Feature icon={TrendingUp} text="Pipeline forecasts & won-deal analytics" />
              <Feature icon={Recycle} text="Automations, quotes & communication timeline" />
            </div>
          </div>

          <div className="text-xs text-white/60">
            © {new Date().getFullYear()} Recykal Foundation Pvt Ltd. All rights reserved.
          </div>
        </div>
      </div>

      {/* Right: sign-in form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-sm animate-fade-in-up">
          {/* Logo only on mobile; the left side carries it on desktop */}
          <div className="lg:hidden mb-8 text-center">
            <img src="/recykal-mark-black.png" alt="Recykal" className="h-10 w-auto mx-auto dark:hidden" />
            <img src="/recykal-mark-white.png" alt="Recykal" className="h-10 w-auto mx-auto hidden dark:block" />
          </div>

          {view === 'login' && (
            <>
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Welcome back</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">Sign in to continue to Recykal CRM</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wide">Email</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 pl-10 pr-3 py-2.5 text-sm placeholder:text-slate-400 focus-ring"
                      placeholder="you@recykal.com"
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Password</label>
                    <button
                      type="button"
                      onClick={() => { reset(); setView('forgot-email') }}
                      className="text-xs font-medium text-brand-700 dark:text-brand-400 hover:text-brand-800 dark:hover:text-brand-300"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 pl-10 pr-3 py-2.5 text-sm placeholder:text-slate-400 focus-ring"
                      placeholder="••••••••"
                      autoComplete="current-password"
                    />
                  </div>
                </div>

                {error && (
                  <div className="rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-500/10 px-3 py-2.5 text-sm text-red-700 dark:text-red-400 animate-fade-in">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="group w-full rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold py-3 shadow-elevation-sm btn-press flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? 'Signing in…' : (
                    <>
                      Sign in
                      <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}
                </button>
              </form>

              <p className="text-xs text-slate-400 dark:text-slate-500 mt-8 text-center">
                Need access? Contact your workspace admin.
              </p>
            </>
          )}

          {view === 'forgot-email' && (
            <div className="animate-fade-in-up">
              <button
                type="button"
                onClick={() => { reset(); setView('login') }}
                className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 mb-6"
              >
                <ArrowLeft size={14} /> Back to sign in
              </button>

              <div className="mb-8">
                <div className="w-11 h-11 rounded-xl bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center mb-4">
                  <KeyRound size={20} className="text-brand-700 dark:text-brand-400" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Reset your password</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">We'll send a 6-digit verification code to your email.</p>
              </div>

              <form onSubmit={handleRequestOtp} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wide">Email</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 pl-10 pr-3 py-2.5 text-sm placeholder:text-slate-400 focus-ring"
                      placeholder="you@recykal.com"
                      autoComplete="email"
                      autoFocus
                    />
                  </div>
                </div>

                {error && (
                  <div className="rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-500/10 px-3 py-2.5 text-sm text-red-700 dark:text-red-400 animate-fade-in">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="group w-full rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold py-3 shadow-elevation-sm btn-press flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? 'Sending code…' : (
                    <>
                      Send verification code
                      <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {view === 'forgot-otp' && (
            <div className="animate-fade-in-up">
              <button
                type="button"
                onClick={() => { reset(); setView('forgot-email') }}
                className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 mb-6"
              >
                <ArrowLeft size={14} /> Use a different email
              </button>

              <div className="mb-8">
                <div className="w-11 h-11 rounded-xl bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center mb-4">
                  <CheckCircle2 size={20} className="text-brand-700 dark:text-brand-400" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Check your email</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
                  Enter the 6-digit code sent to <span className="font-medium text-slate-700 dark:text-slate-300">{email}</span> and set a new password.
                </p>
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wide">Verification code</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-3 text-center text-2xl font-mono font-semibold tracking-[0.4em] placeholder:text-slate-300 placeholder:tracking-normal placeholder:text-sm placeholder:font-sans focus-ring"
                    placeholder="000000"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wide">New password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 pl-10 pr-3 py-2.5 text-sm placeholder:text-slate-400 focus-ring"
                      placeholder="At least 6 characters"
                      autoComplete="new-password"
                    />
                  </div>
                </div>

                {error && (
                  <div className="rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-500/10 px-3 py-2.5 text-sm text-red-700 dark:text-red-400 animate-fade-in">
                    {error}
                  </div>
                )}
                {info && (
                  <div className="rounded-lg border border-brand-200 dark:border-brand-900/50 bg-brand-50 dark:bg-brand-500/10 px-3 py-2.5 text-sm text-brand-700 dark:text-brand-400 animate-fade-in">
                    {info}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="group w-full rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold py-3 shadow-elevation-sm btn-press flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? 'Verifying…' : (
                    <>
                      Reset password & sign in
                      <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleRequestOtp}
                  disabled={loading}
                  className="w-full text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 py-1"
                >
                  Didn't get the code? Resend
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Feature({ icon: Icon, text }: { icon: typeof Users; text: string }) {
  return (
    <div className="flex items-center gap-3 text-sm text-white/90">
      <div className="w-8 h-8 rounded-lg bg-white/15 backdrop-blur-sm flex items-center justify-center shrink-0">
        <Icon size={16} />
      </div>
      {text}
    </div>
  )
}
