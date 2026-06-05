'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, ChevronLeft, ChevronRight, Send, AlertTriangle, Check, X } from 'lucide-react'
import { useAppStore, QuestionData, ExamSessionData } from '@/lib/store'
import { toast } from 'sonner'

export default function ExamTaking() {
  const { user, activeSession, setActiveSession, setCurrentView } = useAppStore()
  const [questions, setQuestions] = useState<QuestionData[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [timeLeft, setTimeLeft] = useState(0)
  const [showConfirm, setShowConfirm] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [resultData, setResultData] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval>>()

  const loadQuestions = useCallback(async () => {
    if (!activeSession) return
    try {
      const res = await fetch(`/api/exams/${activeSession.examId}`)
      const data = await res.json()
      if (data.questions) setQuestions(data.questions)
      
      // Load existing answers
      const sessionRes = await fetch(`/api/sessions/${activeSession.id}`)
      const sessionData = await sessionRes.json()
      if (sessionData.answers) {
        const existing: Record<string, string> = {}
        sessionData.answers.forEach((a: Record<string, unknown>) => {
          if (a.selectedAnswer && a.questionId) {
            existing[a.questionId as string] = a.selectedAnswer as string
          }
        })
        setAnswers(existing)
      }

      // Calculate time left
      const startTime = new Date(activeSession.startTime).getTime()
      const durationMs = (data.duration || 60) * 60 * 1000
      const remaining = Math.max(0, startTime + durationMs - Date.now())
      setTimeLeft(Math.floor(remaining / 1000))
    } catch {
      toast.error('Gagal memuat soal')
    }
  }, [activeSession])

  useEffect(() => {
    loadQuestions()
  }, [loadQuestions])

  useEffect(() => {
    if (timeLeft <= 0) return
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          handleSubmit(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [])

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0')
    const s = (seconds % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  const handleSelectAnswer = async (questionId: string, answer: string) => {
    if (!activeSession || !user) return
    setAnswers(prev => ({ ...prev, [questionId]: answer }))
    try {
      await fetch(`/api/sessions/${activeSession.id}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId, selectedAnswer: answer, userId: user.id })
      })
    } catch { /* silent - answer saved locally */ }
  }

  const handleSubmit = async (auto = false) => {
    if (!activeSession) return
    if (!auto) {
      const unanswered = questions.filter(q => !answers[q.id]).length
      if (unanswered > 0 && !showConfirm) {
        setShowConfirm(true)
        return
      }
    }

    clearInterval(timerRef.current)
    setLoading(true)
    try {
      const res = await fetch(`/api/sessions/${activeSession.id}`, { method: 'PUT' })
      const data = await res.json()
      if (res.ok) {
        // Load full results
        const resultRes = await fetch(`/api/sessions/${activeSession.id}`)
        const resultDetail = await resultRes.json()
        setResultData(resultDetail)
        setShowResults(true)
        toast.success('Ujian berhasil dikumpulkan!')
      } else {
        toast.error(data.error || 'Gagal mengumpulkan ujian')
      }
    } catch {
      toast.error('Gagal mengumpulkan ujian')
    } finally {
      setLoading(false)
      setShowConfirm(false)
    }
  }

  const handleFinish = () => {
    setActiveSession(null)
    setCurrentView('student')
  }

  if (showResults && resultData) {
    const detail = resultData as Record<string, unknown>
    const answersList = detail.answers as Array<Record<string, unknown>> | undefined
    const examData = detail.exam as Record<string, unknown> | undefined
    const questionsList = examData?.questions as Array<Record<string, unknown>> | undefined
    const score = detail.score as number
    const correctCount = answersList?.filter(a => a.isCorrect === true).length || 0
    const totalCount = questionsList?.length || 0

    return (
      <div className="flex-1 p-4 md:p-6 max-w-3xl mx-auto w-full">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          {/* Score Card */}
          <div className="clay-glass p-8 text-center mb-6">
            <motion.div
              className={`w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center ${
                score >= 70 ? 'bg-gradient-success' : score >= 50 ? 'bg-gradient-warning' : 'bg-gradient-danger'
              }`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.3 }}
            >
              <span className="text-3xl font-bold text-white">{score}</span>
            </motion.div>
            <h2 className="text-2xl font-bold mb-1">Ujian Selesai!</h2>
            <p className="text-muted-foreground mb-4">{examData?.title as string}</p>
            <div className="flex items-center justify-center gap-6">
              <div>
                <p className="text-sm text-muted-foreground">Benar</p>
                <p className="text-xl font-bold text-emerald-500">{correctCount}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Salah</p>
                <p className="text-xl font-bold text-red-500">{totalCount - correctCount}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-xl font-bold">{totalCount}</p>
              </div>
            </div>
          </div>

          {/* Questions Review */}
          <div className="space-y-4 mb-6">
            {questionsList?.map((q, i) => {
              const answer = answersList?.find(a => a.questionId === q.id)
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
                        </div>
                      )
                    })}
                  </div>
                  {!isCorrect && (
                    <div className="mt-3 ml-8">
                      <div className="bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
                        <p className="font-semibold text-amber-600 text-sm mb-1">💡 Pembahasan:</p>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{(q.explanation as string) || 'Tidak ada pembahasan'}</p>
                      </div>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>

          <button onClick={handleFinish} className="clay-btn w-full py-3 bg-gradient-primary text-white font-semibold">
            Kembali ke Dashboard
          </button>
        </motion.div>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Memuat soal...</p>
        </div>
      </div>
    )
  }

  const currentQuestion = questions[currentIndex]
  const progress = Object.keys(answers).length / questions.length * 100

  return (
    <div className="flex-1 p-4 md:p-6 max-w-4xl mx-auto w-full">
      {/* Exam Header */}
      <div className="clay-glass p-4 mb-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="font-bold text-lg">Ujian Berlangsung</h2>
            <p className="text-sm text-muted-foreground">Soal {currentIndex + 1} dari {questions.length}</p>
          </div>
          <div className={`flex items-center gap-2 neu-flat px-4 py-2 ${timeLeft <= 60 ? 'timer-pulse' : ''}`}>
            <Clock className={`w-5 h-5 ${timeLeft <= 60 ? 'text-red-500' : 'text-indigo-500'}`} />
            <span className={`text-lg font-mono font-bold ${timeLeft <= 60 ? 'text-red-500' : ''}`}>
              {formatTimer(timeLeft)}
            </span>
          </div>
        </div>
        {/* Progress Bar */}
        <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
          <motion.div
            className="h-full bg-gradient-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">{Object.keys(answers).length} / {questions.length} dijawab</p>
      </div>

      {/* Question Navigation Dots */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-2">
        {questions.map((q, i) => (
          <button
            key={q.id}
            onClick={() => setCurrentIndex(i)}
            className={`w-8 h-8 rounded-lg text-xs font-bold shrink-0 transition-all ${
              i === currentIndex ? 'bg-gradient-primary text-white scale-110' :
              answers[q.id] ? 'bg-emerald-500/20 text-emerald-500' :
              'neu-btn text-muted-foreground'
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {/* Question Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion.id}
          className="clay-glass p-6 mb-4"
          initial={{ x: 30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -30, opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <h3 className="text-lg font-bold mb-6">
            <span className="text-indigo-500 mr-2">{currentIndex + 1}.</span>
            {currentQuestion.questionText}
          </h3>

          <div className="space-y-3">
            {['A', 'B', 'C', 'D', 'E'].map(letter => {
              const optionText = currentQuestion[`option${letter}` as keyof QuestionData] as string
              if (!optionText) return null
              const isSelected = answers[currentQuestion.id] === letter
              return (
                <motion.button
                  key={letter}
                  onClick={() => handleSelectAnswer(currentQuestion.id, letter)}
                  className={`option-card w-full p-4 rounded-xl flex items-center gap-3 text-left ${
                    isSelected ? 'selected' : 'neo-glass'
                  }`}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-all ${
                    isSelected ? 'bg-indigo-500 text-white' : 'bg-muted text-muted-foreground'
                  }`}>
                    {letter}
                  </span>
                  <span className={`flex-1 ${isSelected ? 'font-semibold' : ''}`}>{optionText}</span>
                  {isSelected && <Check className="w-5 h-5 text-indigo-500 shrink-0" />}
                </motion.button>
              )
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
          disabled={currentIndex === 0}
          className="clay-btn px-5 py-2.5 flex items-center gap-1 disabled:opacity-30"
        >
          <ChevronLeft className="w-4 h-4" /> Sebelumnya
        </button>
        
        <button
          onClick={() => setShowConfirm(true)}
          disabled={loading}
          className="clay-btn px-5 py-2.5 bg-gradient-danger text-white flex items-center gap-2 disabled:opacity-50"
        >
          <Send className="w-4 h-4" /> Kumpulkan
        </button>

        <button
          onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
          disabled={currentIndex === questions.length - 1}
          className="clay-btn px-5 py-2.5 flex items-center gap-1 disabled:opacity-30"
        >
          Selanjutnya <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Confirm Dialog */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowConfirm(false)}
          >
            <motion.div
              className="clay-glass p-6 w-full max-w-sm text-center"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-amber-500" />
              </div>
              <h3 className="font-bold text-lg mb-2">Kumpulkan Ujian?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {questions.filter(q => !answers[q.id]).length > 0
                  ? `Masih ada ${questions.filter(q => !answers[q.id]).length} soal belum dijawab. `
                  : ''
                }Pastikan semua jawaban sudah benar sebelum mengumpulkan.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setShowConfirm(false)} className="clay-btn flex-1 py-2.5">Batal</button>
                <button onClick={() => handleSubmit(false)} disabled={loading} className="clay-btn flex-1 py-2.5 bg-gradient-primary text-white disabled:opacity-50">
                  {loading ? 'Memproses...' : 'Ya, Kumpulkan'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
