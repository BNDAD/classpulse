-- ==============================================
-- ClassPulse 시드 데이터 (데모용)
-- supabase/seed.sql
--
-- ⚠️ 주의: Supabase 대시보드 > Authentication에서
-- 먼저 데모 사용자를 생성한 후 아래 SQL 실행
--
-- 데모 계정:
-- student@classpulse.demo / classpulse2024!
-- student2@classpulse.demo / classpulse2024!
-- student3@classpulse.demo / classpulse2024!
-- student4@classpulse.demo / classpulse2024!
-- student5@classpulse.demo / classpulse2024!
-- mentor@classpulse.demo / classpulse2024!
-- admin@classpulse.demo / classpulse2024!
-- ==============================================

-- ──────────────────────────────────────────────
-- 1. 교육 과정 3개
-- ──────────────────────────────────────────────
INSERT INTO courses (id, name, description, duration_weeks, difficulty_map, tech_stack) VALUES
(
  'c1000000-0000-0000-0000-000000000001',
  'Java 풀스택 개발자 양성과정',
  'Java, Spring Boot, React를 활용한 풀스택 개발 6개월 과정',
  24,
  '{"week_4": 3, "week_8": 5, "week_12": 8, "week_16": 9, "week_20": 7, "week_24": 6}',
  ARRAY['Java', 'Spring Boot', 'React', 'MySQL', 'Docker']
),
(
  'c1000000-0000-0000-0000-000000000002',
  'Python AI/데이터분석 과정',
  'Python, 머신러닝, 데이터 시각화 5개월 과정',
  20,
  '{"week_4": 3, "week_8": 6, "week_12": 9, "week_16": 8, "week_20": 7}',
  ARRAY['Python', 'TensorFlow', 'Pandas', 'SQL', 'Tableau']
),
(
  'c1000000-0000-0000-0000-000000000003',
  '클라우드 엔지니어링 과정',
  'AWS, Docker, Kubernetes 기반 클라우드 인프라 4개월 과정',
  16,
  '{"week_4": 4, "week_8": 7, "week_12": 9, "week_16": 8}',
  ARRAY['AWS', 'Docker', 'Kubernetes', 'Terraform', 'Linux']
);

-- ──────────────────────────────────────────────
-- 2. 자격증 정보
-- ──────────────────────────────────────────────
INSERT INTO certifications (name, exam_dates, related_courses, prep_resources) VALUES
(
  '정보처리기사',
  '[{"date": "2024-05-09", "registrationStart": "2024-03-05", "registrationEnd": "2024-03-08", "resultDate": "2024-06-18"}]',
  ARRAY['Java', 'Python', 'SQL'],
  '[{"title": "정보처리기사 실기 핵심 정리", "url": "https://example.com/jungbo", "type": "article"}]'
),
(
  'SQLD (SQL 개발자)',
  '[{"date": "2024-06-08", "registrationStart": "2024-04-29", "registrationEnd": "2024-05-03", "resultDate": "2024-07-05"}]',
  ARRAY['SQL', 'MySQL', 'Database'],
  '[{"title": "SQLD 이론 요약", "url": "https://example.com/sqld", "type": "article"}]'
),
(
  'AWS Solutions Architect Associate',
  '[{"date": "2024-12-31", "registrationStart": "2024-01-01", "registrationEnd": "2024-12-31", "resultDate": "즉시"}]',
  ARRAY['AWS', 'Cloud', 'Docker'],
  '[{"title": "AWS SAA 학습 가이드", "url": "https://example.com/aws-saa", "type": "article"}]'
),
(
  '리눅스마스터 2급',
  '[{"date": "2024-06-08", "registrationStart": "2024-04-15", "registrationEnd": "2024-05-10", "resultDate": "2024-07-12"}]',
  ARRAY['Linux', 'Cloud', 'DevOps'],
  '[{"title": "리눅스마스터 핵심 명령어", "url": "https://example.com/linux", "type": "article"}]'
);

-- ──────────────────────────────────────────────
-- 3. 사용자 프로필 (auth.users 생성 후 UUID 매핑 필요)
--
-- ⚡ 아래 UUID는 예시입니다.
-- Supabase Auth에서 생성된 실제 UUID로 교체하세요.
-- 또는 Supabase > SQL Editor에서 아래 함수로 자동 생성:
-- ──────────────────────────────────────────────

