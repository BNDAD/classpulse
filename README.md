# ClassPulse 🎓

> AI 기반 학원 학생 관리 · 취업 코칭 통합 플랫폼

ClassPulse는 IT 교육기관(국비지원 학원)을 위한 올인원 AI 플랫폼입니다.  
학생의 학습 상태를 실시간으로 추적하고, AI가 취업 준비(자소서·포트폴리오·채용공고 분석)를 코칭하며, 멘토와의 상담 예약까지 하나의 시스템에서 관리합니다.

---

## 주요 기능

### 🫀 학습 심박수 (Learning Pulse)
- 출석·과제·감정·질문 수를 매일 기록하여 학생의 학습 상태를 수치화
- AI가 위험도(GREEN / YELLOW / ORANGE / RED)를 자동 산출
- 위험 학생 발생 시 멘토에게 자동 알림 발송 (Vercel Cron)

### 🔍 채용공고 AI 딥 애널라이저
- URL 한 줄 입력 → 기업 홈페이지·기술블로그 자동 크롤링 (Jina Reader)
- **2단계 파이프라인**: GPT-4o-mini 요약 → GPT-4o 심층 분석
- 면접 예상 질문 20개, 포트폴리오 개선 가이드, 자소서 스토리라인 제공
- 학생 프로필 기반 매칭 점수(0~100) 자동 계산

### 📝 AI 문서 코치
- 자기소개서 · 포트폴리오 AI 피드백 (일반 / 채용공고 타겟팅 모드)
- 멘토의 수정본 제안 → 학생 수락/거절 워크플로우
- 문서 버전 관리 및 피드백 이력 저장

### 📚 AI 브릿지 레슨
- 어려운 수업 주제를 AI가 쉽게 재설명
- 주간 감정 체크인 → AI 맞춤 응원 메시지

### 📅 멘토 상담 예약
- 멘토별 가능 시간 설정 → 학생이 슬롯 선택 후 예약
- 상담 상태 관리 (신청 → 확정 → 완료)
- 예약/취소 시 실시간 알림

### 📈 기술 트렌드 피드
- 수강 과정에 맞는 최신 기술 아티클·유튜브 자동 큐레이션
- Vercel Cron으로 주기적 업데이트

### 🏆 자격증 트래커
- 목표 자격증 등록 · 시험 일정 알림
- 과정별 권장 자격증 안내

---

## 기술 스택

| 구분 | 기술 |
|------|------|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS |
| 상태 관리 | Zustand |
| Backend (BaaS) | Supabase (PostgreSQL, Auth, RLS) |
| AI | OpenAI GPT-4o / GPT-4o-mini (2-Tier 모델 라우터) |
| 웹 크롤링 | Jina Reader API |
| 배포 | Vercel (Edge + Node.js Runtime) |
| 스케줄러 | Vercel Cron |

---

## 프로젝트 구조

```
classpulse/
├── src/
│   ├── app/
│   │   ├── (auth)/             # 로그인·회원가입
│   │   ├── (dashboard)/        # 주요 기능 페이지
│   │   │   ├── dashboard/      # 홈 대시보드
│   │   │   ├── career/         # 채용공고 분석
│   │   │   ├── coach/          # AI 문서 코치
│   │   │   ├── mentor/         # 멘토 관리 (멘토 전용)
│   │   │   ├── consultation/   # 상담 예약
│   │   │   ├── learning/       # 학습 심박수
│   │   │   ├── certs/          # 자격증 트래커
│   │   │   └── trends/         # 기술 트렌드
│   │   ├── api/
│   │   │   ├── ai/             # AI 기능 API
│   │   │   │   ├── analyze-job/    # 채용공고 분석
│   │   │   │   ├── bridge-lesson/  # 브릿지 레슨·감정 체크인
│   │   │   │   └── feedback/       # 문서 피드백
│   │   │   ├── consultation/   # 상담 예약 API
│   │   │   ├── documents/      # 문서 수정본 API
│   │   │   └── cron/           # 스케줄 작업
│   │   │       ├── pulse-check/    # 학습 심박수 일일 점검
│   │   │       └── update-trends/  # 트렌드 업데이트
│   │   └── page.tsx            # 랜딩 페이지
│   ├── components/
│   │   ├── common/             # Header, Sidebar
│   │   ├── dashboard/          # 대시보드 컴포넌트
│   │   └── ui/                 # 공통 UI
│   ├── lib/
│   │   ├── ai/
│   │   │   ├── harness.ts      # AI 하네스 코어 엔진
│   │   │   ├── model-router.ts # 2-Tier 모델 라우터
│   │   │   ├── jina-reader.ts  # 웹 크롤링
│   │   │   ├── chains/         # AI 체인 (위험도 예측 등)
│   │   │   └── prompts/        # 하네스 프롬프트 정의
│   │   ├── supabase/           # Supabase 클라이언트
│   │   └── validators/         # Zod 스키마
│   └── types/                  # TypeScript 타입 정의
└── supabase/
    ├── migrations/             # DB 마이그레이션 (001~004)
    └── seed*.sql               # 시드 데이터
```

---

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.local` 파일을 생성하고 아래 값을 입력합니다.

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenAI
OPENAI_API_KEY=sk-...

# Jina Reader
JINA_API_KEY=jina_...

# Vercel Cron 인증
CRON_SECRET=your-cron-secret
```

### 3. 데이터베이스 마이그레이션

```bash
# Supabase CLI 사용
supabase db push

# 또는 supabase 콘솔에서 직접 실행
supabase/migrations/001_initial.sql
supabase/migrations/002_academy_detail.sql
supabase/migrations/003_consultation.sql
supabase/migrations/004_targeted_feedback.sql
```

### 4. 개발 서버 실행

```bash
npm run dev
```

`http://localhost:3000` 에서 확인할 수 있습니다.

---

## 사용자 역할

| 역할 | 설명 |
|------|------|
| `STUDENT` | 일반 수강생. 학습 기록, AI 코칭, 상담 예약 이용 |
| `MENTOR` | 담당 멘토. 학생 관리, 피드백 제공, 상담 진행 |
| `CAREER_ADVISOR` | 취업 상담사. 상담 및 문서 피드백 전담 |
| `ADMIN` | 학원 관리자. 전체 시스템 관리 |

---

## AI 아키텍처

ClassPulse는 **2-Tier 모델 라우터**로 비용과 품질을 최적화합니다.

```
사용자 요청
    ↓
model-router.ts (작업 유형 판별)
    ├── TIER 1 (GPT-4o-mini, ~90% 호출)
    │   └── 감정 응답, 트렌드 요약, Jina 요약, 브릿지 레슨
    └── TIER 2 (GPT-4o, ~10% 호출)
        └── 채용공고 심층 분석, 자소서 피드백, 포트폴리오 피드백
```

모든 AI 호출은 **하네스(Harness)** 패턴으로 실행됩니다.  
역할(Role) · 톤(Tone) · 컨텍스트 · 규칙 · 금지사항을 시스템 프롬프트로 조립하여 일관된 품질을 보장합니다.

---

## Vercel Cron 스케줄

| 작업 | 경로 | 주기 |
|------|------|------|
| 학습 심박수 점검 | `/api/cron/pulse-check` | 매일 자정 |
| 기술 트렌드 업데이트 | `/api/cron/update-trends` | 매일 오전 6시 |

---

## 라이선스

MIT
