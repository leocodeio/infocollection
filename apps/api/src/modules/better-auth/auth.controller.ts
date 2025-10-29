import { Controller, Get, Req, Res, Query, Redirect } from '@nestjs/common';
import type { Request, Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { auth } from './auth';

@ApiTags('authentication')
@Controller('auth')
export class AuthController {
  @Get('info')
  @AllowAnonymous()
  @ApiOperation({
    summary: 'Authentication Information & Testing Guide',
    description: `
# Authentication Guide for Swagger Testing

This API uses Better Auth which provides built-in authentication endpoints at **/api/auth/*** 

## Available Authentication Methods

### 1. Google OAuth (Recommended for Testing)

#### Option A: Simple GET Endpoint (Recommended)
**Endpoint:** GET /auth/sign-in-social-url?provider=google

**How to use:**
1. Call GET /auth/sign-in-social-url?provider=google to get the OAuth URL
2. Open the returned URL in your browser
3. Sign in with your Google account
4. You'll be redirected back automatically with a session cookie
5. Go to /api/auth/get-session to retrieve your Bearer token
6. Use the token in Swagger

#### Option B: Direct Better Auth OAuth (Alternative)
**Endpoint:** GET /api/auth/sign-in/social?provider=google&currentURL={yourAppURL}

### 2. Email/Password Authentication
**Sign Up:** POST /api/auth/sign-up/email
- Body: { "email": "user@example.com", "password": "SecurePass123!", "name": "Your Name" }

**Sign In:** POST /api/auth/sign-in/email  
- Body: { "email": "user@example.com", "password": "SecurePass123!" }

## How to Get Your Bearer Token

After logging in (Google OAuth or email/password), get your token:

1. Open a new browser tab
2. Go to: \`{baseURL}/api/auth/get-session\`
3. Copy the token value from the response (either from session or as Bearer token)
4. In Swagger, click the "Authorize" button at the top
5. Enter: \`Bearer {your-token}\`
6. Click "Authorize"
7. Now you can test all protected endpoints!

## New Endpoints

**Generate OAuth URL:** GET /auth/sign-in-social-url
- Query params: provider (required), callbackURL (optional)
- Returns OAuth authorization URL for the specified provider
- Recommended for frontend implementations

## Other Endpoints

**Get Current Session:** GET /api/auth/get-session
- Returns your current session and user info (if logged in)

**Sign Out:** POST /api/auth/sign-out
- Ends your current session

**Get All Sessions:** GET /api/auth/list-sessions
- Lists all active sessions for your account

## Environment Variables Required

Make sure these are set in your .env file:
- BETTER_AUTH_GOOGLE_ID
- BETTER_AUTH_GOOGLE_SECRET
- BETTER_AUTH_SECRET
- API_BASE_URL
- APP_BASE_URL
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Authentication endpoints information',
    schema: {
      properties: {
        message: { type: 'string' },
        endpoints: {
          type: 'object',
          properties: {
            googleOAuth: { type: 'string' },
            signup: { type: 'string' },
            signin: { type: 'string' },
            getSession: { type: 'string' },
            signout: { type: 'string' },
            listSessions: { type: 'string' },
          },
        },
        testing: {
          type: 'object',
          properties: {
            step1: { type: 'string' },
            step2: { type: 'string' },
            step3: { type: 'string' },
            step4: { type: 'string' },
          },
        },
      },
    },
  })
  getAuthInfo() {
    return {
      message: 'Better Auth provides authentication endpoints at /api/auth/*',
      endpoints: {
        googleOAuth:
          'GET /api/auth/sign-in/social?provider=google&currentURL={baseURL}',
        signup: 'POST /api/auth/sign-up/email',
        signin: 'POST /api/auth/sign-in/email',
        getSession: 'GET /api/auth/get-session',
        signout: 'POST /api/auth/sign-out',
        listSessions: 'GET /api/auth/list-sessions',
      },
      testing: {
        step1: 'Call GET /auth/google/url to get OAuth link',
        step2: 'Open the link in browser and sign in with Google',
        step3: 'Go to /api/auth/get-session in browser to get your token',
        step4: 'Use the token in Swagger Authorize button: Bearer {token}',
      },
      documentation: 'See Swagger UI for detailed testing instructions above',
    };
  }

  @Get('google/url')
  @AllowAnonymous()
  @ApiOperation({
    summary: 'Get Google OAuth URL',
    description: `
Returns the complete Google OAuth URL for testing.

**Usage:**
1. Call this endpoint
2. Copy the "fullUrl" from the response
3. Open it in a new browser tab
4. Sign in with Google
5. After redirect, go to /api/auth/get-session to get your token
6. Use token in Swagger: Click Authorize button, enter "Bearer {your-token}"
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Google OAuth URL and instructions',
    schema: {
      properties: {
        fullUrl: {
          type: 'string',
          example:
            'http://localhost:3000/api/auth/sign-in/social?provider=google&currentURL=http://localhost:3000',
          description: 'Open this URL in your browser to sign in with Google',
        },
        instructions: {
          type: 'array',
          items: { type: 'string' },
          example: [
            '1. Copy the fullUrl above',
            '2. Open it in a new browser tab',
            '3. Sign in with Google',
            '4. Go to /api/auth/get-session to get your token',
            '5. Use token in Swagger Authorize: Bearer {token}',
          ],
        },
        getTokenUrl: {
          type: 'string',
          example: 'http://localhost:3000/api/auth/get-session',
          description: 'Visit this URL after login to get your Bearer token',
        },
      },
    },
  })
  getGoogleOAuthUrl(@Req() req: Request) {
    const protocol = req.protocol;
    const host = req.get('host');
    const baseUrl = `${protocol}://${host}`;
    const callbackUrl = baseUrl;

    return {
      fullUrl: `${baseUrl}/api/auth/sign-in/social?provider=google&currentURL=${callbackUrl}`,
      getTokenUrl: `${baseUrl}/api/auth/get-session`,
      instructions: [
        '1. Copy the fullUrl above and open it in a new browser tab',
        '2. Sign in with your Google account',
        '3. After successful login, you will be redirected back',
        '4. Open the getTokenUrl in your browser to retrieve your session token',
        '5. Copy the token value from the response',
        '6. Click the Authorize button in Swagger (top of page)',
        '7. Enter: Bearer {your-token} (replace {your-token} with actual token)',
        '8. Click Authorize - now you can test protected endpoints!',
      ],
      note: 'Ensure BETTER_AUTH_GOOGLE_ID and BETTER_AUTH_GOOGLE_SECRET are configured in your .env file',
      envCheck: {
        required: [
          'BETTER_AUTH_GOOGLE_ID',
          'BETTER_AUTH_GOOGLE_SECRET',
          'BETTER_AUTH_SECRET',
          'API_BASE_URL',
          'APP_BASE_URL',
        ],
      },
    };
  }

  @Get('endpoints')
  @AllowAnonymous()
  @ApiOperation({
    summary: 'List all Better Auth endpoints',
    description: 'Shows all available authentication endpoints with examples',
  })
  @ApiResponse({
    status: 200,
    description: 'List of all auth endpoints',
  })
  listEndpoints(@Req() req: Request) {
    const protocol = req.protocol;
    const host = req.get('host');
    const baseUrl = `${protocol}://${host}`;

    return {
      baseUrl,
      authEndpoints: {
        googleOAuth: {
          url: `${baseUrl}/api/auth/sign-in/social?provider=google&currentURL=${baseUrl}`,
          method: 'GET',
          description: 'Initiate Google OAuth flow',
          testing: 'Open this URL in your browser',
        },
        emailSignUp: {
          url: `${baseUrl}/api/auth/sign-up/email`,
          method: 'POST',
          description: 'Create account with email/password',
          body: {
            email: 'user@example.com',
            password: 'SecurePass123!',
            name: 'Your Name',
          },
        },
        emailSignIn: {
          url: `${baseUrl}/api/auth/sign-in/email`,
          method: 'POST',
          description: 'Sign in with email/password',
          body: {
            email: 'user@example.com',
            password: 'SecurePass123!',
          },
        },
        getSession: {
          url: `${baseUrl}/api/auth/get-session`,
          method: 'GET',
          description: 'Get current session and token',
          note: 'Visit this after login to get your Bearer token',
        },
        signOut: {
          url: `${baseUrl}/api/auth/sign-out`,
          method: 'POST',
          description: 'End current session',
        },
        listSessions: {
          url: `${baseUrl}/api/auth/list-sessions`,
          method: 'GET',
          description: 'Get all active sessions',
        },
      },
      quickStart: {
        forSwagger: [
          '1. Use Google OAuth: GET /auth/google/url',
          '2. Open returned URL in browser and sign in',
          '3. Visit /api/auth/get-session to get token',
          '4. Click Authorize in Swagger with: Bearer {token}',
        ],
      },
    };
  }

  @Get('sign-in-social-url')
  @AllowAnonymous()
  @ApiOperation({
    summary: 'Get OAuth Social Sign In URL',
    description: `
Generates an OAuth authorization URL for social sign-in via GET request.
This endpoint works around the POST-only limitation of Better Auth's /api/auth/sign-in/social endpoint.

## How to Use

### Step 1: Get the OAuth URL
Make a GET request to this endpoint with the provider name:
\`\`\`
GET /auth/sign-in-social-url?provider=google
\`\`\`

### Step 2: Redirect User to OAuth Provider
The response will contain a \`url\` field. Redirect your frontend user to this URL:
\`\`\`
https://accounts.google.com/o/oauth2/v2/auth?client_id=...&redirect_uri=...&response_type=code&...
\`\`\`

### Step 3: User Logs In
The user will see Google's login page. They'll authenticate and authorize your app.

### Step 4: Handle OAuth Callback
Google redirects back to \`redirect_uri\` with an authorization code:
\`\`\`
http://localhost:3001/api/auth/callback/google?code=4/0AY0...&state=...
\`\`\`

**Important:** The callback endpoint is automatically handled by Better Auth. It will:
1. Exchange the authorization code for tokens
2. Create/update the user in the database
3. Set session cookies on the response
4. Redirect to your app's callback URL (if provided)

### Step 5: Get Session Token
After the OAuth callback completes, the user will have a session cookie. Get their token:
\`\`\`
GET /api/auth/get-session
\`\`\`

This returns the session object with the user's Bearer token.

## Query Parameters

- **provider** (required): OAuth provider name (e.g., "google")
- **callbackURL** (optional): Custom URL to redirect to after OAuth success. 
  - Defaults to: \`{baseUrl}/api/auth/callback/{provider}\`
  - The auth code will be appended as a query parameter

## Response Format

\`\`\`json
{
  "url": "https://accounts.google.com/o/oauth2/v2/auth?client_id=...&redirect_uri=...&response_type=code&scope=...&access_type=offline",
  "provider": "google",
  "callbackURL": "http://localhost:3001/api/auth/callback/google"
}
\`\`\`

## Example Frontend Implementation

\`\`\`javascript
// 1. Get the OAuth URL from backend
const response = await fetch('http://localhost:3001/auth/sign-in-social-url?provider=google');
const { url } = await response.json();

// 2. Redirect user to Google
window.location.href = url;

// 3. Google redirects back to /api/auth/callback/google
// Better Auth handles the exchange automatically

// 4. Get session token
const sessionRes = await fetch('http://localhost:3001/api/auth/get-session');
const { token } = await sessionRes.json();

// 5. Use token for authenticated requests
fetch('http://localhost:3001/api/protected', {
  headers: { 'Authorization': \`Bearer \${token}\` }
});
\`\`\`
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'OAuth authorization URL',
    schema: {
      properties: {
        url: {
          type: 'string',
          description:
            'The full OAuth authorization URL to redirect the user to',
        },
        provider: {
          type: 'string',
          description: 'The OAuth provider name (e.g., "google")',
        },
        callbackURL: {
          type: 'string',
          description:
            'The callback URL where OAuth will redirect after user authorization',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'Missing required provider parameter or provider not configured',
    schema: {
      properties: {
        error: { type: 'string' },
        message: { type: 'string' },
      },
    },
  })
  async getOAuthUrl(
    @Query('provider') provider: string,
    @Query('callbackURL') callbackURL: string,
    @Req() req: Request,
  ) {
    try {
      if (!provider) {
        throw new Error('Provider parameter is required');
      }

      const protocol = req.protocol;
      const host = req.get('host');
      const baseUrl = `${protocol}://${host}`;

      // Use provided callbackURL or default to api/auth/callback
      const redirectURL =
        callbackURL || `${baseUrl}/api/auth/callback/${provider}`;

      // Get social provider from better-auth config
      const socialProviders = (auth as any).options?.socialProviders;
      if (!socialProviders || !socialProviders[provider]) {
        throw new Error(`Provider "${provider}" is not configured`);
      }

      const providerConfig = socialProviders[provider];

      // Build OAuth URL using standard OAuth2 parameters
      const authorizationUrl = new URL(
        `https://accounts.google.com/o/oauth2/v2/auth`,
      );
      authorizationUrl.searchParams.set(
        'client_id',
        providerConfig.clientId || '',
      );
      authorizationUrl.searchParams.set('redirect_uri', redirectURL);
      authorizationUrl.searchParams.set(
        'response_type',
        providerConfig.responseType || 'code',
      );
      authorizationUrl.searchParams.set(
        'scope',
        (providerConfig.scope || ['email', 'profile']).join(' '),
      );
      authorizationUrl.searchParams.set('access_type', 'offline');

      return {
        url: authorizationUrl.toString(),
        provider,
        callbackURL: redirectURL,
      };
    } catch (error) {
      return {
        error: 'Failed to generate OAuth URL',
        message: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
