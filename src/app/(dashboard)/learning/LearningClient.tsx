// src/app/(dashboard)/learning/LearningClient.tsx — 학습 현황 클라이언트
'use client';

import { useState } from 'react';

const EMOTIONS: { value: string; emoji: string; label: string }[] = [
  { value: 'FIRE', emoji: 'fire', label: '불타오름' },
  { value: 'HAPPY', emoji: 'happy', label: '좋아요' },
  { value: 'NEUTRAL', emoji: 'neutral', label: '보통' },
  { value: 'TIRED', emoji: 'tired', label: '힘들어요' },
  { value: 'EXHAUSTED', emoji: 'exhausted', label: '지쳤어요' },
];

const EMOTION_ICONS: Record<string, string> = {
  fire: 'M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1.001A3.75 3.75 0 0012 18z',
  happy: 'M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c.008-.004.015-.008.023-.008s.015.004.023.008M14.25 9.75c.008-.004.015-.008.023-.008s.015.004.023.008',
  neutral: 'M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c.008-.004.015-.008.023-.008s.015.004.023.008M14.25 9.75c.008-.004.015-.008.023-.008s.015.004.023.008M9 15h6',
  tired: 'M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c.008-.004.015-.008.023-.008s.015.004.023.008M14.25 9.75c.008-.004.015-.008.023-.008s.015.004.023.008M15.75 15.75a3.75 3.75 0 00-7.5 0',
  exhausted: 'M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c.008-.004.015-.008.023-.008s.015.004.023.008M14.25 9.75c.008-.004.015-.008.023-.008s.015.004.023.008M15.75 15.75a3.75 3.75 0 00-7.5 0',
};

interface Props {
  initialStreak: any;
  initialPulse: any[];
  initialCheckins: any[];
}

