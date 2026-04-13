// src/app/(dashboard)/certs/page.tsx — 자격증 달력 + D-day + 접수/발표 사이트 이동
'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];
const MONTHS = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];

// 자격증별 공식 사이트 매핑
const CERT_SITES: Record<string, { register: string; result: string; label: string }> = {
  '정보처리기사': { register: 'https://www.q-net.or.kr/crf005.do?id=crf00503&jmCd=1320', result: 'https://www.q-net.or.kr/crf006.do?id=crf00601&gSite=Q&gId=', label: 'Q-net' },
  '정보처리산업기사': { register: 'https://www.q-net.or.kr/crf005.do?id=crf00503&jmCd=2290', result: 'https://www.q-net.or.kr/crf006.do?id=crf00601&gSite=Q&gId=', label: 'Q-net' },
  '정보보안기사': { register: 'https://www.cq.or.kr/qh_quagm01_010.do', result: 'https://www.cq.or.kr/qh_quagm01_015.do', label: 'KCA' },
  '웹디자인기능사': { register: 'https://www.q-net.or.kr/crf005.do?id=crf00503&jmCd=7910', result: 'https://www.q-net.or.kr/crf006.do?id=crf00601&gSite=Q&gId=', label: 'Q-net' },
  'SQLD (SQL 개발자)': { register: 'https://www.dataq.or.kr/www/accept/schedule.do', result: 'https://www.dataq.or.kr/www/mypage/gate.do', label: 'dataq' },
  'ADsP (데이터분석 준전문가)': { register: 'https://www.dataq.or.kr/www/accept/schedule.do', result: 'https://www.dataq.or.kr/www/mypage/gate.do', label: 'dataq' },
  'SQLP (SQL 전문가)': { register: 'https://www.dataq.or.kr/www/accept/schedule.do', result: 'https://www.dataq.or.kr/www/mypage/gate.do', label: 'dataq' },
  'ADP (데이터분석 전문가)': { register: 'https://www.dataq.or.kr/www/accept/schedule.do', result: 'https://www.dataq.or.kr/www/mypage/gate.do', label: 'dataq' },
  '빅데이터분석기사': { register: 'https://www.dataq.or.kr/www/accept/schedule.do', result: 'https://www.dataq.or.kr/www/mypage/gate.do', label: 'dataq' },
  '리눅스마스터 2급': { register: 'https://www.ihd.or.kr/memaccept2.do', result: 'https://www.ihd.or.kr/memgrade.do', label: 'KAIT' },
  '리눅스마스터 1급': { register: 'https://www.ihd.or.kr/memaccept1.do', result: 'https://www.ihd.or.kr/memgrade.do', label: 'KAIT' },
  '네트워크관리사 2급': { register: 'https://www.icqa.or.kr/cn/page/network', result: 'https://www.icqa.or.kr/cn/page/network', label: 'ICQA' },
  '한국사능력검정시험': { register: 'https://www.historyexam.go.kr', result: 'https://www.historyexam.go.kr', label: '한국사' },
  'AWS Solutions Architect Associate': { register: 'https://www.aws.training/certification', result: 'https://www.aws.training/certification', label: 'AWS' },
  'AWS Developer Associate': { register: 'https://www.aws.training/certification', result: 'https://www.aws.training/certification', label: 'AWS' },
  '컴퓨터활용능력 1급': { register: 'https://license.korcham.net/ex/examInfo1.do', result: 'https://license.korcham.net/ex/examResult.do', label: '상공회의소' },
  '컴퓨터활용능력 2급': { register: 'https://license.korcham.net/ex/examInfo1.do', result: 'https://license.korcham.net/ex/examResult.do', label: '상공회의소' },
  'OCP (Oracle Certified Professional)': { register: 'https://education.oracle.com/certification', result: 'https://education.oracle.com/certification', label: 'Oracle' },
  'TOEIC': { register: 'https://exam.toeic.co.kr/receipt/receiptStep01.php', result: 'https://exam.toeic.co.kr/score/scoreStep01.php', label: 'TOEIC' },
  'ISTQB CTFL (소프트웨어 테스팅)': { register: 'https://www.kstqb.org/test/test2.asp', result: 'https://www.kstqb.org/test/test_day.asp?bbs_code=12', label: 'KSTQB' },
};

