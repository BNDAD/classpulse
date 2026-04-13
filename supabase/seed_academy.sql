-- ==============================================
-- ClassPulse 학원 시드 데이터
-- 코리아IT아카데미 기준
-- ==============================================

-- ── 지점 ──
INSERT INTO branches (id, name, address, phone) VALUES
  ('b0000001-0000-0000-0000-000000000001', '강남점', '서울특별시 강남구 테헤란로 123', '02-1234-5678'),
  ('b0000001-0000-0000-0000-000000000002', '종로점', '서울특별시 종로구 종로 45', '02-2345-6789'),
  ('b0000001-0000-0000-0000-000000000003', '부산점', '부산광역시 부산진구 중앙대로 678', '051-345-6789'),
  ('b0000001-0000-0000-0000-000000000004', '대전점', '대전광역시 중구 중앙로 89', '042-456-7890'),
  ('b0000001-0000-0000-0000-000000000005', '대구점', '대구광역시 중구 동성로 56', '053-567-8901')
ON CONFLICT (id) DO NOTHING;

-- ── 기존 courses 업데이트 (강남점 기준) ──
-- 먼저 기존 과정에 상세 정보 추가
UPDATE courses SET
  branch_id = 'b0000001-0000-0000-0000-000000000001',
  course_type = 'NCS',
  classroom = '301호',
  schedule_time = '09:00 ~ 17:40',
  instructor = '김철수',
  start_date = '2026-01-05',
  end_date = '2026-07-03',
  total_students = 25,
  curriculum = '{
    "months": [
      {"month": 1, "title": "프로그래밍 기초", "topics": ["Java 기초", "객체지향 프로그래밍", "자료구조"]},
      {"month": 2, "title": "웹 프론트엔드", "topics": ["HTML/CSS", "JavaScript", "React 기초"]},
      {"month": 3, "title": "백엔드 개발", "topics": ["Spring Boot", "REST API", "JPA/Hibernate"]},
      {"month": 4, "title": "데이터베이스", "topics": ["MySQL", "SQL 심화", "Redis"]},
      {"month": 5, "title": "DevOps & 클라우드", "topics": ["Docker", "AWS", "CI/CD"]},
      {"month": 6, "title": "프로젝트 & 취업준비", "topics": ["팀 프로젝트", "포트폴리오", "모의면접"]}
    ]
  }'::jsonb
WHERE name LIKE '%자바%' OR name LIKE '%Java%' OR name LIKE '%풀스택%'
  OR id = (SELECT id FROM courses LIMIT 1);

