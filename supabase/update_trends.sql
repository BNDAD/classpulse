-- ══════════════════════════════════════════════
-- 트렌드 기사 업데이트 (유튜브 + 프로젝트 팁 추가)
-- Supabase SQL Editor에서 실행하세요
-- ══════════════════════════════════════════════

-- 1) 새 컬럼 추가 (이미 있으면 무시)
ALTER TABLE trend_articles ADD COLUMN IF NOT EXISTS youtube_url TEXT;
ALTER TABLE trend_articles ADD COLUMN IF NOT EXISTS youtube_title TEXT;
ALTER TABLE trend_articles ADD COLUMN IF NOT EXISTS project_tips TEXT;

-- 2) 기존 데이터 삭제 후 새 데이터 삽입
DELETE FROM trend_articles;

INSERT INTO trend_articles (title, source_url, source_type, summary, tags, relevance_map, youtube_url, youtube_title, project_tips) VALUES

-- 1. Spring Boot
(
  'Spring Boot 3.5.0 릴리스: 선언적 인터페이스 클라이언트와 API 버전관리',
  'https://spring.io/blog/2025/05/22/spring-boot-3-5-0-available-now',
  'official_blog',
  'Spring Boot 3.5.0이 출시되었습니다. 선언적 인터페이스 클라이언트, API 버전 관리, 통합된 Spring Security 지원 등이 추가되었습니다.',
  '{"Spring Boot", "Java", "백엔드", "프레임워크"}',
  '{"백엔드 개발자": 95, "풀스택 개발자": 80, "프론트엔드 개발자": 30}',
  'https://www.youtube.com/watch?v=9SGDpanrc8U',
  '김영한 - 스프링 부트 핵심 원리와 활용',
  '프로젝트에 Spring Boot 3.5의 선언적 HTTP 클라이언트(@HttpExchange)를 적용하면 외부 API 연동 코드를 인터페이스만으로 깔끔하게 작성할 수 있습니다. REST API 프로젝트라면 API 버전관리(/v1, /v2) 패턴도 도입해보세요.'
),

-- 2. React Compiler
(
  'React Compiler v1.0 출시: 자동 메모이제이션으로 성능 최적화',
  'https://react.dev/blog/2025/10/07/react-compiler-1',
  'official_blog',
  'React Compiler v1.0이 출시되어 자동 메모이제이션을 통해 성능을 최적화합니다. useMemo, useCallback 없이도 고성능 앱 개발이 가능합니다.',
  '{"React", "프론트엔드", "컴파일러", "성능최적화"}',
  '{"프론트엔드 개발자": 95, "풀스택 개발자": 85, "백엔드 개발자": 40}',
  'https://www.youtube.com/watch?v=kjOacmVsLSE',
  'Fireship - React 19 is here (100초 설명)',
  '기존 프로젝트에서 useMemo/useCallback을 과도하게 사용하고 있다면 React Compiler 도입을 검토하세요. babel-plugin-react-compiler를 추가하면 수동 메모이제이션 없이도 리렌더링을 최적화할 수 있습니다.'
),

-- 3. 채용 트렌드
(
  '2025-2026 한국 IT 개발자 채용 트렌드: AI 역량이 필수가 되다',
  'https://dev-korea.com/blog/korea-most-in-demand-programming-languages-tech-roles-2025',
  'industry_report',
  'Python, JavaScript, TypeScript가 가장 인기 있는 언어이며, 기업의 70%가 AI/ML 관련 역량을 우대사항에 포함시키고 있습니다.',
  '{"채용", "AI", "트렌드", "커리어"}',
  '{"백엔드 개발자": 90, "프론트엔드 개발자": 85, "풀스택 개발자": 90, "AI 엔지니어": 95}',
  'https://www.youtube.com/watch?v=oFr4kkKxsZo',
  '노마드코더 - 2025 개발자 로드맵 총정리',
  '포트폴리오에 AI 기능을 하나라도 넣어보세요. OpenAI API 또는 Claude API를 활용한 챗봇, 텍스트 요약, 이미지 분석 등 간단한 기능도 채용시 큰 차별점이 됩니다.'
),

