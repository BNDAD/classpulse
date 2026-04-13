-- ==============================================
-- ClassPulse 002: 학원 상세 정보 확장
-- 지점, 멘토, 수업 상세, 수료 상태
-- ==============================================

-- ── 학생 상태 ENUM ──
DO $$ BEGIN
  CREATE TYPE student_status AS ENUM ('ENROLLED', 'COMPLETED', 'CARE_PERIOD', 'EXPIRED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── 수업 유형 ENUM ──
DO $$ BEGIN
  CREATE TYPE course_type AS ENUM ('NCS', 'PRIVATE', 'SHORT');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
-- NCS: 국비지원 (국가직무능력표준)
-- PRIVATE: 일반(사비) 과정
-- SHORT: 단기 특강

-- ──────────────────────────────────────────────
-- 지점 테이블
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,           -- 예: '강남점', '종로점'
  address TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ──────────────────────────────────────────────
-- courses 테이블 확장 (컬럼 추가)
-- ──────────────────────────────────────────────
ALTER TABLE courses ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id);
ALTER TABLE courses ADD COLUMN IF NOT EXISTS course_type course_type DEFAULT 'NCS';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS classroom TEXT;        -- 예: '301호'
ALTER TABLE courses ADD COLUMN IF NOT EXISTS schedule_time TEXT;    -- 예: '09:00 ~ 17:40'
ALTER TABLE courses ADD COLUMN IF NOT EXISTS instructor TEXT;       -- 강사명
ALTER TABLE courses ADD COLUMN IF NOT EXISTS mentor_id UUID REFERENCES auth.users(id);  -- 담당 멘토
ALTER TABLE courses ADD COLUMN IF NOT EXISTS curriculum JSONB;      -- 커리큘럼 상세
ALTER TABLE courses ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS total_students INT DEFAULT 0;

-- ──────────────────────────────────────────────
-- user_profiles 확장 (학생 상태, 수료일 등)
-- ──────────────────────────────────────────────
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS student_status student_status DEFAULT 'ENROLLED';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS mentor_id UUID REFERENCES auth.users(id);  -- 담당 멘토
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS completed_at DATE;     -- 수료일
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS care_until DATE;       -- 케어 종료일 (수료일 + 6개월)
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS enrollment_code TEXT;  -- 수강 등록 코드 (학원에서 발급)

-- ──────────────────────────────────────────────
-- 인덱스
-- ──────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_branches_name ON branches(name);
CREATE INDEX IF NOT EXISTS idx_courses_branch ON courses(branch_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_branch ON user_profiles(branch_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_mentor ON user_profiles(mentor_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_status ON user_profiles(student_status);

-- RLS 비활성화 (데모용)
ALTER TABLE branches DISABLE ROW LEVEL SECURITY;
