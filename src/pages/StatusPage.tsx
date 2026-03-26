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
    <div className="bg-white rounded-xl p-5 flex items-center justify-between border border-gray-100 shadow-card">
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
    success: 'bg-emerald-500',
    error: 'bg-red-500',
    running: 'bg-amber-500 animate-pulse',
  }

  const statusLabel: Record<string, string> = {
    success: 'text-emerald-600',
    error: 'text-red-600',
    running: 'text-amber-600',
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div>
            <Link
              to="/"
              className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mb-2"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              Back to catalog
            </Link>
            <h1 className="text-3xl font-bold text-gradient tracking-tight">
              Collection Status
            </h1>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span className="material-symbols-outlined text-[16px]">info</span>
            {sources.length} sources configured
          </div>
        </header>

        {/* Error */}
        {error && (
          <div className="bg-red-50 rounded-xl p-4 mb-6 border border-red-200 text-red-600 text-sm flex items-center gap-2">
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
                    className="w-full bg-white rounded-xl p-5 flex items-center justify-between border border-gray-100 shadow-card hover:border-gray-300 text-left group"
                  >
                    <div className="flex items-center gap-4">
                      <span
                        className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                          source.last_run_status
                            ? statusDot[source.last_run_status]
                            : 'bg-gray-300'
                        }`}
                      />
                      <div>
                        <div className="text-sm font-semibold text-gray-800 group-hover:text-gray-900">
                          {source.name}
                        </div>
                        {!source.enabled && (
                          <span className="text-xs text-gray-400">disabled</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-6 text-xs">
                      {/* Schedule */}
                      <div className="text-gray-400 hidden sm:flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">schedule</span>
                        <code className="font-mono">{source.schedule}</code>
                      </div>

                      {/* Last run */}
                      <div className="text-gray-400 hidden md:flex items-center gap-1.5">
                        {source.last_run_status && (
                          <span className={`text-xs capitalize ${statusLabel[source.last_run_status]}`}>
                            {source.last_run_status}
                          </span>
                        )}
                        {source.last_run_at && (
                          <span className="text-gray-400">
                            {formatRelative(source.last_run_at)}
                          </span>
                        )}
                      </div>

                      {/* Next run */}
                      {source.next_run_at && (
                        <div className="text-gray-400 hidden lg:flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">update</span>
                          {formatDateTime(source.next_run_at)}
                        </div>
                      )}

                      {/* Expand icon */}
                      <span
                        className={`material-symbols-outlined text-[18px] text-gray-400 transition-transform ${
                          expandedId === source.id ? 'rotate-180' : ''
                        }`}
                      >
                        expand_more
                      </span>
                    </div>
                  </button>

                  {/* Expanded runs */}
                  {expandedId === source.id && (
                    <div className="ml-6 mt-1 mb-2 border-l-2 border-gray-200 pl-4 space-y-1">
                      {loadingRuns === source.id ? (
                        <div className="py-4 flex items-center gap-2 text-sm text-gray-400">
                          <span className="material-symbols-outlined text-[16px] animate-spin">
                            progress_activity
                          </span>
                          Loading run history...
                        </div>
                      ) : runsMap[source.id]?.length ? (
                        runsMap[source.id].map(run => (
                          <div
                            key={run.id}
                            className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-gray-100 text-sm"
                          >
                            <div className="flex items-center gap-3">
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${statusDot[run.status]}`}
                              />
                              <span className={`capitalize text-xs font-medium ${statusLabel[run.status]}`}>
                                {run.status}
                              </span>
                              <span className="text-xs text-gray-400">
                                {formatDateTime(run.started_at)}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-gray-400">
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
                                  className="text-red-500 truncate max-w-[250px]"
                                  title={run.error_message}
                                >
                                  {run.error_message}
                                </span>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="py-3 text-xs text-gray-400">No runs recorded yet</div>
                      )}
                    </div>
                  )}
                </div>
              ))}
        </div>

        {/* Empty state */}
        {!loading && !error && sources.length === 0 && (
          <div className="text-center py-20">
            <span className="material-symbols-outlined text-5xl text-gray-300 mb-4 block">
              cloud_off
            </span>
            <p className="text-gray-500">No data sources configured</p>
          </div>
        )}
      </div>
    </div>
  )
}
