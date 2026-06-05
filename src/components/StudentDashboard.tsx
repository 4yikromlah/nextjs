'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Play, Trophy, Clock, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'

interface Exam {
  id: string
  title: string
  description: string | null
  duration: number
  isActive: boolean
  createdBy: string
  createdAt: string
  _count?: { questions: number; sessions: number }
}

interface Session {
  id: string
  userId: string
  examId: string
  startTime: string
  endTime: string | null
  status: string
  score: number | null
  exam: { title: string; duration: number }
  _count?: { answers: number }
}

export default function StudentDashboard() {
  const { currentUser, setCurrentView, setActiveExamId, setActiveSessionId } = useAppStore()
  const [activeTab, setActiveTab] = useState('ujian')
  const [exams, setExams] = useState<Exam[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState<string | null>(null)

  const fetchExams = useCallback(async () => {
    try {
      const res = await fetch('/api/exams')
      if (res.ok) setExams(await res.json())
    } catch { /* ignore */ }
  }, [])

  const fetchSessions = useCallback(async () => {
    if (!currentUser) return
    try {
      const res = await fetch(`/api/sessions?userId=${currentUser.id}`)
      if (res.ok) setSessions(await res.json())
    } catch { /* ignore */ }
  }, [currentUser])

  useEffect(() => {
    setLoading(true)
    Promise.all([fetchExams(), fetchSessions()]).finally(() => setLoading(false))
  }, [fetchExams, fetchSessions])

  const handleStartExam = async (exam: Exam) => {
    if (!currentUser) return
    setStarting(exam.id)
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, examId: exam.id }),
      })
      const data = await res.json()
      if (res.ok) {
        setActiveExamId(exam.id)
        setActiveSessionId(data.id)
        setCurrentView('exam')
        toast.success('Ujian dimulai! Semangat!')
      } else {
        toast.error(data.error || 'Gagal memulai ujian')
      }
    } catch {
      toast.error('Terjadi kesalahan koneksi')
    } finally {
      setStarting(null)
    }
  }

  const activeExams = exams.filter((e) => e.isActive)
  const completedSessions = sessions.filter((s) => s.status === 'COMPLETED')
  const inProgressSessions = sessions.filter((s) => s.status === 'IN_PROGRESS')

  return (
    <div className="min-h-screen bg-[#f0f4f8]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Welcome */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="glass-card p-6">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-200">
                <BookOpen className="h-7 w-7 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">Halo, {currentUser?.name}!</h2>
                <p className="text-sm text-gray-500">Selamat datang di SIMULASI-Online. Siap mengerjakan ujian?</p>
              </div>
            </div>
          </div>
        </motion.div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white/80 backdrop-blur-sm shadow-sm rounded-xl h-auto p-1.5 gap-1">
            <TabsTrigger value="ujian" className="rounded-lg px-4 py-2 text-sm data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md">
              <Play className="h-4 w-4 mr-2" />
              Ujian Tersedia
            </TabsTrigger>
            <TabsTrigger value="hasil" className="rounded-lg px-4 py-2 text-sm data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md">
              <Trophy className="h-4 w-4 mr-2" />
              Hasil Ujian
            </TabsTrigger>
          </TabsList>

          {/* Available Exams */}
          <TabsContent value="ujian" className="mt-4 space-y-4">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
              </div>
            ) : activeExams.length === 0 ? (
              <div className="glass-card p-12 text-center">
                <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="font-medium text-gray-500">Belum ada ujian tersedia</p>
                <p className="text-xs text-gray-400">Ujian akan muncul ketika admin mengaktifkannya</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeExams.map((exam) => {
                  const completedSession = sessions.find(
                    (s) => s.examId === exam.id && s.status === 'COMPLETED'
                  )
                  const inProgress = inProgressSessions.find(
                    (s) => s.examId === exam.id
                  )

                  return (
                    <motion.div key={exam.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                      <Card className="clay border-0 overflow-hidden">
                        <CardContent className="p-5">
                          <div className="flex items-start justify-between mb-3">
                            <h3 className="font-bold text-gray-800 text-sm">{exam.title}</h3>
                            {completedSession ? (
                              <Badge className="bg-green-100 text-green-700 text-xs">Selesai</Badge>
                            ) : inProgress ? (
                              <Badge className="bg-amber-100 text-amber-700 text-xs">Sedang Dikerjakan</Badge>
                            ) : (
                              <Badge className="bg-blue-100 text-blue-700 text-xs">Tersedia</Badge>
                            )}
                          </div>
                          {exam.description && (
                            <p className="text-xs text-gray-500 mb-3">{exam.description}</p>
                          )}
                          <div className="flex items-center gap-3 text-xs text-gray-500 mb-4">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" /> {exam.duration} menit
                            </span>
                            <span>{exam._count?.questions ?? 0} soal</span>
                          </div>
                          {completedSession ? (
                            <div className="flex items-center gap-2 text-sm">
                              <span className="font-medium text-gray-600">Nilai:</span>
                              <span className={`font-bold text-lg ${
                                completedSession.score !== null && completedSession.score >= 70 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {completedSession.score ?? '-'}
                              </span>
                            </div>
                          ) : (
                            <Button
                              onClick={() => inProgress ? (
                                (() => {
                                  setActiveExamId(exam.id)
                                  setActiveSessionId(inProgress.id)
                                  setCurrentView('exam')
                                })()
                              ) : handleStartExam(exam)}
                              disabled={starting === exam.id}
                              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md"
                            >
                              {starting === exam.id ? (
                                <span className="flex items-center gap-2">
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  Memulai...
                                </span>
                              ) : inProgress ? (
                                'Lanjutkan Ujian'
                              ) : (
                                <>
                                  <Play className="h-4 w-4 mr-2" />
                                  Mulai Ujian
                                </>
                              )}
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </TabsContent>

          {/* Results */}
          <TabsContent value="hasil" className="mt-4 space-y-4">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
              </div>
            ) : completedSessions.length === 0 ? (
              <div className="glass-card p-12 text-center">
                <Trophy className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="font-medium text-gray-500">Belum ada hasil ujian</p>
                <p className="text-xs text-gray-400">Hasil ujian akan muncul setelah Anda menyelesaikan ujian</p>
              </div>
            ) : (
              <div className="space-y-3">
                {completedSessions.map((session) => (
                  <motion.div key={session.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                    <div className="clay p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-gray-800 text-sm">{session.exam.title}</h4>
                          <p className="text-xs text-gray-500 mt-1">
                            Dikerjakan pada {new Date(session.startTime).toLocaleDateString('id-ID', {
                              day: 'numeric', month: 'long', year: 'numeric',
                            })}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-xs text-gray-500">Nilai</p>
                            <p className={`text-2xl font-bold ${
                              session.score !== null && session.score >= 70 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {session.score ?? '-'}
                            </p>
                          </div>
                          {session.score !== null && session.score >= 70 ? (
                            <CheckCircle2 className="h-8 w-8 text-green-500" />
                          ) : (
                            <XCircle className="h-8 w-8 text-red-400" />
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
