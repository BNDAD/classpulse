// src/app/api/cron/update-trends/route.ts — 기술 트렌드 자동 업데이트
// Vercel Cron 또는 수동 호출로 최신 기사 크롤링 + AI 요약
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

// ── 수동 호출 시 DB에 시드 데이터가 없으면 기본 데이터 삽입 ──
const FALLBACK_ARTICLES = [
  {
    title: 'Spring Boot 3.3 Virtual Thread 정식 지원',
    source_url: 'https://spring.io/blog/2024/05/virtual-threads',
    source_type: 'blog',
    summary: 'Spring Boot 3.3부터 Virtual Thread가 정식 지원됩니다. 기존 스레드 모델 대비 10배 이상의 동시 요청 처리가 가능합니다.',
    tags: ['Java', 'Spring Boot', 'Virtual Thread', '바이브코딩'],
    relevance_map: { 'Java 풀스택 개발자 양성과정': 0.95 },
  },
  {
    title: 'Cursor AI + Claude: 바이브코딩 실전 가이드',
    source_url: 'https://cursor.sh/blog/vibe-coding',
    source_type: 'blog',
    summary: 'Cursor AI와 Claude를 활용한 바이브코딩 워크플로우를 소개합니다. 프롬프트 엔지니어링부터 자동 코드 생성까지.',
    tags: ['바이브코딩', 'Cursor', 'Claude', 'AI코딩', 'vibe coding'],
    relevance_map: { 'Java 풀스택 개발자 양성과정': 0.9, 'Python AI/데이터분석 과정': 0.85 },
    youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    youtube_title: '바이브코딩 실전 튜토리얼 - Cursor + Claude',
  },
  {
    title: 'Ollama로 로컬 LLM 구축하기 완벽 가이드',
    source_url: 'https://ollama.com/blog/local-llm-guide',
    source_type: 'blog',
    summary: 'Ollama를 사용하여 로컬 환경에서 LLM을 실행하는 방법을 단계별로 설명합니다. GPU 없이도 가능한 경량 모델 추천.',
    tags: ['로컬LLM', 'Ollama', 'AI', 'LLM', 'local llm'],
    relevance_map: { 'Python AI/데이터분석 과정': 0.95 },
    youtube_url: 'https://www.youtube.com/watch?v=jBFFUwL0TyY',
    youtube_title: 'Ollama 설치부터 활용까지 - 로컬 LLM 가이드',
  },
  {
    title: 'OpenClaw(오픈클로) - 오픈소스 AI 에이전트 프레임워크',
    source_url: 'https://github.com/openclaw/openclaw',
    source_type: 'article',
    summary: '오픈클로는 AI 에이전트를 쉽게 만들 수 있는 오픈소스 프레임워크입니다. MCP 서버 연동과 멀티 에이전트 오케스트레이션을 지원합니다.',
    tags: ['오픈클로', 'openclaw', 'AI', 'MCP', '에이전트'],
    relevance_map: { 'Python AI/데이터분석 과정': 0.9 },
  },
  {
    title: 'Python 3.13 새로운 기능 총정리',
    source_url: 'https://realpython.com/python313-new-features/',
    source_type: 'article',
    summary: 'Python 3.13에서 추가된 주요 기능을 정리합니다. 개선된 에러 메시지, 타입 힌트 강화, 성능 개선 등이 포함됩니다.',
    tags: ['Python', '업데이트', '언어'],
    relevance_map: { 'Python AI/데이터분석 과정': 0.9 },
  },
  {
    title: 'Windsurf IDE - AI 네이티브 코드 에디터 리뷰',
    source_url: 'https://windsurf.com/blog/review-2026',
    source_type: 'blog',
    summary: 'Windsurf IDE가 바이브코딩 도구로 주목받고 있습니다. Cursor 대비 장단점과 실전 사용 후기.',
    tags: ['바이브코딩', 'Windsurf', 'AI코딩', 'IDE', 'vibe coding'],
    relevance_map: { 'Java 풀스택 개발자 양성과정': 0.85 },
    youtube_url: 'https://www.youtube.com/watch?v=abc123def45',
    youtube_title: 'Windsurf vs Cursor - 어떤 AI IDE가 좋을까?',
  },
  {
    title: 'AWS re:Invent 2025 핵심 발표 정리',
    source_url: 'https://aws.amazon.com/blogs/reinvent-2025/',
    source_type: 'blog',
    summary: 'AWS re:Invent 2025에서 발표된 새로운 서비스와 기능을 정리합니다. AI/ML 서비스 강화, 비용 최적화 도구 등.',
    tags: ['AWS', 'Cloud', 'AI', '컨퍼런스'],
    relevance_map: { '클라우드 엔지니어링 과정': 0.95, 'Python AI/데이터분석 과정': 0.5 },
  },
  {
    title: 'RAG 파이프라인 설계 패턴 2026',
    source_url: 'https://langchain.com/blog/rag-patterns-2026',
    source_type: 'article',
    summary: 'LangChain 기반 RAG 파이프라인의 최신 설계 패턴을 소개합니다. 하이브리드 검색, 청킹 전략, 리랭킹 기법 포함.',
    tags: ['RAG', 'LangChain', 'AI', 'LLM', '로컬LLM'],
    relevance_map: { 'Python AI/데이터분석 과정': 0.95 },
    youtube_url: 'https://www.youtube.com/watch?v=rag_demo_2026',
    youtube_title: 'RAG 파이프라인 실전 구축 - LangChain 2026',
  },
  {
    title: 'Claude Code로 프로젝트 자동화하기',
    source_url: 'https://docs.anthropic.com/claude-code-automation',
    source_type: 'blog',
    summary: 'Claude Code를 활용한 개발 워크플로우 자동화 방법을 소개합니다. 코드 리뷰, 테스트 생성, 리팩토링까지.',
    tags: ['Claude Code', 'AI코딩', '바이브코딩', 'Anthropic'],
    relevance_map: { 'Java 풀스택 개발자 양성과정': 0.9, 'Python AI/데이터분석 과정': 0.85 },
  },
  {
    title: 'Docker + Kubernetes 실전 배포 전략 2026',
    source_url: 'https://kubernetes.io/blog/deployment-2026/',
    source_type: 'article',
    summary: '2026년 최신 K8s 배포 전략을 정리합니다. GitOps, ArgoCD, 카나리 배포부터 서비스 메쉬까지.',
    tags: ['Docker', 'Kubernetes', 'DevOps', 'Cloud'],
    relevance_map: { '클라우드 엔지니어링 과정': 0.95 },
  },
];

