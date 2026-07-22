import { useState } from 'react'
import { useApplyJob, useUnapplyJob } from '../hooks/useJobs'
import {
  MapPin, Calendar, ExternalLink, CheckCircle2, Star,
  ShieldCheck, AlertTriangle, XCircle, Building2, Tag,
  Loader2, Flame
} from 'lucide-react'

const CATEGORY_STYLES = {
  'AI Engineer':              { bg: 'bg-vault-purple/20',    border: 'border-vault-purple/40',    text: 'text-vault-purple'    },
  'ML Engineer':              { bg: 'bg-vault-sky/20',       border: 'border-vault-sky/40',       text: 'text-vault-sky'       },
  'Full Stack Developer':     { bg: 'bg-vault-emerald/20',   border: 'border-vault-emerald/40',   text: 'text-vault-emerald'   },
  'Software Engineer':        { bg: 'bg-vault-brass/20',     border: 'border-vault-brass/40',     text: 'text-vault-brass'     },
  'Software Engineer Intern': { bg: 'bg-vault-amber/20',     border: 'border-vault-amber/40',     text: 'text-vault-amber'     },
  'Other':                    { bg: 'bg-vault-border/40',    border: 'border-vault-border',       text: 'text-vault-text-muted'},
}

const SOURCE_LABELS = {
  adzuna:    { label: 'Adzuna',    color: 'text-blue-400' },
  jsearch:   { label: 'JSearch',   color: 'text-indigo-400' },
  jooble:    { label: 'Jooble',    color: 'text-cyan-400' },
  arbeitnow: { label: 'Arbeitnow', color: 'text-teal-400' },
  remoteok:  { label: 'RemoteOK',  color: 'text-green-400' },
  seed:      { label: 'Demo',      color: 'text-vault-text-dim' },
}

