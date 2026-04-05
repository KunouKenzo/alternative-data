import { Suspense } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ARTICLES, ARTICLE_CATEGORY_COLOR } from '../data/articles'
import { ARTICLE_CONTENT } from '../data/articleContent'

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default function ArticleDetailPage() {
  const { id } = useParams<{ id: string }>()

  const article = ARTICLES.find(a => a.id === id)

  if (!article) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <span className="material-symbols-outlined text-5xl text-gray-300 mb-4 block">
            article
          </span>
          <p className="text-gray-500 mb-4">記事が見つかりませんでした</p>
          <Link to="/articles" className="text-violet-600 hover:text-violet-700 text-sm">
            レポート一覧に戻る
          </Link>
        </div>
      </div>
    )
  }

  const ContentComponent = ARTICLE_CONTENT[article.id]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back link */}
        <Link
          to="/articles"
          className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mb-6"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          レポート一覧に戻る
        </Link>

        {/* Article header */}
        <header className="mb-8">
          <div className="flex items-center gap-2 mb-3">
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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight mb-4">
            {article.title}
          </h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            {article.summary}
          </p>
        </header>

        {/* Hero image */}
        <div className="rounded-xl overflow-hidden shadow-card mb-10">
          <img
            src={article.imageUrl}
            alt={article.title}
            className="w-full h-auto object-cover"
          />
        </div>

        {/* Article content */}
        {ContentComponent ? (
          <Suspense
            fallback={
              <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500" />
              </div>
            }
          >
            <ContentComponent />
          </Suspense>
        ) : (
          <div className="text-center py-20 bg-white rounded-xl border border-gray-100 shadow-card">
            <span className="material-symbols-outlined text-5xl text-gray-300 mb-4 block">
              edit_note
            </span>
            <p className="text-gray-500">このレポートは準備中です</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-gray-200">
          <Link
            to="/articles"
            className="inline-flex items-center gap-1 text-sm text-violet-600 hover:text-violet-700"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            他のレポートを見る
          </Link>
        </div>
      </div>
    </div>
  )
}