-- 4. TypeScript
(
  'TypeScript 5.9 발표: 타입 추론 개선 및 컴파일러 최적화',
  'https://devblogs.microsoft.com/typescript/announcing-typescript-5-9/',
  'official_blog',
  'TypeScript 5.9가 출시되어 타입 변수 추론 개선, 향상된 tsc --init 설정, 대규모 프로젝트에서 더 빠른 편집 경험을 제공합니다.',
  '{"TypeScript", "프론트엔드", "JavaScript", "개발도구"}',
  '{"프론트엔드 개발자": 95, "풀스택 개발자": 90, "백엔드 개발자": 60}',
  'https://www.youtube.com/watch?v=zQnBQ4tB3ZA',
  'Traversy Media - TypeScript Crash Course',
  '프로젝트에 strict 모드를 켜고 any 사용을 최소화하세요. Zod 라이브러리로 런타임 타입 검증까지 추가하면 API 응답 처리가 훨씬 안전해집니다.'
),

-- 5. Next.js 15
(
  'Next.js 15: Turbopack 기본 번들러 도입과 Server Actions 안정화',
  'https://nextjs.org/blog/next-15',
  'official_blog',
  'Next.js 15는 Turbopack을 기본 번들러로 도입하여 빌드 시간을 5-10배 단축했습니다. Server Actions 안정화, React 19 통합 지원이 포함됩니다.',
  '{"Next.js", "React", "Turbopack", "풀스택"}',
  '{"프론트엔드 개발자": 90, "풀스택 개발자": 95, "백엔드 개발자": 50}',
  'https://www.youtube.com/watch?v=_w0Ikk4JY7U',
  'Codevolution - Next.js 15 Tutorial (풀 코스)',
  '폼 처리에 Server Actions를 사용하면 별도 API 라우트 없이 서버 로직을 실행할 수 있습니다. use server 디렉티브와 useFormState를 조합하면 로딩/에러 상태 관리도 깔끔해집니다.'
),

-- 6. GitHub Copilot
(
  'GitHub Copilot Workspace: AI 기반 개발 환경의 미래',
  'https://github.blog/news-insights/product-news/github-copilot-workspace/',
  'official_blog',
  'Copilot Workspace는 자연어로 아이디어를 코드로 변환하고 자동 리뷰, 보안 스캔, 커스텀 에이전트를 지원합니다.',
  '{"AI", "GitHub", "Copilot", "개발도구"}',
  '{"백엔드 개발자": 85, "프론트엔드 개발자": 85, "풀스택 개발자": 85}',
  'https://www.youtube.com/watch?v=Fi3AJZZregI',
  'GitHub - Copilot Agent Mode 공식 소개',
  'Copilot을 코드 작성뿐 아니라 PR 리뷰에도 활용하세요. copilot:review 명령으로 코드 품질 자동 검사가 가능합니다. 팀 프로젝트에서 코드 리뷰 프로세스를 자동화할 수 있습니다.'
),

-- 7. Supabase
(
  'Supabase 2026 업데이트: Edge Functions 속도 제한 및 MCP 서버 배포',
  'https://supabase.com/changelog',
  'official_blog',
  'Edge Functions에 재귀적 호출 속도 제한이 도입되었고, 분당 5,000 요청 예산 제공. MCP 서버 배포 기능도 추가되었습니다.',
  '{"Supabase", "Edge Functions", "서버리스", "백엔드"}',
  '{"백엔드 개발자": 90, "풀스택 개발자": 85, "프론트엔드 개발자": 50}',
  'https://www.youtube.com/watch?v=dU7GwCOgvNY',
  'Traversy Media - Supabase Crash Course',
  'Supabase Edge Functions로 OpenAI/Claude API 호출을 서버사이드에서 처리하면 API 키 노출 없이 AI 기능을 구현할 수 있습니다. RLS(Row Level Security)도 반드시 설정하세요.'
),

