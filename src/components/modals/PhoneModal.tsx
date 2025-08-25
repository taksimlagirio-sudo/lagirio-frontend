import React, { useState } from 'react';
import { Check, AlertCircle } from 'lucide-react';
import PhoneInput from '../common/PhoneInput';

interface PhoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (phone: string) => Promise<void>;
  translations: any;
  currentLang: string;
}

const PhoneModal: React.FC<PhoneModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  translations,
  currentLang
}) => {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const t = translations[currentLang];

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!phone || phone.length < 10) {
      setError(t.invalidPhone || 'Geçerli bir telefon numarası giriniz');
      return;
    }
    
    setLoading(true);

    try {
      await onSubmit(phone);
      // Başarılı - modal otomatik kapanacak
    } catch (err: any) {
      setError(err.message || t.phoneUpdateFailed || 'Telefon eklenemedi');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0a2e23] to-[#1a4a3a] text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold">
              {t.completeProfile || 'Profilinizi Tamamlayın'}
            </h3>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Info Message */}
          <div className="mb-6">
            <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <AlertCircle className="text-blue-500 mt-0.5" size={20} />
              <div>
                <p className="text-sm text-blue-800">
                  {t.phoneRequiredForReservation || 
                   'Rezervasyon yapabilmek için telefon numaranızı eklemeniz gerekmektedir.'}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  {t.phoneUsageInfo || 
                   'Telefon numaranız sadece rezervasyon bildirimleri için kullanılacaktır.'}
                </p>
              </div>
            </div>
          </div>

          {/* Phone Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.yourPhone || 'Telefon Numarası'} *
            </label>
            <PhoneInput
              value={phone}
              onChange={setPhone}
              error={error}
              placeholder="5XX XXX XX XX"
            />
            {error && (
              <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                <AlertCircle size={14} />
                {error}
              </p>
            )}
          </div>

          {/* Benefits */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm font-medium text-gray-700 mb-2">
              {t.whyPhoneNeeded || 'Neden telefon numarası gerekli?'}
            </p>
            <ul className="text-xs text-gray-600 space-y-1">
              <li className="flex items-start gap-1">
                <span className="text-green-500 mt-0.5">✓</span>
                {t.phoneReason1 || 'Rezervasyon onaylarını anında alın'}
              </li>
              <li className="flex items-start gap-1">
                <span className="text-green-500 mt-0.5">✓</span>
                {t.phoneReason2 || 'Check-in hatırlatmaları alın'}
              </li>
              <li className="flex items-start gap-1">
                <span className="text-green-500 mt-0.5">✓</span>
                {t.phoneReason3 || 'Acil durumlarda size ulaşabilelim'}
              </li>
            </ul>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={!phone || loading}
              className="flex-1 bg-[#0a2e23] text-white py-3 rounded-xl font-semibold hover:bg-[#0f4a3a] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <Check size={20} />
                  {t.save || 'Kaydet ve Devam Et'}
                </>
              )}
            </button>
            
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-3 border-2 border-gray-300 rounded-xl font-semibold hover:bg-gray-50 transition-all disabled:opacity-50"
            >
              {t.later || 'Daha Sonra'}
            </button>
          </div>

          {/* Skip Notice */}
          <p className="text-xs text-gray-500 text-center mt-4">
            {t.canAddLater || 'Telefon numaranızı daha sonra profil ayarlarından ekleyebilirsiniz.'}
          </p>
        </form>
      </div>
    </div>
  );
};

export default PhoneModal;