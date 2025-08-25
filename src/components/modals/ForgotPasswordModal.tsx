// src/components/modals/ForgotPasswordModal.tsx

import React, { useState } from 'react';
import { X, Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { authAPI } from '../../utils/api';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBackToLogin: () => void;
  translations: any;
  currentLang: string;
}

const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  onBackToLogin,
  translations,
  currentLang
}) => {
  const t = translations[currentLang];
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authAPI.forgotPassword(email);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || t.errorOccurred || 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setEmail('');
    setSuccess(false);
    setError('');
    onBackToLogin();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0a2e23] to-[#1a4a3a] text-white p-6 rounded-t-3xl">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold">
              {t.resetPassword || 'Şifre Sıfırlama'}
            </h3>
            <button
              onClick={onClose}
              className="bg-white/20 hover:bg-white/30 p-2 rounded-full transition-all"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          {!success ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-gray-600 mb-4">
                {t.forgotPasswordDescription || 
                 'E-posta adresinizi girin, size şifre sıfırlama bağlantısı gönderelim.'}
              </p>

              {/* Email Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.email || 'E-posta'}
                </label>
                <div className="relative">
                  <Mail size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0a2e23] focus:border-transparent"
                    placeholder={t.emailPlaceholder || "ornek@email.com"}
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start space-x-2">
                  <AlertCircle size={20} className="mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              {/* Buttons */}
              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full bg-[#0a2e23] text-white py-3 rounded-xl font-semibold hover:bg-[#0f4a3a] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                      {t.sending || 'Gönderiliyor...'}
                    </>
                  ) : (
                    t.sendResetLink || 'Sıfırlama Bağlantısı Gönder'
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleBackToLogin}
                  className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-200 transition-all flex items-center justify-center space-x-2"
                >
                  <ArrowLeft size={20} />
                  <span>{t.backToLogin || 'Giriş Ekranına Dön'}</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center py-8">
              <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
              <h4 className="text-xl font-semibold mb-2">
                {t.emailSent || 'E-posta Gönderildi!'}
              </h4>
              <p className="text-gray-600 mb-6">
                {t.checkEmailMessage || 
                 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi. Lütfen gelen kutunuzu kontrol edin.'}
              </p>
              <button
                onClick={handleBackToLogin}
                className="bg-[#0a2e23] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#0f4a3a] transition-all"
              >
                {t.backToLogin || 'Giriş Ekranına Dön'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordModal;