import '@testing-library/jest-dom'

// Mock Clerk authentication
jest.mock('@clerk/nextjs', () => ({
  auth: () => ({
    userId: 'test-user-id',
    sessionClaims: {
      company_id: 'test-company-id'
    }
  }),
  currentUser: () => ({
    id: 'test-user-id',
    emailAddresses: [{ emailAddress: 'test@example.com' }],
    publicMetadata: { company_id: 'test-company-id' }
  }),
  ClerkProvider: ({ children }) => children,
  useUser: () => ({
    user: {
      id: 'test-user-id',
      emailAddresses: [{ emailAddress: 'test@example.com' }],
      publicMetadata: { company_id: 'test-company-id' }
    },
    isLoaded: true,
    isSignedIn: true
  }),
  SignIn: () => <div>Mock Sign In</div>,
  SignUp: () => <div>Mock Sign Up</div>
}))

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: () => ({
      select: () => ({ data: [], error: null }),
      insert: () => ({ data: [], error: null }),
      update: () => ({ data: [], error: null }),
      delete: () => ({ data: [], error: null })
    }),
    storage: {
      from: () => ({
        upload: () => ({ data: null, error: null }),
        download: () => ({ data: null, error: null })
      })
    }
  }
}))

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn()
  }),
  usePathname: () => '/test',
  useSearchParams: () => new URLSearchParams()
}))

// Mock OpenAI
jest.mock('openai', () => {
  return {
    OpenAI: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{ message: { content: 'Mock AI response' } }]
          })
        }
      }
    }))
  }
}) 