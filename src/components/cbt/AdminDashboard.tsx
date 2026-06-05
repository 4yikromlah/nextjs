'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, FileText, Users, BarChart3, Edit, Trash2, ToggleLeft, ToggleRight, Upload, BookOpen, ChevronRight, X, Check, AlertCircle, Clock, Eye } from 'lucide-react'
import { useAppStore, ExamData, QuestionData } from '@/lib/store'
import { toast } from 'sonner'

export default function AdminDashboard() {
  const { user, adminTab, setAdminTab, selectedExam, setSelectedExam } = useAppStore()
  const [exams, setExams] = useState<ExamData[]>([])
  const [questions, setQuestions] = useState<QuestionData[]>([])
  const [students, setStudents] = useState<Array<{ id: string; name: string; email: string; class: string | null; createdAt: string }>>([])
  const [sessions, setSessions] = useState<Array<Record<string, unknown>>>([])
  const [stats, setStats] = useState({ totalExams: 0, totalStudents: 0, totalQuestions: 0, activeExams: 0, completedSessions: 0, averageScore: 0 })
  const [loading, setLoading] = useState(false)

  // Modal states
  const [showAddExam, setShowAddExam] = useState(false)
  const [showAddQuestion, setShowAddQuestion] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [showEditQuestion, setShowEditQuestion] = useState<QuestionData | null>(null)
  const [showResultDetail, setShowResultDetail] = useState<Record<string, unknown> | null>(null)

  // Form states
  const [examForm, setExamForm] = useState({ title: '', description: '', duration: 60 })
  const [questionForm, setQuestionForm] = useState({ questionText: '', optionA: '', optionB: '', optionC: '', optionD: '', optionE: '', correctAnswer: 'A', explanation: '' })
  const [importFile, setImportFile] = useState<File | null>(null)

  const loadExams = useCallback(async () => {
    try {
      const res = await fetch('/api/exams')
      const data = await res.json()
      setExams(data)
    } catch { toast.error('Gagal memuat data ujian') }
  }, [])

  const loadStats = useCallback(async () => {
    try {
      const res = await fetch('/api/stats')
      const data = await res.json()
      setStats(data)
    } catch { /* silent */ }
  }, [])

  const loadStudents = useCallback(async () => {
    try {
      const res = await fetch('/api/users?role=SISWA')
      const data = await res.json()
      setStudents(data)
    } catch { /* silent */ }
  }, [])

  const loadSessions = useCallback(async () => {
    try {
      const res = await fetch('/api/sessions?status=COMPLETED')
      const data = await res.json()
      setSessions(data)
    } catch { /* silent */ }
  }, [])

  const loadQuestions = useCallback(async (examId: string) => {
    try {
      const res = await fetch(`/api/exams/${examId}/questions`)
      const data = await res.json()
      setQuestions(data)
    } catch { toast.error('Gagal memuat soal') }
  }, [])

  useEffect(() => {
    loadExams()
    loadStats()
  }, [loadExams, loadStats])

  useEffect(() => {
    if (adminTab === 'students') loadStudents()
    if (adminTab === 'results') loadSessions()
  }, [adminTab, loadStudents, loadSessions])

  useEffect(() => {
    if (selectedExam) loadQuestions(selectedExam.id)
  }, [selectedExam, loadQuestions])

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!examForm.title) { toast.error('Judul ujian harus diisi'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...examForm, createdBy: user?.id })
      })
      if (res.ok) {
        toast.success('Ujian berhasil dibuat')
        setShowAddExam(false)
        setExamForm({ title: '', description: '', duration: 60 })
        loadExams()
        loadStats()
      } else {
        const data = await res.json()
        toast.error(data.error)
      }
    } catch { toast.error('Gagal membuat ujian') }
    finally { setLoading(false) }
  }

  const handleToggleExam = async (exam: ExamData) => {
    try {
      const res = await fetch(`/api/exams/${exam.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !exam.isActive })
      })
      if (res.ok) {
        toast.success(exam.isActive ? 'Ujian dinonaktifkan' : 'Ujian diaktifkan')
        loadExams()
        loadStats()
      }
    } catch { toast.error('Gagal mengubah status') }
  }

  const handleDeleteExam = async (id: string) => {
    if (!confirm('Hapus ujian ini? Semua soal dan data terkait akan terhapus.')) return
    try {
      const res = await fetch(`/api/exams/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Ujian berhasil dihapus')
        if (selectedExam?.id === id) setSelectedExam(null)
        loadExams()
        loadStats()
      }
    } catch { toast.error('Gagal menghapus ujian') }
  }

  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedExam) return
    if (!questionForm.questionText || !questionForm.optionA || !questionForm.optionB) {
      toast.error('Soal dan minimal pilihan A-B harus diisi'); return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/exams/${selectedExam.id}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(questionForm)
      })
      if (res.ok) {
        toast.success('Soal berhasil ditambahkan')
        setShowAddQuestion(false)
        setQuestionForm({ questionText: '', optionA: '', optionB: '', optionC: '', optionD: '', optionE: '', correctAnswer: 'A', explanation: '' })
        loadQuestions(selectedExam.id)
        loadStats()
      } else {
        const data = await res.json()
        toast.error(data.error)
      }
    } catch { toast.error('Gagal menambah soal') }
    finally { setLoading(false) }
  }

  const handleUpdateQuestion = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!showEditQuestion || !selectedExam) return
    setLoading(true)
    try {
      const res = await fetch(`/api/questions/${showEditQuestion.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(questionForm)
      })
      if (res.ok) {
        toast.success('Soal berhasil diperbarui')
        setShowEditQuestion(null)
        loadQuestions(selectedExam.id)
      }
    } catch { toast.error('Gagal memperbarui soal') }
    finally { setLoading(false) }
  }

  const handleDeleteQuestion = async (id: string) => {
    if (!selectedExam || !confirm('Hapus soal ini?')) return
    try {
      const res = await fetch(`/api/questions/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Soal berhasil dihapus')
        loadQuestions(selectedExam.id)
        loadStats()
      }
    } catch { toast.error('Gagal menghapus soal') }
  }

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!importFile || !selectedExam) { toast.error('Pilih file terlebih dahulu'); return }
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', importFile)
      const res = await fetch(`/api/exams/${selectedExam.id}/import`, { method: 'POST', body: formData })
      const data = await res.json()
      if (res.ok) {
        toast.success(`${data.count} soal berhasil diimport`)
        setShowImport(false)
        setImportFile(null)
        loadQuestions(selectedExam.id)
        loadStats()
      } else {
        toast.error(data.error)
      }
    } catch { toast.error('Gagal mengimport file') }
    finally { setLoading(false) }
  }

  const tabs = [
    { id: 'exams', label: 'Kelola Ujian & Soal', icon: FileText },
    { id: 'students', label: 'Kelola Siswa', icon: Users },
    { id: 'results', label: 'Hasil Ujian', icon: BarChart3 },
  ]

  return (
    <div className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full">
      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setAdminTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              adminTab === tab.id
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
        {adminTab === 'exams' && (
          <motion.div key="exams" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Total Ujian', value: stats.totalExams, icon: FileText, gradient: 'bg-gradient-primary' },
                { label: 'Ujian Aktif', value: stats.activeExams, icon: Check, gradient: 'bg-gradient-success' },
                { label: 'Total Soal', value: stats.totalQuestions, icon: BookOpen, gradient: 'bg-gradient-warning' },
                { label: 'Total Siswa', value: stats.totalStudents, icon: Users, gradient: 'bg-gradient-danger' },
              ].map((s, i) => (
                <motion.div
                  key={s.label}
                  className="clay-glass p-4 relative overflow-hidden"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <div className={`w-10 h-10 rounded-xl ${s.gradient} flex items-center justify-center mb-3`}>
                    <s.icon className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </motion.div>
              ))}
            </div>

            {/* Two Panel Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
              {/* Left: Exam List */}
              <div className="lg:col-span-2 clay-glass p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-lg">Daftar Paket Ujian</h3>
                  <button onClick={() => setShowAddExam(true)} className="clay-btn px-4 py-2 bg-gradient-primary text-white text-sm flex items-center gap-1">
                    <Plus className="w-4 h-4" /> Tambah Ujian
                  </button>
                </div>
                <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                  {exams.map((exam, i) => (
                    <motion.div
                      key={exam.id}
                      className={`neo-glass p-4 cursor-pointer transition-all ${selectedExam?.id === exam.id ? 'ring-2 ring-indigo-500' : ''}`}
                      onClick={() => setSelectedExam(exam)}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: i * 0.05 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold truncate">{exam.title}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold text-white badge-active ${exam.isActive ? 'bg-gradient-success' : 'bg-gray-400'}`}>
                              {exam.isActive ? 'AKTIF' : 'NONAKTIF'}
                            </span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <FileText className="w-3 h-3" /> {exam._count?.questions || 0} soal
                            </span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {exam.duration} menit
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={e => { e.stopPropagation(); handleToggleExam(exam) }} className="p-1.5 rounded-lg hover:bg-indigo-500/10 transition-colors" title={exam.isActive ? 'Nonaktifkan' : 'Aktifkan'}>
                            {exam.isActive ? <ToggleRight className="w-5 h-5 text-emerald-500" /> : <ToggleLeft className="w-5 h-5 text-gray-400" />}
                          </button>
                          <button onClick={e => { e.stopPropagation(); handleDeleteExam(exam.id) }} className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors" title="Hapus">
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  {exams.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="w-12 h-12 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Belum ada ujian</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Questions or Empty */}
              <div className="lg:col-span-3 clay-glass p-4">
                {selectedExam ? (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-lg">{selectedExam.title}</h3>
                        <p className="text-xs text-muted-foreground">{selectedExam.description || 'Tanpa deskripsi'} • {selectedExam.duration} menit</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setShowImport(true)} className="clay-btn px-3 py-2 text-sm flex items-center gap-1 bg-gradient-warning text-white">
                          <Upload className="w-4 h-4" /> Import Word
                        </button>
                        <button onClick={() => setShowAddQuestion(true)} className="clay-btn px-3 py-2 text-sm flex items-center gap-1 bg-gradient-primary text-white">
                          <Plus className="w-4 h-4" /> Tambah Soal
                        </button>
                      </div>
                    </div>
                    <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar">
                      {questions.map((q, i) => (
                        <motion.div
                          key={q.id}
                          className="neo-glass p-4"
                          initial={{ y: 10, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: i * 0.03 }}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p className="font-medium mb-2">
                                <span className="text-indigo-500 mr-1">{i + 1}.</span>
                                {q.questionText}
                              </p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-sm">
                                {['A', 'B', 'C', 'D', 'E'].map(letter => (
                                  <span key={letter} className={`px-2 py-1 rounded-lg ${q.correctAnswer === letter ? 'bg-emerald-500/10 text-emerald-600 font-semibold' : 'text-muted-foreground'}`}>
                                    {letter}. {q[`option${letter}` as keyof QuestionData] as string}
                                    {q.correctAnswer === letter && <Check className="w-3 h-3 inline ml-1" />}
                                  </span>
                                ))}
                              </div>
                              {q.explanation && (
                                <p className="mt-2 text-xs text-muted-foreground bg-muted/50 p-2 rounded-lg">
                                  💡 {q.explanation}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={() => {
                                  setQuestionForm({
                                    questionText: q.questionText, optionA: q.optionA, optionB: q.optionB,
                                    optionC: q.optionC, optionD: q.optionD, optionE: q.optionE,
                                    correctAnswer: q.correctAnswer, explanation: q.explanation || ''
                                  })
                                  setShowEditQuestion(q)
                                }}
                                className="p-1.5 rounded-lg hover:bg-indigo-500/10"
                                title="Edit"
                              >
                                <Edit className="w-4 h-4 text-indigo-400" />
                              </button>
                              <button onClick={() => handleDeleteQuestion(q.id)} className="p-1.5 rounded-lg hover:bg-red-500/10" title="Hapus">
                                <Trash2 className="w-4 h-4 text-red-400" />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                      {questions.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-30" />
                          <p className="text-sm">Belum ada soal. Tambahkan atau import dari file Word.</p>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <BookOpen className="w-16 h-16 mb-4 opacity-20" />
                    <p className="text-center">Silakan pilih atau tambahkan paket ujian<br />di panel sebelah kiri</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {adminTab === 'students' && (
          <motion.div key="students" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div className="clay-glass p-4">
              <h3 className="font-bold text-lg mb-4">Daftar Siswa</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-2 font-semibold text-muted-foreground">No</th>
                      <th className="text-left py-3 px-2 font-semibold text-muted-foreground">Nama</th>
                      <th className="text-left py-3 px-2 font-semibold text-muted-foreground">Email</th>
                      <th className="text-left py-3 px-2 font-semibold text-muted-foreground">Kelas</th>
                      <th className="text-left py-3 px-2 font-semibold text-muted-foreground">Terdaftar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s, i) => (
                      <motion.tr key={s.id} className="border-b border-border/50 hover:bg-muted/30" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                        <td className="py-3 px-2">{i + 1}</td>
                        <td className="py-3 px-2 font-medium">{s.name}</td>
                        <td className="py-3 px-2 text-muted-foreground">{s.email}</td>
                        <td className="py-3 px-2"><span className="px-2 py-0.5 rounded-full text-xs bg-indigo-500/10 text-indigo-500 font-medium">{s.class || '-'}</span></td>
                        <td className="py-3 px-2 text-muted-foreground text-xs">{new Date(s.createdAt).toLocaleDateString('id-ID')}</td>
                      </motion.tr>
                    ))}
                    {students.length === 0 && (
                      <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">Belum ada siswa terdaftar</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {adminTab === 'results' && (
          <motion.div key="results" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div className="clay-glass p-4">
              <h3 className="font-bold text-lg mb-4">Hasil Ujian</h3>
              <div className="space-y-3">
                {sessions.map((session, i) => {
                  const s = session as Record<string, unknown>
                  const userData = s.user as Record<string, string> | undefined
                  const examData = s.exam as Record<string, unknown> | undefined
                  return (
                    <motion.div key={s.id as string} className="neo-glass p-4 flex items-center justify-between" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                      <div>
                        <p className="font-semibold">{userData?.name || '-'}</p>
                        <p className="text-sm text-muted-foreground">{examData?.title as string || '-'} • Kelas: {userData?.class || '-'}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-lg font-bold ${(s.score as number) >= 70 ? 'text-emerald-500' : (s.score as number) >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
                          {s.score as number}%
                        </span>
                        <button onClick={async () => {
                          const res = await fetch(`/api/sessions/${s.id}`)
                          const detail = await res.json()
                          setShowResultDetail(detail)
                        }} className="clay-btn p-2 text-indigo-500">
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  )
                })}
                {sessions.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">Belum ada hasil ujian</div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal: Add Exam */}
      <AnimatePresence>
        {showAddExam && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddExam(false)}>
            <motion.div className="clay-glass p-6 w-full max-w-md" initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">Tambah Ujian Baru</h3>
                <button onClick={() => setShowAddExam(false)} className="p-1 rounded-lg hover:bg-muted"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleCreateExam} className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Judul Ujian</label>
                  <input className="neu-input w-full" placeholder="Contoh: Ujian Matematika Kelas XII" value={examForm.title} onChange={e => setExamForm(f => ({ ...f, title: e.target.value }))} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Deskripsi</label>
                  <textarea className="neu-input w-full min-h-[80px] resize-none" placeholder="Deskripsi ujian (opsional)" value={examForm.description} onChange={e => setExamForm(f => ({ ...f, description: e.target.value }))} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Durasi (menit)</label>
                  <input type="number" className="neu-input w-full" value={examForm.duration} onChange={e => setExamForm(f => ({ ...f, duration: parseInt(e.target.value) || 60 }))} />
                </div>
                <button type="submit" disabled={loading} className="clay-btn w-full py-3 bg-gradient-primary text-white font-semibold disabled:opacity-50">
                  {loading ? 'Memproses...' : 'Buat Ujian'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal: Add/Edit Question */}
      <AnimatePresence>
        {(showAddQuestion || showEditQuestion) && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setShowAddQuestion(false); setShowEditQuestion(null) }}>
            <motion.div className="clay-glass p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto custom-scrollbar" initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">{showEditQuestion ? 'Edit Soal' : 'Tambah Soal Baru'}</h3>
                <button onClick={() => { setShowAddQuestion(false); setShowEditQuestion(null) }} className="p-1 rounded-lg hover:bg-muted"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={showEditQuestion ? handleUpdateQuestion : handleCreateQuestion} className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Teks Soal</label>
                  <textarea className="neu-input w-full min-h-[80px] resize-none" placeholder="Tulis soal di sini..." value={questionForm.questionText} onChange={e => setQuestionForm(f => ({ ...f, questionText: e.target.value }))} />
                </div>
                {['A', 'B', 'C', 'D', 'E'].map(letter => (
                  <div key={letter}>
                    <label className="text-sm font-medium mb-1 block">Pilihan {letter}</label>
                    <input className="neu-input w-full" placeholder={`Opsi ${letter}`} value={questionForm[`option${letter}` as keyof typeof questionForm] as string} onChange={e => setQuestionForm(f => ({ ...f, [`option${letter}`]: e.target.value }))} />
                  </div>
                ))}
                <div>
                  <label className="text-sm font-medium mb-1 block">Jawaban Benar</label>
                  <select className="neu-input w-full" value={questionForm.correctAnswer} onChange={e => setQuestionForm(f => ({ ...f, correctAnswer: e.target.value }))}>
                    {['A', 'B', 'C', 'D', 'E'].map(l => <option key={l} value={l}>Pilihan {l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Pembahasan</label>
                  <textarea className="neu-input w-full min-h-[80px] resize-none" placeholder="Pembahasan jawaban (opsional)" value={questionForm.explanation} onChange={e => setQuestionForm(f => ({ ...f, explanation: e.target.value }))} />
                </div>
                <button type="submit" disabled={loading} className="clay-btn w-full py-3 bg-gradient-primary text-white font-semibold disabled:opacity-50">
                  {loading ? 'Memproses...' : showEditQuestion ? 'Simpan Perubahan' : 'Tambah Soal'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal: Import Word */}
      <AnimatePresence>
        {showImport && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowImport(false)}>
            <motion.div className="clay-glass p-6 w-full max-w-md" initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">Import Soal dari Word</h3>
                <button onClick={() => setShowImport(false)} className="p-1 rounded-lg hover:bg-muted"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleImport} className="space-y-4">
                <div className="neu-pressed p-6 text-center">
                  <Upload className="w-10 h-10 mx-auto mb-3 text-indigo-400" />
                  <p className="text-sm text-muted-foreground mb-3">Pilih file .docx untuk import soal</p>
                  <input
                    type="file"
                    accept=".docx"
                    onChange={e => setImportFile(e.target.files?.[0] || null)}
                    className="text-sm"
                  />
                  {importFile && <p className="text-xs text-emerald-500 mt-2">✓ {importFile.name}</p>}
                </div>
                <div className="bg-amber-500/10 p-3 rounded-xl flex gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div className="text-xs text-muted-foreground">
                    <p className="font-semibold text-amber-600 mb-1">Format file:</p>
                    <pre className="whitespace-pre-wrap">1. Teks soal...{'\n'}A. Pilihan A{'\n'}B. Pilihan B{'\n'}...{'\n'}E. Pilihan E{'\n'}JAWABAN: A{'\n'}PEMBAHASAN: Penjelasan...</pre>
                  </div>
                </div>
                <button type="submit" disabled={loading || !importFile} className="clay-btn w-full py-3 bg-gradient-warning text-white font-semibold disabled:opacity-50">
                  {loading ? 'Mengimport...' : 'Import Soal'}
                </button>
              </form>
            </motion.div>
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
                <button onClick={() => setShowResultDetail(null)} className="p-1 rounded-lg hover:bg-muted"><X className="w-5 h-5" /></button>
              </div>
              {(() => {
                const detail = showResultDetail as Record<string, unknown>
                const answers = detail.answers as Array<Record<string, unknown>> | undefined
                const examData = detail.exam as Record<string, unknown> | undefined
                const questions = examData?.questions as Array<Record<string, unknown>> | undefined
                return (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between neo-glass p-3">
                      <span className="font-semibold">Skor Akhir</span>
                      <span className={`text-2xl font-bold ${(detail.score as number) >= 70 ? 'text-emerald-500' : (detail.score as number) >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
                        {detail.score as number}%
                      </span>
                    </div>
                    {questions?.map((q, i) => {
                      const answer = answers?.find(a => a.questionId === q.id)
                      const isCorrect = answer?.isCorrect as boolean
                      const selected = answer?.selectedAnswer as string
                      const correct = q.correctAnswer as string
                      return (
                        <div key={q.id as string} className={`neo-glass p-4 border-l-4 ${isCorrect ? 'border-l-emerald-500' : 'border-l-red-500'}`}>
                          <p className="font-medium mb-2"><span className="text-indigo-500">{i + 1}.</span> {q.questionText as string}</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-sm mb-2">
                            {['A', 'B', 'C', 'D', 'E'].map(l => {
                              const optKey = `option${l}` as string
                              const isSelected = selected === l
                              const isCorrectOption = correct === l
                              return (
                                <span key={l} className={`px-2 py-1 rounded-lg ${
                                  isCorrectOption ? 'bg-emerald-500/10 text-emerald-600 font-semibold' :
                                  isSelected && !isCorrect ? 'bg-red-500/10 text-red-600' :
                                  'text-muted-foreground'
                                }`}>
                                  {l}. {q[optKey] as string}
                                  {isCorrectOption && <Check className="w-3 h-3 inline ml-1" />}
                                  {isSelected && !isCorrect && <X className="w-3 h-3 inline ml-1" />}
                                </span>
                              )
                            })}
                          </div>
                          {!isCorrect && q.explanation && (
                            <div className="bg-amber-500/10 p-3 rounded-lg text-sm">
                              <p className="font-semibold text-amber-600 mb-1">💡 Pembahasan:</p>
                              <p className="text-muted-foreground whitespace-pre-wrap">{q.explanation as string}</p>
                            </div>
                          )}
                        </div>
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
