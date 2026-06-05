'use client'

import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Monitor, Eye, EyeOff, User, Lock, GraduationCap,
  BookOpen, ShieldCheck, Clock, Info, Play, Loader2
} from 'lucide-react'
import { useAppStore, type LoginPortal } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

function formatTanggal(d: Date): string {
  const hari = HARI[d.getDay()]
  const tgl = d.getDate()
  const bln = BULAN[d.getMonth()]
  const thn = d.getFullYear()
  const jam = d.getHours().toString().padStart(2, '0')
  const menit = d.getMinutes().toString().padStart(2, '0')
  const detik = d.getSeconds().toString().padStart(2, '0')
  return `${hari}, ${tgl} ${bln} ${thn} pukul ${jam}.${menit}.${detik} WIB`
}

interface ExamOption {
  id: string
  title: string
}

export default function LoginPage() {
  const { setCurrentUser, setCurrentView } = useAppStore()
  const [portal, setPortal] = useState<LoginPortal>('siswa')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [now, setNow] = useState(new Date())

  // Form fields
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [selectedExam, setSelectedExam] = useState('')
  const [exams, setExams] = useState<ExamOption[]>([])

  // Clock
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Fetch active exams for Siswa portal
  useEffect(() => {
    if (portal === 'siswa') {
      fetch('/api/exams')
        .then(res => res.json())
        .then(data => {
          const activeExams = (data || []).filter((e: ExamOption & { isActive: boolean }) => e.isActive)
          setExams(activeExams)
        })
        .catch(() => setExams([]))
    }
  }, [portal])

  // Seed demo data on mount
  useEffect(() => {
    fetch('/api/auth/seed', { method: 'POST' }).catch(() => {})
  }, [])

  const portalConfig = {
    siswa: {
      label: 'Portal Siswa',
      icon: GraduationCap,
      usernameLabel: 'USERNAME SISWA :',
      usernamePlaceholder: 'Masukkan username Anda...',
      passwordLabel: 'PASSWORD :',
      passwordPlaceholder: 'Masukkan password Anda...',
      showExamSelect: true,
      infoTitle: 'INFO untuk SISWA :',
      infoText: 'Daftar siswa diketahui sepenuhnya di Menu Admin Kelola Siswa. Gunakan Username : NISN dan Password : siswa untuk login yang bersamaan, silahkan komunikasi pada guru pembina.',
      buttonText: 'MULAI KERJAKAN UJIAN',
      buttonIcon: Play,
    },
    guru: {
      label: 'Portal Guru',
      icon: BookOpen,
      usernameLabel: 'USERNAME GURU :',
      usernamePlaceholder: 'Masukkan username guru...',
      passwordLabel: 'PASSWORD :',
      passwordPlaceholder: 'Masukkan password guru...',
      showExamSelect: false,
      infoTitle: 'INFO untuk GURU :',
      infoText: 'Akun guru dikelola oleh Administrator. Gunakan kredensial yang telah diberikan untuk mengakses dashboard pengawasan dan konfigurasi ujian.',
      buttonText: 'MASUK PORTAL GURU',
      buttonIcon: Monitor,
    },
    admin: {
      label: 'Admin',
      icon: ShieldCheck,
      usernameLabel: 'USERNAME ADMIN :',
      usernamePlaceholder: 'Masukkan username admin...',
      passwordLabel: 'PASSWORD :',
      passwordPlaceholder: 'Masukkan password admin...',
      showExamSelect: false,
      infoTitle: 'INFO untuk ADMIN :',
      infoText: 'Panel administrator digunakan untuk mengelola paket ujian, soal, akun guru, akun siswa, dan melihat hasil evaluasi. Default: admin / admin',
      buttonText: 'MASUK ADMIN PANEL',
      buttonIcon: ShieldCheck,
    },
  }

  const currentConfig = portalConfig[portal]

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username || !password) {
      toast.error('Harap isi username dan password')
      return
    }
    if (portal === 'siswa' && !selectedExam) {
      toast.error('Harap pilih ujian terlebih dahulu')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Login gagal')
        return
      }
      const user = data.user

      // Validate role matches portal
      if (portal === 'admin' && user.role !== 'ADMIN') {
        toast.error('Akun ini bukan administrator')
        return
      }
      if (portal === 'guru' && user.role !== 'GURU') {
        toast.error('Akun ini bukan guru')
        return
      }
      if (portal === 'siswa' && user.role !== 'SISWA') {
        toast.error('Akun ini bukan siswa')
        return
      }

      localStorage.setItem('cbt_user', JSON.stringify(user))
      setCurrentUser(user)

      if (user.role === 'ADMIN' || user.role === 'GURU') {
        setCurrentView('admin')
      } else {
        setCurrentView('student')
      }
      toast.success(`Selamat datang, ${user.name}!`)
    } catch {
      toast.error('Terjadi kesalahan koneksi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F7FA] relative overflow-hidden">
      {/* Background decorative circles */}
      <div className="bg-circle-1" />
      <div className="bg-circle-2" />
      <div className="bg-circle-3" />

      {/* Top Header Bar */}
      <header className="bg-[#E6F0FF] border-b border-blue-100 shadow-sm relative z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-md">
              <Monitor className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#1A3A5F] leading-tight">SIMULASI-Online</h1>
              <p className="text-[9px] text-gray-500 font-medium tracking-wider uppercase">COMPUTER BASED TEST</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock className="h-4 w-4 text-blue-500" />
            <span className="font-medium hidden sm:inline">{formatTanggal(now)}</span>
          </div>
        </div>
      </header>

      {/* Main Login Card */}
      <main className="flex-1 flex items-center justify-center p-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="w-full max-w-[440px] bg-white rounded-xl shadow-lg shadow-black/5 overflow-hidden"
        >
          {/* Card Header - Logo & Branding */}
          <div className="text-center pt-8 pb-4 px-6">
            {/* Logo Circle */}
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 shadow-lg shadow-blue-200 mb-4">
              <Monitor className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-xl font-bold text-[#1A3A5F]">SIMULASI-Online</h2>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              Masuk ke portal evaluasi dengan platform modern, responsif, dan berbasis Bento Grid.
            </p>
          </div>

          {/* Portal Tabs */}
          <div className="px-6 mb-4">
            <div className="flex bg-gray-50 rounded-full p-1 gap-1">
              {(['siswa', 'guru', 'admin'] as LoginPortal[]).map((p) => {
                const cfg = portalConfig[p]
                const Icon = cfg.icon
                const isActive = portal === p
                return (
                  <button
                    key={p}
                    onClick={() => {
                      setPortal(p)
                      setUsername('')
                      setPassword('')
                      setSelectedExam('')
                    }}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-full text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-[#2196F3] text-white shadow-md shadow-blue-200'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {cfg.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="px-6 pb-2 space-y-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={portal}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="space-y-3"
              >
                {/* Username Field */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-[#1A3A5F]">
                    <User className="h-3.5 w-3.5 text-blue-500" />
                    {currentConfig.usernameLabel}
                  </label>
                  <Input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={currentConfig.usernamePlaceholder}
                    className="h-11 rounded-lg border-gray-200 focus:border-blue-400 focus:ring-blue-100 text-sm"
                  />
                </div>

                {/* Password Field */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-[#1A3A5F]">
                    <Lock className="h-3.5 w-3.5 text-blue-500" />
                    {currentConfig.passwordLabel}
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={currentConfig.passwordPlaceholder}
                      className="h-11 rounded-lg border-gray-200 focus:border-blue-400 focus:ring-blue-100 text-sm pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Exam Select (Siswa only) */}
                {currentConfig.showExamSelect && (
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-[#1A3A5F]">
                      <BookOpen className="h-3.5 w-3.5 text-blue-500" />
                      PILIH UJIAN AKTIF :
                    </label>
                    <Select value={selectedExam} onValueChange={setSelectedExam}>
                      <SelectTrigger className="h-11 rounded-lg border-gray-200 focus:border-blue-400 focus:ring-blue-100 text-sm">
                        <SelectValue placeholder="-- Silakan Pilih Ujian --" />
                      </SelectTrigger>
                      <SelectContent>
                        {exams.length > 0 ? (
                          exams.map((exam) => (
                            <SelectItem key={exam.id} value={exam.id}>
                              {exam.title}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="none" disabled>Tidak ada ujian aktif</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Info Box */}
            <div className="bg-blue-50 border-l-4 border-blue-400 rounded-lg p-3 flex gap-2">
              <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-[#1A3A5F]">{currentConfig.infoTitle}</p>
                <p className="text-[11px] text-gray-600 leading-relaxed mt-0.5">{currentConfig.infoText}</p>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-[#2196F3] hover:bg-[#1E88E5] text-white font-semibold rounded-lg shadow-md shadow-blue-200 transition-all gap-2 text-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <currentConfig.icon className="h-4 w-4" />
                  {currentConfig.buttonText}
                </>
              )}
            </Button>
          </form>

          {/* Footer Note */}
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 text-center">
            <p className="text-[10px] text-gray-400">
              SIMULASI-Online &copy; {new Date().getFullYear()} &mdash; Sistem Manajemen Ujian Digital
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
