import { Resend } from 'resend'
import { createElement } from 'react'

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY environment variable is required')
}

export const resend = new Resend(process.env.RESEND_API_KEY)

export const EMAIL_CONFIG = {
  from: 'AIR Platform <noreply@air-assessment.com>',
  defaultSubject: 'AI Readiness Assessment',
} as const

export type EmailTemplate = 
  | 'employee-invitation'
  | 'survey-completion-reminder'
  | 'report-ready'
  | 'welcome'

export interface EmailData {
  to: string | string[]
  subject?: string
  template: EmailTemplate
  data: Record<string, any>
}

export async function sendEmail({ to, subject, template, data }: EmailData) {
  try {
    // Import and render the appropriate email template component
    let EmailComponent: React.ComponentType<any>
    
    switch (template) {
      case 'employee-invitation':
        const { EmployeeInvitationEmail } = await import('@/components/email/employee-invitation')
        EmailComponent = EmployeeInvitationEmail
        break
      case 'survey-completion-reminder':
        const { SurveyReminderEmail } = await import('@/components/email/survey-reminder')
        EmailComponent = SurveyReminderEmail
        break
      case 'report-ready':
        const { ReportReadyEmail } = await import('@/components/email/report-ready')
        EmailComponent = ReportReadyEmail
        break
      case 'welcome':
        const { WelcomeEmail } = await import('@/components/email/welcome')
        EmailComponent = WelcomeEmail
        break
      default:
        throw new Error(`Unknown email template: ${template}`)
    }

    const response = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: Array.isArray(to) ? to : [to],
      subject: subject || EMAIL_CONFIG.defaultSubject,
      react: createElement(EmailComponent, data),
    })

    if (response.error) {
      throw new Error(response.error.message)
    }

    return response.data
  } catch (error) {
    console.error('Email send error:', error)
    throw error
  }
} 