import { apiError, apiSuccess, ApiErrors } from '@/lib/utils/api-response'
import { NextResponse } from 'next/server'

// Mock NextResponse.json
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((body, options) => ({ body, status: options?.status || 200 })),
  },
}))

describe('API Response Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('apiError', () => {
    it('should create error response with default 500 status', () => {
      const result = apiError('Something went wrong')
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'Something went wrong', success: false },
        { status: 500 }
      )
    })

    it('should create error response with custom status', () => {
      const result = apiError('Not found', 404)
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'Not found', success: false },
        { status: 404 }
      )
    })
  })

  describe('apiSuccess', () => {
    it('should create success response with default 200 status', () => {
      const result = apiSuccess({ data: 'test' })
      expect(NextResponse.json).toHaveBeenCalledWith(
        { data: { data: 'test' }, success: true },
        { status: 200 }
      )
    })

    it('should create success response with custom status', () => {
      const result = apiSuccess({ id: 1 }, 201)
      expect(NextResponse.json).toHaveBeenCalledWith(
        { data: { id: 1 }, success: true },
        { status: 201 }
      )
    })
  })

  describe('ApiErrors', () => {
    it('should return unauthorized error', () => {
      ApiErrors.unauthorized()
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'Unauthorized', success: false },
        { status: 401 }
      )
    })

    it('should return forbidden error', () => {
      ApiErrors.forbidden()
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'Forbidden', success: false },
        { status: 403 }
      )
    })

    it('should return not found error with default message', () => {
      ApiErrors.notFound()
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'Resource not found', success: false },
        { status: 404 }
      )
    })

    it('should return not found error with custom resource', () => {
      ApiErrors.notFound('User')
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'User not found', success: false },
        { status: 404 }
      )
    })

    it('should return bad request error', () => {
      ApiErrors.badRequest('Invalid email format')
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'Invalid email format', success: false },
        { status: 400 }
      )
    })

    it('should return internal error', () => {
      ApiErrors.internal()
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'Internal server error', success: false },
        { status: 500 }
      )
    })

    it('should return manager required error', () => {
      ApiErrors.managerRequired()
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'Manager access required', success: false },
        { status: 403 }
      )
    })

    it('should return no company error', () => {
      ApiErrors.noCompany()
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'No company association found', success: false },
        { status: 400 }
      )
    })
  })
})
