// Company size options for onboarding
export const COMPANY_SIZES = [
  { value: '1-10', label: '1-10 employees' },
  { value: '11-50', label: '11-50 employees' },
  { value: '51-200', label: '51-200 employees' },
  { value: '201-500', label: '201-500 employees' },
  { value: '501-1000', label: '501-1000 employees' },
  { value: '1000+', label: '1000+ employees' },
] as const

// Industry options for onboarding
export const INDUSTRIES = [
  { value: 'technology', label: 'Technology' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'finance', label: 'Financial Services' },
  { value: 'education', label: 'Education' },
  { value: 'retail', label: 'Retail' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'consulting', label: 'Consulting' },
  { value: 'media', label: 'Media & Entertainment' },
  { value: 'real-estate', label: 'Real Estate' },
  { value: 'other', label: 'Other' },
] as const

// Region options for onboarding
export const REGIONS = [
  { value: 'north-america', label: 'North America' },
  { value: 'europe', label: 'Europe' },
  { value: 'asia-pacific', label: 'Asia Pacific' },
  { value: 'latin-america', label: 'Latin America' },
  { value: 'africa', label: 'Africa' },
  { value: 'middle-east', label: 'Middle East' },
] as const

// Application URLs
export const APP_URLS = {
  HOME: '/',
  SIGN_IN: '/sign-in',
  SIGN_UP: '/sign-up',
  DASHBOARD: '/dashboard',
  SURVEY: '/survey',
  REPORT: '/report',
  SETTINGS: '/settings',
} as const

// Survey configuration
export const SURVEY_CONFIG = {
  MAX_FOLLOW_UP_QUESTIONS: 3,
  MIN_ANSWER_LENGTH: 10,
  MAX_ANSWER_LENGTH: 1000,
} as const

// Report configuration
export const REPORT_CONFIG = {
  MIN_EMPLOYEES_FOR_REPORT: 1,
  SHARED_SLUG_LENGTH: 8,
  CHART_COLORS: [
    '#3b82f6', // blue-500
    '#10b981', // emerald-500
    '#f59e0b', // amber-500
    '#ef4444', // red-500
    '#8b5cf6', // violet-500
    '#06b6d4', // cyan-500
  ],
} as const

// AI Configuration
export const AI_CONFIG = {
  MAX_TOKENS: 4000,
  TEMPERATURE: 0.7,
  MODEL: process.env.OPENAI_MODEL || 'gpt-4.1-mini-2025-04-14',
} as const 