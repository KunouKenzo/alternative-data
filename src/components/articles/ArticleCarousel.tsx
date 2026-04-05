import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { ARTICLES, ARTICLE_CATEGORY_COLOR } from '../../data/articles'

function formatArticleDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })
}

export default function ArticleCarousel() {
  const [current, setCurrent] = useState(0)

  const prev = useCallback(() => {
    setCurrent(i => (i - 1 + ARTICLES.length) % ARTICLES.length)
  }, [])

  const next = useCallback(() => {
    setCurrent(i => (i + 1) % ARTICLES.length)
  }, [])

  const getArticle = (offset: number) => {
    const idx = (current + offset + ARTICLES.length) % ARTICLES.length
    return ARTICLES[idx]
  }

  const centerArticle = getArticle(0)
  const leftArticle = getArticle(-1)
  const rightArticle = getArticle(1)

  return (
    <div className="mb-10">
      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px] text-violet-500">article</span>
          <h2 className="text-lg font-bold text-gray-900">Analysis Reports</h2>
          <span className="text-xs text-gray-400 ml-1">分析レポート</span>
          <Link
            to="/articles"
            className="ml-3 flex items-center gap-1 text-xs text-violet-600 hover:text-violet-700 bg-violet-50 hover:bg-violet-100 px-3 py-1 rounded-full font-medium transition-colors"
          >
            すべて見る
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </Link>
        </div>
        <div className="flex items-center gap-1">
          {ARTICLES.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                i === current ? 'bg-violet-500' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Carousel */}
      <div className="relative">
        <div className="flex items-stretch gap-4 overflow-hidden">
          {/* Left peek */}
          <div
            className="hidden md:block w-[140px] flex-shrink-0 cursor-pointer"
            onClick={prev}
          >
            <div className="h-full rounded-xl overflow-hidden relative opacity-60 hover:opacity-80 transition-opacity">
              <img
                src={leftArticle.imageUrl}
                alt=""
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/40" />
            </div>
          </div>

          {/* Center card */}
          <Link to={`/articles/${centerArticle.id}`} className="flex-1 min-w-0 no-underline">
            <div className="bg-white rounded-xl border border-gray-100 shadow-card overflow-hidden flex flex-col sm:flex-row group cursor-pointer hover:shadow-card-hover transition-shadow">
              {/* Image */}
              <div className="sm:w-[280px] h-[160px] sm:h-auto flex-shrink-0 overflow-hidden">
                <img
                  src={centerArticle.imageUrl}
                  alt={centerArticle.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              {/* Content */}
              <div className="flex-1 p-5 flex flex-col justify-between min-w-0">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${ARTICLE_CATEGORY_COLOR[centerArticle.category] || 'bg-gray-100 text-gray-600'}`}>
                      {centerArticle.category}
                    </span>
                    <span className="text-[11px] text-gray-400">
                      {formatArticleDate(centerArticle.date)}
                    </span>
                    <span className="text-[11px] text-gray-400 flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-[12px]">schedule</span>
                      {centerArticle.readTime}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-gray-900 group-hover:text-violet-600 transition-colors mb-2 line-clamp-2 leading-snug">
                    {centerArticle.title}
                  </h3>
                  <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed hidden sm:block">
                    {centerArticle.summary}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-xs text-violet-500 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>レポートを読む</span>
                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </div>
              </div>
            </div>
          </Link>

          {/* Right peek */}
          <div
            className="hidden md:block w-[140px] flex-shrink-0 cursor-pointer"
            onClick={next}
          >
            <div className="h-full rounded-xl overflow-hidden relative opacity-60 hover:opacity-80 transition-opacity">
              <img
                src={rightArticle.imageUrl}
                alt=""
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-l from-transparent to-white/40" />
            </div>
          </div>
        </div>

        {/* Arrow buttons */}
        <button
          onClick={prev}
          className="absolute left-0 md:-left-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white border border-gray-200 shadow-md flex items-center justify-center text-gray-600 hover:text-gray-900 hover:shadow-lg transition-all z-10"
        >
          <span className="material-symbols-outlined text-[20px]">chevron_left</span>
        </button>
        <button
          onClick={next}
          className="absolute right-0 md:-right-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white border border-gray-200 shadow-md flex items-center justify-center text-gray-600 hover:text-gray-900 hover:shadow-lg transition-all z-10"
        >
          <span className="material-symbols-outlined text-[20px]">chevron_right</span>
        </button>
      </div>
    </div>
  )
}
