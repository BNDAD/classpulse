// src/app/(dashboard)/trends/TrendFeed.tsx — 기사/영상 탭 분리 + 유튜브 호버 썸네일
'use client';

import { useState, useMemo, useCallback } from 'react';

interface Article {
  id: string;
  title: string;
  source_url: string;
  source_type: string;
  summary: string;
  tags: string[];
  relevance_map: Record<string, number> | null;
  youtube_url: string | null;
  youtube_title: string | null;
  project_tips: string | null;
  created_at: string;
  matchScore: number;
  isRecommended: boolean;
}

function getYoutubeId(url: string): string | null {
  const match = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return '오늘';
  if (days < 7) return `${days}일 전`;
  if (days < 30) return `${Math.floor(days / 7)}주 전`;
  return `${Math.floor(days / 30)}개월 전`;
}

const SOURCE_LABELS: Record<string, string> = {
  official_blog: '공식 블로그',
  tech_media: '기술 미디어',
  certification: '자격증',
  industry_report: '업계 리포트',
  community: '커뮤니티',
};

const SOURCE_STYLES: Record<string, string> = {
  official_blog: 'bg-blue-100 text-blue-700',
  tech_media: 'bg-purple-100 text-purple-700',
  certification: 'bg-emerald-100 text-emerald-700',
  industry_report: 'bg-earth/10 text-earth',
  community: 'bg-cream-dark text-[var(--text-secondary)]',
};

const ARTICLE_FILTERS = [
  { key: 'all', label: '전체' },
  { key: 'recommended', label: '내 맞춤' },
  { key: 'vibe_coding', label: '바이브코딩' },
  { key: 'ai_llm', label: 'AI / LLM' },
  { key: 'official_blog', label: '공식 블로그' },
  { key: 'tech_media', label: '기술 미디어' },
  { key: 'certification', label: '자격증' },
  { key: 'industry_report', label: '업계 리포트' },
];

const VIDEO_FILTERS = [
  { key: 'all', label: '전체' },
  { key: 'recommended', label: '내 맞춤' },
  { key: 'vibe_coding', label: '바이브코딩' },
  { key: 'ai_llm', label: '로컬 LLM' },
  { key: 'frontend', label: '프론트엔드' },
  { key: 'certification', label: '자격증' },
];

const VIBE_TAGS = ['바이브코딩', 'vibe coding', 'cursor', 'windsurf', 'claude code', 'copilot', 'ai코딩', '오픈클로', 'openclaw', 'mcp'];
const AI_TAGS = ['llm', 'ollama', 'gpt', 'ai', '로컬llm', 'local llm', 'open webui', 'langchain', 'rag'];

function matchesTagFilter(article: Article, filterKey: string): boolean {
  const tags = (article.tags || []).map(t => t.toLowerCase());
  const title = article.title.toLowerCase();
  const combined = [...tags, title];
  if (filterKey === 'vibe_coding') return combined.some(t => VIBE_TAGS.some(v => t.includes(v)));
  if (filterKey === 'ai_llm') return combined.some(t => AI_TAGS.some(v => t.includes(v)));
  if (filterKey === 'frontend') return combined.some(t => ['react', 'next.js', 'nextjs', 'vue', 'svelte', '프론트엔드', 'frontend', 'css', 'tailwind'].some(v => t.includes(v)));
  return false;
}

