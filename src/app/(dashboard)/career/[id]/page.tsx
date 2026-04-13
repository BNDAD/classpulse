// src/app/(dashboard)/career/[id]/page.tsx — 채용공고 분석 상세 페이지
import { notFound } from 'next/navigation';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function JobAnalysisDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const serviceClient = createServiceClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) notFound();

  const { data: analysis } = await serviceClient
    .from('job_analyses')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!analysis) notFound();

  const company = analysis.company_analysis as any;
  const tech = analysis.tech_stack as any;
  const interview = analysis.interview_prep as any;
  const portfolio = analysis.portfolio_guide as any;
  const resume = analysis.resume_guide as any;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/career"
          className="p-2 rounded-lg hover:bg-cream-dark transition-colors"
        >
          <svg className="w-5 h-5 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-charcoal">{analysis.company_name}</h1>
          <a
            href={analysis.job_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-sky-deep hover:underline"
          >
            원본 채용공고 보기 →
          </a>
        </div>
        <div className="text-center">
          <div className="text-3xl font-extrabold text-sky-deep">{analysis.match_score}%</div>
          <div className="text-xs text-[var(--text-tertiary)]">매칭률</div>
        </div>
      </div>

      {/* Company Analysis */}
      <section className="bg-cream-white rounded-[20px] p-6 card-shadow">
        <h2 className="font-bold text-lg text-charcoal mb-4 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
          </svg>
          기업 분석
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          <InfoCard label="업종" value={company?.industry} />
          <InfoCard label="규모" value={company?.size} />
          <InfoCard label="문화" value={company?.culture} />
          <div>
            <span className="text-xs text-[var(--text-tertiary)] block mb-2">핵심 가치</span>
            <div className="flex flex-wrap gap-2">
              {company?.coreValues?.map((v: string, i: number) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-sky/5 text-sky-deep text-sm rounded-full"
                >
                  {v}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="bg-cream-white rounded-[20px] p-6 card-shadow">
        <h2 className="font-bold text-lg text-charcoal mb-4 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25A2.25 2.25 0 015.25 3h13.5A2.25 2.25 0 0121 5.25z" />
          </svg>
          기술 스택 분석
        </h2>
        <div className="space-y-4">
          <TechRow label="필수" items={tech?.required} color="bg-red-50 text-red-700" />
          <TechRow label="우대" items={tech?.preferred} color="bg-earth/5 text-earth" />
          <TechRow label="추론 (기술블로그 기반)" items={tech?.inferred} color="bg-blue-50 text-blue-700" />
        </div>
      </section>

      {/* Interview Prep */}
      <section className="bg-cream-white rounded-[20px] p-6 card-shadow">
        <h2 className="font-bold text-lg text-charcoal mb-4 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
          </svg>
          면접 예상 질문
        </h2>
        <div className="space-y-6">
          <QuestionList title="기술 질문" questions={interview?.technical} />
          <QuestionList title="인성 질문" questions={interview?.behavioral} />
          <QuestionList title="기업 특화 질문" questions={interview?.companySpecific} />
        </div>
      </section>

      {/* Portfolio Guide */}
      <section className="bg-cream-white rounded-[20px] p-6 card-shadow">
        <h2 className="font-bold text-lg text-charcoal mb-4 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
          </svg>
          포트폴리오 가이드
        </h2>
        <div className="space-y-4">
          <ListSection title="어필 포인트" items={portfolio?.highlights} iconType="check" />
          <ListSection title="보완 필요" items={portfolio?.improvements} iconType="warning" />
          <ListSection title="프로젝트 제안" items={portfolio?.projectSuggestions} iconType="lightbulb" />
        </div>
      </section>

      {/* Resume Guide */}
      <section className="bg-cream-white rounded-[20px] p-6 card-shadow">
        <h2 className="font-bold text-lg text-charcoal mb-4 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
          </svg>
          자소서 가이드
        </h2>
        <div className="space-y-4">
          {resume?.storyLine && (
            <div className="p-4 bg-sky/5 rounded-xl">
              <span className="text-xs text-sky-deep font-semibold">추천 스토리라인</span>
              <p className="text-charcoal mt-1">{resume.storyLine}</p>
            </div>
          )}
          {resume?.coreValueConnection && (
            <div className="p-4 bg-earth/5 rounded-xl">
              <span className="text-xs text-earth font-semibold">핵심가치 연결</span>
              <p className="text-charcoal mt-1">{resume.coreValueConnection}</p>
            </div>
          )}
          <ListSection title="핵심 포인트" items={resume?.keyPoints} iconType="target" />
        </div>
      </section>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <span className="text-xs text-[var(--text-tertiary)]">{label}</span>
      <p className="text-charcoal font-medium mt-1">{value || '-'}</p>
    </div>
  );
}

function TechRow({ label, items, color }: { label: string; items?: string[]; color: string }) {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <span className="text-xs text-[var(--text-tertiary)] block mb-2">{label}</span>
      <div className="flex flex-wrap gap-2">
        {items.map((item, i) => (
          <span key={i} className={`px-3 py-1 text-sm rounded-full font-medium ${color}`}>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function QuestionList({ title, questions }: { title: string; questions?: string[] }) {
  if (!questions || questions.length === 0) return null;
  return (
    <div>
      <h3 className="font-semibold text-charcoal mb-2">
        {title}
      </h3>
      <ol className="space-y-2">
        {questions.map((q, i) => (
          <li key={i} className="flex gap-3 text-sm">
            <span className="text-[var(--text-tertiary)] font-mono text-xs mt-0.5">{String(i + 1).padStart(2, '0')}</span>
            <span className="text-charcoal">{q}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function ListSection({ title, items, iconType }: { title: string; items?: string[]; iconType?: string }) {
  if (!items || items.length === 0) return null;

  const iconSvg = {
    check: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    warning: 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z',
    lightbulb: 'M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18',
    target: 'M15 10.5a3 3 0 11-6 0 3 3 0 016 0z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z',
  };

  return (
    <div>
      <h3 className="font-semibold text-charcoal mb-2">{title}</h3>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2 text-sm text-charcoal">
            {iconType && (
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d={iconSvg[iconType as keyof typeof iconSvg]} />
              </svg>
            )}
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
