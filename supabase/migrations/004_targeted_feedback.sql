-- ==============================================
-- ClassPulse 004: 타겟 피드백 + 멘토 수정본 시스템
-- ==============================================

-- documents 테이블에 채용공고 연결 컬럼 추가
ALTER TABLE documents ADD COLUMN IF NOT EXISTS job_analysis_id UUID REFERENCES job_analyses(id);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS target_company TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS target_position TEXT;

-- feedbacks 테이블에 멘토 수정본 관련 컬럼 추가
ALTER TABLE feedbacks ADD COLUMN IF NOT EXISTS revised_content TEXT;
ALTER TABLE feedbacks ADD COLUMN IF NOT EXISTS revision_notes TEXT;
ALTER TABLE feedbacks ADD COLUMN IF NOT EXISTS revised_at TIMESTAMPTZ;

-- 멘토 수정본 제안 테이블
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

-- RLS 비활성화 (데모용)
ALTER TABLE document_revisions DISABLE ROW LEVEL SECURITY;

-- 트리거
CREATE TRIGGER tr_document_revisions_updated
  BEFORE UPDATE ON document_revisions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- certifications 테이블에 category, popularity 추가 (검색 개선용)
ALTER TABLE certifications ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'IT';
ALTER TABLE certifications ADD COLUMN IF NOT EXISTS popularity INT DEFAULT 50;
ALTER TABLE certifications ADD COLUMN IF NOT EXISTS description TEXT;
