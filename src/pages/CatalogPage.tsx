import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'

interface Dataset {
  id: string
  title: string
  description: string
  category: string
  update_frequency: string
  last_updated: string
  row_count: number
  source_id: string
}

const CATEGORIES = ['All', 'Commodities', 'Macro', 'Sentiment', 'Market']

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return n.toLocaleString()
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function ShimmerCard() {
  return (
    <div className="glass rounded-xl p-6 space-y-4">
      <div className="shimmer h-5 w-24 rounded" />
      <div className="shimmer h-6 w-3/4 rounded" />
      <div className="shimmer h-4 w-full rounded" />
      <div className="shimmer h-4 w-2/3 rounded" />
      <div className="flex justify-between pt-2">
        <div className="shimmer h-4 w-20 rounded" />
        <div className="shimmer h-4 w-20 rounded" />
      </div>
    </div>
  )
}

export default function CatalogPage() {
  const [datasets, setDatasets] = useState<Dataset[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')

  useEffect(() => {
    fetch('/api/datasets')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch datasets')
        return res.json()
      })
      .then(data => {
        setDatasets(data)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  const filtered = useMemo(() => {
    return datasets.filter(d => {
      const matchesCategory = activeCategory === 'All' || d.category === activeCategory
      const matchesSearch = !search ||
        d.title.toLowerCase().includes(search.toLowerCase()) ||
        d.description.toLowerCase().includes(search.toLowerCase())
      return matchesCategory && matchesSearch
    })
  }, [datasets, search, activeCategory])

  const categoryColor: Record<string, string> = {
    Commodities: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    Macro: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    Sentiment: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    Market: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  }

  return (
    <div className="min-h-screen ambient-glow">
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <header className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-4xl font-bold text-gradient tracking-tight">
              Alternative Data
            </h1>
            <p className="text-slate-400 mt-1 text-sm">
              Curated datasets for quantitative research
            </p>
          </div>
          <Link
            to="/status"
            className="flex items-center gap-2 glass rounded-lg px-4 py-2 text-sm text-slate-300 hover:text-white hover:border-violet-500/40"
          >
            <span className="material-symbols-outlined text-[18px]">monitoring</span>
            Status
          </Link>
        </header>

        {/* Search */}
        <div className="relative mb-6">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-[20px]">
            search
          </span>
          <input
            type="text"
            placeholder="Search datasets..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full glass rounded-xl pl-12 pr-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30"
          />
        </div>

        {/* Category pills */}
        <div className="flex flex-wrap gap-2 mb-8">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
                activeCategory === cat
                  ? 'bg-violet-600/20 text-violet-300 border-violet-500/40'
                  : 'bg-transparent text-slate-400 border-slate-700/50 hover:text-slate-200 hover:border-slate-600'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="glass rounded-xl p-4 mb-6 border-red-500/30 text-red-400 text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            {error}
          </div>
        )}

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <ShimmerCard key={i} />)
            : filtered.map(dataset => (
                <Link
                  key={dataset.id}
                  to={`/dataset/${dataset.id}`}
                  className="glass rounded-xl p-6 hover-card block group"
                >
                  {/* Category badge */}
                  <span
                    className={`inline-block text-xs font-medium px-2.5 py-0.5 rounded-full border mb-3 ${
                      categoryColor[dataset.category] || 'bg-slate-500/15 text-slate-400 border-slate-500/30'
                    }`}
                  >
                    {dataset.category}
                  </span>

                  {/* Title */}
                  <h3 className="text-lg font-semibold text-slate-100 group-hover:text-violet-300 mb-2 line-clamp-1">
                    {dataset.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-slate-400 mb-4 line-clamp-2 leading-relaxed">
                    {dataset.description}
                  </p>

                  {/* Meta row */}
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">schedule</span>
                      {dataset.update_frequency}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                      {formatDate(dataset.last_updated)}
                    </div>
                  </div>

                  {/* Bottom row */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-700/40">
                    <span className="text-xs text-slate-500">
                      {formatNumber(dataset.row_count)} rows
                    </span>
                    <span className="flex items-center gap-1 text-xs text-violet-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                      View details
                    </span>
                  </div>
                </Link>
              ))}
        </div>

        {/* Empty state */}
        {!loading && !error && filtered.length === 0 && (
          <div className="text-center py-20">
            <span className="material-symbols-outlined text-5xl text-slate-600 mb-4 block">
              search_off
            </span>
            <p className="text-slate-400">No datasets found</p>
            <p className="text-sm text-slate-500 mt-1">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  )
}