-- 8. 정보처리기사
(
  '2026년 정보처리기사 CBT 전환 및 시험 개편 안내',
  'https://www.q-net.or.kr/man004.do?id=man00402&gSite=Q&gId=',
  'certification',
  '2026년부터 CBT 도입 확대와 실기 개편이 이루어집니다. 문제은행식 출제와 자동 채점이 도입되어 시험 구조가 변경됩니다.',
  '{"자격증", "정보처리기사", "CBT", "시험개편"}',
  '{"백엔드 개발자": 85, "풀스택 개발자": 80, "DevOps 엔지니어": 90}',
  'https://www.youtube.com/watch?v=tBkuBrRJcOI',
  '수제비 - 2026 정보처리기사 필기 핵심 요약',
  '실기 시험의 SQL + 프로그래밍 비중이 높아졌습니다. 프로젝트에서 실제 SQL 쿼리를 작성하고, Java/Python 알고리즘 문제를 매일 1-2문제씩 풀어보세요.'
),

-- 9. Docker 대안
(
  'Docker 대체 기술 2026: Podman, containerd, Buildah 비교',
  'https://spacelift.io/blog/docker-alternatives',
  'tech_media',
  'Podman은 데몬 없는 아키텍처로 Docker를 대체할 수 있으며, containerd와 Buildah 등 OCI 표준 지원 도구들이 주목받고 있습니다.',
  '{"Docker", "DevOps", "Podman", "컨테이너"}',
  '{"백엔드 개발자": 80, "풀스택 개발자": 75, "DevOps 엔지니어": 90}',
  'https://www.youtube.com/watch?v=3c-iBn73dDE',
  'TechWorld with Nana - Docker Tutorial for Beginners',
  '프로젝트를 Docker Compose로 구성하면 DB + 백엔드 + 프론트를 한 번에 띄울 수 있습니다. docker-compose.yml 하나로 팀원 모두 동일한 개발 환경을 만들 수 있어 협업에 필수입니다.'
),

-- 10. Kotlin
(
  'Kotlin 2.3.0 릴리스: 명시적 백킹 필드 및 JPA 지원 향상',
  'https://blog.jetbrains.com/kotlin/2025/12/kotlin-2-3-0-released/',
  'official_blog',
  'Kotlin 2.3.0은 명시적 백킹 필드, 컨텍스트 기반 해석 변화, 사용하지 않는 반환값 검사기를 도입했습니다.',
  '{"Kotlin", "Android", "JPA", "JetBrains"}',
  '{"Android 개발자": 95, "백엔드 개발자": 70, "풀스택 개발자": 50}',
  'https://www.youtube.com/watch?v=F9UC9DY-vIU',
  'freeCodeCamp - Kotlin Course for Beginners',
  'Android 프로젝트에 Kotlin Coroutines + Flow를 도입하면 비동기 처리가 훨씬 간결해집니다. Retrofit + Coroutines 조합으로 네트워크 호출을 깔끔하게 처리해보세요.'
),

-- 11. Claude Code
(
  'Claude Code: Anthropic의 AI 코딩 어시스턴트 정식 출시',
  'https://docs.anthropic.com/en/docs/claude-code/overview',
  'official_blog',
  'Claude Code는 터미널 기반 에이전틱 도구로 개발자의 일상 작업을 자동화하고 복잡한 코드를 설명하며 Git 워크플로우를 관리합니다.',
  '{"Claude", "AI", "코딩도구", "Anthropic"}',
  '{"백엔드 개발자": 90, "프론트엔드 개발자": 90, "풀스택 개발자": 90, "AI 엔지니어": 95}',
  'https://www.youtube.com/watch?v=eHdp_lMsaHk',
  'Anthropic - Claude Code 공식 데모',
  'Claude API를 프로젝트에 통합하면 텍스트 분석, 코드 리뷰, 문서 요약 기능을 구현할 수 있습니다. 바이브코딩 공모전이라면 AI 활용 사례를 적극적으로 보여주세요!'
),

