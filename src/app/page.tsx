'use client'

import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Code2,
  Eye,
  FolderOpen,
  ChevronDown,
  ExternalLink,
  Copy,
  Check,
  Send,
  Loader2,
  Clock,
  HardDrive,
  AlertCircle,
  Plus,
  Trash2,
  X,
  ChevronRight,
  Braces,
  FileJson,
  Globe,
  Zap,
} from 'lucide-react'
import { useAppStore, type HttpMethod } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const METHOD_COLORS: Record<HttpMethod, string> = {
  GET: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  POST: 'text-amber-600 bg-amber-50 border-amber-200',
  PUT: 'text-sky-600 bg-sky-50 border-sky-200',
  PATCH: 'text-violet-600 bg-violet-50 border-violet-200',
  DELETE: 'text-rose-600 bg-rose-50 border-rose-200',
  HEAD: 'text-slate-600 bg-slate-50 border-slate-200',
  OPTIONS: 'text-teal-600 bg-teal-50 border-teal-200',
}

const METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']

function generateId() {
  return Math.random().toString(36).substring(2, 9)
}

// Syntax highlight JSON
function syntaxHighlight(json: string): string {
  if (!json) return ''
  json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return json.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    (match) => {
      let cls = 'json-number'
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = 'json-key'
        } else {
          cls = 'json-string'
        }
      } else if (/true|false/.test(match)) {
        cls = 'json-boolean'
      } else if (/null/.test(match)) {
        cls = 'json-null'
      }
      return `<span class="${cls}">${match}</span>`
    }
  )
}

