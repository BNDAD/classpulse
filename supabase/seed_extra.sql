-- ==============================================
-- ClassPulse 추가 시드 데이터
-- 멘토 확장 + 상담 내역 + 문서 코치 콘텐츠
-- ⚠️ seed.sql 실행 후에 실행하세요
-- ==============================================

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

  -- ══════════════════════════════════════════════
  -- 1. 관리자에게 CAREER_ADVISOR 역할 + 상담 가능 시간 추가
  -- ══════════════════════════════════════════════
  IF v_admin IS NOT NULL THEN
    -- 관리자도 취업상담사 역할 추가 (기존 ADMIN → ADMIN 유지하되 상담 가능)
    INSERT INTO mentor_availability (mentor_id, day_of_week, start_time, end_time, slot_minutes, is_active) VALUES
    (v_admin, 1, '13:00', '17:00', 30, true),   -- 월요일 오후
    (v_admin, 3, '10:00', '12:00', 30, true),   -- 수요일 오전
    (v_admin, 3, '13:00', '17:00', 30, true),   -- 수요일 오후
    (v_admin, 5, '13:00', '16:00', 30, true)    -- 금요일 오후
    ON CONFLICT DO NOTHING;
  END IF;

  -- ══════════════════════════════════════════════
  -- 2. 다양한 학생의 추가 상담 내역
  -- ══════════════════════════════════════════════

  -- student2 (이지은) 상담 내역
  IF v_student2 IS NOT NULL AND v_mentor IS NOT NULL THEN
    INSERT INTO consultations (student_id, mentor_id, date, start_time, end_time, type, status, topic, student_memo, mentor_memo) VALUES
    (v_student2, v_mentor, CURRENT_DATE - 21, '10:00', '10:30', 'LEARNING', 'COMPLETED',
     'React 학습 방향 상담', 'JavaScript 기초가 부족한 것 같아서 React 진도를 따라가기 힘들어요.',
     '기초가 부족하면 React가 어려울 수 있어요. ES6+ 문법부터 다시 정리하고, 간단한 미니 프로젝트로 연습하면 금방 따라잡을 수 있어요.'),
    (v_student2, v_mentor, CURRENT_DATE - 10, '14:00', '14:30', 'PERSONAL', 'COMPLETED',
     '학습 동기 저하 상담', '요즘 수업 따라가기가 너무 힘들어서 의욕이 없어요.',
     '8주차가 가장 힘든 구간이에요. 주변 동기들도 다 비슷해요. 작은 성공 경험을 쌓는 게 중요합니다. 간단한 TODO 앱부터 만들어보세요.'),
    (v_student2, v_mentor, CURRENT_DATE + 2, '10:00', '10:30', 'LEARNING', 'CONFIRMED',
     'JavaScript 기초 보충 상담', 'ES6 화살표 함수, 구조분해할당 부분 질문드리고 싶어요.', NULL);
  END IF;

  IF v_student2 IS NOT NULL AND v_admin IS NOT NULL THEN
    INSERT INTO consultations (student_id, mentor_id, date, start_time, end_time, type, status, topic, student_memo, mentor_memo) VALUES
    (v_student2, v_admin, CURRENT_DATE - 5, '13:00', '13:30', 'PERSONAL', 'COMPLETED',
     '과정 적응 고민 상담', '프론트엔드가 맞는지 모르겠어요. 백엔드로 전향할까 고민됩니다.',
     '두 분야 다 경험해보는 게 중요해요. 지금 과정에서 풀스택을 배우고 있으니, 프로젝트 하면서 적성을 찾아보세요. 아직 결정하기엔 이릅니다.');
  END IF;

  -- student3 (박준형) 상담 내역
  IF v_student3 IS NOT NULL AND v_mentor IS NOT NULL THEN
    INSERT INTO consultations (student_id, mentor_id, date, start_time, end_time, type, status, topic, student_memo, mentor_memo) VALUES
    (v_student3, v_mentor, CURRENT_DATE - 7, '10:30', '11:00', 'CAREER', 'COMPLETED',
     '데이터 분석가 취업 준비', 'Python 과정 수강 중인데, 데이터 분석가가 되려면 뭘 더 해야 할까요?',
     'Kaggle 프로젝트를 2~3개 진행하고, SQL 능력을 키우세요. Tableau나 Power BI도 경험하면 좋아요. 포트폴리오가 핵심입니다.'),
    (v_student3, v_mentor, CURRENT_DATE + 7, '14:00', '14:30', 'PORTFOLIO', 'REQUESTED',
     'Kaggle 프로젝트 리뷰', 'Kaggle 타이타닉 프로젝트 완성했는데 리뷰 부탁드려요.', NULL);
  END IF;

  -- student4 (최서연) 상담 내역
  IF v_student4 IS NOT NULL AND v_admin IS NOT NULL THEN
    INSERT INTO consultations (student_id, mentor_id, date, start_time, end_time, type, status, topic, student_memo, mentor_memo) VALUES
    (v_student4, v_admin, CURRENT_DATE - 14, '15:00', '15:30', 'CAREER', 'COMPLETED',
     'AWS 자격증 준비 전략', 'AWS SAA 시험을 다음 달에 보려고 하는데, 어떻게 준비하면 좋을까요?',
     'AWS 공식 연습문제와 Udemy 강의를 병행하세요. 실습은 Free Tier로 충분합니다. 시험 2주 전부터는 모의고사에 집중하세요.'),
    (v_student4, v_admin, CURRENT_DATE - 3, '13:30', '14:00', 'RESUME', 'COMPLETED',
     '클라우드 엔지니어 자소서 리뷰', 'AWS 경험 위주로 자소서를 작성했는데 피드백 부탁합니다.',
     'AWS 자격증 + 실습 경험이 잘 드러나 있어요. 장애 대응이나 비용 최적화 경험을 추가하면 더 좋겠어요.'),
    (v_student4, v_admin, CURRENT_DATE + 5, '13:00', '13:30', 'CAREER', 'CONFIRMED',
     '클라우드 기업 지원 전략', 'NHN 클라우드, 네이버 클라우드 중 어디가 좋을까요?', NULL);
  END IF;

  -- student5 (정하윤) 상담 내역
  IF v_student5 IS NOT NULL AND v_mentor IS NOT NULL THEN
    INSERT INTO consultations (student_id, mentor_id, date, start_time, end_time, type, status, topic, student_memo, mentor_memo) VALUES
    (v_student5, v_mentor, CURRENT_DATE - 18, '10:00', '10:30', 'RESUME', 'COMPLETED',
     '네이버 자소서 1차 피드백', '네이버 서버 개발자 자소서 초안입니다.',
     '기술 나열이 많아요. 네이버가 좋아하는 "문제 해결 과정"을 스토리텔링으로 풀어보세요. STAR 기법을 활용하면 좋겠어요.'),
    (v_student5, v_mentor, CURRENT_DATE - 11, '14:00', '14:30', 'RESUME', 'COMPLETED',
     '네이버 자소서 2차 수정본 피드백', '피드백 반영해서 수정했습니다. STAR 기법으로 다시 썼어요.',
     '훨씬 좋아졌어요! JPA N+1 해결 부분이 인상적이에요. 마지막으로 네이버의 기술 문화와 연결짓는 마무리를 추가하면 완성도가 올라갈 거예요.'),
    (v_student5, v_mentor, CURRENT_DATE - 4, '10:30', '11:00', 'CAREER', 'COMPLETED',
     '네이버 면접 준비 상담', '서류 합격했습니다! 기술 면접 준비 어떻게 하면 좋을까요?',
     '축하해요! 네이버는 CS 기초 + 시스템 설계를 중시해요. 운영체제, 네트워크, DB 기초를 복습하고, 본인 프로젝트의 기술적 의사결정을 설명할 수 있도록 준비하세요.'),
    (v_student5, v_mentor, CURRENT_DATE + 1, '10:00', '10:30', 'CAREER', 'CONFIRMED',
     '네이버 모의 기술 면접', '모의 면접으로 기술 질문 연습하고 싶습니다.', NULL);
  END IF;

  -- ══════════════════════════════════════════════
  -- 3. 문서 코치 — 추가 문서 + 피드백
  -- ══════════════════════════════════════════════

  -- student2 (이지은) 문서
  IF v_student2 IS NOT NULL THEN
    INSERT INTO documents (id, user_id, type, title, content, status, version, target_company, target_position) VALUES
    ('d2000000-0000-0000-0000-000000000001', v_student2, 'RESUME', '프론트엔드 개발자 자기소개서',
     '안녕하세요, 프론트엔드 개발을 배우고 있는 이지은입니다. 코리아IT아카데미에서 React와 TypeScript를 배우면서 웹 개발에 흥미를 느끼게 되었습니다. 아직 부족하지만 사용자 경험을 중시하는 개발자가 되고 싶습니다. 인터랙티브한 UI를 만드는 것에 관심이 많으며, CSS 애니메이션과 반응형 디자인에 특히 재미를 느끼고 있습니다.',
     'COMPLETED', 1, '토스', '프론트엔드 개발자');

    INSERT INTO feedbacks (document_id, reviewer_type, content, score, status) VALUES
    ('d2000000-0000-0000-0000-000000000001', 'AI',
     '{"overall": "열정은 느껴지지만, 구체적인 프로젝트 경험과 기술적 성과가 부족해요. ''부족하지만''이라는 표현은 자소서에서 빼는 게 좋아요.", "sections": [{"title": "자기 어필", "feedback": "''아직 부족하지만''이라는 표현이 자신감을 깎아요. 배우고 있는 과정에서의 성장을 강조하세요.", "suggestion": "''React를 학습하며 TODO 앱을 완성한 경험으로 컴포넌트 설계의 재미를 알게 되었습니다''처럼 구체적으로 바꿔보세요.", "score": 5}, {"title": "기술 역량", "feedback": "관심 분야는 명확하지만, 실제 결과물이 빠져 있어요.", "suggestion": "간단한 프로젝트라도 결과물과 기술적 시도를 구체적으로 서술하세요.", "score": 4}]}',
     '{"overall": 48, "clarity": 55, "relevance": 40, "authenticity": 65, "impact": 30}',
     'COMPLETED');
  END IF;

  -- student3 (박준형) 문서
  IF v_student3 IS NOT NULL THEN
    INSERT INTO documents (id, user_id, type, title, content, status, version) VALUES
    ('d3000000-0000-0000-0000-000000000001', v_student3, 'PORTFOLIO', '데이터 분석 포트폴리오',
     '## 프로젝트 1: 타이타닉 생존자 예측\n- Kaggle Competition 참여\n- Python, Pandas, Scikit-learn\n- Feature Engineering + Random Forest 적용\n- 정확도 82.3% 달성\n\n## 프로젝트 2: 서울시 공공자전거 이용 분석\n- 공공데이터 API 활용\n- 시간대별/계절별 이용 패턴 시각화\n- Matplotlib, Seaborn 활용\n\n## 학습 중\n- SQL 고급 쿼리 (윈도우 함수, CTE)\n- Tableau 대시보드 제작',
     'AI_DRAFT', 1);

    INSERT INTO feedbacks (document_id, reviewer_type, content, score, status) VALUES
    ('d3000000-0000-0000-0000-000000000001', 'AI',
     '{"overall": "포트폴리오 방향이 좋아요! 다만 프로젝트의 비즈니스 가치와 인사이트를 더 강조하면 좋겠어요. Kaggle만으로는 부족하고, 실제 문제 해결 프로젝트를 추가해보세요.", "sections": [{"title": "프로젝트 구성", "feedback": "2개 프로젝트는 시작으로 괜찮지만, 하나 더 추가하면 좋겠어요. 특히 비즈니스 인사이트를 도출한 프로젝트가 필요해요.", "suggestion": "커머스 데이터나 고객 이탈 예측 같은 실무와 가까운 프로젝트를 추가하세요.", "score": 6}, {"title": "시각화", "feedback": "시각화 스킬을 보여주기 좋은 구성이에요. Tableau 대시보드 완성 후 포트폴리오에 넣으면 큰 플러스가 될 거예요.", "suggestion": "인터랙티브 대시보드 스크린샷이나 링크를 반드시 포함하세요.", "score": 7}]}',
     '{"overall": 65, "clarity": 70, "relevance": 60, "authenticity": 75, "impact": 55}',
     'COMPLETED');
  END IF;

  -- student4 (최서연) 문서
  IF v_student4 IS NOT NULL THEN
    INSERT INTO documents (id, user_id, type, title, content, status, version, target_company, target_position) VALUES
    ('d4000000-0000-0000-0000-000000000001', v_student4, 'RESUME', 'NHN 클라우드 엔지니어 자기소개서',
     'AWS 클라우드 인프라와 컨테이너 오케스트레이션에 전문성을 기르고 있는 주니어 엔지니어입니다. 코리아IT아카데미 클라우드 과정에서 AWS, Docker, Kubernetes를 체계적으로 학습했으며, 개인 프로젝트로 EKS 기반 마이크로서비스 배포 환경을 구축한 경험이 있습니다. Terraform을 활용한 IaC 경험과 GitHub Actions CI/CD 파이프라인 구축 경험을 바탕으로 안정적이고 효율적인 클라우드 인프라를 설계하고 싶습니다.',
     'MENTOR_REVIEW', 1, 'NHN', '클라우드 엔지니어'),
    ('d4000000-0000-0000-0000-000000000002', v_student4, 'PORTFOLIO', '클라우드 인프라 포트폴리오',
     '## 프로젝트 1: EKS 기반 MSA 배포 환경\n- AWS EKS + Helm Chart\n- 3개 마이크로서비스 (API Gateway, User, Product)\n- Auto Scaling + ALB 연동\n- Terraform으로 인프라 코드화\n\n## 프로젝트 2: CI/CD 파이프라인\n- GitHub Actions + ArgoCD\n- Docker 멀티스테이지 빌드\n- 블루/그린 배포 전략 적용\n\n## 자격증\n- AWS Solutions Architect Associate (준비 중)\n- 리눅스마스터 2급 (취득)',
     'COMPLETED', 2, NULL, NULL);

    INSERT INTO feedbacks (document_id, reviewer_type, content, score, status) VALUES
    ('d4000000-0000-0000-0000-000000000001', 'AI',
     '{"overall": "기술적으로 탄탄해요! 클라우드 엔지니어에 필요한 역량이 잘 드러나 있어요. NHN의 클라우드 사업 방향과 연결짓는 부분을 추가하면 더 좋겠어요.", "sections": [{"title": "기술 역량", "feedback": "AWS + K8s + Terraform 조합이 인상적이에요. IaC 경험은 큰 플러스에요.", "suggestion": "비용 최적화나 장애 대응 경험을 추가하면 실무 감각이 돋보일 거예요.", "score": 8}, {"title": "기업 맞춤", "feedback": "NHN 클라우드의 특성(Toast Cloud)을 언급하지 않았어요.", "suggestion": "NHN의 클라우드 서비스와 본인 경험을 연결하는 문단을 추가하세요.", "score": 6}]}',
     '{"overall": 76, "clarity": 80, "relevance": 72, "authenticity": 82, "impact": 68}',
     'COMPLETED'),
    ('d4000000-0000-0000-0000-000000000002', 'AI',
     '{"overall": "클라우드 포트폴리오가 체계적이에요! 아키텍처 다이어그램과 비용 분석을 추가하면 완성도가 더 올라갈 거예요.", "sections": [{"title": "프로젝트 깊이", "feedback": "EKS + Terraform 프로젝트가 좋아요. 트래픽 테스트 결과를 추가하면 더 설득력 있어요.", "suggestion": "Apache JMeter로 부하 테스트를 진행하고 Auto Scaling 동작 결과를 포함하세요.", "score": 8}]}',
     '{"overall": 80, "clarity": 82, "relevance": 78, "authenticity": 85, "impact": 75}',
     'COMPLETED');
  END IF;

  -- student5 (정하윤) 추가 문서
  IF v_student5 IS NOT NULL THEN
    INSERT INTO documents (id, user_id, type, title, content, status, version, target_company, target_position) VALUES
    ('d5000000-0000-0000-0000-000000000001', v_student5, 'RESUME', '토스 서버 개발자 자기소개서',
     'Java와 Spring Boot를 기반으로 안정적이고 확장 가능한 서버 시스템을 설계하는 데 관심이 많은 개발자입니다. 쇼핑몰 API 프로젝트에서 JPA N+1 문제를 Fetch Join과 BatchSize로 해결하여 쿼리 수를 90% 줄인 경험이 있습니다. 또한 Redis를 활용한 캐시 전략으로 API 응답 시간을 300ms에서 50ms로 개선했습니다. 토스의 빠른 실행력과 기술 주도 문화에서 성장하고 싶습니다.',
     'AI_DRAFT', 1, '토스', '서버 개발자');

    INSERT INTO feedbacks (document_id, reviewer_type, content, score, status) VALUES
    ('d5000000-0000-0000-0000-000000000001', 'AI',
     '{"overall": "구체적인 수치가 포함되어 있어서 설득력이 높아요! 토스의 핀테크 도메인과 연결짓는 내용을 더 보강하면 완벽해요.", "sections": [{"title": "성과 수치", "feedback": "쿼리 90% 감소, 응답 시간 6배 개선 — 매우 인상적인 수치예요.", "suggestion": "이 경험을 토스의 결제 시스템에서 어떻게 활용할 수 있는지 연결해보세요.", "score": 9}, {"title": "도메인 연결", "feedback": "기술 경험은 좋지만, 왜 ''토스''인지가 약해요.", "suggestion": "토스의 기술 블로그나 컨퍼런스 발표를 인용하며 공감하는 부분을 작성하세요.", "score": 6}]}',
     '{"overall": 82, "clarity": 85, "relevance": 78, "authenticity": 88, "impact": 76}',
     'COMPLETED');
  END IF;

  -- ══════════════════════════════════════════════
  -- 4. 멘토 첨삭 (document_revisions)
  -- ══════════════════════════════════════════════
  IF v_mentor IS NOT NULL AND v_student1 IS NOT NULL THEN
    INSERT INTO document_revisions (document_id, mentor_id, original_content, revised_content, revision_notes, section_index, status) VALUES
    ('d1000000-0000-0000-0000-000000000010', v_mentor,
     '저는 Java와 Spring Boot를 활용한 웹 개발에 열정을 가진 주니어 개발자입니다.',
     '6개월간 Java와 Spring Boot로 3개의 실전 프로젝트를 완성하며, 동시 처리 성능을 10배 개선한 경험을 가진 개발자입니다.',
     '첫 문장에서 "열정"보다 구체적인 성과를 보여주세요. 숫자가 들어가면 훨씬 인상적이에요.',
     0, 'ACCEPTED'),
    ('d1000000-0000-0000-0000-000000000010', v_mentor,
     '카카오의 기술 문화와 대규모 트래픽 처리 환경에서 성장하고 싶습니다.',
     '카카오톡이 매일 수십억 건의 메시지를 처리하는 기술적 도전에 매력을 느끼며, MSA 전환 과정에서 겪은 기술적 과제들을 함께 해결해나가고 싶습니다.',
     '마무리는 "성장하고 싶다"보다 회사의 구체적인 기술 과제를 언급하며 기여할 수 있는 부분을 보여주세요.',
     1, 'ACCEPTED');
  END IF;

  IF v_mentor IS NOT NULL AND v_student5 IS NOT NULL THEN
    INSERT INTO document_revisions (document_id, mentor_id, original_content, revised_content, revision_notes, section_index, status) VALUES
    ('d1000000-0000-0000-0000-000000000001', v_mentor,
     '저는 Java와 Spring Boot를 활용하여 다양한 프로젝트를 진행해왔습니다.',
     'Java와 Spring Boot 기반으로 쇼핑몰 API를 설계하며, JPA 성능 최적화와 Redis 캐시 전략을 실전에서 적용해본 백엔드 개발자입니다.',
     '"다양한 프로젝트"는 막연해요. 가장 임팩트 있는 프로젝트 하나를 구체적으로 보여주세요.',
     0, 'ACCEPTED'),
    ('d1000000-0000-0000-0000-000000000001', v_mentor,
     '특히 쇼핑몰 프로젝트에서 RESTful API 설계와 JPA를 활용한 데이터 모델링 경험을 쌓았습니다...',
     '쇼핑몰 프로젝트에서 상품-주문 도메인의 복잡한 연관관계를 JPA로 설계하고, N+1 문제를 Fetch Join으로 해결하여 쿼리 수를 85% 줄인 경험이 있습니다.',
     '경험을 "쌓았습니다"로 끝내지 말고, 구체적인 문제 해결과 수치를 넣어야 해요.',
     1, 'PENDING');
  END IF;

END $$;
