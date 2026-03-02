'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { CheckCircle, XCircle, AlertTriangle, Scale } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Question } from '@/lib/types'

interface QuizQuestionProps {
  question: Question
  questionNumber: number
  totalQuestions: number
  onAnswer: (selected: string, isCorrect: boolean) => void
  showFeedback: boolean
  selectedAnswer?: string
  isReview?: boolean
}

export function QuizQuestion({
  question,
  questionNumber,
  totalQuestions,
  onAnswer,
  showFeedback,
  selectedAnswer,
  isReview,
}: QuizQuestionProps) {
  const [selected, setSelected] = useState<string | null>(selectedAnswer ?? null)
  const [submitted, setSubmitted] = useState(!!selectedAnswer)

  const correctAnswer = question.choices.find((c) => c.is_correct)?.text

  function handleSelect(choiceText: string) {
    if (submitted) return
    setSelected(choiceText)
  }

  function handleSubmit() {
    if (!selected || submitted) return
    setSubmitted(true)
    const isCorrect = selected === correctAnswer
    onAnswer(selected, isCorrect)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <Badge variant="outline" className="text-xs">
              Question {questionNumber} of {totalQuestions}
            </Badge>
            <div className="flex items-center gap-2">
              {question.exam_domain && (
                <Badge className="bg-cai-blue/20 text-cai-blue text-xs">
                  {question.exam_domain}
                </Badge>
              )}
              <Badge
                variant="outline"
                className={cn(
                  'text-xs',
                  question.difficulty <= 2 && 'border-green-500/50 text-green-400',
                  question.difficulty === 3 && 'border-yellow-500/50 text-yellow-400',
                  question.difficulty >= 4 && 'border-red-500/50 text-red-400'
                )}
              >
                {'★'.repeat(question.difficulty)}{'☆'.repeat(5 - question.difficulty)}
              </Badge>
            </div>
          </div>

          {/* Question text */}
          <p className="text-lg font-medium mb-6 leading-relaxed">
            {question.question_text}
          </p>

          {/* Texas Law Reference */}
          {question.texas_law_reference && (
            <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-md bg-amber-500/10 border border-amber-500/20">
              <Scale className="h-4 w-4 text-amber-500 shrink-0" />
              <span className="text-sm text-amber-400">
                Related: {question.texas_law_reference}
              </span>
            </div>
          )}

          {/* Choices */}
          <div className="space-y-3">
            {question.choices.map((choice, idx) => {
              const letter = String.fromCharCode(65 + idx)
              const isSelected = selected === choice.text
              const isCorrectChoice = choice.is_correct
              const showResult = submitted && showFeedback

              return (
                <motion.button
                  key={idx}
                  onClick={() => handleSelect(choice.text)}
                  disabled={submitted}
                  whileHover={!submitted ? { scale: 1.01 } : undefined}
                  whileTap={!submitted ? { scale: 0.99 } : undefined}
                  className={cn(
                    'w-full text-left p-4 rounded-lg border-2 transition-all duration-200',
                    'flex items-start gap-3',
                    // Default state
                    !isSelected && !showResult && 'border-border/50 hover:border-border bg-background/50 hover:bg-background/80',
                    // Selected but not submitted
                    isSelected && !submitted && 'border-cai-blue bg-cai-blue/10',
                    // Correct answer revealed
                    showResult && isCorrectChoice && 'border-green-500 bg-green-500/10',
                    // Wrong answer selected
                    showResult && isSelected && !isCorrectChoice && 'border-red-500 bg-red-500/10',
                    // Not selected, not correct, after submission
                    showResult && !isSelected && !isCorrectChoice && 'border-border/30 opacity-50',
                  )}
                >
                  <span
                    className={cn(
                      'shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                      !isSelected && !showResult && 'bg-muted text-muted-foreground',
                      isSelected && !submitted && 'bg-cai-blue text-white',
                      showResult && isCorrectChoice && 'bg-green-500 text-white',
                      showResult && isSelected && !isCorrectChoice && 'bg-red-500 text-white',
                    )}
                  >
                    {showResult && isCorrectChoice ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : showResult && isSelected && !isCorrectChoice ? (
                      <XCircle className="h-5 w-5" />
                    ) : (
                      letter
                    )}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm">{choice.text}</p>
                    {showResult && isSelected && choice.explanation && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="text-xs text-muted-foreground mt-2 italic"
                      >
                        {choice.explanation}
                      </motion.p>
                    )}
                  </div>
                </motion.button>
              )
            })}
          </div>

          {/* Explanation after submit */}
          <AnimatePresence>
            {submitted && showFeedback && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 p-4 rounded-lg bg-muted/50 border border-border/50"
              >
                <div className="flex items-start gap-2">
                  {selected === correctAnswer ? (
                    <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="text-sm font-medium mb-1">
                      {selected === correctAnswer ? 'Correct!' : 'Incorrect'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {question.explanation}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit button */}
          {!submitted && (
            <div className="mt-6 flex justify-end">
              <Button
                onClick={handleSubmit}
                disabled={!selected}
                className="bg-cai-blue hover:bg-cai-blue/90"
              >
                Submit Answer
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
