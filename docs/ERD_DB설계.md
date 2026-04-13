# ClassPulse ERD 및 DB 설계 문서

> Supabase (PostgreSQL) 기반  
> 작성일: 2026-04-13

---

## 1. ERD 다이어그램

```
┌─────────────────┐        ┌──────────────────────┐
│   auth.users    │        │      branches        │
│─────────────────│        │──────────────────────│
│ id (UUID) PK    │        │ id (UUID) PK         │
│ email           │        │ name                 │
│ ...             │        │ address              │
└────────┬────────┘        │ phone                │
         │ 1               └──────────┬───────────┘
         │                            │ 1
         │                            │
         ▼ N                          ▼ N
┌─────────────────────────────────────────────────────┐
│                   user_profiles                     │
│─────────────────────────────────────────────────────│
│ id (UUID) PK                                        │
│ user_id (UUID) FK → auth.users.id   UNIQUE          │
│ role         user_role  (STUDENT/MENTOR/...)        │
│ name, phone                                         │
│ course_id    (UUID) FK → courses.id                 │
│ branch_id    (UUID) FK → branches.id                │
│ mentor_id    (UUID) FK → auth.users.id              │
│ target_job, target_company                          │
│ github_url, projects(JSONB), interests(TEXT[])      │
│ target_certs(TEXT[])                                │
│ student_status  student_status                      │
│ completed_at, care_until, enrollment_code           │
│ created_at, updated_at                              │
└─────────────────────────────────────────────────────┘
         │ 1           │ 1           │ 1
         │             │             │
         │             │             │
    ─────┼─────   ─────┼─────   ─────┼─────
    N    │    N   N    │    N   N    │    N
         │             │             │
         ▼             ▼             ▼
 ┌──────────────┐  ┌───────────┐  ┌──────────────────┐
 │learning_pulse│  │  courses  │  │  pulse_checkins  │
 │──────────────│  │───────────│  │──────────────────│
 │ id  PK       │  │ id  PK    │  │ id  PK           │
 │ user_id  FK  │  │ name      │  │ user_id  FK      │
 │ date  DATE   │  │ branch_id │  │ week  INT        │
 │ attendance   │  │ course_type│ │ emotion          │
 │ assignment_done│ │start_date│  │ ai_response TEXT │
 │ questions_count│ │end_date  │  │ created_at       │
 │ emotion_score  │ │tech_stack│  └──────────────────┘
 │ streak_count   │ │mentor_id │
 │ risk_score(0-100)│└──────────┘
 │ risk_level     │
 └──────────────┘

 ┌──────────────────┐        ┌──────────────────────┐
 │   job_analyses   │        │      documents       │
 │──────────────────│        │──────────────────────│
 │ id  PK           │◄───────│ job_analysis_id FK   │
 │ user_id  FK      │        │ id  PK               │
 │ company_name     │        │ user_id  FK          │
 │ job_url          │        │ type  document_type  │
 │ company_analysis │        │ title, content       │
 │ tech_stack JSONB │        │ status feedback_status│
 │ interview_prep   │        │ version  INT         │
 │ portfolio_guide  │        │ target_company       │
 │ resume_guide     │        │ target_position      │
 │ match_score(0-100)│       │ created_at           │
 │ created_at       │        └──────────┬───────────┘
 └──────────────────┘                   │ 1
                                        │
                              ──────────┼──────────
                              N         │         N
                                        ▼
                            ┌──────────────────────┐
                            │       feedbacks      │
                            │──────────────────────│
                            │ id  PK               │
                            │ document_id  FK      │
                            │ reviewer_type TEXT   │
                            │ content  JSONB       │
                            │ score  JSONB         │
                            │ status               │
                            │ revised_content      │
                            │ revision_notes       │
                            │ revised_at           │
                            └──────────────────────┘
                                        ▲
                                        │ document_id
                            ┌──────────────────────┐
                            │  document_revisions  │
                            │──────────────────────│
                            │ id  PK               │
                            │ document_id  FK      │
                            │ mentor_id  FK        │
                            │ original_content     │
                            │ revised_content      │
                            │ revision_notes       │
                            │ section_index  INT   │
                            │ status (PENDING/...)  │
                            │ student_response     │
                            │ created_at, updated_at│
                            └──────────────────────┘

 ┌──────────────────────┐        ┌───────────────────────┐
 │  mentor_availability │        │    consultations      │
 │──────────────────────│        │───────────────────────│
 │ id  PK               │        │ id  PK                │
 │ mentor_id  FK        │        │ student_id  FK        │
 │ day_of_week (0-6)    │        │ mentor_id  FK         │
 │ start_time TIME      │        │ date DATE             │
 │ end_time  TIME       │        │ start_time, end_time  │
 │ slot_minutes INT     │        │ type  consult_type    │
 │ is_active BOOLEAN    │        │ status consult_status │
 │ created_at           │        │ topic                 │
 └──────────────────────┘        │ student_memo          │
                                 │ mentor_memo           │
                                 │ meeting_url           │
                                 │ cancelled_by FK       │
                                 │ cancel_reason         │
                                 │ created_at, updated_at│
                                 └───────────────────────┘

 ┌──────────────────────┐        ┌───────────────────────┐
 │   certifications     │        │    notifications      │
 │──────────────────────│        │───────────────────────│
 │ id  PK               │        │ id  PK                │
 │ name TEXT            │        │ user_id  FK           │
 │ category TEXT        │        │ type TEXT             │
 │ popularity INT       │        │ title TEXT            │
 │ description TEXT     │        │ content TEXT          │
 │ created_at           │        │ metadata JSONB        │
 └──────────────────────┘        │ is_read BOOLEAN       │
                                 │ created_at            │
                                 └───────────────────────┘
```

