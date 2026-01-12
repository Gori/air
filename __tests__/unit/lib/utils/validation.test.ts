import {
  validateEmail,
  sanitizeInput,
  validateUUID
} from '@/lib/utils/validation'

describe('Validation Utilities', () => {
  describe('validateEmail', () => {
    it('should accept valid emails', () => {
      expect(validateEmail('user@example.com')).toBe(true)
      expect(validateEmail('test.user@company.org')).toBe(true)
      expect(validateEmail('user+tag@domain.co.uk')).toBe(true)
    })

    it('should reject invalid emails', () => {
      expect(validateEmail('')).toBe(false)
      expect(validateEmail('invalid')).toBe(false)
      expect(validateEmail('@domain.com')).toBe(false)
      expect(validateEmail('user@')).toBe(false)
      expect(validateEmail('user@domain')).toBe(false)
    })
  })

  describe('sanitizeInput', () => {
    it('should remove angle brackets', () => {
      expect(sanitizeInput('<script>alert("xss")</script>')).toBe('scriptalert("xss")/script')
    })

    it('should handle empty strings', () => {
      expect(sanitizeInput('')).toBe('')
    })

    it('should preserve normal text', () => {
      expect(sanitizeInput('Hello World')).toBe('Hello World')
    })

    it('should trim whitespace', () => {
      expect(sanitizeInput('  hello  ')).toBe('hello')
    })
  })

  describe('validateUUID', () => {
    it('should accept valid UUIDs', () => {
      expect(validateUUID('123e4567-e89b-12d3-a456-426614174000')).toBe(true)
      expect(validateUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true)
    })

    it('should reject invalid UUIDs', () => {
      expect(validateUUID('')).toBe(false)
      expect(validateUUID('invalid-uuid')).toBe(false)
      expect(validateUUID('123e4567-e89b-12d3-a456')).toBe(false)
      expect(validateUUID('123e4567e89b12d3a456426614174000')).toBe(false)
    })
  })
})
