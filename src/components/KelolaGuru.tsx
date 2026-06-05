'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Pencil, Trash2, Search, UserPlus, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { toast } from 'sonner'

interface Guru {
  id: string
  username: string
  name: string
  subject: string
  createdAt: string
}

export default function KelolaGuru() {
  const [teachers, setTeachers] = useState<Guru[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')

  // Form state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formUsername, setFormUsername] = useState('')
  const [formName, setFormName] = useState('')
  const [formSubject, setFormSubject] = useState('')
  const [formPassword, setFormPassword] = useState('')
  const [saving, setSaving] = useState(false)

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<Guru | null>(null)

  const fetchTeachers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/teachers')
      if (res.ok) setTeachers(await res.json())
    } catch { /* ignore */ }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchTeachers()
  }, [fetchTeachers])

  const resetForm = () => {
    setEditingId(null)
    setFormUsername('')
    setFormName('')
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

  const handleEdit = (guru: Guru) => {
    setEditingId(guru.id)
    setFormUsername(guru.username)
    setFormName(guru.name)
    setFormSubject(guru.subject)
    setFormPassword('')
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!formUsername.trim() || !formName.trim() || !formSubject.trim()) {
      toast.error('Harap isi semua field yang diperlukan')
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
          username: formUsername,
          name: formName,
          subject: formSubject,
        }
        if (formPassword.trim()) body.password = formPassword

        const res = await fetch(`/api/teachers/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        const data = await res.json()
        if (res.ok) {
          toast.success('Akun guru berhasil diperbarui')
          fetchTeachers()
          handleCloseForm()
        } else {
          toast.error(data.error || 'Gagal memperbarui akun')
        }
      } else {
        const res = await fetch('/api/teachers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: formUsername,
            name: formName,
            subject: formSubject,
            password: formPassword,
          }),
        })
        const data = await res.json()
        if (res.ok) {
          toast.success('Akun guru berhasil ditambahkan')
          fetchTeachers()
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
      const res = await fetch(`/api/teachers/${deleteTarget.id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Akun guru berhasil dihapus')
        fetchTeachers()
      } else {
        toast.error('Gagal menghapus akun')
      }
    } catch {
      toast.error('Terjadi kesalahan')
    }
    setDeleteTarget(null)
  }

  const filteredTeachers = teachers.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.username.toLowerCase().includes(search.toLowerCase()) ||
    t.subject.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-5">
      {/* Title Section */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Manajemen Akun Guru</h2>
          <p className="text-sm text-gray-500 mt-1">Kelola akun guru untuk mengelola ujian dan soal di sistem SIMULASI-Online</p>
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
              BUKA FORM
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
                  {editingId ? 'EDIT AKUN GURU' : 'TAMBAH AKUN GURU BARU'}
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
                    placeholder="Contoh: guru_matematika"
                    className="neu-input h-11 px-4 bg-transparent text-sm"
                  />
                </div>

                {/* Nama Lengkap */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Nama Lengkap Guru
                  </Label>
                  <Input
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Contoh: Dr. Herman, M.Pd"
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
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Kata Sandi / Password
                  </Label>
                  <Input
                    type="password"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder={editingId ? 'Kosongkan jika tidak diubah' : 'Contoh: gurubahagia'}
                    className="neu-input h-11 px-4 bg-transparent text-sm"
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

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Cari guru berdasarkan nama, username, atau mata pelajaran..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="neu-input bg-transparent pl-11 h-12 text-sm"
        />
      </div>

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
                <TableHead className="text-xs font-bold text-gray-700 w-14 text-center">NO</TableHead>
                <TableHead className="text-xs font-bold text-gray-700">NAMA GURU</TableHead>
                <TableHead className="text-xs font-bold text-gray-700">MATA PELAJARAN</TableHead>
                <TableHead className="text-xs font-bold text-gray-700">USERNAME</TableHead>
                <TableHead className="text-xs font-bold text-gray-700">PASSWORD</TableHead>
                <TableHead className="text-xs font-bold text-gray-700 text-center">AKSI</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTeachers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-400 py-12">
                    <div className="flex flex-col items-center">
                      <UserPlus className="h-10 w-10 text-gray-300 mb-2" />
                      <p className="font-medium">Belum ada data guru</p>
                      <p className="text-xs">Klik &quot;BUKA FORM&quot; untuk menambahkan akun guru baru</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredTeachers.map((guru, idx) => (
                  <TableRow key={guru.id} className="hover:bg-blue-50/40 transition-colors">
                    <TableCell className="text-sm text-center font-medium text-gray-600">{idx + 1}</TableCell>
                    <TableCell className="text-sm font-semibold text-gray-800">{guru.name}</TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-700 border border-green-200 text-xs font-semibold px-3 py-0.5">
                        {guru.subject}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600 font-mono">{guru.username}</TableCell>
                    <TableCell className="text-sm text-gray-400">••••••••</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-100 rounded-lg"
                          onClick={() => handleEdit(guru)}
                          title="Edit guru"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-red-500 hover:bg-red-50 rounded-lg"
                          onClick={() => setDeleteTarget(guru)}
                          title="Hapus guru"
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
              Apakah Anda yakin ingin menghapus akun guru &quot;{deleteTarget?.name}&quot;? Tindakan ini tidak dapat dibatalkan.
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
    </div>
  )
}
