'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, ChevronLeft, ChevronRight, Send, AlertTriangle, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
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
      if (examRes.ok) {
        const examData = await examRes.json()
        setQuestions(examData.questions || [])
        setExamTitle(examData.title)
        setExamDuration(examData.duration)
        setTimeLeft(examData.duration * 60)
        setTotalQuestions((examData.questions || []).length)
      }

      // Load existing answers
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0f4f8] flex items-center justify-center">
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
      <div className="min-h-screen bg-[#f0f4f8] flex items-center justify-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-8 max-w-lg w-full mx-4 text-center">
          {score !== null && score >= 70 ? (
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
          ) : (
            <XCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          )}
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Ujian Selesai!</h2>
          <p className="text-gray-500 mb-4">{examTitle}</p>
          <div className="neu-flat p-6 mb-4">
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
    <div className="min-h-screen bg-[#f0f4f8]">
      <div className="max-w-6xl mx-auto px-4 py-4">
        {/* Timer Bar */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-strong p-4 mb-4 flex items-center justify-between"
        >
          <div>
            <h2 className="font-bold text-gray-800 text-sm">{examTitle}</h2>
            <p className="text-xs text-gray-500">{answeredCount} dari {questions.length} soal dijawab</p>
          </div>
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${isLowTime ? 'bg-red-100 timer-pulse' : 'bg-blue-50'}`}>
              <Clock className={`h-4 w-4 ${isLowTime ? 'text-red-500' : 'text-blue-500'}`} />
              <span className={`font-bold text-sm font-mono ${isLowTime ? 'text-red-600' : 'text-blue-700'}`}>
                {formatTime(timeLeft)}
              </span>
            </div>
            <Button
              onClick={() => setShowConfirmSubmit(true)}
              className="bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-md"
              size="sm"
            >
              <Send className="h-4 w-4 mr-2" />
              Kumpulkan
            </Button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Question Navigation Sidebar */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <div className="clay-glass p-4 sticky top-24">
              <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-3">Navigasi Soal</h3>
              <div className="grid grid-cols-5 gap-2">
                {questions.map((q, idx) => {
                  const isAnswered = answers[q.questionId]?.selectedAnswer
                  const isCurrent = idx === currentIdx
                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentIdx(idx)}
                      className={`h-9 w-9 rounded-lg text-xs font-bold transition-all ${
                        isCurrent
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                          : isAnswered
                          ? 'bg-green-100 text-green-700 border border-green-200'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  )
                })}
              </div>
              <div className="mt-4 space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded bg-green-100 border border-green-200" />
                  <span className="text-gray-600">Sudah dijawab</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded bg-gray-100" />
                  <span className="text-gray-600">Belum dijawab</span>
                </div>
              </div>
            </div>
          </div>

          {/* Question Content */}
          <div className="lg:col-span-3 order-1 lg:order-2">
            {currentQuestion && (
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentQuestion.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="clay-glass p-6">
                    {/* Question */}
                    <div className="mb-6">
                      <Badge className="bg-blue-100 text-blue-700 text-xs mb-3">
                        Soal {currentIdx + 1} dari {questions.length}
                      </Badge>
                      <p className="text-base font-medium text-gray-800 leading-relaxed whitespace-pre-wrap">
                        {currentQuestion.questionText}
                      </p>
                    </div>

                    {/* Options */}
                    <div className="space-y-3">
                      {OPTION_LABELS.map((label) => {
                        const optionText = currentQuestion[`option${label}` as keyof Question] as string
                        const selectedAnswer = answers[currentQuestion.questionId]?.selectedAnswer
                        const isSelected = selectedAnswer === label

                        return (
                          <div
                            key={label}
                            onClick={() => selectAnswer(currentQuestion.questionId, label)}
                            className={`option-card flex items-center gap-3 ${isSelected ? 'selected' : ''}`}
                          >
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                              isSelected
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'bg-gray-100 text-gray-500'
                            }`}>
                              {label}
                            </div>
                            <span className={`text-sm ${isSelected ? 'text-blue-700 font-medium' : 'text-gray-700'}`}>
                              {optionText}
                            </span>
                          </div>
                        )
                      })}
                    </div>

                    {/* Navigation */}
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
                      <Button
                        variant="outline"
                        onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
                        disabled={currentIdx === 0}
                        className="rounded-xl"
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Sebelumnya
                      </Button>
                      <span className="text-xs text-gray-400">
                        {currentIdx + 1} / {questions.length}
                      </span>
                      <Button
                        variant="outline"
                        onClick={() => setCurrentIdx(Math.min(questions.length - 1, currentIdx + 1))}
                        disabled={currentIdx === questions.length - 1}
                        className="rounded-xl"
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
              className="bg-green-600 hover:bg-green-700 text-white rounded-xl"
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
