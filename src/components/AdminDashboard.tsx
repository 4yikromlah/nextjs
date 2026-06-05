'use client'

import { useEffect, useState, useCallback, useRef, type ChangeEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutGrid, Users, BarChart3, Lock, Plus, Pencil, Trash2, Search,
  Eye, ToggleLeft, ToggleRight, Loader2, FileText, UserCheck,
  Upload
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
import KelolaGuru from './KelolaGuru'
import KelolaSiswa from './KelolaSiswa'

interface Stats {
  totalExams: number
  totalStudents: number
  totalQuestions: number
  activeExams: number
  completedSessions: number
  averageScore: number
}

interface Exam {
  id: string
  title: string
  description: string | null
  duration: number
  isActive: boolean
  createdBy: string
  createdAt: string
  creator?: { name: string }
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
  exam: { title: string }
  user: { name: string; username: string; class: string | null }
}

export default function AdminDashboard() {
  const { currentUser } = useAppStore()
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

  // Questions state
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [showQuestionForm, setShowQuestionForm] = useState(false)
  const [qText, setQText] = useState('')
  const [qA, setQA] = useState('')
  const [qB, setQB] = useState('')
  const [qC, setQC] = useState('')
  const [qD, setQD] = useState('')
  const [qE, setQE] = useState('')
  const [qCorrect, setQCorrect] = useState('A')
  const [qExplanation, setQExplanation] = useState('')

  // Results state
  const [results, setResults] = useState<Result[]>([])
  const [resultSearch, setResultSearch] = useState('')

  // Delete dialog
  const [deleteDialog, setDeleteDialog] = useState<{ type: 'exam' | 'question'; id: string; name: string } | null>(null)

  // Word import
  const [importing, setImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/stats')
      if (res.ok) setStats(await res.json())
    } catch { /* ignore */ }
  }, [])

  const fetchExams = useCallback(async () => {
    setExamLoading(true)
    try {
      const res = await fetch('/api/exams')
      if (res.ok) setExams(await res.json())
    } catch { /* ignore */ }
    setExamLoading(false)
  }, [])

  const fetchQuestions = useCallback(async (examId: string) => {
    try {
      const res = await fetch(`/api/exams/${examId}/questions`)
      if (res.ok) setQuestions(await res.json())
    } catch { /* ignore */ }
  }, [])

  const fetchResults = useCallback(async () => {
    try {
      const res = await fetch('/api/results')
      if (res.ok) setResults(await res.json())
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchStats(), fetchExams(), fetchResults()])
    }
    loadData()
  }, [])

  // Exam CRUD
  const handleSaveExam = async () => {
    if (!examTitle.trim()) { toast.error('Judul ujian harus diisi'); return }
    try {
      if (editingExam) {
        const res = await fetch(`/api/exams/${editingExam.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: examTitle, description: examDesc, duration: examDuration }),
        })
        if (res.ok) { toast.success('Ujian berhasil diperbarui'); fetchExams(); fetchStats() }
        else toast.error('Gagal memperbarui ujian')
      } else {
        const res = await fetch('/api/exams', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: examTitle, description: examDesc, duration: examDuration, createdBy: currentUser?.id }),
        })
        if (res.ok) { toast.success('Ujian berhasil dibuat'); fetchExams(); fetchStats() }
        else toast.error('Gagal membuat ujian')
      }
      resetExamForm()
    } catch { toast.error('Terjadi kesalahan') }
  }

  const resetExamForm = () => {
    setShowExamForm(false)
    setEditingExam(null)
    setExamTitle('')
    setExamDesc('')
    setExamDuration(60)
  }

  const handleToggleExam = async (exam: Exam) => {
    try {
      const res = await fetch(`/api/exams/${exam.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !exam.isActive }),
      })
      if (res.ok) {
        toast.success(exam.isActive ? 'Ujian dinonaktifkan' : 'Ujian diaktifkan')
        fetchExams()
      }
    } catch { toast.error('Gagal mengubah status') }
  }

  const handleDeleteExam = async () => {
    if (!deleteDialog) return
    try {
      const res = await fetch(`/api/exams/${deleteDialog.id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Ujian berhasil dihapus')
        fetchExams()
        fetchStats()
        if (selectedExam?.id === deleteDialog.id) setSelectedExam(null)
      }
    } catch { toast.error('Gagal menghapus ujian') }
    setDeleteDialog(null)
  }

  const handleEditExam = (exam: Exam) => {
    setEditingExam(exam)
    setExamTitle(exam.title)
    setExamDesc(exam.description || '')
    setExamDuration(exam.duration)
    setShowExamForm(true)
  }

  const handleSelectExam = (exam: Exam) => {
    setSelectedExam(exam)
    fetchQuestions(exam.id)
  }

  // Question CRUD
  const handleSaveQuestion = async () => {
    if (!qText || !qA || !qB || !qC || !qD || !qE || !qCorrect) {
      toast.error('Semua field soal harus diisi')
      return
    }
    if (!selectedExam) return
    try {
      const res = await fetch(`/api/exams/${selectedExam.id}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionText: qText, optionA: qA, optionB: qB, optionC: qC, optionD: qD, optionE: qE, correctAnswer: qCorrect, explanation: qExplanation }),
      })
      if (res.ok) {
        toast.success('Soal berhasil ditambahkan')
        fetchQuestions(selectedExam.id)
        fetchStats()
        resetQuestionForm()
      } else toast.error('Gagal menambahkan soal')
    } catch { toast.error('Terjadi kesalahan') }
  }

  const resetQuestionForm = () => {
    setShowQuestionForm(false)
    setQText('')
    setQA('')
    setQB('')
    setQC('')
    setQD('')
    setQE('')
    setQCorrect('A')
    setQExplanation('')
  }

  const handleDeleteQuestion = async () => {
    if (!deleteDialog) return
    try {
      const res = await fetch(`/api/questions/${deleteDialog.id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Soal berhasil dihapus')
        if (selectedExam) fetchQuestions(selectedExam.id)
        fetchStats()
      }
    } catch { toast.error('Gagal menghapus soal') }
    setDeleteDialog(null)
  }

  // Word import handler
  const handleWordImport = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedExam) return

    setImporting(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('examId', selectedExam.id)

    try {
      const res = await fetch('/api/import/word', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(`${data.count || 0} soal berhasil diimpor dari Word`)
        fetchQuestions(selectedExam.id)
        fetchStats()
      } else {
        toast.error(data.error || 'Gagal mengimpor file Word')
      }
    } catch {
      toast.error('Gagal mengimpor file')
    } finally {
      setImporting(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const filteredResults = results.filter((r) =>
    r.exam.title.toLowerCase().includes(resultSearch.toLowerCase()) ||
    r.user.name.toLowerCase().includes(resultSearch.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-[#f0f4f8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
            <div className="neu-flat p-5">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl bg-blue-100 flex items-center justify-center">
                  <LayoutGrid className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">TOTAL PAKET UJIAN</p>
                  <p className="text-2xl font-bold text-gray-800">{stats?.totalExams ?? 0}</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="neu-flat p-5">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <Users className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">TOTAL UJIAN DIKUTI</p>
                  <p className="text-2xl font-bold text-gray-800">{stats?.completedSessions ?? 0}</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="neu-flat p-5">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl bg-amber-100 flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-amber-600" />
                </div>
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
                <div className="h-11 w-11 rounded-xl bg-rose-100 flex items-center justify-center">
                  <Lock className="h-5 w-5 text-rose-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">PASSWORD DEFAULT</p>
                  <p className="text-2xl font-bold text-gray-800">admin123</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white/80 backdrop-blur-sm shadow-sm rounded-xl h-auto p-1.5 gap-1">
            <TabsTrigger value="ujian" className="rounded-lg px-4 py-2 text-sm data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md">
              <FileText className="h-4 w-4 mr-2" />
              Kelola Ujian & Soal
            </TabsTrigger>
            <TabsTrigger value="guru" className="rounded-lg px-4 py-2 text-sm data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md">
              <UserCheck className="h-4 w-4 mr-2" />
              Kelola Guru
            </TabsTrigger>
            <TabsTrigger value="siswa" className="rounded-lg px-4 py-2 text-sm data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md">
              <Users className="h-4 w-4 mr-2" />
              Kelola Siswa
            </TabsTrigger>
            <TabsTrigger value="hasil" className="rounded-lg px-4 py-2 text-sm data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md">
              <BarChart3 className="h-4 w-4 mr-2" />
              Hasil Ujian
            </TabsTrigger>
          </TabsList>

          {/* ==================== Kelola Ujian & Soal ==================== */}
          <TabsContent value="ujian" className="mt-4 space-y-4">
            {/* Header row */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">Kelola Ujian & Soal</h2>
              <Button onClick={() => { resetExamForm(); setShowExamForm(true) }} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md">
                <Plus className="h-4 w-4 mr-2" />
                Tambah Ujian
              </Button>
            </div>

            {/* Exam Form */}
            <AnimatePresence>
              {showExamForm && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <Card className="clay-glass border-0">
                    <CardHeader>
                      <CardTitle className="text-base">{editingExam ? 'Edit Ujian' : 'Tambah Ujian Baru'}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Judul Ujian</Label>
                          <Input value={examTitle} onChange={(e) => setExamTitle(e.target.value)} placeholder="Contoh: Ujian Matematika XII" className="neu-input bg-transparent" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Durasi (menit)</Label>
                          <Input type="number" value={examDuration} onChange={(e) => setExamDuration(parseInt(e.target.value) || 60)} className="neu-input bg-transparent" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Deskripsi</Label>
                        <Textarea value={examDesc} onChange={(e) => setExamDesc(e.target.value)} placeholder="Deskripsi ujian (opsional)" className="neu-input bg-transparent min-h-[80px]" />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleSaveExam} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl">
                          {editingExam ? 'Update Ujian' : 'Simpan Ujian'}
                        </Button>
                        <Button onClick={resetExamForm} variant="outline" className="rounded-xl">Batalkan</Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Two-column layout: Exam cards (left) + Preview (right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Left Column: Exam Cards stacked vertically */}
              <div className="lg:col-span-5 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="h-4 w-4 text-blue-500" />
                  <h3 className="text-sm font-bold text-gray-700">DAFTAR UJIAN</h3>
                </div>

                {examLoading ? (
                  <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-blue-500" /></div>
                ) : exams.length === 0 ? (
                  <div className="clay p-8 text-center">
                    <FileText className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">Belum ada ujian</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[calc(100vh-320px)] overflow-y-auto custom-scrollbar pr-1">
                    {exams.map((exam) => (
                      <motion.div key={exam.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} layout>
                        <div
                          className={`clay p-4 cursor-pointer transition-all hover:shadow-lg ${selectedExam?.id === exam.id ? 'ring-2 ring-blue-400 shadow-lg' : ''}`}
                          onClick={() => handleSelectExam(exam)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-bold text-gray-800 text-sm leading-tight flex-1">{exam.title}</h4>
                            <div className="flex items-center gap-1 ml-2 shrink-0">
                              {exam.isActive ? (
                                <span className="badge-active text-[10px]">Aktif</span>
                              ) : (
                                <Badge variant="secondary" className="text-[10px] px-2">Nonaktif</Badge>
                              )}
                            </div>
                          </div>
                          {exam.description && <p className="text-xs text-gray-500 mb-2 line-clamp-2">{exam.description}</p>}
                          <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                            <span className="flex items-center gap-1"><FileText className="h-3 w-3" /> {exam._count?.questions ?? 0} soal</span>
                            <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {exam._count?.sessions ?? 0} peserta</span>
                            <span>{exam.duration} mnt</span>
                          </div>
                          <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <Button size="sm" variant="outline" className="h-7 text-[11px] rounded-lg px-2" onClick={() => handleToggleExam(exam)}>
                              {exam.isActive ? <ToggleRight className="h-3 w-3 mr-1 text-green-500" /> : <ToggleLeft className="h-3 w-3 mr-1" />}
                              {exam.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                            </Button>
                            <Button size="sm" variant="outline" className="h-7 w-7 p-0 rounded-lg" onClick={() => handleEditExam(exam)}>
                              <Pencil className="h-3 w-3 text-blue-500" />
                            </Button>
                            <Button size="sm" variant="outline" className="h-7 w-7 p-0 rounded-lg hover:bg-red-50" onClick={() => setDeleteDialog({ type: 'exam', id: exam.id, name: exam.title })}>
                              <Trash2 className="h-3 w-3 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Preview Panel */}
              <div className="lg:col-span-7">
                {!selectedExam ? (
                  <div className="clay p-12 text-center h-full min-h-[300px] flex flex-col items-center justify-center">
                    <Eye className="h-12 w-12 text-gray-300 mb-3" />
                    <h3 className="font-semibold text-gray-400 text-sm">Pilih Ujian untuk Melihat Preview</h3>
                    <p className="text-xs text-gray-400 mt-1">Klik salah satu kartu ujian di sebelah kiri</p>
                  </div>
                ) : (
                  <div className="clay-glass p-5 border-0 space-y-4">
                    {/* Preview Header */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-gray-800 text-base">{selectedExam.title}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">{selectedExam.description || 'Tidak ada deskripsi'}</p>
                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                          <span><FileText className="h-3 w-3 inline mr-1" />{questions.length} soal</span>
                          <span>{selectedExam.duration} menit</span>
                          <span>{selectedExam.isActive ? '🟢 Aktif' : '🔴 Nonaktif'}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={() => setShowQuestionForm(true)} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs">
                          <Plus className="h-3.5 w-3.5 mr-1" /> Tambah Soal
                        </Button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".docx,.doc"
                          onChange={handleWordImport}
                          className="hidden"
                        />
                        <Button
                          onClick={() => fileInputRef.current?.click()}
                          disabled={importing}
                          size="sm"
                          variant="outline"
                          className="rounded-xl text-xs"
                        >
                          {importing ? (
                            <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                          ) : (
                            <Upload className="h-3.5 w-3.5 mr-1" />
                          )}
                          Import Word
                        </Button>
                      </div>
                    </div>

                    {/* Question Form */}
                    <AnimatePresence>
                      {showQuestionForm && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                          <div className="neo-glass p-5 space-y-4">
                            <h4 className="font-semibold text-gray-700 text-sm">Tambah Soal Baru</h4>
                            <div className="space-y-2">
                              <Label className="text-xs font-medium">Teks Soal</Label>
                              <Textarea value={qText} onChange={(e) => setQText(e.target.value)} placeholder="Tulis soal di sini..." className="neu-input bg-transparent min-h-[80px]" />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {[
                                { label: 'Opsi A', value: qA, set: setQA },
                                { label: 'Opsi B', value: qB, set: setQB },
                                { label: 'Opsi C', value: qC, set: setQC },
                                { label: 'Opsi D', value: qD, set: setQD },
                                { label: 'Opsi E', value: qE, set: setQE },
                              ].map((opt) => (
                                <div key={opt.label} className="space-y-1">
                                  <Label className="text-xs font-medium">{opt.label}</Label>
                                  <Input value={opt.value} onChange={(e) => opt.set(e.target.value)} className="neu-input bg-transparent h-9 text-sm" />
                                </div>
                              ))}
                              <div className="space-y-1">
                                <Label className="text-xs font-medium">Jawaban Benar</Label>
                                <Select value={qCorrect} onValueChange={setQCorrect}>
                                  <SelectTrigger className="neu-input bg-transparent h-9 text-sm">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {['A', 'B', 'C', 'D', 'E'].map((o) => (
                                      <SelectItem key={o} value={o}>Opsi {o}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs font-medium">Pembahasan (opsional)</Label>
                              <Textarea value={qExplanation} onChange={(e) => setQExplanation(e.target.value)} placeholder="Pembahasan jawaban..." className="neu-input bg-transparent min-h-[60px]" />
                            </div>
                            <div className="flex gap-2">
                              <Button onClick={handleSaveQuestion} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl">Simpan Soal</Button>
                              <Button onClick={resetQuestionForm} size="sm" variant="outline" className="rounded-xl">Batalkan</Button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Questions List */}
                    {questions.length === 0 ? (
                      <div className="text-center py-8">
                        <FileText className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-400">Belum ada soal</p>
                        <p className="text-xs text-gray-400">Tambahkan soal manual atau import dari file Word</p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[calc(100vh-520px)] overflow-y-auto custom-scrollbar pr-1">
                        {questions.map((q, idx) => (
                          <div key={q.id} className="neu-flat p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-800 mb-1">{idx + 1}. {q.questionText}</p>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 text-xs text-gray-600">
                                  <span>A. {q.optionA}</span>
                                  <span>B. {q.optionB}</span>
                                  <span>C. {q.optionC}</span>
                                  <span>D. {q.optionD}</span>
                                  <span>E. {q.optionE}</span>
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge className="bg-green-100 text-green-700 text-xs">Jawaban: {q.correctAnswer}</Badge>
                                  {q.explanation && (
                                    <Badge variant="outline" className="text-xs text-gray-500">Pembahasan tersedia</Badge>
                                  )}
                                </div>
                              </div>
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-400 hover:text-red-600" onClick={() => setDeleteDialog({ type: 'question', id: q.id, name: `Soal ${idx + 1}` })}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* ==================== Kelola Guru ==================== */}
          <TabsContent value="guru" className="mt-4">
            <KelolaGuru />
          </TabsContent>

          {/* ==================== Kelola Siswa ==================== */}
          <TabsContent value="siswa" className="mt-4">
            <KelolaSiswa />
          </TabsContent>

          {/* ==================== Hasil Ujian ==================== */}
          <TabsContent value="hasil" className="mt-4 space-y-4">
            <h2 className="text-lg font-bold text-gray-800">Hasil Ujian</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari hasil berdasarkan nama siswa atau ujian..."
                value={resultSearch}
                onChange={(e) => setResultSearch(e.target.value)}
                className="neu-input bg-transparent pl-10 h-11"
              />
            </div>
            <div className="clay-glass overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/80">
                    <TableHead className="text-xs font-bold">NO</TableHead>
                    <TableHead className="text-xs font-bold">NAMA</TableHead>
                    <TableHead className="text-xs font-bold">UJIAN</TableHead>
                    <TableHead className="text-xs font-bold">KELAS</TableHead>
                    <TableHead className="text-xs font-bold">NILAI</TableHead>
                    <TableHead className="text-xs font-bold">STATUS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredResults.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center text-gray-400 py-8">Belum ada hasil ujian</TableCell></TableRow>
                  ) : (
                    filteredResults.map((r, idx) => (
                      <TableRow key={r.id}>
                        <TableCell className="text-sm">{idx + 1}</TableCell>
                        <TableCell className="text-sm font-medium">{r.user.name}</TableCell>
                        <TableCell className="text-sm">{r.exam.title}</TableCell>
                        <TableCell><Badge variant="secondary" className="text-xs">{r.user.class || '-'}</Badge></TableCell>
                        <TableCell>
                          <span className={`font-bold text-sm ${r.score !== null && r.score >= 70 ? 'text-green-600' : 'text-red-600'}`}>
                            {r.score ?? '-'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge className={`text-xs ${r.score !== null && r.score >= 70 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {r.score !== null && r.score >= 70 ? 'Lulus' : 'Tidak Lulus'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus &quot;{deleteDialog?.name}&quot;? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteDialog(null)} className="rounded-xl">Batal</Button>
            <Button onClick={deleteDialog?.type === 'exam' ? handleDeleteExam : handleDeleteQuestion} className="bg-red-500 hover:bg-red-600 text-white rounded-xl">Hapus</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
