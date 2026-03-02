'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ArrowRight, CheckCircle, RotateCcw, Star } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { ScenarioNode, ScenarioChoice } from '@/lib/quiz-engine'
import { evaluateScenarioPath } from '@/lib/quiz-engine'

interface ScenarioPlayerProps {
  title: string
  description: string
  nodes: ScenarioNode[]
  onComplete: (score: number, maxScore: number) => void
}

export function ScenarioPlayer({ title, description, nodes, onComplete }: ScenarioPlayerProps) {
  const [currentNodeId, setCurrentNodeId] = useState(nodes[0]?.id ?? '')
  const [path, setPath] = useState<{ nodeId: string; choiceIndex: number; score: number }[]>([])
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null)
  const [showConsequence, setShowConsequence] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  const currentNode = nodes.find((n) => n.id === currentNodeId)

  function handleChoiceSelect(choiceIndex: number) {
    if (showConsequence) return
    setSelectedChoice(choiceIndex)
  }

  function handleConfirm() {
    if (selectedChoice === null || !currentNode) return

    const choice = currentNode.choices[selectedChoice]
    setShowConsequence(true)

    setPath((prev) => [...prev, {
      nodeId: currentNodeId,
      choiceIndex: selectedChoice,
      score: choice.score,
    }])

    // Move to next node after delay
    setTimeout(() => {
      const nextNode = nodes.find((n) => n.id === choice.nextNodeId)
      if (!nextNode || nextNode.isEnd) {
        const finalPath = [...path, { nodeId: currentNodeId, choiceIndex: selectedChoice, score: choice.score }]
        const result = evaluateScenarioPath(finalPath)
        setIsComplete(true)
        onComplete(result.totalScore, result.maxScore)
      } else {
        setCurrentNodeId(choice.nextNodeId)
        setSelectedChoice(null)
        setShowConsequence(false)
      }
    }, 2000)
  }

  function handleRestart() {
    setCurrentNodeId(nodes[0]?.id ?? '')
    setPath([])
    setSelectedChoice(null)
    setShowConsequence(false)
    setIsComplete(false)
  }

  if (isComplete) {
    const result = evaluateScenarioPath(path)
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <Card className="border-border/50 bg-card/50 backdrop-blur max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Scenario Complete</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="text-6xl font-bold text-cai-blue">
              {Math.round(result.percentage)}%
            </div>
            <div className="flex justify-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    'h-8 w-8',
                    i < Math.round(result.percentage / 20)
                      ? 'text-cai-gold fill-cai-gold'
                      : 'text-muted'
                  )}
                />
              ))}
            </div>
            <p className="text-lg text-muted-foreground">{result.rating}</p>

            {/* Path review */}
            <div className="space-y-2 text-left">
              <p className="text-sm font-medium text-muted-foreground">Your decisions:</p>
              {path.map((step, i) => {
                const node = nodes.find((n) => n.id === step.nodeId)
                const choice = node?.choices[step.choiceIndex]
                return (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <Badge variant="outline" className="shrink-0 mt-0.5">
                      {i + 1}
                    </Badge>
                    <div>
                      <p>{choice?.text}</p>
                      {choice?.isPcamChoice && (
                        <p className="text-cai-teal text-xs mt-1">
                          This is the PCAM-recommended approach
                        </p>
                      )}
                    </div>
                    <Badge
                      className={cn(
                        'ml-auto shrink-0',
                        step.score >= 80 && 'bg-green-500/20 text-green-400',
                        step.score >= 40 && step.score < 80 && 'bg-yellow-500/20 text-yellow-400',
                        step.score < 40 && 'bg-red-500/20 text-red-400',
                      )}
                    >
                      {step.score}/100
                    </Badge>
                  </div>
                )
              })}
            </div>

            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={handleRestart}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Button className="bg-cai-blue hover:bg-cai-blue/90">
                <CheckCircle className="h-4 w-4 mr-2" />
                Continue
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  if (!currentNode) return null

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-xs">
            Step {path.length + 1}
          </Badge>
          <Badge className="bg-cai-purple/20 text-cai-purple text-xs">
            {title}
          </Badge>
        </div>
        <CardTitle className="text-lg mt-2">{currentNode.text}</CardTitle>
      </CardHeader>
      <CardContent>
        <AnimatePresence mode="wait">
          {!showConsequence ? (
            <motion.div
              key="choices"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              {currentNode.choices.map((choice, idx) => (
                <motion.button
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  onClick={() => handleChoiceSelect(idx)}
                  className={cn(
                    'w-full text-left p-4 rounded-lg border-2 transition-all',
                    selectedChoice === idx
                      ? 'border-cai-blue bg-cai-blue/10'
                      : 'border-border/50 hover:border-border bg-background/50'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      'shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                      selectedChoice === idx ? 'bg-cai-blue text-white' : 'bg-muted text-muted-foreground'
                    )}>
                      {idx + 1}
                    </span>
                    <p className="text-sm">{choice.text}</p>
                  </div>
                </motion.button>
              ))}
              <div className="flex justify-end mt-4">
                <Button
                  onClick={handleConfirm}
                  disabled={selectedChoice === null}
                  className="bg-cai-blue hover:bg-cai-blue/90"
                >
                  Confirm Choice
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="consequence"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-lg bg-muted/50 border border-border/50"
            >
              <p className="text-sm font-medium mb-2">Consequence:</p>
              <p className="text-sm text-muted-foreground">
                {currentNode.choices[selectedChoice!]?.consequence}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}
