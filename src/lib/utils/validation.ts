import { z } from 'zod'
import { COMPANY_SIZES, INDUSTRIES, REGIONS } from './constants'

// Company onboarding validation
export const companyOnboardingSchema = z.object({
  name: z.string().min(2, 'Company name must be at least 2 characters'),
  domain: z.string().email('Invalid email domain').transform(val => val.split('@')[1] || val),
  headcount: z.enum(COMPANY_SIZES.map(size => size.value) as [string, ...string[]]),
  industry: z.enum(INDUSTRIES.map(industry => industry.value) as [string, ...string[]]),
  region: z.enum(REGIONS.map(region => region.value) as [string, ...string[]]),
})

export type CompanyOnboardingData = z.infer<typeof companyOnboardingSchema>

// Answer submission validation
export const answerSubmissionSchema = z.object({
  question_instance_id: z.string().uuid('Invalid question instance ID'),
  answer_text: z.string()
    .min(10, 'Answer must be at least 10 characters')
    .max(1000, 'Answer must be less than 1000 characters'),
})

export type AnswerSubmissionData = z.infer<typeof answerSubmissionSchema>

// Employee invitation validation
export const employeeInvitationSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export type EmployeeInvitationData = z.infer<typeof employeeInvitationSchema>

// Report generation validation
export const reportGenerationSchema = z.object({
  company_id: z.string().uuid('Invalid company ID'),
  force_regenerate: z.boolean().optional().default(false),
})

export type ReportGenerationData = z.infer<typeof reportGenerationSchema>

// Report sharing validation
export const reportSharingSchema = z.object({
  report_id: z.string().uuid('Invalid report ID'),
  enable_sharing: z.boolean(),
})

export type ReportSharingData = z.infer<typeof reportSharingSchema>

// API response validation
export const apiResponseSchema = z.object({
  success: z.boolean(),
  data: z.unknown().optional(),
  error: z.string().optional(),
})

export type ApiResponseData = z.infer<typeof apiResponseSchema>

// Validation helper functions
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validateEmailDomain(email: string, domain: string): boolean {
  const emailDomain = email.split('@')[1]?.toLowerCase()
  return emailDomain === domain.toLowerCase()
}

export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, '')
}

export function validateUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
} 