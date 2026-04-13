// src/app/(dashboard)/consultation/page.tsx — 상담 예약 페이지
'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

const CONSULT_TYPES = [
  { value: 'CAREER', label: '취업 상담', icon: 'briefcase' },
  { value: 'LEARNING', label: '학습 상담', icon: 'book' },
  { value: 'PORTFOLIO', label: '포트폴리오 리뷰', icon: 'folder' },
  { value: 'RESUME', label: '자소서 리뷰', icon: 'edit' },
  { value: 'PERSONAL', label: '고민 상담', icon: 'chat' },
  { value: 'OTHER', label: '기타', icon: 'other' },
];

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

export default function ConsultationPage() {
  const supabase = createClient();
  const [tab, setTab] = useState<'book' | 'history'>('history');
  const [mentors, setMentors] = useState<any[]>([]);
  const [selectedMentor, setSelectedMentor] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [slots, setSlots] = useState<{ time: string; available: boolean }[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [consultType, setConsultType] = useState('CAREER');
  const [topic, setTopic] = useState('');
  const [memo, setMemo] = useState('');
  const [loading, setLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [consultations, setConsultations] = useState<any[]>([]);
  const [isMentor, setIsMentor] = useState(false);
  const [roleLoaded, setRoleLoaded] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  // 멘토 목록 로드
  useEffect(() => {
    async function loadMentors() {
      const { data } = await supabase
        .from('user_profiles')
        .select('user_id, name, role')
        .in('role', ['MENTOR', 'CAREER_ADVISOR']);
      setMentors(data || []);
      if (data && data.length > 0 && !selectedMentor) {
        setSelectedMentor(data[0].user_id);
      }
    }
    loadMentors();
  }, []);

  // 상담 내역 로드 + 역할 판별
  useEffect(() => {
    async function loadConsultations() {
      const res = await fetch('/api/consultation');
      const data = await res.json();
      setConsultations(data.consultations || []);
      setIsMentor(data.isMentor || false);
      if (!roleLoaded) {
        // 학생이면 예약하기 탭, 멘토/관리자면 상담 내역 탭
        setTab(data.isMentor ? 'history' : 'book');
        setRoleLoaded(true);
      }
    }
    loadConsultations();
  }, [success]);

  // 시간 슬롯 로드
  const loadSlots = useCallback(async () => {
    if (!selectedMentor || !selectedDate) return;
    setSlotsLoading(true);
    setSelectedSlot('');
    const res = await fetch(`/api/consultation/availability?mentorId=${selectedMentor}&date=${selectedDate}`);
    const data = await res.json();
    setSlots(data.slots || []);
    setSlotsLoading(false);
  }, [selectedMentor, selectedDate]);

  useEffect(() => { loadSlots(); }, [loadSlots]);

  async function handleBook() {
    if (!selectedMentor || !selectedDate || !selectedSlot) {
      setError('멘토, 날짜, 시간을 모두 선택해주세요.');
      return;
    }
    setLoading(true);
    setError(null);

    const [h, m] = selectedSlot.split(':');
    const endH = parseInt(h);
    const endM = parseInt(m) + 30;
    const endTime = `${endM >= 60 ? endH + 1 : endH}:${(endM % 60).toString().padStart(2, '0')}`;

    const res = await fetch('/api/consultation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mentorId: selectedMentor,
        date: selectedDate,
        startTime: selectedSlot,
        endTime,
        type: consultType,
        topic,
        studentMemo: memo,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || '예약 실패');
    } else {
      setSuccess(true);
      setTopic('');
      setMemo('');
      setSelectedSlot('');
      setTimeout(() => setSuccess(false), 3000);
    }
    setLoading(false);
  }

  async function handleStatusChange(id: string, status: string) {
    await fetch('/api/consultation', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ consultationId: id, status }),
    });
    // 새로고침
    const res = await fetch('/api/consultation');
    const data = await res.json();
    setConsultations(data.consultations || []);
  }

  // 달력 생성
  function generateCalendar() {
    const { year, month } = calendarMonth;
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);

    return days.map((day, i) => {
      if (!day) return <div key={i} />;
      const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      const dateObj = new Date(year, month, day);
      const isPast = dateObj < today;
      const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
      const isSelected = selectedDate === dateStr;
      const isToday = dateObj.getTime() === today.getTime();

      return (
        <button
          key={i}
          onClick={() => !isPast && setSelectedDate(dateStr)}
          disabled={isPast}
          className={`w-full aspect-square rounded-lg text-sm font-medium transition-all ${
            isSelected ? 'bg-sky-deep text-white'
            : isToday ? 'bg-sky/10 text-sky-deep'
            : isPast ? 'text-[var(--text-tertiary)] cursor-not-allowed'
            : isWeekend ? 'text-red-400 hover:bg-red-50'
            : 'text-charcoal hover:bg-cream-dark'
          }`}
        >
          {day}
        </button>
      );
    });
  }

  const statusStyles: Record<string, string> = {
    REQUESTED: 'bg-earth/10 text-earth',
    CONFIRMED: 'bg-emerald-100 text-emerald-700',
    COMPLETED: 'bg-cream-dark text-[var(--text-secondary)]',
    CANCELLED: 'bg-red-100 text-red-600',
  };
  const statusLabels: Record<string, string> = {
    REQUESTED: '대기', CONFIRMED: '확정', COMPLETED: '완료', CANCELLED: '취소',
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-charcoal">
          {isMentor ? '상담 관리' : '상담 예약'}
        </h1>
        <p className="text-[var(--text-secondary)] mt-1">
          {isMentor ? '학생 상담 요청을 확인하고 관리하세요' : '멘토와 1:1 상담을 예약하세요'}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {!isMentor && (
          <button onClick={() => setTab('book')}
            className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${
              tab === 'book' ? 'bg-sky-deep text-white' : 'bg-cream-white text-[var(--text-secondary)] hover:bg-cream-light card-shadow'
            }`}>
            예약하기
          </button>
        )}
        <button onClick={() => setTab('history')}
          className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${
            tab === 'history' ? 'bg-sky-deep text-white' : 'bg-cream-white text-[var(--text-secondary)] hover:bg-cream-light card-shadow'
          }`}>
          {isMentor ? '상담 요청' : '상담 내역'} {consultations.length > 0 && `(${consultations.length})`}
        </button>
      </div>

      {tab === 'book' && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Left: 멘토 선택 + 달력 */}
          <div className="space-y-4">
            {/* 멘토 선택 */}
            <div className="bg-cream-white rounded-[20px] p-5 card-shadow">
              <h3 className="font-bold text-sm text-charcoal mb-3">멘토 선택</h3>
              <div className="space-y-2">
                {mentors.map((m) => (
                  <button key={m.user_id} onClick={() => setSelectedMentor(m.user_id)}
                    className={`w-full p-3 rounded-xl border-2 text-left transition-all flex items-center gap-3 ${
                      selectedMentor === m.user_id ? 'border-primary-500 bg-sky/5' : 'border-[rgba(26,26,26,0.06)] hover:border-[rgba(26,26,26,0.10)]'
                    }`}>
                    <div className="w-9 h-9 rounded-full bg-sky/10 text-sky-deep flex items-center justify-center font-bold text-sm">
                      {m.name?.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium text-sm text-charcoal">{m.name}</div>
                      <div className="text-xs text-[var(--text-tertiary)]">
                        {m.role === 'MENTOR' ? '멘토' : '취업상담사'}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 달력 */}
            <div className="bg-cream-white rounded-[20px] p-5 card-shadow">
              <div className="flex items-center justify-between mb-4">
                <button onClick={() => setCalendarMonth((p) => {
                  const d = new Date(p.year, p.month - 1);
                  return { year: d.getFullYear(), month: d.getMonth() };
                })} className="p-1 rounded hover:bg-cream-dark">
                  <svg className="w-5 h-5 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h3 className="font-bold text-sm text-charcoal">
                  {calendarMonth.year}년 {calendarMonth.month + 1}월
                </h3>
                <button onClick={() => setCalendarMonth((p) => {
                  const d = new Date(p.year, p.month + 1);
                  return { year: d.getFullYear(), month: d.getMonth() };
                })} className="p-1 rounded hover:bg-cream-dark">
                  <svg className="w-5 h-5 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              <div className="grid grid-cols-7 gap-1 mb-2">
                {DAY_NAMES.map((d) => (
                  <div key={d} className="text-center text-xs text-[var(--text-tertiary)] font-medium py-1">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {generateCalendar()}
              </div>
            </div>
          </div>

          {/* Right: 시간 선택 + 상담 내용 */}
          <div className="space-y-4">
            {/* 시간 슬롯 */}
            <div className="bg-cream-white rounded-[20px] p-5 card-shadow">
              <h3 className="font-bold text-sm text-charcoal mb-3">
                {selectedDate
                  ? `${selectedDate} (${DAY_NAMES[new Date(selectedDate).getDay()]})`
                  : '날짜를 선택하세요'}
              </h3>
              {slotsLoading ? (
                <div className="py-8 text-center text-sm text-[var(--text-tertiary)]">시간 조회 중...</div>
              ) : selectedDate ? (
                slots.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {slots.map((slot) => (
                      <button key={slot.time}
                        onClick={() => slot.available && setSelectedSlot(slot.time)}
                        disabled={!slot.available}
                        className={`py-2.5 rounded-lg text-sm font-medium transition-all ${
                          selectedSlot === slot.time ? 'bg-sky-deep text-white'
                          : slot.available ? 'bg-cream-light text-charcoal hover:bg-sky/5 hover:text-sky-deep'
                          : 'bg-cream-dark text-[var(--text-tertiary)] cursor-not-allowed line-through'
                        }`}>
                        {slot.time}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="py-8 text-center text-sm text-[var(--text-tertiary)]">해당 날짜에 가능한 시간이 없습니다.</p>
                )
              ) : (
                <p className="py-8 text-center text-sm text-[var(--text-tertiary)]">왼쪽 달력에서 날짜를 선택하세요.</p>
              )}
            </div>

            {/* 상담 유형 */}
            <div className="bg-cream-white rounded-[20px] p-5 card-shadow">
              <h3 className="font-bold text-sm text-charcoal mb-3">상담 유형</h3>
              <div className="grid grid-cols-3 gap-2">
                {CONSULT_TYPES.map((t) => (
                  <button key={t.value}
                    onClick={() => setConsultType(t.value)}
                    className={`p-2.5 rounded-xl text-center transition-all ${
                      consultType === t.value ? 'bg-sky/5 border-2 border-primary-500' : 'bg-cream-light border-2 border-transparent hover:border-[rgba(26,26,26,0.06)]'
                    }`}>
                    {t.icon === 'briefcase' && (
                      <svg className="w-5 h-5 mx-auto mb-1" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />
                      </svg>
                    )}
                    {t.icon === 'book' && (
                      <svg className="w-5 h-5 mx-auto mb-1" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                      </svg>
                    )}
                    {t.icon === 'folder' && (
                      <svg className="w-5 h-5 mx-auto mb-1" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                      </svg>
                    )}
                    {t.icon === 'edit' && (
                      <svg className="w-5 h-5 mx-auto mb-1" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                      </svg>
                    )}
                    {t.icon === 'chat' && (
                      <svg className="w-5 h-5 mx-auto mb-1" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                      </svg>
                    )}
                    {t.icon === 'other' && (
                      <div className="w-2 h-2 rounded-full bg-[rgba(26,26,26,0.40)] mx-auto mb-1" />
                    )}
                    <div className="text-[11px] font-medium mt-0.5">{t.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 상담 내용 */}
            <div className="bg-cream-white rounded-[20px] p-5 card-shadow space-y-3">
              <h3 className="font-bold text-sm text-charcoal">상담 내용</h3>
              <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)}
                placeholder="상담 주제 (예: 프론트엔드 취업 전략)"
                className="w-full px-4 py-2.5 rounded-xl border border-[rgba(26,26,26,0.06)] bg-cream-light text-sm text-charcoal placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-sky/40" />
              <textarea value={memo} onChange={(e) => setMemo(e.target.value)}
                rows={3} placeholder="미리 전달하고 싶은 내용이 있다면 작성하세요..."
                className="w-full px-4 py-2.5 rounded-xl border border-[rgba(26,26,26,0.06)] bg-cream-light text-sm text-charcoal placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-sky/40 resize-none" />
            </div>

            {/* 예약 요약 + 버튼 */}
            {selectedSlot && (
              <div className="bg-sky/5 rounded-[20px] p-5 border-2 border-sky/20">
                <div className="text-xs text-sky-deep font-semibold mb-2">예약 요약</div>
                <p className="text-sm text-charcoal font-medium">
                  {mentors.find((m) => m.user_id === selectedMentor)?.name} 멘토
                </p>
                <p className="text-sm text-[var(--text-secondary)]">
                  {selectedDate} ({DAY_NAMES[new Date(selectedDate).getDay()]}) {selectedSlot} ~ {
                    (() => {
                      const [h, m] = selectedSlot.split(':').map(Number);
                      const end = h * 60 + m + 30;
                      return `${Math.floor(end / 60)}:${(end % 60).toString().padStart(2, '0')}`;
                    })()
                  }
                </p>
                <p className="text-sm text-[var(--text-secondary)]">
                  {CONSULT_TYPES.find((t) => t.value === consultType)?.icon}{' '}
                  {CONSULT_TYPES.find((t) => t.value === consultType)?.label}
                  {topic && ` — ${topic}`}
                </p>
              </div>
            )}

            {error && <div className="bg-red-50 text-red-600 text-sm rounded-lg px-4 py-3">{error}</div>}
            {success && <div className="bg-emerald-50 text-emerald-600 text-sm rounded-lg px-4 py-3">상담이 예약되었습니다! 멘토 확인 후 확정됩니다.</div>}

            <button onClick={handleBook} disabled={loading || !selectedSlot}
              className="w-full py-3 rounded-xl bg-sky-deep hover:bg-sky-deep/90 text-white font-semibold hover:shadow-lg transition-all disabled:opacity-60">
              {loading ? '예약 중...' : '상담 예약하기'}
            </button>
          </div>
        </div>
      )}

      {/* History Tab */}
      {tab === 'history' && (
        <div className="space-y-3">
          {consultations.length > 0 ? consultations.map((c) => (
            <div key={c.id} className="bg-cream-white rounded-[20px] p-5 card-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${statusStyles[c.status] || ''}`}>
                      {statusLabels[c.status] || c.status}
                    </span>
                    <span className="text-xs text-[var(--text-tertiary)]">
                      {CONSULT_TYPES.find((t) => t.value === c.type)?.icon}{' '}
                      {CONSULT_TYPES.find((t) => t.value === c.type)?.label}
                    </span>
                  </div>
                  <p className="font-medium text-charcoal">
                    {isMentor ? c.student_name : c.mentor_name}
                    {isMentor ? ' (학생)' : ' 멘토'}
                  </p>
                  <p className="text-sm text-[var(--text-secondary)] mt-0.5">
                    {c.date} ({DAY_NAMES[new Date(c.date).getDay()]}) {c.start_time?.slice(0, 5)} ~ {c.end_time?.slice(0, 5)}
                  </p>
                  {c.topic && <p className="text-sm text-[var(--text-secondary)] mt-1">주제: {c.topic}</p>}
                  {c.student_memo && <p className="text-xs text-[var(--text-tertiary)] mt-1">메모: {c.student_memo}</p>}
                  {c.mentor_memo && <p className="text-xs text-sky-deep mt-1">멘토 피드백: {c.mentor_memo}</p>}
                </div>
                <div className="flex gap-2 ml-4">
                  {isMentor && c.status === 'REQUESTED' && (
                    <>
                      <button onClick={() => handleStatusChange(c.id, 'CONFIRMED')}
                        className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-medium hover:bg-emerald-200">
                        확정
                      </button>
                      <button onClick={() => handleStatusChange(c.id, 'CANCELLED')}
                        className="px-3 py-1.5 bg-red-100 text-red-600 rounded-lg text-xs font-medium hover:bg-red-200">
                        거절
                      </button>
                    </>
                  )}
                  {isMentor && c.status === 'CONFIRMED' && (
                    <button onClick={() => handleStatusChange(c.id, 'COMPLETED')}
                      className="px-3 py-1.5 bg-sky/10 text-sky-deep rounded-lg text-xs font-medium hover:bg-sky/20">
                      완료
                    </button>
                  )}
                  {!isMentor && c.status === 'REQUESTED' && (
                    <button onClick={() => handleStatusChange(c.id, 'CANCELLED')}
                      className="px-3 py-1.5 bg-red-100 text-red-600 rounded-lg text-xs font-medium hover:bg-red-200">
                      취소
                    </button>
                  )}
                </div>
              </div>
            </div>
          )) : (
            <div className="bg-cream-white rounded-[20px] p-12 card-shadow text-center">
              <svg className="w-12 h-12 mx-auto mb-3 text-[var(--text-tertiary)]" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
              <p className="text-[var(--text-tertiary)]">아직 상담 내역이 없습니다.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
