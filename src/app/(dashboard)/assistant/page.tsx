'use client'

import { useState, useRef, useEffect } from 'react'
import {
  Send,
  Bot,
  User,
  Sparkles,
  BookOpen,
  Scale,
  FileText,
  AlertCircle,
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

import { FadeIn } from '@/components/fade-in'
import {
  Card,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { createClient } from '@/lib/supabase/client'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  citations?: { lessonTitle: string; moduleTitle: string; courseSlug: string }[]
  timestamp: Date
  isError?: boolean
}

// ---------------------------------------------------------------------------
// Suggested Questions
// ---------------------------------------------------------------------------

const suggestedQuestions = [
  {
    text: 'What are fiduciary duties?',
    icon: Scale,
    category: 'Legal',
  },
  {
    text: 'Explain Texas Property Code Chapter 209',
    icon: Scale,
    category: 'Texas Law',
  },
  {
    text: 'CMCA exam format and passing score?',
    icon: FileText,
    category: 'Exam Info',
  },
  {
    text: 'How do reserve funds work?',
    icon: BookOpen,
    category: 'Financial',
  },
  {
    text: 'What is the difference between CMCA, AMS, and PCAM?',
    icon: FileText,
    category: 'Credentials',
  },
  {
    text: 'Best practices for covenant enforcement',
    icon: BookOpen,
    category: 'Governance',
  },
]

// ---------------------------------------------------------------------------
// Markdown renderer (same as original)
// ---------------------------------------------------------------------------

function renderMarkdownContent(content: string) {
  return (
    <div className="space-y-2">
      {content.split('\n').map((line, i) => {
        if (line.startsWith('**') && line.endsWith('**'))
          return (
            <p key={i} className="font-semibold mt-2">
              {line.replace(/\*\*/g, '')}
            </p>
          )
        if (line.startsWith('**') && line.includes(':**'))
          return (
            <p key={i} className="mt-2">
              <span
                dangerouslySetInnerHTML={{
                  __html: line.replace(
                    /\*\*(.*?)\*\*/g,
                    '<strong>$1</strong>'
                  ),
                }}
              />
            </p>
          )
        if (line.startsWith('- **'))
          return (
            <li key={i} className="ml-4 list-disc">
              <span
                dangerouslySetInnerHTML={{
                  __html: line
                    .replace('- ', '')
                    .replace(
                      /\*\*(.*?)\*\*/g,
                      '<strong>$1</strong>'
                    ),
                }}
              />
            </li>
          )
        if (line.match(/^\d+\./))
          return (
            <li key={i} className="ml-4 list-decimal">
              <span
                dangerouslySetInnerHTML={{
                  __html: line
                    .replace(/^\d+\.\s*/, '')
                    .replace(
                      /\*\*(.*?)\*\*/g,
                      '<strong>$1</strong>'
                    ),
                }}
              />
            </li>
          )
        if (line.trim() === '') return <br key={i} />
        return (
          <p key={i}>
            <span
              dangerouslySetInnerHTML={{
                __html: line.replace(
                  /\*\*(.*?)\*\*/g,
                  '<strong>$1</strong>'
                ),
              }}
            />
          </p>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Study Assistant Page
// ---------------------------------------------------------------------------

export default function StudyAssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  // Scroll to bottom whenever messages or streaming content changes
  useEffect(() => {
    if (scrollRef.current) {
      const viewport = scrollRef.current.querySelector(
        '[data-slot=scroll-area-viewport]'
      )
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight
      }
    }
  }, [messages, streamingContent])

  async function handleSend(text?: string) {
    const question = text || input.trim()
    if (!question || isStreaming) return

    // Add user message immediately
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: question,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsStreaming(true)
    setStreamingContent('')

    // Get user email for context (non-blocking)
    let userEmail: string | undefined
    try {
      const supabase = createClient()
      const { data } = await supabase.auth.getUser()
      userEmail = data.user?.email ?? undefined
    } catch {
      // Auth failure is non-blocking — continue without email
    }

    abortRef.current = new AbortController()

    try {
      const response = await fetch('/api/study-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: question,
          course_filter: null,
          user_email: userEmail,
        }),
        signal: abortRef.current.signal,
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`)
      }

      if (!response.body) {
        throw new Error('No response body from API')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        // Process complete SSE lines from buffer
        const lines = buffer.split('\n')
        // Keep the last potentially incomplete line in buffer
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed || !trimmed.startsWith('data:')) continue

          const dataStr = trimmed.slice(5).trim()
          if (dataStr === '[DONE]') {
            // Stream finished — commit the final message
            const finalContent = accumulated
            setStreamingContent('')
            setMessages((prev) => [
              ...prev,
              {
                id: `ai-${Date.now()}`,
                role: 'assistant',
                content: finalContent,
                timestamp: new Date(),
              },
            ])
            setIsStreaming(false)
            return
          }

          try {
            const parsed = JSON.parse(dataStr)
            if (parsed.content) {
              accumulated += parsed.content
              setStreamingContent(accumulated)
            }
          } catch {
            // Malformed JSON chunk — skip and continue
          }
        }
      }

      // Stream ended without [DONE] marker — commit whatever we have
      if (accumulated) {
        setStreamingContent('')
        setMessages((prev) => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            role: 'assistant',
            content: accumulated,
            timestamp: new Date(),
          },
        ])
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        // User cancelled — no error message needed
      } else {
        const errorMsg =
          err instanceof Error ? err.message : 'Unknown error occurred'
        setMessages((prev) => [
          ...prev,
          {
            id: `ai-error-${Date.now()}`,
            role: 'assistant',
            content: `Sorry, I could not reach the study assistant right now. Please try again in a moment.\n\nError: ${errorMsg}`,
            timestamp: new Date(),
            isError: true,
          },
        ])
      }
    } finally {
      setIsStreaming(false)
      setStreamingContent('')
      abortRef.current = null
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      {/* ── Header ───────────────────────────────────────────────── */}
      <FadeIn delay={0}>
        <div className="mb-4">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Bot className="size-8 text-cai-blue" />
            Study Assistant
          </h1>
          <p className="mt-1 text-muted-foreground">
            Ask any question about CAI certifications, HOA management, or Texas
            law
          </p>
        </div>
      </FadeIn>

      {/* ── Chat Area ────────────────────────────────────────────── */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        <ScrollArea ref={scrollRef} className="flex-1 px-6">
          <div className="py-6 space-y-6">
            {/* Empty state */}
            {messages.length === 0 && !isStreaming && (
              <FadeIn delay={100}>
                <div className="flex flex-col items-center gap-6 py-12 text-center">
                  <div className="flex size-16 items-center justify-center rounded-full bg-cai-blue/10">
                    <Sparkles className="size-8 text-cai-blue" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">
                      Ask about any CAI topic
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground max-w-md">
                      I can help you understand certification content, Texas HOA
                      law, exam preparation strategies, and more.
                    </p>
                  </div>

                  {/* Suggested questions grid */}
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 w-full max-w-2xl">
                    {suggestedQuestions.map((q, i) => (
                      <motion.button
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 + i * 0.08, duration: 0.3 }}
                        onClick={() => handleSend(q.text)}
                        className="flex items-start gap-2 rounded-lg border p-3 text-left text-sm transition-colors hover:bg-muted/50 hover:border-cai-blue/30"
                      >
                        <q.icon className="size-4 text-cai-blue shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium">{q.text}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {q.category}
                          </p>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              </FadeIn>
            )}

            {/* Committed messages */}
            <AnimatePresence>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex gap-3 ${
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {msg.role === 'assistant' && (
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-cai-blue/10 mt-1">
                      {msg.isError ? (
                        <AlertCircle className="size-4 text-destructive" />
                      ) : (
                        <Bot className="size-4 text-cai-blue" />
                      )}
                    </div>
                  )}

                  <div
                    className={`max-w-[700px] space-y-3 ${
                      msg.role === 'user' ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div
                      className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-cai-blue text-white rounded-br-md'
                          : msg.isError
                          ? 'bg-destructive/10 border border-destructive/20 rounded-bl-md text-destructive'
                          : 'bg-muted rounded-bl-md'
                      }`}
                    >
                      {msg.role === 'assistant'
                        ? renderMarkdownContent(msg.content)
                        : msg.content}
                    </div>

                    {/* Citations */}
                    {msg.citations && msg.citations.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {msg.citations.map((cite, ci) => (
                          <Badge
                            key={ci}
                            variant="outline"
                            className="text-[10px] gap-1 px-2 py-0.5 border-cai-blue/30 text-cai-blue"
                          >
                            <BookOpen className="size-2.5" />
                            {cite.lessonTitle}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {msg.role === 'user' && (
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-cai-teal/10 mt-1">
                      <User className="size-4 text-cai-teal" />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Live streaming bubble — shows partial content as it arrives */}
            {isStreaming && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3 justify-start"
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-cai-blue/10 mt-1">
                  <Bot className="size-4 text-cai-blue" />
                </div>
                <div className="max-w-[700px] items-start">
                  <div className="rounded-2xl rounded-bl-md bg-muted px-4 py-3 text-sm leading-relaxed">
                    {streamingContent ? (
                      <>
                        {renderMarkdownContent(streamingContent)}
                        {/* Blinking cursor to indicate active streaming */}
                        <span className="inline-block w-0.5 h-4 bg-cai-blue ml-0.5 animate-pulse align-middle" />
                      </>
                    ) : (
                      /* Typing dots while waiting for first chunk */
                      <div className="flex gap-1">
                        <motion.div
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ repeat: Infinity, duration: 1.2, delay: 0 }}
                          className="size-2 rounded-full bg-muted-foreground"
                        />
                        <motion.div
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ repeat: Infinity, duration: 1.2, delay: 0.2 }}
                          className="size-2 rounded-full bg-muted-foreground"
                        />
                        <motion.div
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ repeat: Infinity, duration: 1.2, delay: 0.4 }}
                          className="size-2 rounded-full bg-muted-foreground"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </ScrollArea>

        {/* ── Suggested Questions (when conversation has started) ── */}
        {messages.length > 0 && messages.length < 4 && !isStreaming && (
          <div className="border-t px-6 py-2">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {suggestedQuestions.slice(0, 4).map((q, i) => (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSend(q.text)}
                  className="shrink-0 text-xs gap-1"
                >
                  <q.icon className="size-3" />
                  {q.text}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* ── Input Area ─────────────────────────────────────────── */}
        <div className="border-t p-4">
          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about any CAI topic..."
                rows={1}
                disabled={isStreaming}
                className="w-full resize-none rounded-xl border bg-muted/30 px-4 py-3 pr-12 text-sm outline-none placeholder:text-muted-foreground focus:border-cai-blue/50 focus:ring-1 focus:ring-cai-blue/30 disabled:opacity-60"
                style={{ minHeight: '48px', maxHeight: '120px' }}
              />
            </div>
            <Button
              onClick={() => handleSend()}
              disabled={!input.trim() || isStreaming}
              className="bg-cai-blue hover:bg-cai-blue/90 size-12 rounded-xl"
            >
              <Send className="size-4" />
            </Button>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground text-center">
            AI-powered study assistant. Responses are based on course materials
            and may not cover every topic.
          </p>
        </div>
      </Card>
    </div>
  )
}
