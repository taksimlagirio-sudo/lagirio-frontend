import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI } from '../../utils/api';

// Types
interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  profilePhoto?: string;
  memberLevel?: string;
  createdAt?: string;
  stats?: {
    totalReservations: number;
    completedReservations: number;
    totalSpent: number;
  };
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (userData: RegisterData) => Promise<RegisterResponse>; // ⚠️ DEĞİŞTİ
  logout: () => void;
  updateProfile: (data: { name?: string; phone?: string }) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  // ⚠️ YENİ - Email doğrulama fonksiyonları
  verifyEmail: (code: string, tempToken: string) => Promise<void>;
  resendVerificationCode: (tempToken: string) => Promise<void>;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  preferredLanguage?: string; // ⚠️ YENİ
}

// ⚠️ YENİ - Register response tipi
interface RegisterResponse {
  message: string;
  requiresVerification: boolean;
  tempToken?: string;
  user?: {
    name: string;
    email: string;
    emailVerified: boolean;
  };
}

// Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider Props
interface AuthProviderProps {
  children: ReactNode;
}

// Provider Component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Token'ı kontrol et ve kullanıcıyı yükle
  useEffect(() => {
    checkAuth();
  }, []);

  // Token geçerliliğini kontrol et
  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setIsLoading(false);
        return;
      }

      // Token'ı doğrula ve kullanıcı bilgilerini al
      const response = await authAPI.verifyToken();
      
      if (response.valid && response.user) {
        setUser(response.user);
        setIsAuthenticated(true);
      } else {
        // Token geçersizse temizle
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    } catch (error) {
      console.error('Auth check error:', error);
      // Hata durumunda token'ları temizle
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } finally {
      setIsLoading(false);
    }
  };

  // Giriş yap
  const login = async (email: string, password: string, rememberMe: boolean = false) => {
    try {
      const response = await authAPI.login({ email, password });
      
      // Token ve kullanıcı bilgilerini kaydet
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      // Remember me özelliği için
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
      } else {
        sessionStorage.setItem('token', response.token);
      }
      
      setUser(response.user);
      setIsAuthenticated(true);
      
      // Kullanıcı bilgilerini güncelle
      await refreshUser();
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Giriş başarısız');
    }
  };

  // ⚠️ GÜNCELLEME - Kayıt ol
  const register = async (userData: RegisterData): Promise<RegisterResponse> => {
    try {
      const response = await authAPI.register(userData);
      
      // ⚠️ YENİ - Artık direkt login yapmıyoruz
      // Email doğrulama gerekiyor
      if (response.requiresVerification) {
        return {
          message: response.message,
          requiresVerification: true,
          tempToken: response.tempToken,
          user: response.user
        };
      }
      
      // Eğer bir nedenden dolayı doğrulama gerekmiyorsa (bu olmamalı yeni sistemde)
      throw new Error('Unexpected response');
      
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Kayıt başarısız');
    }
  };

  // ⚠️ YENİ - Email doğrulama
  const verifyEmail = async (code: string, tempToken: string) => {
    try {
      const response = await authAPI.verifyEmail({ code, tempToken });
      
      // Başarılı doğrulama - şimdi gerçek token alıyoruz
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      setUser(response.user);
      setIsAuthenticated(true);
      
      // Kullanıcı bilgilerini güncelle
      await refreshUser();
      
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Doğrulama başarısız');
    }
  };

  // ⚠️ YENİ - Doğrulama kodunu yeniden gönder
  const resendVerificationCode = async (tempToken: string) => {
    try {
      const response = await authAPI.resendVerificationCode({ tempToken });
      return response;
    } catch (error: any) {
      // Rate limit veya diğer hatalar için error'u yukarı fırlat
      throw error;
    }
  };

  // Çıkış yap
  const logout = async () => {
    try {
      // Backend'e logout isteği gönder (opsiyonel)
      await authAPI.logout().catch(() => {});
      
      // Local storage'ı temizle
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('rememberMe');
      sessionStorage.removeItem('token');
      
      // State'i sıfırla
      setUser(null);
      setIsAuthenticated(false);
      
      // Ana sayfaya yönlendir
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Profil güncelle
  const updateProfile = async (data: { name?: string; phone?: string }) => {
    try {
      const response = await authAPI.updateProfile(data);
      
      // Kullanıcı bilgilerini güncelle
      const updatedUser = { ...user, ...response.user };
      setUser(updatedUser as User);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Profil güncellenemedi');
    }
  };

  // Şifre değiştir
  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      await authAPI.changePassword({ currentPassword, newPassword });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Şifre değiştirilemedi');
    }
  };

  // Kullanıcı bilgilerini yenile
  const refreshUser = async () => {
    try {
      const response = await authAPI.getMe();
      setUser(response.user);
      localStorage.setItem('user', JSON.stringify(response.user));
    } catch (error) {
      console.error('Refresh user error:', error);
    }
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    refreshUser,
    verifyEmail,  // ⚠️ YENİ
    resendVerificationCode  // ⚠️ YENİ
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

// HOC for protected components
export const withAuth = <P extends object>(Component: React.ComponentType<P>) => {
  return (props: P) => {
    const { isAuthenticated, isLoading } = useAuth();
    
    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
        </div>
      );
    }
    
    if (!isAuthenticated) {
      window.location.href = '/';
      return null;
    }
    
    return <Component {...props} />;
  };
};