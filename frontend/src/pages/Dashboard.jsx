import { useState } from 'react'
import { useJobStats, useRefreshPipeline } from '../hooks/useJobs'
import StatsBar    from '../components/StatsBar'
import TabNav      from '../components/TabNav'
import FilterBar   from '../components/FilterBar'
import JobCard     from '../components/JobCard'
import Pagination  from '../components/Pagination'
import IngestionLog from '../components/IngestionLog'
import { useJobs }  from '../hooks/useJobs'
import { useApplications } from '../hooks/useApplications'
import { useAuth }  from '../contexts/AuthContext'
import { Zap, RefreshCw, BriefcaseIcon, Loader2, LogOut, Flame, Info } from 'lucide-react'

const TABS = [
  { id: 'all',          label: 'All Jobs',          icon: '🌐' },
  { id: 'priority',     label: 'Priority Companies', icon: '⭐' },
  { id: 'applications', label: 'My Applications',   icon: '📋' },
  { id: 'closed',       label: 'Closed',            icon: '🔒' },
]

export default function Dashboard() {
  const { logout } = useAuth()
  const [activeTab,  setActiveTab]  = useState('all')
  const [category,   setCategory]   = useState('')
  const [location,   setLocation]   = useState('')
  const [search,     setSearch]     = useState('')
  const [page,       setPage]       = useState(1)
  const [showLog,    setShowLog]    = useState(false)

  const { data: stats } = useJobStats()
  const refreshPipeline = useRefreshPipeline()

  // Applications tab uses its own hook
  const { data: applications, isLoading: appLoading } = useApplications()

  // All other tabs use jobs hook
  const { data: jobsData, isLoading, isError } = useJobs({
    tab:      activeTab !== 'applications' ? activeTab : 'all',
    category,
    location,
    search,
    page,
    limit:    20,
  })

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setPage(1)
    setSearch('')
  }

  const handleRefresh = async () => {
    try {
      await refreshPipeline.mutateAsync()
    } catch { /* error handled by mutation */ }
  }

  const jobs       = activeTab === 'applications' ? (applications || []) : (jobsData?.data || [])
  const pagination = activeTab !== 'applications' ? jobsData?.pagination : null
  const isJobsLoading = activeTab === 'applications' ? appLoading : isLoading

  return (
    <div className="min-h-screen vault-bg vault-grid relative">
      {/* Floating orbs */}
      <div className="orb w-96 h-96 bg-vault-brass" style={{ top: '-5%', right: '0%' }} />
      <div className="orb w-72 h-72 bg-vault-emerald" style={{ bottom: '10%', left: '-3%' }} />
      <div className="orb w-48 h-48 bg-vault-purple/40" style={{ top: '40%', right: '10%' }} />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* ─── Header ─────────────────────────────────────────────────────── */}
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brass-gradient flex items-center justify-center shadow-gold">
              <Zap size={20} className="text-vault-bg" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-vault-text">
                Job<span className="text-brass">Pulse</span>
              </h1>
              <p className="text-vault-text-dim text-xs mono tracking-widest">AI · ML · FULLSTACK DASHBOARD</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Live indicator */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-vault-card border border-vault-border">
              <div className="pulse-dot" />
              <span className="mono text-xs text-vault-text-muted tracking-wider">LIVE</span>
            </div>

            {/* Refresh */}
            <button
              id="dashboard-refresh-btn"
              onClick={handleRefresh}
              disabled={refreshPipeline.isPending}
              title="Trigger pipeline refresh"
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-vault-card border border-vault-border text-vault-text-muted hover:text-vault-brass hover:border-vault-brass/40 transition-all text-sm font-medium disabled:opacity-50"
            >
              {refreshPipeline.isPending
                ? <Loader2 size={15} className="animate-spin" />
                : <RefreshCw size={15} />
              }
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {/* Logout */}
            <button
              id="dashboard-logout-btn"
              onClick={logout}
              title="Logout from dashboard"
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-vault-card border border-vault-border text-vault-text-muted hover:text-vault-rose hover:border-vault-rose/40 transition-all text-sm font-medium"
            >
              <LogOut size={15} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* ─── Refresh feedback ────────────────────────────────────────────── */}
        {refreshPipeline.isSuccess && (
          <div className="mb-4 p-3 rounded-lg bg-vault-emerald-dim/20 border border-vault-emerald/30 animate-fade-in flex items-center gap-2">
            <span className="text-vault-emerald text-sm">✓ Pipeline started — new jobs will appear in a few minutes.</span>
            <button
              className="ml-auto text-vault-text-dim hover:text-vault-text text-xs"
              onClick={() => setShowLog(true)}
            >
              View log →
            </button>
          </div>
        )}

        {/* ─── Daily Cron / New Jobs Status Banner ────────────────────────────── */}
        {stats && (
          <div className={`mb-6 p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in ${
            stats.total_new_today > 0
              ? 'bg-gradient-to-r from-amber-500/15 via-vault-brass/10 to-transparent border-amber-500/30 shadow-[0_0_25px_rgba(245,158,11,0.12)]'
              : 'bg-vault-card/60 border-vault-border/80'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                stats.total_new_today > 0
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-vault-border/30 text-vault-text-dim'
              }`}>
                {stats.total_new_today > 0 ? <Flame size={20} className="animate-pulse" /> : <Info size={18} />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-sm text-vault-text tracking-wide">
                    {stats.total_new_today > 0 ? (
                      <span className="text-amber-400">🔥 New on the block: {stats.total_new_today} new job{stats.total_new_today > 1 ? 's' : ''} posted today!</span>
                    ) : (
                      <span className="text-vault-text-muted">No new jobs posted today</span>
                    )}
                  </h2>
                  {stats.total_new_today > 0 && (
                    <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300">
                      Fresh Today
                    </span>
                  )}
                </div>
                <p className="text-xs text-vault-text-dim mt-0.5">
                  {stats.total_new_today > 0
                    ? 'The daily cron run ingested fresh opportunities for you overnight.'
                    : 'The daily cron runs automatically at 2:00 AM IST. Check back after the next run or click Refresh.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs mono text-vault-text-dim bg-vault-bg/40 px-3 py-1.5 rounded-lg border border-vault-border/40 self-start sm:self-center">
              <span className="w-2 h-2 rounded-full bg-vault-emerald inline-block" />
              <span>Daily Cron Active</span>
            </div>
          </div>
        )}

        {/* ─── Stats Bar ───────────────────────────────────────────────────── */}
        <StatsBar stats={stats} />

        {/* ─── Tab Navigation ──────────────────────────────────────────────── */}
        <TabNav
          tabs={TABS}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          stats={stats}
        />

        {/* ─── Filter Bar (not shown on applications/closed tabs) ──────────── */}
        {activeTab !== 'applications' && (
          <FilterBar
            category={category}
            location={location}
            search={search}
            onCategoryChange={v => { setCategory(v); setPage(1) }}
            onLocationChange={v => { setLocation(v); setPage(1) }}
            onSearchChange={v => { setSearch(v); setPage(1) }}
            totalResults={pagination?.total}
          />
        )}

        {/* ─── Job Grid ────────────────────────────────────────────────────── */}
        <main id="jobs-grid">
          {isJobsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="glass-card rounded-xl p-5 animate-pulse">
                  <div className="skeleton h-5 w-3/4 mb-3" />
                  <div className="skeleton h-4 w-1/2 mb-4" />
                  <div className="skeleton h-3 w-full mb-2" />
                  <div className="skeleton h-3 w-4/5 mb-4" />
                  <div className="flex gap-2">
                    <div className="skeleton h-8 w-24 rounded-lg" />
                    <div className="skeleton h-8 w-28 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-20 text-vault-text-dim">
              <span className="text-4xl mb-3">⚠️</span>
              <p className="mono text-sm">Failed to load jobs. Is the backend running?</p>
            </div>
          ) : jobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-vault-text-dim">
              <BriefcaseIcon size={48} className="mb-4 opacity-20" />
              <p className="text-lg font-medium text-vault-text-muted mb-2">No jobs found</p>
              <p className="mono text-sm text-vault-text-dim">
                {activeTab === 'applications'
                  ? 'No applications yet. Click "Mark as Applied" on any job card.'
                  : 'Try adjusting filters or click Refresh to fetch from APIs.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-4">
              {jobs.map(job => (
                <JobCard key={job.id} job={job} showAppliedStatus={activeTab === 'applications'} />
              ))}
            </div>
          )}
        </main>

        {/* ─── Pagination ──────────────────────────────────────────────────── */}
        {pagination && pagination.totalPages > 1 && (
          <Pagination
            currentPage={page}
            totalPages={pagination.totalPages}
            onPageChange={setPage}
          />
        )}

        {/* ─── Ingestion Log ────────────────────────────────────────────────── */}
        <div className="mt-8">
          <button
            id="toggle-ingestion-log-btn"
            onClick={() => setShowLog(v => !v)}
            className="flex items-center gap-2 text-vault-text-dim hover:text-vault-text-muted mono text-xs tracking-wider transition-colors"
          >
            <span className="text-vault-brass">{showLog ? '▼' : '▶'}</span>
            {showLog ? 'HIDE' : 'SHOW'} INGESTION LOG
          </button>
          {showLog && <IngestionLog />}
        </div>
      </div>
    </div>
  )
}
