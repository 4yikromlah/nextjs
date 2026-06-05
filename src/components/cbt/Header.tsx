'use client'

import { useEffect, useState } from 'react'
import { Clock, LogOut, CheckCircle, GraduationCap, Shield, BookOpen } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { motion } from 'framer-motion'

const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

export default function Header() {
  const { user, setUser, setCurrentView, currentView } = useAppStore()
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const formatTime = () => {
    const h = now.getHours().toString().padStart(2, '0')
    const m = now.getMinutes().toString().padStart(2, '0')
    const s = now.getSeconds().toString().padStart(2, '0')
    return `${HARI[now.getDay()]}, ${now.getDate()} ${BULAN[now.getMonth()]} ${now.getFullYear()} pukul ${h}.${m}.${s} WIB`
  }

  const handleLogout = () => {
    setUser(null)
    setCurrentView('login')
    localStorage.removeItem('cbt_user')
  }

  if (currentView === 'login' || !user) return null

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Main header bar */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-white/30 shadow-lg shadow-black/5">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 max-w-[1400px] mx-auto">
          {/* Logo */}
          <motion.div 
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent leading-tight">
                CBT-Online
              </h1>
              <p className="text-[9px] text-gray-400 tracking-[0.2em] font-semibold uppercase">Sistem Manajemen Ujian</p>
            </div>
          </motion.div>

          {/* DateTime - centered */}
          <motion.div 
            className="hidden md:flex items-center gap-2 bg-gray-50/80 backdrop-blur-sm rounded-xl px-4 py-2 border border-gray-200/50 shadow-sm"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Clock className="w-4 h-4 text-indigo-500" />
            <span className="text-sm font-medium text-gray-600">{formatTime()}</span>
          </motion.div>

          {/* User Info */}
          <motion.div 
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="flex items-center gap-2 bg-gray-50/80 backdrop-blur-sm rounded-xl px-3 py-2 border border-gray-200/50 shadow-sm">
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <div className="text-right">
                  <p className="text-[9px] text-gray-400 uppercase tracking-wider font-semibold">Active User</p>
                  <p className="text-sm font-bold text-gray-700 leading-tight">{user.name}</p>
                </div>
              </div>
              <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-white shadow-sm ${
                user.role === 'ADMIN' 
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-500' 
                  : 'bg-gradient-to-r from-emerald-400 to-teal-500'
              }`}>
                {user.role === 'ADMIN' ? (
                  <span className="flex items-center gap-0.5"><Shield className="w-2.5 h-2.5" /> Admin</span>
                ) : (
                  <span className="flex items-center gap-0.5"><BookOpen className="w-2.5 h-2.5" /> Siswa</span>
                )}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="w-9 h-9 rounded-xl bg-red-50/80 backdrop-blur-sm border border-red-200/50 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-100/80 transition-all shadow-sm hover:shadow-md"
              title="Keluar"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </motion.div>
        </div>
      </div>
      {/* Gradient animated line */}
      <div className="header-line" />
    </header>
  )
}
