-- ==============================================
-- ClassPulse 003: 상담 예약 시스템
-- ==============================================

DO $$ BEGIN
  CREATE TYPE consult_status AS ENUM ('REQUESTED', 'CONFIRMED', 'COMPLETED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE consult_type AS ENUM ('CAREER', 'LEARNING', 'PERSONAL', 'PORTFOLIO', 'RESUME', 'OTHER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── 멘토 상담 가능 시간 ──
CREATE TABLE IF NOT EXISTS mentor_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),  -- 0=일, 1=월, ..., 6=토
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  slot_minutes INT DEFAULT 30,  -- 상담 1건 시간 (분)
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── 상담 예약 ──
CREATE TABLE IF NOT EXISTS consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mentor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  type consult_type NOT NULL DEFAULT 'CAREER',
  status consult_status NOT NULL DEFAULT 'REQUESTED',
  topic TEXT,                     -- 상담 주제
  student_memo TEXT,              -- 학생 메모
  mentor_memo TEXT,               -- 멘토 메모 (상담 후)
  meeting_url TEXT,               -- 온라인 상담 링크
  cancelled_by UUID,
  cancel_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── 인덱스 ──
CREATE INDEX IF NOT EXISTS idx_consult_student ON consultations(student_id, date);
CREATE INDEX IF NOT EXISTS idx_consult_mentor ON consultations(mentor_id, date);
CREATE INDEX IF NOT EXISTS idx_consult_status ON consultations(status);
CREATE INDEX IF NOT EXISTS idx_mentor_avail ON mentor_availability(mentor_id, day_of_week);

-- RLS 비활성화 (데모)
ALTER TABLE mentor_availability DISABLE ROW LEVEL SECURITY;
ALTER TABLE consultations DISABLE ROW LEVEL SECURITY;

-- ── 트리거 ──
CREATE TRIGGER tr_consultations_updated
  BEFORE UPDATE ON consultations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── 데모 멘토 가능 시간 (기존 멘토 유저용) ──
-- 월~금 10:00~12:00, 14:00~17:00
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
