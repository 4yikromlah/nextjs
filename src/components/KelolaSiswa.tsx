'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Pencil, Trash2, Search, UserPlus, X, Loader2,
  Download, Upload, FileSpreadsheet, Users, CheckSquare, Square, Trash2Icon
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { toast } from 'sonner'

interface Siswa {
  id: string
  username: string
  name: string
  class: string | null
  subject: string | null
  password: string
  isActive: boolean
  createdAt: string
}

export default function KelolaSiswa() {
  const [students, setStudents] = useState<Siswa[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')

  // Form state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formUsername, setFormUsername] = useState('')
  const [formName, setFormName] = useState('')
  const [formClass, setFormClass] = useState('')
  const [formSubject, setFormSubject] = useState('')
  const [formPassword, setFormPassword] = useState('')
  const [saving, setSaving] = useState(false)

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<Siswa | null>(null)

  // Bulk selection
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set())
  const [bulkDeleteDialog, setBulkDeleteDialog] = useState(false)

  const toggleSelectStudent = (id: string) => {
    const next = new Set(selectedStudents)
    if (next.has(id)) next.delete(id); else next.add(id)
    setSelectedStudents(next)
  }

  const toggleSelectAll = () => {
    if (selectedStudents.size === filteredStudents.length && filteredStudents.length > 0) {
      setSelectedStudents(new Set())
    } else {
      setSelectedStudents(new Set(filteredStudents.map(s => s.id)))
    }
  }

  const handleBulkDelete = async () => {
    try {
      const ids = Array.from(selectedStudents)
      for (const id of ids) {
        await fetch(`/api/students/${id}`, { method: 'DELETE' })
      }
      toast.success(`${ids.length} siswa berhasil dihapus`)
      setSelectedStudents(new Set())
      fetchStudents()
    } catch {
      toast.error('Gagal menghapus siswa')
    }
    setBulkDeleteDialog(false)
  }

  // CSV import
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importing, setImporting] = useState(false)

  const fetchStudents = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/students')
      if (res.ok) setStudents(await res.json())
    } catch { /* ignore */ }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchStudents()
  }, [fetchStudents])

  const resetForm = () => {
    setEditingId(null)
    setFormUsername('')
    setFormName('')
    setFormClass('')
    setFormSubject('')
    setFormPassword('')
  }

  const handleOpenForm = () => {
    resetForm()
    setShowForm(true)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    resetForm()
  }

  const handleEdit = (siswa: Siswa) => {
    setEditingId(siswa.id)
    setFormUsername(siswa.username)
    setFormName(siswa.name)
    setFormClass(siswa.class || '')
    setFormSubject(siswa.subject || '')
    setFormPassword('')
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!formUsername.trim() || !formName.trim()) {
      toast.error('Harap isi username dan nama siswa')
      return
    }
    if (!editingId && !formPassword.trim()) {
      toast.error('Password harus diisi untuk akun baru')
      return
    }

    setSaving(true)
    try {
      if (editingId) {
        const body: Record<string, string> = {
          username: formUsername.trim(),
          name: formName.trim(),
          class: formClass.trim(),
          subject: formSubject.trim(),
        }
        if (formPassword.trim()) body.password = formPassword.trim()

        const res = await fetch(`/api/students/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        const data = await res.json()
        if (res.ok) {
          toast.success('Akun siswa berhasil diperbarui')
          await fetchStudents()
          handleCloseForm()
        } else {
          toast.error(data.error || 'Gagal memperbarui akun')
        }
      } else {
        const res = await fetch('/api/students', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: formUsername.trim(),
            name: formName.trim(),
            class: formClass.trim(),
            subject: formSubject.trim(),
            password: formPassword.trim() || 'siswa',
          }),
        })
        const data = await res.json()
        if (res.ok) {
          toast.success('Akun siswa berhasil ditambahkan')
          await fetchStudents()
          handleCloseForm()
        } else {
          toast.error(data.error || 'Gagal menambahkan akun')
        }
      }
    } catch {
      toast.error('Terjadi kesalahan koneksi')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      const res = await fetch(`/api/students/${deleteTarget.id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Akun siswa berhasil dihapus')
        fetchStudents()
      } else {
        toast.error('Gagal menghapus akun')
      }
    } catch {
      toast.error('Terjadi kesalahan')
    }
    setDeleteTarget(null)
  }

  // CSV Template Download
  const handleDownloadTemplate = () => {
    const csvContent = 'username,name,class,subject,password\ncontoh_siswa,Nama Siswa,XII IPA 1,Matematika,siswa\ncontoh_siswa2,Nama Siswa 2,XII IPA 2,Bahasa Indonesia,siswa'
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'template_siswa.csv'
    link.click()
    URL.revokeObjectURL(url)
    toast.success('Template CSV berhasil diunduh')
  }

  // CSV Import
  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.csv') && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast.error('Hanya file CSV yang didukung')
      return
    }

    setImporting(true)
    try {
      const text = await file.text()
      const lines = text.trim().split('\n')
      if (lines.length < 2) {
        toast.error('File CSV kosong atau tidak valid')
        setImporting(false)
        return
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''))
      const students = []

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
        if (values.length < 2) continue

        const row: Record<string, string> = {}
        headers.forEach((header, idx) => {
          row[header] = values[idx] || ''
        })

        students.push(row)
      }

      const res = await fetch('/api/students', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ students }),
      })

      const data = await res.json()
      if (res.ok) {
        toast.success(`Import berhasil: ${data.success} siswa ditambahkan${data.failed > 0 ? `, ${data.failed} gagal` : ''}`)
        fetchStudents()
      } else {
        toast.error(data.error || 'Gagal mengimpor data')
      }
    } catch {
      toast.error('Gagal membaca file CSV')
    } finally {
      setImporting(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const filteredStudents = students.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.username.toLowerCase().includes(search.toLowerCase()) ||
    (s.class || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.subject || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-5">
      {/* Title Section */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Manajemen Akun Siswa</h2>
          <p className="text-sm text-gray-500 mt-1">
            Kelola data kredensial (username, nama, password) siswa untuk mengikuti Computer Based Test (CBT).
          </p>
        </div>
        <Button
          onClick={showForm ? handleCloseForm : handleOpenForm}
          className={`rounded-xl shadow-md text-sm font-semibold px-4 ${
            showForm
              ? 'bg-gray-500 hover:bg-gray-600 text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {showForm ? (
            <>
              <X className="h-4 w-4 mr-2" />
              TUTUP FORM
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              TAMBAH SISWA BARU
            </>
          )}
        </Button>
      </div>

      {/* Add/Edit Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="clay-glass p-6 border-0">
              <div className="flex items-center gap-2 mb-5">
                <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <UserPlus className="h-4 w-4 text-blue-600" />
                </div>
                <h3 className="text-base font-bold text-gray-800">
                  {editingId ? 'EDIT AKUN SISWA' : 'TAMBAH AKUN SISWA BARU'}
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Username */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Username Login
                  </Label>
                  <Input
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value)}
                    placeholder="Contoh: ahmadsudiwo"
                    className="neu-input h-11 px-4 bg-transparent text-sm"
                  />
                </div>

                {/* Nama Lengkap */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Nama Lengkap Siswa
                  </Label>
                  <Input
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Contoh: Ahmad Sudiwo"
                    className="neu-input h-11 px-4 bg-transparent text-sm"
                  />
                </div>

                {/* Kelas */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Kelas
                  </Label>
                  <Input
                    value={formClass}
                    onChange={(e) => setFormClass(e.target.value)}
                    placeholder="Contoh: XII IPA 1"
                    className="neu-input h-11 px-4 bg-transparent text-sm"
                  />
                </div>

                {/* Mata Pelajaran */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Mata Pelajaran
                  </Label>
                  <Input
                    value={formSubject}
                    onChange={(e) => setFormSubject(e.target.value)}
                    placeholder="Contoh: Matematika"
                    className="neu-input h-11 px-4 bg-transparent text-sm"
                  />
                </div>

                {/* Password */}
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Kata Sandi / Password
                  </Label>
                  <Input
                    type="password"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder={editingId ? 'Kosongkan jika tidak diubah' : 'Default: siswa'}
                    className="neu-input h-11 px-4 bg-transparent text-sm max-w-md"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md px-6"
                >
                  {saving ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Menyimpan...
                    </span>
                  ) : editingId ? (
                    'UPDATE AKUN'
                  ) : (
                    'SIMPAN AKUN'
                  )}
                </Button>
                <Button
                  onClick={() => {
                    if (editingId) {
                      handleCloseForm()
                    } else {
                      resetForm()
                    }
                  }}
                  variant="outline"
                  className="rounded-xl px-6"
                >
                  Batalkan
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CSV Import/Export Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Download Template CSV */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="clay p-5">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                <Download className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-gray-800 text-sm">Unduh Template CSV Siswa</h4>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  Unduh template CSV yang kompatibel untuk format impor data siswa ke dalam sistem CBT.
                </p>
                <Button
                  onClick={handleDownloadTemplate}
                  size="sm"
                  className="mt-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold"
                >
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                  Unduh Template (.CSV)
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Import CSV */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="clay p-5">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                <Upload className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-gray-800 text-sm">Impor File Excel / CSV</h4>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  Impor data siswa dari file CSV. Pastikan format sesuai template yang disediakan.
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleImportCSV}
                  className="hidden"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={importing}
                  size="sm"
                  variant="outline"
                  className="mt-3 rounded-lg text-xs font-semibold"
                >
                  {importing ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                      Mengimpor...
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5" />
                      Pilih Berkas CSV
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Cari siswa berdasarkan nama, username, atau mata pelajaran..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="neu-input bg-transparent pl-11 h-12 text-sm"
        />
      </div>

      {/* Selection Actions Bar */}
      {selectedStudents.size > 0 && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between bg-blue-50/80 border border-blue-200 rounded-xl px-4 py-3">
          <div className="flex items-center gap-3">
            <button onClick={toggleSelectAll} className="flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-800 transition-colors">
              <CheckSquare className="h-4 w-4 text-blue-600" />
              {selectedStudents.size} siswa terpilih
            </button>
          </div>
          <Button
            size="sm"
            variant="destructive"
            className="h-8 text-xs rounded-lg gap-1.5"
            onClick={() => setBulkDeleteDialog(true)}
          >
            <Trash2Icon className="h-3.5 w-3.5" />
            Hapus {selectedStudents.size} Siswa
          </Button>
        </motion.div>
      )}

      {/* Table */}
      <div className="clay-glass overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-blue-50 to-cyan-50">
                <TableHead className="text-xs font-bold text-gray-700 w-12 text-center">
                  <button onClick={toggleSelectAll} className="flex items-center justify-center">
                    {selectedStudents.size === filteredStudents.length && filteredStudents.length > 0 ? (
                      <CheckSquare className="h-4 w-4 text-blue-600" />
                    ) : (
                      <Square className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </TableHead>
                <TableHead className="text-xs font-bold text-gray-700 w-14 text-center">NO</TableHead>
                <TableHead className="text-xs font-bold text-gray-700">NAMA SISWA</TableHead>
                <TableHead className="text-xs font-bold text-gray-700">MATA PELAJARAN</TableHead>
                <TableHead className="text-xs font-bold text-gray-700">USERNAME</TableHead>
                <TableHead className="text-xs font-bold text-gray-700">PASSWORD</TableHead>
                <TableHead className="text-xs font-bold text-gray-700 text-center">AKSI</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-400 py-12">
                    <div className="flex flex-col items-center">
                      <Users className="h-10 w-10 text-gray-300 mb-2" />
                      <p className="font-medium">Belum ada data siswa</p>
                      <p className="text-xs">Klik &quot;TAMBAH SISWA BARU&quot; untuk menambahkan akun siswa</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredStudents.map((siswa, idx) => (
                  <TableRow key={siswa.id} className={`hover:bg-blue-50/40 transition-colors ${selectedStudents.has(siswa.id) ? 'bg-blue-50/60' : ''}`}>
                    <TableCell className="text-center">
                      <button onClick={() => toggleSelectStudent(siswa.id)} className="flex items-center justify-center">
                        {selectedStudents.has(siswa.id) ? <CheckSquare className="h-4 w-4 text-blue-600" /> : <Square className="h-4 w-4 text-gray-300 hover:text-gray-500" />}
                      </button>
                    </TableCell>
                    <TableCell className="text-sm text-center font-medium text-gray-600">{idx + 1}</TableCell>
                    <TableCell className="text-sm font-semibold text-gray-800">{siswa.name}</TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-700 border border-green-200 text-xs font-semibold px-3 py-0.5">
                        {siswa.subject || '-'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600 font-mono">{siswa.username}</TableCell>
                    <TableCell className="text-sm text-gray-400 font-mono">{siswa.password}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-100 rounded-lg"
                          onClick={() => handleEdit(siswa)}
                          title="Edit siswa"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-red-500 hover:bg-red-50 rounded-lg"
                          onClick={() => setDeleteTarget(siswa)}
                          title="Hapus siswa"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus akun siswa &quot;{deleteTarget?.name}&quot;? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} className="rounded-xl">
              Batal
            </Button>
            <Button
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600 text-white rounded-xl"
            >
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={bulkDeleteDialog} onOpenChange={setBulkDeleteDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus Massal</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus {selectedStudents.size} siswa terpilih? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setBulkDeleteDialog(false)} className="rounded-xl">
              Batal
            </Button>
            <Button
              onClick={handleBulkDelete}
              className="bg-red-500 hover:bg-red-600 text-white rounded-xl"
            >
              Hapus {selectedStudents.size} Siswa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
