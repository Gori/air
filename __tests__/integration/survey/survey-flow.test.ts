/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { POST } from '@/app/api/survey/start/route'
import { POST as AnswerPOST } from '@/app/api/survey/answer/route'
import { supabaseAdmin } from '@/lib/supabase/admin'

// Mock the dependencies
jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn().mockResolvedValue({
    userId: 'test-employee-id'
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
    not: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn(),
    insert: jest.fn().mockReturnThis(),
  }
}))

describe('Survey Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('/api/survey/start', () => {
    it('should start a new survey for user with no progress', async () => {
      // Mock no existing questions
      const mockQuestionsQuery = {
        single: jest.fn().mockResolvedValue({
          data: null,
          error: null
        })
      }

      // Mock total questions count
      const mockCountQuery = {
        single: jest.fn().mockResolvedValue({
          data: { count: 50 },
          error: null
        })
      }

      // Mock next question
      const mockNextQuestionQuery = {
        single: jest.fn().mockResolvedValue({
          data: {
            id: 1,
            text: 'How familiar are you with AI tools?',
            dimension: 'ai_literacy'
          },
          error: null
        })
      }

      // Mock question instance creation
      const mockInstanceInsert = {
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'instance-123',
            ordinal: 1,
            questions: {
              id: 1,
              text: 'How familiar are you with AI tools?',
              dimension: 'ai_literacy'
            }
          },
          error: null
        })
      }

      // Setup the mock chain
      ;(supabaseAdmin.from as jest.Mock)
        .mockReturnValueOnce({ // Check existing questions
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue(mockQuestionsQuery)
              })
            })
          })
        })
        .mockReturnValueOnce({ // Count total questions
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue(mockCountQuery)
          })
        })
        .mockReturnValueOnce({ // Get next question
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue(mockNextQuestionQuery)
              })
            })
          })
        })
        .mockReturnValueOnce({ // Create question instance
          insert: jest.fn().mockReturnValue(mockInstanceInsert)
        })

      const request = new NextRequest('http://localhost:3000/api/survey/start', {
        method: 'POST'
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.completed).toBe(false)
      expect(data.questionInstance).toBeDefined()
      expect(data.questionInstance.id).toBe('instance-123')
      expect(data.progress.current).toBe(1)
      expect(data.progress.total).toBe(50)
    })

    it('should return completion status for completed survey', async () => {
      // Mock existing completed questions
      const mockQuestionsQuery = {
        single: jest.fn().mockResolvedValue({
          data: { count: 50 },
          error: null
        })
      }

      // Mock total questions count
      const mockCountQuery = {
        single: jest.fn().mockResolvedValue({
          data: { count: 50 },
          error: null
        })
      }

      ;(supabaseAdmin.from as jest.Mock)
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue(mockQuestionsQuery)
              })
            })
          })
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue(mockCountQuery)
          })
        })

      const request = new NextRequest('http://localhost:3000/api/survey/start', {
        method: 'POST'
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.completed).toBe(true)
      expect(data.totalQuestions).toBe(50)
    })
  })

  describe('/api/survey/answer', () => {
    it('should save an answer successfully', async () => {
      // Mock question instance lookup
      const mockInstanceQuery = {
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'instance-123',
            employee_id: 'test-employee-id',
            company_id: 'test-company-id'
          },
          error: null
        })
      }

      // Mock answer insert
      const mockAnswerInsert = {
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'answer-123',
            answer_text: 'I use AI tools daily'
          },
          error: null
        })
      }

      ;(supabaseAdmin.from as jest.Mock)
        .mockReturnValueOnce({ // Question instance lookup
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue(mockInstanceQuery)
          })
        })
        .mockReturnValueOnce({ // Answer insert
          insert: jest.fn().mockReturnValue(mockAnswerInsert)
        })

      const request = new NextRequest('http://localhost:3000/api/survey/answer', {
        method: 'POST',
        body: JSON.stringify({
          questionInstanceId: 'instance-123',
          answerText: 'I use AI tools daily'
        })
      })

      const response = await AnswerPOST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.answer).toBeDefined()
      expect(data.answer.id).toBe('answer-123')
      expect(data.answer.answer_text).toBe('I use AI tools daily')
    })

    it('should validate question instance ownership', async () => {
      // Mock question instance for different employee
      const mockInstanceQuery = {
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'instance-123',
            employee_id: 'different-employee-id',
            company_id: 'test-company-id'
          },
          error: null
        })
      }

      ;(supabaseAdmin.from as jest.Mock)
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue(mockInstanceQuery)
          })
        })

      const request = new NextRequest('http://localhost:3000/api/survey/answer', {
        method: 'POST',
        body: JSON.stringify({
          questionInstanceId: 'instance-123',
          answerText: 'I use AI tools daily'
        })
      })

      const response = await AnswerPOST(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toContain('not authorized')
    })

    it('should validate required fields', async () => {
      const request = new NextRequest('http://localhost:3000/api/survey/answer', {
        method: 'POST',
        body: JSON.stringify({
          questionInstanceId: '',
          answerText: ''
        })
      })

      const response = await AnswerPOST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid request data')
    })
  })
}) 