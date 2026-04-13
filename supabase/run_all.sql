-- ==============================================
-- ClassPulse 통합 마이그레이션 (안전 실행)
-- 이미 존재하는 테이블/타입/인덱스/트리거를 모두 건너뜁니다.
-- Supabase SQL Editor에서 이 파일 하나만 실행하면 됩니다.
-- ==============================================

-- ══════════════════════════════════════════════
-- PART 1: 001_initial.sql (ENUM + 테이블 + RLS + 인덱스)
-- ══════════════════════════════════════════════

-- ENUM 타입
DO $$ BEGIN CREATE TYPE user_role AS ENUM ('STUDENT', 'MENTOR', 'CAREER_ADVISOR', 'ADMIN'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE risk_level AS ENUM ('GREEN', 'YELLOW', 'ORANGE', 'RED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE emotion_level AS ENUM ('FIRE', 'HAPPY', 'NEUTRAL', 'TIRED', 'EXHAUSTED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE document_type AS ENUM ('RESUME', 'PORTFOLIO', 'COVER_LETTER'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE feedback_status AS ENUM ('AI_DRAFT', 'MENTOR_REVIEW', 'COMPLETED', 'DELIVERED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 테이블
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  duration_weeks INT NOT NULL,
  difficulty_map JSONB,
  tech_stack TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_profiles (
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

CREATE TABLE IF NOT EXISTS learning_pulse (
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

CREATE TABLE IF NOT EXISTS pulse_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week INT NOT NULL,
  emotion emotion_level NOT NULL,
  ai_response TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS job_analyses (
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

CREATE TABLE IF NOT EXISTS documents (
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

CREATE TABLE IF NOT EXISTS feedbacks (
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

CREATE TABLE IF NOT EXISTS streak_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak INT DEFAULT 0,
  longest_streak INT DEFAULT 0,
  last_activity_date DATE,
  rewards JSONB DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS trend_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  source_url TEXT NOT NULL,
  source_type TEXT NOT NULL,
  summary TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  relevance_map JSONB,
  youtube_url TEXT,
  youtube_title TEXT,
  project_tips TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  exam_dates JSONB NOT NULL,
  related_courses TEXT[] DEFAULT '{}',
  prep_resources JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
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

-- RLS 정책 (이미 존재하면 무시)
DO $$ BEGIN
  CREATE POLICY "본인 프로필 접근" ON user_profiles FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "본인 학습 데이터" ON learning_pulse FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "본인 감정 체크인" ON pulse_checkins FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "본인 채용 분석" ON job_analyses FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "본인 문서" ON documents FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "본인 피드백 조회" ON feedbacks FOR SELECT USING (
    EXISTS (SELECT 1 FROM documents d WHERE d.id = feedbacks.document_id AND d.user_id = auth.uid())
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "본인 스트릭" ON streak_records FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "본인 알림" ON notifications FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "멘토 학생 프로필 조회" ON user_profiles FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_profiles mp WHERE mp.user_id = auth.uid() AND mp.role IN ('MENTOR', 'ADMIN', 'CAREER_ADVISOR'))
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "멘토 학습 데이터 조회" ON learning_pulse FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_profiles mp WHERE mp.user_id = auth.uid() AND mp.role IN ('MENTOR', 'ADMIN', 'CAREER_ADVISOR'))
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "멘토 피드백 작성" ON feedbacks FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles mp WHERE mp.user_id = auth.uid() AND mp.role IN ('MENTOR', 'ADMIN'))
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "멘토 피드백 조회" ON feedbacks FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_profiles mp WHERE mp.user_id = auth.uid() AND mp.role IN ('MENTOR', 'ADMIN'))
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "과정 공개 조회" ON courses FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "트렌드 공개 조회" ON trend_articles FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "자격증 공개 조회" ON certifications FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 학생이 멘토/관리자 프로필을 조회할 수 있도록 (상담 예약 시 필요)
DO $$ BEGIN
  CREATE POLICY "멘토 프로필 공개 조회" ON user_profiles FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_profiles t WHERE t.user_id = user_profiles.user_id AND t.role IN ('MENTOR', 'ADMIN', 'CAREER_ADVISOR'))
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_course ON user_profiles(course_id);
CREATE INDEX IF NOT EXISTS idx_learning_pulse_user_date ON learning_pulse(user_id, date);
CREATE INDEX IF NOT EXISTS idx_pulse_checkins_user ON pulse_checkins(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_documents_user_status ON documents(user_id, status);
CREATE INDEX IF NOT EXISTS idx_job_analyses_user ON job_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_feedbacks_document ON feedbacks(document_id);
CREATE INDEX IF NOT EXISTS idx_streak_records_user ON streak_records(user_id);

-- 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 (이미 있으면 drop 후 재생성)
DROP TRIGGER IF EXISTS tr_user_profiles_updated ON user_profiles;
CREATE TRIGGER tr_user_profiles_updated BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS tr_documents_updated ON documents;
CREATE TRIGGER tr_documents_updated BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS tr_streak_records_updated ON streak_records;
CREATE TRIGGER tr_streak_records_updated BEFORE UPDATE ON streak_records FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS tr_certifications_updated ON certifications;
CREATE TRIGGER tr_certifications_updated BEFORE UPDATE ON certifications FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ══════════════════════════════════════════════
-- PART 2: 002_academy_detail.sql (학원 확장)
-- ══════════════════════════════════════════════

DO $$ BEGIN CREATE TYPE student_status AS ENUM ('ENROLLED', 'COMPLETED', 'CARE_PERIOD', 'EXPIRED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE course_type AS ENUM ('NCS', 'PRIVATE', 'SHORT'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE courses ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id);
ALTER TABLE courses ADD COLUMN IF NOT EXISTS course_type course_type DEFAULT 'NCS';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS classroom TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS schedule_time TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS instructor TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS mentor_id UUID REFERENCES auth.users(id);
ALTER TABLE courses ADD COLUMN IF NOT EXISTS curriculum JSONB;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS total_students INT DEFAULT 0;

ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS student_status student_status DEFAULT 'ENROLLED';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS mentor_id UUID REFERENCES auth.users(id);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS completed_at DATE;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS care_until DATE;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS enrollment_code TEXT;

CREATE INDEX IF NOT EXISTS idx_branches_name ON branches(name);
CREATE INDEX IF NOT EXISTS idx_courses_branch ON courses(branch_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_branch ON user_profiles(branch_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_mentor ON user_profiles(mentor_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_status ON user_profiles(student_status);

ALTER TABLE branches DISABLE ROW LEVEL SECURITY;


-- ══════════════════════════════════════════════
-- PART 3: 003_consultation.sql (상담 시스템)
-- ══════════════════════════════════════════════

DO $$ BEGIN CREATE TYPE consult_status AS ENUM ('REQUESTED', 'CONFIRMED', 'COMPLETED', 'CANCELLED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE consult_type AS ENUM ('CAREER', 'LEARNING', 'PERSONAL', 'PORTFOLIO', 'RESUME', 'OTHER'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS mentor_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  slot_minutes INT DEFAULT 30,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mentor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  type consult_type NOT NULL DEFAULT 'CAREER',
  status consult_status NOT NULL DEFAULT 'REQUESTED',
  topic TEXT,
  student_memo TEXT,
  mentor_memo TEXT,
  meeting_url TEXT,
  cancelled_by UUID,
  cancel_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_consult_student ON consultations(student_id, date);
CREATE INDEX IF NOT EXISTS idx_consult_mentor ON consultations(mentor_id, date);
CREATE INDEX IF NOT EXISTS idx_consult_status ON consultations(status);
CREATE INDEX IF NOT EXISTS idx_mentor_avail ON mentor_availability(mentor_id, day_of_week);

ALTER TABLE mentor_availability DISABLE ROW LEVEL SECURITY;
ALTER TABLE consultations DISABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS tr_consultations_updated ON consultations;
CREATE TRIGGER tr_consultations_updated BEFORE UPDATE ON consultations FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ══════════════════════════════════════════════
-- PART 4: 004_targeted_feedback.sql
-- ══════════════════════════════════════════════

ALTER TABLE documents ADD COLUMN IF NOT EXISTS job_analysis_id UUID REFERENCES job_analyses(id);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS target_company TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS target_position TEXT;

ALTER TABLE feedbacks ADD COLUMN IF NOT EXISTS revised_content TEXT;
ALTER TABLE feedbacks ADD COLUMN IF NOT EXISTS revision_notes TEXT;
ALTER TABLE feedbacks ADD COLUMN IF NOT EXISTS revised_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS document_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  mentor_id UUID NOT NULL REFERENCES auth.users(id),
  original_content TEXT NOT NULL,
  revised_content TEXT NOT NULL,
  revision_notes TEXT,
  section_index INT,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED')),
  student_response TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE document_revisions DISABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS tr_document_revisions_updated ON document_revisions;
CREATE TRIGGER tr_document_revisions_updated BEFORE UPDATE ON document_revisions FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE certifications ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'IT';
ALTER TABLE certifications ADD COLUMN IF NOT EXISTS popularity INT DEFAULT 50;
ALTER TABLE certifications ADD COLUMN IF NOT EXISTS description TEXT;


-- ══════════════════════════════════════════════
-- PART 5: seed_academy.sql (학원 시드)
-- ══════════════════════════════════════════════

INSERT INTO branches (id, name, address, phone) VALUES
  ('b0000001-0000-0000-0000-000000000001', '강남점', '서울특별시 강남구 테헤란로 123', '02-1234-5678'),
  ('b0000001-0000-0000-0000-000000000002', '종로점', '서울특별시 종로구 종로 45', '02-2345-6789'),
  ('b0000001-0000-0000-0000-000000000003', '부산점', '부산광역시 부산진구 중앙대로 678', '051-345-6789'),
  ('b0000001-0000-0000-0000-000000000004', '대전점', '대전광역시 중구 중앙로 89', '042-456-7890'),
  ('b0000001-0000-0000-0000-000000000005', '대구점', '대구광역시 중구 동성로 56', '053-567-8901')
ON CONFLICT (id) DO NOTHING;

UPDATE courses SET
  branch_id = 'b0000001-0000-0000-0000-000000000001',
  course_type = 'NCS',
  classroom = '301호',
  schedule_time = '09:00 ~ 17:40',
  instructor = '김철수',
  start_date = '2026-01-05',
  end_date = '2026-07-03',
  total_students = 25,
  curriculum = '{"months": [{"month": 1, "title": "프로그래밍 기초", "topics": ["Java 기초", "객체지향 프로그래밍", "자료구조"]}, {"month": 2, "title": "웹 프론트엔드", "topics": ["HTML/CSS", "JavaScript", "React 기초"]}, {"month": 3, "title": "백엔드 개발", "topics": ["Spring Boot", "REST API", "JPA/Hibernate"]}, {"month": 4, "title": "데이터베이스", "topics": ["MySQL", "SQL 심화", "Redis"]}, {"month": 5, "title": "DevOps & 클라우드", "topics": ["Docker", "AWS", "CI/CD"]}, {"month": 6, "title": "프로젝트 & 취업준비", "topics": ["팀 프로젝트", "포트폴리오", "모의면접"]}]}'::jsonb
WHERE name LIKE '%자바%' OR name LIKE '%Java%' OR name LIKE '%풀스택%'
  OR id = (SELECT id FROM courses LIMIT 1);

INSERT INTO courses (name, description, duration_weeks, tech_stack, branch_id, course_type, classroom, schedule_time, instructor, start_date, end_date, total_students, curriculum) VALUES
(
  '[NCS] 자바(Java)기반 풀스택 개발자 양성과정 A반',
  'Java, Spring Boot, React를 활용한 풀스택 웹 개발자 양성 국비지원 과정',
  24, '{"Java", "Spring Boot", "React", "MySQL", "Docker", "AWS"}',
  'b0000001-0000-0000-0000-000000000001', 'NCS', '301호', '09:00 ~ 17:40', '김철수',
  '2026-01-05', '2026-07-03', 25,
  '{"months": [{"month": 1, "title": "프로그래밍 기초", "topics": ["Java 기초", "객체지향", "자료구조"]}, {"month": 2, "title": "웹 프론트엔드", "topics": ["HTML/CSS", "JavaScript", "React"]}, {"month": 3, "title": "백엔드", "topics": ["Spring Boot", "REST API", "JPA"]}, {"month": 4, "title": "DB", "topics": ["MySQL", "SQL 심화", "Redis"]}, {"month": 5, "title": "DevOps", "topics": ["Docker", "AWS", "CI/CD"]}, {"month": 6, "title": "프로젝트", "topics": ["팀 프로젝트", "포트폴리오", "모의면접"]}]}'::jsonb
),
(
  '[NCS] 파이썬(Python) AI·빅데이터 분석가 양성과정',
  'Python 기반 데이터 분석, 머신러닝, 딥러닝 전문가 양성 국비지원 과정',
  24, '{"Python", "Pandas", "TensorFlow", "PyTorch", "SQL", "Tableau"}',
  'b0000001-0000-0000-0000-000000000001', 'NCS', '405호', '09:00 ~ 17:40', '박영희',
  '2026-02-02', '2026-08-01', 30,
  '{"months": [{"month": 1, "title": "Python 기초", "topics": ["Python 문법", "자료구조", "알고리즘"]}, {"month": 2, "title": "데이터 수집/분석", "topics": ["Pandas", "NumPy", "크롤링"]}, {"month": 3, "title": "시각화 & SQL", "topics": ["Matplotlib", "Tableau", "SQL"]}, {"month": 4, "title": "머신러닝", "topics": ["Scikit-learn", "회귀/분류", "앙상블"]}, {"month": 5, "title": "딥러닝", "topics": ["TensorFlow", "PyTorch", "CNN/RNN"]}, {"month": 6, "title": "프로젝트", "topics": ["캡스톤 프로젝트", "포트폴리오", "취업특강"]}]}'::jsonb
),
(
  '[NCS] 클라우드 보안 엔지니어 양성과정',
  'AWS/Azure 기반 클라우드 인프라 및 보안 전문가 양성 국비지원 과정',
  20, '{"Linux", "AWS", "Azure", "Docker", "Kubernetes", "Terraform"}',
  'b0000001-0000-0000-0000-000000000002', 'NCS', '201호', '09:30 ~ 18:10', '이준호',
  '2026-03-02', '2026-07-24', 20,
  '{"months": [{"month": 1, "title": "리눅스 & 네트워크", "topics": ["Linux 기초", "네트워크 기초", "쉘 스크립트"]}, {"month": 2, "title": "클라우드 기초", "topics": ["AWS EC2/S3", "VPC", "IAM"]}, {"month": 3, "title": "컨테이너", "topics": ["Docker", "Kubernetes", "Helm"]}, {"month": 4, "title": "보안 & IaC", "topics": ["보안 기초", "Terraform", "모니터링"]}, {"month": 5, "title": "프로젝트", "topics": ["인프라 구축", "보안 감사", "포트폴리오"]}]}'::jsonb
),
(
  '프론트엔드 React 심화 (주말반)',
  'React, Next.js, TypeScript 심화 학습 사비 주말 과정',
  12, '{"React", "Next.js", "TypeScript", "TailwindCSS"}',
  'b0000001-0000-0000-0000-000000000001', 'PRIVATE', '502호', '토 10:00 ~ 17:00', '최민지',
  '2026-03-07', '2026-05-30', 15,
  '{"months": [{"month": 1, "title": "React 심화", "topics": ["Hooks 패턴", "상태관리", "성능최적화"]}, {"month": 2, "title": "Next.js", "topics": ["App Router", "SSR/SSG", "API Routes"]}, {"month": 3, "title": "프로젝트", "topics": ["TypeScript 실전", "배포", "포트폴리오"]}]}'::jsonb
),
(
  '[NCS] 자바(Java)기반 풀스택 개발자 양성과정 B반',
  '2025년 10월 개강 - 수료 완료반',
  24, '{"Java", "Spring Boot", "React", "MySQL", "Docker"}',
  'b0000001-0000-0000-0000-000000000003', 'NCS', '302호', '09:00 ~ 17:40', '정대현',
  '2025-10-06', '2026-04-03', 22,
  '{"months": [{"month": 1, "title": "프로그래밍 기초", "topics": ["Java", "OOP", "자료구조"]}, {"month": 2, "title": "웹 프론트엔드", "topics": ["HTML/CSS", "JS", "React"]}, {"month": 3, "title": "백엔드", "topics": ["Spring Boot", "API", "JPA"]}, {"month": 4, "title": "DB", "topics": ["MySQL", "SQL", "Redis"]}, {"month": 5, "title": "DevOps", "topics": ["Docker", "AWS", "CI/CD"]}, {"month": 6, "title": "프로젝트", "topics": ["팀프로젝트", "포트폴리오", "취업준비"]}]}'::jsonb
)
ON CONFLICT DO NOTHING;


-- ══════════════════════════════════════════════
-- PART 6: 멘토 상담 가능 시간 시드
-- ══════════════════════════════════════════════

DO $$
DECLARE
  mentor_uid UUID;
BEGIN
  SELECT user_id INTO mentor_uid FROM user_profiles WHERE role IN ('MENTOR', 'ADMIN') LIMIT 1;
  IF mentor_uid IS NOT NULL THEN
    INSERT INTO mentor_availability (mentor_id, day_of_week, start_time, end_time, slot_minutes) VALUES
      (mentor_uid, 1, '10:00', '12:00', 30),
      (mentor_uid, 1, '14:00', '17:00', 30),
      (mentor_uid, 2, '10:00', '12:00', 30),
      (mentor_uid, 2, '14:00', '17:00', 30),
      (mentor_uid, 3, '10:00', '12:00', 30),
      (mentor_uid, 3, '14:00', '17:00', 30),
      (mentor_uid, 4, '10:00', '12:00', 30),
      (mentor_uid, 4, '14:00', '17:00', 30),
      (mentor_uid, 5, '10:00', '12:00', 30),
      (mentor_uid, 5, '14:00', '17:00', 30)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;


-- ══════════════════════════════════════════════
-- PART 7: seed_trends.sql (자격증 + 트렌드)
-- ══════════════════════════════════════════════

DELETE FROM certifications;

INSERT INTO certifications (name, exam_dates, related_courses, prep_resources) VALUES
(
  '정보처리기사',
  '{"2026": [{"type": "1회 필기", "접수": "2026-01-12 ~ 2026-01-15", "시험": "2026-01-30 ~ 2026-03-03 (CBT)", "발표": "2026-03-11"}, {"type": "1회 실기", "접수": "2026-03-23 ~ 2026-03-26", "시험": "2026-04-18 ~ 2026-05-06", "발표": "2026-06-05"}, {"type": "2회 필기", "접수": "2026-04-20 ~ 2026-04-23", "시험": "2026-05-09 ~ 2026-05-29 (CBT)", "발표": "2026-06-10"}, {"type": "2회 실기", "접수": "2026-06-22 ~ 2026-06-25", "시험": "2026-07-18 ~ 2026-08-05", "발표": "2026-09-04"}, {"type": "3회 필기", "접수": "2026-07-20 ~ 2026-07-23", "시험": "2026-08-07 ~ 2026-09-01 (CBT)", "발표": "2026-09-09"}, {"type": "3회 실기", "접수": "2026-09-21 ~ 2026-09-28", "시험": "2026-10-24 ~ 2026-11-13", "발표": "2026-12-11"}]}',
  '{"Java", "Spring Boot", "웹개발", "풀스택", "백엔드", "Python", "C"}',
  '{"books": ["수제비 정보처리기사 필기+실기", "시나공 정보처리기사"], "sites": ["https://www.q-net.or.kr"], "tips": "2026년 필기 CBT 방식. 실기는 SQL+프로그래밍 비중 높음."}'
),
(
  '정보처리산업기사',
  '{"2026": [{"type": "1회 필기", "접수": "2026-01-12 ~ 2026-01-15", "시험": "2026-01-30 ~ 2026-03-03 (CBT)", "발표": "2026-03-11"}, {"type": "1회 실기", "접수": "2026-03-23 ~ 2026-03-26", "시험": "2026-04-18 ~ 2026-05-06", "발표": "2026-06-05"}, {"type": "2회 필기", "접수": "2026-04-20 ~ 2026-04-23", "시험": "2026-05-09 ~ 2026-05-29 (CBT)", "발표": "2026-06-10"}, {"type": "2회 실기", "접수": "2026-06-22 ~ 2026-06-25", "시험": "2026-07-18 ~ 2026-08-05", "발표": "2026-09-04"}, {"type": "3회 필기", "접수": "2026-07-20 ~ 2026-07-23", "시험": "2026-08-07 ~ 2026-09-01 (CBT)", "발표": "2026-09-09"}, {"type": "3회 실기", "접수": "2026-09-21 ~ 2026-09-28", "시험": "2026-10-24 ~ 2026-11-13", "발표": "2026-12-11"}]}',
  '{"Java", "웹개발", "프로그래밍 기초", "데이터베이스"}',
  '{"books": ["수제비 정보처리산업기사"], "sites": ["https://www.q-net.or.kr"], "tips": "기사 대비 난이도 낮으나 실기 실습 위주 준비 필요"}'
),
(
  '정보보안기사',
  '{"2026": [{"type": "1회 필기", "접수": "2026-01-12 ~ 2026-01-15", "시험": "2026-01-30 ~ 2026-03-03 (CBT)", "발표": "2026-03-11"}, {"type": "1회 실기", "접수": "2026-03-23 ~ 2026-03-26", "시험": "2026-04-18 ~ 2026-05-06", "발표": "2026-06-05"}, {"type": "2회 필기", "접수": "2026-04-20 ~ 2026-04-23", "시험": "2026-05-09 ~ 2026-05-29 (CBT)", "발표": "2026-06-10"}, {"type": "2회 실기", "접수": "2026-06-22 ~ 2026-06-25", "시험": "2026-07-18 ~ 2026-08-05", "발표": "2026-09-04"}, {"type": "3회 필기", "접수": "2026-07-20 ~ 2026-07-23", "시험": "2026-08-07 ~ 2026-09-01 (CBT)", "발표": "2026-09-09"}, {"type": "3회 실기", "접수": "2026-09-21 ~ 2026-09-28", "시험": "2026-10-24 ~ 2026-11-13", "발표": "2026-12-11"}]}',
  '{"보안", "네트워크", "시스템", "Linux", "해킹방어"}',
  '{"books": ["알기사 정보보안기사 필기+실기"], "sites": ["https://www.cq.or.kr"], "tips": "난이도 높음. 연 3회 시행."}'
),
(
  '웹디자인기능사',
  '{"2026": [{"type": "1회 필기", "접수": "2026-01-12 ~ 2026-01-15", "시험": "2026-01-30 ~ 2026-03-03 (CBT)", "발표": "2026-03-11"}, {"type": "1회 실기", "접수": "2026-03-23 ~ 2026-03-26", "시험": "2026-04-18 ~ 2026-05-06", "발표": "2026-06-05"}, {"type": "2회 필기", "접수": "2026-04-20 ~ 2026-04-23", "시험": "2026-05-09 ~ 2026-05-29 (CBT)", "발표": "2026-06-10"}, {"type": "2회 실기", "접수": "2026-06-22 ~ 2026-06-25", "시험": "2026-07-18 ~ 2026-08-05", "발표": "2026-09-04"}, {"type": "3회 필기", "접수": "2026-07-20 ~ 2026-07-23", "시험": "2026-08-07 ~ 2026-09-01 (CBT)", "발표": "2026-09-09"}, {"type": "3회 실기", "접수": "2026-09-21 ~ 2026-09-28", "시험": "2026-10-24 ~ 2026-11-13", "발표": "2026-12-11"}]}',
  '{"HTML", "CSS", "JavaScript", "웹개발", "프론트엔드", "UI/UX"}',
  '{"books": ["이기적 웹디자인기능사 실기"], "sites": ["https://www.q-net.or.kr"], "tips": "실기: HTML/CSS 코딩 + 포토샵/일러 시안 제작"}'
),
(
  'SQLD (SQL 개발자)',
  '{"2026": [{"type": "제60회", "접수": "2026-02-02 ~ 2026-02-06", "시험": "2026-03-07", "발표": "2026-04-04"}, {"type": "제61회", "접수": "2026-04-27 ~ 2026-05-02", "시험": "2026-05-31", "발표": "2026-06-26"}, {"type": "제62회", "접수": "2026-07-20 ~ 2026-07-24", "시험": "2026-08-22", "발표": "2026-09-19"}, {"type": "제63회", "접수": "2026-10-12 ~ 2026-10-16", "시험": "2026-11-14", "발표": "2026-12-11"}]}',
  '{"DB", "SQL", "백엔드", "데이터분석", "Oracle", "MySQL"}',
  '{"books": ["핵심노트 SQLD", "SQL 자격검정 실전문제"], "sites": ["https://www.dataq.or.kr"], "tips": "SQL 실습 위주, ERD 이해 필수"}'
),
(
  'ADsP (데이터분석 준전문가)',
  '{"2026": [{"type": "제48회", "접수": "2026-01-05 ~ 2026-01-09", "시험": "2026-02-07 (토)", "발표": "2026-03-06"}, {"type": "제49회", "접수": "2026-04-13 ~ 2026-04-17", "시험": "2026-05-16 (일)", "발표": "2026-06-05"}, {"type": "제50회", "접수": "2026-07-06 ~ 2026-07-10", "시험": "2026-08-08 (토)", "발표": "2026-08-28"}, {"type": "제51회", "접수": "2026-09-28 ~ 2026-10-02", "시험": "2026-10-31 (토)", "발표": "2026-11-20"}]}',
  '{"Python", "데이터분석", "AI/ML", "통계", "R"}',
  '{"books": ["데이터분석 준전문가 가이드"], "sites": ["https://www.dataq.or.kr"], "tips": "제49회는 일요일 시험!"}'
),
(
  'SQLP (SQL 전문가)',
  '{"2026": [{"type": "제38회", "접수": "2026-02-02 ~ 2026-02-06", "시험": "2026-03-07", "발표": "2026-04-04"}, {"type": "제39회", "접수": "2026-07-20 ~ 2026-07-24", "시험": "2026-08-22", "발표": "2026-09-19"}]}',
  '{"DB", "SQL", "백엔드", "DBA", "데이터 아키텍트"}',
  '{"books": ["SQL 전문가 가이드"], "sites": ["https://www.dataq.or.kr"], "tips": "SQLD 취득 후 도전 권장"}'
),
(
  'ADP (데이터분석 전문가)',
  '{"2026": [{"type": "제28회 필기", "접수": "2026-02-02 ~ 2026-02-06", "시험": "2026-03-07", "발표": "2026-04-04"}, {"type": "제29회 필기", "접수": "2026-07-20 ~ 2026-07-24", "시험": "2026-08-22", "발표": "2026-09-19"}]}',
  '{"Python", "데이터분석", "AI/ML", "통계", "빅데이터"}',
  '{"books": ["ADP 데이터분석 전문가 가이드"], "sites": ["https://www.dataq.or.kr"], "tips": "ADsP 취득 후 도전 권장"}'
),
(
  '빅데이터분석기사',
  '{"2026": [{"type": "제12회 필기", "접수": "2026-03-03 ~ 2026-03-09", "시험": "2026-04-04", "발표": "2026-04-24"}, {"type": "제12회 실기", "접수": "2026-05-18 ~ 2026-05-22", "시험": "2026-06-20", "발표": "2026-07-10"}, {"type": "제13회 필기", "접수": "2026-09 (추정)", "시험": "2026-09-26 (추정)", "발표": "2026-10-16 (추정)"}, {"type": "제13회 실기", "접수": "2026-10-26 ~ 2026-10-30", "시험": "2026-11-28", "발표": "2026-12-18"}]}',
  '{"Python", "빅데이터", "AI/ML", "데이터분석", "R", "통계"}',
  '{"books": ["빅데이터분석기사 필기+실기"], "sites": ["https://www.dataq.or.kr"], "tips": "실기는 Python/R 직접 코딩"}'
),
(
  '리눅스마스터 2급',
  '{"2026": [{"type": "2601회 1차(온라인CBT)", "접수": "2026-01-05 ~ 2026-01-30", "시험": "온라인 상시", "발표": "시험 직후"}, {"type": "2601회 2차", "접수": "2026-03-02 ~ 2026-03-27", "시험": "2026-04-06", "발표": "2026-04-24"}, {"type": "2602회 1차(온라인CBT)", "접수": "2026-06-29 ~ 2026-07-24", "시험": "온라인 상시", "발표": "시험 직후"}, {"type": "2602회 2차", "접수": "2026-09 (추정)", "시험": "2026-10-10 (추정)", "발표": "2026-10-30 (추정)"}]}',
  '{"Linux", "DevOps", "서버관리", "인프라", "클라우드"}',
  '{"books": ["이기적 리눅스마스터 2급"], "sites": ["https://www.ihd.or.kr"], "tips": "1차 온라인 CBT → 2차 오프라인"}'
),
(
  '리눅스마스터 1급',
  '{"2026": [{"type": "2601회 1차", "접수": "2026-02~03 (추정)", "시험": "2026-03-14 (추정)", "발표": "2026-04 (추정)"}, {"type": "2601회 2차", "접수": "2026-05 (추정)", "시험": "2026-06-13 (추정)", "발표": "2026-07 (추정)"}, {"type": "2602회 1차", "접수": "2026-08 (추정)", "시험": "2026-09-12 (추정)", "발표": "2026-10 (추정)"}, {"type": "2602회 2차", "접수": "2026-11 (추정)", "시험": "2026-12-12 (추정)", "발표": "2027-01 (추정)"}], "note": "ihd.or.kr에서 정확한 일정 확인 필수"}',
  '{"Linux", "DevOps", "서버관리", "시스템엔지니어", "인프라"}',
  '{"books": ["이기적 리눅스마스터 1급"], "sites": ["https://www.ihd.or.kr"], "tips": "2급 취득 후 도전"}'
),
(
  '네트워크관리사 2급',
  '{"2026": [{"type": "제1회", "접수": "2026-03-03 ~ 2026-03-06", "시험": "2026-03-08", "발표": "시험 후 2일"}, {"type": "제2회", "접수": "2026-04~05 (추정)", "시험": "2026-05-17", "발표": "2026-05-19"}, {"type": "제3회", "접수": "icqa.or.kr 확인", "시험": "2026-09 (추정)", "발표": "시험 후 2일"}, {"type": "제4회", "접수": "icqa.or.kr 확인", "시험": "2026-12 (추정)", "발표": "시험 후 2일"}], "note": "수시검정 병행. icqa.or.kr 수시 확인"}',
  '{"네트워크", "인프라", "서버관리", "보안"}',
  '{"books": ["네트워크관리사 2급 기출문제"], "sites": ["https://www.icqa.or.kr"], "tips": "필기+실기 같은 날 시행"}'
),
(
  '한국사능력검정시험',
  '{"2026": [{"type": "제77회(기본+심화)", "접수": "2026-01-06 ~ 2026-01-13", "시험": "2026-02-07", "발표": "2026-02-20"}, {"type": "제78회(심화)", "접수": "2026-04-21 ~ 2026-04-28", "시험": "2026-05-23", "발표": "2026-06-05"}, {"type": "제79회(기본+심화)", "접수": "2026-07-07 ~ 2026-07-14", "시험": "2026-08-09", "발표": "2026-08-21"}, {"type": "제80회(심화)", "접수": "2026-09-15 ~ 2026-09-22", "시험": "2026-10-17", "발표": "2026-10-30"}, {"type": "제81회(심화)", "접수": "2026-11-03 ~ 2026-11-10", "시험": "2026-11-28", "발표": "2026-12-11"}]}',
  '{"공무원", "공기업", "취업준비"}',
  '{"books": ["해커스 한국사능력검정시험 심화"], "sites": ["https://www.historyexam.go.kr"], "tips": "2026년 5회(1회 추가편성). 1급: 심화 80점 이상"}'
),
(
  'AWS Solutions Architect Associate',
  '{"2026": [{"type": "상시", "접수": "상시", "시험": "Pearson VUE 예약", "발표": "시험 직후"}]}',
  '{"클라우드", "DevOps", "백엔드", "인프라", "AWS"}',
  '{"books": ["AWS Certified Solutions Architect Study Guide"], "sites": ["https://aws.amazon.com/certification/"], "tips": "65% 이상 합격"}'
),
(
  'AWS Developer Associate',
  '{"2026": [{"type": "상시", "접수": "상시", "시험": "Pearson VUE 예약", "발표": "시험 직후"}]}',
  '{"클라우드", "DevOps", "백엔드", "Lambda", "AWS"}',
  '{"books": ["AWS Certified Developer Associate Guide"], "sites": ["https://aws.amazon.com/certification/"], "tips": "SAA 취득 후 도전 권장"}'
),
(
  '컴퓨터활용능력 1급',
  '{"2026": [{"type": "상시 필기", "접수": "상시(license.korcham.net)", "시험": "상시", "발표": "시험 다음날 10시"}, {"type": "상시 실기", "접수": "상시(license.korcham.net)", "시험": "상시", "발표": "약 2주 후 화요일 10시"}], "note": "2026년 접수시작 1/1, 최초시험 1/5"}',
  '{"엑셀", "액세스", "사무자동화", "컴퓨터활용"}',
  '{"books": ["시나공 컴퓨터활용능력 1급"], "sites": ["https://license.korcham.net"], "tips": "실기: 엑셀+액세스. 상시시험."}'
),
(
  '컴퓨터활용능력 2급',
  '{"2026": [{"type": "상시 필기", "접수": "상시(license.korcham.net)", "시험": "상시", "발표": "시험 다음날 10시"}, {"type": "상시 실기", "접수": "상시(license.korcham.net)", "시험": "상시", "발표": "약 2주 후 화요일 10시"}], "note": "2026년 접수시작 1/1, 최초시험 1/5"}',
  '{"엑셀", "사무자동화", "컴퓨터활용"}',
  '{"books": ["시나공 컴퓨터활용능력 2급"], "sites": ["https://license.korcham.net"], "tips": "실기: 엑셀만. 상시시험."}'
),
(
  'OCP (Oracle Certified Professional)',
  '{"2026": [{"type": "상시", "접수": "상시", "시험": "Pearson VUE 예약", "발표": "시험 직후"}]}',
  '{"Oracle", "DB", "백엔드", "DBA"}',
  '{"books": ["OCP Oracle Database 19c 가이드"], "sites": ["https://education.oracle.com"], "tips": "Oracle 직무 강력 우대"}'
),
(
  'TOEIC',
  '{"2026": [{"type": "1월", "시험": "2026-01-11 외", "발표": "시험 후 약 10일"}, {"type": "3월", "시험": "2026-03-15, 2026-03-29", "발표": "시험 후 약 10일"}, {"type": "5월", "시험": "2026-05-10, 2026-05-31", "발표": "시험 후 약 10일"}, {"type": "7월", "시험": "2026-07-12, 2026-07-26", "발표": "시험 후 약 10일"}], "note": "2026년 총 26회. 매월 2회, 2/8월 3회. toeic.co.kr 확인"}',
  '{"영어", "취업준비", "외국계"}',
  '{"books": ["ETS TOEIC 기출문제집"], "sites": ["https://www.toeic.co.kr"], "tips": "IT 우대 700+, 외국계 850+"}'
),
(
  'ISTQB CTFL (소프트웨어 테스팅)',
  '{"2026": [{"type": "분기별 정기시험", "접수": "kstqb.org 확인", "시험": "분기별 1~2회", "발표": "시험 후 2~3주"}], "note": "kstqb.org에서 일정 수시 확인"}',
  '{"QA", "테스팅", "품질관리", "소프트웨어공학"}',
  '{"books": ["ISTQB Foundation Level 실러버스"], "sites": ["https://www.kstqb.org"], "tips": "40문제 중 26문제 이상 합격"}'
)
ON CONFLICT DO NOTHING;


DELETE FROM trend_articles;

INSERT INTO trend_articles (title, source_url, source_type, summary, tags, relevance_map, youtube_url, youtube_title, project_tips) VALUES
('Spring Boot 3.5.0 릴리스: 선언적 인터페이스 클라이언트와 API 버전관리', 'https://spring.io/blog/2025/05/22/spring-boot-3-5-0-available-now', 'official_blog', 'Spring Boot 3.5.0이 출시되었습니다. 선언적 인터페이스 클라이언트, API 버전 관리, 통합된 Spring Security 지원 등이 추가되었습니다.', '{"Spring Boot", "Java", "백엔드", "프레임워크"}', '{"백엔드 개발자": 95, "풀스택 개발자": 80, "프론트엔드 개발자": 30}', 'https://www.youtube.com/watch?v=9SGDpanrc8U', '김영한 - 스프링 부트 핵심 원리와 활용', 'Spring Boot 3.5의 선언적 HTTP 클라이언트(@HttpExchange)를 적용하면 외부 API 연동 코드를 인터페이스만으로 깔끔하게 작성할 수 있습니다.'),
('React Compiler v1.0 출시: 자동 메모이제이션으로 성능 최적화', 'https://react.dev/blog/2025/10/07/react-compiler-1', 'official_blog', 'React Compiler v1.0이 출시되어 자동 메모이제이션을 통해 성능을 최적화합니다.', '{"React", "프론트엔드", "컴파일러", "성능최적화"}', '{"프론트엔드 개발자": 95, "풀스택 개발자": 85, "백엔드 개발자": 40}', 'https://www.youtube.com/watch?v=kjOacmVsLSE', 'Fireship - React 19 is here', 'babel-plugin-react-compiler를 추가하면 수동 메모이제이션 없이도 리렌더링을 최적화할 수 있습니다.'),
('2025-2026 한국 IT 개발자 채용 트렌드: AI 역량이 필수가 되다', 'https://dev-korea.com/blog/korea-most-in-demand-programming-languages-tech-roles-2025', 'industry_report', 'Python, JavaScript, TypeScript가 가장 인기 있는 언어이며, 기업의 70%가 AI/ML 관련 역량을 우대사항에 포함시키고 있습니다.', '{"채용", "AI", "트렌드", "커리어"}', '{"백엔드 개발자": 90, "프론트엔드 개발자": 85, "풀스택 개발자": 90, "AI 엔지니어": 95}', 'https://www.youtube.com/watch?v=oFr4kkKxsZo', '노마드코더 - 2025 개발자 로드맵', '포트폴리오에 AI 기능을 하나라도 넣어보세요. OpenAI/Claude API를 활용한 챗봇이나 텍스트 요약 기능도 채용시 큰 차별점이 됩니다.'),
('TypeScript 5.9 발표: 타입 추론 개선 및 컴파일러 최적화', 'https://devblogs.microsoft.com/typescript/announcing-typescript-5-9/', 'official_blog', 'TypeScript 5.9가 출시되어 타입 변수 추론 개선, 대규모 프로젝트에서 더 빠른 편집 경험을 제공합니다.', '{"TypeScript", "프론트엔드", "JavaScript", "개발도구"}', '{"프론트엔드 개발자": 95, "풀스택 개발자": 90, "백엔드 개발자": 60}', 'https://www.youtube.com/watch?v=zQnBQ4tB3ZA', 'Traversy Media - TypeScript Crash Course', 'Zod 라이브러리로 런타임 타입 검증까지 추가하면 API 응답 처리가 훨씬 안전해집니다.'),
('Next.js 15: Turbopack 기본 번들러 도입과 Server Actions 안정화', 'https://nextjs.org/blog/next-15', 'official_blog', 'Next.js 15는 Turbopack을 기본 번들러로 도입하여 빌드 시간을 5-10배 단축했습니다.', '{"Next.js", "React", "Turbopack", "풀스택"}', '{"프론트엔드 개발자": 90, "풀스택 개발자": 95, "백엔드 개발자": 50}', 'https://www.youtube.com/watch?v=_w0Ikk4JY7U', 'Codevolution - Next.js 15 Tutorial', 'Server Actions와 useFormState를 조합하면 별도 API 라우트 없이 로딩/에러 상태 관리도 깔끔해집니다.'),
('GitHub Copilot Workspace: AI 기반 개발 환경의 미래', 'https://github.blog/news-insights/product-news/github-copilot-workspace/', 'official_blog', 'Copilot Workspace는 자연어로 아이디어를 코드로 변환하고 자동 리뷰, 보안 스캔을 지원합니다.', '{"AI", "GitHub", "Copilot", "개발도구"}', '{"백엔드 개발자": 85, "프론트엔드 개발자": 85, "풀스택 개발자": 85}', 'https://www.youtube.com/watch?v=Fi3AJZZregI', 'GitHub - Copilot Agent Mode 공식 소개', 'copilot:review 명령으로 코드 품질 자동 검사가 가능합니다. 팀 프로젝트 코드 리뷰 프로세스를 자동화해보세요.'),
('Supabase 2026 업데이트: Edge Functions 속도 제한 및 MCP 서버 배포', 'https://supabase.com/changelog', 'official_blog', 'Edge Functions에 재귀적 호출 속도 제한이 도입되었고 MCP 서버 배포 기능도 추가되었습니다.', '{"Supabase", "Edge Functions", "서버리스", "백엔드"}', '{"백엔드 개발자": 90, "풀스택 개발자": 85, "프론트엔드 개발자": 50}', 'https://www.youtube.com/watch?v=dU7GwCOgvNY', 'Traversy Media - Supabase Crash Course', 'Supabase Edge Functions로 AI API 호출을 서버사이드에서 처리하면 API 키 노출 없이 AI 기능을 구현할 수 있습니다.'),
('2026년 정보처리기사 CBT 전환 및 시험 개편 안내', 'https://www.q-net.or.kr/man004.do?id=man00402&gSite=Q&gId=', 'certification', '2026년부터 CBT 도입 확대와 실기 개편이 이루어집니다.', '{"자격증", "정보처리기사", "CBT", "시험개편"}', '{"백엔드 개발자": 85, "풀스택 개발자": 80, "DevOps 엔지니어": 90}', 'https://www.youtube.com/watch?v=tBkuBrRJcOI', '수제비 - 2026 정보처리기사 필기 핵심 요약', '실기 SQL+프로그래밍 비중이 높아졌습니다. 프로젝트에서 실제 SQL 쿼리를 작성하고 매일 알고리즘 1-2문제씩 풀어보세요.'),
('Docker 대체 기술 2026: Podman, containerd, Buildah 비교', 'https://spacelift.io/blog/docker-alternatives', 'tech_media', 'Podman은 데몬 없는 아키텍처로 Docker를 대체할 수 있습니다.', '{"Docker", "DevOps", "Podman", "컨테이너"}', '{"백엔드 개발자": 80, "풀스택 개발자": 75, "DevOps 엔지니어": 90}', 'https://www.youtube.com/watch?v=3c-iBn73dDE', 'TechWorld with Nana - Docker Tutorial', 'docker-compose.yml 하나로 DB+백엔드+프론트를 한 번에 띄울 수 있습니다. 팀 협업에 필수입니다.'),
('Kotlin 2.3.0 릴리스: 명시적 백킹 필드 및 JPA 지원 향상', 'https://blog.jetbrains.com/kotlin/2025/12/kotlin-2-3-0-released/', 'official_blog', 'Kotlin 2.3.0은 명시적 백킹 필드, 컨텍스트 기반 해석 변화를 도입했습니다.', '{"Kotlin", "Android", "JPA", "JetBrains"}', '{"Android 개발자": 95, "백엔드 개발자": 70, "풀스택 개발자": 50}', 'https://www.youtube.com/watch?v=F9UC9DY-vIU', 'freeCodeCamp - Kotlin Course for Beginners', 'Retrofit + Coroutines 조합으로 네트워크 호출을 깔끔하게 처리해보세요.'),
('Claude Code: Anthropic의 AI 코딩 어시스턴트 정식 출시', 'https://docs.anthropic.com/en/docs/claude-code/overview', 'official_blog', 'Claude Code는 터미널 기반 에이전틱 도구로 개발자의 일상 작업을 자동화합니다.', '{"Claude", "AI", "코딩도구", "Anthropic"}', '{"백엔드 개발자": 90, "프론트엔드 개발자": 90, "풀스택 개발자": 90, "AI 엔지니어": 95}', 'https://www.youtube.com/watch?v=eHdp_lMsaHk', 'Anthropic - Claude Code 공식 데모', 'Claude API를 프로젝트에 통합하면 텍스트 분석, 코드 리뷰, 문서 요약 기능을 구현할 수 있습니다.'),
('2026 Python AI/ML 트렌드: 생성형 AI부터 MLOps까지', 'https://www.daydreamsoft.com/blog/new-and-evolving-trends-in-python-powered-ai-ml-2026', 'tech_media', 'Python은 생성형 AI, AutoML, 엣지 AI, MLOps에서 주도적 역할을 합니다.', '{"Python", "AI", "머신러닝", "MLOps"}', '{"AI 엔지니어": 95, "백엔드 개발자": 75, "풀스택 개발자": 70}', 'https://www.youtube.com/watch?v=i_LwzRVP7bg', 'freeCodeCamp - Machine Learning with Python', 'scikit-learn으로 학생 이탈 예측 모델을 만들거나, LangChain으로 RAG 기반 Q&A 챗봇을 구현해보세요.'),
('2026 AWS 클라우드 자격증 트렌드: AI/ML 통합이 핵심', 'https://kodekloud.com/blog/top-aws-certifications-in-2026-which-are-worth-your-investment/', 'industry_report', 'AWS Certified AI Practitioner가 신규 인기 자격증입니다. 클라우드 기술 수요 25% 증가.', '{"AWS", "클라우드", "자격증", "AI"}', '{"백엔드 개발자": 80, "DevOps 엔지니어": 95, "풀스택 개발자": 70, "AI 엔지니어": 85}', 'https://www.youtube.com/watch?v=SOTamWNgDKc', 'freeCodeCamp - AWS Cloud Practitioner', 'Lambda + API Gateway 조합으로 서버리스 아키텍처를 경험하면 면접에서 클라우드 역량을 어필할 수 있습니다.'),
('Cursor IDE: AI 네이티브 코드 에디터의 새로운 표준', 'https://www.cursor.com/', 'tech_media', 'Cursor는 AI 기반 코드 에디터로 Fortune 500 기업의 절반 이상이 사용 중입니다.', '{"Cursor", "AI", "IDE", "개발도구"}', '{"프론트엔드 개발자": 90, "백엔드 개발자": 90, "풀스택 개발자": 90}', 'https://www.youtube.com/watch?v=gqUQbjsYZLQ', 'Fireship - Cursor just changed everything', '.cursorrules 파일에 프로젝트 컨벤션을 정의하면 AI가 프로젝트 스타일에 맞는 코드를 생성합니다.'),
('Vercel 2025-2026: AI 에이전트 배포 폭발적 증가와 Rolling Releases', 'https://vercel.com/blog/vercel-ship-2025-recap', 'official_blog', '30% 이상의 배포가 AI 코딩 에이전트로 시작되었습니다. Rolling Releases 기능 추가.', '{"Vercel", "배포", "AI", "웹개발"}', '{"프론트엔드 개발자": 85, "풀스택 개발자": 90, "백엔드 개발자": 60}', 'https://www.youtube.com/watch?v=2HBIzEx6IZA', 'Lee Robinson - Deploy Next.js on Vercel', 'GitHub 레포를 Vercel에 연결하면 push할 때마다 자동 배포됩니다. PR마다 미리보기 URL이 생성되어 팀 리뷰가 편리해집니다.');


-- ══════════════════════════════════════════════
-- 완료! 모든 테이블, 인덱스, 정책, 시드 데이터가 적용되었습니다.
-- ══════════════════════════════════════════════
