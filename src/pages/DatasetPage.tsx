import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'

interface Dataset {
  id: string
  title: string
  description: string
  category: string
  update_frequency: string
  last_updated: string
  row_count: number
  source_id: string
  source: string
  date_range_start: string
  date_range_end: string
  preview_data: Record<string, unknown>[] | null
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

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function ShimmerBlock({ className }: { className: string }) {
  return <div className={`shimmer rounded ${className}`} />
}

export default function DatasetPage() {
  const { id } = useParams<{ id: string }>()
  const [dataset, setDataset] = useState<Dataset | null>(null)
  const [runs, setRuns] = useState<Run[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    if (!id) return

    Promise.all([
      fetch(`/api/datasets/${id}`).then(r => {
        if (!r.ok) throw new Error('Dataset not found')
        return r.json()
      }),
    ])
      .then(([ds]) => {
        setDataset(ds)
        if (ds.source_id) {
          fetch(`/api/runs?source_id=${ds.source_id}`)
            .then(r => r.json())
            .then(setRuns)
            .catch(() => {})
        }
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [id])

  const handleDownload = async () => {
    if (!id || downloading) return
    setDownloading(true)
    try {
      const res = await fetch(`/api/datasets/${id}/download`)
      if (!res.ok) throw new Error('Download failed')
      const data = await res.json()
      if (data.url) {
        window.open(data.url, '_blank')
      }
    } catch {
      alert('Failed to generate download link')
    } finally {
      setDownloading(false)
    }
  }

  const previewData = dataset?.preview_data || []
  const previewColumns = previewData.length > 0 ? Object.keys(previewData[0]) : []

  const statusColor: Record<string, string> = {
    success: 'text-emerald-600',
    error: 'text-red-600',
    running: 'text-amber-600',
  }

  const statusDot: Record<string, string> = {
    success: 'bg-emerald-500',
    error: 'bg-red-500',
    running: 'bg-amber-500 animate-pulse',
  }

  const categoryColor: Record<string, string> = {
    Commodities: 'bg-amber-50 text-amber-700 border-amber-200',
    Macro: 'bg-blue-50 text-blue-700 border-blue-200',
    Sentiment: 'bg-purple-50 text-purple-700 border-purple-200',
    Market: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ShimmerBlock className="h-4 w-48 mb-8" />
          <ShimmerBlock className="h-10 w-96 mb-4" />
          <ShimmerBlock className="h-5 w-full max-w-2xl mb-8" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-4 border border-gray-100 shadow-card">
                <ShimmerBlock className="h-4 w-16 mb-2" />
                <ShimmerBlock className="h-6 w-24" />
              </div>
            ))}
          </div>
          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-card">
            <ShimmerBlock className="h-6 w-32 mb-4" />
            {Array.from({ length: 5 }).map((_, i) => (
              <ShimmerBlock key={i} className="h-8 w-full mb-2" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error || !dataset) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 text-center max-w-md border border-gray-100 shadow-card">
          <span className="material-symbols-outlined text-5xl text-red-400 mb-4 block">
            error
          </span>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {error || 'Dataset not found'}
          </h2>
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-sm text-violet-600 hover:text-violet-700 mt-4"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Back to catalog
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
          <Link to="/" className="hover:text-gray-600 flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">home</span>
            Home
          </Link>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-gray-700">{dataset.title}</span>
        </nav>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">{dataset.title}</h1>
              <span
                className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${
                  categoryColor[dataset.category] || 'bg-gray-50 text-gray-600 border-gray-200'
                }`}
              >
                {dataset.category}
              </span>
            </div>
            <p className="text-gray-500 leading-relaxed max-w-2xl">{dataset.description}</p>
          </div>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-lg text-sm font-medium shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">
              {downloading ? 'hourglass_empty' : 'download'}
            </span>
            {downloading ? 'Generating...' : 'Download CSV'}
          </button>
        </div>

        {/* Metadata cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
          {[
            { icon: 'category', label: 'Category', value: dataset.category },
            { icon: 'schedule', label: 'Frequency', value: dataset.update_frequency },
            { icon: 'source', label: 'Source', value: dataset.source || '--' },
            {
              icon: 'date_range',
              label: 'Date Range',
              value: dataset.date_range_start && dataset.date_range_end
                ? `${formatDate(dataset.date_range_start)} - ${formatDate(dataset.date_range_end)}`
                : '--',
            },
            { icon: 'database', label: 'Rows', value: dataset.row_count?.toLocaleString() || '--' },
          ].map(item => (
            <div key={item.label} className="bg-white rounded-xl p-4 border border-gray-100 shadow-card">
              <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-1">
                <span className="material-symbols-outlined text-[14px]">{item.icon}</span>
                {item.label}
              </div>
              <div className="text-sm font-medium text-gray-800 truncate">{item.value}</div>
            </div>
          ))}
        </div>

        {/* Preview table */}
        {previewData.length > 0 && (
          <div className="bg-white rounded-xl p-6 mb-8 border border-gray-100 shadow-card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-violet-500">table_view</span>
              Data Preview
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    {previewColumns.map(col => (
                      <th
                        key={col}
                        className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewData.slice(0, 20).map((row, idx) => (
                    <tr
                      key={idx}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      {previewColumns.map(col => (
                        <td key={col} className="px-4 py-2.5 text-gray-700 whitespace-nowrap">
                          {row[col] != null ? String(row[col]) : '--'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {previewData.length > 20 && (
              <p className="text-xs text-gray-400 mt-3 text-center">
                Showing 20 of {previewData.length} preview rows
              </p>
            )}
          </div>
        )}

        {/* Collection history */}
        {runs.length > 0 && (
          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-cyan-500">history</span>
              Collection History
            </h2>
            <div className="space-y-2">
              {runs.map(run => (
                <div
                  key={run.id}
                  className="flex items-center justify-between py-3 px-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full ${statusDot[run.status]}`} />
                    <span className={`text-sm font-medium capitalize ${statusColor[run.status]}`}>
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
                          (new Date(run.finished_at).getTime() - new Date(run.started_at).getTime()) / 1000
                        )}s
                      </span>
                    )}
                    {run.error_message && (
                      <span className="text-red-500 truncate max-w-[200px]" title={run.error_message}>
                        {run.error_message}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