/* ══════════════════════════════════════
   FilterChips
══════════════════════════════════════ */
function FilterChips({ options, active, onChange }: { options: { key: string; label: string }[]; active: string; onChange: (k: string) => void }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
      {options.map(opt => (
        <button key={opt.key} onClick={() => onChange(opt.key)}
          className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
            active === opt.key
              ? 'bg-sky-deep text-white shadow-sm'
              : 'bg-cream-white text-[var(--text-secondary)] hover:bg-cream-light border border-[rgba(26,26,26,0.06)]'
          }`}>
          {opt.label}
        </button>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════
   ArticleCard
══════════════════════════════════════ */
function ArticleCard({ article }: { article: Article }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <article className={`bg-cream-white rounded-[20px] overflow-hidden card-shadow hover:card-shadow-hover transition-all ${
      article.isRecommended ? 'ring-1 ring-sky/20' : ''
    }`}>
      <div className="p-5">
        <div className="flex items-center gap-1.5 mb-2 flex-wrap">
          <span className={`text-[11px] px-2 py-0.5 rounded-full ${SOURCE_STYLES[article.source_type] || 'bg-cream-dark text-[var(--text-secondary)]'}`}>
            {SOURCE_LABELS[article.source_type] || article.source_type}
          </span>
          {article.isRecommended && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-sky/10 text-sky-deep font-medium">
              {article.matchScore >= 70 ? `관련도 ${article.matchScore}%` : '과정 연관'}
            </span>
          )}
          {article.project_tips && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
              </svg>
              프로젝트 팁
            </span>
          )}
        </div>

        <a href={article.source_url} target="_blank" rel="noopener noreferrer"
          className="text-[15px] font-bold text-charcoal hover:text-sky-deep transition-colors block leading-snug">
          {article.title}
        </a>

        <p className="text-sm text-[var(--text-secondary)] mt-1.5 leading-relaxed line-clamp-2">{article.summary}</p>

        <div className="flex items-center gap-1.5 mt-2 text-[11px] text-[var(--text-tertiary)]">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.06a4.5 4.5 0 00-1.242-7.244l-4.5-4.5a4.5 4.5 0 00-6.364 6.364L4.34 8.374" />
          </svg>
          <span>{new URL(article.source_url).hostname.replace('www.', '')}</span>
          <span className="opacity-50">·</span>
          <span>{timeAgo(article.created_at)}</span>
        </div>

        <div className="flex flex-wrap gap-1.5 mt-2.5">
          {article.tags?.map((tag: string) => (
            <span key={tag} className="text-[11px] px-2 py-0.5 bg-cream-light text-[var(--text-secondary)] rounded-md">#{tag}</span>
          ))}
        </div>

        <div className="flex gap-2 mt-3 pt-2.5 border-t border-[rgba(26,26,26,0.04)]">
          <a href={article.source_url} target="_blank" rel="noopener noreferrer"
            className="px-3 py-1.5 text-xs font-medium bg-cream-dark text-charcoal rounded-lg hover:bg-cream transition-colors flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            원문 보기
          </a>
          {article.project_tips && (
            <button onClick={() => setExpanded(!expanded)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 ${
                expanded ? 'bg-green-600 text-white' : 'bg-green-50 text-green-700 hover:bg-green-100'
              }`}>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
              </svg>
              {expanded ? '팁 닫기' : '프로젝트 적용법'}
            </button>
          )}
        </div>
      </div>

      {expanded && article.project_tips && (
        <div className="border-t border-[rgba(26,26,26,0.04)] bg-emerald-50/50 p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-green-800 mb-1">내 프로젝트에 적용하기</p>
              <p className="text-sm text-green-700 leading-relaxed">{article.project_tips}</p>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}

/* ══════════════════════════════════════
   YouTube Thumbnail with fallback
══════════════════════════════════════ */
function YTThumb({ videoId, size = 'sm', title }: { videoId: string; size?: 'sm' | 'lg'; title?: string }) {
  const [failed, setFailed] = useState(false);

  const src = size === 'lg'
    ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
    : `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;

  const handleLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    // YouTube 가짜 ID → 120x90 회색 플레이스홀더 반환. 진짜 썸네일은 320x180+
    const img = e.currentTarget;
    if (img.naturalWidth <= 120) setFailed(true);
  }, []);
  const handleError = useCallback(() => setFailed(true), []);

  if (failed) {
    return (
      <div className="w-full h-full bg-[#1a1a2e] flex flex-col items-center justify-center relative">
        <div className="w-8 h-5 bg-red-600 rounded-[4px] flex items-center justify-center">
          <svg className="w-3 h-3 fill-white ml-px" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
        </div>
        {size === 'lg' && title && (
          <p className="text-white/80 text-[10px] mt-2 px-3 text-center line-clamp-2 leading-snug">{title}</p>
        )}
      </div>
    );
  }

  return <img src={src} alt="" className="w-full h-full object-cover" loading="lazy" onLoad={handleLoad} onError={handleError} />;
}

/* ══════════════════════════════════════
   YouTubeItem (리스트 아이템 + 호버 프리뷰)
══════════════════════════════════════ */
function YouTubeItem({ article, isOpen, onToggle }: { article: Article; isOpen: boolean; onToggle: () => void }) {
  const youtubeId = article.youtube_url ? getYoutubeId(article.youtube_url) : null;
  if (!youtubeId) return null;

  return (
    <>
      <div onClick={onToggle}
        className={`flex items-center gap-3.5 px-5 py-3 border-b border-[rgba(26,26,26,0.03)] cursor-pointer transition-colors relative group ${
          isOpen ? 'bg-cream-light' : 'hover:bg-cream-light'
        }`}>
        {/* 미니 썸네일 */}
        <div className="w-12 h-12 rounded-[10px] overflow-hidden flex-shrink-0 relative bg-black">
          <YTThumb videoId={youtubeId} size="sm" />
          <div className="absolute inset-0 flex items-center justify-center bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity">
            <svg className="w-4 h-4 fill-white drop-shadow" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
          </div>
        </div>

        {/* 제목 + 메타 */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-charcoal truncate group-hover:text-sky-deep transition-colors">
            {article.youtube_title || article.title}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-[var(--text-tertiary)] flex-wrap">
            <span>{new URL(article.source_url).hostname.replace('www.', '')}</span>
            <span className="w-[3px] h-[3px] rounded-full bg-[var(--text-tertiary)] shrink-0" />
            <span>{timeAgo(article.created_at)}</span>
            {article.isRecommended && (
              <span className="px-1.5 py-px rounded-full text-[10px] font-semibold bg-sky/10 text-sky-deep">
                {article.matchScore >= 70 ? `관련도 ${article.matchScore}%` : '과정 연관'}
              </span>
            )}
          </div>
        </div>

        {/* 호버 프리뷰 카드 */}
        <div className="absolute right-5 top-1/2 -translate-y-1/2 w-[280px] bg-cream-white rounded-[14px] shadow-[0_12px_40px_rgba(26,26,26,.15),0_0_0_1px_rgba(26,26,26,.06)] overflow-hidden opacity-0 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 translate-x-2 transition-all duration-200 z-50 hidden lg:block">
          <div className="relative w-full aspect-video bg-black">
            <YTThumb videoId={youtubeId} size="lg" title={article.youtube_title || article.title} />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-11 h-11 bg-red-600/90 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-[18px] h-[18px] fill-white ml-0.5" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
              </div>
            </div>
          </div>
          <div className="p-3">
            <p className="text-[13px] font-bold text-charcoal leading-snug line-clamp-2">
              {article.youtube_title || article.title}
            </p>
            <p className="text-[11px] text-[var(--text-tertiary)] mt-1">{new URL(article.source_url).hostname.replace('www.', '')}</p>
            {article.summary && (
              <p className="text-[11px] text-[var(--text-secondary)] mt-1.5 line-clamp-2 leading-relaxed">{article.summary}</p>
            )}
            <div className="flex gap-1 flex-wrap mt-2">
              {article.tags?.slice(0, 4).map((tag: string) => (
                <span key={tag} className="text-[10px] px-1.5 py-px bg-cream-light text-[var(--text-secondary)] rounded">#{tag}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 임베드 영역 */}
      {isOpen && (
        <div className="bg-cream-light px-5 py-4 border-b border-[rgba(26,26,26,0.04)]">
          <div className="relative w-full rounded-xl overflow-hidden bg-black" style={{ paddingBottom: '56.25%' }}>
            <iframe
              className="absolute inset-0 w-full h-full"
              src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`}
              title={article.youtube_title || article.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <div className="flex items-center justify-between mt-2">
            <a href={article.youtube_url!} target="_blank" rel="noopener noreferrer"
              className="text-xs text-red-600 hover:text-red-700 font-medium">
              YouTube에서 보기 →
            </a>
            <button onClick={(e) => { e.stopPropagation(); onToggle(); }}
              className="text-[11px] font-semibold text-[var(--text-tertiary)] bg-cream-dark hover:bg-cream px-2.5 py-1 rounded-md transition-colors">
              닫기
            </button>
          </div>
        </div>
      )}
    </>
  );
}

/* ══════════════════════════════════════
   Main: TrendFeed
══════════════════════════════════════ */
export default function TrendFeed({ articles, targetJob }: { articles: Article[]; targetJob: string }) {
  const [tab, setTab] = useState<'articles' | 'videos'>('articles');
  const [articleFilter, setArticleFilter] = useState('all');
  const [videoFilter, setVideoFilter] = useState('all');
  const [openVideoId, setOpenVideoId] = useState<string | null>(null);

  // 기사 탭: 전체 표시 / 영상 탭: youtube_url 있는 것만
  const textArticles = articles;
  const videoArticles = useMemo(() => articles.filter(a => !!a.youtube_url), [articles]);

  // 기사 필터
  const filteredArticles = useMemo(() => {
    let list = textArticles;
    if (articleFilter === 'recommended') list = list.filter(a => a.isRecommended);
    else if (articleFilter === 'vibe_coding' || articleFilter === 'ai_llm')
      list = list.filter(a => matchesTagFilter(a, articleFilter));
    else if (articleFilter !== 'all') list = list.filter(a => a.source_type === articleFilter);
    return list;
  }, [textArticles, articleFilter]);

  // 영상 필터
  const filteredVideos = useMemo(() => {
    let list = videoArticles;
    if (videoFilter === 'recommended') list = list.filter(a => a.isRecommended);
    else if (['vibe_coding', 'ai_llm', 'frontend'].includes(videoFilter))
      list = list.filter(a => matchesTagFilter(a, videoFilter));
    else if (videoFilter === 'certification') list = list.filter(a => a.source_type === 'certification');
    else if (videoFilter !== 'all') list = list.filter(a => a.source_type === videoFilter);
    return list;
  }, [videoArticles, videoFilter]);

  return (
    <div className="space-y-4">
      {/* ── 탭 토글 ── */}
      <div className="flex gap-0 bg-cream-white rounded-[14px] p-1 border border-[rgba(26,26,26,0.06)] w-fit">
        <button onClick={() => setTab('articles')}
          className={`px-5 py-2 rounded-[10px] text-sm font-semibold transition-all ${
            tab === 'articles' ? 'bg-sky-deep text-white shadow-sm' : 'text-[var(--text-secondary)] hover:text-charcoal'
          }`}>
          기사
          <span className="ml-1.5 text-xs opacity-70">{textArticles.length}</span>
        </button>
        <button onClick={() => setTab('videos')}
          className={`px-5 py-2 rounded-[10px] text-sm font-semibold transition-all ${
            tab === 'videos' ? 'bg-sky-deep text-white shadow-sm' : 'text-[var(--text-secondary)] hover:text-charcoal'
          }`}>
          영상
          <span className="ml-1.5 text-xs opacity-70">{videoArticles.length}</span>
        </button>
      </div>

      {/* ══════ 기사 탭 ══════ */}
      {tab === 'articles' && (
        <>
          <FilterChips options={ARTICLE_FILTERS} active={articleFilter} onChange={setArticleFilter} />

          {articleFilter === 'recommended' && targetJob && (
            <div className="bg-sky/5 border border-sky/10 rounded-xl p-3 text-sm text-sky-deep">
              <span className="font-medium">{targetJob}</span> 직무 기준으로 관련도 높은 기사를 추천합니다.
            </div>
          )}

          {filteredArticles.length > 0 ? (
            <div className="space-y-3">
              {filteredArticles.map(article => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          ) : (
            <div className="bg-cream-white rounded-[20px] p-8 card-shadow text-center">
              <p className="text-[var(--text-tertiary)]">해당 카테고리의 기사가 없습니다.</p>
            </div>
          )}
        </>
      )}

      {/* ══════ 영상 탭 ══════ */}
      {tab === 'videos' && (
        <>
          <FilterChips options={VIDEO_FILTERS} active={videoFilter} onChange={setVideoFilter} />

          {filteredVideos.length > 0 ? (
            <div className="bg-cream-white rounded-[20px] overflow-hidden card-shadow">
              {/* 섹션 헤더 */}
              <div className="px-5 py-3.5 border-b border-[rgba(26,26,26,0.04)] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-5 bg-red-600 rounded-[5px] flex items-center justify-center">
                    <svg className="w-[10px] h-[10px] fill-white" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                  </div>
                  <span className="text-sm font-bold text-charcoal">추천 영상</span>
                </div>
                <span className="text-xs text-[var(--text-tertiary)]">{filteredVideos.length}개 영상</span>
              </div>

              {/* 리스트 */}
              <div>
                {filteredVideos.map(article => (
                  <YouTubeItem
                    key={article.id}
                    article={article}
                    isOpen={openVideoId === article.id}
                    onToggle={() => setOpenVideoId(openVideoId === article.id ? null : article.id)}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-cream-white rounded-[20px] p-8 card-shadow text-center">
              <p className="text-[var(--text-tertiary)]">해당 카테고리의 영상이 없습니다.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
