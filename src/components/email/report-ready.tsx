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

interface ReportReadyEmailProps {
  managerName: string
  companyName: string
  reportUrl: string
  shareUrl: string
}

export function ReportReadyEmail({
  managerName,
  companyName,
  reportUrl,
  shareUrl
}: ReportReadyEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your AI Readiness Assessment report is ready</Preview>
      <Body style={{ backgroundColor: '#f6f9fc', fontFamily: 'system-ui' }}>
        <Container style={{ 
          backgroundColor: '#ffffff', 
          margin: '0 auto', 
          padding: '40px',
          maxWidth: '600px' 
        }}>
          <Heading>Your AI Readiness Report is Ready</Heading>
          <Text>Hi {managerName},</Text>
          <Text>
            The AI Readiness Assessment report for {companyName} has been generated and is ready for review.
          </Text>
          <Link href={reportUrl}>View Report</Link>
          <Text>
            You can also share this report publicly using: <Link href={shareUrl}>Share Link</Link>
          </Text>
        </Container>
      </Body>
    </Html>
  )
} 