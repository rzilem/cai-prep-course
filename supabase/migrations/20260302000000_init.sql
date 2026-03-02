-- =============================================================================
-- CAI Prep Course — Full Database Migration
-- =============================================================================
-- Tables: 11 (cai_ prefixed)
-- Storage Buckets: 4
-- RLS: service_role bypass + user_email match for user tables
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. COURSES
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cai_courses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          TEXT NOT NULL UNIQUE,
  title         TEXT NOT NULL,
  credential_code TEXT NOT NULL,
  description   TEXT NOT NULL DEFAULT '',
  prerequisites TEXT[] NOT NULL DEFAULT '{}',
  difficulty    TEXT NOT NULL DEFAULT 'beginner'
                CHECK (difficulty IN ('beginner','intermediate','advanced','expert')),
  estimated_hours NUMERIC(6,1) NOT NULL DEFAULT 0,
  icon_url      TEXT,
  hero_url      TEXT,
  module_count  INTEGER NOT NULL DEFAULT 0,
  lesson_count  INTEGER NOT NULL DEFAULT 0,
  metadata      JSONB NOT NULL DEFAULT '{}',
  is_published  BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cai_courses_slug ON cai_courses (slug);
CREATE INDEX IF NOT EXISTS idx_cai_courses_credential ON cai_courses (credential_code);
CREATE INDEX IF NOT EXISTS idx_cai_courses_published ON cai_courses (is_published) WHERE is_published = TRUE;

-- ---------------------------------------------------------------------------
-- 2. MODULES
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cai_modules (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id     UUID NOT NULL REFERENCES cai_courses(id) ON DELETE CASCADE,
  slug          TEXT NOT NULL,
  title         TEXT NOT NULL,
  description   TEXT NOT NULL DEFAULT '',
  module_number INTEGER NOT NULL,
  video_url     TEXT,
  thumbnail_url TEXT,
  lesson_count  INTEGER NOT NULL DEFAULT 0,
  metadata      JSONB NOT NULL DEFAULT '{}',
  is_published  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (course_id, slug),
  UNIQUE (course_id, module_number)
);

CREATE INDEX IF NOT EXISTS idx_cai_modules_course ON cai_modules (course_id);
CREATE INDEX IF NOT EXISTS idx_cai_modules_published ON cai_modules (is_published) WHERE is_published = TRUE;

-- ---------------------------------------------------------------------------
-- 3. LESSONS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cai_lessons (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id        UUID NOT NULL REFERENCES cai_modules(id) ON DELETE CASCADE,
  slug             TEXT NOT NULL,
  title            TEXT NOT NULL,
  content_markdown TEXT NOT NULL DEFAULT '',
  video_url        TEXT,
  audio_url        TEXT,
  images           TEXT[] NOT NULL DEFAULT '{}',
  texas_law_callouts JSONB NOT NULL DEFAULT '[]',
  scenario         JSONB,
  key_points       TEXT[] NOT NULL DEFAULT '{}',
  estimated_minutes INTEGER NOT NULL DEFAULT 10,
  sort_order       INTEGER NOT NULL DEFAULT 0,
  is_published     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (module_id, slug),
  UNIQUE (module_id, sort_order)
);

CREATE INDEX IF NOT EXISTS idx_cai_lessons_module ON cai_lessons (module_id);
CREATE INDEX IF NOT EXISTS idx_cai_lessons_published ON cai_lessons (is_published) WHERE is_published = TRUE;

