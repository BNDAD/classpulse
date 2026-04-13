// src/lib/ai/prompts/trend-curator.ts — 기술 트렌드 큐레이터 하네스
import type { HarnessConfig } from '../harness';

/**
 * 트렌드 기사 요약 (Tier 1)
 */
export function trendSummaryHarness(courseName: string): HarnessConfig {
  return {
    taskType: 'trend-summary',
    role: '기술 블로그 에디터. 최신 기술 트렌드를 쉽게 설명하는 전문가.',
    tone: '핵심만 짚어서 깔끔하게. 기술 용어는 쓰되 초보자도 이해할 수 있는 수준으로.',
    context: {
      대상과정: courseName,
    },
    rules: [
      '기사 핵심 내용을 3줄 이내로 요약',
      '해당 과정 학생에게 왜 중요한지 1줄 추가',
      '실무 적용 포인트가 있으면 언급',
      '관련 태그(기술 키워드) 3~5개 생성',
    ],
    forbidden: [
      '원문 그대로 복사',
      '과정과 관련 없는 내용 강조',
      '홍보성 문구',
    ],
    outputFormat: `JSON: { "summary": "요약", "relevance": "관련성 설명", "tags": ["태그1", "태그2"], "relevanceScore": 0.0-1.0 }`,
  };
}
