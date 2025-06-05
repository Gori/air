// Core domain types based on the database schema

export type UserRole = 'manager' | 'employee'

export type PromptSource = 'question_selection' | 'report_generation'

export interface Company {
  id: string
  name: string
  domain: string
  headcount?: number
  industry?: string
  region?: string
  invite_code: string
  created_at: string
}

export interface User {
  id: string // Clerk user_id
  company_id: string
  role: UserRole
  email: string
  full_name?: string
  last_login_at?: string
  created_at: string
}

export interface Module {
  id: number
  name: string
}

export interface Question {
  id: number
  module_id: number
  dimension: string
  text: string
  active: boolean
}

export interface QuestionInstance {
  id: string
  company_id: string
  employee_id: string
  question_id: number
  parent_instance?: string
  ordinal: number
  question?: Question // Optional populated field
}

export interface Answer {
  id: string
  question_instance_id: string
  company_id: string
  employee_id: string
  answer_text: string
  created_at: string
}

export interface Report {
  id: string
  company_id: string
  generated_at: string
  scores_json: Record<string, number>
  narrative_json: ReportNarrative
  html_path: string
  shared_slug?: string
  created_by: string
}

export interface ReportScore {
  report_id: string
  dimension: string
  score: number
}

export interface PromptLog {
  id: string
  company_id?: string
  employee_id?: string
  source: PromptSource
  prompt: string
  response: string
  model: string
  created_at: string
}

// AI and Report related types
export interface ReportNarrative {
  strengths: string[]
  gaps: string[]
  recommendations: string[]
  summary: string
}

export interface DimensionScore {
  dimension: string
  score: number
  module: string
}

export interface EmployeeProgress {
  employee_id: string
  employee_name: string
  status: 'not_started' | 'in_progress' | 'completed'
  completed_questions: number
  total_questions: number
  last_activity?: string
}

// Survey Flow types
export interface SurveyState {
  current_question_instance: QuestionInstance | null
  completed_instances: string[]
  progress_percentage: number
}

// API Response types
export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
  success: boolean
}

export interface NextQuestionResponse {
  next_question?: QuestionInstance
  is_complete: boolean
  follow_up_questions?: QuestionInstance[]
}

// Form validation types
export interface CompanyOnboardingForm {
  name: string
  domain: string
  headcount: number
  industry: string
  region: string
}

export interface AnswerSubmissionForm {
  question_instance_id: string
  answer_text: string
}

// Chart data types for reporting
export interface ChartDataPoint {
  label: string
  value: number
}

export interface RadarChartData {
  module: string
  score: number
}

export interface HeatmapData {
  employee: string
  dimension: string
  score: number
}

// The 13 key dimensions for scoring
export const SCORING_DIMENSIONS = [
  'ai_literacy',
  'existing_ai_skills', 
  'current_ai_usage',
  'ai_sentiment',
  'ai_expected_benefits',
  'ai_concerns',
  'workflow_integration',
  'ai_opportunity_ideas',
  'integration_barriers',
  'org_support',
  'culture_experimentation',
  'policy_awareness',
  'support_requests',
  'training_effectiveness',
  'learning_preferences',
  'strategic_clarity',
  'perceived_alignment',
  'pace_satisfaction',
  'leadership_confidence',
  'future_roles_skills'
] as const

export type ScoringDimension = typeof SCORING_DIMENSIONS[number]

// Module names mapping
export const MODULES = {
  1: 'AI Literacy & Skills',
  2: 'Attitudes & Perceptions', 
  3: 'Workflow Integration & Opportunities',
  4: 'Organizational Ecosystem',
  5: 'Learning & Development',
  6: 'Strategic Alignment & Vision'
} as const 