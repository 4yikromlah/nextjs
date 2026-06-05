'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, BarChart3, Clock, Play, Check, X, BookOpen, ChevronRight, Eye, AlertCircle } from 'lucide-react'
import { useAppStore, ExamData, ExamSessionData } from '@/lib/store'
import { toast } from 'sonner'

export default function StudentDashboard() {
  const { user, studentTab, setStudentTab, setCurrentView, setActiveSession } = useAppStore()
  const [exams, setExams] = useState<ExamData[]>([])
  const [sessions, setSessions] = useState<ExamSessionData[]>([])
  const [showResultDetail, setShowResultDetail] = useState<Record<string, unknown> | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const refresh = () => setRefreshKey(k => k + 1)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [examsRes, sessionsRes] = await Promise.all([
          fetch('/api/exams'),
          user ? fetch(`/api/sessions?userId=${user.id}`) : Promise.resolve(null)
        ])
        const examsData = await examsRes.json()
        setExams(examsData.filter((e: ExamData) => e.isActive))
        if (sessionsRes) {
          const sessionsData = await sessionsRes.json()
          setSessions(sessionsData)
        }
      } catch { /* silent */ }
    }
    loadData()
  }, [user, refreshKey])

  const handleStartExam = async (exam: ExamData) => {
    if (!user) return
    // Check if already has completed session
    const completed = sessions.find(s => s.examId === exam.id && s.status === 'COMPLETED')
    if (completed) {
      toast.error('Anda sudah menyelesaikan ujian ini')
      return
    }
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, examId: exam.id })
      })
      const data = await res.json()
      if (res.ok) {
        setActiveSession(data)
        setCurrentView('exam')
      } else {
        toast.error(data.error)
      }
    } catch {
      toast.error('Gagal memulai ujian')
    }
  }

  const handleViewResult = async (sessionId: string) => {
    try {
      const res = await fetch(`/api/sessions/${sessionId}`)
      const data = await res.json()
      setShowResultDetail(data)
    } catch { toast.error('Gagal memuat hasil') }
  }

  const hasCompletedExam = (examId: string) => {
    return sessions.some(s => s.examId === examId && s.status === 'COMPLETED')
  }

  const hasActiveSession = (examId: string) => {
    return sessions.find(s => s.examId === examId && s.status === 'IN_PROGRESS')
  }

  const tabs = [
    { id: 'exams', label: 'Ujian Tersedia', icon: FileText },
    { id: 'results', label: 'Hasil Ujian', icon: BarChart3 },
  ]

  return (
    <div className="flex-1 p-4 md:p-6 max-w-5xl mx-auto w-full">
      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setStudentTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              studentTab === tab.id
                ? 'bg-gradient-primary text-white shadow-lg shadow-indigo-500/25'
                : 'neu-btn text-muted-foreground hover:text-foreground'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {studentTab === 'exams' && (
          <motion.div key="exams" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {exams.map((exam, i) => {
                const completed = hasCompletedExam(exam.id)
                const active = hasActiveSession(exam.id)
                return (
                  <motion.div
                    key={exam.id}
                    className="clay-glass p-5 flex flex-col"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: i * 0.1 }}
                    whileHover={{ y: -4 }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center">
                        <FileText className="w-6 h-6 text-white" />
                      </div>
                      {completed && (
                        <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">
                          SELESAI
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-lg mb-1">{exam.title}</h3>
                    {exam.description && <p className="text-sm text-muted-foreground mb-3">{exam.description}</p>}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {exam.duration} menit</span>
                      <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {exam._count?.questions || 0} soal</span>
                    </div>
                    <div className="mt-auto">
                      {completed ? (
                        <button disabled className="w-full py-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 font-semibold text-sm flex items-center justify-center gap-2 cursor-not-allowed">
                          <Check className="w-4 h-4" /> Sudah Dikerjakan
                        </button>
                      ) : active ? (
                        <button
                          onClick={() => { setActiveSession(active as ExamSessionData); setCurrentView('exam') }}
                          className="clay-btn w-full py-2.5 bg-gradient-warning text-white font-semibold text-sm flex items-center justify-center gap-2"
                        >
                          <Play className="w-4 h-4" /> Lanjutkan Ujian
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStartExam(exam)}
                          className="clay-btn w-full py-2.5 bg-gradient-primary text-white font-semibold text-sm flex items-center justify-center gap-2"
                        >
                          <Play className="w-4 h-4" /> Mulai Ujian
                        </button>
                      )}
                    </div>
                  </motion.div>
                )
              })}
              {exams.length === 0 && (
                <div className="col-span-full flex flex-col items-center py-16 text-muted-foreground">
                  <FileText className="w-16 h-16 mb-4 opacity-20" />
                  <p>Belum ada ujian tersedia</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {studentTab === 'results' && (
          <motion.div key="results" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div className="space-y-4">
              {sessions.filter(s => s.status === 'COMPLETED').map((session, i) => {
                const examData = session.exam as unknown as Record<string, unknown> | undefined
                return (
                  <motion.div
                    key={session.id}
                    className="clay-glass p-5 flex items-center justify-between"
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${(session.score || 0) >= 70 ? 'bg-gradient-success' : (session.score || 0) >= 50 ? 'bg-gradient-warning' : 'bg-gradient-danger'}`}>
                        <span className="text-white font-bold text-lg">{Math.round(session.score || 0)}</span>
                      </div>
                      <div>
                        <h4 className="font-bold">{examData?.title as string || 'Ujian'}</h4>
                        <p className="text-sm text-muted-foreground">
                          {session.endTime ? new Date(session.endTime).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleViewResult(session.id)}
                      className="clay-btn px-4 py-2 text-sm flex items-center gap-1 text-indigo-500"
                    >
                      <Eye className="w-4 h-4" /> Detail
                    </button>
                  </motion.div>
                )
              })}
              {sessions.filter(s => s.status === 'COMPLETED').length === 0 && (
                <div className="flex flex-col items-center py-16 text-muted-foreground">
                  <BarChart3 className="w-16 h-16 mb-4 opacity-20" />
                  <p>Belum ada hasil ujian</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal: Result Detail */}
      <AnimatePresence>
        {showResultDetail && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowResultDetail(null)}>
            <motion.div className="clay-glass p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto custom-scrollbar" initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">Detail Hasil Ujian</h3>
                <button onClick={() => setShowResultDetail(null)} className="p-1 rounded-lg hover:bg-muted">
                  <X className="w-5 h-5" />
                </button>
              </div>
              {(() => {
                const detail = showResultDetail as Record<string, unknown>
                const answers = detail.answers as Array<Record<string, unknown>> | undefined
                const examData = detail.exam as Record<string, unknown> | undefined
                const questions = examData?.questions as Array<Record<string, unknown>> | undefined
                const score = detail.score as number
                const correctCount = answers?.filter(a => a.isCorrect === true).length || 0
                const totalCount = questions?.length || 0
                return (
                  <div className="space-y-4">
                    {/* Score Header */}
                    <div className="neo-glass p-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Skor Akhir</p>
                        <p className={`text-3xl font-bold ${score >= 70 ? 'text-emerald-500' : score >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
                          {score}%
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Jawaban Benar</p>
                        <p className="text-xl font-bold">{correctCount} / {totalCount}</p>
                      </div>
                    </div>

                    {/* Questions Review */}
                    {questions?.map((q, i) => {
                      const answer = answers?.find(a => a.questionId === q.id)
                      const isCorrect = answer?.isCorrect as boolean
                      const selected = answer?.selectedAnswer as string | null
                      const correct = q.correctAnswer as string
                      return (
                        <motion.div
                          key={q.id as string}
                          className={`neo-glass p-4 border-l-4 ${isCorrect ? 'border-l-emerald-500' : 'border-l-red-500'}`}
                          initial={{ y: 10, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: i * 0.05 }}
                        >
                          <div className="flex items-start gap-2 mb-3">
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${isCorrect ? 'bg-emerald-500' : 'bg-red-500'}`}>
                              {isCorrect ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                            </span>
                            <p className="font-medium"><span className="text-indigo-500">{i + 1}.</span> {q.questionText as string}</p>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-sm ml-8">
                            {['A', 'B', 'C', 'D', 'E'].map(l => {
                              const optKey = `option${l}` as string
                              const optVal = q[optKey] as string
                              if (!optVal) return null
                              const isSelected = selected === l
                              const isCorrectOption = correct === l
                              return (
                                <div
                                  key={l}
                                  className={`px-3 py-2 rounded-xl flex items-center gap-2 ${
                                    isCorrectOption ? 'bg-emerald-500/10 text-emerald-600 font-semibold ring-1 ring-emerald-500/30' :
                                    isSelected && !isCorrect ? 'bg-red-500/10 text-red-600 ring-1 ring-red-500/30' :
                                    'text-muted-foreground'
                                  }`}
                                >
                                  <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs shrink-0 ${
                                    isCorrectOption ? 'border-emerald-500 bg-emerald-500 text-white' :
                                    isSelected && !isCorrect ? 'border-red-500 bg-red-500 text-white' :
                                    'border-muted-foreground/30'
                                  }`}>
                                    {l}
                                  </span>
                                  <span className="truncate">{optVal}</span>
                                  {isCorrectOption && <Check className="w-4 h-4 ml-auto shrink-0" />}
                                  {isSelected && !isCorrect && <X className="w-4 h-4 ml-auto shrink-0" />}
                                </div>
                              )
                            })}
                          </div>
                          {!isCorrect && (
                            <div className="mt-3 ml-8">
                              <div className="bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
                                <p className="font-semibold text-amber-600 text-sm mb-1 flex items-center gap-1">
                                  <AlertCircle className="w-4 h-4" /> Pembahasan:
                                </p>
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{(q.explanation as string) || 'Tidak ada pembahasan'}</p>
                              </div>
                            </div>
                          )}
                        </motion.div>
                      )
                    })}
                  </div>
                )
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
