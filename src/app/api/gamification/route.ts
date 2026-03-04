import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import {
  MAX_HEARTS,
  COIN_REWARDS,
  COIN_COSTS,
  calculateHeartRegen,
  getDefaultGamificationState,
} from '@/lib/gamification'

// =============================================================================
// GET /api/gamification?user_email=...
// Fetch gamification state (hearts, coins, daily goal, etc.)
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServiceClient()
    const { searchParams } = new URL(request.url)
    const userEmail = searchParams.get('user_email')

    if (!userEmail) {
      return NextResponse.json(
        { error: 'user_email query param is required' },
        { status: 400 }
      )
    }

    // Fetch gamification state
    const { data: gameState, error } = await supabase
      .from('cai_user_gamification')
      .select('*')
      .eq('user_email', userEmail)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('[GET /api/gamification]', error)
      return NextResponse.json(
        { error: 'Failed to fetch gamification state' },
        { status: 500 }
      )
    }

    // If no row yet, return defaults
    if (!gameState) {
      return NextResponse.json(getDefaultGamificationState())
    }

    // Calculate heart regen
    const regenHearts = calculateHeartRegen(
      gameState.last_heart_regen,
      gameState.hearts
    )

    // Update if hearts changed from regen
    if (regenHearts !== gameState.hearts) {
      await supabase
        .from('cai_user_gamification')
        .update({
          hearts: regenHearts,
          updated_at: new Date().toISOString(),
        })
        .eq('user_email', userEmail)
    }

    // Check if daily goal date needs resetting
    const today = new Date().toISOString().split('T')[0]
    let dailyProgress = gameState.daily_goal_progress ?? 0
    if (gameState.daily_goal_date !== today) {
      dailyProgress = 0
      await supabase
        .from('cai_user_gamification')
        .update({
          daily_goal_progress: 0,
          daily_goal_date: today,
          updated_at: new Date().toISOString(),
        })
        .eq('user_email', userEmail)
    }

    return NextResponse.json({
      hearts: regenHearts,
      max_hearts: MAX_HEARTS,
      last_heart_regen: gameState.last_heart_regen,
      coins: gameState.coins ?? 0,
      daily_goal_target: gameState.daily_goal_target ?? 5,
      daily_goal_progress: dailyProgress,
      daily_goal_date: today,
      streak_freezes: gameState.streak_freezes ?? 0,
      xp_multiplier: gameState.xp_multiplier ?? 1,
    })
  } catch (err) {
    console.error('[GET /api/gamification]', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// =============================================================================
// POST /api/gamification
// Actions: lose_heart, earn_coins, spend_coins, increment_daily_goal
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServiceClient()
    const body = await request.json()
    const { user_email, action, amount, item } = body

    if (!user_email || !action) {
      return NextResponse.json(
        { error: 'user_email and action are required' },
        { status: 400 }
      )
    }

    // Ensure row exists
    await supabase
      .from('cai_user_gamification')
      .upsert(
        {
          user_email,
          hearts: MAX_HEARTS,
          coins: 0,
          daily_goal_target: 5,
          daily_goal_progress: 0,
          daily_goal_date: new Date().toISOString().split('T')[0],
          streak_freezes: 0,
          xp_multiplier: 1,
          last_heart_regen: null,
        },
        { onConflict: 'user_email', ignoreDuplicates: true }
      )

    // Read current state
    const { data: current } = await supabase
      .from('cai_user_gamification')
      .select('*')
      .eq('user_email', user_email)
      .single()

    if (!current) {
      return NextResponse.json(
        { error: 'Failed to read gamification state' },
        { status: 500 }
      )
    }

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    let celebrations: Array<{ type: string; value?: number; label?: string }> = []

    switch (action) {
      case 'lose_heart': {
        if (current.hearts > 0) {
          updates.hearts = current.hearts - 1
          updates.last_heart_regen =
            current.last_heart_regen ?? new Date().toISOString()
          celebrations.push({ type: 'heart_lost' })
        }
        break
      }

      case 'earn_coins': {
        const reward =
          amount ?? COIN_REWARDS[item as keyof typeof COIN_REWARDS] ?? 0
        if (reward > 0) {
          updates.coins = (current.coins ?? 0) + reward
          celebrations.push({ type: 'coins', value: reward })
        }
        break
      }

      case 'spend_coins': {
        const cost =
          amount ?? COIN_COSTS[item as keyof typeof COIN_COSTS] ?? 0
        if (cost > 0 && (current.coins ?? 0) >= cost) {
          updates.coins = (current.coins ?? 0) - cost

          // Handle specific purchases
          if (item === 'streak_freeze') {
            updates.streak_freezes = (current.streak_freezes ?? 0) + 1
          }
        } else {
          return NextResponse.json(
            { error: 'Not enough coins' },
            { status: 400 }
          )
        }
        break
      }

      case 'increment_daily_goal': {
        const today = new Date().toISOString().split('T')[0]
        const currentProgress =
          current.daily_goal_date === today
            ? current.daily_goal_progress ?? 0
            : 0
        const newProgress = currentProgress + 1
        const target = current.daily_goal_target ?? 5

        updates.daily_goal_progress = newProgress
        updates.daily_goal_date = today

        // Daily goal just completed
        if (currentProgress < target && newProgress >= target) {
          updates.coins = (current.coins ?? 0) + COIN_REWARDS.daily_goal_complete
          celebrations.push({ type: 'daily_goal' })
          celebrations.push({
            type: 'coins',
            value: COIN_REWARDS.daily_goal_complete,
          })
        }
        break
      }

      case 'restore_heart': {
        if ((current.coins ?? 0) >= COIN_COSTS.heart_refill) {
          updates.hearts = MAX_HEARTS
          updates.coins = (current.coins ?? 0) - COIN_COSTS.heart_refill
          updates.last_heart_regen = null
        } else {
          return NextResponse.json(
            { error: 'Not enough coins' },
            { status: 400 }
          )
        }
        break
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        )
    }

    // Apply updates
    const { data: updated, error: updateError } = await supabase
      .from('cai_user_gamification')
      .update(updates)
      .eq('user_email', user_email)
      .select()
      .single()

    if (updateError) {
      console.error('[POST /api/gamification]', updateError)
      return NextResponse.json(
        { error: 'Failed to update gamification state' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ...updated,
      celebrations,
    })
  } catch (err) {
    console.error('[POST /api/gamification]', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
