export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string
          name: string
          domain: string
          headcount: number | null
          industry: string | null
          region: string | null
          invite_code: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          domain: string
          headcount?: number | null
          industry?: string | null
          region?: string | null
          invite_code?: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          domain?: string
          headcount?: number | null
          industry?: string | null
          region?: string | null
          invite_code?: string
          created_at?: string
        }
      }
      users: {
        Row: {
          id: string
          company_id: string
          role: 'manager' | 'employee'
          email: string
          full_name: string | null
          last_login_at: string | null
          created_at: string
        }
        Insert: {
          id: string
          company_id: string
          role: 'manager' | 'employee'
          email: string
          full_name?: string | null
          last_login_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          role?: 'manager' | 'employee'
          email?: string
          full_name?: string | null
          last_login_at?: string | null
          created_at?: string
        }
      }
      modules: {
        Row: {
          id: number
          name: string
        }
        Insert: {
          id: number
          name: string
        }
        Update: {
          id?: number
          name?: string
        }
      }
      questions: {
        Row: {
          id: number
          module_id: number
          dimension: string
          text: string
          active: boolean
        }
        Insert: {
          module_id: number
          dimension: string
          text: string
          active?: boolean
        }
        Update: {
          id?: number
          module_id?: number
          dimension?: string
          text?: string
          active?: boolean
        }
      }
      question_instances: {
        Row: {
          id: string
          company_id: string
          employee_id: string
          question_id: number
          parent_instance: string | null
          ordinal: number
        }
        Insert: {
          id?: string
          company_id: string
          employee_id: string
          question_id: number
          parent_instance?: string | null
          ordinal: number
        }
        Update: {
          id?: string
          company_id?: string
          employee_id?: string
          question_id?: number
          parent_instance?: string | null
          ordinal?: number
        }
      }
      answers: {
        Row: {
          id: string
          question_instance_id: string
          company_id: string
          employee_id: string
          answer_text: string
          created_at: string
        }
        Insert: {
          id?: string
          question_instance_id: string
          company_id: string
          employee_id: string
          answer_text: string
          created_at?: string
        }
        Update: {
          id?: string
          question_instance_id?: string
          company_id?: string
          employee_id?: string
          answer_text?: string
          created_at?: string
        }
      }
      reports: {
        Row: {
          id: string
          company_id: string
          generated_at: string
          scores_json: Json
          narrative_json: Json
          html_path: string
          shared_slug: string | null
          created_by: string
        }
        Insert: {
          id?: string
          company_id: string
          generated_at?: string
          scores_json: Json
          narrative_json: Json
          html_path: string
          shared_slug?: string | null
          created_by: string
        }
        Update: {
          id?: string
          company_id?: string
          generated_at?: string
          scores_json?: Json
          narrative_json?: Json
          html_path?: string
          shared_slug?: string | null
          created_by?: string
        }
      }
      report_scores: {
        Row: {
          report_id: string
          dimension: string
          score: number
        }
        Insert: {
          report_id: string
          dimension: string
          score: number
        }
        Update: {
          report_id?: string
          dimension?: string
          score?: number
        }
      }
      prompt_logs: {
        Row: {
          id: string
          company_id: string | null
          employee_id: string | null
          source: 'question_selection' | 'report_generation'
          prompt: string
          response: string
          model: string
          created_at: string
        }
        Insert: {
          id?: string
          company_id?: string | null
          employee_id?: string | null
          source: 'question_selection' | 'report_generation'
          prompt: string
          response: string
          model?: string
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string | null
          employee_id?: string | null
          source?: 'question_selection' | 'report_generation'
          prompt?: string
          response?: string
          model?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'manager' | 'employee'
      prompt_source: 'question_selection' | 'report_generation'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
} 