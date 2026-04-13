// src/app/(dashboard)/trends/page.tsx — 기술 트렌드 (기사/영상 탭 분리 + 바이브코딩/로컬LLM)
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import TrendRefreshButton from './TrendRefreshButton';
import TrendFeed from './TrendFeed';

export default async function TrendsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const serviceClient = createServiceClient();
  const { data: profile } = await serviceClient
    .from('user_profiles')
    .select('target_job, courses(name, tech_stack)')
    .eq('user_id', user.id)
    .single();

  const { data: articles } = await serviceClient
    .from('trend_articles')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(40);

  const courseName = (profile?.courses as any)?.name || '';
  const targetJob = profile?.target_job || '';
  const techStack: string[] = (profile?.courses as any)?.tech_stack || [];

  // 최신 기사 날짜
  const latestDate = articles?.[0]?.created_at
    ? new Date(articles[0].created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : null;

  // 관련도 점수 계산 + 정렬
  const enrichedArticles = (articles || []).map((article) => {
    const relevance = article.relevance_map as Record<string, number> | null;
    const matchScore = relevance?.[targetJob] || relevance?.[courseName] || 0;

    // 태그 기반 추가 매칭
    const articleTags = (article.tags || []) as string[];
    const tagMatch = articleTags.some((tag: string) =>
      techStack.some((ts: string) =>
        tag.toLowerCase().includes(ts.toLowerCase()) || ts.toLowerCase().includes(tag.toLowerCase())
      )
    );

    return {
      ...article,
      matchScore,
      isRecommended: matchScore >= 70 || tagMatch,
    };
  });

  // 추천 기사 상단, 나머지 날짜순
  const sortedArticles = [
    ...enrichedArticles.filter(a => a.isRecommended).sort((a, b) => b.matchScore - a.matchScore),
    ...enrichedArticles.filter(a => !a.isRecommended),
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-charcoal">기술 트렌드</h1>
          <p className="text-[var(--text-secondary)] mt-1">
            {courseName ? `${courseName} 맞춤 큐레이션` : '최신 기술 트렌드'}
          </p>
        </div>
        <div className="text-right">
          <TrendRefreshButton />
          {latestDate && (
            <p className="text-[10px] text-[var(--text-tertiary)] mt-1">최근 업데이트: {latestDate}</p>
          )}
        </div>
      </div>

      {sortedArticles.length > 0 ? (
        <TrendFeed articles={sortedArticles} targetJob={targetJob} />
      ) : (
        <div className="bg-cream-white rounded-[20px] p-12 card-shadow text-center">
          <svg className="w-12 h-12 mx-auto mb-4 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1.001A3.75 3.75 0 0012 18z" />
          </svg>
          <p className="text-[var(--text-secondary)]">아직 큐레이션된 기사가 없습니다.</p>
          <p className="text-sm text-[var(--text-tertiary)] mt-2">위의 새로고침 버튼을 눌러 최신 트렌드를 가져오세요!</p>
        </div>
      )}
    </div>
  );
}
