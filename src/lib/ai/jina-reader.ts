// src/lib/ai/jina-reader.ts — Jina Reader API 연동
// URL → 마크다운 텍스트 변환 (합법적 웹 콘텐츠 추출)
// 무료: 분당 200회, 1천만 토큰

const JINA_BASE = 'https://r.jina.ai/';

export interface JinaResult {
  success: boolean;
  content: string;
  error?: string;
}

/**
 * Jina Reader API로 URL에서 마크다운 텍스트 추출
 */
export async function extractWebContent(url: string): Promise<JinaResult> {
  try {
    const response = await fetch(`${JINA_BASE}${encodeURIComponent(url)}`, {
      headers: {
        Accept: 'text/markdown',
        'X-Return-Format': 'markdown',
        ...(process.env.JINA_API_KEY
          ? { Authorization: `Bearer ${process.env.JINA_API_KEY}` }
          : {}),
      },
      signal: AbortSignal.timeout(15000), // 15초 타임아웃
    });

    if (!response.ok) {
      return {
        success: false,
        content: '',
        error: `페이지 추출 실패 (${response.status})`,
      };
    }

    const text = await response.text();

    // 빈 콘텐츠 체크
    if (!text || text.trim().length < 50) {
      return {
        success: false,
        content: '',
        error: '페이지에서 유의미한 콘텐츠를 추출하지 못했습니다.',
      };
    }

    return { success: true, content: text };
  } catch (error: any) {
    return {
      success: false,
      content: '',
      error:
        error.name === 'AbortError'
          ? '페이지 추출 시간이 초과되었습니다.'
          : `페이지 추출 중 오류: ${error.message}`,
    };
  }
}

/**
 * 여러 URL을 병렬로 추출 (실패해도 나머지는 계속 진행)
 */
export async function extractMultipleUrls(
  urls: { url: string; label: string }[]
): Promise<Record<string, JinaResult>> {
  const results: Record<string, JinaResult> = {};

  const promises = urls.map(async ({ url, label }) => {
    const result = await extractWebContent(url);
    results[label] = result;
  });

  await Promise.allSettled(promises);
  return results;
}
