// src/app/(dashboard)/coach/[id]/MentorRevisionPanel.tsx — 멘토 수정본 패널
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  documentId: string;
  documentContent: string;
  revisions: any[];
  isMentor: boolean;
  isOwner: boolean;
  userId: string;
}

export default function MentorRevisionPanel({
  documentId, documentContent, revisions, isMentor, isOwner, userId,
}: Props) {
  const router = useRouter();
  const [showEditor, setShowEditor] = useState(false);
  const [revisedContent, setRevisedContent] = useState(documentContent);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [respondingId, setRespondingId] = useState<string | null>(null);

  // 멘토: 수정본 제출
  async function handleSubmitRevision() {
    if (!revisedContent.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/documents/revisions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId,
          originalContent: documentContent,
          revisedContent,
          revisionNotes: notes,
        }),
      });
      if (res.ok) {
        setShowEditor(false);
        setNotes('');
        router.refresh();
      }
    } catch {} finally { setSubmitting(false); }
  }

  // 학생: 수정본 수락/거절
  async function handleResponse(revisionId: string, status: 'ACCEPTED' | 'REJECTED') {
    setRespondingId(revisionId);
    try {
      const res = await fetch('/api/documents/revisions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ revisionId, status }),
      });
      if (res.ok) router.refresh();
    } catch {} finally { setRespondingId(null); }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-charcoal">멘토 수정본</h2>
        {isMentor && !showEditor && (
          <button
            onClick={() => setShowEditor(true)}
            className="px-4 py-2 bg-earth/50 text-white text-sm font-medium rounded-xl hover:bg-amber-600 transition-colors"
          >
            수정본 작성하기
          </button>
        )}
      </div>

      {/* 멘토 수정 에디터 */}
      {showEditor && (
        <div className="bg-cream-white rounded-[20px] p-6 card-shadow border-2 border-earth/20 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-earth/10 text-earth flex items-center justify-center text-sm font-bold">M</div>
            <h3 className="font-bold text-earth">수정본 작성</h3>
          </div>

          <p className="text-sm text-[var(--text-secondary)]">
            학생의 원본을 기반으로 수정본을 작성해주세요. 학생은 수정본을 확인 후 수락/거절할 수 있습니다.
          </p>

          <textarea
            value={revisedContent}
            onChange={(e) => setRevisedContent(e.target.value)}
            rows={15}
            className="w-full px-4 py-3 rounded-xl border border-[rgba(26,26,26,0.06)] bg-cream-light text-charcoal text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
          />

          <div>
            <label className="text-sm font-medium text-charcoal mb-1 block">수정 의견 (학생에게 전달)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="어떤 부분을 왜 수정했는지 학생이 이해할 수 있도록 설명해주세요..."
              className="w-full px-4 py-3 rounded-xl border border-[rgba(26,26,26,0.06)] bg-cream-light text-charcoal text-sm placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowEditor(false)}
              className="px-4 py-2 text-sm text-[var(--text-secondary)] hover:bg-cream-dark rounded-lg transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleSubmitRevision}
              disabled={submitting || !revisedContent.trim()}
              className="px-6 py-2 bg-earth/50 text-white text-sm font-medium rounded-xl hover:bg-amber-600 transition-colors disabled:opacity-60"
            >
              {submitting ? '제출 중...' : '수정본 제출'}
            </button>
          </div>
        </div>
      )}

      {/* 수정본 목록 */}
      {revisions.length > 0 ? (
        <div className="space-y-3">
          {revisions.map((rev) => (
            <div
              key={rev.id}
              className={`bg-cream-white rounded-[20px] p-5 card-shadow border-l-4 ${
                rev.status === 'ACCEPTED' ? 'border-emerald-500' :
                rev.status === 'REJECTED' ? 'border-red-400' : 'border-amber-400'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    rev.status === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-700' :
                    rev.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-earth/10 text-earth'
                  }`}>
                    {rev.status === 'ACCEPTED' ? '수락됨' : rev.status === 'REJECTED' ? '거절됨' : '검토 대기'}
                  </span>
                  <span className="text-xs text-[var(--text-tertiary)]">
                    {new Date(rev.created_at).toLocaleDateString('ko-KR')}
                  </span>
                </div>
              </div>

              {/* 수정 의견 */}
              {rev.revision_notes && (
                <div className="p-3 bg-earth/5 rounded-xl mb-3">
                  <span className="text-xs font-semibold text-earth">멘토 수정 의견</span>
                  <p className="text-sm text-charcoal mt-1">{rev.revision_notes}</p>
                </div>
              )}

              {/* 수정 내용 미리보기 */}
              <details className="mb-3">
                <summary className="text-sm text-sky-deep cursor-pointer hover:text-sky-deep font-medium">
                  수정된 내용 보기
                </summary>
                <div className="mt-2 p-3 bg-cream-light rounded-xl text-sm text-charcoal whitespace-pre-wrap max-h-[300px] overflow-y-auto">
                  {rev.revised_content}
                </div>
              </details>

              {/* 학생 수락/거절 버튼 */}
              {isOwner && rev.status === 'PENDING' && (
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => handleResponse(rev.id, 'ACCEPTED')}
                    disabled={respondingId === rev.id}
                    className="flex-1 py-2 bg-emerald-500 text-white text-sm font-medium rounded-xl hover:bg-emerald-600 transition-colors disabled:opacity-60"
                  >
                    {respondingId === rev.id ? '처리 중...' : '수락 (내 문서에 반영)'}
                  </button>
                  <button
                    onClick={() => handleResponse(rev.id, 'REJECTED')}
                    disabled={respondingId === rev.id}
                    className="flex-1 py-2 border-2 border-[rgba(26,26,26,0.06)] text-[var(--text-secondary)] text-sm font-medium rounded-xl hover:bg-cream-light transition-colors disabled:opacity-60"
                  >
                    거절
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        !showEditor && (
          <div className="bg-cream-white rounded-[20px] p-8 card-shadow text-center">
            <p className="text-sm text-[var(--text-tertiary)]">
              {isMentor ? '아직 수정본을 작성하지 않았습니다. 위 버튼으로 수정본을 제안해보세요.' : '아직 멘토 수정본이 없습니다.'}
            </p>
          </div>
        )
      )}
    </div>
  );
}
