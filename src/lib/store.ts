import { create } from 'zustand'

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS'

export interface HeaderEntry {
  id: string
  key: string
  value: string
  enabled: boolean
}

export interface KeyValue {
  id: string
  key: string
  value: string
  enabled: boolean
}

export interface ResponseData {
  status: number
  statusText: string
  headers: Record<string, string>
  body: string
  size: number
  time: number
}

interface AppState {
  // Request
  method: HttpMethod
  setMethod: (method: HttpMethod) => void
  url: string
  setUrl: (url: string) => void
  headers: HeaderEntry[]
  setHeaders: (headers: HeaderEntry[]) => void
  body: string
  setBody: (body: string) => void
  params: KeyValue[]
  setParams: (params: KeyValue[]) => void

  // Response
  response: ResponseData | null
  setResponse: (response: ResponseData | null) => void
  isLoading: boolean
  setIsLoading: (loading: boolean) => void

  // UI State
  prettyPrint: boolean
  setPrettyPrint: (pretty: boolean) => void
  activeTab: string
  setActiveTab: (tab: string) => void
  requestTab: string
  setRequestTab: (tab: string) => void
  showRequestBody: boolean
  setShowRequestBody: (show: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  method: 'GET',
  setMethod: (method) => set({ method }),
  url: '',
  setUrl: (url) => set({ url }),
  headers: [
    { id: '1', key: 'Content-Type', value: 'application/json', enabled: true },
  ],
  setHeaders: (headers) => set({ headers }),
  body: '',
  setBody: (body) => set({ body }),
  params: [],
  setParams: (params) => set({ params }),

  response: null,
  setResponse: (response) => set({ response }),
  isLoading: false,
  setIsLoading: (isLoading) => set({ isLoading }),

  prettyPrint: true,
  setPrettyPrint: (prettyPrint) => set({ prettyPrint }),
  activeTab: 'body',
  setActiveTab: (activeTab) => set({ activeTab }),
  requestTab: 'params',
  setRequestTab: (requestTab) => set({ requestTab }),
  showRequestBody: false,
  setShowRequestBody: (showRequestBody) => set({ showRequestBody }),
}))