export default function Home() {
  const {
    method, setMethod,
    url, setUrl,
    headers, setHeaders,
    body, setBody,
    params, setParams,
    response, setResponse,
    isLoading, setIsLoading,
    prettyPrint, setPrettyPrint,
    activeTab, setActiveTab,
    requestTab, setRequestTab,
    showRequestBody, setShowRequestBody,
  } = useAppStore()

  const [copied, setCopied] = useState(false)
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set())

  const sendRequest = useCallback(async () => {
    if (!url.trim()) return
    setIsLoading(true)
    setResponse(null)

    try {
      const res = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method,
          url: url.trim(),
          headers: headers.filter(h => h.enabled && h.key).reduce((acc, h) => {
            acc[h.key] = h.value
            return acc
          }, {} as Record<string, string>),
          body: ['POST', 'PUT', 'PATCH'].includes(method) ? body : undefined,
        }),
      })
      const data = await res.json()
      setResponse(data)
    } catch (error) {
      setResponse({
        status: 0,
        statusText: 'Error',
        headers: {},
        body: JSON.stringify({ error: error instanceof Error ? error.message : 'Request failed' }, null, 2),
        size: 0,
        time: 0,
      })
    } finally {
      setIsLoading(false)
    }
  }, [url, method, headers, body, setResponse, setIsLoading])

  const copyResponse = useCallback(() => {
    if (!response?.body) return
    navigator.clipboard.writeText(response.body)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [response])

  const addHeader = () => {
    setHeaders([...headers, { id: generateId(), key: '', value: '', enabled: true }])
  }

  const removeHeader = (id: string) => {
    setHeaders(headers.filter(h => h.id !== id))
  }

  const updateHeader = (id: string, field: 'key' | 'value' | 'enabled', val: string | boolean) => {
    setHeaders(headers.map(h => h.id === id ? { ...h, [field]: val } : h))
  }

  const addParam = () => {
    setParams([...params, { id: generateId(), key: '', value: '', enabled: true }])
  }

  const removeParam = (id: string) => {
    setParams(params.filter(p => p.id !== id))
  }

  const updateParam = (id: string, field: 'key' | 'value' | 'enabled', val: string | boolean) => {
    setParams(params.map(p => p.id === id ? { ...p, [field]: val } : p))
  }

  const getDisplayBody = () => {
    if (!response?.body) return ''
    if (!prettyPrint) return response.body
    try {
      return JSON.stringify(JSON.parse(response.body), null, 2)
    } catch {
      return response.body
    }
  }

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'text-emerald-600 bg-emerald-50'
    if (status >= 300 && status < 400) return 'text-sky-600 bg-sky-50'
    if (status >= 400 && status < 500) return 'text-amber-600 bg-amber-50'
    if (status >= 500) return 'text-rose-600 bg-rose-50'
    return 'text-slate-600 bg-slate-50'
  }

  // Parse URL params from the URL
  useEffect(() => {
    try {
      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`)
      const searchParams = urlObj.searchParams
      const newParams: typeof params = []
      searchParams.forEach((value, key) => {
        newParams.push({ id: generateId(), key, value, enabled: true })
      })
      if (newParams.length > 0 && newParams.length !== params.length) {
        setParams(newParams)
      }
    } catch {
      // invalid URL, ignore
    }
  }, [url, params.length])

  const keyValueRows = (
    items: typeof headers,
    updateItem: (id: string, field: 'key' | 'value' | 'enabled', val: string | boolean) => void,
    removeItem: (id: string) => void,
    addItem: () => void,
  ) => (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.id} className="flex items-center gap-2">
          <Checkbox
            checked={item.enabled}
            onCheckedChange={(checked) => updateItem(item.id, 'enabled', !!checked)}
            className="shrink-0"
          />
          <Input
            placeholder="Key"
            value={item.key}
            onChange={(e) => updateItem(item.id, 'key', e.target.value)}
            className="h-8 text-xs font-mono flex-1"
          />
          <Input
            placeholder="Value"
            value={item.value}
            onChange={(e) => updateItem(item.id, 'value', e.target.value)}
            className="h-8 text-xs font-mono flex-1"
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 text-slate-400 hover:text-rose-500"
            onClick={() => removeItem(item.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}
      <Button
        variant="ghost"
        size="sm"
        className="h-7 text-xs text-slate-500 hover:text-slate-700"
        onClick={addItem}
      >
        <Plus className="h-3.5 w-3.5 mr-1" />
        Add
      </Button>
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                <Zap className="h-4.5 w-4.5 text-white" />
              </div>
              <h1 className="text-lg font-bold text-slate-800 tracking-tight">API Tester</h1>
            </div>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 bg-violet-50 text-violet-600 border-violet-200">
              v1.0
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Globe className="h-3.5 w-3.5" />
            <span>REST Client</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 space-y-4">
        {/* URL Bar */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-0">
            {/* Method Selector */}
            <Select value={method} onValueChange={(v) => setMethod(v as HttpMethod)}>
              <SelectTrigger className={`w-[120px] h-11 rounded-none border-0 border-r border-slate-200 text-sm font-semibold ${METHOD_COLORS[method]}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {METHODS.map((m) => (
                  <SelectItem key={m} value={m}>
                    <span className={`font-semibold ${METHOD_COLORS[m].split(' ')[0]}`}>{m}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* URL Input */}
            <div className="flex-1 relative">
              <FolderOpen className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Enter request URL (e.g., https://api.example.com/users)"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendRequest()}
                className="h-11 rounded-none border-0 pl-10 pr-4 text-sm font-mono focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>

            {/* Send Button */}
            <Button
              onClick={sendRequest}
              disabled={isLoading || !url.trim()}
              className="h-11 rounded-none px-6 bg-violet-600 hover:bg-violet-700 text-white font-medium gap-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Send
            </Button>
          </div>
        </div>

        {/* Request & Response Split */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Request Panel */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Code2 className="h-4 w-4 text-violet-500" />
                <span className="text-sm font-semibold text-slate-700">Request</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-slate-500"
                onClick={() => setShowRequestBody(!showRequestBody)}
              >
                {showRequestBody ? 'Hide' : 'Show'} Body
                <ChevronRight className={`h-3.5 w-3.5 ml-1 transition-transform ${showRequestBody ? 'rotate-90' : ''}`} />
              </Button>
            </div>

            <Tabs value={requestTab} onValueChange={setRequestTab}>
              <div className="px-4 pt-2">
                <TabsList className="h-8 bg-slate-50 p-0.5">
                  <TabsTrigger value="params" className="h-7 text-xs px-3 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                    Params
                    {params.length > 0 && (
                      <Badge variant="secondary" className="ml-1 h-4 px-1.5 text-[10px] bg-violet-50 text-violet-600">
                        {params.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="headers" className="h-7 text-xs px-3 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                    Headers
                    <Badge variant="secondary" className="ml-1 h-4 px-1.5 text-[10px] bg-violet-50 text-violet-600">
                      {headers.filter(h => h.enabled && h.key).length}
                    </Badge>
                  </TabsTrigger>
                  {showRequestBody && (
                    <TabsTrigger value="body" className="h-7 text-xs px-3 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                      Body
                    </TabsTrigger>
                  )}
                </TabsList>
              </div>

              <div className="p-4 max-h-80 overflow-y-auto custom-scrollbar">
                <TabsContent value="params" className="mt-0">
                  {keyValueRows(params, updateParam, removeParam, addParam)}
                </TabsContent>
                <TabsContent value="headers" className="mt-0">
                  {keyValueRows(headers, updateHeader, removeHeader, addHeader)}
                </TabsContent>
                <TabsContent value="body" className="mt-0">
                  <Textarea
                    placeholder='{"key": "value"}'
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    className="min-h-[150px] text-xs font-mono resize-none"
                  />
                </TabsContent>
              </div>
            </Tabs>
          </div>

          {/* Response Panel */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-violet-500" />
                <span className="text-sm font-semibold text-slate-700">Response</span>
              </div>
              <div className="flex items-center gap-3">
                {/* Pretty Print Toggle */}
                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                  <Checkbox
                    checked={prettyPrint}
                    onCheckedChange={(checked) => setPrettyPrint(!!checked)}
                    className="h-3.5 w-3.5"
                  />
                  <span className="text-xs text-slate-500">Pretty print</span>
                </label>
                {/* Copy Button */}
                {response && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-slate-500 gap-1"
                    onClick={copyResponse}
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? 'Copied' : 'Copy'}
                  </Button>
                )}
              </div>
            </div>

            {/* Response Stats */}
            {response && (
              <div className="flex items-center gap-3 px-4 py-2 border-b border-slate-100 bg-slate-50/50">
                <Badge className={`text-xs font-semibold border ${getStatusColor(response.status)}`}>
                  {response.status} {response.statusText}
                </Badge>
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <Clock className="h-3 w-3" />
                  {response.time}ms
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <HardDrive className="h-3 w-3" />
                  {response.size > 1024 ? `${(response.size / 1024).toFixed(1)} KB` : `${response.size} B`}
                </div>
              </div>
            )}

            {/* Response Tabs */}
            {response && (
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <div className="px-4 pt-2">
                  <TabsList className="h-8 bg-slate-50 p-0.5">
                    <TabsTrigger value="body" className="h-7 text-xs px-3 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                      Body
                    </TabsTrigger>
                    <TabsTrigger value="headers" className="h-7 text-xs px-3 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                      Headers
                    </TabsTrigger>
                  </TabsList>
                </div>

                <div className="p-4 max-h-80 overflow-y-auto custom-scrollbar">
                  <TabsContent value="body" className="mt-0">
                    {response.body ? (
                      <div className="relative">
                        <pre className="text-xs font-mono leading-relaxed whitespace-pre-wrap break-all bg-slate-50 rounded-lg p-3 border border-slate-100">
                          <code
                            dangerouslySetInnerHTML={{
                              __html: prettyPrint
                                ? syntaxHighlight(getDisplayBody())
                                : response.body.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
                            }}
                          />
                        </pre>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-slate-400 text-xs">
                        No response body
                      </div>
                    )}
                  </TabsContent>
                  <TabsContent value="headers" className="mt-0">
                    <div className="space-y-1">
                      {Object.entries(response.headers).map(([key, value]) => (
                        <div key={key} className="flex items-start gap-2 text-xs font-mono py-1 border-b border-slate-50 last:border-0">
                          <span className="font-semibold text-violet-600 min-w-[180px] shrink-0">{key}</span>
                          <span className="text-slate-600 break-all">{value}</span>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
            )}

            {/* Empty State */}
            {!response && !isLoading && (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <div className="h-16 w-16 rounded-2xl bg-slate-50 flex items-center justify-center mb-4">
                  <FileJson className="h-8 w-8 text-slate-300" />
                </div>
                <p className="text-sm font-medium text-slate-500">No response yet</p>
                <p className="text-xs text-slate-400 mt-1">Enter a URL and click Send to get started</p>
              </div>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <Loader2 className="h-8 w-8 animate-spin text-violet-400 mb-3" />
                <p className="text-sm font-medium text-slate-500">Sending request...</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Start Examples */}
        {!response && !isLoading && (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl border border-slate-200 shadow-sm p-5"
            >
              <div className="flex items-center gap-2 mb-4">
                <Braces className="h-4 w-4 text-violet-500" />
                <h3 className="text-sm font-semibold text-slate-700">Quick Start</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  { label: 'Get Users', url: 'https://jsonplaceholder.typicode.com/users', method: 'GET' as HttpMethod },
                  { label: 'Get Posts', url: 'https://jsonplaceholder.typicode.com/posts', method: 'GET' as HttpMethod },
                  { label: 'Create Post', url: 'https://jsonplaceholder.typicode.com/posts', method: 'POST' as HttpMethod },
                  { label: 'Get Comments', url: 'https://jsonplaceholder.typicode.com/comments?postId=1', method: 'GET' as HttpMethod },
                  { label: 'Get Todos', url: 'https://jsonplaceholder.typicode.com/todos', method: 'GET' as HttpMethod },
                  { label: 'Get Photos', url: 'https://jsonplaceholder.typicode.com/photos?_limit=5', method: 'GET' as HttpMethod },
                ].map((example) => (
                  <button
                    key={example.label}
                    onClick={() => {
                      setUrl(example.url)
                      setMethod(example.method)
                      if (example.method === 'POST') {
                        setBody(JSON.stringify({ title: 'foo', body: 'bar', userId: 1 }, null, 2))
                        setShowRequestBody(true)
                        setRequestTab('body')
                      }
                    }}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-slate-100 hover:border-violet-200 hover:bg-violet-50/50 transition-all text-left group"
                  >
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${METHOD_COLORS[example.method]}`}>
                      {example.method}
                    </span>
                    <span className="text-xs text-slate-600 group-hover:text-violet-700 truncate">
                      {example.label}
                    </span>
                    <ExternalLink className="h-3 w-3 text-slate-300 ml-auto group-hover:text-violet-400 shrink-0" />
                  </button>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto py-3 px-4 text-center border-t border-slate-100 bg-white">
        <div className="inline-flex items-center gap-2 text-xs text-slate-400 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          API Tester &copy; {new Date().getFullYear()} &mdash; REST API Testing Tool
        </div>
      </footer>

      {/* JSON Syntax Highlight Styles */}
      <style jsx global>{`
        .json-key { color: #7c3aed; font-weight: 600; }
        .json-string { color: #059669; }
        .json-number { color: #2563eb; }
        .json-boolean { color: #d97706; }
        .json-null { color: #9ca3af; font-style: italic; }
      `}</style>
    </div>
  )
}
