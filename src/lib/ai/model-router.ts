// src/lib/ai/model-router.ts — 2-Tier AI 모델 라우터
// GPT-4o-mini (90% 호출) vs GPT-4o (10% 심층 분석)

export type AITier = 'TIER_1' | 'TIER_2';

export interface ModelConfig {
  model: string;
  maxTokens: number;
  temperature: number;
}

// 작업별 Tier 매핑
const TASK_TIER_MAP: Record<string, AITier> = {
  // Tier 1: GPT-4o-mini (저비용, 90% 담당)
  'emotion-response': 'TIER_1',
  'cert-reminder': 'TIER_1',
  'trend-summary': 'TIER_1',
  'streak-message': 'TIER_1',
  'notification': 'TIER_1',
  'jina-summarize': 'TIER_1',         // Jina Reader 텍스트 요약 (2단계 파이프라인 1단계)
  'bridge-lesson': 'TIER_1',
  'company-info-extract': 'TIER_1',   // 채용공고에서 기업명/URL 추출

  // Tier 2: GPT-4o (고품질, 10% 담당)
  'job-deep-analysis': 'TIER_2',      // 채용공고 심층 분석
  'resume-feedback': 'TIER_2',        // 자소서 심층 피드백
  'portfolio-feedback': 'TIER_2',     // 포트폴리오 심층 피드백
  'career-roadmap': 'TIER_2',         // 커리어 로드맵 생성
};

const TIER_CONFIG: Record<AITier, ModelConfig> = {
  TIER_1: {
    model: 'gpt-4o-mini',
    maxTokens: 2000,
    temperature: 0.7,
  },
  TIER_2: {
    model: 'gpt-4o',
    maxTokens: 8000,
    temperature: 0.7,
  },
};

export function getModelConfig(taskType: string): ModelConfig {
  const tier = TASK_TIER_MAP[taskType] || 'TIER_1';
  return { ...TIER_CONFIG[tier] };
}

export function getTier(taskType: string): AITier {
  return TASK_TIER_MAP[taskType] || 'TIER_1';
}

// 비용 추정 (USD, 1K 토큰 기준)
export const COST_PER_1K: Record<AITier, { input: number; output: number }> = {
  TIER_1: { input: 0.00015, output: 0.0006 },   // GPT-4o-mini
  TIER_2: { input: 0.0025, output: 0.01 },       // GPT-4o
};
