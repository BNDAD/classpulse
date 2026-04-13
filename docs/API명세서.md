# ClassPulse API 명세서

> Next.js 15 App Router 기반 API Routes  
> Base URL: `https://your-domain.vercel.app`  
> 작성일: 2026-04-13

---

## 공통 사항

### 인증

모든 API는 Supabase Auth 기반 JWT 쿠키 인증을 사용합니다.  
로그인하지 않은 요청에는 `401 Unauthorized`를 반환합니다.

### 공통 응답 형식

**성공**
```json
{
  "success": true,
  "data": { ... }
}
```

**에러**
```json
{
  "error": "에러 메시지"
}
```

### HTTP 상태 코드

| 코드 | 의미 |
|------|------|
| 200 | 성공 |
| 400 | 잘못된 요청 (필수 파라미터 누락, 유효성 오류) |
| 401 | 인증 필요 |
| 404 | 리소스 없음 |
| 409 | 충돌 (중복 예약 등) |
| 422 | 처리 불가 (Jina Reader 크롤링 실패 등) |
| 500 | 서버 내부 오류 |

---

## 1. AI 기능 API

### 1.1 채용공고 AI 딥 애널라이저

**POST** `/api/ai/analyze-job`

채용공고 URL을 입력받아 2단계 AI 파이프라인으로 심층 분석합니다.

- 1단계: Jina Reader로 채용공고·기업 홈페이지·기술블로그 크롤링
- 2단계: GPT-4o-mini(기업정보 추출) → GPT-4o(심층 분석)

**Request Body**

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `jobUrl` | string | ✅ | 채용공고 URL (http/https로 시작해야 함) |

```json
{
  "jobUrl": "https://www.example.com/careers/backend-engineer"
}
```

