-- =============================================================================
-- CAI Prep Course — Gamification State Table
-- Hearts, coins, daily goals, streak freezes, XP multipliers
-- =============================================================================

CREATE TABLE IF NOT EXISTS cai_user_gamification (
  user_email        TEXT PRIMARY KEY,
  hearts            INTEGER NOT NULL DEFAULT 5,
  last_heart_regen  TIMESTAMPTZ,
  coins             INTEGER NOT NULL DEFAULT 0,
  daily_goal_target INTEGER NOT NULL DEFAULT 5,
  daily_goal_progress INTEGER NOT NULL DEFAULT 0,
  daily_goal_date   DATE DEFAULT CURRENT_DATE,
  streak_freezes    INTEGER NOT NULL DEFAULT 0,
  xp_multiplier     NUMERIC(3,1) NOT NULL DEFAULT 1.0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update timestamp trigger
CREATE TRIGGER trg_cai_gamification_updated
  BEFORE UPDATE ON cai_user_gamification
  FOR EACH ROW EXECUTE FUNCTION cai_update_timestamp();

-- RLS
ALTER TABLE cai_user_gamification ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on cai_user_gamification"
  ON cai_user_gamification FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Users read own gamification"
  ON cai_user_gamification FOR SELECT
  USING (auth.jwt() ->> 'email' = user_email);

CREATE POLICY "Users insert own gamification"
  ON cai_user_gamification FOR INSERT
  WITH CHECK (auth.jwt() ->> 'email' = user_email);

CREATE POLICY "Users update own gamification"
  ON cai_user_gamification FOR UPDATE
  USING (auth.jwt() ->> 'email' = user_email)
  WITH CHECK (auth.jwt() ->> 'email' = user_email);
