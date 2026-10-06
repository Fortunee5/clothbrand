import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Lock } from 'lucide-react'
import Spinner from '../components/Spinner'
import { useToast } from '../context/ToastContext'
import useGsapContext from '../hooks/useGsapContext'
import { gsap, EASE } from '../lib/gsap'
import { supabase } from '../lib/backendConfig'

export default function AdminLogin() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { toast } = useToast()
  const cardRef = useRef(null)

  useGsapContext(() => {
    gsap.fromTo(
      cardRef.current,
      { opacity: 0, y: 24, scale: 0.98 },
      { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: EASE }
    )
  }, [], cardRef)

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    // Real login through Supabase Auth (the password is no longer stored in the website code)
    const { error: authError } = supabase
      ? await supabase.auth.signInWithPassword({ email: username.trim(), password })
      : { error: new Error('Supabase is not configured') }
    if (!authError) {
      localStorage.setItem('admin_session', 'true')
      toast('Welcome back.', { type: 'success' })
      navigate('/admin/dashboard')
    } else {
      setError('Invalid email or password')
      if (cardRef.current) {
        gsap.fromTo(cardRef.current, { x: -8 }, { x: 0, duration: 0.4, ease: 'elastic.out(1, 0.4)' })
      }
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center bg-[#F7F5F0] px-4 py-12">
      <div ref={cardRef} className="w-full max-w-sm">

        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-[#0D0F1C] rounded-full mb-4">
            <Lock size={18} className="text-[#C9A24B]" />
          </div>
          <p className="font-bold text-[17px] uppercase tracking-[-0.02em]">
            TheStyle<span className="text-[#C9A24B]">YouHub</span>
          </p>
          <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 mt-1">Admin Portal</p>
        </div>

        {/* Card */}
        <div className="bg-white border border-gray-200 rounded-xl p-7 sm:p-8 shadow-sm">

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-xs font-medium px-4 py-3 rounded-lg mb-5 text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500 mb-2">
                Admin email
              </label>
              <input
                required
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#C9A24B]/30 focus:border-[#C9A24B] transition-all placeholder:text-gray-300"
                placeholder="Enter your admin email"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  required
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 pr-11 text-sm outline-none focus:ring-2 focus:ring-[#C9A24B]/30 focus:border-[#C9A24B] transition-all placeholder:text-gray-300"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-600 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0D0F1C] text-white py-3.5 rounded-lg text-[11px] font-bold uppercase tracking-[0.18em] hover:bg-[#C9A24B] active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-2 flex items-center justify-center gap-2"
            >
              {loading && <Spinner size={14} />}
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center text-[10px] text-gray-400 mt-6 uppercase tracking-[0.12em]">
          © 2026 TheStyleYouHub · Restricted access
        </p>
      </div>
    </div>
  )
}