-- ── 추가 과정 생성 ──
INSERT INTO courses (name, description, duration_weeks, tech_stack, branch_id, course_type, classroom, schedule_time, instructor, start_date, end_date, total_students, curriculum) VALUES
(
  '[NCS] 자바(Java)기반 풀스택 개발자 양성과정 A반',
  'Java, Spring Boot, React를 활용한 풀스택 웹 개발자 양성 국비지원 과정',
  24, '{"Java", "Spring Boot", "React", "MySQL", "Docker", "AWS"}',
  'b0000001-0000-0000-0000-000000000001', 'NCS', '301호', '09:00 ~ 17:40', '김철수',
  '2026-01-05', '2026-07-03', 25,
  '{"months": [{"month": 1, "title": "프로그래밍 기초", "topics": ["Java 기초", "객체지향", "자료구조"]}, {"month": 2, "title": "웹 프론트엔드", "topics": ["HTML/CSS", "JavaScript", "React"]}, {"month": 3, "title": "백엔드", "topics": ["Spring Boot", "REST API", "JPA"]}, {"month": 4, "title": "DB", "topics": ["MySQL", "SQL 심화", "Redis"]}, {"month": 5, "title": "DevOps", "topics": ["Docker", "AWS", "CI/CD"]}, {"month": 6, "title": "프로젝트", "topics": ["팀 프로젝트", "포트폴리오", "모의면접"]}]}'::jsonb
),
(
  '[NCS] 파이썬(Python) AI·빅데이터 분석가 양성과정',
  'Python 기반 데이터 분석, 머신러닝, 딥러닝 전문가 양성 국비지원 과정',
  24, '{"Python", "Pandas", "TensorFlow", "PyTorch", "SQL", "Tableau"}',
  'b0000001-0000-0000-0000-000000000001', 'NCS', '405호', '09:00 ~ 17:40', '박영희',
  '2026-02-02', '2026-08-01', 30,
  '{"months": [{"month": 1, "title": "Python 기초", "topics": ["Python 문법", "자료구조", "알고리즘"]}, {"month": 2, "title": "데이터 수집/분석", "topics": ["Pandas", "NumPy", "크롤링"]}, {"month": 3, "title": "시각화 & SQL", "topics": ["Matplotlib", "Tableau", "SQL"]}, {"month": 4, "title": "머신러닝", "topics": ["Scikit-learn", "회귀/분류", "앙상블"]}, {"month": 5, "title": "딥러닝", "topics": ["TensorFlow", "PyTorch", "CNN/RNN"]}, {"month": 6, "title": "프로젝트", "topics": ["캡스톤 프로젝트", "포트폴리오", "취업특강"]}]}'::jsonb
),
(
  '[NCS] 클라우드 보안 엔지니어 양성과정',
  'AWS/Azure 기반 클라우드 인프라 및 보안 전문가 양성 국비지원 과정',
  20, '{"Linux", "AWS", "Azure", "Docker", "Kubernetes", "Terraform"}',
  'b0000001-0000-0000-0000-000000000002', 'NCS', '201호', '09:30 ~ 18:10', '이준호',
  '2026-03-02', '2026-07-24', 20,
  '{"months": [{"month": 1, "title": "리눅스 & 네트워크", "topics": ["Linux 기초", "네트워크 기초", "쉘 스크립트"]}, {"month": 2, "title": "클라우드 기초", "topics": ["AWS EC2/S3", "VPC", "IAM"]}, {"month": 3, "title": "컨테이너", "topics": ["Docker", "Kubernetes", "Helm"]}, {"month": 4, "title": "보안 & IaC", "topics": ["보안 기초", "Terraform", "모니터링"]}, {"month": 5, "title": "프로젝트", "topics": ["인프라 구축", "보안 감사", "포트폴리오"]}]}'::jsonb
),
(
  '프론트엔드 React 심화 (주말반)',
  'React, Next.js, TypeScript 심화 학습 사비 주말 과정',
  12, '{"React", "Next.js", "TypeScript", "TailwindCSS"}',
  'b0000001-0000-0000-0000-000000000001', 'PRIVATE', '502호', '토 10:00 ~ 17:00', '최민지',
  '2026-03-07', '2026-05-30', 15,
  '{"months": [{"month": 1, "title": "React 심화", "topics": ["Hooks 패턴", "상태관리", "성능최적화"]}, {"month": 2, "title": "Next.js", "topics": ["App Router", "SSR/SSG", "API Routes"]}, {"month": 3, "title": "프로젝트", "topics": ["TypeScript 실전", "배포", "포트폴리오"]}]}'::jsonb
),
(
  '[NCS] 자바(Java)기반 풀스택 개발자 양성과정 B반',
  '2025년 10월 개강 - 수료 완료반',
  24, '{"Java", "Spring Boot", "React", "MySQL", "Docker"}',
  'b0000001-0000-0000-0000-000000000003', 'NCS', '302호', '09:00 ~ 17:40', '정대현',
  '2025-10-06', '2026-04-03', 22,
  '{"months": [{"month": 1, "title": "프로그래밍 기초", "topics": ["Java", "OOP", "자료구조"]}, {"month": 2, "title": "웹 프론트엔드", "topics": ["HTML/CSS", "JS", "React"]}, {"month": 3, "title": "백엔드", "topics": ["Spring Boot", "API", "JPA"]}, {"month": 4, "title": "DB", "topics": ["MySQL", "SQL", "Redis"]}, {"month": 5, "title": "DevOps", "topics": ["Docker", "AWS", "CI/CD"]}, {"month": 6, "title": "프로젝트", "topics": ["팀프로젝트", "포트폴리오", "취업준비"]}]}'::jsonb
)
ON CONFLICT DO NOTHING;
