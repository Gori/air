import type { NextConfig } from "next";

const securityHeaders = [
  {
    // Enforce HTTPS for 1 year (browsers will auto-upgrade HTTP requests)
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains'
  },
  {
    // Prevent MIME-type sniffing
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    // Prevent clickjacking by disallowing iframe embedding
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    // Enable XSS protection in older browsers
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    // Control referrer information sent with requests
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  },
  {
    // Restrict browser features/APIs
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()'
  }
]

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },
};

export default nextConfig;
