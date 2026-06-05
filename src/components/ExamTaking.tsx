'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, ChevronLeft, ChevronRight, Send, AlertTriangle, CheckCircle2, XCircle, Loader2, User, BookOpen } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { toast } from 'sonner'

interface Question {
  id: string
  examId: string
  questionText: string
  optionA: string
  optionB: string
  optionC: string
  optionD: string
  optionE: string
  correctAnswer: string
  explanation: string | null
  order: number
}

interface Answer {
  questionId: string
  selectedAnswer: string | null
  isCorrect: boolean | null
}

const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E'] as const

export default function ExamTaking() {
  const { currentUser, activeExamId, activeSessionId, setCurrentView, setActiveExamId, setActiveSessionId } = useAppStore()
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Record<string, Answer>>({})
  const [currentIdx, setCurrentIdx] = useState(0)
  const [timeLeft, setTimeLeft] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false)
  const [examTitle, setExamTitle] = useState('')
  const [examSubject, setExamSubject] = useState<string | null>(null)
  const [examDuration, setExamDuration] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState<number | null>(null)
  const [correctCount, setCorrectCount] = useState(0)
  const [totalQuestions, setTotalQuestions] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchExamData = useCallback(async () => {
    if (!activeExamId || !activeSessionId) return
    setLoading(true)
    try {
      const examRes = await fetch(`/api/exams/${activeExamId}`)
      let examDurationMin = 60
      if (examRes.ok) {
        const examData = await examRes.json()
        setQuestions(examData.questions || [])
        setExamTitle(examData.title)
        setExamSubject(examData.subject || null)
        setExamDuration(examData.duration)
        examDurationMin = examData.duration
        setTotalQuestions((examData.questions || []).length)
      }

      // Load existing answers and calculate remaining time
      const sessionRes = await fetch(`/api/sessions/${activeSessionId}`)
      if (sessionRes.ok) {
        const sessionData = await sessionRes.json()
        const existingAnswers: Record<string, Answer> = {}
        for (const ans of sessionData.answers || []) {
          existingAnswers[ans.questionId] = {
            questionId: ans.questionId,
            selectedAnswer: ans.selectedAnswer,
            isCorrect: ans.isCorrect,
          }
        }
        setAnswers(existingAnswers)

        // Calculate remaining time from session start time
        if (sessionData.startTime) {
          const startTime = new Date(sessionData.startTime).getTime()
          const durationMs = examDurationMin * 60 * 1000
          const elapsed = Date.now() - startTime
          const remaining = Math.max(0, Math.round((durationMs - elapsed) / 1000))
          setTimeLeft(remaining)
        } else {
          setTimeLeft(examDurationMin * 60)
        }
      }
    } catch { /* ignore */ }
    setLoading(false)
  }, [activeExamId, activeSessionId])

  useEffect(() => {
    fetchExamData()
  }, [fetchExamData])

  // Keep a ref for auto-submit to avoid stale closure
  const autoSubmitRef = useRef<() => void>(() => {})

  const handleAutoSubmit = useCallback(() => {
    toast.error('Waktu ujian telah habis!')
    autoSubmitRef.current()
  }, [])

  // Timer
  useEffect(() => {
    if (submitted || timeLeft <= 0) return
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          handleAutoSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [submitted, handleAutoSubmit])

  const selectAnswer = async (questionId: string, option: string) => {
    if (submitted) return
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { questionId, selectedAnswer: option, isCorrect: null },
    }))

    if (!currentUser || !activeSessionId) return
    try {
      await fetch(`/api/sessions/${activeSessionId}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId,
          selectedAnswer: option,
          userId: currentUser.id,
        }),
      })
    } catch { /* ignore */ }
  }

  const handleSubmitExam = useCallback(async () => {
    if (!activeSessionId) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/sessions/${activeSessionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await res.json()
      if (res.ok) {
        setScore(data.score)
        setCorrectCount(data.correctAnswers)
        setSubmitted(true)
        if (timerRef.current) clearInterval(timerRef.current)
        toast.success('Ujian berhasil dikumpulkan!')
      } else {
        toast.error(data.error || 'Gagal mengumpulkan ujian')
      }
    } catch {
      toast.error('Terjadi kesalahan')
    } finally {
      setSubmitting(false)
      setShowConfirmSubmit(false)
    }
  }, [activeSessionId])

  // Update auto-submit ref
  useEffect(() => {
    autoSubmitRef.current = handleSubmitExam
  }, [handleSubmitExam])

  const handleBackToDashboard = () => {
    setActiveExamId(null)
    setActiveSessionId(null)
    setCurrentView(currentUser?.role === 'SISWA' ? 'student' : 'admin')
  }

  const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const answeredCount = Object.values(answers).filter((a) => a.selectedAnswer).length
  const currentQuestion = questions[currentIdx]
  const isLowTime = timeLeft <= 300 && timeLeft > 0
  const totalTime = examDuration * 60
  const progressPercent = totalTime > 0 ? (timeLeft / totalTime) * 100 : 0

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f3f4f6] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-blue-500 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Memuat soal ujian...</p>
        </div>
      </div>
    )
  }

  // Submitted result view
  if (submitted) {
    return (
      <div className="min-h-screen bg-[#f3f4f6] flex items-center justify-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl shadow-lg p-8 max-w-lg w-full mx-4 text-center">
          {score !== null && score >= 70 ? (
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
          ) : (
            <XCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          )}
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Ujian Selesai!</h2>
          <p className="text-gray-500 mb-4">{examTitle}</p>
          <div className="bg-gray-50 rounded-xl p-6 mb-4">
            <p className="text-sm text-gray-500">Nilai Anda</p>
            <p className={`text-5xl font-bold ${score !== null && score >= 70 ? 'text-green-600' : 'text-red-600'}`}>
              {score ?? '-'}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              {correctCount} dari {totalQuestions} jawaban benar
            </p>
          </div>
          <Button onClick={handleBackToDashboard} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md px-6">
            Kembali ke Dashboard
          </Button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f3f4f6]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex flex-col lg:flex-row gap-4">

          {/* ===== LEFT SIDEBAR ===== */}
          <div className="w-full lg:w-72 shrink-0 order-2 lg:order-1">
            <div className="lg:sticky lg:top-24 space-y-4">

              {/* Timer Card */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-2xl shadow-md overflow-hidden"
              >
                <div className="px-5 pt-4 pb-2">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Sisa Waktu Mengerjakan</p>
                </div>
                <div className="px-5 pb-4 text-center">
                  <div className={`text-5xl font-bold font-mono tracking-wider ${isLowTime ? 'text-red-500' : 'text-blue-600'}`}>
                    {formatTime(timeLeft)}
                  </div>
                  <p className={`text-xs font-medium mt-1 ${isLowTime ? 'text-red-400' : 'text-gray-400'}`}>
                    REMAINING TIME
                  </p>
                </div>
                {/* Progress Bar */}
                <div className="h-2 bg-gray-100">
                  <motion.div
                    className={`h-full rounded-r-full ${isLowTime ? 'bg-red-500' : 'bg-blue-500'}`}
                    initial={{ width: '100%' }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                {/* Student Info */}
                <div className="px-5 py-3 border-t border-gray-50 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-gray-400" />
                    <span className="text-xs text-gray-500">Siswa:</span>
                    <span className="text-xs font-semibold text-gray-700">{currentUser?.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-3.5 w-3.5 text-gray-400" />
                    <span className="text-xs text-gray-500">Mata Pelajaran:</span>
                    <span className="text-xs font-semibold text-gray-700">{examSubject || currentUser?.subject || '-'}</span>
                  </div>
                </div>
              </motion.div>

              {/* Question Navigator */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl shadow-md p-5"
              >
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Question Navigator</p>
                <div className="grid grid-cols-5 gap-2">
                  {questions.map((q, idx) => {
                    const isAnswered = answers[q.questionId]?.selectedAnswer
                    const isCurrent = idx === currentIdx
                    return (
                      <button
                        key={q.id}
                        onClick={() => setCurrentIdx(idx)}
                        className={`h-9 w-9 rounded-lg text-xs font-bold transition-all duration-200 flex items-center justify-center ${
                          isCurrent
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                            : isAnswered
                            ? 'bg-blue-100 text-blue-700 border border-blue-200'
                            : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50 shadow-sm'
                        }`}
                      >
                        {idx + 1}
                      </button>
                    )
                  })}
                </div>
                {/* Status Legend */}
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-white border-2 border-gray-300" />
                    <span className="text-xs text-gray-500">Belum Dijawab</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-blue-500" />
                    <span className="text-xs text-gray-500">Terjawab</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-red-500" />
                    <span className="text-xs text-gray-500">Ragu-ragu</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* ===== MAIN CONTENT AREA ===== */}
          <div className="flex-1 order-1 lg:order-2">
            {currentQuestion && (
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentQuestion.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="bg-white rounded-2xl shadow-md overflow-hidden">
                    {/* Question Header with tags */}
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-wrap">
                        {examSubject && (
                          <Badge className="bg-gray-100 text-gray-600 text-xs font-semibold hover:bg-gray-100 border-0">
                            {examSubject}
                          </Badge>
                        )}
                        <Badge className="bg-blue-100 text-blue-700 text-xs font-semibold hover:bg-blue-100 border-0">
                          {examTitle}
                        </Badge>
                      </div>
                      <span className="text-xs text-gray-400 font-mono">
                        CBT-ID: {currentIdx + 1}-{questions.length}-{activeExamId?.slice(-4) || '0'}
                      </span>
                    </div>

                    {/* Question Body */}
                    <div className="px-6 pt-5 pb-6">
                      {/* Question Number & Text */}
                      <div className="mb-6">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="h-7 w-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                            {currentIdx + 1}
                          </span>
                          <span className="text-xs text-gray-400 font-medium">Soal {currentIdx + 1} dari {questions.length}</span>
                        </div>
                        <p className="text-base font-medium text-gray-800 leading-relaxed whitespace-pre-wrap pl-9">
                          {currentQuestion.questionText}
                        </p>
                      </div>

                      {/* Answer Options */}
                      <div className="space-y-3 pl-9">
                        {OPTION_LABELS.map((label) => {
                          const optionText = currentQuestion[`option${label}` as keyof Question] as string
                          const selectedAnswer = answers[currentQuestion.questionId]?.selectedAnswer
                          const isSelected = selectedAnswer === label

                          return (
                            <motion.div
                              key={label}
                              whileHover={{ scale: 1.005 }}
                              whileTap={{ scale: 0.995 }}
                              onClick={() => selectAnswer(currentQuestion.questionId, label)}
                              className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                                isSelected
                                  ? 'border-blue-500 bg-blue-50 shadow-sm'
                                  : 'border-gray-100 bg-gray-50 hover:border-blue-200 hover:bg-blue-50/50'
                              }`}
                            >
                              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-all duration-200 ${
                                isSelected
                                  ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                                  : 'bg-white text-gray-500 border border-gray-200'
                              }`}>
                                {label}
                              </div>
                              <span className={`text-sm leading-relaxed ${isSelected ? 'text-blue-700 font-medium' : 'text-gray-700'}`}>
                                {optionText}
                              </span>
                            </motion.div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Bottom Navigation */}
                    <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-3">
                      <Button
                        variant="outline"
                        onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
                        disabled={currentIdx === 0}
                        className="rounded-xl border-gray-200 text-gray-600 hover:bg-gray-50"
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Sebelumnya
                      </Button>

                      <Button
                        onClick={() => setShowConfirmSubmit(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md shadow-blue-200 px-5"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Kumpulkan Ujian
                      </Button>

                      <Button
                        variant="outline"
                        onClick={() => setCurrentIdx(Math.min(questions.length - 1, currentIdx + 1))}
                        disabled={currentIdx === questions.length - 1}
                        className="rounded-xl border-gray-200 text-gray-600 hover:bg-gray-50"
                      >
                        Selanjutnya
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>

      {/* Submit Confirmation Dialog */}
      <Dialog open={showConfirmSubmit} onOpenChange={setShowConfirmSubmit}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Kumpulkan Ujian?
            </DialogTitle>
            <DialogDescription>
              {answeredCount < questions.length ? (
                <span className="text-amber-600 font-medium">
                  Anda baru menjawab {answeredCount} dari {questions.length} soal. Soal yang belum dijawab akan dianggap salah.
                </span>
              ) : (
                <span>Semua soal telah dijawab. Yakin ingin mengumpulkan?</span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowConfirmSubmit(false)} className="rounded-xl">
              Lanjutkan Mengerjakan
            </Button>
            <Button
              onClick={handleSubmitExam}
              disabled={submitting}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Mengumpulkan...
                </span>
              ) : (
                'Ya, Kumpulkan'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
