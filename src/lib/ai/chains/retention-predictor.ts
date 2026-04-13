// src/lib/ai/chains/retention-predictor.ts — 이탈 위험도 계산 알고리즘
// 순수 로직 기반 (AI 호출 없음 — 비용 0)

interface PulseInput {
  attendance: boolean;
  assignmentDone: boolean;
  questionsCount: number;
  emotionScore: number | null;  // 1-5
  streakCount: number;
  daysSinceLastAttendance: number;
  weekNumber: number;
  courseDifficultyAtWeek: number;  // 1-10
}

export interface RiskResult {
  score: number;        // 0-100
  level: 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED';
  factors: string[];    // 위험 요인 목록
}

/**
 * 이탈 위험도 점수 계산
 * 0-25: GREEN (안전)
 * 26-50: YELLOW (관심 필요)
 * 51-75: ORANGE (위험)
 * 76-100: RED (긴급)
 */
export function calculateRiskScore(input: PulseInput): RiskResult {
  let score = 0;
  const factors: string[] = [];

  // 1. 출석 (최대 25점)
  if (!input.attendance) {
    score += 15;
    factors.push('미출석');
  }
  if (input.daysSinceLastAttendance >= 3) {
    score += 10;
    factors.push(`${input.daysSinceLastAttendance}일 연속 미출석`);
  }

  // 2. 과제 (최대 20점)
  if (!input.assignmentDone) {
    score += 15;
    factors.push('과제 미제출');
  }

  // 3. 질문 빈도 (최대 15점)
  if (input.questionsCount === 0) {
    score += 10;
    factors.push('질문 없음 (참여 저하 신호)');
  }

  // 4. 감정 점수 (최대 20점)
  if (input.emotionScore !== null) {
    if (input.emotionScore <= 2) {
      score += 20;
      factors.push('감정 점수 매우 낮음');
    } else if (input.emotionScore <= 3) {
      score += 10;
      factors.push('감정 점수 보통 이하');
    }
  }

  // 5. 스트릭 붕괴 (최대 10점)
  if (input.streakCount === 0) {
    score += 10;
    factors.push('스트릭 초기화');
  }

  // 6. 난이도 가중치 (최대 10점)
  // 난이도 높은 주차에 위험 신호가 있으면 가중
  if (input.courseDifficultyAtWeek >= 8 && score >= 30) {
    score += 10;
    factors.push('고난이도 구간 + 복합 위험');
  }

  // 점수 상한
  score = Math.min(score, 100);

  // 레벨 판정
  let level: RiskResult['level'];
  if (score <= 25) level = 'GREEN';
  else if (score <= 50) level = 'YELLOW';
  else if (score <= 75) level = 'ORANGE';
  else level = 'RED';

  return { score, level, factors };
}

/**
 * 7일 이동평균 위험도
 */
export function calculateWeeklyRisk(dailyScores: number[]): number {
  if (dailyScores.length === 0) return 0;
  const sum = dailyScores.reduce((a, b) => a + b, 0);
  return Math.round(sum / dailyScores.length);
}
