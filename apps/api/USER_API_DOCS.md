# User Controller API Documentation

This is an industry-standard user management system with Google OAuth authentication using Better Auth and NestJS.

## Features

- **Google OAuth Authentication** - Secure login/signup with Google
- **Profile Management** - Update user information
- **Session Management** - Manage active sessions across devices
- **Account Deletion** - Permanent account removal
- **Statistics** - User activity metrics
- **Security** - Protected endpoints with Bearer token authentication

## Authentication

The API uses Better Auth for authentication. All endpoints (except public ones) require a valid session token.

### Google Login/Signup Flow

1. **Initiate Google OAuth**: Redirect user to `/api/auth/sign-in/social?provider=google`
2. **Callback**: After successful authentication, Better Auth will handle the callback
3. **Session Cookie**: A session cookie will be set automatically
4. **API Access**: Use the session cookie or Bearer token for API requests

### Better Auth Endpoints

These are handled automatically by the Better Auth module:

- `POST /api/auth/sign-in/social` - Initiate OAuth login
- `POST /api/auth/sign-up/social` - Initiate OAuth signup
- `POST /api/auth/sign-out` - Logout
- `GET /api/auth/session` - Get current session
- `GET /api/auth/get-session` - Get session details

## User Controller Endpoints

All endpoints are prefixed with `/users`

### Profile Management

#### Get Current User Profile

```http
GET /users/me
Authorization: Bearer <token>
```

**Response:**

```json
{
  "id": "user_123",
  "name": "John Doe",
  "email": "john@example.com",
  "emailVerified": true,
  "image": "https://example.com/avatar.jpg",
  "role": null,
  "phone": null,
  "phoneVerified": false,
  "profileCompleted": false,
  "subscriptionId": null,
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T00:00:00.000Z"
}
```

#### Get Full Profile with Session

```http
GET /users/me/full
Authorization: Bearer <token>
```

**Response:**

```json
{
  "user": {
    "id": "user_123",
    "name": "John Doe",
    "email": "john@example.com",
    ...
  },
  "session": {
    "id": "session_123",
    "expiresAt": "2025-01-02T00:00:00.000Z",
    "userId": "user_123",
    "ipAddress": "192.168.1.1",
    "userAgent": "Mozilla/5.0...",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
}
```

#### Get User with Linked Accounts

```http
GET /users/me/accounts
Authorization: Bearer <token>
```

**Response:**

