'use client'

import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import Header from '@/components/cbt/Header'
import LoginPage from '@/components/cbt/LoginPage'
import AdminDashboard from '@/components/cbt/AdminDashboard'
import StudentDashboard from '@/components/cbt/StudentDashboard'
import ExamTaking from '@/components/cbt/ExamTaking'

export default function Home() {
  const { user, setUser, currentView, setCurrentView } = useAppStore()

  useEffect(() => {
    // Seed admin on mount
    fetch('/api/auth/seed', { method: 'POST' }).catch(() => {})
    
    // Restore session from localStorage
    const stored = localStorage.getItem('cbt_user')
    if (stored) {
      try {
        const userData = JSON.parse(stored)
        setUser(userData)
        setCurrentView(userData.role === 'ADMIN' ? 'admin' : 'student')
      } catch {
        localStorage.removeItem('cbt_user')
      }
    }
  }, [setUser, setCurrentView])

  return (
    <div className="min-h-screen flex flex-col relative bg-background">
      {/* Background decorative circles */}
      <div className="bg-circle-1" />
      <div className="bg-circle-2" />
      <div className="bg-circle-3" />

      {currentView !== 'login' && user && <Header />}

      <main className="flex-1 relative">
        <AnimatePresence mode="wait">
          {currentView === 'login' && (
            <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <LoginPage />
            </motion.div>
          )}
          {currentView === 'admin' && user && (
            <motion.div key="admin" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <AdminDashboard />
            </motion.div>
          )}
          {currentView === 'student' && user && (
            <motion.div key="student" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <StudentDashboard />
            </motion.div>
          )}
          {currentView === 'exam' && user && (
            <motion.div key="exam" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <ExamTaking />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Sticky Footer */}
      {currentView !== 'login' && (
        <footer className="mt-auto py-3 px-4 text-center">
          <div className="glass-strong py-2 px-4 rounded-xl inline-flex items-center gap-2 text-xs text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-gradient-success animate-pulse" />
            CBT-Online &copy; {new Date().getFullYear()} &mdash; Sistem Manajemen Ujian Digital
          </div>
        </footer>
      )}
    </div>
  )
}