export default function LearningClient({ initialStreak, initialPulse, initialCheckins }: Props) {
  const [streak] = useState<any>(initialStreak);
  const [pulseData] = useState<any[]>(initialPulse);
  const [checkins, setCheckins] = useState<any[]>(initialCheckins);
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [emotionLoading, setEmotionLoading] = useState(false);
  const [bridgeTopic, setBridgeTopic] = useState('');
  const [bridgeContent, setBridgeContent] = useState<string | null>(null);
  const [bridgeLoading, setBridgeLoading] = useState(false);

  async function handleEmotionCheckin(emotion: string) {
    setSelectedEmotion(emotion);
    setEmotionLoading(true);
    setAiResponse(null);

    try {
      const res = await fetch('/api/ai/bridge-lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'emotion-checkin', emotion, week: 8 }),
      });
      const data = await res.json();
      if (data.success) {
        setAiResponse(data.response);
      }
    } catch {
      setAiResponse('응답을 가져오지 못했습니다.');
    } finally {
      setEmotionLoading(false);
    }
  }

  async function handleBridgeLesson() {
    if (!bridgeTopic.trim()) return;
    setBridgeLoading(true);
    setBridgeContent(null);

    try {
      const res = await fetch('/api/ai/bridge-lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'bridge-lesson', topic: bridgeTopic }),
      });
      const data = await res.json();
      if (data.success) {
        setBridgeContent(data.content);
      }
    } catch {
      setBridgeContent('레슨을 가져오지 못했습니다.');
    } finally {
      setBridgeLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-charcoal flex items-center gap-2">
          <svg className="w-7 h-7 text-sky" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
          </svg>
          학습 현황
        </h1>
        <p className="text-[var(--text-secondary)] mt-1">나의 학습 여정을 한눈에</p>
      </div>

      {/* Streak + Emotion Row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Streak */}
        <div className="bg-cream-white rounded-[20px] p-6 card-shadow">
          <h2 className="font-bold text-charcoal mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-earth" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1.001A3.75 3.75 0 0012 18z" />
            </svg>
            학습 스트릭
          </h2>
          <div className="text-center mb-6">
            <div className="text-6xl font-extrabold text-earth">
              {streak?.current_streak || 0}
            </div>
            <p className="text-[var(--text-secondary)] mt-1">연속 학습일</p>
          </div>

          {/* Streak Calendar (GitHub Grass Style) */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 28 }).map((_, i) => {
              const date = new Date();
              date.setDate(date.getDate() - (27 - i));
              const dateStr = date.toISOString().split('T')[0];
              const pulse = pulseData.find((p) => p.date === dateStr);
              const level = pulse
                ? pulse.attendance && pulse.assignment_done
                  ? 3
                  : pulse.attendance
                  ? 2
                  : 1
                : 0;

              return (
                <div
                  key={i}
                  className={`streak-cell streak-${level}`}
                  title={`${dateStr}: ${level === 3 ? '완벽' : level === 2 ? '출석' : level === 1 ? '부분' : '미참여'}`}
                />
              );
            })}
          </div>
          <div className="flex justify-end gap-2 mt-2 text-[10px] text-[var(--text-tertiary)]">
            <span className="flex items-center gap-1">
              <div className="streak-cell streak-0 w-3 h-3" /> 미참여
            </span>
            <span className="flex items-center gap-1">
              <div className="streak-cell streak-2 w-3 h-3" /> 출석
            </span>
            <span className="flex items-center gap-1">
              <div className="streak-cell streak-3 w-3 h-3" /> 완벽
            </span>
          </div>
          <div className="text-center text-xs text-[var(--text-tertiary)] mt-4">
            최장 기록: <span className="font-semibold text-[var(--text-secondary)]">{streak?.longest_streak || 0}일</span>
          </div>
        </div>

        {/* Emotion Check-in */}
        <div className="bg-cream-white rounded-[20px] p-6 card-shadow">
          <h2 className="font-bold text-charcoal mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-sky" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
            감정 체크인
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mb-4">오늘 기분이 어떠세요?</p>

          <div className="flex justify-center gap-3 mb-6">
            {EMOTIONS.map((e) => {
              const emotionColors: Record<string, { bg: string; text: string }> = {
                fire: { bg: 'bg-red-100', text: 'text-red-600' },
                happy: { bg: 'bg-green-100', text: 'text-green-600' },
                neutral: { bg: 'bg-gray-100', text: 'text-gray-600' },
                tired: { bg: 'bg-yellow-100', text: 'text-yellow-600' },
                exhausted: { bg: 'bg-orange-100', text: 'text-orange-600' },
              };
              const colors = emotionColors[e.emoji] || { bg: 'bg-gray-100', text: 'text-gray-600' };
              const iconPath = EMOTION_ICONS[e.emoji];
              return (
                <button
                  key={e.value}
                  onClick={() => handleEmotionCheckin(e.value)}
                  disabled={emotionLoading}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${
                    selectedEmotion === e.value
                      ? 'bg-sky/5 ring-2 ring-sky/30 scale-110'
                      : 'hover:bg-cream-light'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${colors.bg}`}>
                    <svg className={`w-5 h-5 ${colors.text}`} fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d={iconPath} />
                    </svg>
                  </div>
                  <span className="text-[10px] text-[var(--text-secondary)]">{e.label}</span>
                </button>
              );
            })}
          </div>

          {emotionLoading && (
            <div className="flex items-center justify-center gap-2 text-sm text-[var(--text-secondary)]">
              <div className="w-4 h-4 border-2 border-sky/30 border-t-sky rounded-full animate-spin" />
              AI가 응답하고 있어요...
            </div>
          )}

          {aiResponse && (
            <div className="p-4 bg-sky/5 rounded-xl">
              <p className="text-sm text-charcoal leading-relaxed">{aiResponse}</p>
            </div>
          )}

          {/* Recent Check-ins */}
          {checkins.length > 0 && (
            <div className="mt-6 pt-4 border-t border-[rgba(26,26,26,0.04)]">
              <p className="text-xs text-[var(--text-tertiary)] mb-2">최근 체크인</p>
              <div className="space-y-2">
                {checkins.slice(0, 3).map((c: any) => {
                  const emotion = EMOTIONS.find((e) => e.value === c.emotion);
                  const emotionColors: Record<string, { bg: string; text: string }> = {
                    fire: { bg: 'bg-red-100', text: 'text-red-600' },
                    happy: { bg: 'bg-green-100', text: 'text-green-600' },
                    neutral: { bg: 'bg-gray-100', text: 'text-gray-600' },
                    tired: { bg: 'bg-yellow-100', text: 'text-yellow-600' },
                    exhausted: { bg: 'bg-orange-100', text: 'text-orange-600' },
                  };
                  const colors = emotion
                    ? emotionColors[emotion.emoji] || { bg: 'bg-gray-100', text: 'text-gray-600' }
                    : { bg: 'bg-gray-100', text: 'text-gray-600' };
                  const iconPath = emotion ? EMOTION_ICONS[emotion.emoji] : '';
                  return (
                    <div key={c.id} className="flex items-start gap-2 text-sm">
                      <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center ${colors.bg}`}>
                        {iconPath ? (
                          <svg className={`w-3.5 h-3.5 ${colors.text}`} fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d={iconPath} />
                          </svg>
                        ) : (
                          <span className={`text-xs font-bold ${colors.text}`}>{c.emotion?.charAt(0) || 'N'}</span>
                        )}
                      </div>
                      <span className="text-[var(--text-secondary)] line-clamp-2">
                        {c.ai_response?.slice(0, 80)}...
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bridge Lesson */}
      <div className="bg-cream-white rounded-[20px] p-6 card-shadow">
        <h2 className="font-bold text-charcoal mb-2 flex items-center gap-2">
          <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
          </svg>
          AI 브릿지 레슨
        </h2>
        <p className="text-sm text-[var(--text-secondary)] mb-4">
          어려운 주제가 있나요? AI가 쉽게 설명해줄게요!
        </p>

        <div className="flex gap-3">
          <input
            type="text"
            value={bridgeTopic}
            onChange={(e) => setBridgeTopic(e.target.value)}
            placeholder="어려운 주제를 입력하세요 (예: JPA N+1 문제, 재귀함수, Docker 네트워크)"
            className="flex-1 px-4 py-3 rounded-xl border border-[rgba(26,26,26,0.06)] bg-cream-light text-charcoal placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-sky/40"
            onKeyDown={(e) => e.key === 'Enter' && handleBridgeLesson()}
          />
          <button
            onClick={handleBridgeLesson}
            disabled={bridgeLoading || !bridgeTopic.trim()}
            className="px-6 py-3 rounded-xl bg-sky-deep hover:bg-sky-deep/90 text-white font-semibold hover:shadow-lg transition-all disabled:opacity-60 whitespace-nowrap"
          >
            {bridgeLoading ? '설명 중...' : '설명해줘'}
          </button>
        </div>

        {bridgeContent && (
          <div className="mt-4 p-6 bg-cream-light rounded-xl">
            <div className="prose prose-sm prose-neutral max-w-none whitespace-pre-wrap">
              {bridgeContent}
            </div>
          </div>
        )}
      </div>

      {/* Risk Score History */}
      {pulseData.length > 0 && (
        <div className="bg-cream-white rounded-[20px] p-6 card-shadow">
          <h2 className="font-bold text-charcoal mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-sky" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
            학습 심박수 (최근 7일)
          </h2>
          <div className="space-y-2">
            {pulseData.slice(0, 7).map((p: any) => (
              <div key={p.id} className="flex items-center gap-4 text-sm">
                <span className="text-[var(--text-tertiary)] w-20">{p.date}</span>
                <RiskBadge level={p.risk_level} score={p.risk_score} />
                <div className="flex-1 flex gap-3 text-xs text-[var(--text-secondary)]">
                  <span className="flex items-center gap-1">
                    {p.attendance ? (
                      <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                    출석
                  </span>
                  <span className="flex items-center gap-1">
                    {p.assignment_done ? (
                      <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                    과제
                  </span>
                  <span>질문 {p.questions_count}회</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RiskBadge({ level, score }: { level: string; score: number }) {
  const colors: Record<string, string> = {
    GREEN: 'bg-emerald-100 text-emerald-700',
    YELLOW: 'bg-yellow-100 text-yellow-700',
    ORANGE: 'bg-orange-100 text-orange-700',
    RED: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${colors[level] || colors.GREEN}`}>
      {score}점
    </span>
  );
}
