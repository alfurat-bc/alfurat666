export interface User {
  id: number;
  email: string;
  name: string;
  role: 'super_admin' | 'admin' | 'user';
  created_at?: string;
}

export interface Question {
  id: string;
  type: 'radio' | 'checkbox' | 'text' | 'textarea';
  text: string;
  options?: string[];
  placeholder?: string;
  required?: boolean;
}

export interface Survey {
  id: number;
  user_id: number;
  title: string;
  description?: string;
  questions: Question[];
  is_published: boolean;
  created_at: string;
  updated_at: string;
  response_count?: number;
  user_email?: string;
  user_name?: string;
}

export interface SurveyResponse {
  id: number;
  survey_id: number;
  answers: Record<string, string | string[]>;
  submitted_at: string;
  ip_address?: string;
  user_agent?: string;
}

export interface Analytics {
  surveyId: number;
  totalResponses: number;
  analytics: QuestionAnalytics[];
}

export interface QuestionAnalytics {
  questionId: string;
  question: string;
  type: string;
  options: string[];
  counts: Record<string, number>;
  total: number;
}

export interface AuthResponse {
  token: string;
  user: User;
  message: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}
