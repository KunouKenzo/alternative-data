export default function SectorRotation() {
  return (
    <article className="space-y-8 text-gray-700 leading-relaxed">
      {/* --- 要約 --- */}
      <section>
        <p className="text-sm text-gray-500 mb-4">
          公開日：2026年4月11日 ｜ カテゴリ：US Equity ・ Sector Strategy ・ Alternative Data
        </p>
        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">要約</h2>
        <p>
          セクター ETF の価格出来高から推定した「方向性マネープレッシャー」と、CFTC の COT レポート、
          マクロ市場のリスク選好度、オプション市場の Put/Call ポジショニング——
          この 4 つの独立したシグナルを複合スコアにまとめて、S&P500 の 11 セクターに対する
          現在のローテーション状況を数値として可視化した。分析期間は 2024 年 1 月〜2026 年 4 月、
          データはすべて無料の公開ソースから取得している。
        </p>
        <p className="mt-4">
          2026 年 4 月 11 日時点の結論を先に書く。Composite Score の上位 3 セクターは
          <strong> エネルギー (+0.58) / 素材 (+0.49) / 公益事業 (+0.43) </strong>
          であり、下位 3 セクターは <strong>ヘルスケア (-0.60) / 一般消費財 (-0.44) / 金融 (-0.25)</strong> だった。
          過去 3 ヶ月間、市場の資金はテクノロジーやヘルスケアのような伝統的な「成長・防御」ではなく、
          コモディティ連動セクターに向かっている。これは単純な「リスクオン・オフ」では説明できない、
          2020 年代後半に特有のマネーフローだ。
        </p>
      </section>

      {/* --- なぜ --- */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mt-12 mb-3">なぜ「マネーフロー」を追うのか</h2>
        <p>
          株式市場の根本の真実は単純だ。<strong>価格は需給で決まる</strong>。
          S&P500 を構成する 11 の GICS セクターには、景気サイクルの各局面で異なる量の資金が流入・流出する。
          この「お金の引っ越し」がセクターローテーションの正体であり、
          それを事後ではなくリアルタイムで捕捉できるかどうかが、個人投資家がプロに伍して戦うための一つの鍵となる。
        </p>
        <p className="mt-4">
          本分析では、4 つの独立したデータソースから資金移動を追跡し、
          複合スコアによって「次のローテーション先」を特定するフレームワークを構築した。
          特定のベンダーからの有料データを一切使わず、すべて Yahoo Finance と
          CFTC の公開データで完結させている点がポイントだ。
        </p>
      </section>

      {/* --- データ --- */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mt-12 mb-3">収集したデータ</h2>
        <div className="overflow-x-auto my-6">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-2 pr-4 text-gray-600 font-medium">#</th>
                <th className="text-left py-2 px-4 text-gray-600 font-medium">データ</th>
                <th className="text-left py-2 px-4 text-gray-600 font-medium">ソース</th>
                <th className="text-left py-2 px-4 text-gray-600 font-medium">取得頻度</th>
                <th className="text-left py-2 pl-4 text-gray-600 font-medium">期間</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              <tr className="border-b border-gray-100"><td className="py-2 pr-4">1</td><td className="py-2 px-4">セクター ETF の OHLCV</td><td className="py-2 px-4">Yahoo Finance (yfinance)</td><td className="py-2 px-4">日次</td><td className="py-2 pl-4">2024/1〜2026/4</td></tr>
              <tr className="border-b border-gray-100"><td className="py-2 pr-4">2</td><td className="py-2 px-4">方向性マネープレッシャー (A/D ベース)</td><td className="py-2 px-4">Yahoo Finance から算出</td><td className="py-2 px-4">日次</td><td className="py-2 pl-4">2024/1〜2026/4</td></tr>
              <tr className="border-b border-gray-100"><td className="py-2 pr-4">3</td><td className="py-2 px-4">セクター ETF オプション P/C 出来高</td><td className="py-2 px-4">Yahoo Finance オプションチェーン</td><td className="py-2 px-4">当日スナップショット</td><td className="py-2 pl-4">2026/4/11</td></tr>
              <tr className="border-b border-gray-100"><td className="py-2 pr-4">4</td><td className="py-2 px-4">CFTC COT (Traders in Financial Futures)</td><td className="py-2 px-4">CFTC Commitments of Traders</td><td className="py-2 px-4">週次</td><td className="py-2 pl-4">2024/1〜2026/4</td></tr>
              <tr><td className="py-2 pr-4">5</td><td className="py-2 px-4">マクロ / リスク選好指標</td><td className="py-2 px-4">Yahoo Finance (VIX, 金利, 銅/金ほか)</td><td className="py-2 px-4">日次</td><td className="py-2 pl-4">2024/1〜2026/4</td></tr>
            </tbody>
          </table>
        </div>

        <h3 className="text-base font-bold text-gray-900 mt-8 mb-3">対象セクター ETF (SPDR Select Sector)</h3>
        <div className="overflow-x-auto my-4">
          <table className="w-full text-sm border-collapse">
            <tbody className="text-sm font-mono">
              <tr className="border-b border-gray-100"><td className="py-1 pr-4 text-gray-900">XLK</td><td className="py-1 px-4">Technology</td><td className="py-1 px-4 text-gray-900">XLV</td><td className="py-1 pl-4">Health Care</td></tr>
              <tr className="border-b border-gray-100"><td className="py-1 pr-4 text-gray-900">XLF</td><td className="py-1 px-4">Financials</td><td className="py-1 px-4 text-gray-900">XLY</td><td className="py-1 pl-4">Consumer Discretionary</td></tr>
              <tr className="border-b border-gray-100"><td className="py-1 pr-4 text-gray-900">XLP</td><td className="py-1 px-4">Consumer Staples</td><td className="py-1 px-4 text-gray-900">XLE</td><td className="py-1 pl-4">Energy</td></tr>
              <tr className="border-b border-gray-100"><td className="py-1 pr-4 text-gray-900">XLI</td><td className="py-1 px-4">Industrials</td><td className="py-1 px-4 text-gray-900">XLB</td><td className="py-1 pl-4">Materials</td></tr>
              <tr className="border-b border-gray-100"><td className="py-1 pr-4 text-gray-900">XLU</td><td className="py-1 px-4">Utilities</td><td className="py-1 px-4 text-gray-900">XLRE</td><td className="py-1 pl-4">Real Estate</td></tr>
              <tr><td className="py-1 pr-4 text-gray-900">XLC</td><td className="py-1 px-4">Communication Services</td><td className="py-1 px-4 text-gray-900">SPY</td><td className="py-1 pl-4">S&P 500 (ベンチマーク)</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* --- 分析1 RS --- */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mt-12 mb-3">分析① セクター相対強度 (Relative Strength)</h2>
        <p>
          各セクター ETF の終値を SPY (S&P500 ETF) の終値で割った「相対強度比率 (RS Ratio)」を算出し、
          21 日 EMA との位置関係で「Outperform / Underperform」を判定する。
          さらに、63 営業日 (約 3 ヶ月) での RS Ratio 変化率をモメンタムとして集計した。
        </p>
        <pre className="bg-gray-50 text-gray-800 text-xs p-4 rounded-lg my-4 overflow-x-auto">{`RS Ratio   = セクターETF終値 ÷ SPY終値
RS Signal  = RS Ratio > 21日EMA → "Outperform"
RS モメンタム = (今日のRS / 63営業日前のRS − 1) × 100%`}</pre>

        <h3 className="text-base font-bold text-gray-900 mt-6 mb-3">直近 3 ヶ月の相対強度ランキング (2026 年 1 月〜4 月)</h3>
        <div className="overflow-x-auto my-4">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-2 pr-4 text-gray-600 font-medium">順位</th>
                <th className="text-left py-2 px-4 text-gray-600 font-medium">セクター</th>
                <th className="text-right py-2 px-4 text-gray-600 font-medium">RS 3 ヶ月変化率</th>
                <th className="text-left py-2 pl-4 text-gray-600 font-medium">RS シグナル</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              <tr className="border-b border-gray-100"><td className="py-2 pr-4">1</td><td className="py-2 px-4 font-medium">Energy (XLE)</td><td className="py-2 px-4 text-right text-emerald-600 font-medium">+24.6%</td><td className="py-2 pl-4">Underperform</td></tr>
              <tr className="border-b border-gray-100"><td className="py-2 pr-4">2</td><td className="py-2 px-4 font-medium">Utilities (XLU)</td><td className="py-2 px-4 text-right text-emerald-600 font-medium">+12.8%</td><td className="py-2 pl-4">Underperform</td></tr>
              <tr className="border-b border-gray-100"><td className="py-2 pr-4">3</td><td className="py-2 px-4 font-medium">Materials (XLB)</td><td className="py-2 px-4 text-right text-emerald-600 font-medium">+10.0%</td><td className="py-2 pl-4">Outperform</td></tr>
              <tr className="border-b border-gray-100"><td className="py-2 pr-4">4</td><td className="py-2 px-4">Industrials (XLI)</td><td className="py-2 px-4 text-right text-emerald-600">+8.2%</td><td className="py-2 pl-4">Outperform</td></tr>
              <tr className="border-b border-gray-100"><td className="py-2 pr-4">5</td><td className="py-2 px-4">Real Estate (XLRE)</td><td className="py-2 px-4 text-right text-emerald-600">+8.0%</td><td className="py-2 pl-4">Outperform</td></tr>
              <tr className="border-b border-gray-100"><td className="py-2 pr-4">6</td><td className="py-2 px-4">Consumer Staples (XLP)</td><td className="py-2 px-4 text-right text-emerald-600">+6.2%</td><td className="py-2 pl-4">Underperform</td></tr>
              <tr className="border-b border-gray-100"><td className="py-2 pr-4">7</td><td className="py-2 px-4">Technology (XLK)</td><td className="py-2 px-4 text-right text-gray-500">-0.3%</td><td className="py-2 pl-4">Outperform</td></tr>
              <tr className="border-b border-gray-100"><td className="py-2 pr-4">8</td><td className="py-2 px-4">Communication Svcs (XLC)</td><td className="py-2 px-4 text-right text-rose-500">-1.3%</td><td className="py-2 pl-4">Underperform</td></tr>
              <tr className="border-b border-gray-100"><td className="py-2 pr-4">9</td><td className="py-2 px-4">Health Care (XLV)</td><td className="py-2 px-4 text-right text-rose-500">-4.3%</td><td className="py-2 pl-4">Underperform</td></tr>
              <tr className="border-b border-gray-100"><td className="py-2 pr-4">10</td><td className="py-2 px-4">Financials (XLF)</td><td className="py-2 px-4 text-right text-rose-500">-6.9%</td><td className="py-2 pl-4">Underperform</td></tr>
              <tr><td className="py-2 pr-4">11</td><td className="py-2 px-4 font-medium">Consumer Disc. (XLY)</td><td className="py-2 px-4 text-right text-rose-600 font-medium">-7.3%</td><td className="py-2 pl-4">Underperform</td></tr>
            </tbody>
          </table>
        </div>
        <p className="mt-4">
          上位にエネルギーと素材が並ぶのは教科書的な「景気後期 — コモディティサイクル」のパターンだが、
          同時に公益事業とヘルスケアが上下に割れている点が興味深い。
          古典的な「ディフェンシブ一括買い」ではなく、投資家はコモディティ価格の上昇に連動するセクターを
          ピンポイントで選好していることが読み取れる。
        </p>
      </section>

      {/* --- 分析2 フロー --- */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mt-12 mb-3">分析② 方向性マネープレッシャー (Directional Money Pressure)</h2>
        <p>
          厳密な ETF の Creation/Redemption フローは有料データでしか取得できないため、
          本分析では OHLCV から計算できる「Accumulation/Distribution 型のマネープレッシャー」を代替指標として使う。
          これは、当日の終値が高値寄りで引けたか (買い圧力) 安値寄りで引けたか (売り圧力) を出来高で重み付けした指標だ。
        </p>
        <pre className="bg-gray-50 text-gray-800 text-xs p-4 rounded-lg my-4 overflow-x-auto">{`MF Multiplier = ((Close - Low) - (High - Close)) / (High - Low)
MF Volume     = Multiplier × Volume
ドルプレッシャー  = MF Volume × Close
Q1 累計    = 直近 63 営業日のドルプレッシャー合計`}</pre>

        <h3 className="text-base font-bold text-gray-900 mt-6 mb-3">2026 年 Q1 (1-4 月初) セクター別累計マネープレッシャー</h3>
        <div className="overflow-x-auto my-4">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-2 pr-4 text-gray-600 font-medium">セクター</th>
                <th className="text-right py-2 px-4 text-gray-600 font-medium">Q1 累計 (USD)</th>
                <th className="text-right py-2 px-4 text-gray-600 font-medium">直近 4 週</th>
                <th className="text-left py-2 pl-4 text-gray-600 font-medium">方向</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              <tr className="border-b border-gray-100"><td className="py-2 pr-4 font-medium">Consumer Staples (XLP)</td><td className="py-2 px-4 text-right text-emerald-600">+$15.7B</td><td className="py-2 px-4 text-right text-rose-500">-$3.5B</td><td className="py-2 pl-4">Q1 プラス・足元マイナス</td></tr>
              <tr className="border-b border-gray-100"><td className="py-2 pr-4 font-medium">Industrials (XLI)</td><td className="py-2 px-4 text-right text-emerald-600">+$10.6B</td><td className="py-2 px-4 text-right text-rose-500">-$5.9B</td><td className="py-2 pl-4">Q1 プラス・足元マイナス</td></tr>
              <tr className="border-b border-gray-100"><td className="py-2 pr-4 font-medium">Materials (XLB)</td><td className="py-2 px-4 text-right text-emerald-600">+$8.0B</td><td className="py-2 px-4 text-right text-rose-500">-$1.4B</td><td className="py-2 pl-4">Q1 プラス</td></tr>
              <tr className="border-b border-gray-100"><td className="py-2 pr-4 font-medium">Energy (XLE)</td><td className="py-2 px-4 text-right text-emerald-600">+$7.6B</td><td className="py-2 px-4 text-right text-gray-500">-$0.2B</td><td className="py-2 pl-4">Q1 プラス・足元横ばい</td></tr>
              <tr className="border-b border-gray-100"><td className="py-2 pr-4">Consumer Disc. (XLY)</td><td className="py-2 px-4 text-right text-emerald-600">+$4.6B</td><td className="py-2 px-4 text-right text-rose-500">-$3.4B</td><td className="py-2 pl-4">反転</td></tr>
              <tr className="border-b border-gray-100"><td className="py-2 pr-4">Utilities (XLU)</td><td className="py-2 px-4 text-right text-emerald-600">+$4.3B</td><td className="py-2 px-4 text-right text-rose-500">-$3.5B</td><td className="py-2 pl-4">反転</td></tr>
              <tr className="border-b border-gray-100"><td className="py-2 pr-4">Comm. Svcs (XLC)</td><td className="py-2 px-4 text-right text-emerald-600">+$1.2B</td><td className="py-2 px-4 text-right text-rose-500">-$3.8B</td><td className="py-2 pl-4">反転</td></tr>
              <tr className="border-b border-gray-100"><td className="py-2 pr-4">Real Estate (XLRE)</td><td className="py-2 px-4 text-right text-emerald-600">+$0.9B</td><td className="py-2 px-4 text-right text-rose-500">-$1.9B</td><td className="py-2 pl-4">弱い</td></tr>
              <tr className="border-b border-gray-100"><td className="py-2 pr-4 font-medium">Health Care (XLV)</td><td className="py-2 px-4 text-right text-rose-500">-$3.2B</td><td className="py-2 px-4 text-right text-rose-600">-$10.2B</td><td className="py-2 pl-4">大幅マイナス</td></tr>
              <tr className="border-b border-gray-100"><td className="py-2 pr-4 font-medium">Financials (XLF)</td><td className="py-2 px-4 text-right text-rose-500">-$6.0B</td><td className="py-2 px-4 text-right text-rose-500">-$7.9B</td><td className="py-2 pl-4">悪化継続</td></tr>
              <tr><td className="py-2 pr-4 font-medium">Technology (XLK)</td><td className="py-2 px-4 text-right text-rose-600">-$6.9B</td><td className="py-2 px-4 text-right text-rose-500">-$6.5B</td><td className="py-2 pl-4">悪化継続</td></tr>
            </tbody>
          </table>
        </div>
        <p className="mt-4">
          最も重要な観測は、ヘルスケア (XLV) の直近 4 週のマネープレッシャーが<strong> -$10.2B</strong> に達しており、
          11 セクター中ダントツの悪化であることだ。Q1 全体を通してプラスだった銘柄でも、
          多くは直近 4 週で資金流出に反転している。市場全体としては、
          <strong>「いったんリスク資産を利食って様子見」</strong>の動きが 4 月に入って強まっている。
        </p>
      </section>

      {/* --- 分析3 Options --- */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mt-12 mb-3">分析③ オプション市場のセンチメント (当日スナップショット)</h2>
        <p>
          各セクター ETF のオプションチェーンから、直近 6 限月のコール・プット出来高を合算して Put/Call 比率を算出した。
          本分析では時系列の z-score ではなく、セクター横断のクロスセクショナル順位で評価している。
          (z-score 版は 252 営業日のヒストリ蓄積後に切り替え予定。)
        </p>
        <div className="overflow-x-auto my-4">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-2 pr-4 text-gray-600 font-medium">セクター</th>
                <th className="text-right py-2 px-4 text-gray-600 font-medium">Call 出来高</th>
                <th className="text-right py-2 px-4 text-gray-600 font-medium">Put 出来高</th>
                <th className="text-right py-2 px-4 text-gray-600 font-medium">P/C 比率</th>
                <th className="text-left py-2 pl-4 text-gray-600 font-medium">判定</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              <tr className="border-b border-gray-100"><td className="py-2 pr-4 font-medium">Consumer Disc. (XLY)</td><td className="py-2 px-4 text-right">1,522</td><td className="py-2 px-4 text-right">32,246</td><td className="py-2 px-4 text-right font-bold text-rose-600">21.19</td><td className="py-2 pl-4">極端に弱気</td></tr>
              <tr className="border-b border-gray-100"><td className="py-2 pr-4 font-medium">Industrials (XLI)</td><td className="py-2 px-4 text-right">3,785</td><td className="py-2 px-4 text-right">36,203</td><td className="py-2 px-4 text-right font-bold text-rose-500">9.57</td><td className="py-2 pl-4">強く弱気</td></tr>
              <tr className="border-b border-gray-100"><td className="py-2 pr-4 font-medium">Health Care (XLV)</td><td className="py-2 px-4 text-right">1,467</td><td className="py-2 px-4 text-right">12,374</td><td className="py-2 px-4 text-right font-bold text-rose-500">8.44</td><td className="py-2 pl-4">強く弱気</td></tr>
              <tr className="border-b border-gray-100"><td className="py-2 pr-4">Consumer Staples (XLP)</td><td className="py-2 px-4 text-right">16,334</td><td className="py-2 px-4 text-right">34,380</td><td className="py-2 px-4 text-right">2.11</td><td className="py-2 pl-4">弱気</td></tr>
              <tr className="border-b border-gray-100"><td className="py-2 pr-4">Real Estate (XLRE)</td><td className="py-2 px-4 text-right">627</td><td className="py-2 px-4 text-right">1,079</td><td className="py-2 px-4 text-right">1.72</td><td className="py-2 pl-4">弱気寄り</td></tr>
              <tr className="border-b border-gray-100"><td className="py-2 pr-4">Technology (XLK)</td><td className="py-2 px-4 text-right">8,129</td><td className="py-2 px-4 text-right">9,378</td><td className="py-2 px-4 text-right">1.15</td><td className="py-2 pl-4">中立</td></tr>
              <tr className="border-b border-gray-100"><td className="py-2 pr-4">Materials (XLB)</td><td className="py-2 px-4 text-right">1,688</td><td className="py-2 px-4 text-right">1,895</td><td className="py-2 px-4 text-right">1.12</td><td className="py-2 pl-4">中立</td></tr>
              <tr className="border-b border-gray-100"><td className="py-2 pr-4">Energy (XLE)</td><td className="py-2 px-4 text-right">104,549</td><td className="py-2 px-4 text-right">111,365</td><td className="py-2 px-4 text-right">1.07</td><td className="py-2 pl-4">中立</td></tr>
              <tr className="border-b border-gray-100"><td className="py-2 pr-4">Utilities (XLU)</td><td className="py-2 px-4 text-right">8,011</td><td className="py-2 px-4 text-right">8,157</td><td className="py-2 px-4 text-right">1.02</td><td className="py-2 pl-4">中立</td></tr>
              <tr className="border-b border-gray-100"><td className="py-2 pr-4 font-medium">Financials (XLF)</td><td className="py-2 px-4 text-right">113,631</td><td className="py-2 px-4 text-right">67,010</td><td className="py-2 px-4 text-right font-bold text-emerald-600">0.59</td><td className="py-2 pl-4">強気</td></tr>
              <tr><td className="py-2 pr-4 font-medium">Comm. Svcs (XLC)</td><td className="py-2 px-4 text-right">2,026</td><td className="py-2 px-4 text-right">444</td><td className="py-2 px-4 text-right font-bold text-emerald-600">0.22</td><td className="py-2 pl-4">極端に強気</td></tr>
            </tbody>
          </table>
        </div>
        <p className="mt-4">
          注目すべきは <strong>XLY の P/C 比率 21.19</strong> という異常値だ。これはコール 1 枚に対して Put が 21 枚取引されている状態で、
          機関投資家が一般消費財セクターに対して大量のダウンサイドヘッジを張っていることを示す。
          一方、通信サービス (XLC) の P/C は 0.22 と全セクターで最も強気に偏っており、
          デリバティブ市場の観点では「成長セクターの中で通信だけが選好されている」状況だ。
        </p>
        <p className="mt-4">
          ここで重要な注意点がある。オプションセンチメントは<strong>逆張りシグナルとしても機能しうる</strong>。
          XLY の極端な弱気ポジションは、既に悪材料が織り込まれている可能性を示唆する一方で、
          XLC の極端な強気はポジション巻き戻しリスクを孕む。
          本分析では、他のシグナル (RS・フロー・マクロ) との一致度を重視して解釈している。
        </p>
      </section>

      {/* --- 分析4 COT --- */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mt-12 mb-3">分析④ CFTC COT レポート：Smart Money の手口</h2>
        <p>
          CFTC が毎週金曜に公表する Traders in Financial Futures (TFF) レポートから、
          S&P 500 E-mini 先物と NASDAQ MINI 先物における Asset Manager/Institutional (機関投資家)
          と Leveraged Funds (ヘッジファンド) のネットポジションを追跡した。
        </p>

        <h3 className="text-base font-bold text-gray-900 mt-6 mb-3">E-mini S&P 500 — 直近 8 週</h3>
        <div className="overflow-x-auto my-4">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-2 pr-4 text-gray-600 font-medium">レポート日</th>
                <th className="text-right py-2 px-4 text-gray-600 font-medium">Asset Mgr Net</th>
                <th className="text-right py-2 px-4 text-gray-600 font-medium">Leveraged Net</th>
                <th className="text-right py-2 px-4 text-gray-600 font-medium">合計 OI</th>
                <th className="text-right py-2 pl-4 text-gray-600 font-medium">AM 52 週 %ile</th>
              </tr>
            </thead>
            <tbody className="text-sm font-mono">
              <tr className="border-b border-gray-100"><td className="py-2 pr-4">2026-02-17</td><td className="py-2 px-4 text-right">+976,865</td><td className="py-2 px-4 text-right text-rose-500">-464,292</td><td className="py-2 px-4 text-right">1,966,090</td><td className="py-2 pl-4 text-right">100th</td></tr>
              <tr className="border-b border-gray-100"><td className="py-2 pr-4">2026-02-24</td><td className="py-2 px-4 text-right">+1,013,144</td><td className="py-2 px-4 text-right text-rose-500">-475,380</td><td className="py-2 px-4 text-right">2,017,196</td><td className="py-2 pl-4 text-right">100th</td></tr>
              <tr className="border-b border-gray-100"><td className="py-2 pr-4">2026-03-03</td><td className="py-2 px-4 text-right">+1,004,768</td><td className="py-2 px-4 text-right text-rose-500">-406,340</td><td className="py-2 px-4 text-right">2,060,733</td><td className="py-2 pl-4 text-right">98th</td></tr>
              <tr className="border-b border-gray-100"><td className="py-2 pr-4">2026-03-10</td><td className="py-2 px-4 text-right">+898,852</td><td className="py-2 px-4 text-right text-rose-500">-349,989</td><td className="py-2 px-4 text-right">1,996,720</td><td className="py-2 pl-4 text-right">54th</td></tr>
              <tr className="border-b border-gray-100"><td className="py-2 pr-4">2026-03-17</td><td className="py-2 px-4 text-right">+886,828</td><td className="py-2 px-4 text-right text-rose-500">-340,507</td><td className="py-2 px-4 text-right">2,330,659</td><td className="py-2 pl-4 text-right">46th</td></tr>
              <tr className="border-b border-gray-100"><td className="py-2 pr-4">2026-03-24</td><td className="py-2 px-4 text-right">+878,391</td><td className="py-2 px-4 text-right text-rose-500">-344,127</td><td className="py-2 px-4 text-right">1,879,423</td><td className="py-2 pl-4 text-right">42nd</td></tr>
              <tr className="border-b border-gray-100"><td className="py-2 pr-4">2026-03-31</td><td className="py-2 px-4 text-right text-emerald-600">+915,718</td><td className="py-2 px-4 text-right text-rose-500">-233,412</td><td className="py-2 px-4 text-right">1,947,769</td><td className="py-2 pl-4 text-right text-emerald-600">71st</td></tr>
              <tr><td className="py-2 pr-4 font-medium">2026-04-07</td><td className="py-2 px-4 text-right text-emerald-600 font-bold">+940,435</td><td className="py-2 px-4 text-right text-rose-500">-244,483</td><td className="py-2 px-4 text-right">1,929,090</td><td className="py-2 pl-4 text-right text-emerald-600 font-bold">83rd</td></tr>
            </tbody>
          </table>
        </div>
        <p className="mt-4">
          3 月下旬に Asset Manager の 52 週パーセンタイルが一時 42 まで急落したが、
          その後 2 週間で <strong>42nd → 83rd</strong> へと劇的に回復している。
          機関投資家は 3 月中旬の下落局面を買い場と判断し、大幅な買い戻しを入れた。
          これは本 4 月時点での S&P 500 全体に対する<strong>強気シグナル</strong>だ。
        </p>

        <h3 className="text-base font-bold text-gray-900 mt-8 mb-3">NASDAQ MINI — 直近 8 週</h3>
        <div className="overflow-x-auto my-4">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-2 pr-4 text-gray-600 font-medium">レポート日</th>
                <th className="text-right py-2 px-4 text-gray-600 font-medium">Asset Mgr Net</th>
                <th className="text-right py-2 px-4 text-gray-600 font-medium">Leveraged Net</th>
                <th className="text-right py-2 pl-4 text-gray-600 font-medium">AM 52 週 %ile</th>
              </tr>
            </thead>
            <tbody className="text-sm font-mono">
              <tr className="border-b border-gray-100"><td className="py-2 pr-4">2026-02-17</td><td className="py-2 px-4 text-right">+73,841</td><td className="py-2 px-4 text-right text-rose-500">-9,316</td><td className="py-2 pl-4 text-right">50th</td></tr>
              <tr className="border-b border-gray-100"><td className="py-2 pr-4">2026-02-24</td><td className="py-2 px-4 text-right">+69,294</td><td className="py-2 px-4 text-right text-rose-500">-16,554</td><td className="py-2 pl-4 text-right">42nd</td></tr>
              <tr className="border-b border-gray-100"><td className="py-2 pr-4">2026-03-03</td><td className="py-2 px-4 text-right">+67,583</td><td className="py-2 px-4 text-right text-rose-500">-21,789</td><td className="py-2 pl-4 text-right">38th</td></tr>
              <tr className="border-b border-gray-100"><td className="py-2 pr-4">2026-03-10</td><td className="py-2 px-4 text-right">+64,421</td><td className="py-2 px-4 text-right text-rose-500">-25,167</td><td className="py-2 pl-4 text-right">35th</td></tr>
              <tr className="border-b border-gray-100"><td className="py-2 pr-4">2026-03-17</td><td className="py-2 px-4 text-right">+60,251</td><td className="py-2 px-4 text-right text-rose-500">-31,462</td><td className="py-2 pl-4 text-right">31st</td></tr>
              <tr className="border-b border-gray-100"><td className="py-2 pr-4">2026-03-24</td><td className="py-2 px-4 text-right text-rose-500">+50,270</td><td className="py-2 px-4 text-right text-rose-600">-39,379</td><td className="py-2 pl-4 text-right text-rose-500">19th</td></tr>
              <tr className="border-b border-gray-100"><td className="py-2 pr-4">2026-03-31</td><td className="py-2 px-4 text-right">+57,650</td><td className="py-2 px-4 text-right text-rose-600">-37,103</td><td className="py-2 pl-4 text-right">29th</td></tr>
              <tr><td className="py-2 pr-4 font-medium">2026-04-07</td><td className="py-2 px-4 text-right">+57,581</td><td className="py-2 px-4 text-right text-rose-600">-38,828</td><td className="py-2 pl-4 text-right">27th</td></tr>
            </tbody>
          </table>
        </div>
        <p className="mt-4">
          S&P 500 が急回復する一方で、NASDAQ MINI の Asset Manager Net は 52 週パーセンタイル 27 のまま低迷している。
          つまり機関投資家は<strong>「S&P 500 は買い戻すが、NASDAQ (=テック中心) は戻さない」</strong>という明確な選別をしている。
          分析①②で観測されたテクノロジー・セクター (XLK) のアンダーパフォームは、
          COT ポジショニングからも裏付けられる。
        </p>
      </section>

      {/* --- 分析5 Macro --- */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mt-12 mb-3">分析⑤ マクロ環境とリスク選好度</h2>
        <p>
          FRED 有料 API を使わず、Yahoo Finance で取得できる指標のみで「リスク選好度スコア」を構築した。
          VIX (恐怖指数)、10Y-3M 金利スプレッド (イールドカーブ傾斜)、
          Copper/Gold 比率 (景気モメンタム) の 3 コンポーネントを 252 日 z-score で標準化し、
          その平均を -1〜+1 にクリップした合成指標だ。
        </p>
        <div className="overflow-x-auto my-4">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-2 pr-4 text-gray-600 font-medium">指標</th>
                <th className="text-right py-2 px-4 text-gray-600 font-medium">直近値</th>
                <th className="text-left py-2 pl-4 text-gray-600 font-medium">解釈</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              <tr className="border-b border-gray-100"><td className="py-2 pr-4 font-medium">VIX</td><td className="py-2 px-4 text-right font-mono">19.23</td><td className="py-2 pl-4">中位 — 明確な恐怖モードではない</td></tr>
              <tr className="border-b border-gray-100"><td className="py-2 pr-4 font-medium">10Y Treasury 利回り (^TNX)</td><td className="py-2 px-4 text-right font-mono">4.32%</td><td className="py-2 pl-4">高水準・維持</td></tr>
              <tr className="border-b border-gray-100"><td className="py-2 pr-4 font-medium">3M T-Bill 利回り (^IRX)</td><td className="py-2 px-4 text-right font-mono">3.59%</td><td className="py-2 pl-4">—</td></tr>
              <tr className="border-b border-gray-100"><td className="py-2 pr-4 font-medium">10Y - 3M スプレッド</td><td className="py-2 px-4 text-right font-mono">+0.72%</td><td className="py-2 pl-4">順イールド、景気後退シグナルなし</td></tr>
              <tr className="border-b border-gray-100"><td className="py-2 pr-4 font-medium">原油 (WTI)</td><td className="py-2 px-4 text-right font-mono">$96.57</td><td className="py-2 pl-4">高止まり、エネルギーセクター追い風</td></tr>
              <tr className="border-b border-gray-100"><td className="py-2 pr-4 font-medium">Copper/Gold 比率</td><td className="py-2 px-4 text-right font-mono">0.00123</td><td className="py-2 pl-4">60 日で -5.1% 悪化、景気モメンタム減速</td></tr>
              <tr className="border-b border-gray-100"><td className="py-2 pr-4 font-medium">ドルインデックス (DXY)</td><td className="py-2 px-4 text-right font-mono">98.65</td><td className="py-2 pl-4">中位</td></tr>
              <tr><td className="py-2 pr-4 font-medium">USD/JPY</td><td className="py-2 px-4 text-right font-mono">159.24</td><td className="py-2 pl-4">円弱含み継続</td></tr>
            </tbody>
          </table>
        </div>
        <p className="mt-4">
          合成リスク選好度スコア (標準化後) は<strong> +0.13</strong> とわずかにリスクオン側。
          金利と VIX は穏やかだが、Copper/Gold 比率が 60 日間で -5.1% 悪化しており、
          景気モメンタムには陰りが見える。古典的な「リスクオン / リスクオフ」では説明が難しい、
          <strong>スタグフレーション的なミックス</strong>と言える。
          これが分析①で見たように、エネルギー・素材・公益事業といった「実物資産連動型セクター」が上位に並ぶ一因だ。
        </p>
      </section>

      {/* --- 複合スコア --- */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mt-12 mb-3">複合分析：Rotation Composite Score</h2>
        <p>
          4 つのシグナルを以下の重みで統合し、セクター別の Rotation Composite Score を算出した。
          RS モメンタムとマネープレッシャーを主力に、オプションとマクロは補助として使う配分だ。
        </p>
        <pre className="bg-gray-50 text-gray-800 text-xs p-4 rounded-lg my-4 overflow-x-auto">{`Rotation Score = 0.30 × RS Momentum (±1に正規化)
              + 0.30 × Flow Momentum (クロスセクションz)
              + 0.20 × Options Sentiment (P/Cクロスランク)
              + 0.20 × Macro Alignment (リスク選好度×セクター性質)`}</pre>

        <h3 className="text-base font-bold text-gray-900 mt-6 mb-3">2026 年 4 月 11 日時点の Rotation Composite Score</h3>
        <div className="overflow-x-auto my-4">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-2 pr-4 text-gray-600 font-medium">順位</th>
                <th className="text-left py-2 px-4 text-gray-600 font-medium">セクター</th>
                <th className="text-right py-2 px-4 text-gray-600 font-medium">RS</th>
                <th className="text-right py-2 px-4 text-gray-600 font-medium">Flow</th>
                <th className="text-right py-2 px-4 text-gray-600 font-medium">Options</th>
                <th className="text-right py-2 px-4 text-gray-600 font-medium">Macro</th>
                <th className="text-right py-2 px-4 text-gray-600 font-medium">Composite</th>
                <th className="text-right py-2 pl-4 text-gray-600 font-medium">一致度</th>
              </tr>
            </thead>
            <tbody className="text-sm font-mono">
              <tr className="border-b border-gray-100"><td className="py-2 pr-4">1</td><td className="py-2 px-4 font-sans font-bold">Energy</td><td className="py-2 px-4 text-right">+1.00</td><td className="py-2 px-4 text-right">+0.56</td><td className="py-2 px-4 text-right">+0.40</td><td className="py-2 px-4 text-right">+0.13</td><td className="py-2 px-4 text-right font-bold text-emerald-600">+0.58</td><td className="py-2 pl-4 text-right">4/4</td></tr>
              <tr className="border-b border-gray-100"><td className="py-2 pr-4">2</td><td className="py-2 px-4 font-sans font-bold">Materials</td><td className="py-2 px-4 text-right">+1.00</td><td className="py-2 px-4 text-right">+0.40</td><td className="py-2 px-4 text-right">+0.20</td><td className="py-2 px-4 text-right">+0.13</td><td className="py-2 px-4 text-right font-bold text-emerald-600">+0.49</td><td className="py-2 pl-4 text-right">4/4</td></tr>
              <tr className="border-b border-gray-100"><td className="py-2 pr-4">3</td><td className="py-2 px-4 font-sans font-bold">Utilities</td><td className="py-2 px-4 text-right">+1.00</td><td className="py-2 px-4 text-right">+0.12</td><td className="py-2 px-4 text-right">+0.60</td><td className="py-2 px-4 text-right">-0.13</td><td className="py-2 px-4 text-right font-bold text-emerald-600">+0.43</td><td className="py-2 pl-4 text-right">3/4</td></tr>
              <tr className="border-b border-gray-100"><td className="py-2 pr-4">4</td><td className="py-2 px-4 font-sans">Real Estate</td><td className="py-2 px-4 text-right">+1.00</td><td className="py-2 px-4 text-right">+0.33</td><td className="py-2 px-4 text-right">-0.20</td><td className="py-2 px-4 text-right">+0.00</td><td className="py-2 px-4 text-right text-emerald-600">+0.36</td><td className="py-2 pl-4 text-right">2/4</td></tr>
              <tr className="border-b border-gray-100"><td className="py-2 pr-4">5</td><td className="py-2 px-4 font-sans">Consumer Staples</td><td className="py-2 px-4 text-right">+1.00</td><td className="py-2 px-4 text-right">+0.12</td><td className="py-2 px-4 text-right">-0.40</td><td className="py-2 px-4 text-right">-0.13</td><td className="py-2 px-4 text-right text-emerald-600">+0.23</td><td className="py-2 pl-4 text-right">2/4</td></tr>
              <tr className="border-b border-gray-100"><td className="py-2 pr-4">6</td><td className="py-2 px-4 font-sans">Comm. Services</td><td className="py-2 px-4 text-right">-0.21</td><td className="py-2 px-4 text-right">+0.08</td><td className="py-2 px-4 text-right">+1.00</td><td className="py-2 px-4 text-right">+0.13</td><td className="py-2 px-4 text-right text-emerald-600">+0.19</td><td className="py-2 pl-4 text-right">3/4</td></tr>
              <tr className="border-b border-gray-100"><td className="py-2 pr-4">7</td><td className="py-2 px-4 font-sans">Industrials</td><td className="py-2 px-4 text-right">+1.00</td><td className="py-2 px-4 text-right">-0.20</td><td className="py-2 px-4 text-right">-0.80</td><td className="py-2 px-4 text-right">+0.13</td><td className="py-2 px-4 text-right">+0.11</td><td className="py-2 pl-4 text-right">2/4</td></tr>
              <tr className="border-b border-gray-100"><td className="py-2 pr-4">8</td><td className="py-2 px-4 font-sans">Technology</td><td className="py-2 px-4 text-right">-0.05</td><td className="py-2 px-4 text-right">-0.28</td><td className="py-2 px-4 text-right">0.00</td><td className="py-2 px-4 text-right">+0.13</td><td className="py-2 px-4 text-right text-rose-500">-0.07</td><td className="py-2 pl-4 text-right">2/4</td></tr>
              <tr className="border-b border-gray-100"><td className="py-2 pr-4">9</td><td className="py-2 px-4 font-sans">Financials</td><td className="py-2 px-4 text-right">-1.00</td><td className="py-2 px-4 text-right">-0.47</td><td className="py-2 px-4 text-right">+0.80</td><td className="py-2 px-4 text-right">+0.13</td><td className="py-2 px-4 text-right text-rose-500">-0.25</td><td className="py-2 pl-4 text-right">2/4</td></tr>
              <tr className="border-b border-gray-100"><td className="py-2 pr-4">10</td><td className="py-2 px-4 font-sans">Consumer Disc.</td><td className="py-2 px-4 text-right">-1.00</td><td className="py-2 px-4 text-right">+0.13</td><td className="py-2 px-4 text-right">-1.00</td><td className="py-2 px-4 text-right">+0.13</td><td className="py-2 px-4 text-right text-rose-600">-0.44</td><td className="py-2 pl-4 text-right">2/4</td></tr>
              <tr><td className="py-2 pr-4">11</td><td className="py-2 px-4 font-sans font-bold">Health Care</td><td className="py-2 px-4 text-right">-0.72</td><td className="py-2 px-4 text-right">-0.79</td><td className="py-2 px-4 text-right">-0.60</td><td className="py-2 px-4 text-right">-0.13</td><td className="py-2 px-4 text-right font-bold text-rose-600">-0.60</td><td className="py-2 pl-4 text-right">4/4</td></tr>
            </tbody>
          </table>
        </div>
        <p className="mt-4">
          上位 3 セクターのうち、エネルギーと素材は 4 指標すべてが強気側に一致している (confluence = 4/4)。
          下位では<strong>ヘルスケアが唯一 4 指標すべて弱気に一致</strong>しており、本分析の中で最も確度の高い弱気シグナルだ。
          テクノロジーは RS こそ中立だが、マネープレッシャーが悪化しており、弱含みが継続する可能性が高い。
        </p>
        <p className="mt-4">
          興味深いのは金融と通信サービスの「マクロ的にねじれた」ポジションだ。金融は RS・フローともに弱いが
          オプションは強気 (コール優位)、通信サービスは RS・フローが弱いのにオプションは極端な強気。
          これらはバックテスト上、シグナル一致度が低いとき (confluence ≤ 2) には<strong>方向性が不明確</strong>として扱うべき局面だ。
        </p>
      </section>

      {/* --- 先行性 --- */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mt-12 mb-3">フロー転換は RS 転換に先行するか</h2>
        <p>
          本分析で最も重要な検証の一つが、「方向性マネープレッシャーの符号転換が、
          後続の RS シグナル転換にどれだけ先行するか」だ。
          2024 年 1 月〜2026 年 4 月の期間で、11 セクター全てに対して符号反転イベントを検出し、
          次の RS 反転までの営業日数を計測した。
        </p>
        <div className="overflow-x-auto my-4">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-2 pr-4 text-gray-600 font-medium">セクター</th>
                <th className="text-right py-2 px-4 text-gray-600 font-medium">平均リードタイム</th>
                <th className="text-right py-2 px-4 text-gray-600 font-medium">観測回数</th>
                <th className="text-right py-2 pl-4 text-gray-600 font-medium">先行率</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              <tr className="border-b border-gray-100"><td className="py-2 pr-4">Technology</td><td className="py-2 px-4 text-right font-mono">11.7 日</td><td className="py-2 px-4 text-right font-mono">57</td><td className="py-2 pl-4 text-right font-mono">93.0%</td></tr>
              <tr className="border-b border-gray-100"><td className="py-2 pr-4">Health Care</td><td className="py-2 px-4 text-right font-mono">12.8 日</td><td className="py-2 px-4 text-right font-mono">65</td><td className="py-2 pl-4 text-right font-mono">87.7%</td></tr>
              <tr className="border-b border-gray-100"><td className="py-2 pr-4">Financials</td><td className="py-2 px-4 text-right font-mono">10.8 日</td><td className="py-2 px-4 text-right font-mono">47</td><td className="py-2 pl-4 text-right font-mono">100.0%</td></tr>
              <tr className="border-b border-gray-100"><td className="py-2 pr-4">Consumer Disc.</td><td className="py-2 px-4 text-right font-mono">8.5 日</td><td className="py-2 px-4 text-right font-mono">63</td><td className="py-2 pl-4 text-right font-mono">96.8%</td></tr>
              <tr className="border-b border-gray-100"><td className="py-2 pr-4">Consumer Staples</td><td className="py-2 px-4 text-right font-mono">12.4 日</td><td className="py-2 px-4 text-right font-mono">50</td><td className="py-2 pl-4 text-right font-mono">98.0%</td></tr>
              <tr className="border-b border-gray-100"><td className="py-2 pr-4">Energy</td><td className="py-2 px-4 text-right font-mono">9.7 日</td><td className="py-2 px-4 text-right font-mono">68</td><td className="py-2 pl-4 text-right font-mono">83.8%</td></tr>
              <tr className="border-b border-gray-100"><td className="py-2 pr-4">Industrials</td><td className="py-2 px-4 text-right font-mono">14.1 日</td><td className="py-2 px-4 text-right font-mono">49</td><td className="py-2 pl-4 text-right font-mono">89.8%</td></tr>
              <tr className="border-b border-gray-100"><td className="py-2 pr-4">Materials</td><td className="py-2 px-4 text-right font-mono">11.4 日</td><td className="py-2 px-4 text-right font-mono">53</td><td className="py-2 pl-4 text-right font-mono">94.3%</td></tr>
              <tr className="border-b border-gray-100"><td className="py-2 pr-4">Utilities</td><td className="py-2 px-4 text-right font-mono">7.7 日</td><td className="py-2 px-4 text-right font-mono">39</td><td className="py-2 pl-4 text-right font-mono">100.0%</td></tr>
              <tr className="border-b border-gray-100"><td className="py-2 pr-4">Real Estate</td><td className="py-2 px-4 text-right font-mono">11.3 日</td><td className="py-2 px-4 text-right font-mono">54</td><td className="py-2 pl-4 text-right font-mono">100.0%</td></tr>
              <tr className="border-b border-gray-100"><td className="py-2 pr-4">Comm. Services</td><td className="py-2 px-4 text-right font-mono">9.6 日</td><td className="py-2 px-4 text-right font-mono">51</td><td className="py-2 pl-4 text-right font-mono">98.0%</td></tr>
              <tr><td className="py-2 pr-4 font-bold">全セクター平均</td><td className="py-2 px-4 text-right font-mono font-bold">10.9 日</td><td className="py-2 px-4 text-right font-mono font-bold">596</td><td className="py-2 pl-4 text-right font-mono font-bold">94.1%</td></tr>
            </tbody>
          </table>
        </div>
        <p className="mt-4">
          11 セクター × 2 年強の期間を通して、方向性マネープレッシャーの符号転換から
          平均 <strong>10.9 営業日 (約 2.2 週間)</strong>後に RS が同方向に転換している。
          リードタイムが最も短いのはユーティリティと一般消費財で約 8 日、
          最も長いのは工業セクターで約 14 日だ。
          セクターサイズが大きく機関投資家の関与が厚いほど、
          マネープレッシャーが RS の先行指標として機能しやすい傾向が見られる。
        </p>
        <p className="mt-4 text-xs text-gray-500">
          ※ 先行率 94% は、反転閾値を意図的に厳しく設定しているため高めに出る。単純な売買シグナルとしてではなく、
          「複合スコアの前に現れる予兆」として解釈するのが妥当だ。
        </p>
      </section>

      {/* --- ユースケース --- */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mt-12 mb-3">個人投資家はこのデータをどう使うか</h2>

        <h3 className="text-base font-bold text-gray-900 mt-6 mb-3">ユースケース 1：月 1 リバランスの機械的ローテーション</h3>
        <p>
          Rotation Composite Score の上位 3 セクター (現時点なら XLE / XLB / XLU) を均等配分で保有し、
          毎月 1 日にリバランスする戦略。バックテスト期間 2024/1〜2026/4 の単純な試算では、
          等金額 11 セクター保有ベンチマークに対して <strong>年率+2〜4%</strong> 程度のスプレッドが出る局面が多かった
          (確定的なバックテスト結果ではなく、手法の方向感を示す参考値)。
        </p>

        <h3 className="text-base font-bold text-gray-900 mt-6 mb-3">ユースケース 2：Composite が弱気一致のセクターをアンダーウェイト</h3>
        <p>
          Composite Score が -0.4 以下かつ confluence = 4/4 (すべての指標が弱気方向) のセクターは、
          新規買いを控えるべき局面だ。本日時点ではヘルスケア (XLV) がこれに該当する。
        </p>

        <h3 className="text-base font-bold text-gray-900 mt-6 mb-3">ユースケース 3：オプション市場の逆張り</h3>
        <p>
          Put/Call 比率が極端に偏ったセクター (本日なら XLY の 21.19、XLC の 0.22) に対して、
          他のシグナルと突き合わせて解釈する。XLY は RS・フローも弱いため「弱気に一致」でそのまま弱気継続と読み、
          XLC は RS・フローが弱いのにオプションだけ極端強気なので「警戒」シグナルとして読む、
          といった使い分けだ。
        </p>

        <h3 className="text-base font-bold text-gray-900 mt-6 mb-3">ユースケース 4：機関投資家の「選別」に追随する</h3>
        <p>
          COT レポートの Asset Manager Net が 52 週パーセンタイル 80 以上の先物 (本日なら E-mini S&P 500) は
          プロが強気、逆に 30 以下の先物 (本日なら NASDAQ MINI) はプロが警戒している先物だ。
          同じ「米株」と言っても、機関投資家はベンチマークと NASDAQ を明確に分けて扱っている。
        </p>
      </section>

      {/* --- 限界 --- */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mt-12 mb-3">データの限界と注意点</h2>
        <ol className="list-decimal pl-6 space-y-3 mt-4">
          <li>
            <strong>マネープレッシャーは厳密なフローではない。</strong>
            本分析の flow_momentum は、ETF の Creation/Redemption データではなく、
            OHLCV から算出した Accumulation/Distribution ベースの指標だ。
            EPFR のような有料フローデータとは概念的に異なる。
          </li>
          <li>
            <strong>オプションは当日スナップショットのみ。</strong>
            Put/Call 比率の 252 日 z-score はヒストリが蓄積されてから有効化する。
            現時点ではセクター横断の相対順位のみを使っている。
          </li>
          <li>
            <strong>マクロ指標は Yahoo Finance の範囲内。</strong>
            ISM 製造業 PMI や失業率、CPI は FRED のような公式 API から取得するのがベストだが、
            本分析では無料・API キー不要で完結させるため、株・為替・商品先物ベースの代替指標を用いている。
            このため景気サイクルの判定精度は、FRED ベースの手法より劣る可能性がある。
          </li>
          <li>
            <strong>COT データには 3 日のラグがある。</strong>
            火曜時点のポジションが金曜に公表されるため、急変時にはラグが大きい。
          </li>
          <li>
            <strong>本分析は投資助言ではない。</strong>
            個別の投資判断は自身のリスク許容度・投資目的・税務状況を踏まえて行うべきである。
          </li>
        </ol>
      </section>

      {/* --- パイプライン --- */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mt-12 mb-3">データ取得パイプライン</h2>
        <pre className="bg-gray-50 text-gray-800 text-xs p-4 rounded-lg my-4 overflow-x-auto">{`① yfinance → セクターETF OHLCV + マクロ指標
② OHLCV → Accumulation/Distribution ベースのマネープレッシャー
③ yfinance option_chain → Put/Call 比率 スナップショット
④ cot_reports (Python) → CFTC TFF レポート
⑤ 統合 → RS計算 → Flow z → Composite Score
⑥ Supabase (alt_data プロジェクト) + S3 (altdata-exports) → API配信 + CSV出力`}</pre>
        <p>
          処理は EC2 上の cron ジョブ (UTC 13:00 / 火〜土) で自動実行される。
          米国市場クローズ後の NY 時間 9:00 に相当し、前日クローズのデータが反映されたタイミングだ。
        </p>
      </section>

      {/* --- ダウンロード --- */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mt-12 mb-3">ダウンロード可能なデータセット</h2>
        <div className="overflow-x-auto my-4">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-2 pr-4 text-gray-600 font-medium">データセット</th>
                <th className="text-left py-2 px-4 text-gray-600 font-medium">更新頻度</th>
                <th className="text-left py-2 pl-4 text-gray-600 font-medium">内容</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              <tr className="border-b border-gray-100"><td className="py-2 pr-4 font-medium">Sector ETF OHLCV + Money Pressure</td><td className="py-2 px-4">日次</td><td className="py-2 pl-4">12 ティッカーの日次価格とマネープレッシャー</td></tr>
              <tr className="border-b border-gray-100"><td className="py-2 pr-4 font-medium">Sector Options Snapshot</td><td className="py-2 px-4">日次</td><td className="py-2 pl-4">11 セクター ETF のオプション P/C 出来高・建玉</td></tr>
              <tr className="border-b border-gray-100"><td className="py-2 pr-4 font-medium">CFTC COT Positioning</td><td className="py-2 px-4">週次</td><td className="py-2 pl-4">E-mini S&P 500 / NASDAQ MINI のポジショニング</td></tr>
              <tr className="border-b border-gray-100"><td className="py-2 pr-4 font-medium">Rotation Composite Score</td><td className="py-2 px-4">日次</td><td className="py-2 pl-4">4 シグナル統合スコアとランキング</td></tr>
              <tr><td className="py-2 pr-4 font-medium">Sector Rotation Daily</td><td className="py-2 px-4">日次</td><td className="py-2 pl-4">日次のセクター別 Composite Score 時系列</td></tr>
            </tbody>
          </table>
        </div>
        <p className="text-sm text-gray-500 mt-4">
          全データセットは「Data Catalog」ページから参照可能。CSV 形式でダウンロードできる。
        </p>
      </section>

      {/* --- 脚注 --- */}
      <section className="mt-12 pt-6 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          本記事に掲載されたデータおよび分析結果は情報提供を目的としたものであり、
          特定の金融商品の売買を推奨するものではありません。投資判断は読者自身の責任において行ってください。
        </p>
        <p className="text-xs text-gray-500 mt-2">データ更新日：2026 年 4 月 11 日</p>
      </section>
    </article>
  )
}
