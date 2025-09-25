/* Client-side authentication store
   - Simple single-user authentication system
   - Persisted in localStorage under key "user_auth"
   - Shape: { username: string, hashedPassword: string, loggedIn: boolean, loginTime: number }
   - Safe on SSR: guards on typeof window
*/

export type AuthUser = {
  username: string;
  hashedPassword: string;
  loggedIn: boolean;
  loginTime: number;
};

const KEY = "user_auth";
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours

// Default credentials - can be changed via changePassword
const DEFAULT_USERNAME = "admin";
const DEFAULT_PASSWORD = "123456";

function hasWindow() {
  return typeof window !== "undefined";
}

// Simple hash function for client-side password storage
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

function loadUser(): AuthUser | null {
  if (!hasWindow()) return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      return parsed as AuthUser;
    }
  } catch {
    // ignore
  }
  return null;
}

function saveUser(user: AuthUser) {
  if (!hasWindow()) return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(user));
  } catch {
    // ignore
  }
}

function initializeDefaultUser() {
  const existing = loadUser();
  if (!existing) {
    // Create default user on first use
    const defaultUser: AuthUser = {
      username: DEFAULT_USERNAME,
      hashedPassword: simpleHash(DEFAULT_PASSWORD),
      loggedIn: false,
      loginTime: 0,
    };
    saveUser(defaultUser);
    return defaultUser;
  }
  return existing;
}

const api = {
  // Check if user is currently logged in and session is valid
  isLoggedIn(): boolean {
    const user = loadUser();
    if (!user || !user.loggedIn) return false;
    
    // Check session timeout
    const now = Date.now();
    if (now - user.loginTime > SESSION_TIMEOUT) {
      // Session expired, logout
      api.logout();
      return false;
    }
    
    return true;
  },

  // Get current user info (without sensitive data)
  getUser(): { username: string; loginTime: number } | null {
    const user = loadUser();
    if (!user || !api.isLoggedIn()) return null;
    
    return {
      username: user.username,
      loginTime: user.loginTime,
    };
  },

  // Login with username and password
  login(username: string, password: string): boolean {
    const user = initializeDefaultUser();
    const hashedInput = simpleHash(password);
    
    if (user.username === username && user.hashedPassword === hashedInput) {
      const updatedUser: AuthUser = {
        ...user,
        loggedIn: true,
        loginTime: Date.now(),
      };
      saveUser(updatedUser);
      return true;
    }
    
    return false;
  },

  // Logout current session
  logout() {
    const user = loadUser();
    if (user) {
      const updatedUser: AuthUser = {
        ...user,
        loggedIn: false,
        loginTime: 0,
      };
      saveUser(updatedUser);
    }
  },

  // Change password (must be logged in)
  changePassword(currentPassword: string, newPassword: string): boolean {
    if (!api.isLoggedIn()) return false;
    
    const user = loadUser();
    if (!user) return false;
    
    const hashedCurrent = simpleHash(currentPassword);
    if (user.hashedPassword !== hashedCurrent) {
      return false; // Current password is wrong
    }
    
    const updatedUser: AuthUser = {
      ...user,
      hashedPassword: simpleHash(newPassword),
    };
    saveUser(updatedUser);
    return true;
  },

  // Reset to default credentials (for development/recovery)
  resetToDefault() {
    const resetUser: AuthUser = {
      username: DEFAULT_USERNAME,
      hashedPassword: simpleHash(DEFAULT_PASSWORD),
      loggedIn: false,
      loginTime: 0,
    };
    saveUser(resetUser);
  },

  // Clear all auth data
  clearAll() {
    if (!hasWindow()) return;
    window.localStorage.removeItem(KEY);
  },

  // Get session remaining time in milliseconds
  getSessionRemainingTime(): number {
    const user = loadUser();
    if (!user || !user.loggedIn) return 0;
    
    const elapsed = Date.now() - user.loginTime;
    const remaining = SESSION_TIMEOUT - elapsed;
    return Math.max(0, remaining);
  },
};

export const authStore = api;
export default authStore;