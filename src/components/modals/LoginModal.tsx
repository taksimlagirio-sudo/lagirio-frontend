import React from 'react';
import { X, Mail, Lock } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  loginData: {
    email: string;
    password: string;
    rememberMe: boolean;
  };
  setLoginData: (data: any) => void;
  onLogin: () => void;
  onSwitchToRegister: () => void;
  translations: any;
  currentLang: string;
  onSwitchToForgotPassword: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  loginData,
  setLoginData,
  onLogin,
  onSwitchToRegister,
  translations,
  currentLang,
  onSwitchToForgotPassword,
}) => {
  const t = translations[currentLang];
  
  // Google Login Handler EKLE
  const handleGoogleLogin = () => {
    // Backend Google OAuth endpoint'ine yönlendir
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5002';
    window.location.href = `${apiUrl}/auth/google`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#0a2e23] to-[#1a4a3a] text-white p-6 rounded-t-3xl">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold">{t.loginTitle}</h3>
            <button
              onClick={onClose}
              className="bg-white/20 hover:bg-white/30 p-2 rounded-full transition-all"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          <div className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.email}
              </label>
              <div className="relative">
                <Mail
                  size={20}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="email"
                  value={loginData.email}
                  onChange={(e) =>
                    setLoginData({ ...loginData, email: e.target.value })
                  }
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0a2e23] focus:border-transparent"
                  placeholder={t.emailPlaceholder || t.email || "ornek@email.com"}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.password}
              </label>
              <div className="relative">
                <Lock
                  size={20}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="password"
                  value={loginData.password}
                  onChange={(e) =>
                    setLoginData({ ...loginData, password: e.target.value })
                  }
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0a2e23] focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Remember Me and Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={loginData.rememberMe}
                  onChange={(e) =>
                    setLoginData({
                      ...loginData,
                      rememberMe: e.target.checked,
                    })
                  }
                  className="w-4 h-4 text-[#0a2e23] rounded focus:ring-[#0a2e23]"
                />
                <span className="ml-2 text-sm text-gray-600">
                  {t.rememberMe}
                </span>
              </label>
              <button 
                type="button" // ÖNEMLİ: type="button" ekleyin
                onClick={onSwitchToForgotPassword} // YENİ
                className="text-sm text-[#0a2e23] hover:underline"
              >
                {t.forgotPassword}
              </button>
            </div>

            {/* Login Button */}
            <button
              onClick={onLogin}
              className="w-full bg-[#0a2e23] text-white py-3 rounded-xl font-semibold hover:bg-[#0f4a3a] transition-all"
            >
              {t.loginButton}
            </button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  {t.orLoginWith || 'veya'}
                </span>
              </div>
            </div>

            {/* Google Login - ONCLICK EKLE */}
            <button 
              onClick={handleGoogleLogin}
              className="w-full bg-white border border-gray-300 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-50 transition-all flex items-center justify-center space-x-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>{t.continueWithGoogle || 'Google ile devam et'}</span>
            </button>

            {/* Register Link */}
            <div className="text-center pt-4">
              <span className="text-gray-600">{t.noAccount} </span>
              <button
                onClick={onSwitchToRegister}
                className="text-[#0a2e23] font-semibold hover:underline"
              >
                {t.register}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;