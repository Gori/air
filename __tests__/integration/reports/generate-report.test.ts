/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { POST } from '@/app/api/ai/generateReport/route'
import { supabaseAdmin } from '@/lib/supabase/admin'

// Mock the dependencies
jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn().mockResolvedValue({
    userId: 'test-manager-id'
  })
}))

jest.mock('@/lib/supabase/server', () => ({
  getCompanyId: jest.fn().mockResolvedValue('test-company-id')
}))

jest.mock('@/lib/supabase/admin', () => ({
  supabaseAdmin: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
    insert: jest.fn().mockReturnThis(),
    not: jest.fn().mockReturnThis(),
  }
}))

jest.mock('@/lib/ai/client', () => ({
  generateAIResponse: jest.fn().mockResolvedValue({
    content: JSON.stringify({
      scores: {
        ai_literacy: { score: 4.2, justification: 'Strong understanding shown' },
        existing_ai_skills: { score: 3.8, justification: 'Good foundation present' }
      },
      narrative: {
        strengths: ['High engagement with AI tools', 'Strong technical aptitude'],
        gaps: ['Limited strategic planning', 'Need more training'],
        recommendations: ['Implement AI training program', 'Develop AI strategy']
      }
    }),
    model: 'gpt-4.1-mini-2025-04-14',
    usage: { total_tokens: 500 }
  })
}))

describe('/api/ai/generateReport', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should successfully generate a report for authorized manager', async () => {
    // Mock user role check
    const mockUserQuery = {
      single: jest.fn().mockResolvedValue({
        data: { role: 'manager' },
        error: null
      })
    }
    
    // Mock company query
    const mockCompanyQuery = {
      single: jest.fn().mockResolvedValue({
        data: { name: 'Test Company' },
        error: null
      })
    }

    // Mock survey responses
    const mockResponsesQuery = {
      not: jest.fn().mockResolvedValue({
        data: [
          {
            id: 'q1',
            employee_id: 'emp1',
            questions: { id: 1, text: 'How do you use AI?', dimension: 'ai_literacy' },
            answers: [{ answer_text: 'I use ChatGPT daily for writing' }],
            users: { full_name: 'John Doe', email: 'john@test.com' }
          }
        ],
        error: null
      })
    }

    // Mock report insert
    const mockReportInsert = {
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: {
          id: 'report-123',
          shared_slug: 'test-company-123'
        },
        error: null
      })
    }

    // Mock report scores insert
    const mockScoresInsert = {
      insert: jest.fn().mockResolvedValue({
        error: null
      })
    }

    // Setup the mock chain
    ;(supabaseAdmin.from as jest.Mock)
      .mockReturnValueOnce({ // User role check
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue(mockUserQuery)
        })
      })
      .mockReturnValueOnce({ // Company query
        select: jest.fn().mockReturnValue(mockCompanyQuery)
      })
      .mockReturnValueOnce(mockResponsesQuery) // Survey responses
      .mockReturnValueOnce({ // Report insert
        insert: jest.fn().mockReturnValue(mockReportInsert)
      })
      .mockReturnValueOnce(mockScoresInsert) // Report scores
      .mockReturnValueOnce({ // Prompt log
        insert: jest.fn().mockResolvedValue({ error: null })
      })

    const request = new NextRequest('http://localhost:3000/api/ai/generateReport', {
      method: 'POST',
      body: JSON.stringify({ includeAllEmployees: true })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.report).toBeDefined()
    expect(data.report.id).toBe('report-123')
    expect(data.summary.totalEmployees).toBe(1)
  })

  it('should reject unauthorized users', async () => {
    // Mock unauthorized user
    const mockUserQuery = {
      single: jest.fn().mockResolvedValue({
        data: { role: 'employee' },
        error: null
      })
    }

    ;(supabaseAdmin.from as jest.Mock)
      .mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue(mockUserQuery)
        })
      })

    const request = new NextRequest('http://localhost:3000/api/ai/generateReport', {
      method: 'POST',
      body: JSON.stringify({ includeAllEmployees: true })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toBe('Only managers can generate reports')
  })

  it('should handle no survey responses', async () => {
    // Mock manager user
    const mockUserQuery = {
      single: jest.fn().mockResolvedValue({
        data: { role: 'manager' },
        error: null
      })
    }
    
    // Mock company
    const mockCompanyQuery = {
      single: jest.fn().mockResolvedValue({
        data: { name: 'Test Company' },
        error: null
      })
    }

    // Mock empty responses
    const mockResponsesQuery = {
      not: jest.fn().mockResolvedValue({
        data: [],
        error: null
      })
    }

    ;(supabaseAdmin.from as jest.Mock)
      .mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue(mockUserQuery)
        })
      })
      .mockReturnValueOnce({
        select: jest.fn().mockReturnValue(mockCompanyQuery)
      })
      .mockReturnValueOnce(mockResponsesQuery)

    const request = new NextRequest('http://localhost:3000/api/ai/generateReport', {
      method: 'POST',
      body: JSON.stringify({ includeAllEmployees: true })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('No survey responses found')
  })
}) 