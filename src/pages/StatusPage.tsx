import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

interface Source {
  id: string
  name: string
  schedule: string
  enabled: boolean
  last_run_status: 'success' | 'error' | 'running' | null
  last_run_at: string | null
  next_run_at: string | null
}

interface Run {
  id: string
  source_id: string
  status: 'success' | 'error' | 'running'
  started_at: string
  finished_at: string | null
  rows_collected: number | null
  error_message: string | null
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatRelative(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

function ShimmerRow() {
  return (
    <div className="glass rounded-xl p-5 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="shimmer w-3 h-3 rounded-full" />
        <div className="shimmer h-5 w-40 rounded" />
      </div>
      <div className="flex gap-6">
        <div className="shimmer h-4 w-24 rounded" />
        <div className="shimmer h-4 w-20 rounded" />
        <div className="shimmer h-4 w-20 rounded" />
      </div>
    </div>
  )
}

export default function StatusPage() {
  const [sources, setSources] = useState<Source[]>([])
  const [runsMap, setRunsMap] = useState<Record<string, Run[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [loadingRuns, setLoadingRuns] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/sources')
      .then(r => {
        if (!r.ok) throw new Error('Failed to fetch sources')
        return r.json()
      })
      .then(data => {
        setSources(data)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  const toggleExpand = async (sourceId: string) => {
    if (expandedId === sourceId) {
      setExpandedId(null)
      return
    }
    setExpandedId(sourceId)

    if (!runsMap[sourceId]) {
      setLoadingRuns(sourceId)
      try {
        const res = await fetch(`/api/runs?source_id=${sourceId}`)
        if (res.ok) {
          const data = await res.json()
          setRunsMap(prev => ({ ...prev, [sourceId]: data }))
        }
      } catch {
        // silently fail
      } finally {
        setLoadingRuns(null)
      }
    }
  }

  const statusDot: Record<string, string> = {
    success: 'bg-emerald-400',
    error: 'bg-red-400',
    running: 'bg-amber-400 animate-pulse',
  }

  const statusLabel: Record<string, string> = {
    success: 'text-emerald-400',
    error: 'text-red-400',
    running: 'text-amber-400',
  }

  return (
    <div className="min-h-screen ambient-glow">
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div>
            <Link
              to="/"
              className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-300 mb-2"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              Back to catalog
            </Link>
            <h1 className="text-3xl font-bold text-gradient tracking-tight">
              Collection Status
            </h1>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span className="material-symbols-outlined text-[16px]">info</span>
            {sources.length} sources configured
          </div>
        </header>

        {/* Error */}
        {error && (
          <div className="glass rounded-xl p-4 mb-6 border-red-500/30 text-red-400 text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            {error}
          </div>
        )}

        {/* Sources list */}
        <div className="space-y-3">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <ShimmerRow key={i} />)
            : sources.map(source => (
                <div key={source.id}>
                  {/* Source row */}
                  <button
                    onClick={() => toggleExpand(source.id)}
                    className="w-full glass rounded-xl p-5 flex items-center justify-between hover:border-slate-600/60 text-left group"
                  >
                    <div className="flex items-center gap-4">
                      <span
                        className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                          source.last_run_status
                            ? statusDot[source.last_run_status]
                            : 'bg-slate-600'
                        }`}
                      />
                      <div>
                        <div className="text-sm font-semibold text-slate-200 group-hover:text-white">
                          {source.name}
                        </div>
                        {!source.enabled && (
                          <span className="text-xs text-slate-600">disabled</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-6 text-xs">
                      {/* Schedule */}
                      <div className="text-slate-500 hidden sm:flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">schedule</span>
                        <code className="font-mono">{source.schedule}</code>
                      </div>

                      {/* Last run */}
                      <div className="text-slate-400 hidden md:flex items-center gap-1.5">
                        {source.last_run_status && (
                          <span className={`text-xs capitalize ${statusLabel[source.last_run_status]}`}>
                            {source.last_run_status}
                          </span>
                        )}
                        {source.last_run_at && (
                          <span className="text-slate-500">
                            {formatRelative(source.last_run_at)}
                          </span>
                        )}
                      </div>

                      {/* Next run */}
                      {source.next_run_at && (
                        <div className="text-slate-500 hidden lg:flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">update</span>
                          {formatDateTime(source.next_run_at)}
                        </div>
                      )}

                      {/* Expand icon */}
                      <span
                        className={`material-symbols-outlined text-[18px] text-slate-500 transition-transform ${
                          expandedId === source.id ? 'rotate-180' : ''
                        }`}
                      >
                        expand_more
                      </span>
                    </div>
                  </button>

                  {/* Expanded runs */}
                  {expandedId === source.id && (
                    <div className="ml-6 mt-1 mb-2 border-l-2 border-slate-800 pl-4 space-y-1">
                      {loadingRuns === source.id ? (
                        <div className="py-4 flex items-center gap-2 text-sm text-slate-500">
                          <span className="material-symbols-outlined text-[16px] animate-spin">
                            progress_activity
                          </span>
                          Loading run history...
                        </div>
                      ) : runsMap[source.id]?.length ? (
                        runsMap[source.id].map(run => (
                          <div
                            key={run.id}
                            className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-slate-800/30 text-sm"
                          >
                            <div className="flex items-center gap-3">
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${statusDot[run.status]}`}
                              />
                              <span className={`capitalize text-xs font-medium ${statusLabel[run.status]}`}>
                                {run.status}
                              </span>
                              <span className="text-xs text-slate-500">
                                {formatDateTime(run.started_at)}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-slate-500">
                              {run.rows_collected != null && (
                                <span>{run.rows_collected.toLocaleString()} rows</span>
                              )}
                              {run.finished_at && (
                                <span>
                                  {Math.round(
                                    (new Date(run.finished_at).getTime() -
                                      new Date(run.started_at).getTime()) /
                                      1000
                                  )}
                                  s
                                </span>
                              )}
                              {run.error_message && (
                                <span
                                  className="text-red-400 truncate max-w-[250px]"
                                  title={run.error_message}
                                >
                                  {run.error_message}
                                </span>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="py-3 text-xs text-slate-500">No runs recorded yet</div>
                      )}
                    </div>
                  )}
                </div>
              ))}
        </div>

        {/* Empty state */}
        {!loading && !error && sources.length === 0 && (
          <div className="text-center py-20">
            <span className="material-symbols-outlined text-5xl text-slate-600 mb-4 block">
              cloud_off
            </span>
            <p className="text-slate-400">No data sources configured</p>
          </div>
        )}
      </div>
    </div>
  )
}
