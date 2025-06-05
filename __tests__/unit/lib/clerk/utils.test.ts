import { extractEmailDomain, validateEmailDomain } from '@/lib/clerk/utils'

describe('Clerk Utils', () => {
  describe('extractEmailDomain', () => {
    it('should extract domain from email', () => {
      expect(extractEmailDomain('user@example.com')).toBe('example.com')
      expect(extractEmailDomain('test@company.org')).toBe('company.org')
    })

    it('should handle invalid email format', () => {
      expect(extractEmailDomain('invalid-email')).toBe('')
      expect(extractEmailDomain('')).toBe('')
    })
  })

  describe('validateEmailDomain', () => {
    it('should validate matching domains', () => {
      expect(validateEmailDomain('user@example.com', 'example.com')).toBe(true)
      expect(validateEmailDomain('test@COMPANY.ORG', 'company.org')).toBe(true)
    })

    it('should reject non-matching domains', () => {
      expect(validateEmailDomain('user@example.com', 'different.com')).toBe(false)
      expect(validateEmailDomain('test@company.org', 'example.com')).toBe(false)
    })
  })
}) 