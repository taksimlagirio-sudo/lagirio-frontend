import React from 'react';
import { MapPin, Clock, Users } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { favoritesAPI } from '../../utils/api';

interface Tour {
  id: number;
  _id?: string;
  title: string;
  images: string[];
  meetingPoint: string;
  description: string;
  duration: string;
  maxPeople: number;
  price: number;
  status: string;
}

interface TourCardProps {
  tour: Tour;
  onOpenModal: (tour: Tour, type: string) => void;
  translations: any;
  currentLang: string;
  onShowLoginModal?: () => void;
}

const TourCard: React.FC<TourCardProps> = ({
  tour,
  onOpenModal,
  translations,
  currentLang,
  onShowLoginModal
}) => {
  const t = translations[currentLang];
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && tour._id) {
      checkFavoriteStatus();
    }
  }, [isAuthenticated, tour._id]);

  const checkFavoriteStatus = async () => {
    try {
      const result = await favoritesAPI.checkFavorite('tour', tour._id || tour.id.toString());
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
      const result = await favoritesAPI.toggleTourFavorite(tour._id || tour.id.toString());
      setIsFavorite(result.isFavorite);
    } catch (error) {
      console.error('Favori işlemi hatası:', error);
    } finally {
      setFavoriteLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg sm:shadow-xl overflow-hidden hover:shadow-2xl transition-all cursor-pointer transform hover:-translate-y-1 active:scale-[0.99]">
      <div
        className="h-48 sm:h-56 md:h-64 overflow-hidden relative"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onOpenModal(tour, "tours");
        }}
      >
        <img
          src={tour.images[0]}
          alt={tour.title}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        
        {/* Favori Butonu - Mobile optimize */}
        <div className="absolute top-2 sm:top-3 right-2 sm:right-3 z-10">
          <button
            onClick={handleToggleFavorite}
            disabled={favoriteLoading}
            className="bg-white/90 backdrop-blur-sm p-2 sm:p-2.5 rounded-full shadow-lg hover:bg-white transition-all group touch-target"
          >
            {favoriteLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-2 border-gray-400 border-t-transparent" />
            ) : (
              <Heart
                size={18}
                className={`sm:w-5 sm:h-5 transition-colors ${
                  isFavorite 
                    ? 'fill-red-500 text-red-500' 
                    : 'text-gray-600 group-hover:text-red-500'
                }`}
              />
            )}
          </button>
        </div>
      </div>
      
      <div className="p-4 sm:p-5 md:p-6">
        {/* Başlık - Mobile responsive */}
        <h4 className="text-lg sm:text-xl md:text-2xl font-bold text-[#CD853F] mb-1.5 sm:mb-2 line-clamp-1 sm:line-clamp-none">
          {tour.title}
        </h4>

        {/* Buluşma Noktası - Mobile compact */}
        <div className="flex items-center text-gray-600 mb-2 sm:mb-3 md:mb-4 text-sm sm:text-base">
          <MapPin size={14} className="mr-1.5 sm:mr-2 sm:w-[18px] sm:h-[18px] flex-shrink-0" />
          <span className="truncate">{tour.meetingPoint}</span>
        </div>

        {/* Açıklama - Mobile'da tek satır */}
        <p className="text-gray-700 mb-3 sm:mb-4 md:mb-6 line-clamp-1 sm:line-clamp-2 text-sm sm:text-base">
          {tour.description}
        </p>

        {/* Süre ve Kişi Sayısı - Mobile optimize */}
        <div className="flex items-center justify-between mb-3 sm:mb-4 text-sm sm:text-base">
          <div className="flex items-center text-gray-600">
            <Clock size={16} className="mr-1 sm:mr-1.5 sm:w-5 sm:h-5" />
            <span className="text-xs sm:text-base">{tour.duration}</span>
          </div>

          <div className="flex items-center text-gray-600">
            <Users size={16} className="mr-1 sm:mr-1.5 sm:w-5 sm:h-5" />
            <span className="text-xs sm:text-base">
              <span className="hidden sm:inline">Max </span>
              {tour.maxPeople}
              <span className="sm:hidden"> kişi</span>
            </span>
          </div>
        </div>

        {/* Fiyat - Mobile optimize */}
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className="flex items-baseline">
            <span className="text-2xl sm:text-3xl font-bold text-[#CD853F]">
              ₺{tour.price}
            </span>
            <span className="text-gray-600 ml-1 text-sm sm:text-base">/{t.person}</span>
          </div>
        </div>

        {/* Rezervasyon Butonu - Mobile optimize */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenModal(tour, "tours");
          }}
          className="w-full mt-3 sm:mt-4 md:mt-6 bg-[#CD853F] text-white py-3 sm:py-3.5 md:py-4 rounded-xl sm:rounded-2xl font-semibold hover:bg-[#B8733F] transition-colors text-sm sm:text-base active:scale-[0.98]"
        >
          {t.bookNow}
        </button>
      </div>
    </div>
  );
};

export default TourCard;