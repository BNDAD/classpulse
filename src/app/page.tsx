'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import './landing.css';

export default function LandingPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [navScrolled, setNavScrolled] = useState(false);
  const [preloaderDone, setPreloaderDone] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const totalSlides = 6;

  // Preloader
  useEffect(() => {
    const timer = setTimeout(() => setPreloaderDone(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  // Nav scroll
  useEffect(() => {
    const handleScroll = () => {
      setNavScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll reveal
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );

    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Carousel auto-slide
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Stat counter
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target as HTMLElement;
          const text = el.textContent || '';
          const match = text.match(/[\d,]+/);
          if (!match) return;

          const suffix = text.replace(match[0], '');
          const target = parseInt(match[0].replace(/,/g, ''));
          const start = performance.now();

          const animate = (now: number) => {
            const p = Math.min((now - start) / 1500, 1);
            const ease = 1 - Math.pow(1 - p, 3);
            const cur = Math.floor(target * ease);
            el.textContent =
              (target >= 1000 ? cur.toLocaleString() : cur) + suffix;
            if (p < 1) requestAnimationFrame(animate);
            else el.textContent = text;
          };

          animate(start);
          observer.unobserve(el);
        });
      },
      { threshold: 0.5 }
    );

    document.querySelectorAll('.stat-value').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [preloaderDone]);

  const goSlide = (n: number) => {
    setCurrentSlide(n);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev + totalSlides - 1) % totalSlides);
  };

  const handleDemoLogin = async (email: string) => {
    setLoading(email);
    setError(null);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password: process.env.NEXT_PUBLIC_DEMO_PASSWORD || 'classpulse2024!',
      });
      if (authError) throw authError;
      router.push('/dashboard');
    } catch (e: any) {
      setError(e.message || '로그인에 실패했습니다.');
    } finally {
      setLoading(null);
    }
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
    if (!menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  };

  const closeMenu = () => {
    setMenuOpen(false);
    document.body.style.overflow = '';
  };

  return (
    <>
      {/* PRELOADER */}
      <div className={`preloader ${preloaderDone ? 'done' : ''}`}>
        <div className="preloader-mark">CP</div>
        <div className="preloader-word">ClassPulse</div>
        <div className="preloader-line"></div>
      </div>

{/* NAV */}
      <nav className={`nav ${navScrolled ? 'scrolled' : ''}`}>
        <div className="container">
          <div className="nav-inner">
            <a className="nav-logo" href="#">
              <div className="nav-logo-mark">CP</div>
              <span className="nav-logo-text">ClassPulse</span>
            </a>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <button
                className="nav-cta"
                onClick={() => {
                  const el = document.getElementById('cta');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                데모 체험하기
              </button>
              <button
                className={`nav-menu-btn ${menuOpen ? 'open' : ''}`}
                onClick={toggleMenu}
              >
                <span></span>
                <span></span>
                <span></span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className={`nav-overlay ${menuOpen ? 'open' : ''}`}>
        <ul className="nav-overlay-links">
          <li>
            <a href="#features" onClick={closeMenu}>
              기능
            </a>
          </li>
          <li>
            <a href="#preview" onClick={closeMenu}>
              미리보기
            </a>
          </li>
          <li>
            <a href="#stats" onClick={closeMenu}>
              성과
            </a>
          </li>
          <li>
            <a href="#how" onClick={closeMenu}>
              작동 방식
            </a>
          </li>
          <li>
            <a href="#cta" onClick={closeMenu}>
              시작하기
            </a>
          </li>
        </ul>
      </div>

      {/* HERO */}
      <section className="hero">
        <div className="hero-bg">
          <div className="hero-orb hero-orb-1"></div>
          <div className="hero-orb hero-orb-2"></div>
          <div className="hero-orb hero-orb-3"></div>
        </div>
        <div className="container">
          <div className="hero-content">
            <div className="hero-label">
              <div className="hero-label-dot"></div>
              AI 기반 차세대 교육 솔루션
            </div>
            <h1 className="hero-title">
              <span className="line">
                <span className="line-inner">교육의 맥박을</span>
              </span>
              <span className="line">
                <span className="line-inner">읽는 AI,</span>
              </span>
              <span className="line">
                <span className="line-inner accent">ClassPulse</span>
              </span>
            </h1>
            <p className="hero-desc">
              멘토 업무의 80%를 AI가 대체하고, 학생 이탈을 사전에 방지하며, Human Touch AI로 취업 문서를 코칭합니다.
            </p>
            <div className="hero-actions">
              <button
                className="btn btn-primary"
                onClick={() => handleDemoLogin(process.env.NEXT_PUBLIC_DEMO_STUDENT_EMAIL || 'student@classpulse.demo')}
                disabled={loading !== null}
              >
                학생 체험하기 <span className="btn-arrow">&rarr;</span>
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => handleDemoLogin(process.env.NEXT_PUBLIC_DEMO_ADMIN_EMAIL || 'admin@classpulse.demo')}
                disabled={loading !== null}
              >
                관리자 체험하기 <span className="btn-arrow">&rarr;</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="features-section" id="features">
        <div className="container">
          <div className="features-header">
            <div className="section-label reveal">FEATURES</div>
            <h2 className="section-heading reveal reveal-d1">세 가지 핵심 엔진</h2>
            <p className="section-desc reveal reveal-d2">학생의 학습 여정 전체를 AI가 지원합니다</p>
          </div>
          <div className="features-grid">
            <div className="feature-card reveal reveal-d1">
              <div className="f-icon sky">
                <svg
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.8"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                  />
                </svg>
              </div>
              <h3>AI 캐리어 파일럿</h3>
              <p>
                URL 하나로 기업 분석 완료. 채용공고에서 필요한 역량, 면접 질문, 포트폴리오 가이드를
                3분 만에 생성합니다.
              </p>
              <a href="#" className="learn-more">
                자세히 보기 <span className="btn-arrow">&rarr;</span>
              </a>
            </div>

            <div className="feature-card reveal reveal-d2">
              <div className="f-icon warm">
                <svg
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.8"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                  />
                </svg>
              </div>
              <h3>학습 이탈 방지 엔진</h3>
              <p>
                출석, 과제, 감정 데이터를 심박수처럼 모니터링. 위험 신호를 조기에 감지하여 멘토에게
                자동 알림합니다.
              </p>
              <a href="#" className="learn-more">
                자세히 보기 <span className="btn-arrow">&rarr;</span>
              </a>
            </div>

            <div className="feature-card reveal reveal-d3">
              <div className="f-icon green">
                <svg
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.8"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                  />
                </svg>
              </div>
              <h3>AI 문서 코치</h3>
              <p>
                자기소개서, 포트폴리오, 이력서를 AI가 분석하고 멘토가 최종 확인. 기계 냄새 없는 Human
                Touch 피드백.
              </p>
              <a href="#" className="learn-more">
                자세히 보기 <span className="btn-arrow">&rarr;</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* PREVIEW — 3-SCREEN CAROUSEL */}
      <section className="preview-section" id="preview">
        <div className="container">
          <div className="preview-header">
            <div className="section-label reveal">PREVIEW</div>
            <h2 className="section-heading reveal reveal-d1">한눈에 보는 ClassPulse</h2>
            <p className="section-desc reveal reveal-d2">
              대시보드, 커리어 분석, AI 코칭 화면을 슬라이드로 확인하세요
            </p>
          </div>

          <div className="carousel-tabs reveal reveal-d3">
            {['대시보드', '커리어 분석', 'AI 문서 코치', '학습 현황', '기술 트렌드', '상담 예약'].map(
              (tab, idx) => (
                <div
                  key={idx}
                  className={`carousel-tab ${currentSlide === idx ? 'active' : ''}`}
                  onClick={() => goSlide(idx)}
                >
                  {tab}
                </div>
              )
            )}
          </div>

          <div className="carousel-wrapper reveal reveal-d4">
            {/* Arrows */}
            <div className="carousel-arrow left" onClick={prevSlide}>
              <svg viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </div>
            <div className="carousel-arrow right" onClick={nextSlide}>
              <svg viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>

            <div
              className="carousel-track"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {/* SLIDE 1: 대시보드 */}
              <div className="carousel-slide">
                <div className="carousel-frame">
                  <div className="carousel-titlebar">
                    <div className="cdot cdot-r"></div>
                    <div className="cdot cdot-y"></div>
                    <div className="cdot cdot-g"></div>
                    <div className="carousel-url">classpulse.vercel.app/dashboard</div>
                  </div>
                  <div className="prev-body">
                    <div className="prev-sidebar">
                      <div className="prev-sb-logo">
                        <div className="prev-sb-icon">CP</div>
                        <span className="prev-sb-name">ClassPulse</span>
                      </div>
                      <div className="prev-sb-item active">
                        <svg
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <rect x="3" y="3" width="7" height="7" rx="1" />
                          <rect x="14" y="3" width="7" height="7" rx="1" />
                          <rect x="3" y="14" width="7" height="7" rx="1" />
                          <rect x="14" y="14" width="7" height="7" rx="1" />
                        </svg>
                        대시보드
                      </div>
                      <div className="prev-sb-item">
                        <svg
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <circle cx="12" cy="12" r="9" />
                          <path d="M12 7v5l3 3" />
                        </svg>
                        커리어 파일럿
                      </div>
                      <div className="prev-sb-item">
                        <svg
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                        </svg>
                        학습 현황
                      </div>
                      <div className="prev-sb-item">
                        <svg
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                        </svg>
                        문서 코치
                      </div>
                      <div className="prev-sb-item">
                        <svg
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <rect x="3" y="4" width="18" height="18" rx="2" />
                          <path d="M16 2v4M8 2v4M3 10h18" />
                        </svg>
                        상담 예약
                      </div>
                      <div className="prev-sb-item">
                        <svg
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        기술 트렌드
                      </div>
                    </div>
                    <div className="prev-main">
                      <div className="prev-welcome">
                        <h2 style={{ color: '#fff' }}>반갑습니다, 김학생님!</h2>
                        <p>웹 개발 마스터 과정 수강 중 · 15주차</p>
                      </div>
                      <div className="prev-cards">
                        <div className="prev-card">
                          <div className="prev-card-top">
                            <div
                              className="prev-card-icon"
                              style={{ background: 'rgba(184,155,113,.15)' }}
                            >
                              <svg
                                width="14"
                                height="14"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="#B89B71"
                                strokeWidth="2"
                              >
                                <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                            </div>
                            학습 스트릭
                          </div>
                          <div className="prev-big-num" style={{ color: '#D4BC96' }}>
                            12
                          </div>
                          <div className="prev-big-sub">연속 학습일 · 최장 28일</div>
                        </div>

                        <div className="prev-card">
                          <div className="prev-card-top">
                            <div
                              className="prev-card-icon"
                              style={{ background: 'rgba(74,144,217,.12)' }}
                            >
                              <svg
                                width="14"
                                height="14"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="#4A90D9"
                                strokeWidth="2"
                              >
                                <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                              </svg>
                            </div>
                            최근 알림
                          </div>
                          <div className="prev-notif blue">
                            멘토 피드백 도착
                            <div className="prev-notif-sub">
                              자기소개서 수정본이 도착했습니다
                            </div>
                          </div>
                          <div className="prev-notif amber">
                            정보처리기사 접수 D-3
                            <div className="prev-notif-sub">원서접수 마감이 임박합니다</div>
                          </div>
                        </div>

                        <div className="prev-card">
                          <div className="prev-card-top">
                            <div
                              className="prev-card-icon"
                              style={{ background: 'rgba(74,172,133,.12)' }}
                            >
                              <svg
                                width="14"
                                height="14"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="#4AAC85"
                                strokeWidth="2"
                              >
                                <path strokeLinecap="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path
                                  strokeLinecap="round"
                                  d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                                />
                              </svg>
                            </div>
                            채용공고 분석
                          </div>
                          <div className="prev-row">
                            <span>네이버</span>
                            <span className="prev-score">87%</span>
                          </div>
                          <div className="prev-row">
                            <span>카카오</span>
                            <span className="prev-score">72%</span>
                          </div>
                          <div className="prev-row">
                            <span>토스</span>
                            <span className="prev-score">65%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* SLIDE 2: 커리어 분석 */}
              <div className="carousel-slide">
                <div className="carousel-frame">
                  <div className="carousel-titlebar">
                    <div className="cdot cdot-r"></div>
                    <div className="cdot cdot-y"></div>
                    <div className="cdot cdot-g"></div>
                    <div className="carousel-url">classpulse.vercel.app/career</div>
                  </div>
                  <div className="prev-body">
                    <div className="prev-sidebar">
                      <div className="prev-sb-logo">
                        <div className="prev-sb-icon">CP</div>
                        <span className="prev-sb-name">ClassPulse</span>
                      </div>
                      <div className="prev-sb-item">
                        <svg
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <rect x="3" y="3" width="7" height="7" rx="1" />
                          <rect x="14" y="3" width="7" height="7" rx="1" />
                          <rect x="3" y="14" width="7" height="7" rx="1" />
                          <rect x="14" y="14" width="7" height="7" rx="1" />
                        </svg>
                        대시보드
                      </div>
                      <div className="prev-sb-item active">
                        <svg
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <circle cx="12" cy="12" r="9" />
                          <path d="M12 7v5l3 3" />
                        </svg>
                        커리어 파일럿
                      </div>
                      <div className="prev-sb-item">
                        <svg
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                        </svg>
                        학습 현황
                      </div>
                      <div className="prev-sb-item">
                        <svg
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                        </svg>
                        문서 코치
                      </div>
                      <div className="prev-sb-item">
                        <svg
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <rect x="3" y="4" width="18" height="18" rx="2" />
                          <path d="M16 2v4M8 2v4M3 10h18" />
                        </svg>
                        상담 예약
                      </div>
                      <div className="prev-sb-item">
                        <svg
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        기술 트렌드
                      </div>
                    </div>
                    <div className="prev-main">
                      <div className="prev-career-hero">
                        <h2>채용공고 URL을 입력하세요</h2>
                        <div className="prev-url-input">
                          <div className="prev-url-bar">
                            https://recruit.navercorp.com/rcrt/view...
                          </div>
                          <div className="prev-url-btn">분석하기</div>
                        </div>
                      </div>
                      <div className="prev-analysis-grid">
                        <div className="prev-analysis-card">
                          <h4>기술 적합도</h4>
                          <div className="prev-bar-row">
                            <div className="prev-bar-label">React</div>
                            <div className="prev-bar-track">
                              <div
                                className="prev-bar-fill"
                                style={{
                                  width: '92%',
                                  background: 'var(--sky)',
                                }}
                              ></div>
                            </div>
                            <div className="prev-bar-val">92%</div>
                          </div>
                          <div className="prev-bar-row">
                            <div className="prev-bar-label">TypeScript</div>
                            <div className="prev-bar-track">
                              <div
                                className="prev-bar-fill"
                                style={{
                                  width: '85%',
                                  background: 'var(--sky)',
                                }}
                              ></div>
                            </div>
                            <div className="prev-bar-val">85%</div>
                          </div>
                          <div className="prev-bar-row">
                            <div className="prev-bar-label">Node.js</div>
                            <div className="prev-bar-track">
                              <div
                                className="prev-bar-fill"
                                style={{
                                  width: '78%',
                                  background: 'var(--sky-light)',
                                }}
                              ></div>
                            </div>
                            <div className="prev-bar-val">78%</div>
                          </div>
                          <div className="prev-bar-row">
                            <div className="prev-bar-label">AWS</div>
                            <div className="prev-bar-track">
                              <div
                                className="prev-bar-fill"
                                style={{
                                  width: '45%',
                                  background: 'var(--earth)',
                                }}
                              ></div>
                            </div>
                            <div className="prev-bar-val">45%</div>
                          </div>
                        </div>

                        <div className="prev-analysis-card">
                          <h4>보유 기술 매칭</h4>
                          <div style={{ marginTop: '4px' }}>
                            <span className="prev-tag match">React</span>
                            <span className="prev-tag match">TypeScript</span>
                            <span className="prev-tag match">Next.js</span>
                            <span className="prev-tag match">Node.js</span>
                            <span className="prev-tag miss">AWS</span>
                            <span className="prev-tag miss">Docker</span>
                            <span className="prev-tag miss">Kubernetes</span>
                          </div>
                          <div
                            style={{
                              marginTop: '16px',
                              padding: '12px',
                              background: 'rgba(74,144,217,.08)',
                              borderRadius: '10px',
                            }}
                          >
                            <div
                              style={{
                                fontSize: '11px',
                                fontWeight: '700',
                                color: 'var(--sky)',
                                marginBottom: '4px',
                              }}
                            >
                              종합 적합도
                            </div>
                            <div
                              style={{
                                fontSize: '32px',
                                fontWeight: '900',
                                color: 'var(--text-primary)',
                                letterSpacing: '-1px',
                              }}
                            >
                              87%
                            </div>
                          </div>
                        </div>

                        <div className="prev-analysis-card">
                          <h4>예상 면접 질문</h4>
                          <div
                            style={{
                              padding: '8px 12px',
                              background: 'var(--cream-light)',
                              borderRadius: '8px',
                              marginBottom: '6px',
                              fontSize: '11px',
                              color: 'var(--text-secondary)',
                              lineHeight: '1.5',
                            }}
                          >
                            Q. React에서 상태관리 방식의 선택 기준은?
                          </div>
                          <div
                            style={{
                              padding: '8px 12px',
                              background: 'var(--cream-light)',
                              borderRadius: '8px',
                              marginBottom: '6px',
                              fontSize: '11px',
                              color: 'var(--text-secondary)',
                              lineHeight: '1.5',
                            }}
                          >
                            Q. TypeScript 도입 시 생산성 변화 경험은?
                          </div>
                          <div
                            style={{
                              padding: '8px 12px',
                              background: 'var(--cream-light)',
                              borderRadius: '8px',
                              fontSize: '11px',
                              color: 'var(--text-secondary)',
                              lineHeight: '1.5',
                            }}
                          >
                            Q. 대규모 트래픽 대응 경험이 있나요?
                          </div>
                        </div>

                        <div className="prev-analysis-card">
                          <h4>포트폴리오 가이드</h4>
                          <div
                            style={{
                              padding: '8px 12px',
                              background: 'rgba(74,172,133,.08)',
                              borderRadius: '8px',
                              marginBottom: '6px',
                              fontSize: '11px',
                              color: 'rgba(74,172,133,.7)',
                              lineHeight: '1.5',
                              borderLeft: '2px solid rgba(74,172,133,.4)',
                            }}
                          >
                            SSR/SSG 최적화 프로젝트를 포함하면 어필 가능
                          </div>
                          <div
                            style={{
                              padding: '8px 12px',
                              background: 'rgba(74,172,133,.08)',
                              borderRadius: '8px',
                              fontSize: '11px',
                              color: 'rgba(74,172,133,.7)',
                              lineHeight: '1.5',
                              borderLeft: '2px solid rgba(74,172,133,.4)',
                            }}
                          >
                            CI/CD 파이프라인 구축 경험을 강조하세요
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* SLIDE 3: AI 문서 코치 */}
              <div className="carousel-slide">
                <div className="carousel-frame">
                  <div className="carousel-titlebar">
                    <div className="cdot cdot-r"></div>
                    <div className="cdot cdot-y"></div>
                    <div className="cdot cdot-g"></div>
                    <div className="carousel-url">classpulse.vercel.app/coach/resume</div>
                  </div>
                  <div className="prev-body">
                    <div className="prev-sidebar">
                      <div className="prev-sb-logo">
                        <div className="prev-sb-icon">CP</div>
                        <span className="prev-sb-name">ClassPulse</span>
                      </div>
                      <div className="prev-sb-item">
                        <svg
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <rect x="3" y="3" width="7" height="7" rx="1" />
                          <rect x="14" y="3" width="7" height="7" rx="1" />
                          <rect x="3" y="14" width="7" height="7" rx="1" />
                          <rect x="14" y="14" width="7" height="7" rx="1" />
                        </svg>
                        대시보드
                      </div>
                      <div className="prev-sb-item">
                        <svg
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <circle cx="12" cy="12" r="9" />
                          <path d="M12 7v5l3 3" />
                        </svg>
                        커리어 파일럿
                      </div>
                      <div className="prev-sb-item">
                        <svg
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                        </svg>
                        학습 현황
                      </div>
                      <div className="prev-sb-item active">
                        <svg
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                        </svg>
                        문서 코치
                      </div>
                      <div className="prev-sb-item">
                        <svg
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <rect x="3" y="4" width="18" height="18" rx="2" />
                          <path d="M16 2v4M8 2v4M3 10h18" />
                        </svg>
                        상담 예약
                      </div>
                      <div className="prev-sb-item">
                        <svg
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        기술 트렌드
                      </div>
                    </div>
                    <div className="prev-main">
                      <div className="prev-doc-header">
                        <h2>자기소개서 — AI 피드백</h2>
                        <div className="prev-doc-tabs">
                          <div className="prev-doc-tab active">자기소개서</div>
                          <div className="prev-doc-tab">포트폴리오</div>
                          <div className="prev-doc-tab">이력서</div>
                        </div>
                      </div>
                      <div className="prev-doc-body">
                        <div className="prev-doc-editor">
                          <h4>내 자기소개서</h4>
                          <div className="prev-text-line w90"></div>
                          <div className="prev-text-line w80"></div>
                          <div className="prev-text-line w70 prev-text-highlight"></div>
                          <div className="prev-text-line w90"></div>
                          <div className="prev-text-line w60"></div>
                          <div className="prev-text-line w80"></div>
                          <div className="prev-text-line w50 prev-text-highlight"></div>
                          <div className="prev-text-line w90"></div>
                          <div className="prev-text-line w70"></div>
                          <div className="prev-text-line w60"></div>
                          <div className="prev-text-line w80"></div>
                          <div className="prev-text-line w90"></div>
                        </div>
                        <div className="prev-feedback">
                          <h4>AI 피드백</h4>
                          <div className="prev-fb-item">
                            <div className="prev-fb-title" style={{ color: 'var(--sky)' }}>
                              지원 동기 강화
                            </div>
                            <div className="prev-fb-text">
                              첫 문장에 구체적인 경험을 넣으면 면접관의 관심을 끌 수 있어요. 현재 표현이 다소
                              추상적입니다.
                            </div>
                          </div>
                          <div className="prev-fb-item">
                            <div className="prev-fb-title" style={{ color: '#4AAC85' }}>
                              프로젝트 경험 구체화
                            </div>
                            <div className="prev-fb-text">
                              기술적 기여도와 정량적 성과를 포함하세요. 예: 응답속도 40% 개선, DAU 200% 증가 등
                            </div>
                          </div>
                          <div className="prev-fb-item">
                            <div className="prev-fb-title" style={{ color: 'var(--earth-light)' }}>
                              톤 & 매너
                            </div>
                            <div className="prev-fb-text">
                              전반적으로 자연스럽지만 3번째 문단에서 경어체가 갑자기 바뀝니다. 일관성을
                              유지하세요.
                            </div>
                          </div>
                          <div
                            style={{
                              marginTop: '12px',
                              padding: '10px 14px',
                              background: 'rgba(74,144,217,.08)',
                              borderRadius: '10px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                            }}
                          >
                            <div
                              style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '8px',
                                background: 'rgba(74,144,217,.15)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <svg
                                width="12"
                                height="12"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="var(--sky-light)"
                                strokeWidth="2"
                              >
                                <path d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                              </svg>
                            </div>
                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                              Human Touch AI 피드백 · 기계 냄새 없는 자연스러운 코칭
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* SLIDE 4: 학습 현황 */}
              <div className="carousel-slide">
                <div className="carousel-frame">
                  <div className="carousel-titlebar">
                    <div className="cdot cdot-r"></div>
                    <div className="cdot cdot-y"></div>
                    <div className="cdot cdot-g"></div>
                    <div className="carousel-url">classpulse.vercel.app/learning</div>
                  </div>
                  <div className="prev-body">
                    <div className="prev-sidebar">
                      <div className="prev-sb-logo">
                        <div className="prev-sb-icon">CP</div>
                        <span className="prev-sb-name">ClassPulse</span>
                      </div>
                      <div className="prev-sb-item">
                        <svg
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <rect x="3" y="3" width="7" height="7" rx="1" />
                          <rect x="14" y="3" width="7" height="7" rx="1" />
                          <rect x="3" y="14" width="7" height="7" rx="1" />
                          <rect x="14" y="14" width="7" height="7" rx="1" />
                        </svg>
                        대시보드
                      </div>
                      <div className="prev-sb-item">
                        <svg
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <circle cx="12" cy="12" r="9" />
                          <path d="M12 7v5l3 3" />
                        </svg>
                        커리어 파일럿
                      </div>
                      <div className="prev-sb-item active">
                        <svg
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                        </svg>
                        학습 현황
                      </div>
                      <div className="prev-sb-item">
                        <svg
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                        </svg>
                        문서 코치
                      </div>
                      <div className="prev-sb-item">
                        <svg
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <rect x="3" y="4" width="18" height="18" rx="2" />
                          <path d="M16 2v4M8 2v4M3 10h18" />
                        </svg>
                        상담 예약
                      </div>
                      <div className="prev-sb-item">
                        <svg
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        기술 트렌드
                      </div>
                    </div>
                    <div className="prev-main">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h2 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>
                          학습 심박수
                        </h2>
                        <div
                          style={{
                            padding: '6px 14px',
                            borderRadius: '8px',
                            background: 'rgba(74,172,133,.12)',
                            color: '#4AAC85',
                            fontSize: '12px',
                            fontWeight: '700',
                          }}
                        >
                          위험도: 낮음
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '14px' }}>
                        <div className="prev-card" style={{ gridColumn: '1/-1' }}>
                          <div className="prev-card-top">
                            <div
                              className="prev-card-icon"
                              style={{ background: 'rgba(184,155,113,.15)' }}
                            >
                              <svg
                                width="14"
                                height="14"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="#B89B71"
                                strokeWidth="2"
                              >
                                <path d="M3 12h4l3-9 4 18 3-9h4" />
                              </svg>
                            </div>
                            주간 학습 심박수
                          </div>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'flex-end',
                              gap: '6px',
                              height: '80px',
                              padding: '0 8px',
                            }}
                          >
                            <div
                              style={{
                                flex: 1,
                                background: 'rgba(74,144,217,.3)',
                                borderRadius: '4px 4px 0 0',
                                height: '45%',
                              }}
                            ></div>
                            <div
                              style={{
                                flex: 1,
                                background: 'rgba(74,144,217,.4)',
                                borderRadius: '4px 4px 0 0',
                                height: '60%',
                              }}
                            ></div>
                            <div
                              style={{
                                flex: 1,
                                background: 'rgba(74,144,217,.5)',
                                borderRadius: '4px 4px 0 0',
                                height: '80%',
                              }}
                            ></div>
                            <div
                              style={{
                                flex: 1,
                                background: 'rgba(74,144,217,.6)',
                                borderRadius: '4px 4px 0 0',
                                height: '70%',
                              }}
                            ></div>
                            <div
                              style={{
                                flex: 1,
                                background: 'var(--sky)',
                                borderRadius: '4px 4px 0 0',
                                height: '90%',
                              }}
                            ></div>
                            <div
                              style={{
                                flex: 1,
                                background: 'rgba(74,144,217,.4)',
                                borderRadius: '4px 4px 0 0',
                                height: '55%',
                              }}
                            ></div>
                            <div
                              style={{
                                flex: 1,
                                background: 'rgba(74,144,217,.2)',
                                borderRadius: '4px 4px 0 0',
                                height: '30%',
                              }}
                            ></div>
                          </div>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              padding: '8px 8px 0',
                              fontSize: '9px',
                              color: 'var(--text-tertiary)',
                            }}
                          >
                            <span>월</span>
                            <span>화</span>
                            <span>수</span>
                            <span>목</span>
                            <span>금</span>
                            <span>토</span>
                            <span>일</span>
                          </div>
                        </div>

                        <div className="prev-card">
                          <div className="prev-card-top">
                            <div
                              className="prev-card-icon"
                              style={{ background: 'rgba(74,144,217,.12)' }}
                            >
                              <svg
                                width="14"
                                height="14"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="#4A90D9"
                                strokeWidth="2"
                              >
                                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            출석률
                          </div>
                          <div className="prev-big-num" style={{ color: 'var(--sky)' }}>
                            96%
                          </div>
                          <div className="prev-big-sub">이번 달 24/25일 출석</div>
                        </div>

                        <div className="prev-card">
                          <div className="prev-card-top">
                            <div
                              className="prev-card-icon"
                              style={{ background: 'rgba(74,172,133,.12)' }}
                            >
                              <svg
                                width="14"
                                height="14"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="#4AAC85"
                                strokeWidth="2"
                              >
                                <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                              </svg>
                            </div>
                            감정 점수
                          </div>
                          <div className="prev-big-num" style={{ color: '#4AAC85' }}>
                            8.2
                          </div>
                          <div className="prev-big-sub">10점 만점 · 양호</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* SLIDE 5: 기술 트렌드 */}
              <div className="carousel-slide">
                <div className="carousel-frame">
                  <div className="carousel-titlebar">
                    <div className="cdot cdot-r"></div>
                    <div className="cdot cdot-y"></div>
                    <div className="cdot cdot-g"></div>
                    <div className="carousel-url">classpulse.vercel.app/trends</div>
                  </div>
                  <div className="prev-body">
                    <div className="prev-sidebar">
                      <div className="prev-sb-logo">
                        <div className="prev-sb-icon">CP</div>
                        <span className="prev-sb-name">ClassPulse</span>
                      </div>
                      <div className="prev-sb-item">
                        <svg
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <rect x="3" y="3" width="7" height="7" rx="1" />
                          <rect x="14" y="3" width="7" height="7" rx="1" />
                          <rect x="3" y="14" width="7" height="7" rx="1" />
                          <rect x="14" y="14" width="7" height="7" rx="1" />
                        </svg>
                        대시보드
                      </div>
                      <div className="prev-sb-item">
                        <svg
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <circle cx="12" cy="12" r="9" />
                          <path d="M12 7v5l3 3" />
                        </svg>
                        커리어 파일럿
                      </div>
                      <div className="prev-sb-item">
                        <svg
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                        </svg>
                        학습 현황
                      </div>
                      <div className="prev-sb-item">
                        <svg
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                        </svg>
                        문서 코치
                      </div>
                      <div className="prev-sb-item">
                        <svg
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <rect x="3" y="4" width="18" height="18" rx="2" />
                          <path d="M16 2v4M8 2v4M3 10h18" />
                        </svg>
                        상담 예약
                      </div>
                      <div className="prev-sb-item active">
                        <svg
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        기술 트렌드
                      </div>
                    </div>
                    <div className="prev-main">
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '16px',
                        }}
                      >
                        <h2 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>
                          기술 트렌드
                        </h2>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <div
                            style={{
                              padding: '5px 12px',
                              borderRadius: '8px',
                              background: 'rgba(74,144,217,.12)',
                              color: 'var(--sky)',
                              fontSize: '11px',
                              fontWeight: '600',
                            }}
                          >
                            내 맞춤
                          </div>
                          <div
                            style={{
                              padding: '5px 12px',
                              borderRadius: '8px',
                              fontSize: '11px',
                              fontWeight: '600',
                              color: 'var(--text-tertiary)',
                            }}
                          >
                            전체
                          </div>
                          <div
                            style={{
                              padding: '5px 12px',
                              borderRadius: '8px',
                              fontSize: '11px',
                              fontWeight: '600',
                              color: 'var(--text-tertiary)',
                            }}
                          >
                            공식 블로그
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '12px' }}>
                        <div className="prev-card" style={{ borderLeft: '3px solid var(--sky)' }}>
                          <div
                            style={{
                              fontSize: '12px',
                              fontWeight: '700',
                              color: 'var(--text-primary)',
                              marginBottom: '8px',
                            }}
                          >
                            React 19 Server Actions 실전 가이드
                          </div>
                          <div
                            style={{
                              fontSize: '10px',
                              color: 'var(--text-tertiary)',
                              lineHeight: '1.5',
                              marginBottom: '10px',
                            }}
                          >
                            서버 액션을 활용한 폼 처리와 데이터 뮤테이션 패턴을 살펴봅니다.
                          </div>
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            <span className="prev-tag match">React</span>
                            <span className="prev-tag match">Next.js</span>
                          </div>
                        </div>

                        <div className="prev-card" style={{ borderLeft: '3px solid var(--sky)' }}>
                          <div
                            style={{
                              fontSize: '12px',
                              fontWeight: '700',
                              color: 'var(--text-primary)',
                              marginBottom: '8px',
                            }}
                          >
                            2026 프론트엔드 개발자 로드맵
                          </div>
                          <div
                            style={{
                              fontSize: '10px',
                              color: 'var(--text-tertiary)',
                              lineHeight: '1.5',
                              marginBottom: '10px',
                            }}
                          >
                            올해 주목해야 할 기술 스택과 학습 경로를 정리했습니다.
                          </div>
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            <span className="prev-tag match">TypeScript</span>
                            <span className="prev-tag miss">Rust</span>
                          </div>
                        </div>

                        <div className="prev-card">
                          <div
                            style={{
                              fontSize: '12px',
                              fontWeight: '700',
                              color: 'var(--text-primary)',
                              marginBottom: '8px',
                            }}
                          >
                            Spring Boot 3.4 새 기능 정리
                          </div>
                          <div
                            style={{
                              fontSize: '10px',
                              color: 'var(--text-tertiary)',
                              lineHeight: '1.5',
                              marginBottom: '10px',
                            }}
                          >
                            Virtual Thread 기본 지원, 새로운 관측 가능성 기능 등
                          </div>
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            <span className="prev-tag miss">Java</span>
                            <span className="prev-tag miss">Spring</span>
                          </div>
                        </div>

                        <div className="prev-card">
                          <div
                            style={{
                              fontSize: '12px',
                              fontWeight: '700',
                              color: 'var(--text-primary)',
                              marginBottom: '8px',
                            }}
                          >
                            AI 코딩 에이전트 비교: Cursor vs Claude Code
                          </div>
                          <div
                            style={{
                              fontSize: '10px',
                              color: 'var(--text-tertiary)',
                              lineHeight: '1.5',
                              marginBottom: '10px',
                            }}
                          >
                            AI 코딩 도구들의 장단점과 실무 활용법을 비교합니다.
                          </div>
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            <span className="prev-tag match">AI</span>
                            <span className="prev-tag miss">DevOps</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* SLIDE 6: 상담 예약 */}
              <div className="carousel-slide">
                <div className="carousel-frame">
                  <div className="carousel-titlebar">
                    <div className="cdot cdot-r"></div>
                    <div className="cdot cdot-y"></div>
                    <div className="cdot cdot-g"></div>
                    <div className="carousel-url">classpulse.vercel.app/consultation</div>
                  </div>
                  <div className="prev-body">
                    <div className="prev-sidebar">
                      <div className="prev-sb-logo">
                        <div className="prev-sb-icon">CP</div>
                        <span className="prev-sb-name">ClassPulse</span>
                      </div>
                      <div className="prev-sb-item">
                        <svg
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <rect x="3" y="3" width="7" height="7" rx="1" />
                          <rect x="14" y="3" width="7" height="7" rx="1" />
                          <rect x="3" y="14" width="7" height="7" rx="1" />
                          <rect x="14" y="14" width="7" height="7" rx="1" />
                        </svg>
                        대시보드
                      </div>
                      <div className="prev-sb-item">
                        <svg
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <circle cx="12" cy="12" r="9" />
                          <path d="M12 7v5l3 3" />
                        </svg>
                        커리어 파일럿
                      </div>
                      <div className="prev-sb-item">
                        <svg
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                        </svg>
                        학습 현황
                      </div>
                      <div className="prev-sb-item">
                        <svg
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                        </svg>
                        문서 코치
                      </div>
                      <div className="prev-sb-item active">
                        <svg
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <rect x="3" y="4" width="18" height="18" rx="2" />
                          <path d="M16 2v4M8 2v4M3 10h18" />
                        </svg>
                        상담 예약
                      </div>
                      <div className="prev-sb-item">
                        <svg
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        기술 트렌드
                      </div>
                    </div>
                    <div className="prev-main">
                      <h2 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '20px' }}>
                        상담 예약
                      </h2>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                        {/* 캘린더 */}
                        <div className="prev-card">
                          <div className="prev-card-top">
                            <div
                              className="prev-card-icon"
                              style={{ background: 'rgba(74,144,217,.12)' }}
                            >
                              <svg
                                width="14"
                                height="14"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="#4A90D9"
                                strokeWidth="2"
                              >
                                <rect x="3" y="4" width="18" height="18" rx="2" />
                                <path d="M16 2v4M8 2v4M3 10h18" />
                              </svg>
                            </div>
                            4월 2026
                          </div>
                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(7,1fr)',
                              gap: '4px',
                              textAlign: 'center',
                              fontSize: '10px',
                              color: 'var(--text-tertiary)',
                              marginBottom: '6px',
                            }}
                          >
                            <span>일</span>
                            <span>월</span>
                            <span>화</span>
                            <span>수</span>
                            <span>목</span>
                            <span>금</span>
                            <span>토</span>
                          </div>
                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(7,1fr)',
                              gap: '3px',
                              textAlign: 'center',
                              fontSize: '11px',
                            }}
                          >
                            <span></span>
                            <span></span>
                            <span></span>
                            <span style={{ color: 'var(--text-tertiary)', padding: '4px' }}>1</span>
                            <span style={{ color: 'var(--text-tertiary)', padding: '4px' }}>2</span>
                            <span style={{ color: 'var(--text-tertiary)', padding: '4px' }}>3</span>
                            <span style={{ color: 'var(--text-tertiary)', padding: '4px' }}>4</span>
                            <span style={{ color: 'var(--text-tertiary)', padding: '4px' }}>5</span>
                            <span style={{ color: 'var(--text-tertiary)', padding: '4px' }}>6</span>
                            <span style={{ color: 'var(--text-tertiary)', padding: '4px' }}>7</span>
                            <span style={{ color: 'var(--text-tertiary)', padding: '4px' }}>8</span>
                            <span style={{ color: 'var(--text-tertiary)', padding: '4px' }}>9</span>
                            <span style={{ color: 'var(--text-tertiary)', padding: '4px' }}>10</span>
                            <span style={{ color: 'var(--text-tertiary)', padding: '4px' }}>11</span>
                            <span style={{ color: 'var(--text-tertiary)', padding: '4px' }}>12</span>
                            <span
                              style={{
                                padding: '4px',
                                background: 'var(--sky)',
                                borderRadius: '6px',
                                color: 'var(--text-primary)',
                                fontWeight: '700',
                              }}
                            >
                              13
                            </span>
                            <span style={{ color: 'var(--text-secondary)', padding: '4px' }}>14</span>
                            <span style={{ color: 'var(--text-secondary)', padding: '4px' }}>15</span>
                            <span style={{ color: 'var(--text-secondary)', padding: '4px' }}>16</span>
                            <span style={{ color: 'var(--text-secondary)', padding: '4px' }}>17</span>
                            <span style={{ color: 'var(--text-secondary)', padding: '4px' }}>18</span>
                            <span style={{ color: 'var(--text-secondary)', padding: '4px' }}>19</span>
                            <span style={{ color: 'var(--text-secondary)', padding: '4px' }}>20</span>
                            <span style={{ color: 'var(--text-secondary)', padding: '4px' }}>21</span>
                            <span style={{ color: 'var(--text-secondary)', padding: '4px' }}>22</span>
                            <span style={{ color: 'var(--text-secondary)', padding: '4px' }}>23</span>
                            <span style={{ color: 'var(--text-secondary)', padding: '4px' }}>24</span>
                            <span style={{ color: 'var(--text-secondary)', padding: '4px' }}>25</span>
                          </div>
                        </div>

                        {/* 시간 선택 */}
                        <div className="prev-card">
                          <div className="prev-card-top">
                            <div
                              className="prev-card-icon"
                              style={{ background: 'rgba(74,172,133,.12)' }}
                            >
                              <svg
                                width="14"
                                height="14"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="#4AAC85"
                                strokeWidth="2"
                              >
                                <circle cx="12" cy="12" r="9" />
                                <path d="M12 7v5l3 3" />
                              </svg>
                            </div>
                            가능한 시간
                          </div>
                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(3,1fr)',
                              gap: '6px',
                            }}
                          >
                            <div
                              style={{
                                padding: '8px',
                                borderRadius: '8px',
                                background: 'var(--cream)',
                                border: '1px solid var(--border)',
                                textAlign: 'center',
                                fontSize: '11px',
                                color: 'var(--text-secondary)',
                              }}
                            >
                              09:00
                            </div>
                            <div
                              style={{
                                padding: '8px',
                                borderRadius: '8px',
                                background: 'rgba(74,144,217,.12)',
                                border: '1px solid rgba(74,144,217,.3)',
                                textAlign: 'center',
                                fontSize: '11px',
                                color: 'var(--sky)',
                                fontWeight: '700',
                              }}
                            >
                              10:00
                            </div>
                            <div
                              style={{
                                padding: '8px',
                                borderRadius: '8px',
                                background: 'var(--cream)',
                                border: '1px solid var(--border)',
                                textAlign: 'center',
                                fontSize: '11px',
                                color: 'var(--text-secondary)',
                              }}
                            >
                              11:00
                            </div>
                            <div
                              style={{
                                padding: '8px',
                                borderRadius: '8px',
                                background: 'var(--cream)',
                                border: '1px solid var(--border)',
                                textAlign: 'center',
                                fontSize: '11px',
                                color: 'var(--text-secondary)',
                              }}
                            >
                              14:00
                            </div>
                            <div
                              style={{
                                padding: '8px',
                                borderRadius: '8px',
                                background: 'var(--cream)',
                                border: '1px solid var(--border)',
                                textAlign: 'center',
                                fontSize: '11px',
                                color: 'var(--text-secondary)',
                              }}
                            >
                              15:00
                            </div>
                            <div
                              style={{
                                padding: '8px',
                                borderRadius: '8px',
                                background: 'rgba(26,26,26,.02)',
                                border: '1px solid var(--border)',
                                textAlign: 'center',
                                fontSize: '11px',
                                color: 'var(--text-tertiary)',
                                textDecoration: 'line-through',
                              }}
                            >
                              16:00
                            </div>
                          </div>
                          <div
                            style={{
                              marginTop: '14px',
                              padding: '12px',
                              background: 'rgba(74,144,217,.08)',
                              borderRadius: '10px',
                            }}
                          >
                            <div
                              style={{
                                fontSize: '11px',
                                fontWeight: '700',
                                color: 'var(--sky)',
                                marginBottom: '4px',
                              }}
                            >
                              선택: 4/13 (일) 10:00
                            </div>
                            <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>
                              김멘토 · 커리어 상담 · 30분
                            </div>
                          </div>
                        </div>

                        {/* 예약 현황 */}
                        <div className="prev-card" style={{ gridColumn: '1/-1' }}>
                          <div className="prev-card-top">
                            <div
                              className="prev-card-icon"
                              style={{ background: 'rgba(184,155,113,.12)' }}
                            >
                              <svg
                                width="14"
                                height="14"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="#B89B71"
                                strokeWidth="2"
                              >
                                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                              </svg>
                            </div>
                            내 상담 현황
                          </div>
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <div
                              style={{
                                flex: 1,
                                padding: '10px 14px',
                                borderRadius: '10px',
                                background: 'rgba(74,172,133,.08)',
                                border: '1px solid rgba(74,172,133,.15)',
                              }}
                            >
                              <div
                                style={{
                                  fontSize: '11px',
                                  fontWeight: '700',
                                  color: '#4AAC85',
                                  marginBottom: '2px',
                                }}
                              >
                                4/10 (목) 14:00 확정
                              </div>
                              <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>
                                박멘토 · 포트폴리오 리뷰
                              </div>
                            </div>
                            <div
                              style={{
                                flex: 1,
                                padding: '10px 14px',
                                borderRadius: '10px',
                                background: 'rgba(245,158,11,.08)',
                                border: '1px solid rgba(245,158,11,.12)',
                              }}
                            >
                              <div
                                style={{
                                  fontSize: '11px',
                                  fontWeight: '700',
                                  color: '#f5a623',
                                  marginBottom: '2px',
                                }}
                              >
                                4/15 (화) 10:00 대기중
                              </div>
                              <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>
                                김멘토 · 커리어 상담
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Dots */}
            <div className="carousel-dots">
              {[0, 1, 2, 3, 4, 5].map((idx) => (
                <div
                  key={idx}
                  className={`carousel-dot ${currentSlide === idx ? 'active' : ''}`}
                  onClick={() => goSlide(idx)}
                ></div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="stats-section" id="stats">
        <div className="container">
          <div className="stats-grid">
            <div className="reveal">
              <div className="stat-value">80%</div>
              <div className="stat-label">멘토 업무 자동화</div>
            </div>
            <div className="reveal reveal-d1">
              <div className="stat-value">3분</div>
              <div className="stat-label">기업 분석 소요 시간</div>
            </div>
            <div className="reveal reveal-d2">
              <div className="stat-value">270원</div>
              <div className="stat-label">학생 1명 월 AI 비용</div>
            </div>
            <div className="reveal reveal-d3">
              <div className="stat-value">4,400%</div>
              <div className="stat-label">투자 대비 효율 ROI</div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW */}
      <section className="how-section" id="how">
        <div className="container">
          <div className="how-header">
            <div className="section-label reveal">HOW IT WORKS</div>
            <h2 className="section-heading reveal reveal-d1">이렇게 작동합니다</h2>
            <p className="section-desc reveal reveal-d2">3단계로 완성되는 AI 커리어 코칭</p>
          </div>
          <div className="how-steps">
            <div className="how-step reveal reveal-d1">
              <div className="how-step-num">01</div>
              <h3>URL 입력</h3>
              <p>채용공고 URL 하나만 입력하세요. Jina Reader가 기업 정보를 자동 수집합니다.</p>
            </div>
            <div className="how-step reveal reveal-d2">
              <div className="how-step-num">02</div>
              <h3>AI 분석</h3>
              <p>하네스 기법으로 훈련된 AI가 기업 분석, 면접 준비, 포트폴리오 가이드를 생성합니다.</p>
            </div>
            <div className="how-step reveal reveal-d3">
              <div className="how-step-num">03</div>
              <h3>맞춤 코칭</h3>
              <p>학생 프로필에 맞는 자소서 피드백과 커리어 로드맵을 받아보세요.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section" id="cta">
        <div className="container">
          <h2 className="cta-heading reveal">지금 바로 체험해보세요</h2>
          <p className="cta-desc reveal reveal-d1">
            데모 계정으로 모든 기능을 바로 확인할 수 있습니다. 별도 가입 불필요.
          </p>
          <div className="cta-btns reveal reveal-d2">
            <button
              className="btn btn-primary"
              onClick={() => handleDemoLogin(process.env.NEXT_PUBLIC_DEMO_STUDENT_EMAIL || 'student@classpulse.demo')}
              disabled={loading !== null}
            >
              학생으로 시작하기 <span className="btn-arrow">&rarr;</span>
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => handleDemoLogin(process.env.NEXT_PUBLIC_DEMO_ADMIN_EMAIL || 'admin@classpulse.demo')}
              disabled={loading !== null}
            >
              관리자로 시작하기 <span className="btn-arrow">&rarr;</span>
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="container">
          <div className="footer-inner">
            <div className="footer-left">
              <div className="nav-logo-mark" style={{ width: '32px', height: '32px', fontSize: '11px' }}>
                CP
              </div>
              <span style={{ fontWeight: '700', fontSize: '15px' }}>ClassPulse</span>
            </div>
            <div className="footer-text">
              &copy; 2026 ClassPulse — 바이브코딩 공모전 출품작 | 코리아IT아카데미
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
