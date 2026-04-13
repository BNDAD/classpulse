// src/app/api/ai/feedback/route.ts — AI 문서 코치 피드백 API (일반 + 타겟)
import { NextRequest } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { runHarness } from '@/lib/ai/harness';
import {
  resumeFeedbackHarness,
  portfolioFeedbackHarness,
  targetedFeedbackHarness,
} from '@/lib/ai/prompts/document-coach';

export const runtime = 'nodejs';
export const maxDuration = 60;

// AI 응답에서 JSON 안전 파싱 (마크다운 코드블록 처리)
function safeJsonParse(text: string): any {
  try { return JSON.parse(text); } catch {}
  const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (codeBlockMatch) {
    try { return JSON.parse(codeBlockMatch[1].trim()); } catch {}
  }
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try { return JSON.parse(jsonMatch[0]); } catch {}
  }
  throw new Error('JSON 파싱 불가');
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const { documentId, content, type, title, jobAnalysisId } = await request.json();

    if (!content || content.trim().length < 50) {
      return Response.json(
        { error: '최소 50자 이상의 내용을 입력해주세요.' },
        { status: 400 }
      );
    }

    const serviceClient = createServiceClient();

    // 학생 프로필
    const { data: profile } = await serviceClient
      .from('user_profiles')
      .select('*, courses(*)')
      .eq('user_id', user.id)
      .single();

    const studentProfileStr = JSON.stringify({
      name: profile?.name,
      targetJob: profile?.target_job,
      targetCompany: profile?.target_company,
      projects: profile?.projects,
      courseName: (profile?.courses as any)?.name,
    });

    let harness;
    let targetCompany = '';
    let targetPosition = '';

    // 채용공고 타겟팅 모드
    if (jobAnalysisId) {
      const { data: jobAnalysis } = await serviceClient
        .from('job_analyses')
        .select('*')
        .eq('id', jobAnalysisId)
        .single();

      if (!jobAnalysis) {
        return Response.json({ error: '채용공고 분석 결과를 찾을 수 없습니다.' }, { status: 404 });
      }

      targetCompany = jobAnalysis.company_name;
      targetPosition = (jobAnalysis.tech_stack as any)?.position || profile?.target_job || '';

      harness = targetedFeedbackHarness(
        jobAnalysis.company_name,
        JSON.stringify(jobAnalysis.company_analysis),
        JSON.stringify(jobAnalysis.tech_stack),
        JSON.stringify(jobAnalysis.resume_guide),
        JSON.stringify(jobAnalysis.portfolio_guide),
        type === 'PORTFOLIO' ? 'PORTFOLIO' : 'RESUME',
        studentProfileStr
      );
    } else {
      // 일반 피드백 모드
      harness = type === 'PORTFOLIO'
        ? portfolioFeedbackHarness(profile?.target_job || '', studentProfileStr)
        : resumeFeedbackHarness(
            profile?.target_company || '',
            profile?.target_job || '',
            studentProfileStr
          );
    }

    // AI 피드백 생성
    const feedback = await runHarness(
      harness,
      `다음 ${type === 'PORTFOLIO' ? '포트폴리오' : '자기소개서'}를 리뷰해주세요:\n\n제목: ${title}\n\n${content}`
    );

    let parsedFeedback: any;
    try {
      const feedbackStr = typeof feedback === 'string' ? feedback : JSON.stringify(feedback);
      parsedFeedback = safeJsonParse(feedbackStr);
    } catch (e) {
      console.error('❌ 피드백 파싱 실패:', e);
      parsedFeedback = {
        overall: typeof feedback === 'string' ? feedback : 'AI 피드백 생성 완료',
        sections: [],
        score: { overall: 0, clarity: 0, relevance: 0, authenticity: 0, impact: 0 },
      };
    }

    // 문서 저장/업데이트
    let docId = documentId;
    if (!docId) {
      const { data: newDoc } = await supabase
        .from('documents')
        .insert({
          user_id: user.id,
          type: type || 'RESUME',
          title: title || '제목 없음',
          content,
          status: 'AI_DRAFT',
          version: 1,
          job_analysis_id: jobAnalysisId || null,
          target_company: targetCompany || null,
          target_position: targetPosition || null,
        })
        .select()
        .single();
      docId = newDoc?.id;
    }

    // 피드백 저장
    if (docId) {
      await supabase.from('feedbacks').insert({
        document_id: docId,
        reviewer_type: 'AI',
        content: parsedFeedback,
        score: parsedFeedback.score || null,
        status: 'COMPLETED',
      });

      await supabase
        .from('documents')
        .update({ status: 'COMPLETED' })
        .eq('id', docId);
    }

    return Response.json({
      success: true,
      documentId: docId,
      feedback: parsedFeedback,
      isTargeted: !!jobAnalysisId,
      targetCompany,
    });
  } catch (error: any) {
    console.error('피드백 생성 오류:', error);
    return Response.json(
      { error: '피드백 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
