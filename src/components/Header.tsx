'use client'

import { useEffect, useState } from 'react'
import { Clock, LogOut, Monitor } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { motion } from 'framer-motion'

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

export default function Header() {
  const [now, setNow] = useState(new Date())
  const { currentUser, setCurrentUser, setCurrentView } = useAppStore()

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('cbt_user')
    setCurrentUser(null)
    setCurrentView('login')
  }

  return (
    <header className="sticky top-0 z-50">
      <div className="bg-white/80 backdrop-blur-md shadow-sm px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Left - Logo & Title */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-200">
              <Monitor className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-blue-700 leading-tight tracking-tight">
                SIMULASI-Online
              </h1>
              <p className="text-[10px] text-gray-400 font-medium tracking-wider uppercase">
                SIMULASI BAHASA TEST
              </p>
            </div>
          </div>

          {/* Center - Clock */}
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="hidden md:flex items-center gap-2 text-sm text-gray-600"
          >
            <Clock className="h-4 w-4 text-blue-500" />
            <span className="font-medium">{formatTanggal(now)}</span>
          </motion.div>

          {/* Right - User Info & Logout */}
          {currentUser && (
            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right hidden sm:block">
                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Active User</p>
                <p className="text-sm font-semibold text-green-600">{currentUser.name}</p>
              </div>
              <button
                onClick={handleLogout}
                className="h-9 w-9 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-200 transition-all hover:scale-105 active:scale-95"
                title="Keluar"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
      {/* Animated gradient line */}
      <div className="header-line" />
    </header>
  )
}
