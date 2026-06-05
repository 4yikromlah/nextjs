import { create } from 'zustand'

export type View = 'login' | 'admin' | 'guru' | 'student' | 'exam'
export type LoginPortal = 'siswa' | 'guru' | 'admin'

export interface User {
  id: string
  username: string
  name: string
  role: 'ADMIN' | 'GURU' | 'SISWA'
  class?: string | null
  subject?: string | null
}

export interface ExamData {
  id: string
  title: string
  description?: string | null
  duration: number
  isActive: boolean
  createdBy: string
  createdAt: string
  _count?: { questions: number; sessions: number }
}

export interface QuestionData {
  id: string
  examId: string
  questionText: string
  optionA: string
  optionB: string
  optionC: string
  optionD: string
  optionE: string
  correctAnswer: string
  explanation?: string | null
  order: number
}

export interface ExamSessionData {
  id: string
  userId: string
  examId: string
  startTime: string
  endTime?: string | null
  status: 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED'
  score?: number | null
  exam?: ExamData
  answers?: AnswerData[]
}

export interface AnswerData {
  id: string
  sessionId: string
  questionId: string
  selectedAnswer?: string | null
  isCorrect?: boolean | null
  question?: QuestionData
}

export interface GuruData {
  id: string
  username: string
  name: string
  subject: string
  password: string
  createdAt: string
}

export interface SiswaData {
  id: string
  username: string
  name: string
  class: string | null
  subject: string | null
  password: string
  isActive: boolean
  createdAt: string
}

interface AppState {
  // Auth
  currentUser: User | null
  setCurrentUser: (user: User | null) => void

  // Navigation
  currentView: View
  setCurrentView: (view: View) => void

  // Login portal
  loginPortal: LoginPortal
  setLoginPortal: (portal: LoginPortal) => void

  // Admin state
  adminTab: string
  setAdminTab: (tab: string) => void
  selectedExam: ExamData | null
  setSelectedExam: (exam: ExamData | null) => void

  // Student state
  studentTab: string
  setStudentTab: (tab: string) => void
  activeSession: ExamSessionData | null
  setActiveSession: (session: ExamSessionData | null) => void
  activeExamId: string | null
  setActiveExamId: (id: string | null) => void
  activeSessionId: string | null
  setActiveSessionId: (id: string | null) => void

  // Loading
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  currentUser: null,
  setCurrentUser: (currentUser) => set({ currentUser }),
  currentView: 'login',
  setCurrentView: (currentView) => set({ currentView }),
  loginPortal: 'siswa',
  setLoginPortal: (loginPortal) => set({ loginPortal }),
  adminTab: 'exams',
  setAdminTab: (adminTab) => set({ adminTab }),
  selectedExam: null,
  setSelectedExam: (selectedExam) => set({ selectedExam }),
  studentTab: 'exams',
  setStudentTab: (studentTab) => set({ studentTab }),
  activeSession: null,
  setActiveSession: (activeSession) => set({ activeSession }),
  activeExamId: null,
  setActiveExamId: (activeExamId) => set({ activeExamId }),
  activeSessionId: null,
  setActiveSessionId: (activeSessionId) => set({ activeSessionId }),
  isLoading: false,
  setIsLoading: (isLoading) => set({ isLoading }),
}))