-- 데모 사용자 자동 생성 함수
-- Supabase Auth API로 직접 생성하거나,
-- Dashboard > Authentication > Users에서 수동 생성 후 아래 실행

-- 학생 5명 (다양한 상태)
-- student1: 모범생 (높은 스트릭, 높은 참여)
-- student2: 위험군 (출석 하락, 감정 저하)
-- student3: 초보 (막 시작, 데이터 적음)
-- student4: 중간 (보통)
-- student5: 취업 준비 집중 (문서 피드백 많이 사용)

-- ⚠️ 아래 SQL은 auth.users에 사용자가 존재한다고 가정합니다.
-- Supabase 대시보드에서 먼저 사용자를 만들고,
-- 그 UUID를 아래에 넣어주세요.

-- 예시 (실제 배포 시 UUID 교체):
DO $$
DECLARE
  v_student1 UUID;
  v_student2 UUID;
  v_student3 UUID;
  v_student4 UUID;
  v_student5 UUID;
  v_mentor UUID;
  v_admin UUID;
BEGIN
  -- auth.users에서 이메일로 UUID 조회
  SELECT id INTO v_student1 FROM auth.users WHERE email = 'student@classpulse.demo';
  SELECT id INTO v_student2 FROM auth.users WHERE email = 'student2@classpulse.demo';
  SELECT id INTO v_student3 FROM auth.users WHERE email = 'student3@classpulse.demo';
  SELECT id INTO v_student4 FROM auth.users WHERE email = 'student4@classpulse.demo';
  SELECT id INTO v_student5 FROM auth.users WHERE email = 'student5@classpulse.demo';
  SELECT id INTO v_mentor FROM auth.users WHERE email = 'mentor@classpulse.demo';
  SELECT id INTO v_admin FROM auth.users WHERE email = 'admin@classpulse.demo';

  -- 프로필 생성 (존재하는 사용자만)
  IF v_student1 IS NOT NULL THEN
    INSERT INTO user_profiles (user_id, role, name, course_id, target_job, target_company, github_url, projects, interests, target_certs)
    VALUES (v_student1, 'STUDENT', '김민수', 'c1000000-0000-0000-0000-000000000001',
      '백엔드 개발자', '카카오', 'https://github.com/minsu-demo',
      '[{"name": "TODO 앱", "description": "Spring Boot + React로 만든 할일 관리 앱", "techStack": ["Java", "Spring Boot", "React"], "githubUrl": "https://github.com/minsu-demo/todo-app"}]',
      ARRAY['Java', 'Spring Boot', 'MSA'], ARRAY['정보처리기사', 'SQLD']);

    -- 스트릭 (모범생: 15일 연속)
    INSERT INTO streak_records (user_id, current_streak, longest_streak, last_activity_date, rewards)
    VALUES (v_student1, 15, 22, CURRENT_DATE, '[{"day": 7, "title": "7일 연속 달성!", "unlockedAt": "2026-03-20T00:00:00Z"}, {"day": 14, "title": "14일 연속 달성!", "unlockedAt": "2026-04-02T00:00:00Z"}]');

    -- 학습 심박수 (최근 28일 — 풍부한 데모 데이터)
    -- 최근 15일: 꾸준히 출석 + 과제 (현재 스트릭)
    FOR i IN 0..14 LOOP
      INSERT INTO learning_pulse (user_id, date, attendance, assignment_done, questions_count, emotion_score, streak_count, risk_score, risk_level)
      VALUES (v_student1, CURRENT_DATE - i, true,
        CASE WHEN i <= 12 THEN true ELSE (random() > 0.3) END,
        2 + (random()*3)::int, 4 + (random())::int, 15 - i,
        CASE WHEN i <= 5 THEN 10 WHEN i <= 10 THEN 15 ELSE 20 END, 'GREEN');
    END LOOP;
    -- 16~18일 전: 잠깐 쉼 (스트릭 끊김 구간)
    INSERT INTO learning_pulse (user_id, date, attendance, assignment_done, questions_count, emotion_score, streak_count, risk_score, risk_level) VALUES
    (v_student1, CURRENT_DATE - 16, false, false, 0, 3, 0, 45, 'YELLOW'),
    (v_student1, CURRENT_DATE - 17, false, false, 0, 2, 0, 50, 'YELLOW'),
    (v_student1, CURRENT_DATE - 18, true, false, 1, 3, 1, 35, 'YELLOW');
    -- 19~27일 전: 이전 스트릭 구간
    FOR i IN 19..27 LOOP
      INSERT INTO learning_pulse (user_id, date, attendance, assignment_done, questions_count, emotion_score, streak_count, risk_score, risk_level)
      VALUES (v_student1, CURRENT_DATE - i, true, (random() > 0.2), 1 + (random()*3)::int, 3 + (random()*2)::int, 27 - i, 15, 'GREEN');
    END LOOP;

    -- 감정 체크인 (student1도 추가)
    INSERT INTO pulse_checkins (user_id, week, emotion, ai_response, created_at) VALUES
    (v_student1, 8, 'FIRE', '정말 대단해요! 15일 연속 출석이라니, 이 열정이면 백엔드 개발자 목표 충분히 달성할 수 있어요. Spring Boot 심화 학습도 순조롭게 진행되고 있네요!', now() - interval '1 day'),
    (v_student1, 7, 'HAPPY', '좋은 컨디션이네요! 이번 주 JPA 실습 잘 마무리하고, 주말에 TODO 앱에 Virtual Thread 적용해보면 포트폴리오가 한층 업그레이드될 거예요.', now() - interval '3 days'),
    (v_student1, 7, 'NEUTRAL', '괜찮아요, 보통인 날도 있는 거죠. 오늘은 가볍게 복습하면서 에너지를 충전해보세요. 내일 더 집중할 수 있을 거예요!', now() - interval '6 days'),
    (v_student1, 6, 'HAPPY', '6주차 잘 마무리했네요! Spring Security 인증/인가 파트가 어려웠을 텐데 잘 해내셨어요. 다음 주 MSA 진입이 기대됩니다.', now() - interval '10 days');

    -- ─── student1 문서 (자기소개서 + 포트폴리오) ───
    INSERT INTO documents (id, user_id, type, title, content, status, version, target_company, target_position) VALUES
    ('d1000000-0000-0000-0000-000000000010', v_student1, 'RESUME', '카카오 백엔드 개발자 자기소개서',
     '저는 Java와 Spring Boot를 활용한 웹 개발에 열정을 가진 주니어 개발자입니다. 코리아IT아카데미에서 6개월간 풀스택 과정을 이수하며 TODO 앱, 쇼핑몰 API 등의 프로젝트를 진행했습니다. 특히 Spring Boot 3.3의 Virtual Thread를 적용하여 동시 처리 성능을 개선한 경험이 있습니다. 카카오의 기술 문화와 대규모 트래픽 처리 환경에서 성장하고 싶습니다.',
     'COMPLETED', 2, '카카오', '백엔드 개발자'),
    ('d1000000-0000-0000-0000-000000000011', v_student1, 'PORTFOLIO', '김민수 포트폴리오',
     '## 프로젝트 1: TODO 앱\n- Spring Boot + React SPA\n- JWT 인증, REST API 설계\n- Docker 컨테이너화 + AWS EC2 배포\n\n## 프로젝트 2: ClassPulse (바이브코딩)\n- Next.js 15 + Supabase\n- AI 피드백 시스템 구현\n- Vercel 자동 배포',
     'AI_DRAFT', 1, NULL, NULL),
    ('d1000000-0000-0000-0000-000000000012', v_student1, 'COVER_LETTER', '네이버 서버 개발자 지원서',
     '네이버의 대규모 서비스 운영 환경에서 백엔드 개발자로 성장하고 싶습니다. JPA N+1 문제 해결, Redis 캐시 전략 적용, Docker 기반 CI/CD 파이프라인 구축 경험을 바탕으로 안정적인 서비스 개발에 기여하겠습니다.',
     'MENTOR_REVIEW', 1, '네이버', '서버 개발자');

    -- student1 문서 피드백
    INSERT INTO feedbacks (document_id, reviewer_type, content, score, status) VALUES
    ('d1000000-0000-0000-0000-000000000010', 'AI',
     '{"overall": "전체적으로 기술 경험이 잘 드러나 있어요! 카카오가 중시하는 협업 경험과 문제 해결 과정을 더 구체적으로 보여주면 좋겠어요.", "sections": [{"title": "기술 역량", "feedback": "Spring Boot + Virtual Thread 경험이 인상적이에요. 성능 수치를 추가하면 더 좋겠어요.", "suggestion": "TPS 200 → 2000 같은 구체적인 성능 개선 수치를 포함해보세요.", "score": 8}, {"title": "프로젝트 경험", "feedback": "TODO 앱은 좋지만 더 도전적인 프로젝트가 있으면 좋겠어요.", "suggestion": "실시간 채팅이나 대용량 데이터 처리 프로젝트를 추가해보세요.", "score": 7}]}',
     '{"overall": 78, "clarity": 80, "relevance": 75, "authenticity": 85, "impact": 70}',
     'COMPLETED'),
    ('d1000000-0000-0000-0000-000000000011', 'AI',
     '{"overall": "포트폴리오 구조가 깔끔해요! 각 프로젝트의 기술적 도전과 해결 과정을 더 자세히 서술하면 좋겠어요.", "sections": [{"title": "프로젝트 구성", "feedback": "2개 프로젝트는 적절해요. 기술 스택이 다양하게 보여요.", "suggestion": "각 프로젝트에 스크린샷과 아키텍처 다이어그램을 추가해보세요.", "score": 7}]}',
     '{"overall": 72, "clarity": 75, "relevance": 70, "authenticity": 80, "impact": 65}',
     'COMPLETED');

    -- ─── student1 채용공고 분석 ───
    INSERT INTO job_analyses (user_id, company_name, job_url, company_analysis, tech_stack, interview_prep, portfolio_guide, resume_guide, match_score) VALUES
    (v_student1, '카카오', 'https://careers.kakao.com/jobs/backend-2026',
     '{"industry": "IT/플랫폼", "size": "대기업 (4000+명)", "culture": "자율과 책임, 수평적 조직문화", "coreValues": ["기술적 도전", "사용자 중심", "협업"], "recentNews": ["카카오 AI 비전 2026 발표", "카카오톡 서버 MSA 전환 완료"]}',
     '{"required": ["Java", "Spring Boot", "MySQL"], "preferred": ["Kotlin", "Redis", "Kafka", "Kubernetes"], "inferred": ["MSA", "대용량 트래픽 처리"]}',
     '{"technical": ["Spring Boot에서 Virtual Thread와 기존 스레드풀 방식의 차이점", "JPA N+1 문제 해결 경험", "Redis 캐시 전략 설명"], "behavioral": ["팀 프로젝트에서 의견 충돌 해결 경험", "기술적 어려움을 극복한 사례"], "companySpecific": ["카카오톡 메시지 전송 시스템 설계", "대용량 트래픽 처리 방안"]}',
     '{"highlights": ["Spring Boot + Virtual Thread 실전 적용 경험", "Docker/AWS 배포 경험"], "improvements": ["대규모 트래픽 처리 프로젝트 추가 필요", "오픈소스 기여 경험 어필"], "projectSuggestions": ["실시간 채팅 서비스 구현", "Spring Cloud Gateway 기반 API Gateway"]}',
     '{"keyPoints": ["Virtual Thread 성능 개선 수치 강조", "팀 프로젝트에서의 역할과 기여도 구체화"], "storyLine": "기초부터 탄탄히 쌓아온 주니어 개발자가 카카오에서 대규모 서비스를 경험하며 성장하고 싶다", "coreValueConnection": "기술적 도전을 즐기며, 사용자 가치를 최우선으로 생각합니다"}',
     82),
    (v_student1, '토스', 'https://toss.im/career/backend-engineer',
     '{"industry": "핀테크", "size": "중견기업 (1500+명)", "culture": "빠른 실행, 데이터 기반 의사결정", "coreValues": ["금융의 혁신", "기술 주도", "임팩트"], "recentNews": ["토스뱅크 흑자 전환", "토스페이먼츠 글로벌 진출"]}',
     '{"required": ["Java", "Spring Boot", "JPA"], "preferred": ["Kotlin", "gRPC", "Event Sourcing"], "inferred": ["CQRS", "도메인 주도 설계"]}',
     '{"technical": ["트랜잭션 격리 수준과 동시성 제어", "이벤트 소싱 패턴 설명", "분산 시스템에서의 데이터 일관성"], "behavioral": ["빠른 의사결정이 필요했던 경험", "실패에서 배운 교훈"], "companySpecific": ["토스 송금 시스템의 동시성 처리", "결제 시스템 장애 대응 방안"]}',
     '{"highlights": ["REST API 설계 경험", "JPA 실전 사용 경험"], "improvements": ["금융 도메인 지식 보강 필요", "이벤트 기반 아키텍처 경험 추가"], "projectSuggestions": ["간단한 송금 시스템 구현", "이벤트 소싱 기반 주문 처리"]}',
     '{"keyPoints": ["실전 프로젝트 경험 강조", "성장 의지와 학습 속도 어필"], "storyLine": "빠르게 성장하는 핀테크 환경에서 기술적 임팩트를 만들고 싶은 주니어 개발자", "coreValueConnection": "기술로 금융의 불편함을 해결하는 토스의 미션에 공감합니다"}',
     75);

    -- ─── 멘토 가용 시간 (김태호 멘토) ───
    IF v_mentor IS NOT NULL THEN
      INSERT INTO mentor_availability (mentor_id, day_of_week, start_time, end_time, slot_minutes, is_active) VALUES
      (v_mentor, 1, '10:00', '12:00', 30, true),   -- 월요일 오전
      (v_mentor, 1, '14:00', '17:00', 30, true),   -- 월요일 오후
      (v_mentor, 2, '10:00', '12:00', 30, true),   -- 화요일 오전
      (v_mentor, 3, '14:00', '17:00', 30, true),   -- 수요일 오후
      (v_mentor, 4, '10:00', '12:00', 30, true),   -- 목요일 오전
      (v_mentor, 4, '14:00', '16:00', 30, true),   -- 목요일 오후
      (v_mentor, 5, '10:00', '12:00', 30, true);   -- 금요일 오전
    END IF;

    -- ─── student1 상담 기록 (과거 + 예정) ───
    IF v_mentor IS NOT NULL THEN
      INSERT INTO consultations (student_id, mentor_id, date, start_time, end_time, type, status, topic, student_memo, mentor_memo) VALUES
      (v_student1, v_mentor, CURRENT_DATE - 14, '10:00', '10:30', 'CAREER', 'COMPLETED',
       '백엔드 취업 전략 상담', '카카오, 네이버 중 어디를 먼저 지원할지 고민입니다.',
       '카카오는 기술 면접 비중이 높으니 알고리즘 준비를 병행하세요. 네이버는 프로젝트 경험을 더 강조하면 좋겠어요.'),
      (v_student1, v_mentor, CURRENT_DATE - 7, '14:00', '14:30', 'RESUME', 'COMPLETED',
       '자기소개서 피드백', '카카오 자소서 초안 완성했습니다.',
       '기술적 경험이 잘 드러나요! 협업 경험과 문제 해결 스토리를 더 넣으면 완벽해요.'),
      (v_student1, v_mentor, CURRENT_DATE + 3, '10:00', '10:30', 'PORTFOLIO', 'CONFIRMED',
       '포트폴리오 리뷰', '포트폴리오 1차 완성본 리뷰 부탁드립니다.', NULL),
      (v_student1, v_mentor, CURRENT_DATE + 10, '14:00', '14:30', 'CAREER', 'REQUESTED',
       '모의 면접 준비', '카카오 기술 면접 대비 모의 면접 부탁드립니다.', NULL);
    END IF;

    -- 알림
    INSERT INTO notifications (user_id, type, title, content) VALUES
    (v_student1, 'cert', '정보처리기사 시험 D-30', '정보처리기사 실기 시험까지 30일 남았습니다. 지금 시작하면 충분히 합격할 수 있어요!'),
    (v_student1, 'trend', '이번 주 Java 트렌드', 'Spring Boot 3.3에서 Virtual Thread 지원이 강화되었습니다. 당신의 TODO 앱에 적용해보세요.'),
    (v_student1, 'streak', '15일 연속 학습 달성!', '대단해요! 15일 연속 학습을 달성했습니다. 이 페이스를 유지하면 목표 달성이 눈앞이에요.'),
    (v_student1, 'feedback', '자기소개서 AI 피드백 완료', '카카오 백엔드 개발자 자기소개서에 대한 AI 피드백이 도착했어요. 확인해보세요!'),
    (v_student1, 'consult', '상담 확정: 포트폴리오 리뷰', '김태호 멘토와의 포트폴리오 리뷰 상담이 확정되었습니다.');
  END IF;

  IF v_student2 IS NOT NULL THEN
    INSERT INTO user_profiles (user_id, role, name, course_id, target_job, interests, target_certs)
    VALUES (v_student2, 'STUDENT', '이지은', 'c1000000-0000-0000-0000-000000000001',
      '프론트엔드 개발자', ARRAY['React', 'TypeScript', 'UX'], ARRAY['정보처리기사']);

    -- 스트릭 (위험군: 0일)
    INSERT INTO streak_records (user_id, current_streak, longest_streak, last_activity_date)
    VALUES (v_student2, 0, 5, CURRENT_DATE - 3);

    -- 학습 심박수 (출석 저하 패턴)
    INSERT INTO learning_pulse (user_id, date, attendance, assignment_done, questions_count, emotion_score, risk_score, risk_level) VALUES
    (v_student2, CURRENT_DATE, false, false, 0, 2, 75, 'ORANGE'),
    (v_student2, CURRENT_DATE - 1, false, false, 0, 2, 70, 'ORANGE'),
    (v_student2, CURRENT_DATE - 2, true, false, 1, 3, 55, 'YELLOW'),
    (v_student2, CURRENT_DATE - 3, true, true, 2, 3, 40, 'YELLOW'),
    (v_student2, CURRENT_DATE - 4, true, true, 3, 4, 20, 'GREEN');

    -- 감정 체크인 (피로감 상승)
    INSERT INTO pulse_checkins (user_id, week, emotion, ai_response) VALUES
    (v_student2, 8, 'TIRED', '힘든 시기를 보내고 있군요. 8주차는 프레임워크 진입 시점이라 누구나 힘들어하는 구간이에요. 잠깐 쉬어가는 것도 실력이에요. 내일 가벼운 CSS 실습부터 시작해볼까요?'),
    (v_student2, 7, 'NEUTRAL', '지난 주보다 조금 나아진 것 같아요! 기초가 탄탄해지고 있으니 조금만 더 힘내봐요.');

    INSERT INTO notifications (user_id, type, title, content) VALUES
    (v_student2, 'alert', '3일 연속 미출석 알림', '이지은님, 3일간 수업에 참여하지 않았어요. 혹시 어려운 점이 있나요? AI 브릿지 레슨으로 놓친 부분을 빠르게 따라잡을 수 있어요.');
  END IF;

  IF v_student3 IS NOT NULL THEN
    INSERT INTO user_profiles (user_id, role, name, course_id, target_job, interests)
    VALUES (v_student3, 'STUDENT', '박준형', 'c1000000-0000-0000-0000-000000000002',
      '데이터 분석가', ARRAY['Python', 'ML', '데이터시각화']);
    INSERT INTO streak_records (user_id, current_streak, longest_streak, last_activity_date)
    VALUES (v_student3, 3, 3, CURRENT_DATE);
  END IF;

  IF v_student4 IS NOT NULL THEN
    INSERT INTO user_profiles (user_id, role, name, course_id, target_job, interests, target_certs)
    VALUES (v_student4, 'STUDENT', '최서연', 'c1000000-0000-0000-0000-000000000003',
      '클라우드 엔지니어', ARRAY['AWS', 'DevOps', 'K8s'], ARRAY['AWS SAA', '리눅스마스터']);
    INSERT INTO streak_records (user_id, current_streak, longest_streak, last_activity_date)
    VALUES (v_student4, 7, 12, CURRENT_DATE);
  END IF;

  IF v_student5 IS NOT NULL THEN
    INSERT INTO user_profiles (user_id, role, name, course_id, target_job, target_company, github_url, projects, interests, target_certs)
    VALUES (v_student5, 'STUDENT', '정하윤', 'c1000000-0000-0000-0000-000000000001',
      '백엔드 개발자', '네이버', 'https://github.com/hayun-demo',
      '[{"name": "쇼핑몰 API", "description": "Spring Boot 기반 REST API 쇼핑몰 프로젝트", "techStack": ["Java", "Spring Boot", "JPA", "MySQL"], "githubUrl": "https://github.com/hayun-demo/shop-api"}]',
      ARRAY['Java', 'Spring', 'JPA'], ARRAY['정보처리기사', 'SQLD']);
    INSERT INTO streak_records (user_id, current_streak, longest_streak, last_activity_date)
    VALUES (v_student5, 10, 20, CURRENT_DATE);

    -- 문서 + 피드백 (취업 준비 집중 학생)
    INSERT INTO documents (id, user_id, type, title, content, status, version) VALUES
    ('d1000000-0000-0000-0000-000000000001', v_student5, 'RESUME', '네이버 백엔드 지원 자기소개서',
     '저는 Java와 Spring Boot를 활용하여 다양한 프로젝트를 진행해왔습니다. 특히 쇼핑몰 프로젝트에서 RESTful API 설계와 JPA를 활용한 데이터 모델링 경험을 쌓았습니다...',
     'COMPLETED', 2);

    INSERT INTO feedbacks (document_id, reviewer_type, content, score, status) VALUES
    ('d1000000-0000-0000-0000-000000000001', 'AI',
     '{"overall": "전체적으로 프로젝트 경험이 잘 드러나있어요. 다만 네이버가 강조하는 기술적 도전 경험이 부족해요.", "sections": [{"title": "프로젝트 경험", "feedback": "쇼핑몰 프로젝트 좋은데, 트래픽 처리나 성능 최적화 경험을 추가하면 훨씬 좋겠어요.", "suggestion": "대용량 트래픽 처리 경험이나 캐시 전략을 언급해보세요.", "score": 7}]}',
     '{"overall": 72, "clarity": 75, "relevance": 70, "authenticity": 80, "impact": 65}',
     'COMPLETED');
  END IF;

  -- 멘토
  IF v_mentor IS NOT NULL THEN
    INSERT INTO user_profiles (user_id, role, name, course_id)
    VALUES (v_mentor, 'MENTOR', '김태호 멘토', 'c1000000-0000-0000-0000-000000000001');
  END IF;

  -- 관리자
  IF v_admin IS NOT NULL THEN
    INSERT INTO user_profiles (user_id, role, name)
    VALUES (v_admin, 'ADMIN', '관리자');
  END IF;

