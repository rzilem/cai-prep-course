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
  RefreshCw,
  MessageSquare,
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

import { FadeIn } from '@/components/fade-in'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  citations?: { lessonTitle: string; moduleTitle: string; courseSlug: string }[]
  timestamp: Date
}

// ---------------------------------------------------------------------------
// Mock Responses
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

function getMockResponse(question: string): {
  content: string
  citations: ChatMessage['citations']
} {
  const q = question.toLowerCase()

  if (q.includes('fiduciary')) {
    return {
      content: `**Fiduciary duties** are the legal obligations that board members and managers owe to the community association and its members. These duties include:

**1. Duty of Care** - Making informed decisions by reviewing relevant information, attending meetings, and staying educated about community management practices.

**2. Duty of Loyalty** - Acting in the best interests of the association, not for personal benefit. This includes avoiding conflicts of interest and self-dealing.

**3. Duty of Obedience** - Acting within the scope of authority granted by the governing documents and applicable law.

**The Business Judgment Rule** provides protection for board members who:
- Act in good faith
- Make informed decisions
- Act in the association's best interest
- Use reasonable care

In Texas, fiduciary duties are reinforced by Property Code Section 209.0051, which requires board members to exercise their powers in good faith and in a manner they reasonably believe to be in the association's best interest.`,
      citations: [
        {
          lessonTitle: 'Fiduciary Duties & Obligations',
          moduleTitle: 'Legal, Ethics & Risk Management',
          courseSlug: 'cmca',
        },
        {
          lessonTitle: 'Texas Property Code Ch. 209',
          moduleTitle: 'Legal, Ethics & Risk Management',
          courseSlug: 'cmca',
        },
      ],
    }
  }

  if (q.includes('chapter 209') || q.includes('property code')) {
    return {
      content: `**Texas Property Code Chapter 209** is the primary state law governing residential property owners associations (POAs) in Texas. Key provisions include:

**Applicability:** Applies to all residential POAs in Texas that require mandatory membership.

**Key Sections:**
- **209.005** - Dedicatory Instruments: Rules for amending CC&Rs, bylaws, and other governing documents
- **209.006** - Notice and Hearing: Requires written notice and opportunity for hearing before fines can be imposed
- **209.0062** - Payment Priority: Payments must be applied to assessments first, then to fees and attorney costs
- **209.009** - Assessment Liens: HOAs can place liens for unpaid assessments
- **209.0091** - Foreclosure: HOAs cannot foreclose solely for unpaid fines (only for unpaid assessments)
- **209.011** - Right to Inspect Records: Owners can inspect association books and records

**Recent Amendments** have strengthened homeowner protections regarding foreclosure, notice requirements, and board election procedures.

This is considered **critical** content for anyone managing HOAs in Texas.`,
      citations: [
        {
          lessonTitle: 'Texas Property Code Ch. 209',
          moduleTitle: 'Legal, Ethics & Risk Management',
          courseSlug: 'cmca',
        },
        {
          lessonTitle: 'Texas Governance Requirements',
          moduleTitle: 'Community Governance',
          courseSlug: 'cmca',
        },
      ],
    }
  }

  if (q.includes('cmca') && (q.includes('exam') || q.includes('format'))) {
    return {
      content: `**CMCA Exam Details:**

**Format:** 100 multiple-choice questions
**Time Limit:** 3 hours
**Passing Score:** Scaled score of 500 (approximately 70%)
**Delivery:** Computer-based testing at Pearson VUE centers

**Exam Domain Weights:**
1. Financial Management — **19%**
2. Community Governance — **18%**
3. Legal, Ethics & Risk Management — **18%**
4. Facilities Management — **14%**
5. Community Relations — **14%**
6. Human Resources — **10%**
7. Communications & Technology — **7%**

**Study Strategy:** Focus heavily on the top 3 domains (Financial, Governance, Legal) as they make up 55% of the exam. The CAI recommends at least 60 hours of study preparation.

**Recertification:** Every 2 years, requiring 16 continuing education credits.`,
      citations: [
        {
          lessonTitle: 'Budgeting Fundamentals',
          moduleTitle: 'Financial Management',
          courseSlug: 'cmca',
        },
      ],
    }
  }

  if (q.includes('reserve fund')) {
    return {
      content: `**Reserve Funds** are savings accounts that community associations maintain to fund major repairs and replacements of common elements. They are essential for long-term financial health.

**Key Concepts:**

**Reserve Study:** A professional analysis that:
- Inventories all major common elements (roofs, roads, pools, etc.)
- Estimates remaining useful life of each component
- Projects future replacement costs
- Recommends annual funding levels

**Funding Methods:**
- **Full Funding:** Target is 100% of estimated replacement costs — considered the gold standard
- **Threshold Funding:** Maintain reserves above a minimum threshold
- **Baseline Funding:** Keep reserves above $0 (high risk)
- **Statutory Funding:** Meet minimum state requirements

**In Texas:** There is no state mandate requiring reserves, but fiduciary duty essentially requires boards to plan for known future expenses. Underfunding reserves can expose board members to personal liability.

**Best Practice:** Update reserve studies every 3-5 years and fund at the full funding level.`,
      citations: [
        {
          lessonTitle: 'Reserve Fund Analysis & Planning',
          moduleTitle: 'Financial Management',
          courseSlug: 'cmca',
        },
        {
          lessonTitle: 'Texas HOA Financial Requirements',
          moduleTitle: 'Financial Management',
          courseSlug: 'cmca',
        },
      ],
    }
  }

  // Default response
  return {
    content: `That is a great question! Based on the CAI course materials, here is what I can share:

This topic is covered in detail across multiple modules in the CMCA certification track. I would recommend reviewing the relevant lessons for comprehensive coverage.

**Key Study Tips:**
- Review the lesson content and key points
- Practice with the lesson quizzes to test your understanding
- Use the flashcard system for spaced repetition
- Pay special attention to Texas-specific callouts if you manage Texas communities

Would you like me to point you to specific lessons, or do you have a more specific question I can help with?`,
    citations: [
      {
        lessonTitle: 'Course Overview',
        moduleTitle: 'Getting Started',
        courseSlug: 'cmca',
      },
    ],
  }
}

