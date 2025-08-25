import React, { useState, useEffect } from 'react';
import { X, Mail, Shield, ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';

interface EmailVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  onVerifyCode: (code: string) => void;
  onResendCode: () => void;
  onBack?: () => void;
  isVerifying?: boolean;
  isResending?: boolean;
  translations: any;
  currentLang: string;
  modalType?: 'register' | 'guest'; // Modal tipi için
  guestName?: string; // Guest rezervasyon için
}

const EmailVerificationModal: React.FC<EmailVerificationModalProps> = ({
  isOpen,
  onClose,
  email,
  onVerifyCode,
  onResendCode,
  onBack,
  isVerifying = false,
  isResending = false,
  translations,
  currentLang,
  modalType = 'register',
  guestName
}) => {
  const t = translations[currentLang];
  const [codeInputs, setCodeInputs] = useState(['', '', '', '', '', '']);
  const [resendTimer, setResendTimer] = useState(60);
  const [attemptCount, setAttemptCount] = useState(0);
  const [error, setError] = useState('');

  // Resend timer
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  // Reset on open/close
  useEffect(() => {
    if (isOpen) {
      setCodeInputs(['', '', '', '', '', '']);
      setError('');
      setAttemptCount(0);
    }
  }, [isOpen]);

  // Code input handler
  const handleCodeChange = (index: number, value: string) => {
    // Sadece rakam kabul et
    if (value && !/^\d$/.test(value)) return;
    
    const newInputs = [...codeInputs];
    newInputs[index] = value;
    setCodeInputs(newInputs);
    setError(''); // Hata mesajını temizle
    
    // Otomatik ilerleme
    if (value && index < 5) {
      const nextInput = document.getElementById(`verification-input-${index + 1}`);
      nextInput?.focus();
    }
    
    // Tüm kutular doluysa otomatik gönder
    const fullCode = newInputs.join('');
    if (fullCode.length === 6) {
      handleVerify(fullCode);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !codeInputs[index] && index > 0) {
      const prevInput = document.getElementById(`verification-input-${index - 1}`);
      prevInput?.focus();
      
      // Önceki inputu da temizle
      const newInputs = [...codeInputs];
      newInputs[index - 1] = '';
      setCodeInputs(newInputs);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    
    if (pastedData.length === 6) {
      const chars = pastedData.split('');
      setCodeInputs(chars);
      
      // Son input'a focus
      const lastInput = document.getElementById('verification-input-5');
      lastInput?.focus();
      
      // Otomatik gönder
      handleVerify(pastedData);
    }
  };

  const handleVerify = (code?: string) => {
    const verificationCode = code || codeInputs.join('');
    
    if (verificationCode.length !== 6) {
      setError(t.enterSixDigitCode || 'Please enter 6-digit code');
      return;
    }
    
    setAttemptCount(prev => prev + 1);
    onVerifyCode(verificationCode);
  };

  const handleResendCode = () => {
    if (resendTimer === 0) {
      onResendCode();
      setResendTimer(60);
      setCodeInputs(['', '', '', '', '', '']);
      setError('');
      setAttemptCount(0);
    }
  };

  if (!isOpen) return null;

  // Modal renk teması
  const colorTheme = modalType === 'guest' 
    ? {
        gradient: 'from-[#ff9800] to-[#f57c00]',
        iconBg: 'bg-orange-100',
        iconColor: 'text-orange-600',
        buttonBg: 'from-orange-600 to-orange-700',
        focusBorder: 'focus:border-orange-500',
        linkColor: 'text-orange-600'
      }
    : {
        gradient: 'from-[#1B7B58] to-[#134E3A]',
        iconBg: 'bg-green-100',
        iconColor: 'text-green-600',
        buttonBg: 'from-green-600 to-green-700',
        focusBorder: 'focus:border-green-500',
        linkColor: 'text-green-600'
      };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-[480px] shadow-2xl animate-fadeIn">
        {/* Modal Header */}
        <div className={`bg-gradient-to-r ${colorTheme.gradient} text-white p-5 rounded-t-2xl`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield size={24} />
              <h3 className="text-xl font-bold">
                {modalType === 'guest' 
                  ? t.guestEmailVerificationTitle || t.emailVerificationTitle
                  : t.emailVerificationTitle}
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
        <div className="p-6">
          {/* Üst Bilgi */}
          <div className="text-center mb-6">
            <div className={`inline-flex items-center justify-center w-16 h-16 ${colorTheme.iconBg} rounded-full mb-4`}>
              <Mail className={`w-8 h-8 ${colorTheme.iconColor}`} />
            </div>
            <h4 className="text-lg font-semibold text-gray-800 mb-2">
              {t.verificationCodeSent}
            </h4>
            <p className="text-gray-600 text-sm">
              {modalType === 'guest' && guestName
                ? t.guestVerificationInstructions?.replace('{email}', email).replace('{name}', guestName) ||
                  `${guestName}, ${email} ${t.verificationInstructions}`
                : `${email} ${t.verificationInstructions}`}
            </p>
          </div>

          {/* 6 Haneli Kod Girişi */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
              {t.enterVerificationCode}
            </label>
            <div className="flex justify-center gap-2">
              {codeInputs.map((digit, index) => (
                <input
                  key={index}
                  id={`verification-input-${index}`}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  className={`w-12 h-12 text-center text-lg font-semibold border-2 rounded-lg
                    ${error ? 'border-red-500 bg-red-50' : 'border-gray-300'}
                    ${colorTheme.focusBorder} focus:ring-2 focus:outline-none transition-all`}
                  autoComplete="off"
                />
              ))}
            </div>
            
            {/* Hata Mesajı */}
            {error && (
              <p className="text-red-500 text-xs text-center mt-2 flex items-center justify-center gap-1">
                <AlertCircle size={14} />
                {error}
              </p>
            )}
          </div>

          {/* Uyarı Kutusu */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <span className="text-amber-700 font-semibold">{t.codeExpiry}</span>
                <span className="text-amber-600 ml-1">{t.codeExpiryMessage}</span>
              </div>
            </div>
          </div>

          {/* Tekrar Gönder */}
          <div className="text-center mb-4">
            <span className="text-gray-600 text-sm">{t.didntReceiveCode}</span>
            {resendTimer > 0 ? (
              <div className="text-gray-500 text-sm mt-1">
                {t.resendIn} <span className="font-semibold">{resendTimer}</span> {t.secondsRemaining}
              </div>
            ) : (
              <button
                onClick={handleResendCode}
                disabled={isResending}
                className={`${colorTheme.linkColor} hover:underline font-semibold text-sm mt-1 inline-flex items-center gap-1`}
              >
                {isResending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    {t.resending}
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    {t.resendCode}
                  </>
                )}
              </button>
            )}
          </div>

          {/* Spam Folder Hatırlatması */}
          <p className="text-xs text-gray-500 text-center mb-6">
            💡 {t.checkSpamFolder}
          </p>

          {/* Butonlar */}
          <div className="space-y-3">
            {/* Doğrula Butonu */}
            <button
              onClick={() => handleVerify()}
              disabled={isVerifying || codeInputs.join('').length !== 6}
              className={`w-full bg-gradient-to-r ${colorTheme.buttonBg} text-white py-3 rounded-lg 
                font-semibold hover:shadow-lg transition-all transform hover:scale-[1.02] 
                active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed
                flex items-center justify-center gap-2`}
            >
              {isVerifying ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  {t.verifying}
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  {t.verifyEmail}
                </>
              )}
            </button>

            {/* Geri Dön Butonu (opsiyonel) */}
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="w-full text-gray-600 text-sm hover:text-gray-800 transition-colors 
                  flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                {modalType === 'guest' 
                  ? t.backToReservation || t.backToRegister
                  : t.backToRegister}
              </button>
            )}
          </div>

          {/* Deneme Sayısı Uyarısı */}
          {attemptCount >= 3 && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm text-center">
                {t.tooManyAttemptsWarning || `${attemptCount} failed attempts. Please request a new code if needed.`}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationModal;