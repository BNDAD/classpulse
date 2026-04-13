// src/lib/ai/chains/job-analyzer.ts — 채용공고 분석 파이프라인 체인
import { extractWebContent, extractMultipleUrls } from '../jina-reader';
import { runHarness, summarizeForPipeline } from '../harness';
import { companyInfoExtractHarness, jobDeepAnalysisHarness } from '../prompts/career-coach';

export interface AnalyzeJobInput {
  jobUrl: string;
  studentProfile: {
    name: string;
    targetJob?: string;
    targetCompany?: string;
    projects?: any[];
    interests?: string[];
    targetCerts?: string[];
    courseName?: string;
    courseTechStack?: string[];
  };
}

export interface AnalyzeJobOutput {
  success: boolean;
  companyName: string;
  matchScore: number;
  analysis: any;
  error?: string;
}

/**
 * 채용공고 분석 전체 파이프라인
 * Jina Reader → GPT-4o-mini 요약 → GPT-4o 심층 분석
 */
export async function analyzeJobPipeline(input: AnalyzeJobInput): Promise<AnalyzeJobOutput> {
  // 1. Jina Reader로 채용공고 추출
  const jobResult = await extractWebContent(input.jobUrl);
  if (!jobResult.success) {
    return {
      success: false,
      companyName: '',
      matchScore: 0,
      analysis: null,
      error: jobResult.error,
    };
  }

  // 2. 기업 정보 추출 (Tier 1)
  const companyInfoRaw = await runHarness(
    companyInfoExtractHarness(),
    `채용공고에서 기업 정보 추출:\n\n${jobResult.content.slice(0, 5000)}`
  );

  let companyInfo: any;
  try {
    companyInfo = JSON.parse(typeof companyInfoRaw === 'string' ? companyInfoRaw : '{}');
  } catch {
    companyInfo = { companyName: '알 수 없음' };
  }

  // 3. 추가 URL 추출 & 요약
  const urls = [
    companyInfo.homepageUrl && { url: companyInfo.homepageUrl, label: 'homepage' },
    companyInfo.techBlogUrl && { url: companyInfo.techBlogUrl, label: 'techBlog' },
  ].filter(Boolean) as { url: string; label: string }[];

  const extraContents = await extractMultipleUrls(urls);

  // 4. 모든 콘텐츠 요약 (Tier 1 — 토큰 절감)
  const summaries: Record<string, string> = {};
  const tasks = Object.entries(extraContents).map(async ([label, result]) => {
    if (result.success) {
      summaries[label] = await summarizeForPipeline(result.content, `${label} 요약`);
    }
  });
  tasks.push(
    summarizeForPipeline(jobResult.content, '채용공고 요약').then((s) => {
      summaries['job'] = s;
    })
  );
  await Promise.allSettled(tasks);

  // 5. 심층 분석 (Tier 2)
  const profileStr = JSON.stringify(input.studentProfile);
  const analysisRaw = await runHarness(
    jobDeepAnalysisHarness(profileStr, input.studentProfile.courseName || ''),
    `## 채용공고\n${summaries['job'] || jobResult.content.slice(0, 3000)}\n\n## 홈페이지\n${summaries['homepage'] || '(없음)'}\n\n## 기술블로그\n${summaries['techBlog'] || '(없음)'}\n\n## 학생 프로필\n${profileStr}`
  );

  let analysis: any;
  try {
    analysis = JSON.parse(typeof analysisRaw === 'string' ? analysisRaw : '{}');
  } catch {
    analysis = {};
  }

  return {
    success: true,
    companyName: companyInfo.companyName || '알 수 없음',
    matchScore: analysis.matchScore || 0,
    analysis,
  };
}
