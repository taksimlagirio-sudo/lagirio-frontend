import React, { useState, useEffect } from 'react';
import { MapPin, Users, Home, Calendar, Euro, Heart } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { favoritesAPI } from '../../utils/api';

// components/apartments/ApartmentCard.tsx

// TypeScript Interfaces bölümünde güncelleme:
interface Translation {
  title?: string;
  description?: string;
}

interface Apartment {
  id: number;
  _id?: string;
  translations?: {
    tr?: Translation;
    en?: Translation;
    ar?: Translation;
    ru?: Translation;
    [key: string]: Translation | undefined;
  };
  slugs?: {  // ← YENİ EKLE
    tr: string;
    en: string;
    ar: string;
    ru: string;
    [key: string]: string;
  };
  title: string;
  internalCode?: string;
  images: Array<{
    url: string;
    roomType?: string;
  }> | string[];  // ← string[] desteği de ekle
  neighborhood: string;
  district: string;
  city: string;
  description: string;
  capacity: number;
  maxCapacity?: number;
  basePrice: number;
  currency?: string;
  status: string;
  reservations?: any[];
  calculatedTotalPrice?: number;
  avgDailyPrice?: number;
  
  // DetailPage'de kullanılan ek alanlar:
  bedrooms?: number;
  rooms?: number;
  bathrooms?: number;
  size?: number;
  area?: number;
  amenities?: string[];
  checkInTime?: string;
  checkOutTime?: string;
  rules?: string[];
  safetyFeatures?: string[];
  coordinates?: {
    lat: number;
    lng: number;
  };
}

interface SearchParams {
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  childrenAgeGroups?: {  // ← EKLE
    above7: number;
    between2And7: number;
    under2: number;
  };
}

interface ApartmentCardProps {
  apartment: Apartment;
  onOpenModal: (apartment: Apartment, type: string) => void;
  translations: any;
  currentLang: string;
  availability?: {
    available: boolean;
    percentage: number;
    bookedDays?: number;
    totalDays?: number;
  };
  showAvailability?: boolean;
  showInternalCode?: boolean;
  searchParams?: SearchParams;
  onShowLoginModal?: () => void;
}

// Ana Component
const ApartmentCard: React.FC<ApartmentCardProps> = (props) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile ? <MobileApartmentCard {...props} /> : <DesktopApartmentCard {...props} />;
};

