'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Image from 'next/image'
import Link from 'next/link'
import { useLanguage } from '@/components/LanguageProvider'

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const { t } = useLanguage()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match!')
      return
    }
    
    setLoading(true)

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName }
        }
      })
      if (error) throw error
      toast.success(t.accountCreated)
      router.push('/')
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-emerald-50 px-4">

      {/* Main Card */}
      <div className="w-full max-w-[350px] bg-white border border-slate-200 rounded-2xl p-10 shadow-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-slate-100 shadow-md mb-5 bg-white flex items-center justify-center">
            <Image src="/logo.png" alt="SevaCare Logo" width={80} height={80} className="w-full h-full object-cover" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">SevaCare</h1>
          <p className="text-sm text-slate-500 mt-2 font-medium text-center leading-snug px-4">
            Sign up to manage and care for your elderly residents
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            placeholder="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="w-full px-3.5 py-3 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
          />
          <input
            type="email"
            placeholder={t.emailAddress}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3.5 py-3 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
          />
          <input
            type="password"
            placeholder={t.password}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-3.5 py-3 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
          />
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-3.5 py-3 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition-all rounded-lg mt-2"
          >
            {loading ? t.authenticating : t.signUp}
          </button>
        </form>

        {/* Terms */}
        <p className="text-[10px] text-slate-400 text-center mt-5 leading-relaxed px-2">
          By signing up, you agree to our <span className="text-slate-600 font-semibold">Terms of Service</span> and <span className="text-slate-600 font-semibold">Privacy Policy</span>.
        </p>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-[350px] bg-white border border-slate-200 rounded-2xl p-5 mt-3 text-center shadow-sm">
        <p className="text-sm text-slate-600">
          {t.alreadyHaveAccount}{' '}
          <Link href="/" className="text-blue-600 font-bold hover:text-blue-800 transition-colors">
            Log in
          </Link>
        </p>
      </div>

      {/* App Badge */}
      <div className="mt-8 text-center">
        <p className="text-xs text-slate-400 font-medium mb-3">Get the app.</p>
        <div className="flex items-center justify-center gap-2">
          <div className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg flex items-center gap-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
            App Store
          </div>
          <div className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg flex items-center gap-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.199l2.302 2.302a1 1 0 010 1.38l-2.302 2.302L15.396 13l2.302-2.492zM5.864 2.658L16.8 9.003l-2.302 2.302L5.864 2.658z"/></svg>
            Google Play
          </div>
        </div>
      </div>

      {/* Footer */}
      <p className="text-[10px] text-slate-400 mt-8 mb-4">© 2026 SevaCare • Elderly Care Management</p>
    </div>
  )
}