-- 12. Python AI/ML
(
  '2026 Python AI/ML 트렌드: 생성형 AI부터 MLOps까지',
  'https://www.daydreamsoft.com/blog/new-and-evolving-trends-in-python-powered-ai-ml-2026',
  'tech_media',
  'Python은 생성형 AI, AutoML, 엣지 AI, MLOps에서 주도적 역할을 합니다. 소형 언어 모델(SLM)이 주목받고 있으며 MLOps 역할 수요는 41% 증가했습니다.',
  '{"Python", "AI", "머신러닝", "MLOps"}',
  '{"AI 엔지니어": 95, "백엔드 개발자": 75, "풀스택 개발자": 70}',
  'https://www.youtube.com/watch?v=i_LwzRVP7bg',
  'freeCodeCamp - Machine Learning with Python (18시간 풀코스)',
  '프로젝트에 간단한 ML 기능을 추가해보세요. scikit-learn으로 학생 이탈 예측 모델을 만들거나, LangChain으로 RAG 기반 Q&A 챗봇을 구현할 수 있습니다.'
),

-- 13. AWS 자격증
(
  '2026 AWS 클라우드 자격증 트렌드: AI/ML 통합이 핵심',
  'https://kodekloud.com/blog/top-aws-certifications-in-2026-which-are-worth-your-investment/',
  'industry_report',
  'AWS Certified AI Practitioner, ML Engineer Associate가 신규 인기 자격증입니다. 클라우드 기술 수요 25% 증가, 인증 전문가는 20-30% 높은 연봉을 받습니다.',
  '{"AWS", "클라우드", "자격증", "AI"}',
  '{"백엔드 개발자": 80, "DevOps 엔지니어": 95, "풀스택 개발자": 70, "AI 엔지니어": 85}',
  'https://www.youtube.com/watch?v=SOTamWNgDKc',
  'freeCodeCamp - AWS Certified Cloud Practitioner (풀코스)',
  '프로젝트를 AWS에 배포해보세요. EC2 대신 Lambda + API Gateway 조합으로 서버리스 아키텍처를 경험하면 면접에서 클라우드 역량을 어필할 수 있습니다.'
),

-- 14. Cursor IDE
(
  'Cursor IDE: AI 네이티브 코드 에디터의 새로운 표준',
  'https://www.cursor.com/',
  'tech_media',
  'Cursor는 AI 기반 코드 에디터로 Fortune 500 기업의 절반 이상이 사용 중입니다. Background Agents, Composer 2.0을 도입하며 개발 생산성을 혁신합니다.',
  '{"Cursor", "AI", "IDE", "개발도구"}',
  '{"프론트엔드 개발자": 90, "백엔드 개발자": 90, "풀스택 개발자": 90}',
  'https://www.youtube.com/watch?v=gqUQbjsYZLQ',
  'Fireship - Cursor just changed satisfying (Cursor 소개)',
  'Cursor의 Composer 기능으로 여러 파일을 동시에 편집할 수 있습니다. .cursorrules 파일에 프로젝트 컨벤션을 정의하면 AI가 프로젝트 스타일에 맞는 코드를 생성합니다.'
),

-- 15. Vercel
(
  'Vercel 2025-2026: AI 에이전트 배포 폭발적 증가와 Rolling Releases',
  'https://vercel.com/blog/vercel-ship-2025-recap',
  'official_blog',
  '지난 3개월간 주간 배포가 2배 증가했으며, 30% 이상의 배포가 AI 코딩 에이전트로 시작되었습니다. Django 지원, Rolling Releases 기능이 추가되었습니다.',
  '{"Vercel", "배포", "AI", "웹개발"}',
  '{"프론트엔드 개발자": 85, "풀스택 개발자": 90, "백엔드 개발자": 60}',
  'https://www.youtube.com/watch?v=2HBIzEx6IZA',
  'Lee Robinson - Deploy Next.js on Vercel (공식)',
  'GitHub 레포를 Vercel에 연결하면 push할 때마다 자동 배포됩니다. Preview Deployments로 PR마다 미리보기 URL이 생성되어 팀 리뷰가 편리해집니다.'
);