// Mobile Card Component
const MobileApartmentCard: React.FC<ApartmentCardProps> = ({
  apartment,
  onOpenModal,
  translations,
  currentLang,
  searchParams,
  onShowLoginModal
}) => {
  const t = translations[currentLang];
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && apartment._id) {
      checkFavoriteStatus();
    }
  }, [isAuthenticated, apartment._id]);

  const checkFavoriteStatus = async () => {
    try {
      const result = await favoritesAPI.checkFavorite('apartment', apartment._id || apartment.id.toString());
      setIsFavorite(result.isFavorite);
    } catch (error) {
      console.error('Favori kontrol hatası:', error);
    }
  };

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!isAuthenticated) {
      onShowLoginModal?.();
      return;
    }
    
    setFavoriteLoading(true);
    try {
      const result = await favoritesAPI.toggleApartmentFavorite(apartment._id || apartment.id.toString());
      setIsFavorite(result.isFavorite);
    } catch (error) {
      console.error('Favori işlemi hatası:', error);
    } finally {
      setFavoriteLoading(false);
    }
  };

  // Güvenli translation erişimi
  const title = apartment.translations?.[currentLang]?.title || 
                apartment.translations?.tr?.title || 
                apartment.title;

  // Gece sayısını hesapla
  const nights = searchParams?.checkIn && searchParams?.checkOut ? 
    Math.ceil((new Date(searchParams.checkOut).getTime() - new Date(searchParams.checkIn).getTime()) / (1000 * 60 * 60 * 24)) : 0;

  return (
    <div 
      onClick={() => {
        // Mobilde her zaman modal aç
        onOpenModal(apartment, "apartments");
      }}
      className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all cursor-pointer active:scale-[0.98]"
    >
      {/* Görsel */}
      <div className="h-32 relative">
        <img
          src={
            typeof apartment.images[0] === 'string'
              ? apartment.images[0]
              : apartment.images[0]?.url || '/placeholder-apartment.jpg'
          }
          alt={title}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        
        {/* Favori Butonu */}
        <button
          onClick={handleToggleFavorite}
          className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm p-1.5 rounded-full shadow"
        >
          {favoriteLoading ? (
            <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-gray-400 border-t-transparent" />
          ) : (
            <Heart
              size={14}
              className={`transition-colors ${
                isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'
              }`}
            />
          )}
        </button>

        {/* Kapasite Badge */}
        <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-0.5 rounded-full text-xs flex items-center gap-1">
          <Users size={12} />
          <span>{apartment.maxCapacity || apartment.capacity}</span>
        </div>
      </div>

      <div className="p-3">
        {/* Başlık */}
        <h4 className="text-sm font-semibold text-[#1a4a3a] mb-1 line-clamp-1">
          {title}
        </h4>

        {/* Konum */}
        <div className="flex items-center text-gray-600 mb-2 text-xs">
          <MapPin size={12} className="mr-1 flex-shrink-0" />
          <span className="truncate">{apartment.district}</span>
        </div>

        {/* Fiyat ve Buton */}
        <div className="flex items-center justify-between">
          {searchParams?.checkIn && searchParams?.checkOut && apartment.calculatedTotalPrice ? (
            <div>
              <div className="text-base font-bold text-[#1a4a3a]">
                €{apartment.calculatedTotalPrice}
              </div>
              <div className="text-[10px] text-gray-500">
                {nights} {t.night || 'gece'}
              </div>
            </div>
          ) : (
            <span className="text-sm font-semibold text-[#1a4a3a]">
              {t.viewDetails || 'İncele'}
            </span>
          )}

          {/* Mini Buton */}
          <div className="bg-[#1a4a3a] text-white p-2 rounded-lg">
            <Calendar size={14} />
          </div>
        </div>
      </div>
    </div>
  );
};

