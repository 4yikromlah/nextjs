'use client'

import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useAppStore, type View } from '@/lib/store'
import Header from '@/components/Header'
import LoginPage from '@/components/LoginPage'
import AdminDashboard from '@/components/AdminDashboard'
import StudentDashboard from '@/components/StudentDashboard'
import ExamTaking from '@/components/ExamTaking'

export default function Home() {
  const { currentView, setCurrentView, currentUser, setCurrentUser } = useAppStore()

  // Restore session from localStorage
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('cbt_user')
      if (savedUser) {
        const user = JSON.parse(savedUser)
        setCurrentUser(user)
        if (user.role === 'ADMIN' || user.role === 'GURU') {
          setCurrentView('admin')
        } else {
          setCurrentView('student')
        }
      }
    } catch {
      // ignore
    }
  }, [setCurrentUser, setCurrentView])

  const renderView = () => {
    switch (currentView) {
      case 'login':
        return <LoginPage />
      case 'admin':
        return currentUser ? <AdminDashboard /> : <LoginPage />
      case 'student':
        return currentUser ? <StudentDashboard /> : <LoginPage />
      case 'exam':
        return currentUser ? <ExamTaking /> : <LoginPage />
      default:
        return <LoginPage />
    }
  }

  const showHeader = currentView !== 'login'

  return (
    <div className="min-h-screen flex flex-col bg-[#e8ecf1]">
      {/* Background decorative circles */}
      <div className="bg-circle-1" />
      <div className="bg-circle-2" />
      <div className="bg-circle-3" />

      {showHeader && <Header />}

      <main className="flex-1 relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Sticky Footer */}
      {showHeader && (
        <footer className="mt-auto py-3 px-4 text-center">
          <div className="inline-flex items-center gap-2 text-xs text-gray-400 font-medium bg-white/40 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            SIMULASI-Online &copy; {new Date().getFullYear()} &mdash; Sistem Manajemen Ujian Digital
          </div>
        </footer>
      )}
    </div>
  )
}
