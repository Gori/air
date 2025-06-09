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

interface WelcomeEmailProps {
  userName: string
  companyName: string
  dashboardUrl: string
}

export function WelcomeEmail({
  userName,
  companyName,
  dashboardUrl
}: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to the AI Readiness Assessment Platform</Preview>
      <Body style={{ backgroundColor: '#f6f9fc', fontFamily: 'system-ui' }}>
        <Container style={{ 
          backgroundColor: '#ffffff', 
          margin: '0 auto', 
          padding: '40px',
          maxWidth: '600px' 
        }}>
          <Heading>Welcome to AIR Platform</Heading>
          <Text>Hi {userName},</Text>
          <Text>
            Welcome to the AI Readiness Assessment Platform! You're now part of {companyName}'s 
            AI readiness journey.
          </Text>
          <Link href={dashboardUrl}>Go to Dashboard</Link>
        </Container>
      </Body>
    </Html>
  )
} 