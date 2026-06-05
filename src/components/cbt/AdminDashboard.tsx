'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, FileText, Users, BarChart3, Edit, Trash2, ToggleLeft, ToggleRight, Upload, BookOpen, X, Check, AlertCircle, Clock, Eye, Shield, Activity } from 'lucide-react'
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
  const [showAddExam, setShowAddExam] = useState(false)
  const [showAddQuestion, setShowAddQuestion] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [showEditQuestion, setShowEditQuestion] = useState<QuestionData | null>(null)
  const [showResultDetail, setShowResultDetail] = useState<Record<string, unknown> | null>(null)
  const [examForm, setExamForm] = useState({ title: '', description: '', duration: 60 })
  const [questionForm, setQuestionForm] = useState({ questionText: '', optionA: '', optionB: '', optionC: '', optionD: '', optionE: '', correctAnswer: 'A', explanation: '' })
  const [importFile, setImportFile] = useState<File | null>(null)

  const loadExams = useCallback(async () => {
    try { const res = await fetch('/api/exams'); setExams(await res.json()) } catch { /* */ }
  }, [])
  const loadStats = useCallback(async () => {
    try { const res = await fetch('/api/stats'); setStats(await res.json()) } catch { /* */ }
  }, [])
  const loadStudents = useCallback(async () => {
    try { const res = await fetch('/api/users?role=SISWA'); setStudents(await res.json()) } catch { /* */ }
  }, [])
  const loadSessions = useCallback(async () => {
    try { const res = await fetch('/api/sessions?status=COMPLETED'); setSessions(await res.json()) } catch { /* */ }
  }, [])
  const loadQuestions = useCallback(async (examId: string) => {
    try { const res = await fetch(`/api/exams/${examId}/questions`); setQuestions(await res.json()) } catch { /* */ }
  }, [])

  useEffect(() => { loadExams(); loadStats() }, [loadExams, loadStats])
  useEffect(() => { if (adminTab === 'students') loadStudents(); if (adminTab === 'results') loadSessions() }, [adminTab, loadStudents, loadSessions])
  useEffect(() => { if (selectedExam) loadQuestions(selectedExam.id) }, [selectedExam, loadQuestions])

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!examForm.title) return
    setLoading(true)
    try {
      const res = await fetch('/api/exams', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...examForm, createdBy: user?.id }) })
      if (res.ok) { toast.success('Ujian berhasil dibuat'); setShowAddExam(false); setExamForm({ title: '', description: '', duration: 60 }); loadExams(); loadStats() }
      else { const d = await res.json(); toast.error(d.error) }
    } catch { toast.error('Gagal') } finally { setLoading(false) }
  }

  const handleToggleExam = async (exam: ExamData) => {
    try { await fetch(`/api/exams/${exam.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !exam.isActive }) }); toast.success(exam.isActive ? 'Dinonaktifkan' : 'Diaktifkan'); loadExams(); loadStats() } catch { /* */ }
  }

  const handleDeleteExam = async (id: string) => {
    if (!confirm('Hapus ujian ini?')) return
    try { await fetch(`/api/exams/${id}`, { method: 'DELETE' }); toast.success('Dihapus'); if (selectedExam?.id === id) setSelectedExam(null); loadExams(); loadStats() } catch { /* */ }
  }

  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedExam || !questionForm.questionText) return
    setLoading(true)
    try {
      const res = await fetch(`/api/exams/${selectedExam.id}/questions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(questionForm) })
      if (res.ok) { toast.success('Soal ditambahkan'); setShowAddQuestion(false); setQuestionForm({ questionText: '', optionA: '', optionB: '', optionC: '', optionD: '', optionE: '', correctAnswer: 'A', explanation: '' }); loadQuestions(selectedExam.id); loadStats() }
      else { const d = await res.json(); toast.error(d.error) }
    } catch { /* */ } finally { setLoading(false) }
  }

  const handleUpdateQuestion = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!showEditQuestion || !selectedExam) return
    setLoading(true)
    try { await fetch(`/api/questions/${showEditQuestion.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(questionForm) }); toast.success('Diperbarui'); setShowEditQuestion(null); loadQuestions(selectedExam.id) } catch { /* */ } finally { setLoading(false) }
  }

  const handleDeleteQuestion = async (id: string) => {
    if (!selectedExam || !confirm('Hapus soal?')) return
    try { await fetch(`/api/questions/${id}`, { method: 'DELETE' }); toast.success('Dihapus'); loadQuestions(selectedExam.id); loadStats() } catch { /* */ }
  }

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!importFile || !selectedExam) return
    setLoading(true)
    try {
      const formData = new FormData(); formData.append('file', importFile)
      const res = await fetch(`/api/exams/${selectedExam.id}/import`, { method: 'POST', body: formData })
      const data = await res.json()
      if (res.ok) { toast.success(`${data.count} soal diimport`); setShowImport(false); setImportFile(null); loadQuestions(selectedExam.id); loadStats() }
      else toast.error(data.error)
    } catch { toast.error('Gagal import') } finally { setLoading(false) }
  }

  const tabs = [
    { id: 'exams', label: 'Kelola Ujian & Soal', icon: FileText },
    { id: 'students', label: 'Kelola Siswa', icon: Users },
    { id: 'results', label: 'Hasil Ujian', icon: BarChart3 },
  ]

  return (
    <div className="flex-1 p-4 md:p-6 max-w-[1400px] mx-auto w-full">
      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setAdminTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all duration-300 ${
              adminTab === tab.id
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25 scale-[1.02]'
                : 'bg-white/60 backdrop-blur-sm border border-gray-200/50 text-gray-500 hover:text-gray-700 hover:bg-white/80 shadow-sm'
            }`}
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {adminTab === 'exams' && (
          <motion.div key="exams" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Total Ujian', value: stats.totalExams, icon: FileText, color: 'from-indigo-500 to-purple-600', shadow: 'shadow-indigo-500/20' },
                { label: 'Ujian Aktif', value: stats.activeExams, icon: Check, color: 'from-emerald-400 to-teal-500', shadow: 'shadow-emerald-500/20' },
                { label: 'Total Soal', value: stats.totalQuestions, icon: BookOpen, color: 'from-amber-400 to-orange-500', shadow: 'shadow-amber-500/20' },
                { label: 'Total Siswa', value: stats.totalStudents, icon: Users, color: 'from-rose-400 to-pink-500', shadow: 'shadow-rose-500/20' },
              ].map((s, i) => (
                <motion.div key={s.label}
                  className="bg-white/70 backdrop-blur-sm rounded-2xl p-5 border border-white/50 shadow-lg hover:shadow-xl transition-shadow relative overflow-hidden"
                  initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: i * 0.08 }}
                >
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-3 shadow-lg ${s.shadow}`}>
                    <s.icon className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-3xl font-extrabold text-gray-800">{s.value}</p>
                  <p className="text-xs text-gray-400 font-semibold mt-0.5">{s.label}</p>
                </motion.div>
              ))}
            </div>

            {/* Two Panel Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
              {/* Left: Exam List */}
              <div className="lg:col-span-2 bg-white/70 backdrop-blur-sm rounded-2xl border border-white/50 shadow-lg p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-extrabold text-gray-700 text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-500" /> Daftar Paket Ujian
                  </h3>
                  <button onClick={() => setShowAddExam(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-bold shadow-lg shadow-indigo-500/25 hover:shadow-xl transition-shadow">
                    <Plus className="w-4 h-4" /> Tambah Ujian
                  </button>
                </div>
                <div className="space-y-3 max-h-[450px] overflow-y-auto custom-scrollbar pr-1">
                  {exams.map((exam, i) => (
                    <motion.div key={exam.id}
                      className={`p-4 rounded-xl cursor-pointer transition-all duration-200 border ${
                        selectedExam?.id === exam.id
                          ? 'bg-indigo-50/80 border-indigo-300/50 shadow-md shadow-indigo-500/10'
                          : 'bg-white/60 border-gray-200/30 hover:bg-white/90 hover:shadow-md'
                      }`}
                      onClick={() => setSelectedExam(exam)}
                      initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.05 }}
                      whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-gray-700 truncate">{exam.title}</h4>
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold text-white ${
                              exam.isActive ? 'bg-gradient-to-r from-emerald-400 to-teal-500' : 'bg-gray-300'
                            }`}>
                              {exam.isActive ? 'AKTIF' : 'NONAKTIF'}
                            </span>
                            <span className="text-[11px] text-gray-400 flex items-center gap-0.5 font-medium">
                              <FileText className="w-3 h-3" /> {exam._count?.questions || 0} soal
                            </span>
                            <span className="text-[11px] text-gray-400 flex items-center gap-0.5 font-medium">
                              <Clock className="w-3 h-3" /> {exam.duration} mnt
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5 ml-2">
                          <button onClick={e => { e.stopPropagation(); handleToggleExam(exam) }} className="p-1.5 rounded-lg hover:bg-indigo-50 transition-colors" title={exam.isActive ? 'Nonaktifkan' : 'Aktifkan'}>
                            {exam.isActive ? <ToggleRight className="w-5 h-5 text-emerald-500" /> : <ToggleLeft className="w-5 h-5 text-gray-300" />}
                          </button>
                          <button onClick={e => { e.stopPropagation(); handleDeleteExam(exam.id) }} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors" title="Hapus">
                            <Trash2 className="w-4 h-4 text-red-300 hover:text-red-500" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  {exams.length === 0 && (
                    <div className="text-center py-10 text-gray-300">
                      <FileText className="w-14 h-14 mx-auto mb-3" />
                      <p className="text-sm font-medium">Belum ada ujian</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Questions or Empty */}
              <div className="lg:col-span-3 bg-white/70 backdrop-blur-sm rounded-2xl border border-white/50 shadow-lg p-5">
                {selectedExam ? (
                  <>
                    <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                      <div>
                        <h3 className="font-extrabold text-gray-700 text-lg">{selectedExam.title}</h3>
                        <p className="text-xs text-gray-400 mt-0.5">{selectedExam.description || 'Tanpa deskripsi'} • {selectedExam.duration} menit</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setShowImport(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-white text-sm font-bold shadow-lg shadow-amber-500/20">
                          <Upload className="w-4 h-4" /> Import Word
                        </button>
                        <button onClick={() => setShowAddQuestion(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-bold shadow-lg shadow-indigo-500/25">
                          <Plus className="w-4 h-4" /> Tambah Soal
                        </button>
                      </div>
                    </div>
                    <div className="space-y-3 max-h-[450px] overflow-y-auto custom-scrollbar pr-1">
                      {questions.map((q, i) => (
                        <motion.div key={q.id}
                          className="p-4 rounded-xl bg-white/60 border border-gray-200/30"
                          initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.03 }}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p className="font-bold text-gray-700 mb-2">
                                <span className="text-indigo-500 mr-1">{i + 1}.</span> {q.questionText}
                              </p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-sm">
                                {['A', 'B', 'C', 'D', 'E'].map(letter => {
                                  const val = q[`option${letter}` as keyof QuestionData] as string
                                  if (!val) return null
                                  return (
                                    <span key={letter} className={`px-2 py-1 rounded-lg text-xs ${
                                      q.correctAnswer === letter ? 'bg-emerald-50 text-emerald-600 font-bold ring-1 ring-emerald-200' : 'text-gray-400'
                                    }`}>
                                      {letter}. {val} {q.correctAnswer === letter && <Check className="w-3 h-3 inline" />}
                                    </span>
                                  )
                                })}
                              </div>
                              {q.explanation && (
                                <p className="mt-2 text-xs text-gray-400 bg-amber-50/50 p-2 rounded-lg border border-amber-100/50">
                                  💡 {q.explanation}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-0.5 shrink-0">
                              <button onClick={() => {
                                setQuestionForm({ questionText: q.questionText, optionA: q.optionA, optionB: q.optionB, optionC: q.optionC, optionD: q.optionD, optionE: q.optionE, correctAnswer: q.correctAnswer, explanation: q.explanation || '' })
                                setShowEditQuestion(q)
                              }} className="p-1.5 rounded-lg hover:bg-indigo-50" title="Edit"><Edit className="w-4 h-4 text-indigo-400" /></button>
                              <button onClick={() => handleDeleteQuestion(q.id)} className="p-1.5 rounded-lg hover:bg-red-50" title="Hapus"><Trash2 className="w-4 h-4 text-red-300" /></button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                      {questions.length === 0 && (
                        <div className="text-center py-12 text-gray-300">
                          <BookOpen className="w-14 h-14 mx-auto mb-3" />
                          <p className="text-sm font-medium">Belum ada soal. Tambahkan atau import dari Word.</p>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-gray-300">
                    <BookOpen className="w-20 h-20 mb-4" />
                    <p className="text-center font-medium">Silakan pilih atau tambahkan paket ujian<br />di panel sebelah kiri</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {adminTab === 'students' && (
          <motion.div key="students" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-white/50 shadow-lg p-5">
              <h3 className="font-extrabold text-gray-700 text-lg flex items-center gap-2 mb-4"><Users className="w-5 h-5 text-indigo-500" /> Daftar Siswa</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b-2 border-gray-100">
                    <th className="text-left py-3 px-3 font-bold text-gray-400 text-xs uppercase">No</th>
                    <th className="text-left py-3 px-3 font-bold text-gray-400 text-xs uppercase">Nama</th>
                    <th className="text-left py-3 px-3 font-bold text-gray-400 text-xs uppercase">Email</th>
                    <th className="text-left py-3 px-3 font-bold text-gray-400 text-xs uppercase">Kelas</th>
                    <th className="text-left py-3 px-3 font-bold text-gray-400 text-xs uppercase">Terdaftar</th>
                  </tr></thead>
                  <tbody>
                    {students.map((s, i) => (
                      <motion.tr key={s.id} className="border-b border-gray-50 hover:bg-indigo-50/30 transition-colors" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                        <td className="py-3 px-3 text-gray-400">{i + 1}</td>
                        <td className="py-3 px-3 font-bold text-gray-700">{s.name}</td>
                        <td className="py-3 px-3 text-gray-400">{s.email}</td>
                        <td className="py-3 px-3"><span className="px-2 py-0.5 rounded-full text-xs bg-indigo-50 text-indigo-500 font-bold">{s.class || '-'}</span></td>
                        <td className="py-3 px-3 text-gray-400 text-xs">{new Date(s.createdAt).toLocaleDateString('id-ID')}</td>
                      </motion.tr>
                    ))}
                    {students.length === 0 && <tr><td colSpan={5} className="py-10 text-center text-gray-300">Belum ada siswa</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {adminTab === 'results' && (
          <motion.div key="results" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-white/50 shadow-lg p-5">
              <h3 className="font-extrabold text-gray-700 text-lg flex items-center gap-2 mb-4"><BarChart3 className="w-5 h-5 text-indigo-500" /> Hasil Ujian</h3>
              <div className="space-y-3">
                {sessions.map((session, i) => {
                  const s = session as Record<string, unknown>
                  const u = s.user as Record<string, string> | undefined
                  const ex = s.exam as Record<string, unknown> | undefined
                  return (
                    <motion.div key={s.id as string} className="p-4 rounded-xl bg-white/60 border border-gray-200/30 flex items-center justify-between" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                      <div>
                        <p className="font-bold text-gray-700">{u?.name || '-'}</p>
                        <p className="text-sm text-gray-400">{ex?.title as string || '-'} • Kelas: {u?.class || '-'}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xl font-extrabold ${(s.score as number) >= 70 ? 'text-emerald-500' : (s.score as number) >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
                          {s.score as number}%
                        </span>
                        <button onClick={async () => { const res = await fetch(`/api/sessions/${s.id}`); setShowResultDetail(await res.json()) }} className="p-2 rounded-xl bg-indigo-50 text-indigo-500 hover:bg-indigo-100 transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  )
                })}
                {sessions.length === 0 && <div className="text-center py-12 text-gray-300"><BarChart3 className="w-14 h-14 mx-auto mb-3" /><p className="font-medium">Belum ada hasil ujian</p></div>}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>
        {showAddExam && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddExam(false)}>
            <motion.div className="bg-white/90 backdrop-blur-xl rounded-2xl p-6 w-full max-w-md shadow-2xl border border-white/50" initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-extrabold text-gray-700 text-lg">Tambah Ujian Baru</h3>
                <button onClick={() => setShowAddExam(false)} className="p-1 rounded-lg hover:bg-gray-100"><X className="w-5 h-5 text-gray-400" /></button>
              </div>
              <form onSubmit={handleCreateExam} className="space-y-4">
                <div><label className="text-sm font-bold text-gray-500 mb-1 block">Judul Ujian</label><input className="neu-input w-full" placeholder="Contoh: Ujian Matematika Kelas XII" value={examForm.title} onChange={e => setExamForm(f => ({ ...f, title: e.target.value }))} /></div>
                <div><label className="text-sm font-bold text-gray-500 mb-1 block">Deskripsi</label><textarea className="neu-input w-full min-h-[80px] resize-none" placeholder="Deskripsi (opsional)" value={examForm.description} onChange={e => setExamForm(f => ({ ...f, description: e.target.value }))} /></div>
                <div><label className="text-sm font-bold text-gray-500 mb-1 block">Durasi (menit)</label><input type="number" className="neu-input w-full" value={examForm.duration} onChange={e => setExamForm(f => ({ ...f, duration: parseInt(e.target.value) || 60 }))} /></div>
                <button type="submit" disabled={loading} className="clay-btn w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold disabled:opacity-50">{loading ? 'Memproses...' : 'Buat Ujian'}</button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {(showAddQuestion || showEditQuestion) && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setShowAddQuestion(false); setShowEditQuestion(null) }}>
            <motion.div className="bg-white/90 backdrop-blur-xl rounded-2xl p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto custom-scrollbar shadow-2xl border border-white/50" initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-extrabold text-gray-700 text-lg">{showEditQuestion ? 'Edit Soal' : 'Tambah Soal'}</h3>
                <button onClick={() => { setShowAddQuestion(false); setShowEditQuestion(null) }} className="p-1 rounded-lg hover:bg-gray-100"><X className="w-5 h-5 text-gray-400" /></button>
              </div>
              <form onSubmit={showEditQuestion ? handleUpdateQuestion : handleCreateQuestion} className="space-y-4">
                <div><label className="text-sm font-bold text-gray-500 mb-1 block">Teks Soal</label><textarea className="neu-input w-full min-h-[80px] resize-none" placeholder="Tulis soal..." value={questionForm.questionText} onChange={e => setQuestionForm(f => ({ ...f, questionText: e.target.value }))} /></div>
                {['A', 'B', 'C', 'D', 'E'].map(letter => (
                  <div key={letter}><label className="text-sm font-bold text-gray-500 mb-1 block">Pilihan {letter}</label><input className="neu-input w-full" placeholder={`Opsi ${letter}`} value={questionForm[`option${letter}` as keyof typeof questionForm] as string} onChange={e => setQuestionForm(f => ({ ...f, [`option${letter}`]: e.target.value }))} /></div>
                ))}
                <div><label className="text-sm font-bold text-gray-500 mb-1 block">Jawaban Benar</label><select className="neu-input w-full" value={questionForm.correctAnswer} onChange={e => setQuestionForm(f => ({ ...f, correctAnswer: e.target.value }))}>{['A', 'B', 'C', 'D', 'E'].map(l => <option key={l} value={l}>Pilihan {l}</option>)}</select></div>
                <div><label className="text-sm font-bold text-gray-500 mb-1 block">Pembahasan</label><textarea className="neu-input w-full min-h-[80px] resize-none" placeholder="Pembahasan (opsional)" value={questionForm.explanation} onChange={e => setQuestionForm(f => ({ ...f, explanation: e.target.value }))} /></div>
                <button type="submit" disabled={loading} className="clay-btn w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold disabled:opacity-50">{loading ? 'Memproses...' : showEditQuestion ? 'Simpan' : 'Tambah Soal'}</button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showImport && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowImport(false)}>
            <motion.div className="bg-white/90 backdrop-blur-xl rounded-2xl p-6 w-full max-w-md shadow-2xl border border-white/50" initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-extrabold text-gray-700 text-lg">Import Soal dari Word</h3>
                <button onClick={() => setShowImport(false)} className="p-1 rounded-lg hover:bg-gray-100"><X className="w-5 h-5 text-gray-400" /></button>
              </div>
              <form onSubmit={handleImport} className="space-y-4">
                <div className="neu-pressed p-6 text-center rounded-xl">
                  <Upload className="w-10 h-10 mx-auto mb-3 text-amber-500" />
                  <p className="text-sm text-gray-400 mb-3 font-medium">Pilih file .docx</p>
                  <input type="file" accept=".docx" onChange={e => setImportFile(e.target.files?.[0] || null)} className="text-sm" />
                  {importFile && <p className="text-xs text-emerald-500 mt-2 font-bold">✓ {importFile.name}</p>}
                </div>
                <div className="bg-amber-50/50 p-3 rounded-xl flex gap-2 border border-amber-100/50">
                  <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div className="text-xs text-gray-400">
                    <p className="font-bold text-amber-600 mb-1">Format:</p>
                    <pre className="whitespace-pre-wrap text-[10px]">1. Soal...{'\n'}A. Opsi A  B. Opsi B  ...  E. Opsi E{'\n'}JAWABAN: A{'\n'}PEMBAHASAN: Penjelasan...</pre>
                  </div>
                </div>
                <button type="submit" disabled={loading || !importFile} className="clay-btn w-full py-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold disabled:opacity-50">{loading ? 'Mengimport...' : 'Import'}</button>
              </form>
            </motion.div>
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
                return (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100/50">
                      <span className="font-bold text-gray-600">Skor Akhir</span>
                      <span className={`text-3xl font-extrabold ${(detail.score as number) >= 70 ? 'text-emerald-500' : (detail.score as number) >= 50 ? 'text-amber-500' : 'text-red-500'}`}>{detail.score as number}%</span>
                    </div>
                    {questions?.map((q, i) => {
                      const answer = answers?.find(a => a.questionId === q.id)
                      const isCorrect = answer?.isCorrect as boolean
                      const selected = answer?.selectedAnswer as string
                      const correct = q.correctAnswer as string
                      return (
                        <div key={q.id as string} className={`p-4 rounded-xl border-l-4 ${isCorrect ? 'border-l-emerald-400 bg-emerald-50/30' : 'border-l-red-400 bg-red-50/30'}`}>
                          <p className="font-bold text-gray-700 mb-2"><span className="text-indigo-500">{i + 1}.</span> {q.questionText as string}</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-sm mb-2">
                            {['A', 'B', 'C', 'D', 'E'].map(l => {
                              const optKey = `option${l}` as string
                              const isSelected = selected === l; const isCorrectOption = correct === l
                              return (
                                <span key={l} className={`px-2 py-1 rounded-lg text-xs ${
                                  isCorrectOption ? 'bg-emerald-100 text-emerald-600 font-bold' :
                                  isSelected && !isCorrect ? 'bg-red-100 text-red-500' : 'text-gray-400'
                                }`}>
                                  {l}. {q[optKey] as string} {isCorrectOption && <Check className="w-3 h-3 inline" />} {isSelected && !isCorrect && <X className="w-3 h-3 inline" />}
                                </span>
                              )
                            })}
                          </div>
                          {!isCorrect && q.explanation && (
                            <div className="bg-amber-50/50 p-3 rounded-lg text-xs border border-amber-100/50">
                              <p className="font-bold text-amber-600 mb-1">💡 Pembahasan:</p>
                              <p className="text-gray-500 whitespace-pre-wrap">{q.explanation as string}</p>
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
