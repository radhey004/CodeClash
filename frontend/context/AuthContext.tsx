import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider, githubProvider } from '../config/firebase';
import { authAPI } from '../services/api';

interface User {
  _id: string;
  username: string;
  email: string;
  level: number;
  xp: number;
  rankedXP?: number;
  rank?: string;
  league?: string;
  trophies?: number;
  legendTrophies?: number;
  seasonParticipated?: boolean;
  wins?: number;
  losses?: number;
  totalBattles?: number;
  currentStreak?: number;
  longestStreak?: number;
  currentWinStreak?: number;
  longestWinStreak?: number;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  googleLogin: () => Promise<{ isNewUser: boolean }>;
  githubLogin: () => Promise<{ isNewUser: boolean }>;
  logout: () => void;
  updateUser: (userData: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      authAPI.getMe()
        .then(data => setUser(data))
        .catch(() => {
          localStorage.removeItem('token');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const data = await authAPI.login(email, password);
    localStorage.setItem('token', data.token);
    setUser(data);
  };

  const register = async (username: string, email: string, password: string) => {
    const data = await authAPI.register(username, email, password);
    localStorage.setItem('token', data.token);
    setUser(data);
  };

  const handleSocialLogin = async (provider: typeof googleProvider | typeof githubProvider): Promise<{ isNewUser: boolean }> => {
    const result = await signInWithPopup(auth, provider);
    const idToken = await result.user.getIdToken();
    const data = await authAPI.firebaseLogin(idToken);
    localStorage.setItem('token', data.token);
    setUser(data);
    return { isNewUser: data.isNewUser };
  };

  const googleLogin = () => handleSocialLogin(googleProvider);
  const githubLogin = () => handleSocialLogin(githubProvider);

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const updateUser = (userData: User) => {
    setUser(userData);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, googleLogin, githubLogin, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
