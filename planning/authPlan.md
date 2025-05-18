# Authentication System Implementation Plan

## Overview
This document outlines the step-by-step implementation of an authentication system using Auth0 for authentication (including Google OAuth), Resend for email delivery, and input-otp for OTP input handling. The system will integrate with our existing Convex schema and provide a secure, user-friendly authentication experience.

## 1. Initial Setup

### 1.1 Auth0 Configuration
- Create Auth0 account and application
- Configure application settings:
  - Application Type: Single Page Application (SPA)
  - Allowed URLs: `http://localhost:3000` (development)
  - Configure Google OAuth:
    - Create Google Cloud Project
    - Configure OAuth 2.0 credentials
    - Add Google as a social connection in Auth0
    - Configure Google OAuth scopes (email, profile)

### 1.2 Resend Setup
- Create Resend account
- Verify sending domain
- Generate API key
- Create email templates for:
  - OTP verification
  - Welcome email
  - Password reset

### 1.3 Dependencies Installation
```bash
npm install @auth0/auth0-react resend input-otp
```

## 2. Schema Updates

### 2.1 Current Schema Analysis
Our current schema already includes authentication-related tables:
- `authAccounts`
- `authRateLimits`
- `authRefreshTokens`
- `authSessions`
- `users`

### 2.2 Required Schema Modifications
Add the following fields to the `users` table:
```typescript
users: defineTable({
  email: v.string(), // Make required instead of optional
  isAnonymous: v.optional(v.boolean()),
  emailVerified: v.boolean(), // New field
  lastLoginAt: v.optional(v.float64()), // New field
  softdelete: v.optional(v.boolean()),
})
```

## 3. Implementation Steps

### 3.1 Auth0 Provider Setup
1. Create `src/providers/Auth0Provider.tsx`:
```typescript
import { Auth0Provider } from '@auth0/auth0-react';

export function Auth0ProviderWithConfig({ children }) {
  return (
    <Auth0Provider
      domain={process.env.NEXT_PUBLIC_AUTH0_DOMAIN}
      clientId={process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID}
      authorizationParams={{
        redirect_uri: window.location.origin,
        prompt: 'login',
        connection: 'google-oauth2' // Optional: default to Google
      }}
    >
      {children}
    </Auth0Provider>
  );
}
```

### 3.2 Authentication Components
1. Create `src/components/auth/LoginButton.tsx`
2. Create `src/components/auth/LogoutButton.tsx`
3. Create `src/components/auth/OTPVerification.tsx` using input-otp
4. Create `src/components/auth/ProtectedRoute.tsx`
5. Create `src/components/auth/GoogleLoginButton.tsx`:
```typescript
import { useAuth0 } from '@auth0/auth0-react';

export function GoogleLoginButton() {
  const { loginWithRedirect } = useAuth0();
  
  return (
    <button
      onClick={() => loginWithRedirect({
        authorizationParams: {
          connection: 'google-oauth2'
        }
      })}
    >
      Sign in with Google
    </button>
  );
}
```

### 3.3 Backend Integration
1. Create Convex mutations for:
   - User creation/verification
   - Session management
   - Rate limiting
   - Google OAuth profile handling
2. Implement Auth0 webhook handlers
3. Set up Resend email sending functions
4. Create user profile sync function for Google data

### 3.4 Email Templates
1. Create React Email templates for:
   - OTP verification
   - Welcome email
   - Password reset
2. Set up template rendering with Resend

## 4. Security Considerations

### 4.1 Rate Limiting
- Implement rate limiting for OTP requests
- Use `authRateLimits` table to track attempts
- Set reasonable limits (e.g., 3 attempts per 15 minutes)

### 4.2 Session Management
- Implement proper session handling
- Use refresh tokens for long-lived sessions
- Implement session invalidation on logout

### 4.3 Data Protection
- Ensure sensitive data is properly encrypted
- Implement proper error handling
- Add logging for security events

## 5. User Experience

### 5.1 Authentication Flow
1. User chooses authentication method:
   a. Email OTP:
      - User enters email
      - System sends OTP via Resend
      - User enters OTP using input-otp component
      - System verifies OTP and creates/updates user
   b. Google OAuth:
      - User clicks "Sign in with Google"
      - Auth0 handles OAuth flow
      - System receives Google profile data
      - System creates/updates user with Google data
2. User is redirected to dashboard

### 5.2 Error Handling
- Clear error messages for:
  - Invalid OTP
  - Rate limiting
  - Network issues
  - Expired sessions

## 6. Testing Plan

### 6.1 Unit Tests
- Auth0 integration
- OTP verification
- Email sending
- Rate limiting

### 6.2 Integration Tests
- Complete authentication flow
- Session management
- Error scenarios

### 6.3 Security Tests
- Rate limiting effectiveness
- Session security
- Data protection

## 7. Deployment Checklist

### 7.1 Environment Variables
- Auth0 credentials
- Resend API key
- Application URLs
- Security keys

### 7.2 Production Configuration
- Update allowed URLs
- Configure production email templates
- Set up monitoring and logging
- Configure backup procedures

## 8. Monitoring and Maintenance

### 8.1 Metrics to Track
- Authentication success/failure rates
- Email delivery rates
- Rate limit hits
- Session durations

### 8.2 Regular Maintenance
- Review and update security settings
- Monitor rate limiting effectiveness
- Update email templates as needed
- Review and update dependencies

## 9. Future Enhancements
- Additional social login providers (GitHub, Facebook, etc.)
- Multi-factor authentication
- Remember me functionality
- Account recovery options
- Session management dashboard
- Account linking (connect Google account to email account)

## 10. References
- [Auth0 Documentation](docs/auth0.md)
- [Resend Documentation](docs/resend.md)
- [input-otp Documentation](docs/input-otp.md)
- [Convex Schema](convex/schema.ts) 