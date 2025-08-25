import React, { useEffect, useState } from 'react';
import { MessageCircle, X, CheckCircle } from 'lucide-react';

interface WhatsAppRedirectModalProps {
  isOpen: boolean;
  onClose: () => void;
  whatsappUrl: string;
  reservationNumber: string;
  translations: any;
  currentLang: string;
}

const WhatsAppRedirectModal: React.FC<WhatsAppRedirectModalProps> = ({
  isOpen,
  onClose,
  whatsappUrl,
  reservationNumber,
  translations,
  currentLang
}) => {
  const [countdown, setCountdown] = useState(7); // 7 saniyeye çıkarıldı
  const [hasRedirected, setHasRedirected] = useState(false);
  const t = translations[currentLang];

  // Countdown logic
  useEffect(() => {
    if (isOpen && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, countdown]);

  // Auto redirect when countdown reaches 0
  useEffect(() => {
    if (isOpen && countdown === 0 && !hasRedirected) {
      setHasRedirected(true);
      // WhatsApp'ı aç
      window.open(whatsappUrl, '_blank');
      // Modal'ı 2 saniye sonra kapat (kullanıcı mesajı görsün)
      setTimeout(() => {
        onClose();
      }, 2000);
    }
  }, [isOpen, countdown, hasRedirected, whatsappUrl, onClose]);

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setCountdown(7);
      setHasRedirected(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      
      <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 animate-slideUp">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={24} />
        </button>

        <div className="text-center">
          <div className="mb-6 relative">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto animate-pulse">
              <MessageCircle size={40} className="text-white" fill="white" />
            </div>
            <CheckCircle 
              size={28} 
              className="absolute -bottom-1 -right-1 text-green-500 bg-white rounded-full"
            />
          </div>

          <h3 className="text-2xl font-bold text-gray-800 mb-3">
            {t.whatsappRedirectTitle || 'Rezervasyonunuz Başarıyla Oluşturuldu!'}
          </h3>

          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <p className="text-sm text-gray-600">
              {t.reservationNumber || 'Rezervasyon Numarası'}
            </p>
            <p className="text-lg font-bold text-gray-800">
              {reservationNumber}
            </p>
          </div>

          <p className="text-gray-600 mb-6">
            {t.whatsappRedirectMessage || 
              'Rezervasyon bilgilerinizi WhatsApp üzerinden iletmeniz için yönlendiriliyorsunuz.'}
          </p>

          <div className="mb-6">
            <div className="inline-flex items-center justify-center space-x-2">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-green-600">
                  {countdown > 0 ? countdown : '✓'}
                </span>
              </div>
              <span className="text-gray-600">
                {countdown > 0 
                  ? `${t.whatsappRedirectCountdown || 'saniye içinde yönlendirileceksiniz...'}`
                  : t.redirecting || 'Yönlendiriliyor...'}
              </span>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>{t.whatsappRedirectInstructionTitle || 'Önemli:'}</strong>{' '}
              {t.whatsappRedirectInstruction || 
                'WhatsApp\'a yönlendirildikten sonra lütfen mesajı gönderin. Bu sayede rezervasyonunuz onaylanacaktır.'}
            </p>
          </div>

          <button
            onClick={() => {
              window.open(whatsappUrl, '_blank');
              setHasRedirected(true);
              // 1 saniye sonra modal'ı kapat
              setTimeout(() => {
                onClose();
              }, 1000);
            }}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg transition-all transform hover:scale-105 flex items-center justify-center space-x-2"
          >
            <MessageCircle size={20} />
            <span>{t.whatsappRedirectButton || 'Şimdi WhatsApp\'a Git'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppRedirectModal;