// src/components/common/Header.tsx — 상단 헤더 (Joby Aviation 스타일)
'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  userName: string;
  notifications?: number;
}

// 자격증 사이트 매핑
const CERT_SITES: Record<string, { register: string; result: string }> = {
  '정보처리기사': { register: 'https://www.q-net.or.kr/crf005.do?id=crf00503&jmCd=1320', result: 'https://www.q-net.or.kr/crf006.do?id=crf00601&gSite=Q&gId=' },
  '정보처리산업기사': { register: 'https://www.q-net.or.kr/crf005.do?id=crf00503&jmCd=2290', result: 'https://www.q-net.or.kr/crf006.do?id=crf00601&gSite=Q&gId=' },
  '정보보안기사': { register: 'https://www.cq.or.kr/qh_quagm01_010.do', result: 'https://www.cq.or.kr/qh_quagm01_015.do' },
  '웹디자인기능사': { register: 'https://www.q-net.or.kr/crf005.do?id=crf00503&jmCd=7910', result: 'https://www.q-net.or.kr/crf006.do?id=crf00601&gSite=Q&gId=' },
  'SQLD (SQL 개발자)': { register: 'https://www.dataq.or.kr/www/accept/schedule.do', result: 'https://www.dataq.or.kr/www/mypage/gate.do' },
  'ADsP (데이터분석 준전문가)': { register: 'https://www.dataq.or.kr/www/accept/schedule.do', result: 'https://www.dataq.or.kr/www/mypage/gate.do' },
  'SQLP (SQL 전문가)': { register: 'https://www.dataq.or.kr/www/accept/schedule.do', result: 'https://www.dataq.or.kr/www/mypage/gate.do' },
  'ADP (데이터분석 전문가)': { register: 'https://www.dataq.or.kr/www/accept/schedule.do', result: 'https://www.dataq.or.kr/www/mypage/gate.do' },
  '빅데이터분석기사': { register: 'https://www.dataq.or.kr/www/accept/schedule.do', result: 'https://www.dataq.or.kr/www/mypage/gate.do' },
  '리눅스마스터 2급': { register: 'https://www.ihd.or.kr/memaccept2.do', result: 'https://www.ihd.or.kr/memgrade.do' },
  '리눅스마스터 1급': { register: 'https://www.ihd.or.kr/memaccept1.do', result: 'https://www.ihd.or.kr/memgrade.do' },
  '네트워크관리사 2급': { register: 'https://www.icqa.or.kr/cn/page/network', result: 'https://www.icqa.or.kr/cn/page/network' },
  '한국사능력검정시험': { register: 'https://www.historyexam.go.kr', result: 'https://www.historyexam.go.kr' },
};

interface CertAlert {
  name: string;
  type: 'register' | 'upcoming_reg' | 'exam_soon' | 'result';
  detail: string;
  dDay: number;
  url?: string;
}

function getDDay(dateStr: string): number {
  const target = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export default function Header({ userName, notifications = 0 }: HeaderProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifTab, setNotifTab] = useState<'notif' | 'cert'>('cert');
  const [notifList, setNotifList] = useState<any[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [certAlerts, setCertAlerts] = useState<CertAlert[]>([]);
  const [certLoading, setCertLoading] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  async function loadNotifications() {
    setNotifLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    setNotifList(data || []);
    setNotifLoading(false);
  }

  const loadCertAlerts = useCallback(async () => {
    setCertLoading(true);
    const { data: certSchedules } = await supabase
      .from('certifications')
      .select('id, name, exam_dates')
      .not('exam_dates', 'is', null);

    const alerts: CertAlert[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentYear = String(today.getFullYear());

    certSchedules?.forEach((cert) => {
      const examDates = cert.exam_dates as any;
      if (!examDates || typeof examDates !== 'object') return;
      const site = CERT_SITES[cert.name];

      const yearData = examDates[currentYear];
      if (!yearData || !Array.isArray(yearData)) return;

      for (const schedule of yearData) {
        if (schedule['접수']) {
          const dates = schedule['접수'].match(/(\d{4}-\d{2}-\d{2})/g);
          if (dates && dates.length >= 2) {
            const regStartD = getDDay(dates[0]);
            const regEndD = getDDay(dates[1]);
            if (regStartD <= 0 && regEndD >= 0) {
              alerts.push({ name: cert.name, type: 'register', detail: `${schedule.type || ''} 접수중 (${dates[1]}까지)`, dDay: regEndD, url: site?.register });
            } else if (regStartD > 0 && regStartD <= 7) {
              alerts.push({ name: cert.name, type: 'upcoming_reg', detail: `${schedule.type || ''} 접수 시작 D-${regStartD}`, dDay: regStartD, url: site?.register });
            }
          }
        }
        if (schedule['시험']) {
          const dates = schedule['시험'].match(/(\d{4}-\d{2}-\d{2})/g);
          if (dates) {
            const examD = getDDay(dates[0]);
            if (examD > 0 && examD <= 14) {
              alerts.push({ name: cert.name, type: 'exam_soon', detail: `${schedule.type || ''} 시험 D-${examD}`, dDay: examD });
            }
          }
        }
        if (schedule['발표']) {
          const dates = schedule['발표'].match(/(\d{4}-\d{2}-\d{2})/g);
          if (dates) {
            const resultD = getDDay(dates[0]);
            if (resultD >= 0 && resultD <= 3) {
              alerts.push({ name: cert.name, type: 'result', detail: resultD === 0 ? `${schedule.type || ''} 오늘 발표!` : `${schedule.type || ''} 발표 D-${resultD}`, dDay: resultD, url: site?.result });
            }
          }
        }
      }
    });

    alerts.sort((a, b) => a.dDay - b.dDay);
    setCertAlerts(alerts);
    setCertLoading(false);
  }, [supabase]);

  useEffect(() => {
    loadCertAlerts();
  }, [loadCertAlerts]);

  async function markAllRead() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    setNotifList((prev) => prev.map((n) => ({ ...n, is_read: true })));
    router.refresh();
  }

  function handleNotifClick() {
    setShowNotifications(!showNotifications);
    setShowMenu(false);
    if (!showNotifications) {
      loadNotifications();
      loadCertAlerts();
    }
  }

  async function handleNotifItemClick(notif: any) {
    if (!notif.is_read) {
      await supabase.from('notifications').update({ is_read: true }).eq('id', notif.id);
      setNotifList((prev) => prev.map((n) => n.id === notif.id ? { ...n, is_read: true } : n));
      router.refresh();
    }
    setShowNotifications(false);

    const type = notif.type || '';
    const meta = notif.metadata || {};
    if (type === 'JOB_ANALYSIS' && meta.analysisId) router.push(`/career/${meta.analysisId}`);
    else if (type === 'FEEDBACK' && meta.documentId) router.push(`/coach/${meta.documentId}`);
    else if (type === 'CONSULTATION' || type === 'CONSULT_REQUEST') router.push('/consultation');
    else if (type === 'CERT_REMINDER') router.push('/certs');
    else if (type === 'RISK_ALERT') router.push('/admin/alerts');
    else if (type === 'STREAK') router.push('/learning');
    else if (type === 'EMOTION') router.push('/learning');
    else router.push('/dashboard');
  }

  const alertIconPath = (type: string) => {
    switch (type) {
      case 'register': return 'M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25';
      case 'upcoming_reg': return 'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z';
      case 'exam_soon': return 'M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10';
      case 'result': return 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
      default: return 'M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z';
    }
  };

  const alertColor = (type: string) => {
    switch (type) {
      case 'register': return 'bg-sky/5 border-sky/20 text-sky-deep';
      case 'upcoming_reg': return 'bg-earth/5 border-earth/20 text-earth';
      case 'exam_soon': return 'bg-red-50 border-red-200 text-red-800';
      case 'result': return 'bg-emerald-50 border-emerald-200 text-emerald-800';
      default: return 'bg-cream border-[rgba(26,26,26,0.08)] text-charcoal';
    }
  };

  const alertBtnColor = (type: string) => {
    switch (type) {
      case 'register': case 'upcoming_reg': return 'bg-sky-deep hover:bg-sky text-white';
      case 'result': return 'bg-emerald-600 hover:bg-emerald-700 text-white';
      default: return 'bg-charcoal hover:bg-charcoal/80 text-white';
    }
  };

  const totalAlerts = notifications + certAlerts.length;

  return (
    <header className="h-14 bg-cream-white border-b border-[rgba(26,26,26,0.08)] px-6 flex items-center justify-between sticky top-0 z-40">
      <div>
        <h2 className="text-sm font-medium text-[var(--text-tertiary)]">
          안녕하세요, <span className="text-charcoal font-semibold">{userName}</span>님
        </h2>
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={handleNotifClick}
            aria-label="알림"
            className="relative p-2 rounded-xl hover:bg-cream-dark transition-colors"
          >
            <svg className="w-5 h-5 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {(notifications > 0 || certAlerts.length > 0) && (
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                {notifications > 9 ? '9+' : notifications > 0 ? notifications : certAlerts.length > 9 ? '9+' : certAlerts.length}
              </span>
            )}
          </button>

          {/* Notification Panel */}
          {showNotifications && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowNotifications(false)} />
              <div className="absolute right-0 mt-2 w-96 bg-cream-white rounded-[20px] card-shadow border border-[rgba(26,26,26,0.06)] z-40 overflow-hidden">
                {/* 탭 헤더 */}
                <div className="flex border-b border-[rgba(26,26,26,0.06)]">
                  <button
                    onClick={() => setNotifTab('cert')}
                    className={`flex-1 px-4 py-3 text-sm font-medium transition-colors relative ${
                      notifTab === 'cert' ? 'text-sky-deep' : 'text-[var(--text-tertiary)] hover:text-charcoal'
                    }`}
                  >
                    자격증 알림
                    {certAlerts.length > 0 && (
                      <span className="ml-1 px-1.5 py-0.5 text-[10px] rounded-full bg-red-100 text-red-600 font-bold">
                        {certAlerts.length}
                      </span>
                    )}
                    {notifTab === 'cert' && <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-sky-deep rounded-full" />}
                  </button>
                  <button
                    onClick={() => setNotifTab('notif')}
                    className={`flex-1 px-4 py-3 text-sm font-medium transition-colors relative ${
                      notifTab === 'notif' ? 'text-sky-deep' : 'text-[var(--text-tertiary)] hover:text-charcoal'
                    }`}
                  >
                    알림
                    {notifications > 0 && (
                      <span className="ml-1 px-1.5 py-0.5 text-[10px] rounded-full bg-red-100 text-red-600 font-bold">
                        {notifications}
                      </span>
                    )}
                    {notifTab === 'notif' && <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-sky-deep rounded-full" />}
                  </button>
                </div>

                {/* 자격증 알림 탭 */}
                {notifTab === 'cert' && (
                  <div className="max-h-96 overflow-y-auto">
                    {certLoading ? (
                      <div className="p-6 text-center text-sm text-[var(--text-tertiary)]">로딩 중...</div>
                    ) : certAlerts.length > 0 ? (
                      <div className="p-2 space-y-2">
                        {certAlerts.map((alert, i) => (
                          <div
                            key={i}
                            className={`p-3 rounded-xl border text-sm ${alertColor(alert.type)}`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-1.5">
                                  <svg className="w-4 h-4 shrink-0 opacity-70" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d={alertIconPath(alert.type)} /></svg>
                                  <span className="font-bold">{alert.name}</span>
                                </div>
                                <p className="text-xs mt-1 opacity-80">{alert.detail}</p>
                              </div>
                              <div className="flex flex-col gap-1 shrink-0">
                                {alert.url && (
                                  <a
                                    href={alert.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold text-center transition-colors ${alertBtnColor(alert.type)}`}
                                  >
                                    {alert.type === 'register' || alert.type === 'upcoming_reg' ? '원서접수 →' : '결과확인 →'}
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                        <button
                          onClick={() => { setShowNotifications(false); router.push('/certs'); }}
                          className="w-full py-2.5 text-center text-xs text-sky-deep hover:text-sky font-medium hover:bg-cream-dark rounded-lg transition-colors"
                        >
                          자격증 일정 전체 보기 →
                        </button>
                      </div>
                    ) : (
                      <div className="p-8 text-center">
                        <svg className="w-8 h-8 mx-auto mb-2 text-[var(--text-tertiary)] opacity-40" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25" /></svg>
                        <p className="text-sm text-[var(--text-tertiary)]">임박한 자격증 일정이 없습니다</p>
                        <button
                          onClick={() => { setShowNotifications(false); router.push('/certs'); }}
                          className="mt-2 text-xs text-sky-deep hover:text-sky font-medium"
                        >
                          자격증 일정 보기 →
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* 일반 알림 탭 */}
                {notifTab === 'notif' && (
                  <>
                    {notifList.some((n) => !n.is_read) && (
                      <div className="flex justify-end px-4 py-2 border-b border-[rgba(26,26,26,0.04)]">
                        <button
                          onClick={markAllRead}
                          className="text-xs text-sky-deep hover:text-sky"
                        >
                          모두 읽음
                        </button>
                      </div>
                    )}
                    <div className="max-h-80 overflow-y-auto">
                      {notifLoading ? (
                        <div className="p-6 text-center text-sm text-[var(--text-tertiary)]">로딩 중...</div>
                      ) : notifList.length > 0 ? (
                        notifList.map((notif) => (
                          <button
                            key={notif.id}
                            onClick={() => handleNotifItemClick(notif)}
                            className={`w-full text-left px-4 py-3 border-b border-[rgba(26,26,26,0.04)] hover:bg-cream-dark transition-colors ${
                              !notif.is_read ? 'bg-sky/5' : ''
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              {!notif.is_read && (
                                <div className="w-2 h-2 rounded-full bg-sky mt-1.5 shrink-0" />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-charcoal">{notif.title}</p>
                                <p className="text-xs text-[var(--text-secondary)] mt-0.5 line-clamp-2">{notif.content}</p>
                                <p className="text-[10px] text-[var(--text-tertiary)] mt-1">
                                  {new Date(notif.created_at).toLocaleDateString('ko-KR', {
                                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                  })}
                                </p>
                              </div>
                              <svg className="w-4 h-4 text-[var(--text-tertiary)] mt-1 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="p-8 text-center">
                          <svg className="w-8 h-8 mx-auto mb-2 text-[var(--text-tertiary)] opacity-40" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg>
                          <p className="text-sm text-[var(--text-tertiary)]">새로운 알림이 없습니다</p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>

        {/* Profile Menu */}
        <div className="relative">
          <button
            onClick={() => { setShowMenu(!showMenu); setShowNotifications(false); }}
            aria-label="사용자 메뉴"
            className="w-9 h-9 rounded-full bg-sky/10 text-sky-deep flex items-center justify-center font-bold text-sm hover:ring-2 hover:ring-sky/20 transition-all"
          >
            {userName.charAt(0)}
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 mt-2 w-48 bg-cream-white rounded-xl card-shadow border border-[rgba(26,26,26,0.06)] py-2 z-40">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  로그아웃
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