-- ---------------------------------------------------------------------------
-- 4. QUESTIONS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cai_questions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id           UUID REFERENCES cai_lessons(id) ON DELETE SET NULL,
  module_id           UUID REFERENCES cai_modules(id) ON DELETE SET NULL,
  course_id           UUID NOT NULL REFERENCES cai_courses(id) ON DELETE CASCADE,
  question_text       TEXT NOT NULL,
  question_type       TEXT NOT NULL DEFAULT 'multiple_choice'
                      CHECK (question_type IN ('multiple_choice','true_false','scenario','fill_blank','matching')),
  choices             JSONB NOT NULL DEFAULT '[]',
  explanation         TEXT NOT NULL DEFAULT '',
  texas_law_reference TEXT,
  exam_domain         TEXT,
  difficulty          INTEGER NOT NULL DEFAULT 3
                      CHECK (difficulty BETWEEN 1 AND 5),
  times_shown         INTEGER NOT NULL DEFAULT 0,
  times_correct       INTEGER NOT NULL DEFAULT 0,
  is_published        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cai_questions_lesson ON cai_questions (lesson_id) WHERE lesson_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cai_questions_module ON cai_questions (module_id) WHERE module_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cai_questions_course ON cai_questions (course_id);
CREATE INDEX IF NOT EXISTS idx_cai_questions_domain ON cai_questions (exam_domain) WHERE exam_domain IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cai_questions_difficulty ON cai_questions (difficulty);
CREATE INDEX IF NOT EXISTS idx_cai_questions_published ON cai_questions (is_published) WHERE is_published = TRUE;

-- ---------------------------------------------------------------------------
-- 5. USER PROGRESS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cai_user_progress (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email          TEXT NOT NULL,
  course_id           UUID NOT NULL REFERENCES cai_courses(id) ON DELETE CASCADE,
  module_id           UUID REFERENCES cai_modules(id) ON DELETE CASCADE,
  lesson_id           UUID REFERENCES cai_lessons(id) ON DELETE CASCADE,
  status              TEXT NOT NULL DEFAULT 'not_started'
                      CHECK (status IN ('not_started','in_progress','completed')),
  progress_percent    NUMERIC(5,2) NOT NULL DEFAULT 0,
  time_spent_seconds  INTEGER NOT NULL DEFAULT 0,
  last_video_position NUMERIC(10,2) NOT NULL DEFAULT 0,
  completed_at        TIMESTAMPTZ,
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE NULLS NOT DISTINCT (user_email, course_id, module_id, lesson_id)
);

CREATE INDEX IF NOT EXISTS idx_cai_progress_user ON cai_user_progress (user_email);
CREATE INDEX IF NOT EXISTS idx_cai_progress_user_course ON cai_user_progress (user_email, course_id);
CREATE INDEX IF NOT EXISTS idx_cai_progress_status ON cai_user_progress (status);

-- ---------------------------------------------------------------------------
-- 6. QUIZ ATTEMPTS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cai_quiz_attempts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email      TEXT NOT NULL,
  quiz_type       TEXT NOT NULL
                  CHECK (quiz_type IN ('lesson','module','practice_exam')),
  course_id       UUID NOT NULL REFERENCES cai_courses(id) ON DELETE CASCADE,
  module_id       UUID REFERENCES cai_modules(id) ON DELETE CASCADE,
  lesson_id       UUID REFERENCES cai_lessons(id) ON DELETE CASCADE,
  score           INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL DEFAULT 0,
  answers         JSONB NOT NULL DEFAULT '[]',
  domain_scores   JSONB NOT NULL DEFAULT '[]',
  time_taken_seconds INTEGER NOT NULL DEFAULT 0,
  passed          BOOLEAN NOT NULL DEFAULT FALSE,
  started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_cai_quiz_user ON cai_quiz_attempts (user_email);
CREATE INDEX IF NOT EXISTS idx_cai_quiz_user_course ON cai_quiz_attempts (user_email, course_id);
CREATE INDEX IF NOT EXISTS idx_cai_quiz_type ON cai_quiz_attempts (quiz_type);
CREATE INDEX IF NOT EXISTS idx_cai_quiz_passed ON cai_quiz_attempts (passed) WHERE passed = TRUE;

