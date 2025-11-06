# Authentication Flow Documentation

## Overview

This application uses `better-auth` for authentication with Google OAuth. The API (NestJS) runs on port 3001, and the web app (React) runs on port 5173.

## OAuth Flow Explanation

### 1. User Initiates Sign In

- User clicks "Continue with Google" on `/login` page
- Web app calls `loginWithGoogle()` function in `apps/web/src/lib/auth.ts:40`

### 2. Web App Requests OAuth URL

```typescript
POST http://localhost:3001/api/auth/sign-in/social
Body: {
  provider: "google",
  callbackURL: "http://localhost:5173/callback"
}
```

### 3. API Returns Google OAuth URL

- API responds with Google's OAuth authorization URL
- Web app redirects user to Google's login page

### 4. User Authenticates with Google

- User signs in to their Google account
- User authorizes the application

### 5. Google Redirects to API Callback

```
GET http://localhost:3001/api/auth/callback/google?code=...&state=...
```

- This is the `redirectURI` configured in `apps/api/src/modules/better-auth/auth.ts:93`
- Better-auth handles the callback automatically
- API exchanges authorization code for user information
- API creates/updates user in database
- **API sets authentication cookies** in the response
- API redirects to the `callbackURL` specified in step 2

### 6. User Redirected to Web App Callback

```
GET http://localhost:5173/callback
```

- Web app's callback page (`apps/web/src/pages/Callback.tsx`) receives the redirect
- **Cookies from step 5 should now be present**
- Callback page waits 1 second for cookies to settle
- Calls `refreshUser()` to fetch user session

### 7. Session Verification

```typescript
GET http://localhost:3001/api/auth/get-session
Credentials: include (sends cookies)
```

- API validates session cookie
- Returns user session data
- Web app updates AuthContext
- User is redirected to home page

## Key Configuration Points

### API Configuration (`apps/api/src/modules/better-auth/auth.ts`)

1. **baseURL**: Where the API runs
   - Used by better-auth to construct callback URLs
   - Value: `http://localhost:3001` (from `API_BASE_URL`)

2. **redirectURI**: Where Google redirects after authentication
   - Must match the URL registered in Google Console
   - Value: `http://localhost:3001/api/auth/callback/google`

3. **trustedOrigins**: Origins allowed to make authenticated requests
   - Includes both API and web app URLs
   - Required for CORS and cookie security

4. **Cookie Settings**:
   - `sameSite: 'lax'` in development (different origins)
   - `httpOnly: true` for security
   - `secure: false` in development (no HTTPS)
   - `cookiePrefix: 'leostack'`

### Web App Configuration

1. **Environment Variables** (`apps/web/.env`):

   ```
   VITE_API_BASE_URL=http://localhost:3001
   VITE_APP_BASE_URL=http://localhost:5173
   ```

2. **Fetch Credentials**: All API requests must include `credentials: 'include'`
   - Ensures cookies are sent with cross-origin requests

### CORS Configuration (`apps/api/src/api_utils/bootstrap.config.ts`)

- `credentials: true` - Required to send/receive cookies
- `origin` - Must include web app URL
- `allowedHeaders` - Must include standard headers
- `exposedHeaders: ['Set-Cookie']` - Allows JavaScript to see Set-Cookie header

## Common Issues and Solutions

### Issue 1: Redirect to API URL Instead of Web App

**Problem**: After Google authentication, user sees API URL in browser

**Cause**: The `callbackURL` parameter is not being properly sent or honored

**Solution**: Ensure `apps/web/src/lib/auth.ts:49` sends correct `callbackURL` in the body

### Issue 2: Cookies Not Being Set

**Problem**: Session cookie is not present after authentication

**Causes**:

1. CORS not configured properly
2. `credentials: 'include'` missing from fetch requests
3. Cookie sameSite policy incorrect
4. trustedOrigins doesn't include web app URL

**Solutions**:

- Verify CORS includes `credentials: true`
- Check all fetch calls have `credentials: 'include'`
- Ensure `sameSite: 'lax'` in development
- Add web app URL to trustedOrigins

### Issue 3: Session Not Persisting

**Problem**: User is authenticated but session is lost on refresh

**Causes**:

1. Cookies not being sent with requests
2. Cookie domain/path mismatch
3. Session expired

**Solutions**:

- Verify cookies in browser DevTools (Application > Cookies)
- Check cookie name starts with prefix: `leostack_session_token`
- Ensure `credentials: 'include'` on all authenticated requests

## Testing the Flow

1. Clear all cookies for both localhost:3001 and localhost:5173
2. Open browser DevTools > Network tab
3. Navigate to `http://localhost:5173/login`
4. Click "Continue with Google"
5. Watch the network requests:
   - POST to `/api/auth/sign-in/social`
   - Redirect to Google
   - Redirect to `/api/auth/callback/google` (should set cookies)
   - Redirect to `/callback`
   - GET to `/api/auth/get-session` (should send cookies)

6. Check cookies in DevTools > Application > Cookies
   - Should see `leostack_session_token` for localhost

## Environment Setup Checklist

### API (.env)

- [ ] `API_BASE_URL=http://localhost:3001`
- [ ] `APP_BASE_URL=http://localhost:5173`
- [ ] `CORS_ORIGIN='http://localhost:5173'`
- [ ] `BETTER_AUTH_SECRET` set to secure random string
- [ ] `BETTER_AUTH_GOOGLE_ID` from Google Console
- [ ] `BETTER_AUTH_GOOGLE_SECRET` from Google Console
- [ ] `DATABASE_URL` pointing to PostgreSQL database

### Web App (.env)

- [ ] `VITE_API_BASE_URL=http://localhost:3001`
- [ ] `VITE_APP_BASE_URL=http://localhost:5173`

### Google Console

- [ ] OAuth Client ID created
- [ ] Authorized redirect URIs includes: `http://localhost:3001/api/auth/callback/google`
- [ ] Authorized JavaScript origins includes: `http://localhost:5173`

## Production Considerations

When deploying to production:

1. Update cookie settings in `auth.ts`:

   ```typescript
   sameSite: 'none',  // Required for cross-domain
   secure: true,      // HTTPS only
   ```

2. Update `NODE_ENV=production` in API

3. Use actual domain URLs instead of localhost

4. Ensure HTTPS is enabled on both API and web app

5. Update Google Console with production URLs

6. Consider using subdomains (api.example.com and app.example.com) for easier cookie sharing
