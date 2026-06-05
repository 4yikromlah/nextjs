'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, BarChart3, Clock, Play, Check, X, BookOpen, Eye, AlertCircle } from 'lucide-react'
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
        if (sessionsRes) { const d = await sessionsRes.json(); setSessions(d) }
      } catch { /* */ }
    }
    loadData()
  }, [user, refreshKey])

  const handleStartExam = async (exam: ExamData) => {
    if (!user) return
    const completed = sessions.find(s => s.examId === exam.id && s.status === 'COMPLETED')
    if (completed) { toast.error('Anda sudah menyelesaikan ujian ini'); return }
    try {
      const res = await fetch('/api/sessions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id, examId: exam.id }) })
      const data = await res.json()
      if (res.ok) { setActiveSession(data); setCurrentView('exam') } else toast.error(data.error)
    } catch { toast.error('Gagal memulai ujian') }
  }

  const handleViewResult = async (sessionId: string) => {
    try { const res = await fetch(`/api/sessions/${sessionId}`); setShowResultDetail(await res.json()) } catch { toast.error('Gagal') }
  }

  const hasCompletedExam = (examId: string) => sessions.some(s => s.examId === examId && s.status === 'COMPLETED')
  const hasActiveSession = (examId: string) => sessions.find(s => s.examId === examId && s.status === 'IN_PROGRESS')

  const tabs = [
    { id: 'exams', label: 'Ujian Tersedia', icon: FileText },
    { id: 'results', label: 'Hasil Ujian', icon: BarChart3 },
  ]

  return (
    <div className="flex-1 p-4 md:p-6 max-w-5xl mx-auto w-full">
      <div className="flex gap-2 mb-6">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setStudentTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
              studentTab === tab.id
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25'
                : 'bg-white/60 backdrop-blur-sm border border-gray-200/50 text-gray-500 hover:text-gray-700 shadow-sm'
            }`}
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {studentTab === 'exams' && (
          <motion.div key="exams" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {exams.map((exam, i) => {
                const completed = hasCompletedExam(exam.id)
                const active = hasActiveSession(exam.id)
                return (
                  <motion.div key={exam.id}
                    className="bg-white/70 backdrop-blur-sm rounded-2xl border border-white/50 shadow-lg p-5 flex flex-col hover:shadow-xl transition-shadow"
                    initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: i * 0.1 }}
                    whileHover={{ y: -4 }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <FileText className="w-6 h-6 text-white" />
                      </div>
                      {completed && <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-500 border border-emerald-200">SELESAI</span>}
                    </div>
                    <h3 className="font-extrabold text-gray-700 mb-1">{exam.title}</h3>
                    {exam.description && <p className="text-sm text-gray-400 mb-3">{exam.description}</p>}
                    <div className="flex items-center gap-3 text-xs text-gray-400 mb-4 font-medium">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {exam.duration} menit</span>
                      <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {exam._count?.questions || 0} soal</span>
                    </div>
                    <div className="mt-auto">
                      {completed ? (
                        <button disabled className="w-full py-2.5 rounded-xl bg-emerald-50 text-emerald-500 font-bold text-sm flex items-center justify-center gap-2 cursor-not-allowed border border-emerald-200"><Check className="w-4 h-4" /> Sudah Dikerjakan</button>
                      ) : active ? (
                        <button onClick={() => { setActiveSession(active as ExamSessionData); setCurrentView('exam') }}
                          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20">
                          <Play className="w-4 h-4" /> Lanjutkan Ujian
                        </button>
                      ) : (
                        <button onClick={() => handleStartExam(exam)}
                          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25">
                          <Play className="w-4 h-4" /> Mulai Ujian
                        </button>
                      )}
                    </div>
                  </motion.div>
                )
              })}
              {exams.length === 0 && (
                <div className="col-span-full flex flex-col items-center py-16 text-gray-300"><FileText className="w-16 h-16 mb-4" /><p className="font-medium">Belum ada ujian tersedia</p></div>
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
                  <motion.div key={session.id}
                    className="bg-white/70 backdrop-blur-sm rounded-2xl border border-white/50 shadow-lg p-5 flex items-center justify-between"
                    initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.05 }}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center shadow-lg ${
                        (session.score || 0) >= 70 ? 'bg-gradient-to-br from-emerald-400 to-teal-500 shadow-emerald-500/20' :
                        (session.score || 0) >= 50 ? 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-amber-500/20' :
                        'bg-gradient-to-br from-rose-400 to-pink-500 shadow-rose-500/20'
                      }`}>
                        <span className="text-white font-extrabold text-lg">{Math.round(session.score || 0)}</span>
                      </div>
                      <div>
                        <h4 className="font-extrabold text-gray-700">{examData?.title as string || 'Ujian'}</h4>
                        <p className="text-sm text-gray-400">{session.endTime ? new Date(session.endTime).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}</p>
                      </div>
                    </div>
                    <button onClick={() => handleViewResult(session.id)} className="px-4 py-2 rounded-xl bg-indigo-50 text-indigo-500 font-bold text-sm flex items-center gap-1 hover:bg-indigo-100 transition-colors border border-indigo-100">
                      <Eye className="w-4 h-4" /> Detail
                    </button>
                  </motion.div>
                )
              })}
              {sessions.filter(s => s.status === 'COMPLETED').length === 0 && (
                <div className="flex flex-col items-center py-16 text-gray-300"><BarChart3 className="w-16 h-16 mb-4" /><p className="font-medium">Belum ada hasil ujian</p></div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result Detail Modal */}
      <AnimatePresence>
        {showResultDetail && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowResultDetail(null)}>
            <motion.div className="bg-white/90 backdrop-blur-xl rounded-2xl p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto custom-scrollbar shadow-2xl border border-white/50" initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-extrabold text-gray-700 text-lg">Detail Hasil Ujian</h3>
                <button onClick={() => setShowResultDetail(null)} className="p-1 rounded-lg hover:bg-gray-100"><X className="w-5 h-5 text-gray-400" /></button>
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
                    <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100/50">
                      <div><p className="text-sm text-gray-400 font-medium">Skor Akhir</p><p className={`text-3xl font-extrabold ${score >= 70 ? 'text-emerald-500' : score >= 50 ? 'text-amber-500' : 'text-red-500'}`}>{score}%</p></div>
                      <div className="text-right"><p className="text-sm text-gray-400 font-medium">Jawaban Benar</p><p className="text-xl font-extrabold text-gray-700">{correctCount} / {totalCount}</p></div>
                    </div>
                    {questions?.map((q, i) => {
                      const answer = answers?.find(a => a.questionId === q.id)
                      const isCorrect = answer?.isCorrect as boolean
                      const selected = answer?.selectedAnswer as string | null
                      const correct = q.correctAnswer as string
                      return (
                        <motion.div key={q.id as string}
                          className={`p-4 rounded-xl border-l-4 ${isCorrect ? 'border-l-emerald-400 bg-emerald-50/30' : 'border-l-red-400 bg-red-50/30'}`}
                          initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.05 }}
                        >
                          <div className="flex items-start gap-2 mb-3">
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${isCorrect ? 'bg-emerald-500' : 'bg-red-500'}`}>
                              {isCorrect ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                            </span>
                            <p className="font-bold text-gray-700"><span className="text-indigo-500">{i + 1}.</span> {q.questionText as string}</p>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-sm ml-8">
                            {['A', 'B', 'C', 'D', 'E'].map(l => {
                              const optKey = `option${l}` as string
                              const optVal = q[optKey] as string
                              if (!optVal) return null
                              const isSelected = selected === l
                              const isCorrectOption = correct === l
                              return (
                                <div key={l} className={`px-3 py-2 rounded-xl flex items-center gap-2 ${
                                  isCorrectOption ? 'bg-emerald-100 text-emerald-600 font-bold' :
                                  isSelected && !isCorrect ? 'bg-red-100 text-red-500' : 'text-gray-400'
                                }`}>
                                  <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs shrink-0 ${
                                    isCorrectOption ? 'border-emerald-500 bg-emerald-500 text-white' :
                                    isSelected && !isCorrect ? 'border-red-500 bg-red-500 text-white' : 'border-gray-200'
                                  }`}>{l}</span>
                                  <span className="truncate">{optVal}</span>
                                </div>
                              )
                            })}
                          </div>
                          {!isCorrect && (
                            <div className="mt-3 ml-8">
                              <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-100/50">
                                <p className="font-bold text-amber-600 text-sm mb-1 flex items-center gap-1"><AlertCircle className="w-4 h-4" /> Pembahasan:</p>
                                <p className="text-sm text-gray-500 whitespace-pre-wrap">{(q.explanation as string) || 'Tidak ada pembahasan'}</p>
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