**Response 200**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "company_name": "카카오",
    "job_url": "https://...",
    "company_analysis": {
      "industry": "인터넷/플랫폼",
      "size": "대기업",
      "culture": "수평적 문화, 자율과 책임",
      "coreValues": ["성장", "도전", "협업"],
      "recentNews": ["카카오 2025 개발자 컨퍼런스 개최", "..."]
    },
    "tech_stack": {
      "required": ["Java", "Spring Boot", "MySQL"],
      "preferred": ["Kotlin", "Kubernetes"],
      "inferred": ["Redis", "Kafka"]
    },
    "match_score": 72,
    "interview_prep": {
      "technical": ["Spring MVC의 동작 원리를 설명해주세요.", "..."],
      "behavioral": ["가장 어려웠던 프로젝트 경험을 말씀해주세요.", "..."],
      "companySpecific": ["카카오의 핵심 서비스 중 개선하고 싶은 부분은?", "..."]
    },
    "portfolio_guide": {
      "highlights": ["트래픽 처리 경험 강조", "..."],
      "improvements": ["Redis 캐싱 프로젝트 추가 권장", "..."],
      "projectSuggestions": ["대용량 데이터 처리 토이 프로젝트", "..."]
    },
    "resume_guide": {
      "keyPoints": ["Java 8+ 기능 활용 경험 명시", "..."],
      "storyLine": "성장 지향적 개발자로서 ...",
      "coreValueConnection": "카카오의 '도전' 가치와 연결하여 ..."
    }
  },
  "companyName": "카카오",
  "matchScore": 72
}
```

**에러 응답**

| 상태 | 조건 |
|------|------|
| 400 | jobUrl이 없거나 http로 시작하지 않음 |
| 400 | 학생 프로필 미등록 |
| 422 | Jina Reader 크롤링 실패 (접근 불가 URL) |

**런타임**: Node.js / **타임아웃**: 60초

---

### 1.2 AI 브릿지 레슨 & 감정 체크인

**POST** `/api/ai/bridge-lesson`

`action` 파라미터로 브릿지 레슨과 감정 체크인 두 가지 기능을 처리합니다.

**Request Body — 브릿지 레슨**

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `action` | string | ✅ | `"bridge-lesson"` |
| `topic` | string | ✅ | 설명 요청 주제 (예: "JPA N+1 문제") |

```json
{
  "action": "bridge-lesson",
  "topic": "JPA N+1 문제"
}
```

**Response 200 — 브릿지 레슨**

```json
{
  "success": true,
  "content": "JPA N+1 문제는 ... (AI 설명 텍스트)"
}
```

---

**Request Body — 감정 체크인**

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `action` | string | ✅ | `"emotion-checkin"` |
| `emotion` | string | ✅ | `FIRE` \| `HAPPY` \| `NEUTRAL` \| `TIRED` \| `EXHAUSTED` |
| `week` | number | | 현재 수업 주차 (기본값: 1) |

```json
{
  "action": "emotion-checkin",
  "emotion": "TIRED",
  "week": 8
}
```

**Response 200 — 감정 체크인**

```json
{
  "success": true,
  "response": "8주차가 되니 많이 지쳐 있겠네요 ... (AI 응원 메시지)"
}
```

**에러 응답**

| 상태 | 조건 |
|------|------|
| 400 | 지원하지 않는 action 값 |

---

### 1.3 AI 문서 피드백

**POST** `/api/ai/feedback`

자기소개서 또는 포트폴리오에 대한 AI 피드백을 생성합니다.  
`jobAnalysisId`가 있으면 채용공고 타겟팅 모드로 동작합니다.

**Request Body**

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `content` | string | ✅ | 문서 본문 (최소 50자) |
| `type` | string | ✅ | `"RESUME"` \| `"PORTFOLIO"` \| `"COVER_LETTER"` |
| `title` | string | | 문서 제목 |
| `documentId` | string | | 기존 문서 ID (없으면 신규 생성) |
| `jobAnalysisId` | string | | 타겟팅할 채용공고 분석 ID |

```json
{
  "content": "저는 Java Spring Boot를 활용한 백엔드 개발자로 ...",
  "type": "RESUME",
  "title": "카카오 자기소개서 v2",
  "jobAnalysisId": "uuid-of-job-analysis"
}
```

**Response 200**

```json
{
  "success": true,
  "documentId": "uuid",
  "feedback": {
    "overall": "전반적으로 기술적 역량이 잘 드러나 있으나 ...",
    "sections": [
      {
        "section": "지원 동기",
        "score": 75,
        "strengths": ["구체적인 경험 서술"],
        "improvements": ["기업 핵심가치와의 연결이 부족"]
      }
    ],
    "score": {
      "overall": 78,
      "clarity": 80,
      "relevance": 75,
      "authenticity": 82,
      "impact": 74
    }
  },
  "isTargeted": true,
  "targetCompany": "카카오"
}
```

**에러 응답**

| 상태 | 조건 |
|------|------|
| 400 | content가 50자 미만 |
| 404 | jobAnalysisId에 해당하는 분석 결과 없음 |

**런타임**: Node.js / **타임아웃**: 60초

---

## 2. 상담 예약 API

### 2.1 상담 목록 조회

**GET** `/api/consultation`

학생은 본인 예약 목록, 멘토/어드민은 담당 예약 전체를 반환합니다.

**Response 200**

```json
{
  "consultations": [
    {
      "id": "uuid",
      "student_id": "uuid",
      "mentor_id": "uuid",
      "student_name": "김철수",
      "mentor_name": "이영희 멘토",
      "date": "2026-04-20",
      "start_time": "10:00",
      "end_time": "10:30",
      "type": "CAREER",
      "status": "CONFIRMED",
      "topic": "자소서 피드백 요청",
      "student_memo": "3번 항목 방향이 맞는지 확인하고 싶어요",
      "mentor_memo": null
    }
  ],
  "isMentor": false
}
```

---

### 2.2 상담 예약 신청

**POST** `/api/consultation`

**Request Body**

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `mentorId` | string | ✅ | 멘토 user_id |
| `date` | string | ✅ | 상담 날짜 (YYYY-MM-DD) |
| `startTime` | string | ✅ | 시작 시간 (HH:MM) |
| `endTime` | string | | 종료 시간 (없으면 시작 + 30분 자동 계산) |
| `type` | string | | 상담 유형 (기본값: `"CAREER"`) |
| `topic` | string | | 상담 주제 |
| `studentMemo` | string | | 사전 메모 |

```json
{
  "mentorId": "uuid",
  "date": "2026-04-20",
  "startTime": "10:00",
  "type": "CAREER",
  "topic": "포트폴리오 방향 상담",
  "studentMemo": "최근 만든 프로젝트 방향이 맞는지 확인하고 싶습니다"
}
```

**Response 200**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "student_id": "uuid",
    "mentor_id": "uuid",
    "date": "2026-04-20",
    "start_time": "10:00",
    "end_time": "10:30",
    "status": "REQUESTED"
  }
}
```