```json
{
  "id": "user_123",
  "name": "John Doe",
  "email": "john@example.com",
  ...
  "accounts": [
    {
      "id": "account_123",
      "providerId": "google",
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

#### Update User Profile

```http
PUT /users/me
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Smith",
  "phone": "+1234567890",
  "phoneVerified": true,
  "role": "premium",
  "profileCompleted": true
}
```

**Response:**

```json
{
  "id": "user_123",
  "name": "John Smith",
  "email": "john@example.com",
  "phone": "+1234567890",
  "phoneVerified": true,
  "role": "premium",
  "profileCompleted": true,
  ...
}
```

#### Delete Account

```http
DELETE /users/me
Authorization: Bearer <token>
```

**Response:**

```json
{
  "message": "Account deleted successfully"
}
```

### Session Management

#### Get All Active Sessions

```http
GET /users/me/sessions
Authorization: Bearer <token>
```

**Response:**

```json
[
  {
    "id": "session_123",
    "expiresAt": "2025-01-02T00:00:00.000Z",
    "ipAddress": "192.168.1.1",
    "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  },
  {
    "id": "session_456",
    "expiresAt": "2025-01-03T00:00:00.000Z",
    "ipAddress": "192.168.1.2",
    "userAgent": "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0)",
    "createdAt": "2025-01-01T12:00:00.000Z",
    "updatedAt": "2025-01-01T12:00:00.000Z"
  }
]
```

#### Revoke Specific Session

```http
DELETE /users/me/sessions/{sessionId}
Authorization: Bearer <token>
```

**Response:**

```json
{
  "message": "Session revoked successfully"
}
```

#### Revoke All Other Sessions

```http
DELETE /users/me/sessions
Authorization: Bearer <token>
```

**Response:**

```json
{
  "message": "All other sessions revoked successfully"
}
```

### User Statistics

#### Get User Stats

```http
GET /users/me/stats
Authorization: Bearer <token>
```

**Response:**

```json
{
  "activeSessions": 3
}
```

### Account Status

#### Check Google Account Link

```http
GET /users/me/google-linked
Authorization: Bearer <token>
```

**Response:**

```json
{
  "hasGoogleAccount": true
}
```

### Public Endpoints

#### Health Check

```http
GET /users/health
```

**Response:**

```json
{
  "status": "ok",
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

## Error Responses

All endpoints follow standard HTTP status codes:

- `200 OK` - Request successful
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Missing or invalid authentication
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

**Error Response Format:**

```json
{
  "statusCode": 400,
  "message": "Email already in use",
  "error": "Bad Request"
}
```

## Usage Examples

### Frontend Integration (React/Vue/Next.js)

```javascript
// Login with Google
const loginWithGoogle = () => {
  window.location.href =
    'http://localhost:3001/api/auth/sign-in/social?provider=google';
};

// Get user profile
const getProfile = async () => {
  const response = await fetch('http://localhost:3001/users/me', {
    credentials: 'include', // Include cookies
  });
  const user = await response.json();
  return user;
};

// Update profile
const updateProfile = async (data) => {
  const response = await fetch('http://localhost:3001/users/me', {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return response.json();
};

// Logout
const logout = async () => {
  await fetch('http://localhost:3001/api/auth/sign-out', {
    method: 'POST',
    credentials: 'include',
  });
};

// Get active sessions
const getSessions = async () => {
  const response = await fetch('http://localhost:3001/users/me/sessions', {
    credentials: 'include',
  });
  return response.json();
};

// Logout from other devices
const logoutOtherDevices = async () => {
  await fetch('http://localhost:3001/users/me/sessions', {
    method: 'DELETE',
    credentials: 'include',
  });
};
```

## Security Best Practices

1. **HTTPS Only** - Always use HTTPS in production
2. **CORS Configuration** - Configure trusted origins in `.env`
3. **Session Expiration** - Sessions expire after 60 seconds (configurable in auth.ts:117)
4. **Cookie Security** - Session cookies are httpOnly and secure
5. **Rate Limiting** - Consider adding rate limiting middleware
6. **Input Validation** - All inputs should be validated on frontend

## Environment Variables

Required environment variables in `.env`:

```env
# API Configuration
PORT=3001
API_BASE_URL=http://localhost:3001
APP_BASE_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

# Better Auth
BETTER_AUTH_SECRET=your-secret-key-here
BETTER_AUTH_GOOGLE_ID=your-google-client-id
BETTER_AUTH_GOOGLE_SECRET=your-google-client-secret
```

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to Credentials → Create Credentials → OAuth 2.0 Client ID
5. Set authorized redirect URIs:
   - `http://localhost:3001/api/auth/callback/google` (development)
   - `https://yourdomain.com/api/auth/callback/google` (production)
6. Copy Client ID and Client Secret to `.env` file

## Swagger/OpenAPI Documentation

Access interactive API documentation at:

```
http://localhost:3001/api-docs
```

Username: admin  
Password: (set in SWAGGER_PASSWORD env var)

## Architecture

```
apps/api/src/modules/better-auth/
├── auth.ts                    # Better Auth configuration
├── user.module.ts             # NestJS module
├── user.controller.ts         # API endpoints
├── user.service.ts            # Business logic
└── dto/
    ├── user-response.dto.ts   # Response DTOs
    └── update-user.dto.ts     # Request DTOs
```

## Database Schema

The user authentication uses the following Prisma models:

- **User** - User profile information
- **Session** - Active sessions
- **Account** - OAuth provider accounts (Google)
- **Verification** - Email/phone verification tokens

## Support

For issues or questions, please refer to:

- [Better Auth Documentation](https://better-auth.com)
- [NestJS Documentation](https://docs.nestjs.com)
- [Prisma Documentation](https://www.prisma.io/docs)
