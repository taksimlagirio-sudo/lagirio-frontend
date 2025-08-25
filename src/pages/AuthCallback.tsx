// pages/AuthCallback.tsx

import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authAPI } from '../utils/api';
import PhoneModal from '../components/modals/PhoneModal';
import { translations } from '../utils/translations';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // currentLang type güvenli şekilde al - App.tsx ile aynı key kullan
  const currentLang = (localStorage.getItem('preferredLanguage') || 'tr') as 'tr' | 'en' | 'ar' | 'ru';
  const t = translations[currentLang];

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get('token');
      const needsPhone = searchParams.get('needsPhone') === 'true';
      const errorParam = searchParams.get('error');

      if (errorParam) {
        setError(t.loginFailed || 'Giriş başarısız');
        setTimeout(() => navigate('/'), 3000);
        return;
      }

      if (token) {
        // Token'ı kaydet
        localStorage.setItem('token', token);

        try {
          // Kullanıcı bilgilerini al - response direkt data döndürüyor
          const response = await authAPI.getMe();
          localStorage.setItem('user', JSON.stringify(response.user));

          // Telefon gerekiyor mu?
          if (needsPhone) {
            setShowPhoneModal(true);
            setLoading(false);
          } else {
            // Ana sayfaya yönlendir
            window.location.href = '/';
          }
        } catch (err) {
          console.error('Failed to get user info:', err);
          setError(t.loginFailed || 'Giriş başarısız');
          setTimeout(() => navigate('/'), 3000);
        }
      } else {
        setError(t.invalidToken || 'Geçersiz token');
        setTimeout(() => navigate('/'), 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate, t.loginFailed, t.invalidToken]);

const handlePhoneSubmit = async (phone: string) => {
  try {
    console.log('Gönderilen telefon:', phone); // Debug için
    
    // PhoneInput zaten +90 5388167159 formatında gönderiyor
    await authAPI.updatePhone({ phone });
    
    // Kullanıcı bilgilerini güncelle
    const response = await authAPI.getMe();
    localStorage.setItem('user', JSON.stringify(response.user));
    
    // Ana sayfaya yönlendir
    window.location.href = '/';
  } catch (error: any) {
    console.error('Phone update error:', error);
    throw new Error(error.message || 'Telefon eklenemedi');
  }
};

  const handlePhoneSkip = () => {
    // Daha sonra eklemek istiyor
    window.location.href = '/';
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {t.errorOccurred || 'Bir hata oluştu'}
          </h2>
          <p className="text-gray-600">{error}</p>
          <p className="text-sm text-gray-500 mt-4">
            {t.redirecting || 'Yönlendiriliyorsunuz...'}
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#0a2e23] border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">
            {t.loggingIn || 'Giriş yapılıyor...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <PhoneModal
        isOpen={showPhoneModal}
        onClose={handlePhoneSkip}
        onSubmit={handlePhoneSubmit}
        translations={translations}
        currentLang={currentLang}
      />
    </>
  );
};

export default AuthCallback;