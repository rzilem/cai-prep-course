import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import type { QuizAnswer, DomainScore, QuizType } from '@/lib/types'
import { XP_VALUES } from '@/lib/types'

// =============================================================================
// POST /api/quiz/submit
// Grade a quiz, record attempt, update stats, award XP
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServiceClient()
    const body = await request.json()

    const {
      user_email,
      quiz_type,
      course_id,
      module_id,
      lesson_id,
      answers,
      time_taken_seconds,
    } = body as {
      user_email: string
      quiz_type: QuizType
      course_id: string
      module_id?: string
      lesson_id?: string
      answers: { question_id: string; selected: string | number }[]
      time_taken_seconds: number
    }

    if (!user_email || !quiz_type || !course_id || !answers?.length) {
      return NextResponse.json(
        { error: 'user_email, quiz_type, course_id, and answers are required' },
        { status: 400 }
      )
    }

    // -------------------------------------------------------------------------
    // Fetch correct answers for all submitted questions
    // -------------------------------------------------------------------------
    const questionIds = answers.map((a) => a.question_id)
    const { data: questions, error: questionsError } = await supabase
      .from('cai_questions')
      .select('id, choices, exam_domain, explanation, question_text')
      .in('id', questionIds)

    if (questionsError || !questions) {
      return NextResponse.json(
        { error: 'Failed to fetch questions' },
        { status: 500 }
      )
    }

    // Build a lookup map
    const questionMap = new Map(questions.map((q) => [q.id, q]))

    // -------------------------------------------------------------------------
    // Grade each answer
    // -------------------------------------------------------------------------
    const gradedAnswers: (QuizAnswer & {
      explanation: string
      question_text: string
      correct_answer: string
    })[] = []
    const domainTally: Record<string, { correct: number; total: number }> = {}
    let correctCount = 0

    for (const answer of answers) {
      const question = questionMap.get(answer.question_id)
      if (!question) continue

      const choices = question.choices as {
        text: string
        is_correct: boolean
        explanation: string
      }[]

      // Determine if the answer is correct
      // selected can be an index (number) or the text (string)
      let isCorrect = false
      let correctAnswer = ''

      for (let i = 0; i < choices.length; i++) {
        if (choices[i].is_correct) {
          correctAnswer = choices[i].text
        }
      }

      if (typeof answer.selected === 'number') {
        isCorrect = choices[answer.selected]?.is_correct ?? false
      } else {
        isCorrect = choices.some(
          (c) => c.text === answer.selected && c.is_correct
        )
      }

      if (isCorrect) correctCount++

      gradedAnswers.push({
        question_id: answer.question_id,
        selected: answer.selected,
        is_correct: isCorrect,
        explanation: question.explanation,
        question_text: question.question_text,
        correct_answer: correctAnswer,
      })

      // Track domain scores (for practice exams)
      const domain = question.exam_domain || 'General'
      if (!domainTally[domain]) {
        domainTally[domain] = { correct: 0, total: 0 }
      }
      domainTally[domain].total++
      if (isCorrect) domainTally[domain].correct++
    }

    // -------------------------------------------------------------------------
    // Calculate scores
    // -------------------------------------------------------------------------
    const totalQuestions = answers.length
    const scorePercent = totalQuestions > 0
      ? Math.round((correctCount / totalQuestions) * 100)
      : 0

    // Pass thresholds: 70% for module quizzes, 62.5% for practice exams
    const passThreshold = quiz_type === 'practice_exam' ? 62.5 : 70
    const passed = scorePercent >= passThreshold

    // Build domain scores array
    const domainScores: DomainScore[] = Object.entries(domainTally).map(
      ([domain, tally]) => ({
        domain,
        correct: tally.correct,
        total: tally.total,
        percentage: tally.total > 0
          ? Math.round((tally.correct / tally.total) * 100)
          : 0,
      })
    )

    // Build quiz answers for storage (without extra feedback fields)
    const storedAnswers: QuizAnswer[] = gradedAnswers.map((a) => ({
      question_id: a.question_id,
      selected: a.selected,
      is_correct: a.is_correct,
    }))

    // -------------------------------------------------------------------------
    // Insert quiz attempt
    // -------------------------------------------------------------------------
    const { data: attempt, error: attemptError } = await supabase
      .from('cai_quiz_attempts')
      .insert({
        user_email,
        quiz_type,
        course_id,
        module_id: module_id ?? null,
        lesson_id: lesson_id ?? null,
        score: correctCount,
        total_questions: totalQuestions,
        answers: storedAnswers,
        domain_scores: domainScores,
        time_taken_seconds: time_taken_seconds ?? 0,
        passed,
        started_at: new Date(
          Date.now() - (time_taken_seconds ?? 0) * 1000
        ).toISOString(),
        completed_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (attemptError) {
      console.error('[POST /api/quiz/submit] Insert error:', attemptError)
      return NextResponse.json(
        { error: 'Failed to record quiz attempt' },
        { status: 500 }
      )
    }

    // -------------------------------------------------------------------------
    // Calculate XP earned
    // -------------------------------------------------------------------------
    let xpEarned = 0
    if (passed) {
      if (quiz_type === 'practice_exam') {
        xpEarned = XP_VALUES.practice_exam_pass
      } else {
        xpEarned = XP_VALUES.module_quiz_pass
      }
    }
    // Bonus for perfect score
    if (correctCount === totalQuestions && totalQuestions > 0) {
      xpEarned += XP_VALUES.perfect_quiz
    }

    // -------------------------------------------------------------------------
    // Update user stats
    // -------------------------------------------------------------------------
    // Ensure stats row exists
    await supabase
      .from('cai_user_stats')
      .upsert(
        {
          user_email,
          total_xp: 0,
          current_streak: 0,
          longest_streak: 0,
          study_minutes: 0,
          lessons_completed: 0,
          quizzes_passed: 0,
          avg_quiz_score: 0,
        },
        { onConflict: 'user_email', ignoreDuplicates: true }
      )

    const { data: currentStats } = await supabase
      .from('cai_user_stats')
      .select('*')
      .eq('user_email', user_email)
      .single()

    if (currentStats) {
      // Calculate new average quiz score
      // Weighted average: ((old_avg * old_count) + new_score) / (old_count + 1)
      const oldCount = currentStats.quizzes_passed + (passed ? 0 : 1)
      // Track all attempts for avg, not just passed
      const totalAttempts = oldCount + 1
      const newAvg = Math.round(
        (currentStats.avg_quiz_score * oldCount + scorePercent) / totalAttempts
      )

      const today = new Date().toISOString().split('T')[0]

      await supabase
        .from('cai_user_stats')
        .update({
          total_xp: currentStats.total_xp + xpEarned,
          quizzes_passed: currentStats.quizzes_passed + (passed ? 1 : 0),
          avg_quiz_score: newAvg,
          study_minutes:
            currentStats.study_minutes +
            Math.round((time_taken_seconds ?? 0) / 60),
          last_activity_date: today,
          updated_at: new Date().toISOString(),
        })
        .eq('user_email', user_email)
    }

    // -------------------------------------------------------------------------
    // Update question statistics (times_shown / times_correct)
    // Non-critical — best effort, swallow errors
    // -------------------------------------------------------------------------
    for (const graded of gradedAnswers) {
      const q = questionMap.get(graded.question_id)
      if (!q) continue
      try {
        await supabase.rpc('increment_question_stats', {
          qid: graded.question_id,
          was_correct: graded.is_correct,
        })
      } catch {
        // If RPC doesn't exist, skip — this is non-critical
      }
    }

    // -------------------------------------------------------------------------
    // Response
    // -------------------------------------------------------------------------
    return NextResponse.json({
      id: attempt.id,
      score: correctCount,
      total: totalQuestions,
      percentage: scorePercent,
      passed,
      pass_threshold: passThreshold,
      domain_scores: domainScores,
      answers_with_feedback: gradedAnswers,
      xp_earned: xpEarned,
      time_taken_seconds: time_taken_seconds ?? 0,
    })
  } catch (err) {
    console.error('[POST /api/quiz/submit]', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
