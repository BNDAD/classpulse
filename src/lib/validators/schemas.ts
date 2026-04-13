// src/lib/validators/schemas.ts — Zod 유효성 검증 스키마
import { z } from 'zod';

// ── 채용공고 분석 결과 스키마 ──
export const JobAnalysisSchema = z.object({
  companyAnalysis: z.object({
    industry: z.string(),
    size: z.string(),
    culture: z.string(),
    coreValues: z.array(z.string()),
    recentNews: z.array(z.string()).optional(),
  }),
  techStack: z.object({
    required: z.array(z.string()),
    preferred: z.array(z.string()),
    inferred: z.array(z.string()).optional(),
  }),
  matchScore: z.number().min(0).max(100),
  interviewPrep: z.object({
    technical: z.array(z.string()),
    behavioral: z.array(z.string()),
    companySpecific: z.array(z.string()).optional(),
  }),
  portfolioGuide: z.object({
    highlights: z.array(z.string()),
    improvements: z.array(z.string()),
    projectSuggestions: z.array(z.string()).optional(),
  }),
  resumeGuide: z.object({
    keyPoints: z.array(z.string()),
    storyLine: z.string(),
    coreValueConnection: z.string(),
  }),
});

// ── 피드백 결과 스키마 ──
export const FeedbackSchema = z.object({
  overall: z.string(),
  sections: z.array(
    z.object({
      title: z.string(),
      feedback: z.string(),
      suggestion: z.string().optional(),
      score: z.number().min(0).max(100).optional(),
    })
  ),
  score: z
    .object({
      overall: z.number().min(0).max(100),
      clarity: z.number().min(0).max(100),
      relevance: z.number().min(0).max(100),
      authenticity: z.number().min(0).max(100),
      impact: z.number().min(0).max(100),
    })
    .optional(),
});

// ── 감정 체크인 스키마 ──
export const EmotionCheckinSchema = z.object({
  emotion: z.enum(['FIRE', 'HAPPY', 'NEUTRAL', 'TIRED', 'EXHAUSTED']),
  week: z.number().int().positive(),
});

// ── 채용공고 URL 검증 ──
export const JobUrlSchema = z.object({
  jobUrl: z.string().url('유효한 URL을 입력해주세요'),
});

// ── 문서 피드백 요청 스키마 ──
export const FeedbackRequestSchema = z.object({
  documentId: z.string().uuid().optional(),
  title: z.string().min(1).max(200),
  content: z.string().min(50, '최소 50자 이상 작성해주세요').max(10000),
  type: z.enum(['RESUME', 'PORTFOLIO', 'COVER_LETTER']),
});

export type JobAnalysis = z.infer<typeof JobAnalysisSchema>;
export type Feedback = z.infer<typeof FeedbackSchema>;
export type EmotionCheckin = z.infer<typeof EmotionCheckinSchema>;
export type FeedbackRequest = z.infer<typeof FeedbackRequestSchema>;