interface CertEvent {
  certName: string;
  type: string;
  label: string;
  date: string;
  dateEnd?: string;
  dDay: number;
  dDayStart: number; // 시작일 기준 D-day
  color: string;
  status: 'upcoming' | 'ongoing' | 'past'; // 접수/시험 진행 상태
}

// 이벤트 상태 판별
function getEventStatus(startDate: string, endDate?: string): 'upcoming' | 'ongoing' | 'past' {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : start;

  if (today < start) return 'upcoming';
  if (today > end) return 'past';
  return 'ongoing';
}

export default function CertsPage() {
  const supabase = createClient();
  const [certs, setCerts] = useState<any[]>([]);
  const [myCerts, setMyCerts] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [calMonth, setCalMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [expandedCert, setExpandedCert] = useState<string | null>(null);

  // 자격증 데이터 로드
  useEffect(() => {
    async function load() {
      const { data: certData } = await supabase
        .from('certifications')
        .select('*')
        .order('name');
      setCerts(certData || []);

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('target_certs, courses(tech_stack, name)')
          .eq('user_id', user.id)
          .single();

        const targetCerts = profile?.target_certs || [];
        const courseRelated = certData?.filter((c: any) =>
          c.related_courses?.some((rc: string) =>
            (profile?.courses as any)?.tech_stack?.some((ts: string) =>
              rc.toLowerCase().includes(ts.toLowerCase()) || ts.toLowerCase().includes(rc.toLowerCase())
            )
          )
        ).map((c: any) => c.name) || [];

        setMyCerts([...new Set([...targetCerts, ...courseRelated])]);
      }
    }
    load();
  }, []);

  // 자격증 이벤트 파싱
  const events = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const result: CertEvent[] = [];
    const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-earth/50', 'bg-red-500', 'bg-pink-500', 'bg-cyan-500', 'bg-sky/50'];

    certs.forEach((cert, ci) => {
      const examDates = cert.exam_dates as any;
      if (!examDates) return;

      const years = [String(today.getFullYear()), String(today.getFullYear() + 1)];
      for (const year of years) {
        const yearData = examDates[year];
        if (!yearData || !Array.isArray(yearData)) continue;

        for (const schedule of yearData) {
          const entries: { label: string; raw: string }[] = [];
          if (schedule['접수']) entries.push({ label: '접수', raw: schedule['접수'] });
          if (schedule['시험']) entries.push({ label: '시험', raw: schedule['시험'] });
          if (schedule['발표']) entries.push({ label: '발표', raw: schedule['발표'] });

          for (const entry of entries) {
            const dateMatch = entry.raw.match(/(\d{4}-\d{2}-\d{2})/g);
            if (!dateMatch) continue;

            const startDate = dateMatch[0];
            const endDate = dateMatch.length > 1 ? dateMatch[1] : undefined;
            const targetDate = new Date(endDate || startDate);
            const startDateObj = new Date(startDate);
            const dDay = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            const dDayStart = Math.ceil((startDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

            result.push({
              certName: cert.name,
              type: schedule.type || '',
              label: entry.label,
              date: startDate,
              dateEnd: endDate,
              dDay,
              dDayStart,
              color: colors[ci % colors.length],
              status: getEventStatus(startDate, endDate),
            });
          }
        }
      }
    });

    return result.sort((a, b) => a.dDay - b.dDay);
  }, [certs]);

  // 내 자격증 이벤트만 필터
  const myEvents = useMemo(() =>
    events.filter((e) => myCerts.some((mc) => e.certName.includes(mc) || mc.includes(e.certName)))
  , [events, myCerts]);

  // 알림 배너: 접수중 / 발표일
  const activeAlerts = useMemo(() => {
    const targetEvents = myEvents.length > 0 ? myEvents : events;
    const alerts: CertEvent[] = [];

    // 접수 진행중인 이벤트
    alerts.push(...targetEvents.filter(e => e.label === '접수' && e.status === 'ongoing'));
    // 접수 임박 (3일 이내)
    alerts.push(...targetEvents.filter(e => e.label === '접수' && e.status === 'upcoming' && e.dDayStart >= 0 && e.dDayStart <= 3));
    // 발표일 당일 또는 D-1
    alerts.push(...targetEvents.filter(e => e.label === '발표' && e.dDay >= 0 && e.dDay <= 1));
    // 시험 D-7 이내
    alerts.push(...targetEvents.filter(e => e.label === '시험' && e.status === 'upcoming' && e.dDayStart >= 0 && e.dDayStart <= 7));

    // 중복 제거
    const seen = new Set<string>();
    return alerts.filter(a => {
      const key = `${a.certName}-${a.type}-${a.label}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [myEvents, events]);

  // 달력에 표시할 이벤트
  const calendarEvents = useMemo(() => {
    const { year, month } = calMonth;
    return events.filter((e) => {
      const d = new Date(e.date);
      return d.getFullYear() === year && d.getMonth() === month;
    });
  }, [events, calMonth]);

  // 자격증 검색
  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const q = searchQuery.toLowerCase();
    setSearchResults(
      certs.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 5)
    );
  }, [searchQuery, certs]);

  // 관심 자격증 토글
  async function toggleMyCert(certName: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const newCerts = myCerts.includes(certName)
      ? myCerts.filter((c) => c !== certName)
      : [...myCerts, certName];

    setMyCerts(newCerts);
    await supabase.from('user_profiles')
      .update({ target_certs: newCerts })
      .eq('user_id', user.id);
  }

  function dDayColor(d: number) {
    if (d < 0) return 'text-[var(--text-tertiary)]';
    if (d <= 7) return 'text-red-600';
    if (d <= 30) return 'text-earth';
    return 'text-sky-deep';
  }

  function dDayBg(d: number) {
    if (d < 0) return 'bg-cream-dark';
    if (d <= 7) return 'bg-red-50 border-red-200';
    if (d <= 30) return 'bg-earth/5 border-earth/20';
    return 'bg-sky/5 border-sky/20';
  }

  // 사이트 이동 버튼 컴포넌트
  function SiteButton({ certName, type }: { certName: string; type: 'register' | 'result' }) {
    const site = CERT_SITES[certName];
    if (!site) return null;
    const url = type === 'register' ? site.register : site.result;
    const label = type === 'register' ? '원서접수' : '결과확인';
    const bgColor = type === 'register' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-emerald-600 hover:bg-emerald-700';

    return (
      <a href={url} target="_blank" rel="noopener noreferrer"
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-medium ${bgColor} transition-all shadow-sm`}>
        {type === 'register' ? (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
          </svg>
        )}
        <span>{label}</span>
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </a>
    );
  }

  // 알림 배너 컴포넌트
  function AlertBanner({ ev }: { ev: CertEvent }) {
    const isRegistering = ev.label === '접수' && ev.status === 'ongoing';
    const isRegisterSoon = ev.label === '접수' && ev.status === 'upcoming';
    const isResult = ev.label === '발표';
    const isExamSoon = ev.label === '시험';

    let bgClass = '';
    let iconSvg = null;
    let message = '';

    let accentColor = '';
    let iconColor = '';
    let btnClass = '';

    if (isRegistering) {
      accentColor = 'border-l-sky-deep';
      iconColor = 'text-sky-deep';
      btnClass = 'text-sky-deep hover:bg-sky/10';
      message = `${ev.certName} ${ev.type} 원서접수 진행중! (~${ev.dateEnd || ev.date} 마감)`;
      iconSvg = (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
      );
    } else if (isRegisterSoon) {
      accentColor = 'border-l-earth';
      iconColor = 'text-earth';
      btnClass = 'text-earth hover:bg-earth/10';
      message = `${ev.certName} ${ev.type} 원서접수 ${ev.dDayStart === 0 ? '오늘 시작!' : `D-${ev.dDayStart}일 후 시작!`}`;
      iconSvg = (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    } else if (isResult) {
      accentColor = 'border-l-emerald-500';
      iconColor = 'text-emerald-600';
      btnClass = 'text-emerald-600 hover:bg-emerald-50';
      message = `${ev.certName} ${ev.type} 합격발표 ${ev.dDay === 0 ? '오늘!' : '내일!'}`;
      iconSvg = (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    } else if (isExamSoon) {
      accentColor = 'border-l-red-400';
      iconColor = 'text-red-500';
      btnClass = 'text-red-500 hover:bg-red-50';
      message = `${ev.certName} ${ev.type} 시험 D-${ev.dDayStart}! 화이팅!`;
      iconSvg = (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
        </svg>
      );
    }

    const site = CERT_SITES[ev.certName];
    const buttonUrl = (isRegistering || isRegisterSoon) ? site?.register : site?.result;
    const buttonLabel = (isRegistering || isRegisterSoon) ? '원서접수 바로가기' : '결과확인 바로가기';

    return (
      <div className={`bg-cream-white border border-[rgba(26,26,26,0.06)] border-l-[3px] ${accentColor} rounded-xl px-4 py-2.5 flex items-center justify-between`}>
        <div className="flex items-center gap-2 min-w-0">
          <div className={`shrink-0 ${iconColor}`}>{iconSvg}</div>
          <p className="text-sm text-charcoal truncate">{message}</p>
        </div>
        {buttonUrl && (
          <a href={buttonUrl} target="_blank" rel="noopener noreferrer"
            className={`shrink-0 ml-3 px-3 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${btnClass}`}>
            {buttonLabel}
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        )}
      </div>
    );
  }

  // 달력 생성
  function generateCalendar() {
    const { year, month } = calMonth;
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${(today.getMonth()+1).toString().padStart(2,'0')}-${today.getDate().toString().padStart(2,'0')}`;

    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);

    return days.map((day, i) => {
      if (!day) return <div key={i} className="min-h-[80px]" />;
      const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      const dayEvents = calendarEvents.filter((e) => e.date === dateStr || e.dateEnd === dateStr);
      const isToday = dateStr === todayStr;
      const dow = new Date(year, month, day).getDay();

      return (
        <div key={i} className={`min-h-[80px] p-1 border border-[rgba(26,26,26,0.04)] rounded-lg ${isToday ? 'bg-sky/5/50 border-sky/20' : ''}`}>
          <div className={`text-xs font-medium mb-0.5 ${isToday ? 'text-sky-deep font-bold' : dow === 0 ? 'text-red-400' : dow === 6 ? 'text-blue-400' : 'text-[var(--text-secondary)]'}`}>
            {day}
          </div>
          <div className="space-y-0.5">
            {dayEvents.slice(0, 3).map((ev, j) => (
              <div key={j} className={`text-[9px] px-1 py-0.5 rounded ${
                ev.label === '접수' ? 'bg-blue-500' : ev.label === '시험' ? 'bg-red-500' : 'bg-emerald-500'
              } text-white truncate cursor-pointer hover:opacity-80`}
                title={`${ev.certName} ${ev.type} ${ev.label}`}
                onClick={() => setExpandedCert(ev.certName)}>
                {ev.certName.slice(0, 6)} {ev.label}
              </div>
            ))}
            {dayEvents.length > 3 && (
              <div className="text-[9px] text-[var(--text-tertiary)]">+{dayEvents.length - 3}개</div>
            )}
          </div>
        </div>
      );
    });
  }

  // 다가오는 이벤트
  const upcomingEvents = useMemo(() => {
    const targetEvents = myEvents.length > 0 ? myEvents : events;
    return targetEvents.filter((e) => e.dDay >= 0).slice(0, 8);
  }, [myEvents, events]);

  // 확장된 자격증의 전체 일정
  const expandedCertEvents = useMemo(() => {
    if (!expandedCert) return [];
    return events.filter(e => e.certName === expandedCert);
  }, [expandedCert, events]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-charcoal">자격증 일정</h1>
        <p className="text-[var(--text-secondary)] mt-1">시험 일정을 한눈에 확인하고 D-day를 관리하세요</p>
      </div>

      {/* 실시간 알림 배너 */}
      {activeAlerts.length > 0 && (
        <div className="space-y-2">
          {activeAlerts.slice(0, 3).map((alert, i) => (
            <AlertBanner key={i} ev={alert} />
          ))}
        </div>
      )}

      {/* D-Day 카드 */}
      <div>
        <h2 className="font-bold text-sm text-charcoal mb-3 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
          </svg>
          {myEvents.length > 0 ? '내 자격증 D-Day' : '다가오는 시험 D-Day'}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {upcomingEvents.map((ev, i) => (
            <div key={i} className={`rounded-xl p-4 border-2 ${dDayBg(ev.dDay)} transition-all cursor-pointer hover:shadow-md`}
              onClick={() => setExpandedCert(ev.certName)}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-2xl font-extrabold ${dDayColor(ev.dDay)}`}>
                  {ev.dDay === 0 ? 'D-Day' : `D-${ev.dDay}`}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full text-white ${
                  ev.label === '시험' ? 'bg-red-500' : ev.label === '접수' ? 'bg-blue-500' : 'bg-emerald-500'
                }`}>
                  {ev.label}
                </span>
              </div>
              <p className="text-sm font-medium text-charcoal truncate">{ev.certName}</p>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">{ev.type} · {ev.date}</p>
              {ev.dateEnd && <p className="text-xs text-[var(--text-tertiary)]">~ {ev.dateEnd}</p>}

              {/* 상태별 CTA 버튼 */}
              <div className="mt-2">
                {ev.label === '접수' && (ev.status === 'ongoing' || ev.status === 'upcoming') && (
                  <SiteButton certName={ev.certName} type="register" />
                )}
                {ev.label === '발표' && ev.dDay <= 3 && (
                  <SiteButton certName={ev.certName} type="result" />
                )}
              </div>
            </div>
          ))}
          {upcomingEvents.length === 0 && (
            <div className="col-span-4 text-center py-8 text-sm text-[var(--text-tertiary)]">
              다가오는 시험 일정이 없습니다.
            </div>
          )}
        </div>
      </div>

      {/* 자격증 상세 패널 (클릭시 펼침) */}
      {expandedCert && (
        <div className="bg-cream-white rounded-[20px] p-5 card-shadow border-2 border-sky/20">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-lg text-charcoal">{expandedCert}</h3>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">전체 일정 · 바로가기</p>
            </div>
            <div className="flex items-center gap-2">
              <SiteButton certName={expandedCert} type="register" />
              <SiteButton certName={expandedCert} type="result" />
              <button onClick={() => setExpandedCert(null)}
                className="p-1.5 rounded-lg hover:bg-cream-dark text-[var(--text-tertiary)]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {expandedCertEvents.map((ev, i) => {
              const statusBadge = ev.status === 'ongoing'
                ? <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full font-bold animate-pulse">진행중</span>
                : ev.status === 'past'
                ? <span className="text-[10px] px-1.5 py-0.5 bg-cream-dark text-[var(--text-tertiary)] rounded-full">완료</span>
                : ev.dDay <= 7
                ? <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-600 rounded-full font-bold">D-{ev.dDay}</span>
                : ev.dDay <= 30
                ? <span className="text-[10px] px-1.5 py-0.5 bg-earth/10 text-earth rounded-full">D-{ev.dDay}</span>
                : <span className="text-[10px] px-1.5 py-0.5 bg-cream-dark text-[var(--text-secondary)] rounded-full">D-{ev.dDay}</span>;

              return (
                <div key={i} className={`flex items-center gap-3 p-3 rounded-lg border ${
                  ev.status === 'ongoing' ? 'border-green-200 bg-green-50/50' :
                  ev.status === 'past' ? 'border-[rgba(26,26,26,0.04)] bg-cream-light/50 opacity-60' :
                  'border-[rgba(26,26,26,0.06)]'
                }`}>
                  <div className={`w-2 h-8 rounded-full shrink-0 ${
                    ev.label === '접수' ? 'bg-blue-500' : ev.label === '시험' ? 'bg-red-500' : 'bg-emerald-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-medium text-charcoal">{ev.type} {ev.label}</span>
                      {statusBadge}
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                      {ev.date}{ev.dateEnd ? ` ~ ${ev.dateEnd}` : ''}
                    </p>
                  </div>
                  {ev.status === 'ongoing' && ev.label === '접수' && (
                    <SiteButton certName={ev.certName} type="register" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {/* 달력 (2/3) */}
        <div className="md:col-span-2 bg-cream-white rounded-[20px] p-5 card-shadow">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setCalMonth((p) => {
              const d = new Date(p.year, p.month - 1);
              return { year: d.getFullYear(), month: d.getMonth() };
            })} className="p-1.5 rounded-lg hover:bg-cream-dark">
              <svg className="w-5 h-5 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-charcoal">
                {calMonth.year}년 {MONTHS[calMonth.month]}
              </h3>
              <button onClick={() => {
                const now = new Date();
                setCalMonth({ year: now.getFullYear(), month: now.getMonth() });
              }} className="text-[10px] px-2 py-0.5 bg-cream-dark hover:bg-cream-dark rounded-full text-[var(--text-secondary)]">
                오늘
              </button>
            </div>
            <button onClick={() => setCalMonth((p) => {
              const d = new Date(p.year, p.month + 1);
              return { year: d.getFullYear(), month: d.getMonth() };
            })} className="p-1.5 rounded-lg hover:bg-cream-dark">
              <svg className="w-5 h-5 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          <div className="grid grid-cols-7 gap-0.5 mb-1">
            {DAY_NAMES.map((d) => (
              <div key={d} className="text-center text-xs font-medium text-[var(--text-tertiary)] py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-0.5">
            {generateCalendar()}
          </div>

          <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-[rgba(26,26,26,0.04)]">
            <span className="flex items-center gap-1 text-[10px] text-[var(--text-secondary)]">
              <span className="w-2.5 h-2.5 rounded bg-blue-500" /> 접수
            </span>
            <span className="flex items-center gap-1 text-[10px] text-[var(--text-secondary)]">
              <span className="w-2.5 h-2.5 rounded bg-red-500" /> 시험
            </span>
            <span className="flex items-center gap-1 text-[10px] text-[var(--text-secondary)]">
              <span className="w-2.5 h-2.5 rounded bg-emerald-500" /> 발표
            </span>
          </div>
        </div>

        {/* 자격증 관리 (1/3) */}
        <div className="space-y-4">
          {/* 자격증 검색 */}
          <div className="bg-cream-white rounded-[20px] p-5 card-shadow">
            <h3 className="font-bold text-sm text-charcoal mb-3">자격증 추가</h3>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="자격증 검색 (예: 정보처리기사)"
              className="w-full px-3 py-2.5 rounded-xl border border-[rgba(26,26,26,0.06)] bg-cream-light text-sm text-charcoal placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-sky/40"
            />
            {searchResults.length > 0 && (
              <div className="mt-2 space-y-1">
                {searchResults.map((cert) => (
                  <button key={cert.id} onClick={() => { toggleMyCert(cert.name); setSearchQuery(''); }}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-cream-light text-left">
                    <span className="text-sm text-charcoal">{cert.name}</span>
                    {myCerts.includes(cert.name) ? (
                      <span className="text-xs text-sky-deep">추가됨 ✓</span>
                    ) : (
                      <span className="text-xs text-[var(--text-tertiary)]">+ 추가</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 내 관심 자격증 */}
          <div className="bg-cream-white rounded-[20px] p-5 card-shadow">
            <h3 className="font-bold text-sm text-charcoal mb-3">내 관심 자격증</h3>
            {myCerts.length > 0 ? (
              <div className="space-y-2">
                {myCerts.map((name) => {
                  const nextEvent = events.find((e) => e.certName.includes(name) && e.dDay >= 0);
                  const ongoingReg = events.find((e) => e.certName.includes(name) && e.label === '접수' && e.status === 'ongoing');
                  return (
                    <div key={name} className={`p-2.5 rounded-lg ${ongoingReg ? 'bg-blue-50 border border-blue-200' : 'bg-cream-light'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setExpandedCert(name)}>
                          <p className="text-sm font-medium text-charcoal truncate">{name}</p>
                          {ongoingReg ? (
                            <p className="text-xs text-blue-600 font-medium mt-0.5 flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                              </svg>
                              원서접수 진행중!
                            </p>
                          ) : nextEvent ? (
                            <p className={`text-xs mt-0.5 ${dDayColor(nextEvent.dDay)}`}>
                              다음: {nextEvent.label} D-{nextEvent.dDay} ({nextEvent.date})
                            </p>
                          ) : null}
                        </div>
                        <div className="flex items-center gap-1 ml-2 shrink-0">
                          {ongoingReg && <SiteButton certName={name} type="register" />}
                          <button onClick={() => toggleMyCert(name)}
                            className="text-xs text-red-400 hover:text-red-600 p-1">
                            ✕
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-[var(--text-tertiary)] text-center py-4">
                위에서 관심 자격증을 추가하세요!
              </p>
            )}
          </div>

          {/* 전체 자격증 목록 */}
          <div className="bg-cream-white rounded-[20px] p-5 card-shadow">
            <h3 className="font-bold text-sm text-charcoal mb-3">
              등록된 자격증 ({certs.length}개)
            </h3>
            <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
              {certs.map((cert) => (
                <button key={cert.id} onClick={() => toggleMyCert(cert.name)}
                  className={`w-full text-left p-2.5 rounded-lg text-sm transition-all ${
                    myCerts.includes(cert.name)
                      ? 'bg-sky/5 text-sky-deep font-medium'
                      : 'hover:bg-cream-light text-[var(--text-secondary)]'
                  }`}>
                  <div className="flex items-center justify-between">
                    <span className="truncate">{cert.name}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      {myCerts.includes(cert.name) && <span className="text-xs">✓</span>}
                      <span className="text-[10px] text-[var(--text-tertiary)]" onClick={(e) => {
                        e.stopPropagation();
                        setExpandedCert(cert.name);
                      }}>상세</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