export async function GET(request: NextRequest) {
  // 보안: cron secret 또는 수동(manual) 호출 허용
  const isManual = request.nextUrl.searchParams.get('manual') === 'true';
  if (!isManual) {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const serviceClient = createServiceClient();

    // 실시간 크롤링 시도 (AI API 키가 있는 경우)
    let allArticles: any[] = [];
    let usedFallback = false;

    if (process.env.JINA_API_KEY && process.env.OPENAI_API_KEY) {
      // 외부 크롤링 + AI 요약 (프로덕션 모드)
      try {
        const { extractWebContent } = await import('@/lib/ai/jina-reader');
        const { runHarness } = await import('@/lib/ai/harness');

        const TREND_SOURCES = [
          { url: 'https://news.hada.io', label: '긱뉴스', type: 'community' },
          { url: 'https://yozm.wishket.com/magazine/list/develop/', label: '요즘IT', type: 'tech_media' },
        ];

        for (const source of TREND_SOURCES) {
          try {
            const result = await extractWebContent(source.url);
            if (!result.success) continue;

            const articles = await runHarness(
              {
                taskType: 'jina-summarize',
                role: 'IT 기술 트렌드 큐레이터. 한국 IT 교육기관 학생 대상.',
                tone: '쉽고 친근하게',
                context: { audience: '국비/사비 IT교육 수강생' },
                rules: [
                  '최신 기술 트렌드 기사를 5~10개 추출하여 한국어로 요약',
                  'JSON 배열로 반환',
                ],
                forbidden: [],
                outputFormat: `[{"title":"...","url":"...","summary":"...","tags":["..."]}]`,
              },
              `다음 ${source.label} 페이지에서 최신 IT 기술 기사를 추출하고 요약해주세요:\n\n${result.content.slice(0, 10000)}`
            );

            let parsed: any[];
            try {
              const str = typeof articles === 'string' ? articles : JSON.stringify(articles);
              let arr;
              try { arr = JSON.parse(str); } catch {
                const match = str.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
                if (match) arr = JSON.parse(match[1].trim());
                else {
                  const arrMatch = str.match(/\[[\s\S]*\]/);
                  if (arrMatch) arr = JSON.parse(arrMatch[0]);
                }
              }
              parsed = Array.isArray(arr) ? arr : [];
            } catch {
              parsed = [];
            }

            for (const article of parsed) {
              allArticles.push({
                title: article.title || 'Untitled',
                source_url: article.url || source.url,
                source_type: source.type,
                summary: article.summary || '',
                tags: article.tags || [],
                relevance_map: article.relevance || {},
              });
            }
          } catch (e) {
            console.error(`트렌드 소스 ${source.label} 처리 실패:`, e);
          }
        }
      } catch (e) {
        console.error('크롤링 모듈 로드 실패:', e);
      }
    }

    // 크롤링 결과가 없으면 폴백 데이터 사용
    if (allArticles.length === 0) {
      allArticles = FALLBACK_ARTICLES;
      usedFallback = true;
    }

    // DB에 저장 (중복 URL 방지)
    let insertCount = 0;
    for (const article of allArticles) {
      const { data: existing } = await serviceClient
        .from('trend_articles')
        .select('id')
        .eq('source_url', article.source_url)
        .limit(1);

      if (!existing || existing.length === 0) {
        await serviceClient.from('trend_articles').insert(article);
        insertCount++;
      }
    }

    // 60일 이상 된 기사 삭제
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
    await serviceClient
      .from('trend_articles')
      .delete()
      .lt('created_at', sixtyDaysAgo);

    return NextResponse.json({
      success: true,
      total: allArticles.length,
      inserted: insertCount,
      usedFallback,
      message: insertCount > 0
        ? `${insertCount}개 새 기사 추가됨`
        : '이미 최신 상태입니다',
    });
  } catch (error: any) {
    console.error('트렌드 업데이트 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message || '서버 오류' },
      { status: 500 }
    );
  }
}