**에러 응답**

| 상태 | 조건 |
|------|------|
| 400 | mentorId, date, startTime 중 누락 |
| 409 | 해당 시간 슬롯 이미 예약됨 |

---

### 2.3 상담 상태 변경

**PATCH** `/api/consultation`

멘토는 CONFIRMED·COMPLETED로, 학생 또는 멘토는 CANCELLED로 변경 가능합니다.

**Request Body**

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `consultationId` | string | ✅ | 예약 ID |
| `status` | string | ✅ | `CONFIRMED` \| `COMPLETED` \| `CANCELLED` |
| `mentorMemo` | string | | 멘토 메모 (COMPLETED 시) |
| `cancelReason` | string | | 취소 사유 (CANCELLED 시) |

```json
{
  "consultationId": "uuid",
  "status": "CONFIRMED"
}
```

**Response 200**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "CONFIRMED",
    "updated_at": "2026-04-13T10:00:00Z"
  }
}
```

---

### 2.4 멘토 가능 시간 조회

**GET** `/api/consultation/availability?mentorId={uuid}`

**Query Parameters**

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `mentorId` | string | ✅ | 멘토 user_id |

**Response 200**

```json
{
  "availability": [
    {
      "id": "uuid",
      "day_of_week": 1,
      "start_time": "10:00",
      "end_time": "12:00",
      "slot_minutes": 30,
      "is_active": true
    }
  ]
}
```

---

## 3. 문서 수정본 API

### 3.1 수정본 제안 목록 조회 / 생성

**GET** `/api/documents/revisions?documentId={uuid}`

**POST** `/api/documents/revisions`

멘토가 문서 수정본을 제안하거나, 학생이 수락/거절할 때 사용합니다.

**POST Request Body**

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `documentId` | string | ✅ | 대상 문서 ID |
| `originalContent` | string | ✅ | 원본 내용 |
| `revisedContent` | string | ✅ | 수정 제안 내용 |
| `revisionNotes` | string | | 수정 이유/코멘트 |
| `sectionIndex` | number | | 섹션 인덱스 |

---

## 4. Cron API (서버 내부 전용)

> 모든 Cron API는 `Authorization: Bearer {CRON_SECRET}` 헤더 필수.  
> 외부에서 직접 호출 불가.

### 4.1 학습 심박수 일일 점검

**GET** `/api/cron/pulse-check`

매일 자정에 Vercel Cron이 호출합니다.  
오늘 학습 데이터가 있는 모든 학생의 위험도를 재계산하고, ORANGE/RED 학생에게 알림을 생성합니다.

**Response 200**

```json
{
  "message": "심박수 체크 완료",
  "processed": 28,
  "alerts": 3
}
```

---

### 4.2 기술 트렌드 업데이트

**GET** `/api/cron/update-trends`

매일 오전 6시에 Vercel Cron이 호출합니다.  
최신 기술 아티클을 크롤링하거나 fallback 데이터를 삽입합니다.

**Response 200**

```json
{
  "message": "트렌드 업데이트 완료",
  "inserted": 5
}
```

---

## 5. AI 모델 라우팅 참고

| 작업 (taskType) | 모델 | Tier |
|-----------------|------|------|
| `emotion-response` | GPT-4o-mini | TIER 1 |
| `cert-reminder` | GPT-4o-mini | TIER 1 |
| `trend-summary` | GPT-4o-mini | TIER 1 |
| `bridge-lesson` | GPT-4o-mini | TIER 1 |
| `jina-summarize` | GPT-4o-mini | TIER 1 |
| `company-info-extract` | GPT-4o-mini | TIER 1 |
| `job-deep-analysis` | GPT-4o | TIER 2 |
| `resume-feedback` | GPT-4o | TIER 2 |
| `portfolio-feedback` | GPT-4o | TIER 2 |
| `career-roadmap` | GPT-4o | TIER 2 |

TIER 1 (GPT-4o-mini): 빠른 응답, 저비용, 전체 호출의 ~90%  
TIER 2 (GPT-4o): 높은 품질, 전체 호출의 ~10%
