import { NextResponse } from 'next/server'

/**
 * Standardized API error response
 */
export function apiError(message: string, status: number = 500) {
  return NextResponse.json({ error: message, success: false }, { status })
}

/**
 * Standardized API success response
 */
export function apiSuccess<T>(data: T, status: number = 200) {
  return NextResponse.json({ data, success: true }, { status })
}

/**
 * Common error responses
 */
export const ApiErrors = {
  unauthorized: () => apiError('Unauthorized', 401),
  forbidden: () => apiError('Forbidden', 403),
  notFound: (resource: string = 'Resource') => apiError(`${resource} not found`, 404),
  badRequest: (message: string = 'Invalid request') => apiError(message, 400),
  internal: (message: string = 'Internal server error') => apiError(message, 500),
  managerRequired: () => apiError('Manager access required', 403),
  noCompany: () => apiError('No company association found', 400),
} as const
