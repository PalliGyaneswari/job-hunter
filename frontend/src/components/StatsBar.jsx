import { useEffect, useRef } from 'react'
import { BriefcaseIcon, Star, CheckCircle2, XCircle } from 'lucide-react'

function AnimatedNumber({ value = 0 }) {
  const ref = useRef(null)
  const prev = useRef(0)

  useEffect(() => {
    if (!ref.current || value === prev.current) return
    const start = prev.current
    const end   = value
    const duration = 800
    const startTime = performance.now()

    const tick = (now) => {
      const progress = Math.min((now - startTime) / duration, 1)
      const ease = 1 - Math.pow(1 - progress, 3) // ease-out cubic
      const current = Math.round(start + (end - start) * ease)
      if (ref.current) ref.current.textContent = current.toLocaleString()
      if (progress < 1) requestAnimationFrame(tick)
      else prev.current = end
    }
    requestAnimationFrame(tick)
  }, [value])

  return <span ref={ref}>{(value || 0).toLocaleString()}</span>
}

const STAT_CARDS = [
  {
    key:   'total_active',
    label: 'Active Jobs',
    icon:  BriefcaseIcon,
    color: 'text-vault-sky',
    glow:  'shadow-[0_0_20px_rgba(56,189,248,0.15)]',
    accent:'bg-vault-sky/10 border-vault-sky/20',
  },
  {
    key:   'total_priority',
    label: 'Priority Companies',
    icon:  Star,
    color: 'text-vault-gold',
    glow:  'shadow-gold',
    accent:'bg-vault-gold/10 border-vault-gold/20',
  },
  {
    key:   'total_applied',
    label: 'Applications',
    icon:  CheckCircle2,
    color: 'text-vault-emerald',
    glow:  'shadow-emerald',
    accent:'bg-vault-emerald/10 border-vault-emerald/20',
  },
  {
    key:   'total_closed',
    label: 'Closed',
    icon:  XCircle,
    color: 'text-vault-rose',
    glow:  'shadow-[0_0_20px_rgba(239,68,68,0.15)]',
    accent:'bg-vault-rose/10 border-vault-rose/20',
  },
]

export default function StatsBar({ stats }) {
  if (!stats) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {STAT_CARDS.map(c => (
          <div key={c.key} className="glass-card rounded-xl p-4 border border-vault-border">
            <div className="skeleton h-8 w-16 mb-2" />
            <div className="skeleton h-3 w-24" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      {STAT_CARDS.map(({ key, label, icon: Icon, color, glow, accent }) => (
        <div
          key={key}
          className={`glass-card rounded-xl p-4 border transition-all hover:scale-[1.02] ${accent} ${glow}`}
        >
          <div className="flex items-start justify-between mb-3">
            <div className={`p-2 rounded-lg ${accent} border`}>
              <Icon size={16} className={color} />
            </div>
          </div>
          <div className={`text-3xl font-bold mono ${color} mb-1`}>
            <AnimatedNumber value={stats[key] || 0} />
          </div>
          <p className="text-vault-text-dim text-xs font-medium tracking-wide uppercase">{label}</p>
        </div>
      ))}
    </div>
  )
}
