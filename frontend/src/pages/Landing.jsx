import { useState } from 'react'
import { Zap, ArrowRight, Briefcase, Target, TrendingUp } from 'lucide-react'

export default function Landing() {
  const [showDashboard, setShowDashboard] = useState(false)

  if (showDashboard) {
    const Dashboard = require('./Dashboard').default
    return <Dashboard />
  }

  return (
    <div className="min-h-screen vault-bg vault-grid relative overflow-hidden">
      {/* Floating orbs */}
      <div className="orb w-96 h-96 bg-vault-brass" style={{ top: '-10%', right: '-10%' }} />
      <div className="orb w-72 h-72 bg-vault-emerald" style={{ bottom: '10%', left: '-5%' }} />
      <div className="orb w-48 h-48 bg-vault-purple/40" style={{ top: '50%', right: '20%' }} />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Header */}
        <div className="flex items-center gap-3 mb-16">
          <div className="w-12 h-12 rounded-xl bg-brass-gradient flex items-center justify-center shadow-gold">
            <Zap size={24} className="text-vault-bg" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-vault-text">
              Job<span className="text-brass">Pulse</span>
            </h1>
            <p className="text-vault-text-dim text-xs mono tracking-widest">AI · ML · FULLSTACK DASHBOARD</p>
          </div>
        </div>

        {/* Hero Section */}
        <div className="text-center mb-20">
          <h2 className="text-5xl md:text-6xl font-bold text-vault-text mb-6">
            Find Your Dream Job
          </h2>
          <p className="text-xl text-vault-text-muted max-w-2xl mx-auto mb-8">
            AI-powered job aggregation for AI Engineers, ML Engineers, and Full Stack Developers. 
            Fresh jobs from top sources, filtered and prioritized for you.
          </p>
          <button
            onClick={() => setShowDashboard(true)}
            className="inline-flex items-center gap-2 px-8 py-4 bg-brass-gradient text-vault-bg font-semibold rounded-xl hover:scale-105 transition-transform shadow-gold"
          >
            Get Started
            <ArrowRight size={20} />
          </button>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          <div className="glass-card rounded-xl p-6">
            <div className="w-12 h-12 rounded-lg bg-vault-emerald-dim/20 flex items-center justify-center mb-4">
              <Briefcase className="text-vault-emerald" size={24} />
            </div>
            <h3 className="text-lg font-semibold text-vault-text mb-2">Curated Jobs</h3>
            <p className="text-vault-text-dim text-sm">
              AI, ML, and Full Stack roles from trusted sources like Adzuna, JSearch, and Jooble.
            </p>
          </div>

          <div className="glass-card rounded-xl p-6">
            <div className="w-12 h-12 rounded-lg bg-vault-brass-dim/20 flex items-center justify-center mb-4">
              <Target className="text-vault-brass" size={24} />
            </div>
            <h3 className="text-lg font-semibold text-vault-text mb-2">Smart Filtering</h3>
            <p className="text-vault-text-dim text-sm">
              Filter by role, location, and priority companies. Only relevant jobs for you.
            </p>
          </div>

          <div className="glass-card rounded-xl p-6">
            <div className="w-12 h-12 rounded-lg bg-vault-purple-dim/20 flex items-center justify-center mb-4">
              <TrendingUp className="text-vault-purple" size={24} />
            </div>
            <h3 className="text-lg font-semibold text-vault-text mb-2">Real-time Updates</h3>
            <p className="text-vault-text-dim text-sm">
              Daily automated ingestion ensures you never miss new opportunities.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-vault-text-dim text-sm">
          <p>Built for developers, by developers.</p>
        </div>
      </div>
    </div>
  )
}
