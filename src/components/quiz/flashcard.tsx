'use client'

import { useState } from 'react'
import { motion } from 'motion/react'
import { RotateCcw, ThumbsDown, Minus, ThumbsUp, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { FlashcardRating } from '@/lib/quiz-engine'

interface FlashcardProps {
  question: string
  answer: string
  onRate: (rating: FlashcardRating) => void
  cardNumber: number
  totalCards: number
}

export function Flashcard({ question, answer, onRate, cardNumber, totalCards }: FlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false)

  const ratingButtons: { rating: FlashcardRating; label: string; icon: React.ReactNode; color: string }[] = [
    { rating: 'again', label: 'Again', icon: <RotateCcw className="h-4 w-4" />, color: 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border-red-500/30' },
    { rating: 'hard', label: 'Hard', icon: <ThumbsDown className="h-4 w-4" />, color: 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 border-orange-500/30' },
    { rating: 'good', label: 'Good', icon: <ThumbsUp className="h-4 w-4" />, color: 'bg-green-500/20 text-green-400 hover:bg-green-500/30 border-green-500/30' },
    { rating: 'easy', label: 'Easy', icon: <Zap className="h-4 w-4" />, color: 'bg-cai-blue/20 text-cai-blue hover:bg-cai-blue/30 border-cai-blue/30' },
  ]

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Card counter */}
      <p className="text-sm text-muted-foreground">
        Card {cardNumber} of {totalCards}
      </p>

      {/* 3D Flip Card */}
      <div
        className="relative w-full max-w-lg cursor-pointer"
        style={{ perspective: '1200px' }}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <motion.div
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.6, type: 'spring', stiffness: 100, damping: 15 }}
          style={{ transformStyle: 'preserve-3d' }}
          className="relative w-full min-h-[280px]"
        >
          {/* Front (Question) */}
          <div
            className={cn(
              'absolute inset-0 rounded-xl border-2 border-border/50 p-8',
              'bg-gradient-to-br from-card to-card/80',
              'flex flex-col items-center justify-center text-center',
              'shadow-lg shadow-black/20'
            )}
            style={{ backfaceVisibility: 'hidden' }}
          >
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4">
              Question
            </p>
            <p className="text-xl font-medium leading-relaxed">
              {question}
            </p>
            <p className="text-xs text-muted-foreground mt-6">
              Tap to reveal answer
            </p>
          </div>

          {/* Back (Answer) */}
          <div
            className={cn(
              'absolute inset-0 rounded-xl border-2 border-cai-teal/50 p-8',
              'bg-gradient-to-br from-cai-teal/10 to-card',
              'flex flex-col items-center justify-center text-center',
              'shadow-lg shadow-cai-teal/10'
            )}
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <p className="text-xs uppercase tracking-widest text-cai-teal mb-4">
              Answer
            </p>
            <p className="text-lg leading-relaxed">
              {answer}
            </p>
          </div>
        </motion.div>
      </div>

      {/* Rating buttons (only visible after flip) */}
      {isFlipped && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-3"
        >
          {ratingButtons.map(({ rating, label, icon, color }) => (
            <Button
              key={rating}
              variant="outline"
              size="sm"
              className={cn('gap-2 border', color)}
              onClick={(e) => {
                e.stopPropagation()
                onRate(rating)
                setIsFlipped(false)
              }}
            >
              {icon}
              {label}
            </Button>
          ))}
        </motion.div>
      )}
    </div>
  )
}