---

## 2. ENUM 타입 정의

| ENUM 이름 | 값 | 설명 |
|-----------|-----|------|
| `user_role` | `STUDENT`, `MENTOR`, `CAREER_ADVISOR`, `ADMIN` | 사용자 역할 |
| `risk_level` | `GREEN`, `YELLOW`, `ORANGE`, `RED` | 학습 위험도 |
| `emotion_level` | `FIRE`, `HAPPY`, `NEUTRAL`, `TIRED`, `EXHAUSTED` | 감정 상태 |
| `document_type` | `RESUME`, `PORTFOLIO`, `COVER_LETTER` | 문서 유형 |
| `feedback_status` | `AI_DRAFT`, `MENTOR_REVIEW`, `COMPLETED`, `DELIVERED` | 피드백 상태 |
| `student_status` | `ENROLLED`, `COMPLETED`, `CARE_PERIOD`, `EXPIRED` | 학생 수강 상태 |
| `course_type` | `NCS`, `PRIVATE`, `SHORT` | 과정 유형 |
| `consult_status` | `REQUESTED`, `CONFIRMED`, `COMPLETED`, `CANCELLED` | 상담 예약 상태 |
| `consult_type` | `CAREER`, `LEARNING`, `PERSONAL`, `PORTFOLIO`, `RESUME`, `OTHER` | 상담 유형 |

---

## 3. 테이블 상세 설계

### 3.1 courses (교육 과정)

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | 과정 ID |
| `name` | TEXT | NOT NULL | 과정명 (예: Java 풀스택 개발자 양성과정) |
| `description` | TEXT | | 과정 설명 |
| `duration_weeks` | INT | NOT NULL | 총 교육 기간(주) |
| `difficulty_map` | JSONB | | 주차별 난이도 맵 |
| `tech_stack` | TEXT[] | DEFAULT '{}' | 사용 기술 스택 |
| `branch_id` | UUID | FK → branches.id | 소속 지점 |
| `course_type` | course_type | DEFAULT 'NCS' | 과정 유형 |
| `classroom` | TEXT | | 강의실 (예: 301호) |
| `schedule_time` | TEXT | | 수업 시간 (예: 09:00 ~ 17:40) |
| `instructor` | TEXT | | 강사명 |
| `mentor_id` | UUID | FK → auth.users.id | 담당 멘토 |
| `curriculum` | JSONB | | 주차별 커리큘럼 |
| `start_date` | DATE | | 시작일 |
| `end_date` | DATE | | 종료일 |
| `total_students` | INT | DEFAULT 0 | 수강생 수 |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | 생성일 |

