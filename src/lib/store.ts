import { create } from 'zustand'

export type View = 'login' | 'admin' | 'student' | 'exam'

export interface User {
  id: string
  email: string
  name: string
  role: 'ADMIN' | 'SISWA'
  class?: string | null
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

interface AppState {
  // Auth
  user: User | null
  setUser: (user: User | null) => void
  
  // Navigation
  currentView: View
  setCurrentView: (view: View) => void
  
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
  
  // Loading states
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  
  currentView: 'login',
  setCurrentView: (currentView) => set({ currentView }),
  
  adminTab: 'exams',
  setAdminTab: (adminTab) => set({ adminTab }),
  selectedExam: null,
  setSelectedExam: (selectedExam) => set({ selectedExam }),
  
  studentTab: 'exams',
  setStudentTab: (studentTab) => set({ studentTab }),
  activeSession: null,
  setActiveSession: (activeSession) => set({ activeSession }),
  
  isLoading: false,
  setIsLoading: (isLoading) => set({ isLoading }),
}))
