export interface Article {
  id: string
  title: string
  summary: string
  category: string
  date: string
  imageUrl: string
  readTime: string
}

export const ARTICLES: Article[] = [
  {
    id: 'sector-rotation',
    title: 'S&P500セクターローテーション分析：マネーフローの可視化',
    summary: 'セクターETFの価格出来高から推定した方向性マネープレッシャー、CFTC COTポジショニング、マクロリスク選好度、オプションP/C比率——4つの無料データソースを統合し、11セクターのRotation Composite Scoreを算出。2026年4月時点でエネルギー・素材・公益事業が上位、ヘルスケアが最下位となった。',
    category: 'Market',
    date: '2026-04-11',
    imageUrl: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&h=450&fit=crop',
    readTime: '14 min',
  },
  {
    id: 'nippon-steel-revenue',
    title: '日本製鉄の売上は衛星画像から予測できるのか？',
    summary: '日本製鉄の国内全8製鉄所をSentinel-2衛星で監視し、工場の熱データを売上予測モデルに組み込むと精度が向上するか検証。為替・鉄鋼価格のみのベースラインと、衛星データを追加した拡張モデルを比較します。',
    category: 'Commodities',
    date: '2026-04-05',
    imageUrl: '/articles/nippon-steel-revenue/satellite_sample.png',
    readTime: '15 min',
  },
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
]

export const ARTICLE_CATEGORY_COLOR: Record<string, string> = {
  Commodities: 'bg-amber-50 text-amber-700',
  Macro: 'bg-blue-50 text-blue-700',
  Sentiment: 'bg-purple-50 text-purple-700',
  Market: 'bg-emerald-50 text-emerald-700',
}
