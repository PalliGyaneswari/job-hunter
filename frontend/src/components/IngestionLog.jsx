import { useIngestionLog } from '../hooks/useApplications'
import { CheckCircle2, XCircle, Clock, Database } from 'lucide-react'

const SOURCE_COLOR = {
  adzuna:    'text-blue-400',
  jsearch:   'text-indigo-400',
  jooble:    'text-cyan-400',
  arbeitnow: 'text-teal-400',
  remoteok:  'text-green-400',
}

function formatTs(ts) {
  if (!ts) return '—'
  const d = new Date(ts)
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true,
  })
}

export default function IngestionLog() {
  const { data: logs = [], isLoading } = useIngestionLog(20)

  if (isLoading) {
    return (
      <div className="mt-4 glass-card rounded-xl p-4 border border-vault-border">
        <div className="space-y-2">
          {[1,2,3].map(i => <div key={i} className="skeleton h-10 w-full rounded-lg" />)}
        </div>
      </div>
    )
  }

  if (logs.length === 0) {
    return (
      <div className="mt-4 glass-card rounded-xl p-6 border border-vault-border text-center">
        <Database size={32} className="mx-auto mb-2 text-vault-text-dim opacity-30" />
        <p className="text-vault-text-dim mono text-sm">No ingestion runs yet. Click Refresh to start.</p>
      </div>
    )
  }

  return (
    <div className="mt-4 glass-card rounded-xl border border-vault-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-vault-border bg-vault-navy/60">
              <th className="text-left px-4 py-3 text-vault-text-dim mono tracking-wider uppercase">Time</th>
              <th className="text-left px-4 py-3 text-vault-text-dim mono tracking-wider uppercase">Source</th>
              <th className="text-right px-4 py-3 text-vault-text-dim mono tracking-wider uppercase">Fetched</th>
              <th className="text-right px-4 py-3 text-vault-text-dim mono tracking-wider uppercase">New</th>
              <th className="text-right px-4 py-3 text-vault-text-dim mono tracking-wider uppercase">Updated</th>
              <th className="text-right px-4 py-3 text-vault-text-dim mono tracking-wider uppercase">Filtered</th>
              <th className="text-right px-4 py-3 text-vault-text-dim mono tracking-wider uppercase">Duration</th>
              <th className="px-4 py-3 text-vault-text-dim mono tracking-wider uppercase">Status</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(log => (
              <tr key={log.id} className="border-b border-vault-border/50 hover:bg-vault-navy/40 transition-colors">
                <td className="px-4 py-3 mono text-vault-text-dim whitespace-nowrap">{formatTs(log.run_at)}</td>
                <td className="px-4 py-3">
                  <span className={`mono font-semibold capitalize ${SOURCE_COLOR[log.source] || 'text-vault-text-muted'}`}>
                    {log.source}
                  </span>
                </td>
                <td className="px-4 py-3 mono text-vault-text-muted text-right">{log.jobs_fetched ?? 0}</td>
                <td className="px-4 py-3 mono text-vault-emerald text-right font-semibold">
                  {log.jobs_new > 0 ? `+${log.jobs_new}` : 0}
                </td>
                <td className="px-4 py-3 mono text-vault-sky text-right">
                  {log.jobs_updated > 0 ? `~${log.jobs_updated}` : 0}
                </td>
                <td className="px-4 py-3 mono text-vault-text-dim text-right">{log.jobs_filtered ?? 0}</td>
                <td className="px-4 py-3 mono text-vault-text-dim text-right whitespace-nowrap">
                  {log.duration_ms ? (
                    <span className="flex items-center justify-end gap-1">
                      <Clock size={11} />
                      {(log.duration_ms / 1000).toFixed(1)}s
                    </span>
                  ) : '—'}
                </td>
                <td className="px-4 py-3">
                  {log.error_message ? (
                    <span className="flex items-center gap-1 text-vault-rose" title={log.error_message}>
                      <XCircle size={13} />
                      <span>Error</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-vault-emerald">
                      <CheckCircle2 size={13} />
                      <span>OK</span>
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
