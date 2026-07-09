import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Eye, EyeOff, Zap, Lock, User, AlertCircle, Loader2 } from 'lucide-react'

export default function Login() {
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const canvasRef = useRef(null)

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) navigate('/', { replace: true })
  }, [isAuthenticated, navigate])

  // Particle canvas background
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animId
    const particles = []

    const resize = () => {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    // Create particles
    for (let i = 0; i < 60; i++) {
      particles.push({
        x:  Math.random() * canvas.width,
        y:  Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r:  Math.random() * 1.5 + 0.3,
        alpha: Math.random() * 0.4 + 0.1,
        color: Math.random() > 0.7 ? '#c9a84c' : '#1e2444',
      })
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy
        if (p.x < 0) p.x = canvas.width
        if (p.x > canvas.width) p.x = 0
        if (p.y < 0) p.y = canvas.height
        if (p.y > canvas.height) p.y = 0

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = p.color
        ctx.globalAlpha = p.alpha
        ctx.fill()
      })
      ctx.globalAlpha = 1
      animId = requestAnimationFrame(draw)
    }
    draw()
    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!username.trim() || !password) {
      setError('Please enter username and password.')
      return
    }
    setLoading(true)
    try {
      await login(username.trim(), password)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Check credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen vault-bg overflow-hidden flex items-center justify-center p-4">
      {/* Particle canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }} />

      {/* Floating orbs */}
      <div className="orb w-96 h-96 bg-vault-brass" style={{ top: '-10%', right: '-5%' }} />
      <div className="orb w-64 h-64 bg-vault-emerald" style={{ bottom: '5%', left: '-5%' }} />

      {/* Grid overlay */}
      <div className="absolute inset-0 vault-grid pointer-events-none" style={{ zIndex: 1 }} />

      {/* Login card */}
      <div
        className="relative z-10 w-full max-w-md animate-slide-up"
        style={{ zIndex: 2 }}
      >
        {/* Header branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-brass-gradient flex items-center justify-center shadow-gold">
              <Zap size={20} className="text-vault-bg" strokeWidth={2.5} />
            </div>
            <span className="text-2xl font-bold tracking-tight text-vault-text">
              Job<span className="text-brass">Pulse</span>
            </span>
          </div>
          <p className="text-vault-text-muted text-sm mono tracking-wider">
            PERSONAL AI & FULLSTACK JOB AGGREGATOR
          </p>
        </div>

        {/* Card */}
        <div className="glass-card rounded-2xl p-8 shadow-vault-lg border border-vault-border">
          {/* Inner gold border accent */}
          <div className="absolute inset-0 rounded-2xl pointer-events-none"
               style={{ background: 'linear-gradient(135deg, rgba(201,168,76,0.08) 0%, transparent 60%)', borderRadius: '16px' }} />

          <h1 className="text-xl font-semibold text-vault-text mb-1">Sign in</h1>
          <p className="text-vault-text-dim text-sm mb-6">Access your curated job dashboard</p>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-vault-rose-dim/20 border border-vault-rose/30 mb-5 animate-fade-in">
              <AlertCircle size={16} className="text-vault-rose flex-shrink-0" />
              <span className="text-vault-rose text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username */}
            <div>
              <label htmlFor="lp-username" className="block text-xs font-semibold text-vault-text-muted uppercase tracking-widest mb-2">
                Username
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-vault-text-dim pointer-events-none" />
                <input
                  id="lp-username"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="admin"
                  className="w-full bg-vault-navy/80 border border-vault-border rounded-lg pl-10 pr-4 py-3 text-vault-text mono text-sm focus:border-vault-brass focus:outline-none focus:ring-1 focus:ring-vault-brass/30 transition-all placeholder:text-vault-text-dim"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="lp-password" className="block text-xs font-semibold text-vault-text-muted uppercase tracking-widest mb-2">
                Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-vault-text-dim pointer-events-none" />
                <input
                  id="lp-password"
                  type={showPw ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-vault-navy/80 border border-vault-border rounded-lg pl-10 pr-11 py-3 text-vault-text mono text-sm focus:border-vault-brass focus:outline-none focus:ring-1 focus:ring-vault-brass/30 transition-all placeholder:text-vault-text-dim"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(p => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-vault-text-dim hover:text-vault-brass transition-colors"
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              id="login-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full btn-brass rounded-lg py-3 px-4 font-bold text-sm tracking-wide flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Authenticating…</span>
                </>
              ) : (
                <>
                  <Zap size={16} strokeWidth={2.5} />
                  <span>Access Dashboard</span>
                </>
              )}
            </button>
          </form>

          {/* Default creds hint (dev only) */}
          {import.meta.env.DEV && (
            <p className="text-center text-vault-text-dim mono text-xs mt-5 opacity-50">
              Default: admin / JobPulse2024!
            </p>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-vault-text-dim text-xs mt-6 mono">
          Personal dashboard — no external signup needed
        </p>
      </div>
    </div>
  )
}
