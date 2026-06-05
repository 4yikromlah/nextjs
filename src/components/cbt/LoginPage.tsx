'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GraduationCap, Mail, Lock, User, BookOpen, Eye, EyeOff, UserPlus, ArrowLeft } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'

export default function LoginPage() {
  const { setUser, setCurrentView } = useAppStore()
  const [isRegister, setIsRegister] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '', className: '' })

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.email || !form.password) {
      toast.error('Email dan password harus diisi')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password })
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error)
        return
      }
      setUser(data.user)
      localStorage.setItem('cbt_user', JSON.stringify(data.user))
      setCurrentView(data.user.role === 'ADMIN' ? 'admin' : 'student')
      toast.success(`Selamat datang, ${data.user.name}!`)
    } catch {
      toast.error('Terjadi kesalahan koneksi')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.password) {
      toast.error('Semua field harus diisi')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password, className: form.className })
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error)
        return
      }
      setUser(data.user)
      localStorage.setItem('cbt_user', JSON.stringify(data.user))
      setCurrentView('student')
      toast.success('Registrasi berhasil! Selamat datang.')
    } catch {
      toast.error('Terjadi kesalahan koneksi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-[#e8ecf1]">
      {/* Background decorative */}
      <div className="bg-circle-1" />
      <div className="bg-circle-2" />
      <div className="bg-circle-3" />

      <motion.div
        className="clay-glass w-full max-w-md p-8 relative noise-overlay"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, type: 'spring' }}
      >
        {/* Logo */}
        <motion.div
          className="flex flex-col items-center mb-8"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <motion.div
            className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-4 shadow-xl shadow-indigo-500/30"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <GraduationCap className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            CBT-Online
          </h1>
          <p className="text-sm text-gray-400 mt-1 font-medium">Sistem Manajemen Ujian Digital</p>
        </motion.div>

        <AnimatePresence mode="wait">
          {!isRegister ? (
            <motion.form
              key="login"
              onSubmit={handleLogin}
              className="space-y-5"
              initial={{ x: 0, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -50, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
                <label className="text-sm font-semibold text-gray-500 mb-1.5 block">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    className="neu-input w-full pl-10"
                    placeholder="Masukkan email"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  />
                </div>
              </motion.div>

              <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
                <label className="text-sm font-semibold text-gray-500 mb-1.5 block">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="neu-input w-full pl-10 pr-10"
                    placeholder="Masukkan password"
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </motion.div>

              <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
                <button
                  type="submit"
                  disabled={loading}
                  className="clay-btn w-full py-3.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold text-center disabled:opacity-50 shadow-lg shadow-indigo-500/25"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Memproses...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Lock className="w-4 h-4" /> Masuk
                    </span>
                  )}
                </button>
              </motion.div>

              <motion.div className="text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
                <p className="text-sm text-gray-400">
                  Belum punya akun?{' '}
                  <button type="button" onClick={() => setIsRegister(true)} className="text-indigo-500 hover:underline font-bold">
                    Daftar Siswa
                  </button>
                </p>
              </motion.div>

              <motion.div className="neu-pressed p-3 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                <p className="text-xs text-gray-400 font-medium">Demo Admin: <span className="text-indigo-500 font-bold">admin@cbt.com</span> / <span className="text-indigo-500 font-bold">admin123</span></p>
                <p className="text-xs text-gray-400 font-medium mt-0.5">Demo Siswa: <span className="text-emerald-500 font-bold">budi@student.com</span> / <span className="text-emerald-500 font-bold">siswa123</span></p>
              </motion.div>
            </motion.form>
          ) : (
            <motion.form
              key="register"
              onSubmit={handleRegister}
              className="space-y-4"
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 50, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-2">
                <button type="button" onClick={() => setIsRegister(false)} className="flex items-center gap-1 text-sm text-gray-400 hover:text-indigo-500 transition-colors">
                  <ArrowLeft className="w-4 h-4" /> Kembali ke Login
                </button>
              </motion.div>

              <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
                <label className="text-sm font-semibold text-gray-500 mb-1.5 block">Nama Lengkap</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    className="neu-input w-full pl-10"
                    placeholder="Masukkan nama lengkap"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  />
                </div>
              </motion.div>

              <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }}>
                <label className="text-sm font-semibold text-gray-500 mb-1.5 block">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    className="neu-input w-full pl-10"
                    placeholder="Masukkan email"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  />
                </div>
              </motion.div>

              <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
                <label className="text-sm font-semibold text-gray-500 mb-1.5 block">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="password"
                    className="neu-input w-full pl-10"
                    placeholder="Buat password"
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  />
                </div>
              </motion.div>

              <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.25 }}>
                <label className="text-sm font-semibold text-gray-500 mb-1.5 block">Kelas</label>
                <div className="relative">
                  <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    className="neu-input w-full pl-10"
                    placeholder="Contoh: XII IPA 1"
                    value={form.className}
                    onChange={e => setForm(f => ({ ...f, className: e.target.value }))}
                  />
                </div>
              </motion.div>

              <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
                <button
                  type="submit"
                  disabled={loading}
                  className="clay-btn w-full py-3.5 bg-gradient-to-r from-emerald-400 to-teal-500 text-white font-bold text-center disabled:opacity-50 shadow-lg shadow-emerald-500/25"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Memproses...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <UserPlus className="w-4 h-4" /> Daftar
                    </span>
                  )}
                </button>
              </motion.div>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