### 3.2 user_profiles (사용자 프로필)

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | UUID | PK | 프로필 ID |
| `user_id` | UUID | UNIQUE, FK → auth.users.id | Supabase Auth 사용자 ID |
| `role` | user_role | NOT NULL, DEFAULT 'STUDENT' | 역할 |
| `name` | TEXT | NOT NULL | 이름 |
| `phone` | TEXT | | 연락처 |
| `course_id` | UUID | FK → courses.id | 수강 과정 |
| `branch_id` | UUID | FK → branches.id | 소속 지점 |
| `mentor_id` | UUID | FK → auth.users.id | 담당 멘토 |
| `target_job` | TEXT | | 목표 직무 |
| `target_company` | TEXT | | 목표 기업 |
| `github_url` | TEXT | | GitHub 주소 |
| `projects` | JSONB | DEFAULT '[]' | 프로젝트 이력 |
| `interests` | TEXT[] | DEFAULT '{}' | 관심 기술/분야 |
| `target_certs` | TEXT[] | DEFAULT '{}' | 목표 자격증 |
| `student_status` | student_status | DEFAULT 'ENROLLED' | 수강 상태 |
| `completed_at` | DATE | | 수료일 |
| `care_until` | DATE | | 수료 후 케어 종료일 (수료일 + 6개월) |
| `enrollment_code` | TEXT | | 수강 등록 코드 |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | 생성일 |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | 수정일 |

### 3.3 learning_pulse (학습 심박수)

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | UUID | PK | 기록 ID |
| `user_id` | UUID | NOT NULL, FK → auth.users.id | 학생 ID |
| `date` | DATE | NOT NULL, DEFAULT CURRENT_DATE | 기록 날짜 |
| `attendance` | BOOLEAN | DEFAULT false | 출석 여부 |
| `assignment_done` | BOOLEAN | DEFAULT false | 과제 완료 여부 |
| `questions_count` | INT | DEFAULT 0 | 질문 횟수 |
| `emotion_score` | INT | CHECK (1~5) | 감정 점수 |
| `streak_count` | INT | DEFAULT 0 | 연속 출석 일수 |
| `risk_score` | INT | CHECK (0~100), DEFAULT 0 | AI 산출 위험도 점수 |
| `risk_level` | risk_level | DEFAULT 'GREEN' | 위험 레벨 |
| UNIQUE | (user_id, date) | | 날짜별 중복 방지 |

### 3.4 job_analyses (채용공고 AI 분석)

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | UUID | PK | 분석 ID |
| `user_id` | UUID | NOT NULL, FK | 요청 학생 |
| `company_name` | TEXT | NOT NULL | 기업명 |
| `job_url` | TEXT | NOT NULL | 채용공고 URL |
| `company_analysis` | JSONB | NOT NULL | 기업 분석 결과 |
| `tech_stack` | JSONB | NOT NULL | 기술 스택 분석 |
| `interview_prep` | JSONB | NOT NULL | 면접 예상 질문 |
| `portfolio_guide` | JSONB | NOT NULL | 포트폴리오 가이드 |
| `resume_guide` | JSONB | NOT NULL | 자소서 가이드 |
| `match_score` | INT | CHECK (0~100) | 학생-공고 매칭 점수 |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | 분석일 |

### 3.5 documents (자기소개서·포트폴리오)

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | UUID | PK | 문서 ID |
| `user_id` | UUID | NOT NULL, FK | 작성 학생 |
| `type` | document_type | NOT NULL | 문서 유형 |
| `title` | TEXT | NOT NULL | 문서 제목 |
| `content` | TEXT | NOT NULL | 문서 본문 |
| `status` | feedback_status | | 피드백 진행 상태 |
| `version` | INT | DEFAULT 1 | 버전 |
| `job_analysis_id` | UUID | FK → job_analyses.id | 연결된 채용공고 |
| `target_company` | TEXT | | 타겟 기업 |
| `target_position` | TEXT | | 타겟 직무 |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | 생성일 |

