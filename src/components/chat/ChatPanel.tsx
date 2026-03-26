import { useState, useRef, useEffect } from 'react'
import ChatMessage from './ChatMessage'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

const SUGGESTED_PROMPTS = [
  '原油価格の推移をグラフにして',
  'ビットコインと金の相関を分析',
  'マクロ指標のトレンドを可視化',
  'S&P500セクター別比較',
]

const MOCK_RESPONSES = [
  'データを分析しています... 原油価格は過去6ヶ月で約12%上昇しており、地政学的要因が主な要因と考えられます。グラフを生成中です。',
  '相関分析の結果、ビットコインと金の30日間ローリング相関は0.42で、中程度の正の相関が見られます。詳細なチャートを準備します。',
  '主要マクロ指標のトレンドを確認しました。CPI、PMI、失業率のデータを可視化します。特に注目すべきはPMIの直近の改善傾向です。',
  'S&P500のセクター別パフォーマンスを比較します。テクノロジーセクターが年初来+18%でリードしており、エネルギーセクターが+15%で続いています。',
]

export default function ChatPanel({ className = '' }: { className?: string }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = (text: string) => {
    if (!text.trim() || isLoading) return

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
    }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsLoading(true)

    // Auto-resize textarea back
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    // Mock AI response
    setTimeout(() => {
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: MOCK_RESPONSES[Math.floor(Math.random() * MOCK_RESPONSES.length)],
      }
      setMessages(prev => [...prev, aiMsg])
      setIsLoading(false)
    }, 1200)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    // Auto-resize
    const el = e.target
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  }

  return (
    <div className={`flex flex-col bg-white ${className}`}>
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-200 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center">
          <span className="material-symbols-outlined text-white text-[18px]">auto_awesome</span>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-gray-900">AI Assistant</h2>
          <p className="text-xs text-gray-400">データ分析・可視化</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-100 to-cyan-100 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-violet-500 text-[28px]">
                auto_awesome
              </span>
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">
              データ分析アシスタント
            </h3>
            <p className="text-sm text-gray-500 mb-6 max-w-[260px]">
              データの分析・可視化をAIがサポートします。何でもお聞きください。
            </p>

            {/* Suggested prompts */}
            <div className="w-full space-y-2">
              {SUGGESTED_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(prompt)}
                  className="w-full text-left px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-violet-50 hover:border-violet-200 hover:text-violet-700 transition-colors"
                >
                  <span className="material-symbols-outlined text-[14px] mr-2 align-middle opacity-50">
                    arrow_forward
                  </span>
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map(msg => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            {isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-white text-[16px]">auto_awesome</span>
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                  <div className="flex gap-1">
                    {[0, 1, 2].map(i => (
                      <div
                        key={i}
                        className="w-2 h-2 rounded-full bg-gray-400"
                        style={{
                          animation: 'bounce-dot 1.2s infinite',
                          animationDelay: `${i * 0.15}s`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-gray-200">
        <div className="flex items-end gap-2 bg-gray-50 rounded-xl border border-gray-200 px-3 py-2 focus-within:border-violet-300 focus-within:ring-2 focus-within:ring-violet-100">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="メッセージを入力..."
            rows={1}
            className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 resize-none outline-none max-h-[120px]"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
            className="w-8 h-8 rounded-lg bg-violet-600 text-white flex items-center justify-center flex-shrink-0 hover:bg-violet-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">send</span>
          </button>
        </div>
        <p className="text-[11px] text-gray-400 mt-2 text-center">
          AI の回答は参考情報です。重要な判断には必ず原データを確認してください。
        </p>
      </div>
    </div>
  )
}
