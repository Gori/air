export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      answers: {
        Row: {
          answer_text: string
          company_id: string | null
          created_at: string | null
          employee_id: string | null
          id: string
          question_instance_id: string | null
        }
        Insert: {
          answer_text: string
          company_id?: string | null
          created_at?: string | null
          employee_id?: string | null
          id?: string
          question_instance_id?: string | null
        }
        Update: {
          answer_text?: string
          company_id?: string | null
          created_at?: string | null
          employee_id?: string | null
          id?: string
          question_instance_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "answers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "answers_question_instance_id_fkey"
            columns: ["question_instance_id"]
            isOneToOne: false
            referencedRelation: "question_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          created_at: string | null
          domain: string
          headcount: number | null
          id: string
          industry: string | null
          invite_code: string | null
          name: string
          region: string | null
        }
        Insert: {
          created_at?: string | null
          domain: string
          headcount?: number | null
          id?: string
          industry?: string | null
          invite_code?: string | null
          name: string
          region?: string | null
        }
        Update: {
          created_at?: string | null
          domain?: string
          headcount?: number | null
          id?: string
          industry?: string | null
          invite_code?: string | null
          name?: string
          region?: string | null
        }
        Relationships: []
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
        Relationships: []
      }
      prompt_logs: {
        Row: {
          company_id: string | null
          created_at: string | null
          employee_id: string | null
          id: string
          model: string | null
          prompt: string | null
          response: string | null
          source: Database["public"]["Enums"]["prompt_source"] | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          employee_id?: string | null
          id?: string
          model?: string | null
          prompt?: string | null
          response?: string | null
          source?: Database["public"]["Enums"]["prompt_source"] | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          employee_id?: string | null
          id?: string
          model?: string | null
          prompt?: string | null
          response?: string | null
          source?: Database["public"]["Enums"]["prompt_source"] | null
        }
        Relationships: [
          {
            foreignKeyName: "prompt_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      question_instances: {
        Row: {
          company_id: string
          employee_id: string | null
          id: string
          ordinal: number
          parent_instance: string | null
          question_id: number | null
        }
        Insert: {
          company_id: string
          employee_id?: string | null
          id?: string
          ordinal: number
          parent_instance?: string | null
          question_id?: number | null
        }
        Update: {
          company_id?: string
          employee_id?: string | null
          id?: string
          ordinal?: number
          parent_instance?: string | null
          question_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "question_instances_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_instances_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_instances_parent_instance_fkey"
            columns: ["parent_instance"]
            isOneToOne: false
            referencedRelation: "question_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_instances_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          active: boolean | null
          dimension: string | null
          id: number
          module_id: number | null
          text: string
        }
        Insert: {
          active?: boolean | null
          dimension?: string | null
          id?: number
          module_id?: number | null
          text: string
        }
        Update: {
          active?: boolean | null
          dimension?: string | null
          id?: number
          module_id?: number | null
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      report_scores: {
        Row: {
          dimension: string
          report_id: string
          score: number | null
        }
        Insert: {
          dimension: string
          report_id: string
          score?: number | null
        }
        Update: {
          dimension?: string
          report_id?: string
          score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "report_scores_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          company_id: string | null
          created_by: string | null
          generated_at: string | null
          html_path: string
          id: string
          narrative_json: Json
          scores_json: Json
          shared_slug: string | null
        }
        Insert: {
          company_id?: string | null
          created_by?: string | null
          generated_at?: string | null
          html_path: string
          id?: string
          narrative_json: Json
          scores_json: Json
          shared_slug?: string | null
        }
        Update: {
          company_id?: string | null
          created_by?: string | null
          generated_at?: string | null
          html_path?: string
          id?: string
          narrative_json?: Json
          scores_json?: Json
          shared_slug?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          company_id: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          last_login_at: string | null
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          last_login_at?: string | null
          role: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          last_login_at?: string | null
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: [
          {
            foreignKeyName: "users_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      prompt_source: "question_selection" | "report_generation"
      user_role: "manager" | "employee"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      prompt_source: ["question_selection", "report_generation"],
      user_role: ["manager", "employee"],
    },
  },
} as const 