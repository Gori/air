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

interface EmployeeInvitationEmailProps {
  companyName: string
  managerName: string
  inviteCode: string
  baseUrl: string
}

export function EmployeeInvitationEmail({
  companyName,
  managerName,
  inviteCode,
  baseUrl = 'http://localhost:3000'
}: EmployeeInvitationEmailProps) {
  const inviteUrl = `${baseUrl}/join/${inviteCode}`

  return (
    <Html>
      <Head />
      <Preview>You've been invited to participate in {companyName}'s AI Readiness Assessment</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>
            AI Readiness Assessment Invitation
          </Heading>
          
          <Text style={text}>
            Hello,
          </Text>
          
          <Text style={text}>
            {managerName} has invited you to participate in <strong>{companyName}</strong>'s 
            AI Readiness Assessment. This survey will help your organization understand 
            its current AI capabilities and identify opportunities for growth.
          </Text>
          
          <Text style={text}>
            The assessment takes approximately 15-20 minutes to complete and includes 
            questions about your experience with AI tools, your thoughts on AI in the 
            workplace, and how AI might benefit your work.
          </Text>
          
          <Text style={text}>
            <Link href={inviteUrl} style={button}>
              Start Assessment
            </Link>
          </Text>
          
          <Text style={text}>
            Your responses will be kept confidential and used only to generate 
            aggregate insights for your organization.
          </Text>
          
          <Text style={footer}>
            If you have any questions, please contact your manager or HR department.
            <br />
            <br />
            Powered by AIR - AI Readiness Assessment Platform
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
  borderRadius: '8px',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
}

const h1 = {
  color: '#1f2937',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0 40px',
  textAlign: 'center' as const,
}

const text = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
  padding: '0 40px',
}

const button = {
  backgroundColor: '#3b82f6',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '16px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
  fontWeight: 'bold',
}

const footer = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '32px 0 0',
  padding: '0 40px',
  textAlign: 'center' as const,
} 