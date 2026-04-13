-- ==============================================
-- ClassPulse 통합 시드 (안전 버전)
-- 중복 무시 + 기존 데이터 건너뜀
-- Supabase SQL Editor에 복붙 후 실행하면 끝!
-- ==============================================

-- 1. courses (중복 무시)
INSERT INTO courses (id, name, description, duration_weeks, difficulty_map, tech_stack) VALUES
('c1000000-0000-0000-0000-000000000001', 'Java 풀스택 개발자 양성과정', 'Java, Spring Boot, React를 활용한 풀스택 개발 6개월 과정', 24, '{"week_4": 3, "week_8": 5, "week_12": 8, "week_16": 9, "week_20": 7, "week_24": 6}', ARRAY['Java', 'Spring Boot', 'React', 'MySQL', 'Docker']),
('c1000000-0000-0000-0000-000000000002', 'Python AI/데이터분석 과정', 'Python, 머신러닝, 데이터 시각화 5개월 과정', 20, '{"week_4": 3, "week_8": 6, "week_12": 9, "week_16": 8, "week_20": 7}', ARRAY['Python', 'TensorFlow', 'Pandas', 'SQL', 'Tableau']),
('c1000000-0000-0000-0000-000000000003', '클라우드 엔지니어링 과정', 'AWS, Docker, Kubernetes 기반 클라우드 인프라 4개월 과정', 16, '{"week_4": 4, "week_8": 7, "week_12": 9, "week_16": 8}', ARRAY['AWS', 'Docker', 'Kubernetes', 'Terraform', 'Linux'])
ON CONFLICT (id) DO NOTHING;

