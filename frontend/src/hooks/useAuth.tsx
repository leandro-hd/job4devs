import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import * as authService from '../services/auth.service';
import type { AuthUser } from '../services/auth.service';
import { setAuthToken } from '../services/api';

interface AuthContextValue {
  user: AuthUser | null;
  initializing: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    authService
      .refresh()
      .then(({ token, user: restored }) => {
        setAuthToken(token);
        setUser(restored);
      })
      .catch(() => {
        // No valid refresh token — user stays logged out
      })
      .finally(() => setInitializing(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await authService.login({ email, password });
    setAuthToken(response.token);
    setUser(response.user);
  }, []);

  const register = useCallback(async (email: string, password: string, name: string) => {
    // Intentionally does not call setAuthToken/setUser — registration only
    // creates the account. The user logs in explicitly afterwards.
    await authService.register({ email, password, name });
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // ignore — clear local state regardless
    }
    setAuthToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const updated = await authService.me();
    setUser(updated);
  }, []);

  return (
    <AuthContext.Provider value={{ user, initializing, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
