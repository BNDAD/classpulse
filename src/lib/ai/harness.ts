// src/lib/ai/harness.ts — 하네스 기법 코어 엔진
// AI에게 역할/톤/컨텍스트/규칙/금지사항을 부여하여 일관된 품질 보장

import OpenAI from 'openai';
import { z } from 'zod';
import { getModelConfig } from './model-router';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ─── 하네스 설정 인터페이스 ───

export interface HarnessConfig {
  taskType: string;                    // 모델 라우터 키
  role: string;                        // AI 역할
  tone: string;                        // 말투/톤
  context: Record<string, string>;     // 동적 컨텍스트
  rules: string[];                     // 반드시 지켜야 할 규칙
  forbidden: string[];                 // 절대 하지 말아야 할 것
  outputFormat?: string;               // 출력 형식 힌트
  examples?: { input: string; output: string }[];  // Few-shot 예시
  temperatureOverride?: number;        // 온도 오버라이드
}

// ─── 시스템 프롬프트 조립 ───

function buildSystemPrompt(config: HarnessConfig): string {
  const parts: string[] = [];

  // 역할
  parts.push(`## 역할\n${config.role}`);

  // 톤
  parts.push(`## 톤/말투\n${config.tone}`);

  // 컨텍스트
  if (Object.keys(config.context).length > 0) {
    const ctxLines = Object.entries(config.context)
      .map(([key, val]) => `- ${key}: ${val}`)
      .join('\n');
    parts.push(`## 컨텍스트\n${ctxLines}`);
  }

  // 규칙
  if (config.rules.length > 0) {
    const ruleLines = config.rules.map((r, i) => `${i + 1}. ${r}`).join('\n');
    parts.push(`## 반드시 지켜야 할 규칙\n${ruleLines}`);
  }

  // 금지사항
  if (config.forbidden.length > 0) {
    const forbidLines = config.forbidden.map((f) => `- ❌ ${f}`).join('\n');
    parts.push(`## 절대 금지\n${forbidLines}`);
  }

  // 출력 형식
  if (config.outputFormat) {
    parts.push(`## 출력 형식\n${config.outputFormat}`);
  }

  // Few-shot
  if (config.examples && config.examples.length > 0) {
    const exLines = config.examples
      .map((e) => `입력: ${e.input}\n출력: ${e.output}`)
      .join('\n---\n');
    parts.push(`## 예시\n${exLines}`);
  }

  return parts.join('\n\n');
}

// ─── 일반 호출 (비스트리밍) ───

export async function runHarness<T = string>(
  config: HarnessConfig,
  userMessage: string,
  schema?: z.ZodSchema<T>
): Promise<T> {
  const modelConfig = getModelConfig(config.taskType);
  const systemPrompt = buildSystemPrompt(config);

  const response = await openai.chat.completions.create({
    model: modelConfig.model,
    temperature: config.temperatureOverride ?? modelConfig.temperature,
    max_tokens: modelConfig.maxTokens,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
  });

  const content = response.choices[0]?.message?.content || '';

  // Zod 스키마 검증
  if (schema) {
    try {
      const parsed = JSON.parse(content);
      return schema.parse(parsed);
    } catch {
      // JSON 파싱 실패 시 재시도 (JSON만 추출)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return schema.parse(parsed);
      }
      throw new Error('AI 응답을 파싱할 수 없습니다.');
    }
  }

  return content as T;
}

// ─── 스트리밍 호출 ───

export async function runHarnessStream(
  config: HarnessConfig,
  userMessage: string
): Promise<ReadableStream> {
  const modelConfig = getModelConfig(config.taskType);
  const systemPrompt = buildSystemPrompt(config);

  const response = await openai.chat.completions.create({
    model: modelConfig.model,
    temperature: config.temperatureOverride ?? modelConfig.temperature,
    max_tokens: modelConfig.maxTokens,
    stream: true,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
  });

  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of response) {
          const text = chunk.choices[0]?.delta?.content || '';
          if (text) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
          }
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });
}

// ─── Jina Reader 텍스트 요약 (2단계 파이프라인 1단계) ───

export async function summarizeForPipeline(rawText: string, context: string): Promise<string> {
  return runHarness(
    {
      taskType: 'jina-summarize',
      role: '웹 콘텐츠 요약 전문가',
      tone: '간결하고 정보 밀도가 높게',
      context: { purpose: context },
      rules: [
        '원문의 핵심 정보만 추출하여 2000토큰 이내로 요약',
        '기업명, 기술스택, 채용 요구사항, 팀 구조 등 핵심 정보 반드시 포함',
        '불필요한 네비게이션, 광고, 푸터 텍스트는 완전히 제거',
      ],
      forbidden: ['원문 그대로 복사', '개인적 의견 추가'],
    },
    `다음 웹 페이지 콘텐츠를 핵심 정보 위주로 요약해주세요:\n\n${rawText.slice(0, 15000)}`
  );
}
