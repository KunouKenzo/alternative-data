export default function NipponSteelRevenue() {
  return (
    <article className="space-y-8 text-gray-700 leading-relaxed">
      {/* --- 導入 --- */}
      <section>
        <p>
          企業の決算を予測するとき、アナリストが使う情報は決まっている。
          過去の業績、業界の市況、為替や原材料の価格。
          だが近年、これらに加えて「宇宙からのデータ」を投資判断に活用する動きが広がりつつある。
        </p>
        <p className="mt-4">
          本稿では、日本製鉄（証券コード: 5401）の国内主要8製鉄所を対象に、
          人工衛星の熱赤外画像から工場の稼働状況を数値化し、
          それを予測モデルに組み込むと売上予測の精度が向上するかどうかを検証した。
          比較したのは、為替と鉄鋼価格だけで売上を予測する「ベースラインモデル」と、
          そこに衛星データを追加した「拡張モデル」の2つだ。
        </p>
      </section>

      {/* --- 全8製鉄所 --- */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mt-12 mb-4">
          対象: 日本製鉄の全8製鉄所
        </h2>
        <p>
          日本製鉄は粗鋼生産量で国内最大手の鉄鋼メーカーだ。
          今回の分析では、同社が国内に持つ主要な一貫製鉄所のうち8拠点を対象とした。
        </p>
        <div className="overflow-x-auto my-6">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-2 pr-4 text-gray-600 font-medium">製鉄所</th>
                <th className="text-left py-2 px-4 text-gray-600 font-medium">所在地</th>
                <th className="text-left py-2 pl-4 text-gray-600 font-medium">特徴</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              <tr className="border-b border-gray-100">
                <td className="py-2 pr-4 font-medium">君津地区</td>
                <td className="py-2 px-4">千葉県</td>
                <td className="py-2 pl-4">東日本製鉄所の中核、自動車用鋼板に強み</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-2 pr-4 font-medium">鹿島地区</td>
                <td className="py-2 px-4">茨城県</td>
                <td className="py-2 pl-4">大型高炉を擁する臨海型一貫製鉄所</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-2 pr-4 font-medium">室蘭地区</td>
                <td className="py-2 px-4">北海道</td>
                <td className="py-2 pl-4">特殊鋼・棒線に特化、北日本製鉄所</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-2 pr-4 font-medium">名古屋地区</td>
                <td className="py-2 px-4">愛知県</td>
                <td className="py-2 pl-4">自動車産業の集積地に立地</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-2 pr-4 font-medium">和歌山地区</td>
                <td className="py-2 px-4">和歌山県</td>
                <td className="py-2 pl-4">関西製鉄所、厚板・建材に強み</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-2 pr-4 font-medium">大分地区</td>
                <td className="py-2 px-4">大分県</td>
                <td className="py-2 pl-4">大型高炉2基、九州製鉄所の中核</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-2 pr-4 font-medium">八幡地区</td>
                <td className="py-2 px-4">福岡県</td>
                <td className="py-2 pl-4">日本の近代製鉄発祥の地</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-2 pr-4 font-medium">広畑地区</td>
                <td className="py-2 px-4">兵庫県</td>
                <td className="py-2 pl-4">瀬戸内製鉄所、電炉も保有</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          北海道から九州まで、日本列島を縦断するように立地している。
          これだけの拠点を人が定期的に巡回して稼働状況を把握するのは現実的ではない。
          だが衛星なら、5日に一度の頻度ですべてを同時に観測できる。
        </p>
      </section>

      {/* --- 衛星データの仕組み --- */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mt-12 mb-4">
          衛星が捉える工場の「熱」
        </h2>
        <p>
          今回使用したのは、ESA（欧州宇宙機関）のSentinel-2衛星が撮影する
          短波赤外線（SWIR）バンドのデータだ。
          高炉の炉内温度は約2,000度に達するため、SWIRの波長帯では周囲と明確に区別できるほど
          強い信号が検出される。
        </p>

        <figure className="my-8">
          <img
            src="/articles/nippon-steel-revenue/satellite_sample.png"
            alt="Sentinel-2 SWIR偽色画像 - 日本製鉄 君津製鉄所"
            className="w-full rounded-xl shadow-card"
          />
          <figcaption className="text-sm text-gray-500 text-center mt-3">
            Sentinel-2が撮影した君津製鉄所のSWIR偽色合成画像。
            高温の熱源が明るく表示されており、高炉やコークス炉の位置が確認できる。
          </figcaption>
        </figure>

        <p>
          各ピクセルの反射強度から「高温ピクセル」の比率とSWIR帯の平均強度を組み合わせ、
          0～100のスコア（Activity Score）に変換した。
          8工場すべてについてこの処理を行い、2017年から現在まで約8年分の日次データを蓄積している。
        </p>

        <figure className="my-8">
          <img
            src="/articles/nippon-steel-revenue/activity_timeseries.png"
            alt="全工場の稼働指数推移"
            className="w-full rounded-xl shadow-card"
          />
          <figcaption className="text-sm text-gray-500 text-center mt-3">
            全8工場のActivity Score月次推移。
            工場ごとに水準は異なるが、季節変動やCOVID-19の影響は共通して読み取れる。
          </figcaption>
        </figure>
      </section>

      {/* --- ベースラインモデル --- */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mt-12 mb-4">
          まず、衛星データなしで予測してみる
        </h2>
        <p>
          衛星データの価値を測るには、比較対象が必要だ。
          まずは衛星データを一切使わず、誰でも手に入る公開情報だけで
          日本製鉄の四半期売上を予測するモデルを作った。
        </p>
        <p className="mt-4">
          使った変数は2つ。四半期のドル円平均為替レートと、鉄鉱石先物の四半期平均価格だ。
          日本製鉄の売上は輸出比率と原材料価格に強く影響されるため、
          この2変数は理にかなった選択と言える。
        </p>

        <figure className="my-8">
          <img
            src="/articles/nippon-steel-revenue/model_baseline.png"
            alt="ベースラインモデルの予測結果"
            className="w-full rounded-xl shadow-card"
          />
          <figcaption className="text-sm text-gray-500 text-center mt-3">
            ベースラインモデル（為替＋鉄鋼価格のみ）の予測結果。
            大まかなトレンドは捉えているが、四半期ごとの変動への追従が弱い。
          </figcaption>
        </figure>

        <p>
          為替と鉄鋼価格だけでも、売上の大きな方向感はある程度掴める。
          ただし、四半期ごとの上下の変動を正確に当てるには情報が足りない。
          この「足りない部分」を衛星データで補えるかどうかが、次の検証のポイントだ。
        </p>
      </section>

      {/* --- 拡張モデル --- */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mt-12 mb-4">
          衛星データを加えるとどうなるか
        </h2>
        <p>
          ベースラインの2変数に、全8工場の衛星データ（Activity Score、SWIR反射強度、高温ピクセル比率）
          を加えた拡張モデルを構築した。
          衛星データは工場ごとの日次観測値を全工場で平均し、さらに四半期単位に集約したものを使っている。
        </p>

        <figure className="my-8">
          <img
            src="/articles/nippon-steel-revenue/model_enhanced.png"
            alt="拡張モデルの予測結果"
            className="w-full rounded-xl shadow-card"
          />
          <figcaption className="text-sm text-gray-500 text-center mt-3">
            拡張モデル（為替＋鉄鋼価格＋衛星データ）の予測結果。
            ベースラインと比較して、実績への追従が改善している。
          </figcaption>
        </figure>

        <div className="bg-violet-50 border-l-4 border-violet-400 p-5 rounded-r-lg my-8">
          <p className="text-sm text-violet-900 font-medium mb-2">
            衛星データの追加により、予測精度が向上
          </p>
          <p className="text-sm text-violet-800">
            衛星データを加えたモデルでは、クロスバリデーションのR二乗値が改善し、
            予測誤差（MAPE）も低下した。
            為替や市況データだけでは捉えきれない「工場の実際の稼働状況」が、
            予測精度の底上げに寄与している。
          </p>
        </div>

        <figure className="my-8">
          <img
            src="/articles/nippon-steel-revenue/model_comparison.png"
            alt="モデル精度の比較"
            className="w-full rounded-xl shadow-card"
          />
          <figcaption className="text-sm text-gray-500 text-center mt-3">
            2つのモデルの精度比較。衛星データを加えた拡張モデルが各指標で上回っている。
          </figcaption>
        </figure>
      </section>

      {/* --- 工場別パターン --- */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mt-12 mb-4">
          工場ごとの稼働パターン
        </h2>
        <p>
          8工場の稼働状況を四半期ごとにヒートマップで並べると、
          製鉄業の特性がよく見えてくる。
        </p>

        <figure className="my-8">
          <img
            src="/articles/nippon-steel-revenue/factory_heatmap.png"
            alt="工場別Activity Scoreヒートマップ"
            className="w-full rounded-xl shadow-card"
          />
          <figcaption className="text-sm text-gray-500 text-center mt-3">
            工場別・四半期ごとのActivity Score。色が濃いほど稼働が活発。
            COVID-19の影響（2020年Q2-Q3）や季節変動が読み取れる。
          </figcaption>
        </figure>

        <p>
          2020年の第2四半期はほぼ全工場で色が薄くなっている。
          COVID-19による需要急減で減産に入った時期だ。
          その後、2021年後半から2022年にかけて回復し、全体的に色が濃くなっている。
          こうした「全工場が同時に動く」パターンは、連結売上との連動性を高める要因になっている。
        </p>
      </section>

      {/* --- 変数重要度 --- */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mt-12 mb-4">
          何が売上を動かしているのか
        </h2>

        <figure className="my-8">
          <img
            src="/articles/nippon-steel-revenue/feature_importance.png"
            alt="変数重要度"
            className="w-full rounded-xl shadow-card"
          />
          <figcaption className="text-sm text-gray-500 text-center mt-3">
            拡張モデルにおける各変数の影響度。
            為替の影響が大きい一方、衛星データも一定の寄与を見せている。
          </figcaption>
        </figure>

        <p>
          為替レートの影響力が大きいのは予想通りだ。
          しかし注目すべきは、衛星由来の変数もモデルに有意な情報を提供している点だ。
          特にSWIR反射強度は、工場の熱源の「強さ」を直接反映しており、
          生産量の変動を捉えるシグナルとして機能している。
        </p>
        <p className="mt-4">
          為替や鉄鋼価格は市場の「価格」側の情報を持っている。
          一方、衛星データは「量」側の情報を持っている。
          この2つの異なるチャネルの情報を組み合わせることで、
          売上高（= 量 x 単価）をより精度高く推定できる構造になっている。
        </p>
      </section>

      {/* --- 限界 --- */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mt-12 mb-4">
          この分析の限界
        </h2>
        <ul className="list-disc list-inside space-y-3 mt-4 ml-4">
          <li>
            <strong>四半期の粒度では変動が少ない。</strong>
            四半期売上は比較的安定しているため、予測が難しい変動幅は小さい。
            月次や週次のより細かい粒度での分析が今後の課題だ。
          </li>
          <li>
            <strong>雲の影響。</strong>
            日本の梅雨や台風シーズンは衛星観測ができない日が多い。
            四半期集計でならされるが、特に夏場のデータ品質には注意が必要だ。
          </li>
          <li>
            <strong>海外拠点は未対象。</strong>
            日本製鉄は海外にも製造拠点を持つが、今回は国内8拠点のみを対象とした。
            連結売上には海外事業の寄与も含まれるため、
            海外拠点も加えることで精度はさらに向上する可能性がある。
          </li>
          <li>
            <strong>サンプルサイズ。</strong>
            約30四半期分のデータで検証しており、統計的に十分とは言い切れない。
            データの蓄積が進むほど、検証の信頼性は高まる。
          </li>
        </ul>
      </section>

      {/* --- まとめ --- */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mt-12 mb-4">
          まとめ
        </h2>
        <p>
          衛星データは、為替や市況データだけでは掴めない「工場の実稼働」という独自の情報を提供する。
          今回の検証では、この情報をモデルに加えることで、
          日本製鉄の四半期売上予測の精度が向上することが確認できた。
        </p>
        <p className="mt-4">
          衛星データの本質的な強みは、
          企業が公式に発表するよりも前に、物理的な稼働状況の変化を検知できる点にある。
          決算発表を待たずに「工場が動いているかどうか」を知ることができれば、
          それは投資判断において明確な情報優位性になる。
        </p>
        <p className="mt-4">
          もちろん、衛星データ単体で完全な予測ができるわけではない。
          既存のファンダメンタルズ分析を補完する「もう一つの目」として、
          その有用性は十分に示されたと考えている。
        </p>
      </section>

      {/* --- 補足 --- */}
      <section className="mt-12 pt-6 border-t border-gray-200">
        <p className="text-xs text-gray-400">
          本稿の分析はSentinel-2衛星（ESA/Copernicus）のSWIRバンドデータ、
          日本製鉄のIR公開情報、Yahoo Financeの市場データを使用しています。
          記載内容は情報提供を目的としたものであり、投資助言ではありません。
        </p>
      </section>
    </article>
  )
}
