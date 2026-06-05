'use client'

import { useEffect, useState, useCallback, useRef, type ChangeEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutGrid, Users, BarChart3, Plus, Pencil, Trash2, Search,
  Eye, ToggleLeft, ToggleRight, Loader2, FileText, BookOpen,
  Upload, Download, CheckSquare, Square, Trash2Icon,
  Sparkles, Wand2
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

interface Stats {
  totalExams: number
  completedSessions: number
  averageScore: number
  totalStudents: number
}

interface Exam {
  id: string
  title: string
  subject: string | null
  description: string | null
  duration: number
  isActive: boolean
  createdBy: string
  createdAt: string
  creator?: { name: string; subject?: string }
  _count?: { questions: number; sessions: number }
}

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

interface Result {
  id: string
  userId: string
  examId: string
  startTime: string
  endTime: string | null
  status: string
  score: number | null
  exam: { id: string; title: string; creator?: { subject?: string } }
  user: { name: string; username: string; class: string | null }
}

interface Siswa {
  id: string
  username: string
  name: string
  class: string | null
  subject: string | null
  password: string
  isActive: boolean
}

export default function GuruDashboard() {
  const { currentUser } = useAppStore()
  const guruSubject = currentUser?.subject || ''
  const [activeTab, setActiveTab] = useState('ujian')
  const [stats, setStats] = useState<Stats | null>(null)

  // Exams state
  const [exams, setExams] = useState<Exam[]>([])
  const [examLoading, setExamLoading] = useState(true)
  const [showExamForm, setShowExamForm] = useState(false)
  const [editingExam, setEditingExam] = useState<Exam | null>(null)
  const [examTitle, setExamTitle] = useState('')
  const [examDesc, setExamDesc] = useState('')
  const [examDuration, setExamDuration] = useState(60)
  const [examSubject, setExamSubject] = useState('')

  // Questions state
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [showQuestionForm, setShowQuestionForm] = useState(false)
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set())
  const [qText, setQText] = useState('')
  const [qA, setQA] = useState('')
  const [qB, setQB] = useState('')
  const [qC, setQC] = useState('')
  const [qD, setQD] = useState('')
  const [qE, setQE] = useState('')
  const [qCorrect, setQCorrect] = useState('A')
  const [qExplanation, setQExplanation] = useState('')
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)

  // Students state
  const [students, setStudents] = useState<Siswa[]>([])
  const [studentSearch, setStudentSearch] = useState('')

  // Results state
  const [results, setResults] = useState<Result[]>([])
  const [resultSearch, setResultSearch] = useState('')
  const [resultExamFilter, setResultExamFilter] = useState<string>('all')
  const [resultGroupMode, setResultGroupMode] = useState<'flat' | 'grouped'>('grouped')

  // Delete dialog
  const [deleteDialog, setDeleteDialog] = useState<{ type: 'exam' | 'question' | 'bulk'; id: string; name: string } | null>(null)

  // Word import
  const [importing, setImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // AI question generation
  const [showAIDialog, setShowAIDialog] = useState(false)
  const [aiTopic, setAiTopic] = useState('')
  const [aiSubject, setAiSubject] = useState('')
  const [aiCount, setAiCount] = useState(5)
  const [aiDifficulty, setAiDifficulty] = useState('sedang')
  const [aiGenerating, setAiGenerating] = useState(false)

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`/api/stats?subject=${encodeURIComponent(guruSubject)}`)
      if (res.ok) setStats(await res.json())
    } catch { /* ignore */ }
  }, [guruSubject])

  const fetchExams = useCallback(async () => {
    setExamLoading(true)
    try {
      const res = await fetch(`/api/exams?subject=${encodeURIComponent(guruSubject)}`)
      if (res.ok) setExams(await res.json())
    } catch { /* ignore */ }
    setExamLoading(false)
  }, [guruSubject])

  const fetchQuestions = useCallback(async (examId: string) => {
    try {
      const res = await fetch(`/api/exams/${examId}/questions`)
      if (res.ok) setQuestions(await res.json())
    } catch { /* ignore */ }
  }, [])

  const fetchStudents = useCallback(async () => {
    try {
      const res = await fetch(`/api/students?subject=${encodeURIComponent(guruSubject)}`)
      if (res.ok) {
        const data = await res.json()
        // Filter students by subject on client side as well
        const filtered = data.filter((s: Siswa) =>
          !s.subject || s.subject.toLowerCase() === guruSubject.toLowerCase()
        )
        setStudents(filtered)
      }
    } catch { /* ignore */ }
  }, [guruSubject])

  const fetchResults = useCallback(async () => {
    try {
      const res = await fetch(`/api/results?subject=${encodeURIComponent(guruSubject)}`)
      if (res.ok) setResults(await res.json())
    } catch { /* ignore */ }
  }, [guruSubject])

  useEffect(() => {
    if (!guruSubject) return
    const loadData = async () => {
      await Promise.all([fetchStats(), fetchExams(), fetchStudents(), fetchResults()])
    }
    loadData()
  }, [fetchStats, fetchExams, fetchStudents, fetchResults])

  // Exam CRUD
  const handleSaveExam = async () => {
    if (!examTitle.trim()) { toast.error('Judul ujian harus diisi'); return }
    try {
      if (editingExam) {
        const res = await fetch(`/api/exams/${editingExam.id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: examTitle, subject: examSubject, description: examDesc, duration: examDuration }),
        })
        if (res.ok) { toast.success('Ujian berhasil diperbarui'); fetchExams(); fetchStats() }
        else toast.error('Gagal memperbarui ujian')
      } else {
        const res = await fetch('/api/exams', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: examTitle, subject: examSubject, description: examDesc, duration: examDuration, createdBy: currentUser?.id }),
        })
        if (res.ok) { toast.success('Ujian berhasil dibuat'); fetchExams(); fetchStats() }
        else toast.error('Gagal membuat ujian')
      }
      resetExamForm()
    } catch { toast.error('Terjadi kesalahan') }
  }

  const resetExamForm = () => { setShowExamForm(false); setEditingExam(null); setExamTitle(''); setExamDesc(''); setExamDuration(60); setExamSubject('') }

  const handleToggleExam = async (exam: Exam) => {
    try {
      const res = await fetch(`/api/exams/${exam.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !exam.isActive }),
      })
      if (res.ok) {
        toast.success(exam.isActive ? 'Ujian dinonaktifkan' : 'Ujian diaktifkan')
        fetchExams()
        fetchStats()
        if (selectedExam?.id === exam.id) {
          setSelectedExam({ ...selectedExam, isActive: !exam.isActive })
        }
      } else {
        toast.error('Gagal mengubah status ujian')
      }
    } catch { toast.error('Gagal mengubah status') }
  }

  // AI question generation handler
  const handleAIGenerate = async () => {
    if (!selectedExam) { toast.error('Pilih ujian terlebih dahulu'); return }
    if (!aiTopic.trim()) { toast.error('Topik/mata pelajaran harus diisi'); return }
    setAiGenerating(true)
    try {
      const res = await fetch('/api/ai/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examId: selectedExam.id,
          subject: aiSubject || aiTopic,
          topic: aiTopic,
          count: aiCount,
          difficulty: aiDifficulty,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(`${data.count} soal berhasil dibuat oleh AI`)
        fetchQuestions(selectedExam.id)
        fetchStats()
        setShowAIDialog(false)
        setAiTopic('')
        setAiSubject('')
        setAiCount(5)
        setAiDifficulty('sedang')
      } else {
        toast.error(data.error || 'Gagal membuat soal dengan AI')
      }
    } catch {
      toast.error('Terjadi kesalahan koneksi ke AI')
    } finally {
      setAiGenerating(false)
    }
  }

  const handleDeleteExam = async () => {
    if (!deleteDialog) return
    try {
      const res = await fetch(`/api/exams/${deleteDialog.id}`, { method: 'DELETE' })
      if (res.ok) { toast.success('Ujian berhasil dihapus'); fetchExams(); fetchStats(); if (selectedExam?.id === deleteDialog.id) setSelectedExam(null) }
    } catch { toast.error('Gagal menghapus ujian') }
    setDeleteDialog(null)
  }

  const handleEditExam = (exam: Exam) => {
    setEditingExam(exam); setExamTitle(exam.title); setExamDesc(exam.description || ''); setExamDuration(exam.duration); setExamSubject(exam.subject || '')
    setShowExamForm(true)
  }

  const handleSelectExam = (exam: Exam) => {
    setSelectedExam(exam); setSelectedQuestions(new Set()); fetchQuestions(exam.id)
  }

  const handleEditQuestion = (q: Question) => {
    setEditingQuestion(q)
    setQText(q.questionText)
    setQA(q.optionA)
    setQB(q.optionB)
    setQC(q.optionC)
    setQD(q.optionD)
    setQE(q.optionE)
    setQCorrect(q.correctAnswer)
    setQExplanation(q.explanation || '')
    setShowQuestionForm(true)
  }

  // Question CRUD
  const handleSaveQuestion = async () => {
    if (!qText || !qA || !qB || !qC || !qD || !qE || !qCorrect) { toast.error('Semua field soal harus diisi'); return }
    if (!selectedExam) return
    try {
      if (editingQuestion) {
        const res = await fetch(`/api/questions/${editingQuestion.id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ questionText: qText, optionA: qA, optionB: qB, optionC: qC, optionD: qD, optionE: qE, correctAnswer: qCorrect, explanation: qExplanation }),
        })
        if (res.ok) { toast.success('Soal berhasil diperbarui'); fetchQuestions(selectedExam.id); fetchStats(); resetQuestionForm() }
        else toast.error('Gagal memperbarui soal')
      } else {
        const res = await fetch(`/api/exams/${selectedExam.id}/questions`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ questionText: qText, optionA: qA, optionB: qB, optionC: qC, optionD: qD, optionE: qE, correctAnswer: qCorrect, explanation: qExplanation }),
        })
        if (res.ok) { toast.success('Soal berhasil ditambahkan'); fetchQuestions(selectedExam.id); fetchStats(); resetQuestionForm() }
        else toast.error('Gagal menambahkan soal')
      }
    } catch { toast.error('Terjadi kesalahan') }
  }

  const resetQuestionForm = () => { setShowQuestionForm(false); setEditingQuestion(null); setQText(''); setQA(''); setQB(''); setQC(''); setQD(''); setQE(''); setQCorrect('A'); setQExplanation('') }

  const handleDeleteQuestion = async () => {
    if (!deleteDialog) return
    try {
      if (deleteDialog.type === 'bulk') {
        const res = await fetch('/api/questions/bulk-delete', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ questionIds: Array.from(selectedQuestions) }),
        })
        if (res.ok) { toast.success(`${selectedQuestions.size} soal berhasil dihapus`); setSelectedQuestions(new Set()); if (selectedExam) fetchQuestions(selectedExam.id); fetchStats() }
      } else {
        const res = await fetch(`/api/questions/${deleteDialog.id}`, { method: 'DELETE' })
        if (res.ok) { toast.success('Soal berhasil dihapus'); if (selectedExam) fetchQuestions(selectedExam.id); fetchStats() }
      }
    } catch { toast.error('Terjadi kesalahan') }
    setDeleteDialog(null)
  }

  const toggleSelectAll = () => {
    if (selectedQuestions.size === questions.length) setSelectedQuestions(new Set())
    else setSelectedQuestions(new Set(questions.map(q => q.id)))
  }

  const toggleSelectQuestion = (id: string) => {
    const next = new Set(selectedQuestions)
    if (next.has(id)) next.delete(id); else next.add(id)
    setSelectedQuestions(next)
  }

  const handleWordImport = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedExam) return
    setImporting(true)
    const formData = new FormData()
    formData.append('file', file); formData.append('examId', selectedExam.id)
    try {
      const res = await fetch('/api/import/word', { method: 'POST', body: formData })
      const data = await res.json()
      if (res.ok) { toast.success(`${data.count || 0} soal berhasil diimpor`); fetchQuestions(selectedExam.id); fetchStats() }
      else toast.error(data.error || 'Gagal mengimpor file Word')
    } catch { toast.error('Gagal mengimpor file') }
    finally { setImporting(false); if (fileInputRef.current) fileInputRef.current.value = '' }
  }

  // Export results CSV
  const handleExportResults = (examId?: string) => {
    const filtered = examId && examId !== 'all'
      ? results.filter(r => r.examId === examId)
      : filteredResults
    if (filtered.length === 0) { toast.error('Tidak ada data untuk diekspor'); return }
    const examTitle = examId && examId !== 'all' ? exams.find(e => e.id === examId)?.title || 'Ujian' : 'Semua-Ujian'
    const headers = ['No', 'Nama Siswa', 'Username', 'Kelas', 'Ujian', 'Nilai', 'Status']
    const rows = filtered.map((r, idx) => [idx + 1, r.user.name, r.user.username, r.user.class || '-', r.exam.title, r.score ?? '-', r.score !== null && r.score >= 70 ? 'Lulus' : 'Tidak Lulus'])
    const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url; link.download = `hasil-ujian-${examTitle.replace(/\s+/g, '-')}.csv`; link.click()
    URL.revokeObjectURL(url)
    toast.success('Data berhasil diekspor ke CSV')
  }

  // Filtered
  const filteredResults = results.filter((r) => {
    const matchSearch = r.exam.title.toLowerCase().includes(resultSearch.toLowerCase()) || r.user.name.toLowerCase().includes(resultSearch.toLowerCase())
    const matchExam = resultExamFilter === 'all' || r.examId === resultExamFilter
    return matchSearch && matchExam
  })

  const groupedResults = filteredResults.reduce<Record<string, Result[]>>((acc, r) => {
    const key = r.examId; if (!acc[key]) acc[key] = []; acc[key].push(r); return acc
  }, {})

  const filteredStudents = students.filter((s) =>
    s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
    s.username.toLowerCase().includes(studentSearch.toLowerCase()) ||
    (s.class || '').toLowerCase().includes(studentSearch.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-[#f0f4f8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Guru Banner */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="glass-card p-5">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-200">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800">Dashboard Guru — {currentUser?.name}</h2>
                <p className="text-sm text-gray-500">Mata Pelajaran: <span className="font-semibold text-emerald-600">{guruSubject}</span></p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
            <div className="neu-flat p-5">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl bg-blue-100 flex items-center justify-center"><LayoutGrid className="h-5 w-5 text-blue-600" /></div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">PAKET UJIAN</p>
                  <p className="text-2xl font-bold text-gray-800">{stats?.totalExams ?? 0}</p>
                </div>
              </div>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="neu-flat p-5">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl bg-emerald-100 flex items-center justify-center"><Users className="h-5 w-5 text-emerald-600" /></div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">UJIAN DIKUTI</p>
                  <p className="text-2xl font-bold text-gray-800">{stats?.completedSessions ?? 0}</p>
                </div>
              </div>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="neu-flat p-5">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl bg-amber-100 flex items-center justify-center"><BarChart3 className="h-5 w-5 text-amber-600" /></div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">NILAI RATA-RATA</p>
                  <p className="text-2xl font-bold text-gray-800">{stats?.averageScore ?? 0}</p>
                </div>
              </div>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <div className="neu-flat p-5">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl bg-violet-100 flex items-center justify-center"><Users className="h-5 w-5 text-violet-600" /></div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">JUMLAH SISWA</p>
                  <p className="text-2xl font-bold text-gray-800">{stats?.totalStudents ?? 0}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white/80 backdrop-blur-sm shadow-sm rounded-xl h-auto p-1.5 gap-1">
            <TabsTrigger value="ujian" className="rounded-lg px-4 py-2 text-sm data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-md">
              <FileText className="h-4 w-4 mr-2" />Kelola Ujian & Soal
            </TabsTrigger>
            <TabsTrigger value="siswa" className="rounded-lg px-4 py-2 text-sm data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-md">
              <Users className="h-4 w-4 mr-2" />Daftar Siswa
            </TabsTrigger>
            <TabsTrigger value="hasil" className="rounded-lg px-4 py-2 text-sm data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-md">
              <BarChart3 className="h-4 w-4 mr-2" />Rekap Hasil
            </TabsTrigger>
          </TabsList>

          {/* ==================== Kelola Ujian & Soal ==================== */}
          <TabsContent value="ujian" className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">Kelola Ujian & Soal</h2>
              <Button onClick={() => { resetExamForm(); setExamSubject(guruSubject); setShowExamForm(true) }} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md">
                <Plus className="h-4 w-4 mr-2" />Tambah Ujian
              </Button>
            </div>

            <AnimatePresence>
              {showExamForm && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <Card className="clay-glass border-0">
                    <CardHeader><CardTitle className="text-base">{editingExam ? 'Edit Ujian' : 'Tambah Ujian Baru'}</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2"><Label className="text-sm font-medium">Judul Ujian</Label><Input value={examTitle} onChange={(e) => setExamTitle(e.target.value)} placeholder="Contoh: Ujian Matematika XII" className="neu-input bg-transparent" /></div>
                        <div className="space-y-2"><Label className="text-sm font-medium">Mata Pelajaran</Label><Input value={examSubject} onChange={(e) => setExamSubject(e.target.value)} placeholder="Contoh: Matematika" className="neu-input bg-transparent" /></div>
                        <div className="space-y-2"><Label className="text-sm font-medium">Durasi (menit)</Label><Input type="number" value={examDuration} onChange={(e) => setExamDuration(parseInt(e.target.value) || 60)} className="neu-input bg-transparent" /></div>
                      </div>
                      <div className="space-y-2"><Label className="text-sm font-medium">Deskripsi</Label><Textarea value={examDesc} onChange={(e) => setExamDesc(e.target.value)} placeholder="Deskripsi ujian (opsional)" className="neu-input bg-transparent min-h-[80px]" /></div>
                      <div className="flex gap-2">
                        <Button onClick={handleSaveExam} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">{editingExam ? 'Update Ujian' : 'Simpan Ujian'}</Button>
                        <Button onClick={resetExamForm} variant="outline" className="rounded-xl">Batalkan</Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Two-column layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Left Column */}
              <div className="lg:col-span-5 space-y-3">
                <div className="flex items-center gap-2 mb-1"><FileText className="h-4 w-4 text-emerald-500" /><h3 className="text-sm font-bold text-gray-700">DAFTAR UJIAN ({guruSubject})</h3></div>
                {examLoading ? (
                  <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-emerald-500" /></div>
                ) : exams.length === 0 ? (
                  <div className="clay p-8 text-center"><FileText className="h-8 w-8 text-gray-300 mx-auto mb-2" /><p className="text-sm text-gray-400">Belum ada ujian</p></div>
                ) : (
                  <div className="space-y-3 max-h-[calc(100vh-380px)] overflow-y-auto custom-scrollbar pr-1">
                    {exams.map((exam) => (
                      <motion.div key={exam.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} layout>
                        <div className={`clay p-4 cursor-pointer transition-all hover:shadow-lg ${selectedExam?.id === exam.id ? 'ring-2 ring-emerald-400 shadow-lg' : ''}`} onClick={() => handleSelectExam(exam)}>
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-bold text-gray-800 text-sm leading-tight flex-1">{exam.title}</h4>
                            <div className="flex items-center gap-1 ml-2 shrink-0">
                              {exam.isActive ? <span className="badge-active text-[10px]">Aktif</span> : <Badge variant="secondary" className="text-[10px] px-2">Nonaktif</Badge>}
                            </div>
                          </div>
                          {exam.subject && <Badge className="bg-emerald-100 text-emerald-700 text-[10px] mb-2 mr-1">{exam.subject}</Badge>}
                          {exam.description && <p className="text-xs text-gray-500 mb-2 line-clamp-2">{exam.description}</p>}
                          <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                            <span className="flex items-center gap-1"><FileText className="h-3 w-3" />{exam._count?.questions ?? 0} soal</span>
                            <span className="flex items-center gap-1"><Users className="h-3 w-3" />{exam._count?.sessions ?? 0} peserta</span>
                            <span>{exam.duration} mnt</span>
                          </div>
                          <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <Button size="sm" variant="outline" className="h-7 text-[11px] rounded-lg px-2" onClick={() => handleToggleExam(exam)}>
                              {exam.isActive ? <ToggleRight className="h-3 w-3 mr-1 text-green-500" /> : <ToggleLeft className="h-3 w-3 mr-1" />}
                              {exam.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                            </Button>
                            <Button size="sm" variant="outline" className="h-7 w-7 p-0 rounded-lg" onClick={() => handleEditExam(exam)}><Pencil className="h-3 w-3 text-blue-500" /></Button>
                            <Button size="sm" variant="outline" className="h-7 w-7 p-0 rounded-lg hover:bg-red-50" onClick={() => setDeleteDialog({ type: 'exam', id: exam.id, name: exam.title })}><Trash2 className="h-3 w-3 text-red-500" /></Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Preview */}
              <div className="lg:col-span-7">
                {!selectedExam ? (
                  <div className="clay p-12 text-center h-full min-h-[300px] flex flex-col items-center justify-center">
                    <Eye className="h-12 w-12 text-gray-300 mb-3" />
                    <h3 className="font-semibold text-gray-400 text-sm">Pilih Ujian untuk Melihat Preview</h3>
                  </div>
                ) : (
                  <div className="clay-glass p-5 border-0 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-gray-800 text-base">{selectedExam.title}</h3>
                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                          <span><FileText className="h-3 w-3 inline mr-1" />{questions.length} soal</span>
                          <span>{selectedExam.duration} menit</span>
                          <span>{selectedExam.isActive ? '🟢 Aktif' : '🔴 Nonaktif'}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={() => setShowQuestionForm(true)} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs"><Plus className="h-3.5 w-3.5 mr-1" />Tambah Soal</Button>
                        <Button onClick={() => setShowAIDialog(true)} size="sm" className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-xl text-xs shadow-md">
                          <Sparkles className="h-3.5 w-3.5 mr-1" /> Buat Soal AI
                        </Button>
                        <input ref={fileInputRef} type="file" accept=".docx,.doc" onChange={handleWordImport} className="hidden" />
                        <Button onClick={() => fileInputRef.current?.click()} disabled={importing} size="sm" variant="outline" className="rounded-xl text-xs">
                          {importing ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Upload className="h-3.5 w-3.5 mr-1" />}Import Word
                        </Button>
                      </div>
                    </div>

                    <AnimatePresence>
                      {showQuestionForm && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                          <div className="neo-glass p-5 space-y-4">
                            <h4 className="font-semibold text-gray-700 text-sm">{editingQuestion ? 'Edit Soal' : 'Tambah Soal Baru'}</h4>
                            <div className="space-y-2"><Label className="text-xs font-medium">Teks Soal</Label><Textarea value={qText} onChange={(e) => setQText(e.target.value)} placeholder="Tulis soal di sini..." className="neu-input bg-transparent min-h-[80px]" /></div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {[{ label: 'Opsi A', value: qA, set: setQA }, { label: 'Opsi B', value: qB, set: setQB }, { label: 'Opsi C', value: qC, set: setQC }, { label: 'Opsi D', value: qD, set: setQD }, { label: 'Opsi E', value: qE, set: setQE }].map((opt) => (
                                <div key={opt.label} className="space-y-1"><Label className="text-xs font-medium">{opt.label}</Label><Input value={opt.value} onChange={(e) => opt.set(e.target.value)} className="neu-input bg-transparent h-9 text-sm" /></div>
                              ))}
                              <div className="space-y-1"><Label className="text-xs font-medium">Jawaban Benar</Label><Select value={qCorrect} onValueChange={setQCorrect}><SelectTrigger className="neu-input bg-transparent h-9 text-sm"><SelectValue /></SelectTrigger><SelectContent>{['A', 'B', 'C', 'D', 'E'].map((o) => (<SelectItem key={o} value={o}>Opsi {o}</SelectItem>))}</SelectContent></Select></div>
                            </div>
                            <div className="space-y-1"><Label className="text-xs font-medium">Pembahasan (opsional)</Label><Textarea value={qExplanation} onChange={(e) => setQExplanation(e.target.value)} placeholder="Pembahasan jawaban..." className="neu-input bg-transparent min-h-[60px]" /></div>
                            <div className="flex gap-2"><Button onClick={handleSaveQuestion} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">Simpan Soal</Button><Button onClick={resetQuestionForm} size="sm" variant="outline" className="rounded-xl">Batalkan</Button></div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {questions.length === 0 ? (
                      <div className="text-center py-8"><FileText className="h-8 w-8 text-gray-300 mx-auto mb-2" /><p className="text-sm text-gray-400">Belum ada soal</p></div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between bg-gray-50/80 rounded-xl px-4 py-2.5">
                          <button onClick={toggleSelectAll} className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-emerald-600 transition-colors">
                            {selectedQuestions.size === questions.length && questions.length > 0 ? <CheckSquare className="h-4 w-4 text-emerald-600" /> : <Square className="h-4 w-4 text-gray-400" />}
                            Pilih Semua ({selectedQuestions.size}/{questions.length})
                          </button>
                          {selectedQuestions.size > 0 && (
                            <Button size="sm" variant="destructive" className="h-8 text-xs rounded-lg gap-1.5" onClick={() => setDeleteDialog({ type: 'bulk', id: '', name: `${selectedQuestions.size} soal terpilih` })}>
                              <Trash2Icon className="h-3.5 w-3.5" />Hapus {selectedQuestions.size} Soal
                            </Button>
                          )}
                        </div>
                        <div className="space-y-3 max-h-[calc(100vh-580px)] overflow-y-auto custom-scrollbar pr-1">
                          {questions.map((q, idx) => (
                            <div key={q.id} className={`neu-flat p-4 transition-all ${selectedQuestions.has(q.id) ? 'ring-2 ring-emerald-300 bg-emerald-50/30' : ''}`}>
                              <div className="flex items-start gap-3">
                                <button onClick={() => toggleSelectQuestion(q.id)} className="mt-0.5 shrink-0">
                                  {selectedQuestions.has(q.id) ? <CheckSquare className="h-4 w-4 text-emerald-600" /> : <Square className="h-4 w-4 text-gray-300 hover:text-gray-500" />}
                                </button>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-800 mb-1">{idx + 1}. {q.questionText}</p>
                                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 text-xs text-gray-600">
                                    <span>A. {q.optionA}</span><span>B. {q.optionB}</span><span>C. {q.optionC}</span><span>D. {q.optionD}</span><span>E. {q.optionE}</span>
                                  </div>
                                  <Badge className="bg-green-100 text-green-700 text-xs mt-2">Jawaban: {q.correctAnswer}</Badge>
                                </div>
                                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-emerald-400 hover:text-emerald-600 shrink-0" onClick={() => handleEditQuestion(q)}>
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-400 hover:text-red-600 shrink-0" onClick={() => setDeleteDialog({ type: 'question', id: q.id, name: `Soal ${idx + 1}` })}><Trash2 className="h-3.5 w-3.5" /></Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* ==================== Daftar Siswa (Read-Only) ==================== */}
          <TabsContent value="siswa" className="mt-4 space-y-4">
            <div>
              <h2 className="text-lg font-bold text-gray-800">Daftar Siswa — {guruSubject}</h2>
              <p className="text-sm text-gray-500 mt-0.5">Daftar siswa yang mengikuti mata pelajaran {guruSubject} (hanya lihat)</p>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Cari siswa berdasarkan nama, username, atau kelas..." value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)} className="neu-input bg-transparent pl-10 h-11" />
            </div>
            <div className="clay-glass overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-emerald-50 to-cyan-50">
                    <TableHead className="text-xs font-bold w-14 text-center">NO</TableHead>
                    <TableHead className="text-xs font-bold">NAMA SISWA</TableHead>
                    <TableHead className="text-xs font-bold">KELAS</TableHead>
                    <TableHead className="text-xs font-bold">USERNAME</TableHead>
                    <TableHead className="text-xs font-bold">STATUS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center text-gray-400 py-8">Tidak ada data siswa untuk mata pelajaran {guruSubject}</TableCell></TableRow>
                  ) : (
                    filteredStudents.map((s, idx) => (
                      <TableRow key={s.id} className="hover:bg-emerald-50/40 transition-colors">
                        <TableCell className="text-sm text-center font-medium text-gray-600">{idx + 1}</TableCell>
                        <TableCell className="text-sm font-semibold text-gray-800">{s.name}</TableCell>
                        <TableCell><Badge variant="secondary" className="text-xs">{s.class || '-'}</Badge></TableCell>
                        <TableCell className="text-sm text-gray-600 font-mono">{s.username}</TableCell>
                        <TableCell>{s.isActive ? <span className="badge-active">Aktif</span> : <Badge variant="secondary" className="text-xs">Nonaktif</Badge>}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* ==================== Rekap Hasil ==================== */}
          <TabsContent value="hasil" className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-800">Rekap Hasil Ujian — {guruSubject}</h2>
                <p className="text-xs text-gray-500">Hanya menampilkan hasil ujian mata pelajaran {guruSubject}</p>
              </div>
              <Button onClick={() => handleExportResults(resultExamFilter)} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs gap-1.5" disabled={filteredResults.length === 0}>
                <Download className="h-3.5 w-3.5" />Export CSV
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="relative sm:col-span-5">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input placeholder="Cari nama siswa..." value={resultSearch} onChange={(e) => setResultSearch(e.target.value)} className="neu-input bg-transparent pl-10 h-11" />
              </div>
              <div className="sm:col-span-4">
                <Select value={resultExamFilter} onValueChange={setResultExamFilter}>
                  <SelectTrigger className="neu-input bg-transparent h-11 text-sm"><SelectValue placeholder="Filter Paket Ujian" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Paket Ujian</SelectItem>
                    {exams.map((exam) => (<SelectItem key={exam.id} value={exam.id}>{exam.title}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-3">
                <div className="flex bg-gray-100 rounded-xl p-1 h-11 items-center gap-1">
                  <button onClick={() => setResultGroupMode('grouped')} className={`flex-1 text-xs font-semibold py-2 rounded-lg transition-all ${resultGroupMode === 'grouped' ? 'bg-white shadow-sm text-emerald-600' : 'text-gray-500'}`}>Per Paket</button>
                  <button onClick={() => setResultGroupMode('flat')} className={`flex-1 text-xs font-semibold py-2 rounded-lg transition-all ${resultGroupMode === 'flat' ? 'bg-white shadow-sm text-emerald-600' : 'text-gray-500'}`}>Semua</button>
                </div>
              </div>
            </div>

            {resultGroupMode === 'flat' ? (
              <div className="clay-glass overflow-hidden">
                <Table>
                  <TableHeader><TableRow className="bg-gray-50/80"><TableHead className="text-xs font-bold">NO</TableHead><TableHead className="text-xs font-bold">NAMA</TableHead><TableHead className="text-xs font-bold">UJIAN</TableHead><TableHead className="text-xs font-bold">KELAS</TableHead><TableHead className="text-xs font-bold">NILAI</TableHead><TableHead className="text-xs font-bold">STATUS</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {filteredResults.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center text-gray-400 py-8">Belum ada hasil ujian</TableCell></TableRow>
                    ) : filteredResults.map((r, idx) => (
                      <TableRow key={r.id}>
                        <TableCell className="text-sm">{idx + 1}</TableCell>
                        <TableCell className="text-sm font-medium">{r.user.name}</TableCell>
                        <TableCell className="text-sm">{r.exam.title}</TableCell>
                        <TableCell><Badge variant="secondary" className="text-xs">{r.user.class || '-'}</Badge></TableCell>
                        <TableCell><span className={`font-bold text-sm ${r.score !== null && r.score >= 70 ? 'text-green-600' : 'text-red-600'}`}>{r.score ?? '-'}</span></TableCell>
                        <TableCell><Badge className={`text-xs ${r.score !== null && r.score >= 70 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{r.score !== null && r.score >= 70 ? 'Lulus' : 'Tidak Lulus'}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.keys(groupedResults).length === 0 ? (
                  <div className="clay p-12 text-center"><BarChart3 className="h-10 w-10 text-gray-300 mx-auto mb-2" /><p className="text-sm text-gray-400">Belum ada hasil ujian</p></div>
                ) : (
                  Object.entries(groupedResults).map(([examId, examResults]) => {
                    const examInfo = exams.find(e => e.id === examId)
                    const avgScore = examResults.length > 0 ? Math.round(examResults.reduce((sum, r) => sum + (r.score || 0), 0) / examResults.length) : 0
                    const passCount = examResults.filter(r => r.score !== null && r.score >= 70).length
                    return (
                      <motion.div key={examId} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <div className="clay-glass overflow-hidden">
                          <div className="bg-gradient-to-r from-emerald-50 to-cyan-50 px-5 py-3 flex items-center justify-between">
                            <div>
                              <h3 className="font-bold text-gray-800 text-sm">{examInfo?.title || 'Ujian'}</h3>
                              <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                                <span>{examResults.length} peserta</span>
                                <span>• Rata-rata: <span className="font-bold text-emerald-600">{avgScore}</span></span>
                                <span>• Lulus: <span className="font-bold text-green-600">{passCount}</span>/{examResults.length}</span>
                              </div>
                            </div>
                            <Button size="sm" variant="outline" className="h-7 text-[11px] rounded-lg gap-1" onClick={() => handleExportResults(examId)}><Download className="h-3 w-3" />Export</Button>
                          </div>
                          <Table>
                            <TableHeader><TableRow><TableHead className="text-xs font-bold w-12">NO</TableHead><TableHead className="text-xs font-bold">NAMA SISWA</TableHead><TableHead className="text-xs font-bold">KELAS</TableHead><TableHead className="text-xs font-bold">NILAI</TableHead><TableHead className="text-xs font-bold">STATUS</TableHead></TableRow></TableHeader>
                            <TableBody>
                              {examResults.map((r, idx) => (
                                <TableRow key={r.id}>
                                  <TableCell className="text-sm">{idx + 1}</TableCell>
                                  <TableCell className="text-sm font-medium">{r.user.name}</TableCell>
                                  <TableCell><Badge variant="secondary" className="text-xs">{r.user.class || '-'}</Badge></TableCell>
                                  <TableCell><span className={`font-bold text-sm ${r.score !== null && r.score >= 70 ? 'text-green-600' : 'text-red-600'}`}>{r.score ?? '-'}</span></TableCell>
                                  <TableCell><Badge className={`text-xs ${r.score !== null && r.score >= 70 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{r.score !== null && r.score >= 70 ? 'Lulus' : 'Tidak Lulus'}</Badge></TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </motion.div>
                    )
                  })
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Dialog */}
      <Dialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Konfirmasi Hapus</DialogTitle><DialogDescription>Apakah Anda yakin ingin menghapus &quot;{deleteDialog?.name}&quot;? Tindakan ini tidak dapat dibatalkan.</DialogDescription></DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteDialog(null)} className="rounded-xl">Batal</Button>
            <Button onClick={deleteDialog?.type === 'exam' ? handleDeleteExam : handleDeleteQuestion} className="bg-red-500 hover:bg-red-600 text-white rounded-xl">Hapus</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Question Generation Dialog */}
      <Dialog open={showAIDialog} onOpenChange={setShowAIDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              Buat Soal dengan AI
            </DialogTitle>
            <DialogDescription>
              Gunakan kecerdasan buatan untuk membuat soal pilihan ganda secara otomatis. Jawaban benar akan bervariasi dan pembahasan dibuat rinci.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Mata Pelajaran</Label>
              <Input
                value={aiSubject}
                onChange={(e) => setAiSubject(e.target.value)}
                placeholder="Contoh: Matematika, Bahasa Indonesia..."
                className="neu-input bg-transparent"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Topik / Materi</Label>
              <Input
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                placeholder="Contoh: Integral, Majas, Sistem Persamaan..."
                className="neu-input bg-transparent"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Jumlah Soal</Label>
                <Input
                  type="number"
                  value={aiCount}
                  onChange={(e) => setAiCount(Math.max(1, parseInt(e.target.value) || 5))}
                  min={1}
                  max={50}
                  className="neu-input bg-transparent"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Tingkat Kesulitan</Label>
                <Select value={aiDifficulty} onValueChange={setAiDifficulty}>
                  <SelectTrigger className="neu-input bg-transparent">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mudah">Mudah</SelectItem>
                    <SelectItem value="sedang">Sedang</SelectItem>
                    <SelectItem value="sulit">Sulit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="bg-violet-50 border border-violet-200 rounded-xl p-3 text-xs text-violet-700">
              <div className="flex items-start gap-2">
                <Wand2 className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold mb-1">AI akan membuat soal dengan:</p>
                  <ul className="list-disc list-inside space-y-0.5 text-violet-600">
                    <li>Jawaban benar bervariasi (A, B, C, D, E)</li>
                    <li>Pembahasan rinci langkah demi langkah</li>
                    <li>Sesuai kurikulum Indonesia</li>
                    <li>Jumlah soal tidak dibatasi (maks 50 per kali)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowAIDialog(false)} className="rounded-xl">
              Batalkan
            </Button>
            <Button
              onClick={handleAIGenerate}
              disabled={aiGenerating || !aiTopic.trim()}
              className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-xl gap-2"
            >
              {aiGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Membuat Soal...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Buat {aiCount} Soal
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
