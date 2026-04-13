-- ==============================================
-- ClassPulse 초기 마이그레이션
-- supabase/migrations/001_initial.sql
-- ==============================================

-- ENUM 타입 (IF NOT EXISTS 패턴)
DO $$ BEGIN CREATE TYPE user_role AS ENUM ('STUDENT', 'MENTOR', 'CAREER_ADVISOR', 'ADMIN'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE risk_level AS ENUM ('GREEN', 'YELLOW', 'ORANGE', 'RED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE emotion_level AS ENUM ('FIRE', 'HAPPY', 'NEUTRAL', 'TIRED', 'EXHAUSTED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE document_type AS ENUM ('RESUME', 'PORTFOLIO', 'COVER_LETTER'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE feedback_status AS ENUM ('AI_DRAFT', 'MENTOR_REVIEW', 'COMPLETED', 'DELIVERED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ──────────────────────────────────────────────
-- 교육 과정 (user_profiles보다 먼저 생성)
-- ──────────────────────────────────────────────
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  duration_weeks INT NOT NULL,
  difficulty_map JSONB,
  tech_stack TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ──────────────────────────────────────────────
-- 사용자 프로필 (auth.users 1:1)
-- ──────────────────────────────────────────────
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'STUDENT',
  name TEXT NOT NULL,
  phone TEXT,
  course_id UUID REFERENCES courses(id),
  target_job TEXT,
  target_company TEXT,
  github_url TEXT,
  projects JSONB DEFAULT '[]',
  interests TEXT[] DEFAULT '{}',
  target_certs TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ──────────────────────────────────────────────
-- 학습 심박수 (일별 기록)
-- ──────────────────────────────────────────────
CREATE TABLE learning_pulse (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  attendance BOOLEAN DEFAULT false,
  assignment_done BOOLEAN DEFAULT false,
  questions_count INT DEFAULT 0,
  emotion_score INT CHECK (emotion_score BETWEEN 1 AND 5),
  streak_count INT DEFAULT 0,
  risk_score INT DEFAULT 0 CHECK (risk_score BETWEEN 0 AND 100),
  risk_level risk_level DEFAULT 'GREEN',
  UNIQUE(user_id, date)
);

-- ──────────────────────────────────────────────
-- 주간 감정 체크인
-- ──────────────────────────────────────────────
CREATE TABLE pulse_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week INT NOT NULL,
  emotion emotion_level NOT NULL,
  ai_response TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ──────────────────────────────────────────────
-- 채용공고 AI 분석 결과
-- ──────────────────────────────────────────────
CREATE TABLE job_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  job_url TEXT NOT NULL,
  company_analysis JSONB NOT NULL,
  tech_stack JSONB NOT NULL,
  interview_prep JSONB NOT NULL,
  portfolio_guide JSONB NOT NULL,
  resume_guide JSONB NOT NULL,
  match_score INT CHECK (match_score BETWEEN 0 AND 100),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ──────────────────────────────────────────────
-- 문서 (자소서, 포트폴리오, 이력서)
-- ──────────────────────────────────────────────
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type document_type NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  status feedback_status DEFAULT 'AI_DRAFT',
  version INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ──────────────────────────────────────────────
-- AI/멘토 피드백
-- ──────────────────────────────────────────────
CREATE TABLE feedbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  reviewer_type TEXT NOT NULL CHECK (reviewer_type IN ('AI', 'MENTOR')),
  reviewer_id UUID REFERENCES auth.users(id),
  content JSONB NOT NULL,
  annotations JSONB,
  score JSONB,
  status feedback_status NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ──────────────────────────────────────────────
-- 스트릭 기록
-- ──────────────────────────────────────────────
CREATE TABLE streak_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak INT DEFAULT 0,
  longest_streak INT DEFAULT 0,
  last_activity_date DATE,
  rewards JSONB DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ──────────────────────────────────────────────
-- 알림
-- ──────────────────────────────────────────────
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ──────────────────────────────────────────────
-- 기술 트렌드 기사
-- ──────────────────────────────────────────────
CREATE TABLE trend_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  source_url TEXT NOT NULL,
  source_type TEXT NOT NULL,
  summary TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  relevance_map JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ──────────────────────────────────────────────
-- 자격증 정보
-- ──────────────────────────────────────────────
CREATE TABLE certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  exam_dates JSONB NOT NULL,
  related_courses TEXT[] DEFAULT '{}',
  prep_resources JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ==============================================
-- RLS (Row Level Security)
-- ==============================================
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_pulse ENABLE ROW LEVEL SECURITY;
ALTER TABLE pulse_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE streak_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE trend_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- ── 학생: 본인 데이터 CRUD ──
CREATE POLICY "본인 프로필 접근" ON user_profiles
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "본인 학습 데이터" ON learning_pulse
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "본인 감정 체크인" ON pulse_checkins
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "본인 채용 분석" ON job_analyses
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "본인 문서" ON documents
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "본인 피드백 조회" ON feedbacks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM documents d
      WHERE d.id = feedbacks.document_id
      AND d.user_id = auth.uid()
    )
  );

CREATE POLICY "본인 스트릭" ON streak_records
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "본인 알림" ON notifications
  FOR ALL USING (auth.uid() = user_id);

-- ── 멘토/관리자: 같은 과정 학생 조회 ──
CREATE POLICY "멘토 학생 프로필 조회" ON user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles mp
      WHERE mp.user_id = auth.uid()
      AND mp.role IN ('MENTOR', 'ADMIN', 'CAREER_ADVISOR')
    )
  );

CREATE POLICY "멘토 학습 데이터 조회" ON learning_pulse
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles mp
      WHERE mp.user_id = auth.uid()
      AND mp.role IN ('MENTOR', 'ADMIN', 'CAREER_ADVISOR')
    )
  );

CREATE POLICY "멘토 피드백 작성" ON feedbacks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles mp
      WHERE mp.user_id = auth.uid()
      AND mp.role IN ('MENTOR', 'ADMIN')
    )
  );

CREATE POLICY "멘토 피드백 조회" ON feedbacks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles mp
      WHERE mp.user_id = auth.uid()
      AND mp.role IN ('MENTOR', 'ADMIN')
    )
  );

-- ── 공개 데이터 (로그인 사용자 누구나) ──
CREATE POLICY "과정 공개 조회" ON courses
  FOR SELECT USING (true);

CREATE POLICY "트렌드 공개 조회" ON trend_articles
  FOR SELECT USING (true);

CREATE POLICY "자격증 공개 조회" ON certifications
  FOR SELECT USING (true);

-- ==============================================
-- 인덱스 (성능 최적화)
-- ==============================================
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_course ON user_profiles(course_id);
CREATE INDEX idx_learning_pulse_user_date ON learning_pulse(user_id, date);
CREATE INDEX idx_pulse_checkins_user ON pulse_checkins(user_id);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX idx_documents_user_status ON documents(user_id, status);
CREATE INDEX idx_job_analyses_user ON job_analyses(user_id);
CREATE INDEX idx_feedbacks_document ON feedbacks(document_id);
CREATE INDEX idx_streak_records_user ON streak_records(user_id);

-- ==============================================
-- 트리거: updated_at 자동 갱신
-- ==============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_user_profiles_updated
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_documents_updated
  BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_streak_records_updated
  BEFORE UPDATE ON streak_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_certifications_updated
  BEFORE UPDATE ON certifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