// ---------------------------------------------------------------------------
// Study Assistant Page
// ---------------------------------------------------------------------------

export default function StudyAssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    // Auto-scroll to bottom on new messages
    if (scrollRef.current) {
      const viewport = scrollRef.current.querySelector(
        '[data-slot=scroll-area-viewport]'
      )
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight
      }
    }
  }, [messages, isTyping])

  function handleSend(text?: string) {
    const question = text || input.trim()
    if (!question) return

    // Add user message
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: question,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    // Simulate AI response after a delay
    setTimeout(() => {
      const response = getMockResponse(question)
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: response.content,
        citations: response.citations,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, aiMsg])
      setIsTyping(false)
    }, 1200 + Math.random() * 800)
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
            {messages.length === 0 && (
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

                  {/* Suggested questions */}
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

            {/* Messages */}
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
                      <Bot className="size-4 text-cai-blue" />
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
                          : 'bg-muted rounded-bl-md'
                      }`}
                    >
                      {msg.role === 'assistant' ? (
                        <div className="space-y-2">
                          {msg.content.split('\n').map((line, i) => {
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
                      ) : (
                        msg.content
                      )}
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

            {/* Typing indicator */}
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3"
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-cai-blue/10 mt-1">
                  <Bot className="size-4 text-cai-blue" />
                </div>
                <div className="rounded-2xl rounded-bl-md bg-muted px-4 py-3">
                  <div className="flex gap-1">
                    <motion.div
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{
                        repeat: Infinity,
                        duration: 1.2,
                        delay: 0,
                      }}
                      className="size-2 rounded-full bg-muted-foreground"
                    />
                    <motion.div
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{
                        repeat: Infinity,
                        duration: 1.2,
                        delay: 0.2,
                      }}
                      className="size-2 rounded-full bg-muted-foreground"
                    />
                    <motion.div
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{
                        repeat: Infinity,
                        duration: 1.2,
                        delay: 0.4,
                      }}
                      className="size-2 rounded-full bg-muted-foreground"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </ScrollArea>

        {/* ── Suggested Questions (when conversation started) ──── */}
        {messages.length > 0 && messages.length < 4 && (
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
                className="w-full resize-none rounded-xl border bg-muted/30 px-4 py-3 pr-12 text-sm outline-none placeholder:text-muted-foreground focus:border-cai-blue/50 focus:ring-1 focus:ring-cai-blue/30"
                style={{ minHeight: '48px', maxHeight: '120px' }}
              />
            </div>
            <Button
              onClick={() => handleSend()}
              disabled={!input.trim() || isTyping}
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
