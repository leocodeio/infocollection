// API base URL
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

// User type (matches backend /auth/me response)
export interface User {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  emailVerified: boolean | null;
}

// Session type
export interface Session {
  id: string;
  userId: string;
  expiresAt: string;
  ipAddress: string | null;
  userAgent: string | null;
}

// Auth responses
export interface AuthResponse {
  user: User;
  session: Session;
}

export interface GoogleAuthUrlResponse {
  authUrl: string;
  message: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Register with email and password
 */
export async function register(data: RegisterRequest): Promise<AuthResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to register");
    }

    return response.json();
  } catch (error) {
    console.error("Failed to register:", error);
    throw error;
  }
}

/**
 * Login with email and password
 */
export async function login(data: LoginRequest): Promise<AuthResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to login");
    }

    return response.json();
  } catch (error) {
    console.error("Failed to login:", error);
    throw error;
  }
}

/**
 * Get Google OAuth URL and redirect
 */
export async function loginWithGoogle(): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/google`, {
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to get Google OAuth URL");
    }

    const data: GoogleAuthUrlResponse = await response.json();

    if (data.authUrl) {
      window.location.href = data.authUrl;
    } else {
      throw new Error("No OAuth URL returned");
    }
  } catch (error) {
    console.error("Failed to initiate Google sign-in:", error);
    throw error;
  }
}

/**
 * Get current user
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      credentials: "include",
    });

    if (!response.ok) {
      return null;
    }

    const user = await response.json();
    return user;
  } catch (error) {
    return null;
  }
}

/**
 * Logout user
 */
export async function logout(): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });

    if (!response.ok) {
      console.error("Logout request failed");
    }
  } catch (error) {
    console.error("Failed to logout:", error);
  }
}

/**
 * Refresh access token
 */
export async function refreshToken(
  refreshToken: string,
): Promise<AuthResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      throw new Error("Failed to refresh token");
    }

    return response.json();
  } catch (error) {
    console.error("Failed to refresh token:", error);
    throw error;
  }
}

// Deprecated - kept for backward compatibility
export async function getSession(): Promise<{ user: User } | null> {
  const user = await getCurrentUser();
  return user ? { user } : null;
}

// Deprecated - kept for backward compatibility
export async function getUserProfile(): Promise<User | null> {
  return getCurrentUser();
}
