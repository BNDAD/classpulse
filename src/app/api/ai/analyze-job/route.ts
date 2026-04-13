// src/app/api/ai/analyze-job/route.ts — 채용공고 딥 애널라이저 API
// 2단계 파이프라인: Jina Reader → GPT-4o-mini 요약 → GPT-4o 심층 분석
import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { extractWebContent, extractMultipleUrls } from '@/lib/ai/jina-reader';
import { runHarness, summarizeForPipeline } from '@/lib/ai/harness';
import { companyInfoExtractHarness, jobDeepAnalysisHarness } from '@/lib/ai/prompts/career-coach';

export const runtime = 'nodejs';
export const maxDuration = 60; // Vercel Pro: 60초

// AI 응답에서 JSON 안전 파싱 (마크다운 코드블록 처리)
function safeJsonParse(text: string): any {
  // 1차: 그대로 파싱
  try { return JSON.parse(text); } catch {}

  // 2차: 마크다운 코드블록 제거 (```json ... ``` 또는 ``` ... ```)
  const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (codeBlockMatch) {
    try { return JSON.parse(codeBlockMatch[1].trim()); } catch {}
  }

  // 3차: 첫 번째 { ... } 블록 추출
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try { return JSON.parse(jsonMatch[0]); } catch {}
  }

  throw new Error('JSON 파싱 불가: ' + text.slice(0, 200));
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const { jobUrl } = await request.json();

    if (!jobUrl || !jobUrl.startsWith('http')) {
      return NextResponse.json({ error: '유효한 URL을 입력해주세요.' }, { status: 400 });
    }

    // 1. 학생 프로필 조회 (서비스 클라이언트로 RLS 우회)
    const serviceClient = createServiceClient();
    const { data: profile, error: profileError } = await serviceClient
      .from('user_profiles')
      .select('*, courses(*)')
      .eq('user_id', user.id)
      .single();

    if (!profile) {
      console.error('프로필 조회 실패:', profileError);
      return NextResponse.json({ error: '프로필을 먼저 등록해주세요.' }, { status: 400 });
    }

    // 2. Jina Reader로 채용공고 추출
    const jobResult = await extractWebContent(jobUrl);
    if (!jobResult.success) {
      return NextResponse.json(
        { error: jobResult.error, fallback: true },
        { status: 422 }
      );
    }

    // 3. GPT-4o-mini로 기업명/URL 추출 (Tier 1)
    const companyInfo = await runHarness(
      companyInfoExtractHarness(),
      `다음 채용공고에서 기업 정보를 추출해주세요:\n\n${jobResult.content.slice(0, 5000)}`
    );

    let parsedCompany: any;
    try {
      const companyStr = typeof companyInfo === 'string' ? companyInfo : JSON.stringify(companyInfo);
      parsedCompany = safeJsonParse(companyStr);
    } catch (e) {
      console.error('🏢 기업정보 파싱 실패:', e);
      parsedCompany = { companyName: '알 수 없음', homepageUrl: null, techBlogUrl: null };
    }

    // 4. 기업 홈페이지 + 기술블로그 병렬 추출 & 요약 (2단계 파이프라인)
    const urlsToFetch = [
      parsedCompany.homepageUrl && { url: parsedCompany.homepageUrl, label: 'homepage' },
      parsedCompany.techBlogUrl && { url: parsedCompany.techBlogUrl, label: 'techBlog' },
      parsedCompany.careersUrl && { url: parsedCompany.careersUrl, label: 'careers' },
    ].filter(Boolean) as { url: string; label: string }[];

    const extraContents = await extractMultipleUrls(urlsToFetch);

    // 5. 각 콘텐츠를 GPT-4o-mini로 요약 (Tier 1 — 토큰 절감)
    const summaries: Record<string, string> = {};

    const summarizePromises = Object.entries(extraContents).map(async ([label, result]) => {
      if (result.success && result.content) {
        summaries[label] = await summarizeForPipeline(
          result.content,
          `채용공고 분석을 위한 ${label} 페이지 요약`
        );
      }
    });

    // 채용공고 자체도 요약
    const jobSummaryPromise = summarizeForPipeline(
      jobResult.content,
      '채용공고 핵심 정보 요약'
    ).then((s) => { summaries['jobPosting'] = s; });

    await Promise.allSettled([...summarizePromises, jobSummaryPromise]);

    // 6. GPT-4o로 심층 분석 (Tier 2)
    const studentProfileStr = JSON.stringify({
      name: profile.name,
      targetJob: profile.target_job,
      targetCompany: profile.target_company,
      projects: profile.projects,
      interests: profile.interests,
      targetCerts: profile.target_certs,
      courseTechStack: (profile.courses as any)?.tech_stack || [],
    });

    const analysisInput = `
## 채용공고
${summaries['jobPosting'] || jobResult.content.slice(0, 3000)}

## 기업 홈페이지
${summaries['homepage'] || '(추출 실패)'}

## 기술 블로그
${summaries['techBlog'] || '(정보 없음)'}

## 채용 페이지
${summaries['careers'] || '(정보 없음)'}

## 학생 프로필
${studentProfileStr}
`.trim();

    const analysis = await runHarness(
      jobDeepAnalysisHarness(studentProfileStr, (profile.courses as any)?.name || ''),
      analysisInput
    );

    let parsedAnalysis: any;
    try {
      const analysisStr = typeof analysis === 'string' ? analysis : JSON.stringify(analysis);
      parsedAnalysis = safeJsonParse(analysisStr);
    } catch (e) {
      console.error('❌ 심층분석 파싱 실패:', e);
      parsedAnalysis = { error: 'AI 분석 결과 파싱 실패' };
    }

    // 7. DB 저장
    const { data: saved, error: saveError } = await supabase
      .from('job_analyses')
      .insert({
        user_id: user.id,
        company_name: parsedCompany.companyName || '알 수 없음',
        job_url: jobUrl,
        company_analysis: parsedAnalysis.companyAnalysis || {},
        tech_stack: parsedAnalysis.techStack || {},
        interview_prep: parsedAnalysis.interviewPrep || {},
        portfolio_guide: parsedAnalysis.portfolioGuide || {},
        resume_guide: parsedAnalysis.resumeGuide || {},
        match_score: parsedAnalysis.matchScore || 0,
      })
      .select()
      .single();

    if (saveError) {
      console.error('분석 결과 저장 실패:', saveError);
    }

    return NextResponse.json({
      success: true,
      data: saved || parsedAnalysis,
      companyName: parsedCompany.companyName,
      matchScore: parsedAnalysis.matchScore,
    });
  } catch (error: any) {
    console.error('채용공고 분석 오류:', error);
    return NextResponse.json(
      { error: '분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' },
      { status: 500 }
    );
  }
}
