// src/app/(auth)/register/page.tsx — 회원가입 (단계별 폼)
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Step = 1 | 2 | 3;

export default function RegisterPage() {
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState({
    // Step 1: 기본정보
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    role: 'STUDENT' as 'STUDENT' | 'MENTOR',
    // Step 2: 소속정보
    branchId: '',
    enrollmentCode: '', // 수강 등록 코드
    // Step 3: 수업정보 (학생용)
    courseId: '',
    targetJob: '',
    studentStatus: 'ENROLLED' as 'ENROLLED' | 'COMPLETED' | 'CARE_PERIOD',
  });
  const [branches, setBranches] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [mentors, setMentors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  // 지점 목록 로드
  useEffect(() => {
    async function loadBranches() {
      const { data } = await supabase.from('branches').select('id, name, address').order('name');
      setBranches(data || []);
    }
    loadBranches();
  }, []);

  // 지점 선택 시 해당 지점 수업 + 멘토 로드
  useEffect(() => {
    if (!form.branchId) return;
    async function loadCoursesMentors() {
      const { data: courseData } = await supabase
        .from('courses')
        .select('id, name, course_type, classroom, schedule_time, instructor, start_date, end_date')
        .eq('branch_id', form.branchId)
        .order('start_date', { ascending: false });
      setCourses(courseData || []);

      const { data: mentorData } = await supabase
        .from('user_profiles')
        .select('user_id, name')
        .eq('branch_id', form.branchId)
        .in('role', ['MENTOR', 'CAREER_ADVISOR', 'ADMIN']);
      setMentors(mentorData || []);
    }
    loadCoursesMentors();
  }, [form.branchId]);

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function validateStep1(): boolean {
    if (!form.name.trim()) { setError('이름을 입력해주세요.'); return false; }
    if (!form.email.trim()) { setError('이메일을 입력해주세요.'); return false; }
    if (form.password.length < 6) { setError('비밀번호는 6자 이상이어야 합니다.'); return false; }
    if (form.password !== form.confirmPassword) { setError('비밀번호가 일치하지 않습니다.'); return false; }
    return true;
  }

  function validateStep2(): boolean {
    if (!form.branchId) { setError('소속 지점을 선택해주세요.'); return false; }
    return true;
  }

  function nextStep() {
    setError(null);
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
  }

  function prevStep() {
    setError(null);
    if (step > 1) setStep((s) => (s - 1) as Step);
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // 1. Supabase Auth 가입
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { name: form.name, role: form.role } },
    });

    if (authError) {
      const msg = authError.message;
      if (msg.includes('rate limit')) setError('잠시 후 다시 시도해주세요. (이메일 발송 제한 — 1~2분 대기)');
      else if (msg.includes('already registered') || msg.includes('already exists')) setError('이미 가입된 이메일입니다.');
      else setError(msg);
      setLoading(false);
      return;
    }

    // 2. user_profiles 생성
    if (authData.user) {
      const selectedCourse = courses.find((c) => c.id === form.courseId);
      const completedAt = form.studentStatus !== 'ENROLLED' ? selectedCourse?.end_date : null;
      const careUntil = completedAt
        ? new Date(new Date(completedAt).getTime() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        : null;

      const { error: profileError } = await supabase.from('user_profiles').insert({
        user_id: authData.user.id,
        name: form.name.trim(),
        role: form.role,
        phone: form.phone || null,
        branch_id: form.branchId || null,
        course_id: form.courseId || null,
        target_job: form.targetJob || null,
        enrollment_code: form.enrollmentCode || null,
        student_status: form.studentStatus,
        completed_at: completedAt,
        care_until: careUntil,
      });

      if (profileError) {
        console.error('프로필 생성 실패:', profileError);
      }

      // 스트릭 초기화
      await supabase.from('streak_records').insert({
        user_id: authData.user.id,
        current_streak: 0,
        longest_streak: 0,
      });
    }

    router.push('/dashboard');
  }

  const selectedCourse = courses.find((c) => c.id === form.courseId);

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream-light px-4 py-8">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-sky-deep flex items-center justify-center text-white font-bold">CP</div>
            <span className="text-xl font-bold text-charcoal">ClassPulse</span>
          </Link>
          <p className="text-sm text-[var(--text-secondary)] mt-1">코리아IT아카데미 교육 플랫폼</p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                step >= s ? 'bg-sky-deep text-white' : 'bg-cream-dark text-[var(--text-tertiary)]'
              }`}>
                {s}
              </div>
              {s < 3 && <div className={`w-12 h-0.5 ${step > s ? 'bg-sky-deep' : 'bg-cream-dark'}`} />}
            </div>
          ))}
        </div>
        <div className="text-center text-xs text-[var(--text-tertiary)] mb-4">
          {step === 1 && '기본 정보'}
          {step === 2 && '소속 정보'}
          {step === 3 && '수업 정보'}
        </div>

        {/* Form */}
        <div className="bg-cream-white rounded-[20px] p-8 card-shadow">
          <form onSubmit={handleRegister}>

            {/* ── Step 1: 기본정보 ── */}
            {step === 1 && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-charcoal mb-2">기본 정보</h2>

                {/* Role Selection */}
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">역할</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: 'STUDENT', label: 'Student', desc: '학습 및 취업 준비' },
                      { value: 'MENTOR', label: 'Mentor/Admin', desc: '학생 관리 및 코칭' },
                    ].map((role) => (
                      <button key={role.value} type="button"
                        onClick={() => updateField('role', role.value)}
                        className={`p-3 rounded-xl border-2 text-left transition-all ${
                          form.role === role.value ? 'border-primary-500 bg-sky/5' : 'border-[rgba(26,26,26,0.06)] hover:border-[rgba(26,26,26,0.10)]'
                        }`}>
                        <div className="flex items-center gap-2 mb-1">
                          {role.value === 'STUDENT' && (
                            <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
                            </svg>
                          )}
                          {role.value === 'MENTOR' && (
                            <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                            </svg>
                          )}
                          <span className="font-medium text-sm">
                            {role.value === 'STUDENT' ? '학생' : '멘토/관리자'}
                          </span>
                        </div>
                        <div className="text-xs text-[var(--text-secondary)] mt-0.5">{role.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-charcoal mb-1">이름 *</label>
                  <input type="text" value={form.name} onChange={(e) => updateField('name', e.target.value)}
                    placeholder="홍길동" required className="input-field" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-charcoal mb-1">이메일 *</label>
                  <input type="email" value={form.email} onChange={(e) => updateField('email', e.target.value)}
                    placeholder="your@email.com" required className="input-field" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-charcoal mb-1">전화번호</label>
                  <input type="tel" value={form.phone} onChange={(e) => updateField('phone', e.target.value)}
                    placeholder="010-0000-0000" className="input-field" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-charcoal mb-1">비밀번호 *</label>
                    <input type="password" value={form.password} onChange={(e) => updateField('password', e.target.value)}
                      placeholder="6자 이상" required className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-charcoal mb-1">비밀번호 확인 *</label>
                    <input type="password" value={form.confirmPassword} onChange={(e) => updateField('confirmPassword', e.target.value)}
                      placeholder="비밀번호 재입력" required className="input-field" />
                  </div>
                </div>
              </div>
            )}

            {/* ── Step 2: 소속정보 ── */}
            {step === 2 && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-charcoal mb-2">소속 정보</h2>
                <p className="text-sm text-[var(--text-secondary)]">코리아IT아카데미 소속 정보를 선택해주세요.</p>

                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">소속 지점 *</label>
                  <div className="space-y-2">
                    {branches.map((branch) => (
                      <button key={branch.id} type="button"
                        onClick={() => updateField('branchId', branch.id)}
                        className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                          form.branchId === branch.id ? 'border-primary-500 bg-sky/5' : 'border-[rgba(26,26,26,0.06)] hover:border-[rgba(26,26,26,0.10)]'
                        }`}>
                        <div className="font-medium text-sm text-charcoal">{branch.name}</div>
                        <div className="text-xs text-[var(--text-secondary)] mt-0.5">{branch.address}</div>
                      </button>
                    ))}
                    {branches.length === 0 && (
                      <p className="text-sm text-[var(--text-tertiary)] text-center py-4">지점 데이터를 불러오는 중...</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-charcoal mb-1">수강 등록 코드 (선택)</label>
                  <input type="text" value={form.enrollmentCode} onChange={(e) => updateField('enrollmentCode', e.target.value)}
                    placeholder="학원에서 발급받은 등록 코드" className="input-field" />
                  <p className="text-xs text-[var(--text-tertiary)] mt-1">멘토 또는 학원에서 발급한 코드가 있으면 입력하세요.</p>
                </div>
              </div>
            )}

            {/* ── Step 3: 수업정보 ── */}
            {step === 3 && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-charcoal mb-2">
                  {form.role === 'STUDENT' ? '수업 정보' : '담당 정보'}
                </h2>

                {form.role === 'STUDENT' && (
                  <>
                    {/* 학생 상태 */}
                    <div>
                      <label className="block text-sm font-medium text-charcoal mb-2">현재 상태 *</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { value: 'ENROLLED', label: '수업 중', desc: '현재 수강 진행 중' },
                          { value: 'COMPLETED', label: '수료', desc: '과정 수료 완료' },
                          { value: 'CARE_PERIOD', label: '취업 케어', desc: '수료 후 취업 지원 중' },
                        ].map((status) => (
                          <button key={status.value} type="button"
                            onClick={() => updateField('studentStatus', status.value)}
                            className={`p-3 rounded-xl border-2 text-center transition-all ${
                              form.studentStatus === status.value ? 'border-primary-500 bg-sky/5' : 'border-[rgba(26,26,26,0.06)] hover:border-[rgba(26,26,26,0.10)]'
                            }`}>
                            {status.value === 'ENROLLED' && (
                              <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5 mx-auto mb-1">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                              </svg>
                            )}
                            {status.value === 'COMPLETED' && (
                              <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5 mx-auto mb-1">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
                              </svg>
                            )}
                            {status.value === 'CARE_PERIOD' && (
                              <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5 mx-auto mb-1">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />
                              </svg>
                            )}
                            <div className="font-medium text-xs">{status.label}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 수업 선택 */}
                    <div>
                      <label className="block text-sm font-medium text-charcoal mb-2">수강 과정 *</label>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {courses.map((course) => (
                          <button key={course.id} type="button"
                            onClick={() => updateField('courseId', course.id)}
                            className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                              form.courseId === course.id ? 'border-primary-500 bg-sky/5' : 'border-[rgba(26,26,26,0.06)] hover:border-[rgba(26,26,26,0.10)]'
                            }`}>
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="font-medium text-sm text-charcoal">{course.name}</div>
                                <div className="flex flex-wrap gap-2 mt-1.5">
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                                    course.course_type === 'NCS' ? 'bg-emerald-100 text-emerald-700'
                                    : course.course_type === 'PRIVATE' ? 'bg-blue-100 text-blue-700'
                                    : 'bg-earth/10 text-earth'
                                  }`}>
                                    {course.course_type === 'NCS' ? '국비지원' : course.course_type === 'PRIVATE' ? '사비' : '단기'}
                                  </span>
                                  <span className="text-[10px] text-[var(--text-tertiary)]">{course.classroom}</span>
                                  <span className="text-[10px] text-[var(--text-tertiary)]">{course.schedule_time}</span>
                                  <span className="text-[10px] text-[var(--text-tertiary)]">강사: {course.instructor}</span>
                                </div>
                                <div className="text-[10px] text-[var(--text-tertiary)] mt-1">
                                  {course.start_date} ~ {course.end_date}
                                </div>
                              </div>
                            </div>
                          </button>
                        ))}
                        {courses.length === 0 && (
                          <p className="text-sm text-[var(--text-tertiary)] text-center py-4">해당 지점의 수업 정보가 없습니다.</p>
                        )}
                      </div>
                    </div>

                    {/* 선택한 수업 상세 */}
                    {selectedCourse && (
                      <div className="p-4 bg-sky/5 rounded-xl">
                        <div className="text-xs text-sky-deep font-semibold mb-1">선택한 과정</div>
                        <p className="text-sm font-medium text-charcoal">{selectedCourse.name}</p>
                        <p className="text-xs text-[var(--text-secondary)] mt-1">
                          {selectedCourse.classroom} · {selectedCourse.schedule_time} · 강사: {selectedCourse.instructor}
                        </p>
                      </div>
                    )}

                    {/* 희망 직무 */}
                    <div>
                      <label className="block text-sm font-medium text-charcoal mb-1">희망 직무</label>
                      <input type="text" value={form.targetJob} onChange={(e) => updateField('targetJob', e.target.value)}
                        placeholder="예: 백엔드 개발자, 프론트엔드 개발자, 데이터 분석가" className="input-field" />
                    </div>
                  </>
                )}

                {form.role === 'MENTOR' && (
                  <div className="p-6 bg-earth/5 rounded-xl text-center">
                    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-8 h-8 mx-auto mb-2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                    </svg>
                    <p className="text-sm text-charcoal">
                      멘토/관리자 계정은 가입 후 관리자 승인이 필요합니다.
                    </p>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">
                      선택한 지점의 관리자에게 연락하여 권한을 받으세요.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mt-4 bg-red-50 text-red-600 text-sm rounded-lg px-4 py-3">{error}</div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-3 mt-6">
              {step > 1 && (
                <button type="button" onClick={prevStep}
                  className="flex-1 py-3 rounded-xl border-2 border-[rgba(26,26,26,0.06)] text-[var(--text-secondary)] font-medium hover:bg-cream-light transition-colors">
                  이전
                </button>
              )}
              {step < 3 ? (
                <button type="button" onClick={nextStep}
                  className="flex-1 py-3 rounded-xl bg-sky-deep hover:bg-sky-deep/90 text-white font-semibold hover:shadow-lg transition-all">
                  다음
                </button>
              ) : (
                <button type="submit" disabled={loading}
                  className="flex-1 py-3 rounded-xl bg-sky-deep hover:bg-sky-deep/90 text-white font-semibold hover:shadow-lg transition-all disabled:opacity-60">
                  {loading ? '가입 처리 중...' : '가입 완료'}
                </button>
              )}
            </div>
          </form>
        </div>

        <p className="text-center text-sm text-[var(--text-tertiary)] mt-6">
          이미 계정이 있으신가요?{' '}
          <Link href="/login" className="text-sky-deep hover:text-sky-deep font-medium">로그인</Link>
        </p>
      </div>

      <style jsx>{`
        .input-field {
          width: 100%;
          padding: 0.75rem 1rem;
          border-radius: 0.75rem;
          border: 1px solid #e2e8f0;
          background: #f8fafc;
          color: #0f172a;
          font-size: 0.875rem;
          outline: none;
          transition: all 0.2s;
        }
        .input-field:focus {
          ring: 2px;
          border-color: #6366f1;
          box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
        }
        .input-field::placeholder {
          color: #94a3b8;
        }
      `}</style>
    </div>
  );
}