-- 2. 메인 시드
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
  SELECT id INTO v_student1 FROM auth.users WHERE email = 'student@classpulse.demo';
  SELECT id INTO v_student2 FROM auth.users WHERE email = 'student2@classpulse.demo';
  SELECT id INTO v_student3 FROM auth.users WHERE email = 'student3@classpulse.demo';
  SELECT id INTO v_student4 FROM auth.users WHERE email = 'student4@classpulse.demo';
  SELECT id INTO v_student5 FROM auth.users WHERE email = 'student5@classpulse.demo';
  SELECT id INTO v_mentor FROM auth.users WHERE email = 'mentor@classpulse.demo';
  SELECT id INTO v_admin FROM auth.users WHERE email = 'admin@classpulse.demo';

  -- ── 프로필 (ON CONFLICT 처리) ──
  IF v_student1 IS NOT NULL THEN
    INSERT INTO user_profiles (user_id, role, name, course_id, target_job, target_company, github_url, projects, interests, target_certs)
    VALUES (v_student1, 'STUDENT', '김민수', 'c1000000-0000-0000-0000-000000000001',
      '백엔드 개발자', '카카오', 'https://github.com/minsu-demo',
      '[{"name": "TODO 앱", "description": "Spring Boot + React로 만든 할일 관리 앱", "techStack": ["Java", "Spring Boot", "React"], "githubUrl": "https://github.com/minsu-demo/todo-app"}]',
      ARRAY['Java', 'Spring Boot', 'MSA'], ARRAY['정보처리기사', 'SQLD'])
    ON CONFLICT (user_id) DO NOTHING;

    INSERT INTO streak_records (user_id, current_streak, longest_streak, last_activity_date, rewards)
    VALUES (v_student1, 15, 22, CURRENT_DATE, '[{"day": 7, "title": "7일 연속 달성!", "unlockedAt": "2026-03-20T00:00:00Z"}, {"day": 14, "title": "14일 연속 달성!", "unlockedAt": "2026-04-02T00:00:00Z"}]')
    ON CONFLICT (user_id) DO NOTHING;

    -- 학습 심박수
    FOR i IN 0..14 LOOP
      INSERT INTO learning_pulse (user_id, date, attendance, assignment_done, questions_count, emotion_score, streak_count, risk_score, risk_level)
      VALUES (v_student1, CURRENT_DATE - i, true,
        CASE WHEN i <= 12 THEN true ELSE (random() > 0.3) END,
        2 + (random()*3)::int, 4 + (random())::int, 15 - i,
        CASE WHEN i <= 5 THEN 10 WHEN i <= 10 THEN 15 ELSE 20 END, 'GREEN')
      ON CONFLICT DO NOTHING;
    END LOOP;

    INSERT INTO learning_pulse (user_id, date, attendance, assignment_done, questions_count, emotion_score, streak_count, risk_score, risk_level) VALUES
    (v_student1, CURRENT_DATE - 16, false, false, 0, 3, 0, 45, 'YELLOW'),
    (v_student1, CURRENT_DATE - 17, false, false, 0, 2, 0, 50, 'YELLOW'),
    (v_student1, CURRENT_DATE - 18, true, false, 1, 3, 1, 35, 'YELLOW')
    ON CONFLICT DO NOTHING;

    FOR i IN 19..27 LOOP
      INSERT INTO learning_pulse (user_id, date, attendance, assignment_done, questions_count, emotion_score, streak_count, risk_score, risk_level)
      VALUES (v_student1, CURRENT_DATE - i, true, (random() > 0.2), 1 + (random()*3)::int, 3 + (random()*2)::int, 27 - i, 15, 'GREEN')
      ON CONFLICT DO NOTHING;
    END LOOP;

    -- 감정 체크인
    INSERT INTO pulse_checkins (user_id, week, emotion, ai_response, created_at) VALUES
    (v_student1, 8, 'FIRE', '정말 대단해요! 15일 연속 출석이라니, 이 열정이면 백엔드 개발자 목표 충분히 달성할 수 있어요.', now() - interval '1 day'),
    (v_student1, 7, 'HAPPY', '좋은 컨디션이네요! 이번 주 JPA 실습 잘 마무리하고 주말에 TODO 앱에 Virtual Thread 적용해보세요.', now() - interval '3 days'),
    (v_student1, 7, 'NEUTRAL', '괜찮아요, 보통인 날도 있는 거죠. 오늘은 가볍게 복습하면서 에너지를 충전해보세요.', now() - interval '6 days'),
    (v_student1, 6, 'HAPPY', '6주차 잘 마무리했네요! Spring Security 인증/인가 파트가 어려웠을 텐데 잘 해내셨어요.', now() - interval '10 days');

    -- student1 문서
    INSERT INTO documents (id, user_id, type, title, content, status, version, target_company, target_position) VALUES
    ('d1000000-0000-0000-0000-000000000010', v_student1, 'RESUME', '카카오 백엔드 개발자 자기소개서',
     '저는 Java와 Spring Boot를 활용한 웹 개발에 열정을 가진 주니어 개발자입니다. 코리아IT아카데미에서 6개월간 풀스택 과정을 이수하며 TODO 앱, 쇼핑몰 API 등의 프로젝트를 진행했습니다. 특히 Spring Boot 3.3의 Virtual Thread를 적용하여 동시 처리 성능을 개선한 경험이 있습니다. 카카오의 기술 문화와 대규모 트래픽 처리 환경에서 성장하고 싶습니다.',
     'COMPLETED', 2, '카카오', '백엔드 개발자'),
    ('d1000000-0000-0000-0000-000000000011', v_student1, 'PORTFOLIO', '김민수 포트폴리오',
     '## 프로젝트 1: TODO 앱\n- Spring Boot + React SPA\n- JWT 인증, REST API 설계\n- Docker 컨테이너화 + AWS EC2 배포\n\n## 프로젝트 2: ClassPulse\n- Next.js 15 + Supabase\n- AI 피드백 시스템 구현\n- Vercel 자동 배포',
     'AI_DRAFT', 1, NULL, NULL),
    ('d1000000-0000-0000-0000-000000000012', v_student1, 'COVER_LETTER', '네이버 서버 개발자 지원서',
     '네이버의 대규모 서비스 운영 환경에서 백엔드 개발자로 성장하고 싶습니다. JPA N+1 문제 해결, Redis 캐시 전략 적용, Docker 기반 CI/CD 파이프라인 구축 경험을 바탕으로 안정적인 서비스 개발에 기여하겠습니다.',
     'MENTOR_REVIEW', 1, '네이버', '서버 개발자')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO feedbacks (document_id, reviewer_type, content, score, status) VALUES
    ('d1000000-0000-0000-0000-000000000010', 'AI',
     '{"overall": "전체적으로 기술 경험이 잘 드러나 있어요! 협업 경험과 문제 해결 과정을 더 구체적으로 보여주면 좋겠어요.", "sections": [{"title": "기술 역량", "feedback": "Spring Boot + Virtual Thread 경험이 인상적이에요.", "suggestion": "TPS 200→2000 같은 구체적 수치를 포함해보세요.", "score": 8}, {"title": "프로젝트 경험", "feedback": "TODO 앱은 좋지만 더 도전적인 프로젝트가 필요해요.", "suggestion": "실시간 채팅이나 대용량 데이터 처리 프로젝트를 추가해보세요.", "score": 7}]}',
     '{"overall": 78, "clarity": 80, "relevance": 75, "authenticity": 85, "impact": 70}', 'COMPLETED'),
    ('d1000000-0000-0000-0000-000000000011', 'AI',
     '{"overall": "포트폴리오 구조가 깔끔해요! 기술적 도전과 해결 과정을 더 자세히 서술하면 좋겠어요.", "sections": [{"title": "프로젝트 구성", "feedback": "2개 프로젝트, 기술 스택이 다양하게 보여요.", "suggestion": "스크린샷과 아키텍처 다이어그램을 추가해보세요.", "score": 7}]}',
     '{"overall": 72, "clarity": 75, "relevance": 70, "authenticity": 80, "impact": 65}', 'COMPLETED');

    -- 채용공고 분석
    INSERT INTO job_analyses (user_id, company_name, job_url, company_analysis, tech_stack, interview_prep, portfolio_guide, resume_guide, match_score) VALUES
    (v_student1, '카카오', 'https://careers.kakao.com/jobs/backend-2026',
     '{"industry": "IT/플랫폼", "size": "대기업 (4000+명)", "culture": "자율과 책임, 수평적 조직문화", "coreValues": ["기술적 도전", "사용자 중심", "협업"]}',
     '{"required": ["Java", "Spring Boot", "MySQL"], "preferred": ["Kotlin", "Redis", "Kafka", "Kubernetes"]}',
     '{"technical": ["Virtual Thread와 기존 스레드풀 차이", "JPA N+1 해결 경험", "Redis 캐시 전략"], "behavioral": ["의견 충돌 해결 경험", "기술적 어려움 극복 사례"]}',
     '{"highlights": ["Spring Boot + Virtual Thread 경험", "Docker/AWS 배포 경험"], "improvements": ["대규모 트래픽 처리 프로젝트 추가"]}',
     '{"keyPoints": ["Virtual Thread 성능 수치 강조", "팀에서의 역할 구체화"], "storyLine": "기초부터 탄탄히 쌓아온 주니어 개발자가 카카오에서 성장하고 싶다"}',
     82);

    -- 알림
    INSERT INTO notifications (user_id, type, title, content) VALUES
    (v_student1, 'cert', '정보처리기사 시험 D-30', '정보처리기사 실기 시험까지 30일 남았습니다. 지금 시작하면 합격할 수 있어요!'),
    (v_student1, 'streak', '15일 연속 학습 달성!', '대단해요! 15일 연속 학습을 달성했습니다.'),
    (v_student1, 'feedback', '자기소개서 AI 피드백 완료', '카카오 백엔드 자기소개서에 대한 AI 피드백이 도착했어요.'),
    (v_student1, 'consult', '상담 확정: 포트폴리오 리뷰', '김태호 멘토와의 포트폴리오 리뷰 상담이 확정되었습니다.');
  END IF;

  -- ── student2 (이지은) ──
  IF v_student2 IS NOT NULL THEN
    INSERT INTO user_profiles (user_id, role, name, course_id, target_job, interests, target_certs)
    VALUES (v_student2, 'STUDENT', '이지은', 'c1000000-0000-0000-0000-000000000001', '프론트엔드 개발자', ARRAY['React', 'TypeScript', 'UX'], ARRAY['정보처리기사'])
    ON CONFLICT (user_id) DO NOTHING;
    INSERT INTO streak_records (user_id, current_streak, longest_streak, last_activity_date)
    VALUES (v_student2, 0, 5, CURRENT_DATE - 3) ON CONFLICT (user_id) DO NOTHING;
    INSERT INTO learning_pulse (user_id, date, attendance, assignment_done, questions_count, emotion_score, risk_score, risk_level) VALUES
    (v_student2, CURRENT_DATE, false, false, 0, 2, 75, 'ORANGE'),
    (v_student2, CURRENT_DATE - 1, false, false, 0, 2, 70, 'ORANGE'),
    (v_student2, CURRENT_DATE - 2, true, false, 1, 3, 55, 'YELLOW'),
    (v_student2, CURRENT_DATE - 3, true, true, 2, 3, 40, 'YELLOW'),
    (v_student2, CURRENT_DATE - 4, true, true, 3, 4, 20, 'GREEN') ON CONFLICT DO NOTHING;
  END IF;

  -- ── student3 (박준형) ──
  IF v_student3 IS NOT NULL THEN
    INSERT INTO user_profiles (user_id, role, name, course_id, target_job, interests)
    VALUES (v_student3, 'STUDENT', '박준형', 'c1000000-0000-0000-0000-000000000002', '데이터 분석가', ARRAY['Python', 'ML', '데이터시각화'])
    ON CONFLICT (user_id) DO NOTHING;
    INSERT INTO streak_records (user_id, current_streak, longest_streak, last_activity_date)
    VALUES (v_student3, 3, 3, CURRENT_DATE) ON CONFLICT (user_id) DO NOTHING;
  END IF;

  -- ── student4 (최서연) ──
  IF v_student4 IS NOT NULL THEN
    INSERT INTO user_profiles (user_id, role, name, course_id, target_job, interests, target_certs)
    VALUES (v_student4, 'STUDENT', '최서연', 'c1000000-0000-0000-0000-000000000003', '클라우드 엔지니어', ARRAY['AWS', 'DevOps', 'K8s'], ARRAY['AWS SAA', '리눅스마스터'])
    ON CONFLICT (user_id) DO NOTHING;
    INSERT INTO streak_records (user_id, current_streak, longest_streak, last_activity_date)
    VALUES (v_student4, 7, 12, CURRENT_DATE) ON CONFLICT (user_id) DO NOTHING;
  END IF;

  -- ── student5 (정하윤) ──
  IF v_student5 IS NOT NULL THEN
    INSERT INTO user_profiles (user_id, role, name, course_id, target_job, target_company, github_url, projects, interests, target_certs)
    VALUES (v_student5, 'STUDENT', '정하윤', 'c1000000-0000-0000-0000-000000000001', '백엔드 개발자', '네이버', 'https://github.com/hayun-demo',
      '[{"name": "쇼핑몰 API", "description": "Spring Boot 기반 REST API 쇼핑몰", "techStack": ["Java", "Spring Boot", "JPA", "MySQL"]}]',
      ARRAY['Java', 'Spring', 'JPA'], ARRAY['정보처리기사', 'SQLD'])
    ON CONFLICT (user_id) DO NOTHING;
    INSERT INTO streak_records (user_id, current_streak, longest_streak, last_activity_date)
    VALUES (v_student5, 10, 20, CURRENT_DATE) ON CONFLICT (user_id) DO NOTHING;
    INSERT INTO documents (id, user_id, type, title, content, status, version) VALUES
    ('d1000000-0000-0000-0000-000000000001', v_student5, 'RESUME', '네이버 백엔드 지원 자기소개서',
     '저는 Java와 Spring Boot를 활용하여 다양한 프로젝트를 진행해왔습니다. 쇼핑몰 프로젝트에서 RESTful API 설계와 JPA를 활용한 데이터 모델링 경험을 쌓았습니다.',
     'COMPLETED', 2) ON CONFLICT (id) DO NOTHING;
    INSERT INTO feedbacks (document_id, reviewer_type, content, score, status) VALUES
    ('d1000000-0000-0000-0000-000000000001', 'AI',
     '{"overall": "프로젝트 경험이 잘 드러나있어요. 기술적 도전 경험이 부족해요.", "sections": [{"title": "프로젝트 경험", "feedback": "트래픽 처리나 성능 최적화 경험을 추가하면 좋겠어요.", "suggestion": "캐시 전략을 언급해보세요.", "score": 7}]}',
     '{"overall": 72, "clarity": 75, "relevance": 70, "authenticity": 80, "impact": 65}', 'COMPLETED');
  END IF;

  -- ── 멘토 프로필 ──
  IF v_mentor IS NOT NULL THEN
    INSERT INTO user_profiles (user_id, role, name, course_id)
    VALUES (v_mentor, 'MENTOR', '김태호 멘토', 'c1000000-0000-0000-0000-000000000001')
    ON CONFLICT (user_id) DO NOTHING;

    INSERT INTO mentor_availability (mentor_id, day_of_week, start_time, end_time, slot_minutes, is_active) VALUES
    (v_mentor, 1, '10:00', '12:00', 30, true),
    (v_mentor, 1, '14:00', '17:00', 30, true),
    (v_mentor, 2, '10:00', '12:00', 30, true),
    (v_mentor, 3, '14:00', '17:00', 30, true),
    (v_mentor, 4, '10:00', '12:00', 30, true),
    (v_mentor, 4, '14:00', '16:00', 30, true),
    (v_mentor, 5, '10:00', '12:00', 30, true);
  END IF;

  -- ── 관리자 프로필 ──
  IF v_admin IS NOT NULL THEN
    INSERT INTO user_profiles (user_id, role, name)
    VALUES (v_admin, 'ADMIN', '관리자')
    ON CONFLICT (user_id) DO NOTHING;

    INSERT INTO mentor_availability (mentor_id, day_of_week, start_time, end_time, slot_minutes, is_active) VALUES
    (v_admin, 1, '13:00', '17:00', 30, true),
    (v_admin, 3, '10:00', '12:00', 30, true),
    (v_admin, 3, '13:00', '17:00', 30, true),
    (v_admin, 5, '13:00', '16:00', 30, true);
  END IF;

  -- ══════════════════════════════════════════════
  -- 상담 내역 (다양한 학생)
  -- ══════════════════════════════════════════════

  -- student1 상담
  IF v_student1 IS NOT NULL AND v_mentor IS NOT NULL THEN
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

  -- student2 상담
  IF v_student2 IS NOT NULL AND v_mentor IS NOT NULL THEN
    INSERT INTO consultations (student_id, mentor_id, date, start_time, end_time, type, status, topic, student_memo, mentor_memo) VALUES
    (v_student2, v_mentor, CURRENT_DATE - 21, '10:00', '10:30', 'LEARNING', 'COMPLETED',
     'React 학습 방향 상담', 'JavaScript 기초가 부족해서 React 진도를 따라가기 힘들어요.',
     '기초가 부족하면 React가 어려울 수 있어요. ES6+ 문법부터 다시 정리하고, 간단한 미니 프로젝트로 연습하세요.'),
    (v_student2, v_mentor, CURRENT_DATE - 10, '14:00', '14:30', 'PERSONAL', 'COMPLETED',
     '학습 동기 저하 상담', '요즘 수업 따라가기가 너무 힘들어서 의욕이 없어요.',
     '8주차가 가장 힘든 구간이에요. 작은 성공 경험을 쌓는 게 중요합니다. TODO 앱부터 만들어보세요.'),
    (v_student2, v_mentor, CURRENT_DATE + 2, '10:00', '10:30', 'LEARNING', 'CONFIRMED',
     'JavaScript 기초 보충 상담', 'ES6 화살표 함수, 구조분해할당 부분 질문드리고 싶어요.', NULL);
  END IF;

  IF v_student2 IS NOT NULL AND v_admin IS NOT NULL THEN
    INSERT INTO consultations (student_id, mentor_id, date, start_time, end_time, type, status, topic, student_memo, mentor_memo) VALUES
    (v_student2, v_admin, CURRENT_DATE - 5, '13:00', '13:30', 'PERSONAL', 'COMPLETED',
     '과정 적응 고민 상담', '프론트엔드가 맞는지 모르겠어요. 백엔드로 전향할까 고민됩니다.',
     '두 분야 다 경험해보는 게 중요해요. 프로젝트 하면서 적성을 찾아보세요.');
  END IF;

  -- student3 상담
  IF v_student3 IS NOT NULL AND v_mentor IS NOT NULL THEN
    INSERT INTO consultations (student_id, mentor_id, date, start_time, end_time, type, status, topic, student_memo, mentor_memo) VALUES
    (v_student3, v_mentor, CURRENT_DATE - 7, '10:30', '11:00', 'CAREER', 'COMPLETED',
     '데이터 분석가 취업 준비', 'Python 과정 중인데, 데이터 분석가가 되려면 뭘 더 해야 할까요?',
     'Kaggle 프로젝트 2~3개 진행하고, SQL + Tableau를 익히세요. 포트폴리오가 핵심입니다.'),
    (v_student3, v_mentor, CURRENT_DATE + 7, '14:00', '14:30', 'PORTFOLIO', 'REQUESTED',
     'Kaggle 프로젝트 리뷰', 'Kaggle 타이타닉 프로젝트 완성했는데 리뷰 부탁드려요.', NULL);
  END IF;

  -- student4 상담
  IF v_student4 IS NOT NULL AND v_admin IS NOT NULL THEN
    INSERT INTO consultations (student_id, mentor_id, date, start_time, end_time, type, status, topic, student_memo, mentor_memo) VALUES
    (v_student4, v_admin, CURRENT_DATE - 14, '15:00', '15:30', 'CAREER', 'COMPLETED',
     'AWS 자격증 준비 전략', 'AWS SAA 시험 준비 어떻게 하면 좋을까요?',
     'AWS 공식 연습문제와 Udemy 강의를 병행하세요. 시험 2주 전부터 모의고사에 집중하세요.'),
    (v_student4, v_admin, CURRENT_DATE - 3, '13:30', '14:00', 'RESUME', 'COMPLETED',
     '클라우드 엔지니어 자소서 리뷰', 'AWS 경험 위주로 작성했는데 피드백 부탁합니다.',
     'AWS 자격증 + 실습 경험이 잘 드러나 있어요. 장애 대응이나 비용 최적화 경험을 추가하면 더 좋겠어요.'),
    (v_student4, v_admin, CURRENT_DATE + 5, '13:00', '13:30', 'CAREER', 'CONFIRMED',
     '클라우드 기업 지원 전략', 'NHN 클라우드, 네이버 클라우드 중 어디가 좋을까요?', NULL);
  END IF;

  -- student5 상담
  IF v_student5 IS NOT NULL AND v_mentor IS NOT NULL THEN
    INSERT INTO consultations (student_id, mentor_id, date, start_time, end_time, type, status, topic, student_memo, mentor_memo) VALUES
    (v_student5, v_mentor, CURRENT_DATE - 18, '10:00', '10:30', 'RESUME', 'COMPLETED',
     '네이버 자소서 1차 피드백', '네이버 서버 개발자 자소서 초안입니다.',
     '기술 나열이 많아요. "문제 해결 과정"을 STAR 기법으로 풀어보세요.'),
    (v_student5, v_mentor, CURRENT_DATE - 11, '14:00', '14:30', 'RESUME', 'COMPLETED',
     '네이버 자소서 2차 수정본', '피드백 반영해서 STAR 기법으로 다시 썼어요.',
     '훨씬 좋아졌어요! JPA N+1 해결 부분이 인상적이에요.'),
    (v_student5, v_mentor, CURRENT_DATE - 4, '10:30', '11:00', 'CAREER', 'COMPLETED',
     '네이버 면접 준비 상담', '서류 합격했습니다! 기술 면접 준비 어떻게 할까요?',
     '축하해요! CS 기초 + 시스템 설계를 중시해요. 본인 프로젝트의 기술적 의사결정을 설명할 수 있게 준비하세요.'),
    (v_student5, v_mentor, CURRENT_DATE + 1, '10:00', '10:30', 'CAREER', 'CONFIRMED',
     '네이버 모의 기술 면접', '모의 면접으로 기술 질문 연습하고 싶습니다.', NULL);
  END IF;

  -- ══════════════════════════════════════════════
  -- 추가 문서 + 피드백
  -- ══════════════════════════════════════════════

  IF v_student2 IS NOT NULL THEN
    INSERT INTO documents (id, user_id, type, title, content, status, version, target_company, target_position) VALUES
    ('d2000000-0000-0000-0000-000000000001', v_student2, 'RESUME', '프론트엔드 개발자 자기소개서',
     '안녕하세요, 프론트엔드 개발을 배우고 있는 이지은입니다. React와 TypeScript를 배우면서 웹 개발에 흥미를 느끼게 되었습니다. 사용자 경험을 중시하는 개발자가 되고 싶습니다.',
     'COMPLETED', 1, '토스', '프론트엔드 개발자') ON CONFLICT (id) DO NOTHING;
    INSERT INTO feedbacks (document_id, reviewer_type, content, score, status) VALUES
    ('d2000000-0000-0000-0000-000000000001', 'AI',
     '{"overall": "열정은 느껴지지만, 구체적인 프로젝트 경험이 부족해요.", "sections": [{"title": "자기 어필", "feedback": "배우고 있는 과정에서의 성장을 강조하세요.", "suggestion": "React로 TODO 앱을 완성한 경험처럼 구체적으로 바꿔보세요.", "score": 5}]}',
     '{"overall": 48, "clarity": 55, "relevance": 40, "authenticity": 65, "impact": 30}', 'COMPLETED');
  END IF;

  IF v_student3 IS NOT NULL THEN
    INSERT INTO documents (id, user_id, type, title, content, status, version) VALUES
    ('d3000000-0000-0000-0000-000000000001', v_student3, 'PORTFOLIO', '데이터 분석 포트폴리오',
     '## 프로젝트 1: 타이타닉 생존자 예측\n- Kaggle, Python, Scikit-learn\n- 정확도 82.3%\n\n## 프로젝트 2: 서울시 공공자전거 이용 분석\n- 공공데이터 API, Matplotlib, Seaborn',
     'AI_DRAFT', 1) ON CONFLICT (id) DO NOTHING;
    INSERT INTO feedbacks (document_id, reviewer_type, content, score, status) VALUES
    ('d3000000-0000-0000-0000-000000000001', 'AI',
     '{"overall": "포트폴리오 방향이 좋아요! 비즈니스 인사이트를 더 강조하면 좋겠어요.", "sections": [{"title": "프로젝트 구성", "feedback": "실무와 가까운 프로젝트를 추가하세요.", "suggestion": "고객 이탈 예측 같은 프로젝트를 추가하세요.", "score": 6}]}',
     '{"overall": 65, "clarity": 70, "relevance": 60, "authenticity": 75, "impact": 55}', 'COMPLETED');
  END IF;

  IF v_student4 IS NOT NULL THEN
    INSERT INTO documents (id, user_id, type, title, content, status, version, target_company, target_position) VALUES
    ('d4000000-0000-0000-0000-000000000001', v_student4, 'RESUME', 'NHN 클라우드 엔지니어 자기소개서',
     'AWS 클라우드 인프라와 컨테이너 오케스트레이션에 전문성을 기르고 있는 주니어 엔지니어입니다. EKS 기반 마이크로서비스 배포 환경을 구축한 경험이 있습니다.',
     'MENTOR_REVIEW', 1, 'NHN', '클라우드 엔지니어'),
    ('d4000000-0000-0000-0000-000000000002', v_student4, 'PORTFOLIO', '클라우드 인프라 포트폴리오',
     '## EKS 기반 MSA 배포 환경\n- AWS EKS + Helm + Terraform\n\n## CI/CD 파이프라인\n- GitHub Actions + ArgoCD\n- 블루/그린 배포',
     'COMPLETED', 2, NULL, NULL) ON CONFLICT (id) DO NOTHING;
    INSERT INTO feedbacks (document_id, reviewer_type, content, score, status) VALUES
    ('d4000000-0000-0000-0000-000000000001', 'AI',
     '{"overall": "기술적으로 탄탄해요! NHN 클라우드 사업과 연결짓는 부분을 추가하면 더 좋겠어요.", "sections": [{"title": "기술 역량", "feedback": "AWS + K8s + Terraform 조합이 인상적이에요.", "suggestion": "비용 최적화나 장애 대응 경험을 추가하세요.", "score": 8}]}',
     '{"overall": 76, "clarity": 80, "relevance": 72, "authenticity": 82, "impact": 68}', 'COMPLETED'),
    ('d4000000-0000-0000-0000-000000000002', 'AI',
     '{"overall": "체계적이에요! 아키텍처 다이어그램과 비용 분석을 추가하면 완성도가 올라갈 거예요.", "sections": [{"title": "프로젝트 깊이", "feedback": "부하 테스트 결과를 추가하면 설득력 있어요.", "suggestion": "JMeter로 Auto Scaling 결과를 포함하세요.", "score": 8}]}',
     '{"overall": 80, "clarity": 82, "relevance": 78, "authenticity": 85, "impact": 75}', 'COMPLETED');
  END IF;

  IF v_student5 IS NOT NULL THEN
    INSERT INTO documents (id, user_id, type, title, content, status, version, target_company, target_position) VALUES
    ('d5000000-0000-0000-0000-000000000001', v_student5, 'RESUME', '토스 서버 개발자 자기소개서',
     'JPA N+1 문제를 Fetch Join과 BatchSize로 해결하여 쿼리 수를 90% 줄이고, Redis 캐시로 API 응답 시간을 300ms에서 50ms로 개선한 경험이 있습니다.',
     'AI_DRAFT', 1, '토스', '서버 개발자') ON CONFLICT (id) DO NOTHING;
    INSERT INTO feedbacks (document_id, reviewer_type, content, score, status) VALUES
    ('d5000000-0000-0000-0000-000000000001', 'AI',
     '{"overall": "구체적인 수치가 설득력 높아요! 토스 핀테크 도메인과 연결짓는 내용을 보강하면 완벽해요.", "sections": [{"title": "성과 수치", "feedback": "쿼리 90% 감소, 응답 6배 개선 매우 인상적.", "suggestion": "토스 결제 시스템에서 어떻게 활용할 수 있는지 연결하세요.", "score": 9}]}',
     '{"overall": 82, "clarity": 85, "relevance": 78, "authenticity": 88, "impact": 76}', 'COMPLETED');
  END IF;

  -- ══════════════════════════════════════════════
  -- 멘토 첨삭
  -- ══════════════════════════════════════════════
  IF v_mentor IS NOT NULL AND v_student1 IS NOT NULL THEN
    INSERT INTO document_revisions (document_id, mentor_id, original_content, revised_content, revision_notes, section_index, status) VALUES
    ('d1000000-0000-0000-0000-000000000010', v_mentor,
     '저는 Java와 Spring Boot를 활용한 웹 개발에 열정을 가진 주니어 개발자입니다.',
     '6개월간 Java와 Spring Boot로 3개의 실전 프로젝트를 완성하며, 동시 처리 성능을 10배 개선한 경험을 가진 개발자입니다.',
     '첫 문장에서 "열정"보다 구체적인 성과를 보여주세요.', 0, 'ACCEPTED'),
    ('d1000000-0000-0000-0000-000000000010', v_mentor,
     '카카오의 기술 문화와 대규모 트래픽 처리 환경에서 성장하고 싶습니다.',
     '카카오톡이 매일 수십억 건의 메시지를 처리하는 기술적 도전에 매력을 느끼며, MSA 전환 과정에서 함께 기여하고 싶습니다.',
     '"성장하고 싶다"보다 회사의 기술 과제를 언급하며 기여 포인트를 보여주세요.', 1, 'ACCEPTED');
  END IF;

  IF v_mentor IS NOT NULL AND v_student2 IS NOT NULL THEN
    INSERT INTO document_revisions (document_id, mentor_id, original_content, revised_content, revision_notes, section_index, status) VALUES
    ('d2000000-0000-0000-0000-000000000001', v_mentor,
     '안녕하세요, 프론트엔드 개발을 배우고 있는 이지은입니다.',
     'React와 TypeScript로 인터랙티브한 UI를 만드는 데 재미를 느끼고 있는 프론트엔드 개발자 이지은입니다.',
     '"배우고 있는"보다 이미 할 수 있는 것을 보여주세요!', 0, 'ACCEPTED');
  END IF;

  IF v_mentor IS NOT NULL AND v_student4 IS NOT NULL THEN
    INSERT INTO document_revisions (document_id, mentor_id, original_content, revised_content, revision_notes, section_index, status) VALUES
    ('d4000000-0000-0000-0000-000000000001', v_mentor,
     'AWS 클라우드 인프라와 컨테이너 오케스트레이션에 전문성을 기르고 있는 주니어 엔지니어입니다.',
     'AWS EKS 기반 마이크로서비스 3종을 설계·배포하고 Terraform으로 인프라를 코드화한 경험을 가진 클라우드 엔지니어입니다.',
     '"전문성을 기르고 있는"은 약해요. 실제로 한 일을 보여주세요.', 0, 'PENDING');
  END IF;

END $$;

-- 3. 트렌드 기사 (중복 무시)
INSERT INTO trend_articles (title, source_url, source_type, summary, tags, relevance_map) VALUES
('Spring Boot 3.3 Virtual Thread 정식 지원', 'https://spring.io/blog/2024/05/virtual-threads', 'blog',
 'Spring Boot 3.3부터 Virtual Thread가 정식 지원됩니다.', ARRAY['Java', 'Spring Boot', 'Virtual Thread', '성능'], '{"Java 풀스택 개발자 양성과정": 0.95}'),
('Python 3.13 새로운 기능 총정리', 'https://realpython.com/python313-new-features/', 'article',
 'Python 3.13에서 추가된 주요 기능을 정리합니다.', ARRAY['Python', '업데이트', '언어'], '{"Python AI/데이터분석 과정": 0.9}'),
('AWS re:Invent 2024 핵심 발표 정리', 'https://aws.amazon.com/blogs/reinvent-2024/', 'blog',
 'AWS re:Invent 2024에서 발표된 새로운 서비스와 기능을 정리합니다.', ARRAY['AWS', 'Cloud', 'AI', '컨퍼런스'], '{"클라우드 엔지니어링 과정": 0.95}')
ON CONFLICT DO NOTHING;
