import React, { useState, useEffect } from 'react';
import { X, Mail, Lock, Users, Shield, ArrowLeft, RefreshCw } from 'lucide-react';
import PhoneInput from '../common/PhoneInput';
import TermsModal from './TermsModal'; // 1. IMPORT EKLE


interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  registerData: {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
    phone: string;
    acceptTerms: boolean;
  };
  setRegisterData: (data: any) => void;
  onRegister: () => void;
  onSwitchToLogin: () => void;
  translations: any;
  currentLang: string;
  errors?: Record<string, string>;
  // YENİ PROPS
  verificationStep?: boolean;
  verificationCode?: string;
  setVerificationCode?: (code: string) => void;
  onVerifyCode?: () => void;
  onResendCode?: () => void;
  isVerifying?: boolean;
  isResending?: boolean;
  tempToken?: string;
}

const RegisterModal: React.FC<RegisterModalProps> = ({
  isOpen,
  onClose,
  registerData,
  setRegisterData,
  onRegister,
  onSwitchToLogin,
  translations,
  currentLang,
  errors = {},
  // YENİ PROPS
  verificationStep = false,
  verificationCode = '',
  setVerificationCode,
  onVerifyCode,
  onResendCode,
  isVerifying = false,
  isResending = false,
}) => {
  const t = translations[currentLang];
  const [resendTimer, setResendTimer] = useState(0);
  const [codeInputs, setCodeInputs] = useState(['', '', '', '', '', '']);
  const [showTermsModal, setShowTermsModal] = useState(false); // 2. STATE EKLE


  // Resend timer
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  // Code input handler
  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) return; // Sadece tek karakter
    
    const newInputs = [...codeInputs];
    newInputs[index] = value;
    setCodeInputs(newInputs);
    
    // Tüm kodu birleştir
    const fullCode = newInputs.join('');
    setVerificationCode?.(fullCode);
    
    // Otomatik ilerleme
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-input-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !codeInputs[index] && index > 0) {
      const prevInput = document.getElementById(`code-input-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    const chars = pastedData.split('');
    const newInputs = [...codeInputs];
    
    chars.forEach((char, index) => {
      if (index < 6) {
        newInputs[index] = char;
      }
    });
    
    setCodeInputs(newInputs);
    setVerificationCode?.(newInputs.join(''));
  };

  const handleResendCode = () => {
    if (resendTimer === 0) {
      onResendCode?.();
      setResendTimer(60); // 60 saniye bekle
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (verificationStep) {
      onVerifyCode?.();
    } else {
      onRegister();
    }
  };

  // VERIFICATION STEP EKRANI
  if (verificationStep) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl w-full max-w-[480px] shadow-2xl animate-fadeIn">
          {/* Modal Header */}
          <div className="bg-gradient-to-r from-[#1B7B58] to-[#134E3A] text-white p-5 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield size={24} />
                <h3 className="text-xl font-bold">
                  {t.emailVerificationTitle || 'Email Doğrulama'}
                </h3>
              </div>
              <button
                onClick={onClose}
                className="bg-white/20 hover:bg-white/30 p-1.5 rounded-full transition-all"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <form onSubmit={handleSubmit} className="p-6">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <Mail className="w-8 h-8 text-green-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-800 mb-2">
                {t.verificationCodeSent || 'Doğrulama Kodu Gönderildi'}
              </h4>
              <p className="text-gray-600 text-sm">
                {t.verificationInstructions || `${registerData.email} adresine 6 haneli doğrulama kodu gönderdik.`}
              </p>
            </div>

            {/* 6 Haneli Kod Girişi */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
                {t.enterVerificationCode || 'Doğrulama Kodunu Girin'}
              </label>
              <div className="flex justify-center gap-2">
                {codeInputs.map((digit, index) => (
                  <input
                    key={index}
                    id={`code-input-${index}`}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={index === 0 ? handlePaste : undefined}
                    className={`w-12 h-12 text-center text-xl font-bold border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B7B58] focus:border-transparent transition-all ${
                      errors.code ? 'border-red-500' : 'border-gray-300'
                    }`}
                    pattern="[0-9]*"
                    inputMode="numeric"
                  />
                ))}
              </div>
              {errors.code && (
                <p className="text-red-500 text-xs mt-2 text-center">{errors.code}</p>
              )}
            </div>

            {/* Timer ve Yeniden Gönder */}
            <div className="text-center mb-6">
              <p className="text-sm text-gray-600 mb-2">
                {t.didntReceiveCode || 'Kodu almadınız mı?'}
              </p>
              <button
                type="button"
                onClick={handleResendCode}
                disabled={resendTimer > 0 || isResending}
                className={`inline-flex items-center gap-2 text-sm font-medium transition-all ${
                  resendTimer > 0 || isResending
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-[#1B7B58] hover:underline cursor-pointer'
                }`}
              >
                {isResending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    {t.resending || 'Gönderiliyor...'}
                  </>
                ) : resendTimer > 0 ? (
                  `${t.resendIn || 'Tekrar gönder'} (${resendTimer}s)`
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    {t.resendCode || 'Kodu Tekrar Gönder'}
                  </>
                )}
              </button>
            </div>

            {/* Uyarı */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6">
              <p className="text-xs text-amber-800">
                <strong>⏰ {t.codeExpiry || 'Önemli:'}</strong> {t.codeExpiryMessage || 'Kod 10 dakika içinde geçerliliğini yitirecektir.'}
              </p>
            </div>

            {/* Genel hata mesajı */}
            {errors.general && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
                {errors.general}
              </div>
            )}

            {/* Doğrula Butonu */}
            <button
              type="submit"
              disabled={verificationCode.length !== 6 || isVerifying}
              className="w-full bg-[#1B7B58] text-white py-3 rounded-lg font-semibold hover:bg-[#134E3A] transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isVerifying ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  {t.verifying || 'Doğrulanıyor...'}
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  {t.verifyEmail || 'Email\'i Doğrula'}
                </>
              )}
            </button>

            {/* Geri Dön */}
            <button
              type="button"
              onClick={() => window.location.reload()} // Sayfayı yenile
              className="w-full mt-3 text-gray-600 text-sm hover:text-gray-800 transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              {t.backToRegister || 'Kayıt Ekranına Dön'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // NORMAL REGISTER FORMU
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-[480px] shadow-2xl animate-fadeIn">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#CD853F] to-[#B8733F] text-white p-5 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold">{t.registerTitle}</h3>
            <button
              onClick={onClose}
              className="bg-white/20 hover:bg-white/30 p-1.5 rounded-full transition-all"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Body - MEVCUT FORM AYNEN KALIYOR */}
        <form onSubmit={handleSubmit} className="p-5 max-h-[calc(100vh-200px)] overflow-y-auto">
          {/* Mevcut form içeriği aynen kalıyor */}
          <div className="space-y-3.5">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.fullName} *
              </label>
              <div className="relative">
                <Users size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={registerData.name}
                  onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                    errors.name 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-[#CD853F] focus:border-transparent'
                  }`}
                  placeholder={t.namePlaceholder || t.fullName || "Ad Soyad"}
                  required
                />
                {errors.name && (
                  <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                )}
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.email} *
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={registerData.email}
                  onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                    errors.email 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-[#CD853F] focus:border-transparent'
                  }`}
                  placeholder={t.emailPlaceholder || t.email || "ornek@email.com"}
                  required
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                )}
              </div>
            </div>

            {/* Phone */}
            <div>
              <PhoneInput
                value={registerData.phone}
                onChange={(value) => setRegisterData({ ...registerData, phone: value })}
                required
                label={`${t.phone} *`}
                error={errors.phone}
                className=""
                placeholder="555 123 4567"
              />
            </div>

            {/* Password ve Confirm Password */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.password} *
                </label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    value={registerData.password}
                    onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                      errors.password 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-[#CD853F] focus:border-transparent'
                    }`}
                    placeholder="••••••••"
                    minLength={6}
                    required
                  />
                  {errors.password && (
                    <p className="text-red-500 text-xs mt-1">{errors.password}</p>
                  )}
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.confirmPassword} *
                </label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    value={registerData.confirmPassword}
                    onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                      errors.confirmPassword 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-[#CD853F] focus:border-transparent'
                    }`}
                    placeholder="••••••••"
                    required
                  />
                  {errors.confirmPassword && (
                    <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Terms */}
            <div>
              <label className={`flex items-start cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors ${
                errors.terms ? 'bg-red-50' : ''
              }`}>
                <input
                  type="checkbox"
                  checked={registerData.acceptTerms}
                  onChange={(e) => setRegisterData({ ...registerData, acceptTerms: e.target.checked })}
                  className="w-4 h-4 text-[#CD853F] rounded focus:ring-[#CD853F] mt-0.5"
                  required
                />
                <span className="ml-2 text-sm text-gray-600">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowTermsModal(true);
                    }}
                    className="text-[#CD853F] hover:underline font-medium"
                  >
                    {t.termsAndConditions || 'Kullanım Koşulları'}
                  </button>
                  {t.acceptTermsPrefix || "'nı kabul ediyorum"}
                </span>
              </label>
              {errors.terms && (
                <p className="text-red-500 text-xs mt-1 ml-6">{errors.terms}</p>
              )}
            </div>

            {/* Genel hata mesajı */}
            {errors.general && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {errors.general}
              </div>
            )}

            {/* Register Button */}
            <button
              type="submit"
              className="w-full bg-[#CD853F] text-white py-2.5 rounded-lg font-semibold hover:bg-[#B8733F] transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!registerData.acceptTerms}
            >
              {t.createAccount}
            </button>

            {/* Login Link */}
            <div className="text-center pt-2 border-t border-gray-200">
              <span className="text-sm text-gray-600">{t.haveAccount} </span>
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="text-[#CD853F] font-semibold hover:underline text-sm"
              >
                {t.loginButton}
              </button>
            </div>
          </div>
        </form>
      </div>

      {showTermsModal && (
        <TermsModal
          isOpen={showTermsModal}
          onClose={() => setShowTermsModal(false)}
          currentLang={currentLang}
          translations={translations}
        />
      )}
    </div>
  );
};

export default RegisterModal;