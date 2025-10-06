// Shared types and constants for survey rendering

export type SlideType =
  | 'welcome'
  | 'intro'
  | 'matrix'
  | 'text'
  | 'scale'
  | 'mc_single'
  | 'mc_multi'
  | 'end'
  | 'ai_followup'

export interface InstanceMapItem {
  id: string
  ordinal: number
  question_id: number | null
  answer_text?: string
}

export interface StartPayload {
  completed: boolean
  progress: { current: number; total: number }
  instanceMap: Record<string, InstanceMapItem>
}

export interface Slide {
  type: SlideType
  title?: string
  copy?: string
  prompt?: string
  dimension?: string
  required?: boolean
  items?: string[]
  options?: string[]
  allowPreferNot?: boolean
  optionalText?: boolean
  examples?: string[]
  followUpInstanceId?: string
  heading?: string
  subheading?: string
  illustration?: string
}

export type MatrixLevel =
  | 'Never tried'
  | "I've tried it"
  | 'I use it regularly'
  | "I'm dependent on it"

export const MATRIX_LEVELS: readonly MatrixLevel[] = [
  'Never tried',
  "I've tried it",
  'I use it regularly',
  "I'm dependent on it",
] as const


