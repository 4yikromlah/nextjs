'use client'

import { useEffect, useState } from 'react'
import { Clock, LogOut, CheckCircle, GraduationCap } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { motion } from 'framer-motion'

const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

export default function Header() {
  const { user, setUser, setCurrentView } = useAppStore()
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

  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="glass-strong px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          {/* Logo */}
          <motion.div 
            className="flex items-center gap-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center animate-float">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
                CBT-Online
              </h1>
              <p className="text-[10px] text-muted-foreground tracking-wider">SISTEM MANAJEMEN UJIAN</p>
            </div>
          </motion.div>

          {/* DateTime */}
          <motion.div 
            className="hidden md:flex items-center gap-2 neu-flat px-4 py-2"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Clock className="w-4 h-4 text-indigo-500" />
            <span className="text-sm font-medium text-foreground">{formatTime()}</span>
          </motion.div>

          {/* User */}
          {user && (
            <motion.div 
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="flex items-center gap-2 neu-flat px-3 py-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <div className="text-right">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Active User</p>
                  <p className="text-sm font-semibold">{user.name}</p>
                </div>
                <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-white bg-gradient-primary">
                  {user.role}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="neu-btn p-2 hover:text-red-500 transition-colors"
                title="Keluar"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </div>
      </div>
      <div className="header-line" />
    </header>
  )
}
