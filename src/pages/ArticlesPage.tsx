import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ARTICLES, ARTICLE_CATEGORY_COLOR } from '../data/articles'

const CATEGORIES = ['All', 'Commodities', 'Macro', 'Sentiment', 'Market']

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default function ArticlesPage() {
  const [activeCategory, setActiveCategory] = useState('All')

  const filtered = activeCategory === 'All'
    ? ARTICLES
    : ARTICLES.filter(a => a.category === activeCategory)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back + Header */}
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mb-4"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          トップに戻る
        </Link>

        <header className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-[24px] text-violet-500">article</span>
            <h1 className="text-3xl font-bold text-gradient tracking-tight">Analysis Reports</h1>
          </div>
          <p className="text-gray-500 text-sm">
            オルタナティブデータを活用した分析レポート一覧
          </p>
        </header>

        {/* Category filters */}
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
              {cat === 'All' ? 'すべて' : cat}
            </button>
          ))}
        </div>

        {/* Article list */}
        <div className="space-y-4">
          {filtered.map(article => (
            <div
              key={article.id}
              className="bg-white rounded-xl border border-gray-100 shadow-card overflow-hidden flex flex-col sm:flex-row group hover:shadow-card-hover transition-shadow cursor-pointer"
            >
              {/* Image */}
              <div className="sm:w-[240px] h-[160px] sm:h-auto flex-shrink-0 overflow-hidden">
                <img
                  src={article.imageUrl}
                  alt={article.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>

              {/* Content */}
              <div className="flex-1 p-5 flex flex-col justify-between min-w-0">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${ARTICLE_CATEGORY_COLOR[article.category] || 'bg-gray-100 text-gray-600'}`}>
                      {article.category}
                    </span>
                    <span className="text-[11px] text-gray-400">
                      {formatDate(article.date)}
                    </span>
                    <span className="text-[11px] text-gray-400 flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-[12px]">schedule</span>
                      {article.readTime}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-gray-900 group-hover:text-violet-600 transition-colors mb-2 leading-snug">
                    {article.title}
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed line-clamp-2">
                    {article.summary}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-xs text-violet-500 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>レポートを読む</span>
                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="text-center py-20">
            <span className="material-symbols-outlined text-5xl text-gray-300 mb-4 block">
              article
            </span>
            <p className="text-gray-500">該当するレポートがありません</p>
          </div>
        )}
      </div>
    </div>
  )
}