### 3.6 consultations (상담 예약)

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | UUID | PK | 예약 ID |
| `student_id` | UUID | NOT NULL, FK | 학생 ID |
| `mentor_id` | UUID | NOT NULL, FK | 멘토 ID |
| `date` | DATE | NOT NULL | 상담 날짜 |
| `start_time` | TIME | NOT NULL | 시작 시간 |
| `end_time` | TIME | NOT NULL | 종료 시간 |
| `type` | consult_type | NOT NULL, DEFAULT 'CAREER' | 상담 유형 |
| `status` | consult_status | NOT NULL, DEFAULT 'REQUESTED' | 예약 상태 |
| `topic` | TEXT | | 상담 주제 |
| `student_memo` | TEXT | | 학생 사전 메모 |
| `mentor_memo` | TEXT | | 멘토 상담 후 메모 |
| `meeting_url` | TEXT | | 온라인 상담 링크 |
| `cancelled_by` | UUID | FK | 취소한 사용자 |
| `cancel_reason` | TEXT | | 취소 사유 |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | 생성일 |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | 수정일 |

---

## 4. 인덱스

```sql
-- user_profiles
CREATE INDEX idx_user_profiles_branch    ON user_profiles(branch_id);
CREATE INDEX idx_user_profiles_mentor    ON user_profiles(mentor_id);
CREATE INDEX idx_user_profiles_status   ON user_profiles(student_status);

-- learning_pulse
CREATE UNIQUE INDEX ON learning_pulse(user_id, date);

-- consultations
CREATE INDEX idx_consult_student ON consultations(student_id, date);
CREATE INDEX idx_consult_mentor  ON consultations(mentor_id, date);
CREATE INDEX idx_consult_status  ON consultations(status);

-- mentor_availability
CREATE INDEX idx_mentor_avail ON mentor_availability(mentor_id, day_of_week);

-- courses
CREATE INDEX idx_courses_branch ON courses(branch_id);

-- branches
CREATE INDEX idx_branches_name ON branches(name);
```

---

## 5. 마이그레이션 파일 구조

| 파일 | 내용 |
|------|------|
| `001_initial.sql` | courses, user_profiles, learning_pulse, pulse_checkins, job_analyses, documents, feedbacks, notifications, certifications, trend_articles 기본 스키마 |
| `002_academy_detail.sql` | branches 테이블, courses·user_profiles 학원 상세 컬럼 추가, student_status / course_type ENUM |
| `003_consultation.sql` | mentor_availability, consultations 테이블, consult_status / consult_type ENUM, 트리거 |
| `004_targeted_feedback.sql` | documents에 job_analysis_id·target_company·target_position 추가, document_revisions 테이블, certifications 카테고리 컬럼 추가 |

---

## 6. 보안 설계 (RLS)

현재 버전은 데모 목적으로 대부분의 테이블에서 RLS를 비활성화하였습니다.  
프로덕션 배포 시에는 아래 정책을 적용해야 합니다.

| 테이블 | 정책 |
|--------|------|
| `user_profiles` | 본인 또는 담당 멘토/어드민만 조회·수정 |
| `learning_pulse` | 본인만 삽입, 멘토/어드민은 조회 가능 |
| `documents` | 본인만 삽입·수정, 멘토는 피드백 목적으로 조회 |
| `consultations` | student_id 또는 mentor_id 본인만 조회 |
| `job_analyses` | 본인만 조회 |
| `notifications` | user_id 본인만 조회 |

서비스 로직에서 RLS 우회가 필요한 경우 `SUPABASE_SERVICE_ROLE_KEY`를 사용하는 서비스 클라이언트를 통해서만 접근하도록 제한합니다.
