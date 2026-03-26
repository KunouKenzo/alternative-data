interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

export default function ChatMessage({ message }: { message: Message }) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          isUser
            ? 'bg-violet-100 text-violet-600'
            : 'bg-gradient-to-br from-violet-500 to-cyan-500 text-white'
        }`}
      >
        <span className="material-symbols-outlined text-[16px]">
          {isUser ? 'person' : 'auto_awesome'}
        </span>
      </div>

      {/* Bubble */}
      <div
        className={`max-w-[80%] px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? 'bg-violet-600 text-white rounded-2xl rounded-br-md'
            : 'bg-white border border-gray-200 text-gray-800 rounded-2xl rounded-bl-md shadow-sm'
        }`}
      >
        {message.content}
      </div>
    </div>
  )
}
