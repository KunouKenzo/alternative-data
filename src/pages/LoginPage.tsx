import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../components/auth/AuthContext'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/')
    } catch {
      setError('メールアドレスまたはパスワードが正しくありません')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo / Title */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <h1 className="text-2xl font-bold text-gradient">Alternative Data</h1>
          </Link>
          <p className="text-gray-500 text-sm mt-2">アカウントにログイン</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                メールアドレス
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 border border-gray-200 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                パスワード
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 border border-gray-200 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-violet-600 text-white rounded-xl py-3 text-sm font-semibold hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'ログイン中...' : 'ログイン'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              アカウントをお持ちでないですか？{' '}
              <Link to="/signup" className="text-violet-600 font-medium hover:text-violet-700">
                新規登録
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          <Link to="/" className="hover:text-gray-600">
            &larr; トップに戻る
          </Link>
        </p>
      </div>
    </div>
  )
}