END $$;

-- ──────────────────────────────────────────────
-- 4. 기술 트렌드 기사 (샘플)
-- ──────────────────────────────────────────────
INSERT INTO trend_articles (title, source_url, source_type, summary, tags, relevance_map) VALUES
('Spring Boot 3.3 Virtual Thread 정식 지원',
 'https://spring.io/blog/2024/05/virtual-threads',
 'blog',
 'Spring Boot 3.3부터 Virtual Thread가 정식 지원됩니다. 기존 스레드 모델 대비 10배 이상의 동시 요청 처리가 가능하며, 기존 코드 변경 없이 설정만으로 적용할 수 있습니다.',
 ARRAY['Java', 'Spring Boot', 'Virtual Thread', '성능'],
 '{"Java 풀스택 개발자 양성과정": 0.95}'),

('Python 3.13 새로운 기능 총정리',
 'https://realpython.com/python313-new-features/',
 'article',
 'Python 3.13에서 추가된 주요 기능을 정리합니다. 개선된 에러 메시지, 타입 힌트 강화, 성능 개선 등이 포함됩니다.',
 ARRAY['Python', '업데이트', '언어'],
 '{"Python AI/데이터분석 과정": 0.9}'),

('AWS re:Invent 2024 핵심 발표 정리',
 'https://aws.amazon.com/blogs/reinvent-2024/',
 'blog',
 'AWS re:Invent 2024에서 발표된 새로운 서비스와 기능을 정리합니다. AI/ML 서비스 강화, 비용 최적화 도구, 새로운 컨테이너 서비스 등.',
 ARRAY['AWS', 'Cloud', 'AI', '컨퍼런스'],
 '{"클라우드 엔지니어링 과정": 0.95, "Python AI/데이터분석 과정": 0.5}');