-- ---------------------------------------------------------------------------
-- 7. ACHIEVEMENTS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cai_achievements (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        TEXT NOT NULL UNIQUE,
  title       TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  icon        TEXT NOT NULL DEFAULT 'trophy',
  criteria    JSONB NOT NULL DEFAULT '{}',
  xp_reward   INTEGER NOT NULL DEFAULT 0,
  rarity      TEXT NOT NULL DEFAULT 'common'
              CHECK (rarity IN ('common','uncommon','rare','epic','legendary')),
  category    TEXT NOT NULL DEFAULT 'general',
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cai_achievements_slug ON cai_achievements (slug);
CREATE INDEX IF NOT EXISTS idx_cai_achievements_category ON cai_achievements (category);
CREATE INDEX IF NOT EXISTS idx_cai_achievements_active ON cai_achievements (is_active) WHERE is_active = TRUE;

-- ---------------------------------------------------------------------------
-- 8. USER ACHIEVEMENTS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cai_user_achievements (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email     TEXT NOT NULL,
  achievement_id UUID NOT NULL REFERENCES cai_achievements(id) ON DELETE CASCADE,
  earned_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_email, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_cai_user_achievements_user ON cai_user_achievements (user_email);

-- ---------------------------------------------------------------------------
-- 9. USER STATS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cai_user_stats (
  user_email        TEXT PRIMARY KEY,
  display_name      TEXT,
  total_xp          INTEGER NOT NULL DEFAULT 0,
  current_streak    INTEGER NOT NULL DEFAULT 0,
  longest_streak    INTEGER NOT NULL DEFAULT 0,
  last_activity_date DATE,
  study_minutes     INTEGER NOT NULL DEFAULT 0,
  lessons_completed INTEGER NOT NULL DEFAULT 0,
  quizzes_passed    INTEGER NOT NULL DEFAULT 0,
  avg_quiz_score    NUMERIC(5,2) NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- 10. FLASHCARD PROGRESS (Spaced Repetition)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cai_flashcard_progress (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email   TEXT NOT NULL,
  question_id  UUID NOT NULL REFERENCES cai_questions(id) ON DELETE CASCADE,
  ease_factor  NUMERIC(4,2) NOT NULL DEFAULT 2.5,
  interval     INTEGER NOT NULL DEFAULT 0,
  repetitions  INTEGER NOT NULL DEFAULT 0,
  next_review  DATE NOT NULL DEFAULT CURRENT_DATE,
  last_reviewed TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_email, question_id)
);

CREATE INDEX IF NOT EXISTS idx_cai_flashcard_user ON cai_flashcard_progress (user_email);
CREATE INDEX IF NOT EXISTS idx_cai_flashcard_review ON cai_flashcard_progress (user_email, next_review);

-- ---------------------------------------------------------------------------
-- 11. CONTENT PIPELINE (DAX Integration)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cai_content_pipeline (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_slug       TEXT NOT NULL,
  module_slug       TEXT NOT NULL,
  lesson_slug       TEXT,
  content_type      TEXT NOT NULL DEFAULT 'lesson',
  status            TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','researching','generating','reviewing','approved','published')),
  dax_task_id       UUID,
  generated_content JSONB,
  review_notes      TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cai_pipeline_status ON cai_content_pipeline (status);
CREATE INDEX IF NOT EXISTS idx_cai_pipeline_course ON cai_content_pipeline (course_slug, module_slug);

-- =============================================================================
-- TRIGGERS: Auto-update updated_at columns
-- =============================================================================

CREATE OR REPLACE FUNCTION cai_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  -- cai_courses
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_cai_courses_updated') THEN
    CREATE TRIGGER trg_cai_courses_updated
      BEFORE UPDATE ON cai_courses
      FOR EACH ROW EXECUTE FUNCTION cai_update_timestamp();
  END IF;

  -- cai_modules
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_cai_modules_updated') THEN
    CREATE TRIGGER trg_cai_modules_updated
      BEFORE UPDATE ON cai_modules
      FOR EACH ROW EXECUTE FUNCTION cai_update_timestamp();
  END IF;

  -- cai_lessons
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_cai_lessons_updated') THEN
    CREATE TRIGGER trg_cai_lessons_updated
      BEFORE UPDATE ON cai_lessons
      FOR EACH ROW EXECUTE FUNCTION cai_update_timestamp();
  END IF;

  -- cai_user_progress
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_cai_progress_updated') THEN
    CREATE TRIGGER trg_cai_progress_updated
      BEFORE UPDATE ON cai_user_progress
      FOR EACH ROW EXECUTE FUNCTION cai_update_timestamp();
  END IF;

  -- cai_user_stats
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_cai_stats_updated') THEN
    CREATE TRIGGER trg_cai_stats_updated
      BEFORE UPDATE ON cai_user_stats
      FOR EACH ROW EXECUTE FUNCTION cai_update_timestamp();
  END IF;

  -- cai_content_pipeline
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_cai_pipeline_updated') THEN
    CREATE TRIGGER trg_cai_pipeline_updated
      BEFORE UPDATE ON cai_content_pipeline
      FOR EACH ROW EXECUTE FUNCTION cai_update_timestamp();
  END IF;
END $$;

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE cai_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE cai_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE cai_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE cai_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cai_user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE cai_quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cai_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE cai_user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE cai_user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE cai_flashcard_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE cai_content_pipeline ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Service role bypass (full access for server-side operations)
-- ---------------------------------------------------------------------------
CREATE POLICY "Service role full access on cai_courses"
  ON cai_courses FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role full access on cai_modules"
  ON cai_modules FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role full access on cai_lessons"
  ON cai_lessons FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role full access on cai_questions"
  ON cai_questions FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role full access on cai_user_progress"
  ON cai_user_progress FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role full access on cai_quiz_attempts"
  ON cai_quiz_attempts FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role full access on cai_achievements"
  ON cai_achievements FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role full access on cai_user_achievements"
  ON cai_user_achievements FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role full access on cai_user_stats"
  ON cai_user_stats FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role full access on cai_flashcard_progress"
  ON cai_flashcard_progress FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role full access on cai_content_pipeline"
  ON cai_content_pipeline FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ---------------------------------------------------------------------------
-- Public read access for published content (anon + authenticated)
-- ---------------------------------------------------------------------------
CREATE POLICY "Anyone can read published courses"
  ON cai_courses FOR SELECT
  USING (is_published = TRUE);

CREATE POLICY "Anyone can read published modules"
  ON cai_modules FOR SELECT
  USING (is_published = TRUE);

CREATE POLICY "Anyone can read published lessons"
  ON cai_lessons FOR SELECT
  USING (is_published = TRUE);

CREATE POLICY "Anyone can read published questions"
  ON cai_questions FOR SELECT
  USING (is_published = TRUE);

CREATE POLICY "Anyone can read active achievements"
  ON cai_achievements FOR SELECT
  USING (is_active = TRUE);

-- ---------------------------------------------------------------------------
-- User-scoped access (authenticated users match on email)
-- ---------------------------------------------------------------------------

-- User Progress: users can read/write their own rows
CREATE POLICY "Users read own progress"
  ON cai_user_progress FOR SELECT
  USING (auth.jwt() ->> 'email' = user_email);

CREATE POLICY "Users insert own progress"
  ON cai_user_progress FOR INSERT
  WITH CHECK (auth.jwt() ->> 'email' = user_email);

CREATE POLICY "Users update own progress"
  ON cai_user_progress FOR UPDATE
  USING (auth.jwt() ->> 'email' = user_email)
  WITH CHECK (auth.jwt() ->> 'email' = user_email);

-- Quiz Attempts: users can read/insert their own
CREATE POLICY "Users read own quiz attempts"
  ON cai_quiz_attempts FOR SELECT
  USING (auth.jwt() ->> 'email' = user_email);

CREATE POLICY "Users insert own quiz attempts"
  ON cai_quiz_attempts FOR INSERT
  WITH CHECK (auth.jwt() ->> 'email' = user_email);

CREATE POLICY "Users update own quiz attempts"
  ON cai_quiz_attempts FOR UPDATE
  USING (auth.jwt() ->> 'email' = user_email)
  WITH CHECK (auth.jwt() ->> 'email' = user_email);

-- User Achievements: users can read their own
CREATE POLICY "Users read own achievements"
  ON cai_user_achievements FOR SELECT
  USING (auth.jwt() ->> 'email' = user_email);

-- User Stats: users can read/update their own
CREATE POLICY "Users read own stats"
  ON cai_user_stats FOR SELECT
  USING (auth.jwt() ->> 'email' = user_email);

CREATE POLICY "Users insert own stats"
  ON cai_user_stats FOR INSERT
  WITH CHECK (auth.jwt() ->> 'email' = user_email);

CREATE POLICY "Users update own stats"
  ON cai_user_stats FOR UPDATE
  USING (auth.jwt() ->> 'email' = user_email)
  WITH CHECK (auth.jwt() ->> 'email' = user_email);

-- Leaderboard: all authenticated users can read all stats (for leaderboard)
CREATE POLICY "Authenticated users read all stats for leaderboard"
  ON cai_user_stats FOR SELECT
  USING (auth.role() = 'authenticated');

-- Flashcard Progress: users can read/write their own
CREATE POLICY "Users read own flashcards"
  ON cai_flashcard_progress FOR SELECT
  USING (auth.jwt() ->> 'email' = user_email);

CREATE POLICY "Users insert own flashcards"
  ON cai_flashcard_progress FOR INSERT
  WITH CHECK (auth.jwt() ->> 'email' = user_email);

CREATE POLICY "Users update own flashcards"
  ON cai_flashcard_progress FOR UPDATE
  USING (auth.jwt() ->> 'email' = user_email)
  WITH CHECK (auth.jwt() ->> 'email' = user_email);

-- =============================================================================
-- STORAGE BUCKETS
-- =============================================================================
-- NOTE: Run these via the Supabase Dashboard SQL Editor or supabase CLI.
-- The storage.buckets table is managed by Supabase — INSERT creates a bucket.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('cai-videos',       'cai-videos',       FALSE, 524288000, ARRAY['video/mp4','video/webm','video/quicktime']),
  ('cai-images',       'cai-images',       FALSE, 10485760,  ARRAY['image/png','image/jpeg','image/webp','image/svg+xml','image/gif']),
  ('cai-audio',        'cai-audio',        FALSE, 104857600, ARRAY['audio/mpeg','audio/wav','audio/ogg','audio/mp4']),
  ('cai-certificates', 'cai-certificates', FALSE, 10485760,  ARRAY['application/pdf','image/png'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies: service role can do anything, authenticated users can read
CREATE POLICY "Service role full access on cai-videos"
  ON storage.objects FOR ALL
  USING (bucket_id = 'cai-videos' AND auth.role() = 'service_role')
  WITH CHECK (bucket_id = 'cai-videos' AND auth.role() = 'service_role');

CREATE POLICY "Authenticated users read cai-videos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'cai-videos' AND auth.role() = 'authenticated');

CREATE POLICY "Service role full access on cai-images"
  ON storage.objects FOR ALL
  USING (bucket_id = 'cai-images' AND auth.role() = 'service_role')
  WITH CHECK (bucket_id = 'cai-images' AND auth.role() = 'service_role');

CREATE POLICY "Authenticated users read cai-images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'cai-images' AND auth.role() = 'authenticated');

CREATE POLICY "Service role full access on cai-audio"
  ON storage.objects FOR ALL
  USING (bucket_id = 'cai-audio' AND auth.role() = 'service_role')
  WITH CHECK (bucket_id = 'cai-audio' AND auth.role() = 'service_role');

CREATE POLICY "Authenticated users read cai-audio"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'cai-audio' AND auth.role() = 'authenticated');

CREATE POLICY "Service role full access on cai-certificates"
  ON storage.objects FOR ALL
  USING (bucket_id = 'cai-certificates' AND auth.role() = 'service_role')
  WITH CHECK (bucket_id = 'cai-certificates' AND auth.role() = 'service_role');

CREATE POLICY "Users read own certificates"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'cai-certificates'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.jwt() ->> 'email'
  );

-- =============================================================================
-- DONE
-- =============================================================================
