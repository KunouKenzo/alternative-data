import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import ChatPanel from '../components/chat/ChatPanel'
import ArticleCarousel from '../components/articles/ArticleCarousel'

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

const CATEGORIES = ['All', 'Commodities', 'Macro', 'Sentiment', 'Market', 'Government', 'IP']

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
    <div className="bg-white rounded-xl p-6 space-y-4 border border-gray-100 shadow-card">
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
  const [chatOpen, setChatOpen] = useState(false)

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
    Commodities: 'bg-amber-50 text-amber-700 border-amber-200',
    Macro: 'bg-blue-50 text-blue-700 border-blue-200',
    Sentiment: 'bg-purple-50 text-purple-700 border-purple-200',
    Market: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Government: 'bg-red-50 text-red-700 border-red-200',
    IP: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left: Catalog */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <header className="flex items-center justify-between mb-10">
            <div>
              <h1 className="text-4xl font-bold text-gradient tracking-tight">
                Data-Walkers
              </h1>
              <p className="text-gray-500 mt-1 text-sm">
                Curated datasets for quantitative research
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <span className="material-symbols-outlined text-[18px]">person</span>
                ログイン
              </Link>
              <Link
                to="/status"
                className="flex items-center gap-2 bg-white rounded-lg px-4 py-2 text-sm text-gray-600 border border-gray-200 hover:text-gray-900 hover:border-gray-300 shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px]">monitoring</span>
                Status
              </Link>
            </div>
          </header>

          {/* Article Carousel */}
          <ArticleCarousel />

          {/* Search */}
          <div className="relative mb-6">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-[20px]">
              search
            </span>
            <input
              type="text"
              placeholder="Search datasets..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-white rounded-xl pl-12 pr-4 py-3 text-sm text-gray-800 placeholder-gray-400 border border-gray-200 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 shadow-sm"
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
                    ? 'bg-violet-50 text-violet-700 border-violet-200'
                    : 'bg-white text-gray-500 border-gray-200 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 rounded-xl p-4 mb-6 border border-red-200 text-red-600 text-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              {error}
            </div>
          )}

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {loading
              ? Array.from({ length: 6 }).map((_, i) => <ShimmerCard key={i} />)
              : filtered.map(dataset => (
                  <Link
                    key={dataset.id}
                    to={`/dataset/${dataset.id}`}
                    className="bg-white rounded-xl p-6 hover-card block group border border-gray-100 shadow-card"
                  >
                    {/* Category badge */}
                    <span
                      className={`inline-block text-xs font-medium px-2.5 py-0.5 rounded-full border mb-3 ${
                        categoryColor[dataset.category] || 'bg-gray-50 text-gray-600 border-gray-200'
                      }`}
                    >
                      {dataset.category}
                    </span>

                    {/* Title */}
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-violet-600 mb-2 line-clamp-1">
                      {dataset.title}
                    </h3>

                    {/* Description */}
                    <p className="text-sm text-gray-500 mb-4 line-clamp-2 leading-relaxed">
                      {dataset.description}
                    </p>

                    {/* Meta row */}
                    <div className="flex items-center justify-between text-xs text-gray-400">
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
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                      <span className="text-xs text-gray-400">
                        {formatNumber(dataset.row_count)} rows
                      </span>
                      <span className="flex items-center gap-1 text-xs text-violet-500 opacity-0 group-hover:opacity-100 transition-opacity">
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
              <span className="material-symbols-outlined text-5xl text-gray-300 mb-4 block">
                search_off
              </span>
              <p className="text-gray-600">No datasets found</p>
              <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      </div>

      {/* Right: Chat Panel (desktop) */}
      <div className="hidden lg:flex w-[400px] border-l border-gray-200 h-screen sticky top-0">
        <ChatPanel className="w-full" />
      </div>

      {/* Mobile: Chat toggle button */}
      <button
        onClick={() => setChatOpen(!chatOpen)}
        className="lg:hidden fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-br from-violet-600 to-cyan-500 text-white shadow-lg flex items-center justify-center z-50 hover:shadow-xl transition-shadow"
      >
        <span className="material-symbols-outlined text-[24px]">
          {chatOpen ? 'close' : 'auto_awesome'}
        </span>
      </button>

      {/* Mobile: Chat overlay */}
      {chatOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-white">
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <span className="text-sm font-semibold text-gray-900">AI Assistant</span>
              <button onClick={() => setChatOpen(false)} className="text-gray-400 hover:text-gray-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <ChatPanel className="flex-1" />
          </div>
        </div>
      )}
    </div>
  )
}