// Desktop Card Component  
const DesktopApartmentCard: React.FC<ApartmentCardProps> = ({
  apartment,
  onOpenModal,
  translations,
  currentLang,
  showInternalCode = false,
  searchParams,
  onShowLoginModal
}) => {
  const t = translations[currentLang];
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && apartment._id) {
      checkFavoriteStatus();
    }
  }, [isAuthenticated, apartment._id]);

  const checkFavoriteStatus = async () => {
    try {
      const result = await favoritesAPI.checkFavorite('apartment', apartment._id || apartment.id.toString());
      setIsFavorite(result.isFavorite);
    } catch (error) {
      console.error('Favori kontrol hatası:', error);
    }
  };

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!isAuthenticated) {
      onShowLoginModal?.();
      return;
    }
    
    setFavoriteLoading(true);
    try {
      const result = await favoritesAPI.toggleApartmentFavorite(apartment._id || apartment.id.toString());
      setIsFavorite(result.isFavorite);
    } catch (error) {
      console.error('Favori işlemi hatası:', error);
    } finally {
      setFavoriteLoading(false);
    }
  };

  // Güvenli translation erişimi
  const title = apartment.translations?.[currentLang]?.title || 
                apartment.translations?.tr?.title || 
                apartment.title;
                
  const description = apartment.translations?.[currentLang]?.description || 
                      apartment.translations?.tr?.description || 
                      apartment.description;

  return (
    <div className="bg-white rounded-3xl shadow-xl overflow-hidden hover:shadow-2xl transition-all cursor-pointer transform hover:-translate-y-1">
      <div
        className="h-64 overflow-hidden relative"
        onClick={(e) => {
          e.stopPropagation();
          onOpenModal(apartment, "apartments");
        }}
      >
        <img
          src={
            typeof apartment.images[0] === 'string' 
              ? apartment.images[0] 
              : apartment.images[0]?.url || '/placeholder-apartment.jpg'
          }
          alt={title}
          className="w-full h-full object-cover"
          loading="lazy"
/>
      
        {/* Daire Kodu */}
        {showInternalCode && apartment.internalCode && (
          <div className="absolute top-4 left-4 bg-black/70 text-white px-2 py-1 rounded text-xs font-semibold flex items-center gap-1">
            <Home size={12} />
            {apartment.internalCode}
          </div>
        )}
        
        {/* Favori Butonu */}
        <div className="absolute top-3 right-3 z-10">
          <button
            onClick={handleToggleFavorite}
            disabled={favoriteLoading}
            className="bg-white/90 backdrop-blur-sm p-2.5 rounded-full shadow-lg hover:bg-white transition-all group"
          >
            {favoriteLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-400 border-t-transparent" />
            ) : (
              <Heart
                size={20}
                className={`transition-colors ${
                  isFavorite 
                    ? 'fill-red-500 text-red-500' 
                    : 'text-gray-600 group-hover:text-red-500'
                }`}
              />
            )}
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* Başlık */}
        <h4 className="text-2xl font-bold text-[#1a4a3a] mb-2">
          {title}
        </h4>

        {/* Konum */}
        <div className="flex items-center text-gray-600 mb-4">
          <MapPin size={18} className="mr-2 flex-shrink-0" />
          <span>{apartment.neighborhood}, {apartment.district}, {apartment.city}</span>
        </div>

        {/* Açıklama */}
        <p className="text-gray-700 mb-6 line-clamp-2">
          {description}
        </p>

        {/* Kapasite ve Fiyat */}
        <div className="flex items-end justify-between mb-4">
          <div className="flex items-center text-gray-600">
            <Users size={20} className="mr-1" />
            <span>{apartment.maxCapacity || apartment.capacity}</span>
          </div>

          {/* Fiyat Gösterimi */}
          <div className="text-right">
            {searchParams?.checkIn && searchParams?.checkOut && apartment.calculatedTotalPrice ? (
              <div>
                <div className="flex items-center justify-end">
                  <Euro size={20} className="text-[#1a4a3a] mr-1" />
                  <span className="text-2xl font-bold text-[#1a4a3a]">
                    {apartment.calculatedTotalPrice}
                  </span>
                </div>
                
                <div className="text-sm text-gray-600">
                  {t.total || 'toplam'}
                </div>
                
                <div className="text-xs text-gray-500">
                  €{apartment.avgDailyPrice || apartment.basePrice}/{t.perNight || 'gece'}
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="text-lg font-semibold text-[#1a4a3a] mb-1">
                  {t.bookNowShort || 'Rezerve Et'}
                </div>
                <div className="text-xs text-gray-600">
                  {t.quickBookingNote || 'Hızlı rezervasyon'}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Rezervasyon Butonu */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            // YENİ - Slug varsa direkt detay sayfasına git
            if (apartment.slugs?.[currentLang]) {
              const langPrefix = currentLang === 'tr' ? '' : `/${currentLang}`;
              window.location.href = `${langPrefix}/apartment/${apartment.slugs[currentLang]}`;
            } else {
              // Fallback - eski modal sistemi
              onOpenModal(apartment, "apartments");
            }
          }}
          className="w-full bg-[#1a4a3a] text-white py-4 rounded-2xl font-semibold hover:bg-[#0f3426] transition-colors flex items-center justify-center gap-2"
        >
          <Calendar size={20} />
          {searchParams?.checkIn && searchParams?.checkOut ? 
            t.bookNow || 'Rezervasyon Yap' : 
            t.viewDetails || 'Detayları Gör'
          }
        </button>
      </div>
    </div>
  );
};

export default ApartmentCard;