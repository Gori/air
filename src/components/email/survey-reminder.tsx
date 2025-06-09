import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from '@react-email/components'

interface SurveyReminderEmailProps {
  employeeName: string
  companyName: string
  surveyUrl: string
}

export function SurveyReminderEmail({
  employeeName,
  companyName,
  surveyUrl
}: SurveyReminderEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Reminder: Complete your AI Readiness Assessment</Preview>
      <Body style={{ backgroundColor: '#f6f9fc', fontFamily: 'system-ui' }}>
        <Container style={{ 
          backgroundColor: '#ffffff', 
          margin: '0 auto', 
          padding: '40px',
          maxWidth: '600px' 
        }}>
          <Heading>Reminder: AI Readiness Assessment</Heading>
          <Text>Hi {employeeName},</Text>
          <Text>
            This is a friendly reminder to complete your AI Readiness Assessment for {companyName}.
          </Text>
          <Link href={surveyUrl}>Complete Assessment</Link>
        </Container>
      </Body>
    </Html>
  )
} 