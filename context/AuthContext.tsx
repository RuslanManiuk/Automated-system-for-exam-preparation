import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
} from "react";
import { api } from "../services/apiClient";

interface User {
  id: string;
  email: string;
  username: string;
  avatar?: string;
  stats: {
    xp: number;
    level: string;
    streak: number;
    lastActiveDate?: string;
    achievements: string[];
    cardsLearned: number;
    testsPassed: number;
  };
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    username: string
  ) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
  updateUserStats: (stats: Partial<User["stats"]>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Перевірка токена при завантаженні додатку
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem("token");
      if (storedToken) {
        try {
          api.setAuthToken(storedToken);
          const userData = await api.getProfile() as { _id?: string; id?: string; email: string; username: string; avatar?: string; stats: User['stats'] };
          setUser({
            id: userData._id || userData.id || '',
            email: userData.email,
            username: userData.username,
            avatar: userData.avatar,
            stats: userData.stats,
          });
          setToken(storedToken);
        } catch (error) {
          console.error("Token validation failed:", error);
          localStorage.removeItem("token");
          api.setAuthToken(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.login(email, password);
      setUser(response.user);
      setToken(response.token);
      localStorage.setItem("token", response.token);
      api.setAuthToken(response.token);
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  const register = async (
    email: string,
    password: string,
    username: string
  ) => {
    try {
      const response = await api.register(email, password, username);
      setUser(response.user);
      setToken(response.token);
      localStorage.setItem("token", response.token);
      api.setAuthToken(response.token);
    } catch (error) {
      console.error("Registration failed:", error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
    api.setAuthToken(null);
  };

  const updateUserStats = (stats: Partial<User["stats"]>) => {
    if (user) {
      setUser({
        ...user,
        stats: {
          ...user.stats,
          ...stats,
        },
      });
    }
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    loading,
    updateUserStats,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
