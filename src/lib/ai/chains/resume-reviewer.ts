// src/lib/ai/chains/resume-reviewer.ts — 자소서 리뷰 체인
import { runHarness } from '../harness';
import { resumeFeedbackHarness } from '../prompts/document-coach';
import type { Feedback } from '@/lib/validators/schemas';

export interface ReviewInput {
  content: string;
  title: string;
  targetCompany: string;
  targetJob: string;
  studentProfile: string;
}

export async function reviewResume(input: ReviewInput): Promise<Feedback | null> {
  try {
    const harness = resumeFeedbackHarness(
      input.targetCompany,
      input.targetJob,
      input.studentProfile
    );

    const result = await runHarness(
      harness,
      `자기소개서 리뷰 요청:\n\n제목: ${input.title}\n\n${input.content}`
    );

    const parsed = JSON.parse(typeof result === 'string' ? result : JSON.stringify(result));
    return parsed;
  } catch (error) {
    console.error('자소서 리뷰 실패:', error);
    return null;
  }
}
