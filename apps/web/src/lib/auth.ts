// API base URL
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
const APP_BASE_URL =
  import.meta.env.VITE_APP_BASE_URL || "http://localhost:5173";

// User type
export interface User {
  id: string;
  name: string | null;
  email: string;
  emailVerified: boolean;
  image: string | null;
  role: string | null;
  phone: string | null;
  phoneVerified: boolean;
  profileCompleted: boolean;
  subscriptionId: string | null;
  createdAt: string;
  updatedAt: string;
}

// Session type
export interface Session {
  user: User;
  session: {
    id: string;
    expiresAt: Date;
    userId: string;
    ipAddress: string | null;
    userAgent: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
}

/**
 * Redirect to Google login
 */
export async function loginWithGoogle(): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/sign-in/social`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        provider: "google",
        callbackURL: `${APP_BASE_URL}/callback`,
      }),
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to get OAuth URL");
    }

    const data = await response.json();

    if (data.url) {
      window.location.href = data.url;
    } else {
      throw new Error("No OAuth URL returned");
    }
  } catch (error) {
    console.error("Failed to initiate Google sign-in:", error);
    throw error;
  }
}

/**
 * Get current session
 */
export async function getSession(): Promise<Session | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/get-session`, {
      credentials: "include",
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to get session:", error);
    return null;
  }
}

/**
 * Get current user profile
 */
export async function getUserProfile(): Promise<User | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/users/me`, {
      credentials: "include",
    });

    if (!response.ok) {
      return null;
    }

    const user = await response.json();
    return user;
  } catch (error) {
    console.error("Failed to get user profile:", error);
    return null;
  }
}

/**
 * Logout user
 */
export async function logout(): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/api/auth/sign-out`, {
      method: "POST",
      credentials: "include",
    });
  } catch (error) {
    console.error("Failed to logout:", error);
  }
}

/**
 * Update user profile
 */
export async function updateProfile(
  data: Partial<
    Pick<User, "name" | "phone" | "phoneVerified" | "role" | "profileCompleted">
  >
): Promise<User | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/users/me`, {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      return null;
    }

    const user = await response.json();
    return user;
  } catch (error) {
    console.error("Failed to update profile:", error);
    return null;
  }
}
