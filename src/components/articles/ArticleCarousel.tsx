import { useState, useCallback } from 'react'

interface Article {
  id: string
  title: string
  summary: string
  category: string
  date: string
  imageUrl: string
  readTime: string
}

const SAMPLE_ARTICLES: Article[] = [
  {
    id: '1',
    title: '原油市場の構造変化：OPECプラスの減産戦略とシェールオイルの供給動向分析',
    summary: '2024年以降の原油市場における需給バランスの変化を、衛星データとタンカー追跡データから分析。OPECプラスの政策変更がスポット価格に与える影響を定量的に検証します。',
    category: 'Commodities',
    date: '2026-03-24',
    imageUrl: 'https://images.unsplash.com/photo-1513828583688-c52646db42da?w=800&h=450&fit=crop',
    readTime: '8 min',
  },
  {
    id: '2',
    title: 'Redditセンチメントと暗号資産価格の相関：自然言語処理による分析',
    summary: 'Reddit上の暗号資産関連サブレディットの投稿をNLPで分析し、センチメントスコアとBTC/ETH価格の先行・遅行関係を検証。トレーディングシグナルとしての有効性を評価します。',
    category: 'Sentiment',
    date: '2026-03-20',
    imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=450&fit=crop',
    readTime: '12 min',
  },
  {
    id: '3',
    title: '日本のマクロ経済指標ダッシュボード：CPI・PMI・雇用統計の統合分析',
    summary: '日本の主要マクロ経済指標を統合的に可視化し、景気サイクルの現在地を推定。BOJの金融政策決定との相関も分析します。',
    category: 'Macro',
    date: '2026-03-15',
    imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=450&fit=crop',
    readTime: '10 min',
  },
  {
    id: '4',
    title: '衛星画像で読み解く世界の農作物生産量予測',
    summary: 'Sentinel-2衛星のNDVIデータを用いて、主要穀物（小麦・トウモロコシ・大豆）の作柄状況をリアルタイムモニタリング。USDA公式発表との乖離を事前に検出する手法を紹介します。',
    category: 'Commodities',
    date: '2026-03-10',
    imageUrl: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800&h=450&fit=crop',
    readTime: '15 min',
  },
  {
    id: '5',
    title: 'S&P500セクターローテーション分析：マネーフローの可視化',
    summary: 'ETFのフローデータとオプション市場のポジショニングから、機関投資家のセクター間資金移動を追跡。次のローテーション先を予測するフレームワークを構築します。',
    category: 'Market',
    date: '2026-03-05',
    imageUrl: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&h=450&fit=crop',
    readTime: '11 min',
  },
]

const categoryColor: Record<string, string> = {
  Commodities: 'bg-amber-50 text-amber-700',
  Macro: 'bg-blue-50 text-blue-700',
  Sentiment: 'bg-purple-50 text-purple-700',
  Market: 'bg-emerald-50 text-emerald-700',
}

function formatArticleDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })
}

export default function ArticleCarousel() {
  const [current, setCurrent] = useState(0)

  const prev = useCallback(() => {
    setCurrent(i => (i - 1 + SAMPLE_ARTICLES.length) % SAMPLE_ARTICLES.length)
  }, [])

  const next = useCallback(() => {
    setCurrent(i => (i + 1) % SAMPLE_ARTICLES.length)
  }, [])

  const getArticle = (offset: number) => {
    const idx = (current + offset + SAMPLE_ARTICLES.length) % SAMPLE_ARTICLES.length
    return SAMPLE_ARTICLES[idx]
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
        </div>
        <div className="flex items-center gap-1">
          {SAMPLE_ARTICLES.map((_, i) => (
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
          <div className="flex-1 min-w-0">
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
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${categoryColor[centerArticle.category] || 'bg-gray-100 text-gray-600'}`}>
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
          </div>

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
