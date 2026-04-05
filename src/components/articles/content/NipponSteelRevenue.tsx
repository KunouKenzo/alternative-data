export default function NipponSteelRevenue() {
  return (
    <article className="space-y-8 text-gray-700 leading-relaxed">
      {/* --- 導入 --- */}
      <section>
        <p>
          もし、宇宙から企業の業績を覗き見ることができたら――。
          そんなSFめいた話が、実は現実になりつつある。
          人工衛星が撮影する赤外線画像を使えば、製鉄所の高炉が稼働しているかどうかを、
          地球の外側から観測できるのだ。
        </p>
        <p className="mt-4">
          本稿では、欧州宇宙機関（ESA）が運用するSentinel-2衛星の短波赤外（SWIR）データを用いて、
          日本製鉄（証券コード: 5401）の工場稼働状況を数値化し、
          四半期ごとの連結売上高を予測できるか検証した結果を報告する。
          結論を先に述べると、衛星データだけでは売上を予測するのは極めて難しい。
          ただし、その過程で見えてくる「衛星データが捉えているもの」と「捉えきれないもの」の境界線は、
          投資の視点からも興味深いものだった。
        </p>
      </section>

      {/* --- 日本製鉄とは --- */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mt-12 mb-4">
          日本製鉄と2つの巨大製鉄所
        </h2>
        <p>
          日本製鉄は、粗鋼生産量で国内首位、世界でもトップクラスの規模を誇る鉄鋼メーカーだ。
          2024年に話題となったUSスチール買収提案でもその名を知った方は多いだろう。
        </p>
        <p className="mt-4">
          今回の分析対象は、東日本製鉄所の2拠点だ。
          千葉県君津市にある<strong>君津地区</strong>と、茨城県鹿嶋市の<strong>鹿島地区</strong>。
          いずれも東京湾・太平洋に面した臨海型の一貫製鉄所で、
          敷地面積はそれぞれ東京ドーム200個分以上。高炉、転炉、圧延設備が集約されている。
        </p>
      </section>

      {/* --- 衛星が捉えるもの --- */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mt-12 mb-4">
          衛星が捉える「熱」の正体
        </h2>
        <p>
          Sentinel-2衛星は、5日に一度の頻度で地球上のあらゆる場所を撮影している。
          通常のカラー写真に加え、人間の目には見えない短波赤外線（SWIR）の波長帯も捉える。
          SWIRの何が便利かというと、高温の物体が強い信号を出すという性質がある点だ。
        </p>
        <p className="mt-4">
          高炉の内部温度は約2,000度に達する。この熱はSWIR帯では非常に明るく映り、
          周囲の建物や土壌とはっきり区別できる。
          いわば、宇宙から製鉄所の「体温」を測っているようなものだ。
        </p>

        <figure className="my-8">
          <img
            src="/articles/nippon-steel-revenue/satellite_sample.png"
            alt="Sentinel-2 SWIR偽色画像 - 日本製鉄 君津製鉄所"
            className="w-full rounded-xl shadow-card"
          />
          <figcaption className="text-sm text-gray-500 text-center mt-3">
            Sentinel-2衛星が撮影した君津製鉄所のSWIR偽色合成画像。
            SWIR帯を赤チャンネルに割り当てているため、高温領域が明るく表示される。
            左上の工場敷地内に、高炉やコークス炉の熱源が確認できる。
          </figcaption>
        </figure>

        <p>
          この衛星データから、各ピクセルの反射強度が閾値を超えた「高温ピクセル」の割合と、
          SWIR帯の平均反射強度を組み合わせて、0から100のスコア（Activity Score）を算出した。
          スコアが高いほど、工場で強い熱源が多く検出されていることを意味する。
        </p>

        <figure className="my-8">
          <img
            src="/articles/nippon-steel-revenue/activity_timeseries.png"
            alt="工場稼働指数の推移"
            className="w-full rounded-xl shadow-card"
          />
          <figcaption className="text-sm text-gray-500 text-center mt-3">
            月次で集計したActivity Scoreの推移。
            季節変動が見られ、冬季にスコアが高まる傾向がある。
            2020年のCOVID-19の影響や、2022年以降の回復基調も読み取れる。
          </figcaption>
        </figure>
      </section>

      {/* --- 衛星データだけで予測 --- */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mt-12 mb-4">
          衛星データだけで売上は予測できるのか
        </h2>
        <p>
          まずは最もシンプルな問いから始めた。
          四半期ごとのActivity Scoreの平均値から、同じ四半期の連結売上高を予測できるか。
        </p>
        <p className="mt-4">
          結果は、率直に言って厳しいものだった。
        </p>

        <figure className="my-8">
          <img
            src="/articles/nippon-steel-revenue/revenue_vs_activity.png"
            alt="衛星データと売上高の散布図"
            className="w-full rounded-xl shadow-card"
          />
          <figcaption className="text-sm text-gray-500 text-center mt-3">
            横軸がActivity Score、縦軸が売上高。相関係数は0.059と、ほぼ無相関。
            Activity Scoreが高くても売上が低い四半期や、その逆のケースが多く散らばっている。
          </figcaption>
        </figure>

        <p>
          相関係数はわずか0.059。統計的に言えば、衛星データと売上高の間にはほとんど直線的な関係がない。
          実際にRidge回帰モデルを訓練してみたところ、検証期間のR二乗値はマイナス61という壊滅的な数字になった。
          これは「平均値をそのまま予測した方がまだマシ」という意味だ。
        </p>

        <figure className="my-8">
          <img
            src="/articles/nippon-steel-revenue/model_basic.png"
            alt="基本モデルの予測結果"
            className="w-full rounded-xl shadow-card"
          />
          <figcaption className="text-sm text-gray-500 text-center mt-3">
            衛星データのみで構築したモデル。予測線（紫の破線）がほぼ水平で、
            売上の上下動をまったく捉えられていない。
          </figcaption>
        </figure>

        <div className="bg-violet-50 border-l-4 border-violet-400 p-4 rounded-r-lg my-6">
          <p className="text-sm text-violet-800">
            <strong>なぜ衛星データだけでは予測できないのか。</strong>
            製鉄所の稼働状況は売上に影響する要因の一つに過ぎない。
            売上高は生産量だけでなく、鉄鋼製品の販売単価、為替レート、
            海外子会社の業績など多くの要素で決まる。
            高炉が同じように稼働していても、鉄鋼価格が半分になれば売上は大きく下がる。
          </p>
        </div>
      </section>

      {/* --- 追加変数の探索 --- */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mt-12 mb-4">
          売上を動かす「本当の」変数を探す
        </h2>
        <p>
          衛星データだけでは不十分なら、他に何が売上を動かしているのか。
          候補として、以下の変数を追加で取得した。
        </p>
        <ul className="list-disc list-inside space-y-2 mt-4 ml-4">
          <li>
            <strong>USD/JPY為替レート</strong> -- 日本製鉄は輸出比率が高く、円安は売上高の押し上げ要因になる。
            四半期の平均為替レートを使用。
          </li>
          <li>
            <strong>鉄鉱石価格</strong> -- 鉄鋼の原料価格であり、製品価格に転嫁される傾向がある。
            鉄鉱石先物（TIO=F）の四半期平均を使用。
          </li>
        </ul>

        <p className="mt-4">
          これらの変数と衛星データの関係を相関行列で確認すると、面白い構図が浮かび上がる。
        </p>

        <figure className="my-8">
          <img
            src="/articles/nippon-steel-revenue/feature_importance.png"
            alt="変数重要度"
            className="w-full rounded-xl shadow-card"
          />
          <figcaption className="text-sm text-gray-500 text-center mt-3">
            拡張モデルにおける各変数の売上予測への寄与度。
            USD/JPY為替が最も影響力が大きく、次いでSWIR反射強度（B12帯）が続く。
          </figcaption>
        </figure>

        <p>
          為替の影響力が突出して大きい。考えてみれば当然で、
          2012年から2024年にかけてドル円は80円台から150円台まで大きく動いており、
          この間の売上高の変動と強く連動している。
          一方、衛星のSWIR反射強度も一定の寄与を見せている点は注目に値する。
          これは工場の熱源の「強さ」そのものを捉えており、
          単純なActivity Scoreよりも売上との関連が深い可能性がある。
        </p>
      </section>

      {/* --- 拡張モデルの結果 --- */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mt-12 mb-4">
          拡張モデルの予測精度
        </h2>
        <p>
          衛星データに為替と鉄鉱石価格を加えた拡張モデルを構築し、
          直近7四半期を検証データとして予測精度を測定した。
        </p>

        <figure className="my-8">
          <img
            src="/articles/nippon-steel-revenue/model_enhanced.png"
            alt="拡張モデルの予測結果"
            className="w-full rounded-xl shadow-card"
          />
          <figcaption className="text-sm text-gray-500 text-center mt-3">
            拡張モデルの予測結果。訓練期間では実績をある程度追従しているが、
            検証期間では実績との乖離が見られる。
          </figcaption>
        </figure>

        <p>
          訓練期間のR二乗値は0.51と、衛星データのみのモデル（0.005）から大幅に改善した。
          売上の変動のおよそ半分を説明できている計算だ。
          しかし、検証期間のR二乗値はマイナスのままで、
          未知のデータに対する予測精度は依然として低い。
        </p>

        <div className="overflow-x-auto my-6">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 pr-4 text-gray-600 font-medium">指標</th>
                <th className="text-right py-2 px-4 text-gray-600 font-medium">基本モデル（衛星のみ）</th>
                <th className="text-right py-2 pl-4 text-gray-600 font-medium">拡張モデル</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="py-2 pr-4">訓練 R&sup2;</td>
                <td className="text-right py-2 px-4">0.005</td>
                <td className="text-right py-2 pl-4 font-medium text-violet-700">0.514</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-2 pr-4">検証 R&sup2;</td>
                <td className="text-right py-2 px-4">-61.3</td>
                <td className="text-right py-2 pl-4">-25.2</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-2 pr-4">検証 MAPE</td>
                <td className="text-right py-2 px-4">10.8%</td>
                <td className="text-right py-2 pl-4 font-medium text-violet-700">6.7%</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p>
          MAPE（平均絶対パーセント誤差）は6.7%まで下がっており、
          「おおまかな水準感」は掴めるようになっている。
          ただし、四半期ごとの上下の方向を正確に当てるには程遠い精度だ。
        </p>
      </section>

      {/* --- 限界と注意点 --- */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mt-12 mb-4">
          この分析の限界
        </h2>
        <p>
          今回の検証にはいくつかの重要な制約がある。正直に挙げておきたい。
        </p>
        <ul className="list-disc list-inside space-y-3 mt-4 ml-4">
          <li>
            <strong>観測拠点が2つしかない。</strong>
            日本製鉄は国内外に多数の製鉄所を持つが、今回は君津と鹿島のみを対象とした。
            連結売上全体から見れば、この2拠点がカバーする範囲は限定的だ。
          </li>
          <li>
            <strong>雲が大敵。</strong>
            日本は梅雨や台風シーズンに曇天が多く、衛星画像が使えない日が頻繁にある。
            特に夏場のデータは欠損が多く、四半期の集計精度に影響する。
          </li>
          <li>
            <strong>サンプルサイズが33四半期しかない。</strong>
            統計的に意味のあるモデルを作るには心もとない量だ。
            特に検証データが7四半期しかないため、検証結果のブレが大きい。
          </li>
          <li>
            <strong>売上は「量 x 単価」である。</strong>
            衛星データが捉えるのは工場の物理的な稼働状況であり、
            製品単価の変動は原理的に見えない。鉄鋼業の売上は市況に大きく左右されるため、
            稼働量だけで売上を説明しようとすること自体に無理がある。
          </li>
        </ul>
      </section>

      {/* --- まとめ --- */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mt-12 mb-4">
          まとめ -- 衛星データの「使いどころ」
        </h2>
        <p>
          衛星データだけで日本製鉄の売上を予測できるか。答えは「現状では難しい」だ。
          相関係数0.06、R二乗値はマイナス。数字は正直だ。
        </p>
        <p className="mt-4">
          ただし、これは「衛星データが無価値だ」ということではない。
          月次の稼働指数の推移を見ると、COVID-19による減産からの回復過程や、
          季節的な操業パターンはきちんと捉えられている。
          問題は、稼働状況と売上高の間には為替や市況という大きな変数が介在しており、
          稼働量から直接売上を推定するルートが細すぎるということだ。
        </p>
        <p className="mt-4">
          衛星データがより力を発揮するのは、おそらく別の使い方だろう。
          たとえば、決算発表前に「工場が予想以上に動いている/止まっている」という
          異常検知に使うアプローチなら、売上の絶対値を当てる必要がない。
          あるいは、鉄鋼会社間の相対比較（A社の稼働率が下がっている一方でB社は上がっている）
          も面白い応用だ。
        </p>
        <p className="mt-4">
          衛星データは万能ではないが、他のどこからも手に入らない情報を持っている。
          使い方次第で、投資判断の一つのピースになりうる。
          今後、観測拠点の拡大や、日次データを活用した短期予測モデルの検討も進めていきたい。
        </p>
      </section>

      {/* --- 補足 --- */}
      <section className="mt-12 pt-6 border-t border-gray-200">
        <p className="text-xs text-gray-400">
          本稿の分析はSentinel-2衛星（ESA/Copernicus）のSWIRバンドデータ、
          日本製鉄のIR公開情報、Yahoo Financeの市場データを使用しています。
          記載内容は情報提供を目的としたものであり、投資助言ではありません。
          掲載されている売上高データは概算値であり、正確な数値は日本製鉄の有価証券報告書をご確認ください。
        </p>
      </section>
    </article>
  )
}