function formatDate(dateStr) {
  if (!dateStr) return 'Unknown date'
  const d = new Date(dateStr)
  const now = new Date()
  const diffDays = Math.floor((now - d) / 86400000)
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7)  return `${diffDays}d ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

function isPostedToday(postedDate, createdAt) {
  const checkDate = (dStr) => {
    if (!dStr) return false
    const d = new Date(dStr)
    const now = new Date()
    return d.toDateString() === now.toDateString()
  }
  return checkDate(postedDate) || checkDate(createdAt)
}

export default function JobCard({ job, showAppliedStatus = false }) {
  const applyMut   = useApplyJob()
  const unapplyMut = useUnapplyJob()
  const isApplied  = !!job.applied_id
  const isLoading  = applyMut.isPending || unapplyMut.isPending
  const isNewToday = isPostedToday(job.posted_date, job.created_at)

  const catStyle = CATEGORY_STYLES[job.role_category] || CATEGORY_STYLES['Other']
  const src      = SOURCE_LABELS[job.source] || { label: job.source, color: 'text-vault-text-dim' }

  const handleApplyToggle = () => {
    if (isLoading) return
    if (isApplied) {
      unapplyMut.mutate(job.id)
    } else {
      applyMut.mutate({ id: job.id })
    }
  }

  return (
    <article className="glass-card card-hover rounded-xl p-5 flex flex-col gap-4 animate-fade-in border border-vault-border relative overflow-hidden">
      {/* Priority shimmer accent */}
      {job.is_priority === 1 && (
        <div className="absolute inset-x-0 top-0 h-0.5 bg-brass-gradient" />
      )}

      {/* ─── Top Row: Badges ─────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Role category */}
        <span className={`badge ${catStyle.bg} border ${catStyle.border} ${catStyle.text}`}>
          <Tag size={9} />
          {job.role_category}
        </span>

        {/* New on the block */}
        {isNewToday && (
          <span className="badge bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold shadow-[0_0_10px_rgba(245,158,11,0.2)] animate-pulse">
            <Flame size={9} />
            New on the block
          </span>
        )}

        {/* Priority */}
        {job.is_priority === 1 && (
          <span className="badge bg-vault-gold/15 border border-vault-gold/30 text-vault-gold">
            <Star size={9} fill="currentColor" />
            Priority
          </span>
        )}

        {/* Verified */}
        {job.is_verified === 1 && (
          <span className="badge bg-vault-emerald/15 border border-vault-emerald/30 text-vault-emerald">
            <ShieldCheck size={9} />
            Verified
          </span>
        )}

        {/* Stale */}
        {job.is_stale === 1 && job.is_active === 1 && (
          <span className="badge bg-vault-amber/15 border border-vault-amber/30 text-vault-amber">
            <AlertTriangle size={9} />
            Stale
          </span>
        )}

        {/* Closed by employer */}
        {job.closed_by_employer === 1 && (
          <span className="badge bg-vault-rose/15 border border-vault-rose/30 text-vault-rose">
            <XCircle size={9} />
            Closed by employer
          </span>
        )}

        {/* Inactive (closed tab) */}
        {job.is_active === 0 && !job.closed_by_employer && (
          <span className="badge bg-vault-text-dim/15 border border-vault-text-dim/30 text-vault-text-dim">
            <XCircle size={9} />
            Inactive
          </span>
        )}
      </div>

      {/* ─── Title & Company ─────────────────────────────────────────── */}
      <div>
        <h2 className="text-vault-text font-semibold text-base leading-tight line-clamp-2 mb-1">
          {job.title}
        </h2>
        <div className="flex items-center gap-1.5 text-vault-text-muted">
          <Building2 size={13} className="flex-shrink-0" />
          <span className="text-sm font-medium">{job.company}</span>
        </div>
      </div>

      {/* ─── Location & Date ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-vault-text-dim">
          <MapPin size={12} className="flex-shrink-0" />
          <span className="mono truncate max-w-[140px]">{job.location}</span>
        </div>
        <div className="flex items-center gap-1.5 text-vault-text-dim">
          <Calendar size={12} />
          <span className="mono">{formatDate(job.posted_date)}</span>
        </div>
      </div>

      {/* ─── Description snippet ─────────────────────────────────────── */}
      {job.description_snippet && (
        <p className="text-vault-text-dim text-xs leading-relaxed line-clamp-3 border-t border-vault-border/50 pt-3">
          {job.description_snippet}
        </p>
      )}

      {/* ─── Applied date (My Applications tab) ─────────────────────── */}
      {showAppliedStatus && job.applied_date && (
        <div className="flex items-center gap-1.5 text-vault-emerald text-xs mono">
          <CheckCircle2 size={13} />
          Applied {formatDate(job.applied_date)}
        </div>
      )}

      {/* ─── Source label ────────────────────────────────────────────── */}
      <div className={`text-xs mono tracking-wider ${src.color} opacity-70`}>
        via {src.label}
      </div>

      {/* ─── Action buttons ──────────────────────────────────────────── */}
      <div className="flex items-center gap-2 mt-auto">
        {/* Apply button */}
        <a
          href={job.url}
          target="_blank"
          rel="noopener noreferrer"
          id={`apply-link-${job.id}`}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg btn-brass text-xs font-bold tracking-wide flex-1 justify-center"
          onClick={e => e.stopPropagation()}
        >
          <ExternalLink size={13} strokeWidth={2.5} />
          Apply Now
        </a>

        {/* Mark as Applied toggle */}
        <button
          id={`mark-applied-${job.id}`}
          onClick={handleApplyToggle}
          disabled={isLoading}
          title={isApplied ? 'Remove from Applied' : 'Mark as Applied'}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold transition-all flex-shrink-0 ${
            isApplied
              ? 'btn-applied border-vault-emerald'
              : 'bg-vault-card border-vault-border text-vault-text-muted hover:border-vault-emerald/40 hover:text-vault-emerald'
          } disabled:opacity-50`}
        >
          {isLoading ? (
            <Loader2 size={13} className="animate-spin" />
          ) : isApplied ? (
            <>
              <CheckCircle2 size={13} />
              <span>Applied ✓</span>
            </>
          ) : (
            <span>Mark Applied</span>
          )}
        </button>
      </div>
    </article>
  )
}
