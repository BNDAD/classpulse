// src/types/supabase.ts — ClassPulse Database Types (Supabase v2.103+)

export type UserRole = 'STUDENT' | 'MENTOR' | 'CAREER_ADVISOR' | 'ADMIN';
export type RiskLevel = 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED';
export type EmotionLevel = 'FIRE' | 'HAPPY' | 'NEUTRAL' | 'TIRED' | 'EXHAUSTED';
export type DocumentType = 'RESUME' | 'PORTFOLIO' | 'COVER_LETTER';
export type FeedbackStatus = 'AI_DRAFT' | 'MENTOR_REVIEW' | 'COMPLETED' | 'DELIVERED';
export type StudentStatus = 'ENROLLED' | 'COMPLETED' | 'CARE_PERIOD' | 'EXPIRED';
export type CourseType = 'NCS' | 'PRIVATE' | 'SHORT';
export type ConsultStatus = 'REQUESTED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
export type ConsultType = 'CAREER' | 'LEARNING' | 'PERSONAL' | 'PORTFOLIO' | 'RESUME' | 'OTHER';

export interface Database {
  public: {
    Tables: {
      branches: {
        Row: {
          id: string;
          name: string;
          address: string | null;
          phone: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          address?: string | null;
          phone?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          address?: string | null;
          phone?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      user_profiles: {
        Row: {
          id: string;
          user_id: string;
          role: UserRole;
          name: string;
          phone: string | null;
          course_id: string | null;
          target_job: string | null;
          target_company: string | null;
          github_url: string | null;
          projects: ProjectInfo[] | null;
          interests: string[];
          target_certs: string[];
          student_status: StudentStatus;
          branch_id: string | null;
          mentor_id: string | null;
          completed_at: string | null;
          care_until: string | null;
          enrollment_code: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role?: UserRole;
          name: string;
          phone?: string | null;
          course_id?: string | null;
          target_job?: string | null;
          target_company?: string | null;
          github_url?: string | null;
          projects?: ProjectInfo[] | null;
          interests?: string[];
          target_certs?: string[];
          student_status?: StudentStatus;
          branch_id?: string | null;
          mentor_id?: string | null;
          completed_at?: string | null;
          care_until?: string | null;
          enrollment_code?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          role?: UserRole;
          name?: string;
          phone?: string | null;
          course_id?: string | null;
          target_job?: string | null;
          target_company?: string | null;
          github_url?: string | null;
          projects?: ProjectInfo[] | null;
          interests?: string[];
          target_certs?: string[];
          student_status?: StudentStatus;
          branch_id?: string | null;
          mentor_id?: string | null;
          completed_at?: string | null;
          care_until?: string | null;
          enrollment_code?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_profiles_course_id_fkey';
            columns: ['course_id'];
            isOneToOne: false;
            referencedRelation: 'courses';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_profiles_branch_id_fkey';
            columns: ['branch_id'];
            isOneToOne: false;
            referencedRelation: 'branches';
            referencedColumns: ['id'];
          },
        ];
      };
      courses: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          duration_weeks: number;
          difficulty_map: Record<string, number> | null;
          tech_stack: string[];
          branch_id: string | null;
          course_type: CourseType;
          classroom: string | null;
          schedule_time: string | null;
          instructor: string | null;
          mentor_id: string | null;
          curriculum: Record<string, unknown> | null;
          start_date: string | null;
          end_date: string | null;
          total_students: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          duration_weeks?: number;
          difficulty_map?: Record<string, number> | null;
          tech_stack?: string[];
          branch_id?: string | null;
          course_type?: CourseType;
          classroom?: string | null;
          schedule_time?: string | null;
          instructor?: string | null;
          mentor_id?: string | null;
          curriculum?: Record<string, unknown> | null;
          start_date?: string | null;
          end_date?: string | null;
          total_students?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          duration_weeks?: number;
          difficulty_map?: Record<string, number> | null;
          tech_stack?: string[];
          branch_id?: string | null;
          course_type?: CourseType;
          classroom?: string | null;
          schedule_time?: string | null;
          instructor?: string | null;
          mentor_id?: string | null;
          curriculum?: Record<string, unknown> | null;
          start_date?: string | null;
          end_date?: string | null;
          total_students?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'courses_branch_id_fkey';
            columns: ['branch_id'];
            isOneToOne: false;
            referencedRelation: 'branches';
            referencedColumns: ['id'];
          },
        ];
      };
      learning_pulse: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          attendance: boolean;
          assignment_done: boolean;
          questions_count: number;
          emotion_score: number | null;
          streak_count: number;
          risk_score: number;
          risk_level: RiskLevel;
        };
        Insert: {
          id?: string;
          user_id: string;
          date?: string;
          attendance?: boolean;
          assignment_done?: boolean;
          questions_count?: number;
          emotion_score?: number | null;
          streak_count?: number;
          risk_score?: number;
          risk_level?: RiskLevel;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          attendance?: boolean;
          assignment_done?: boolean;
          questions_count?: number;
          emotion_score?: number | null;
          streak_count?: number;
          risk_score?: number;
          risk_level?: RiskLevel;
        };
        Relationships: [];
      };
      pulse_checkins: {
        Row: {
          id: string;
          user_id: string;
          week: number;
          emotion: EmotionLevel;
          ai_response: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          week: number;
          emotion: EmotionLevel;
          ai_response?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          week?: number;
          emotion?: EmotionLevel;
          ai_response?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      job_analyses: {
        Row: {
          id: string;
          user_id: string;
          company_name: string;
          job_url: string;
          company_analysis: CompanyAnalysis;
          tech_stack: TechStackAnalysis;
          interview_prep: InterviewPrep;
          portfolio_guide: PortfolioGuide;
          resume_guide: ResumeGuide;
          match_score: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          company_name: string;
          job_url: string;
          company_analysis: CompanyAnalysis;
          tech_stack: TechStackAnalysis;
          interview_prep: InterviewPrep;
          portfolio_guide: PortfolioGuide;
          resume_guide: ResumeGuide;
          match_score?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          company_name?: string;
          job_url?: string;
          company_analysis?: CompanyAnalysis;
          tech_stack?: TechStackAnalysis;
          interview_prep?: InterviewPrep;
          portfolio_guide?: PortfolioGuide;
          resume_guide?: ResumeGuide;
          match_score?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      documents: {
        Row: {
          id: string;
          user_id: string;
          type: DocumentType;
          title: string;
          content: string;
          status: FeedbackStatus;
          version: number;
          job_analysis_id: string | null;
          target_company: string | null;
          target_position: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: DocumentType;
          title: string;
          content: string;
          status?: FeedbackStatus;
          version?: number;
          job_analysis_id?: string | null;
          target_company?: string | null;
          target_position?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: DocumentType;
          title?: string;
          content?: string;
          status?: FeedbackStatus;
          version?: number;
          job_analysis_id?: string | null;
          target_company?: string | null;
          target_position?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      document_revisions: {
        Row: {
          id: string;
          document_id: string;
          mentor_id: string;
          original_content: string;
          revised_content: string;
          revision_notes: string | null;
          section_index: number | null;
          status: string;
          student_response: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          document_id: string;
          mentor_id: string;
          original_content: string;
          revised_content: string;
          revision_notes?: string | null;
          section_index?: number | null;
          status?: string;
          student_response?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          document_id?: string;
          mentor_id?: string;
          original_content?: string;
          revised_content?: string;
          revision_notes?: string | null;
          section_index?: number | null;
          status?: string;
          student_response?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'document_revisions_document_id_fkey';
            columns: ['document_id'];
            isOneToOne: false;
            referencedRelation: 'documents';
            referencedColumns: ['id'];
          },
        ];
      };
      feedbacks: {
        Row: {
          id: string;
          document_id: string;
          reviewer_type: 'AI' | 'MENTOR';
          reviewer_id: string | null;
          content: FeedbackContent;
          annotations: FeedbackAnnotation[] | null;
          score: FeedbackScore | null;
          status: FeedbackStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          document_id: string;
          reviewer_type: 'AI' | 'MENTOR';
          reviewer_id?: string | null;
          content: FeedbackContent;
          annotations?: FeedbackAnnotation[] | null;
          score?: FeedbackScore | null;
          status: FeedbackStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          document_id?: string;
          reviewer_type?: 'AI' | 'MENTOR';
          reviewer_id?: string | null;
          content?: FeedbackContent;
          annotations?: FeedbackAnnotation[] | null;
          score?: FeedbackScore | null;
          status?: FeedbackStatus;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'feedbacks_document_id_fkey';
            columns: ['document_id'];
            isOneToOne: false;
            referencedRelation: 'documents';
            referencedColumns: ['id'];
          },
        ];
      };
      streak_records: {
        Row: {
          id: string;
          user_id: string;
          current_streak: number;
          longest_streak: number;
          last_activity_date: string | null;
          rewards: StreakReward[] | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          current_streak?: number;
          longest_streak?: number;
          last_activity_date?: string | null;
          rewards?: StreakReward[] | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          current_streak?: number;
          longest_streak?: number;
          last_activity_date?: string | null;
          rewards?: StreakReward[] | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          content: string;
          is_read: boolean;
          metadata: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          title: string;
          content: string;
          is_read?: boolean;
          metadata?: Record<string, unknown> | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          title?: string;
          content?: string;
          is_read?: boolean;
          metadata?: Record<string, unknown> | null;
          created_at?: string;
        };
        Relationships: [];
      };
      trend_articles: {
        Row: {
          id: string;
          title: string;
          source_url: string;
          source_type: string;
          summary: string;
          tags: string[];
          relevance_map: Record<string, number> | null;
          youtube_url: string | null;
          youtube_title: string | null;
          project_tips: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          source_url: string;
          source_type?: string;
          summary: string;
          tags?: string[];
          relevance_map?: Record<string, number> | null;
          youtube_url?: string | null;
          youtube_title?: string | null;
          project_tips?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          source_url?: string;
          source_type?: string;
          summary?: string;
          tags?: string[];
          relevance_map?: Record<string, number> | null;
          youtube_url?: string | null;
          youtube_title?: string | null;
          project_tips?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      certifications: {
        Row: {
          id: string;
          name: string;
          exam_dates: ExamDate[] | null;
          related_courses: string[];
          prep_resources: PrepResource[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          exam_dates?: ExamDate[] | null;
          related_courses?: string[];
          prep_resources?: PrepResource[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          exam_dates?: ExamDate[] | null;
          related_courses?: string[];
          prep_resources?: PrepResource[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      consultations: {
        Row: {
          id: string;
          student_id: string;
          mentor_id: string;
          date: string;
          start_time: string;
          end_time: string;
          type: ConsultType;
          status: ConsultStatus;
          topic: string | null;
          student_memo: string | null;
          mentor_memo: string | null;
          meeting_url: string | null;
          cancelled_by: string | null;
          cancel_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          mentor_id: string;
          date: string;
          start_time: string;
          end_time: string;
          type?: ConsultType;
          status?: ConsultStatus;
          topic?: string | null;
          student_memo?: string | null;
          mentor_memo?: string | null;
          meeting_url?: string | null;
          cancelled_by?: string | null;
          cancel_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          mentor_id?: string;
          date?: string;
          start_time?: string;
          end_time?: string;
          type?: ConsultType;
          status?: ConsultStatus;
          topic?: string | null;
          student_memo?: string | null;
          mentor_memo?: string | null;
          meeting_url?: string | null;
          cancelled_by?: string | null;
          cancel_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      mentor_availability: {
        Row: {
          id: string;
          mentor_id: string;
          day_of_week: number;
          start_time: string;
          end_time: string;
          slot_minutes: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          mentor_id: string;
          day_of_week: number;
          start_time: string;
          end_time: string;
          slot_minutes?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          mentor_id?: string;
          day_of_week?: number;
          start_time?: string;
          end_time?: string;
          slot_minutes?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      user_role: UserRole;
      risk_level: RiskLevel;
      emotion_level: EmotionLevel;
      document_type: DocumentType;
      feedback_status: FeedbackStatus;
      student_status: StudentStatus;
      course_type: CourseType;
      consult_status: ConsultStatus;
      consult_type: ConsultType;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

// ─── JSONB Sub-types ───

export interface ProjectInfo {
  name: string;
  description: string;
  techStack: string[];
  githubUrl?: string;
  deployUrl?: string;
}

export interface CompanyAnalysis {
  industry: string;
  size: string;
  culture: string;
  coreValues: string[];
  recentNews: string[];
}

export interface TechStackAnalysis {
  required: string[];
  preferred: string[];
  inferred: string[];
}

export interface InterviewPrep {
  technical: string[];
  behavioral: string[];
  companySpecific: string[];
}

export interface PortfolioGuide {
  highlights: string[];
  improvements: string[];
  projectSuggestions: string[];
}

export interface ResumeGuide {
  keyPoints: string[];
  storyLine: string;
  coreValueConnection: string;
}

export interface FeedbackContent {
  overall: string;
  sections: {
    title: string;
    feedback: string;
    suggestion: string;
    score: number;
  }[];
}

export interface FeedbackAnnotation {
  startIndex: number;
  endIndex: number;
  comment: string;
  type: 'praise' | 'fix' | 'suggestion';
}

export interface FeedbackScore {
  overall: number;
  clarity: number;
  relevance: number;
  authenticity: number;
  impact: number;
}

export interface StreakReward {
  day: number;
  title: string;
  emoji: string;
  unlockedAt: string;
}

export interface ExamDate {
  date: string;
  registrationStart: string;
  registrationEnd: string;
  resultDate: string;
}

export interface PrepResource {
  title: string;
  url: string;
  type: 'video' | 'article' | 'practice';
}
