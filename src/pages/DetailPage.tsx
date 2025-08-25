import React, { useState, useEffect } from 'react';
import {
  MapPin, ChevronLeft, ChevronRight, Camera, Heart, Share2,
  Users, Bed, Bath, Home, Sparkles, Shield, Info,
  Clock, Check, X, Grid3X3,
  Building, Sofa, ChefHat, TreePine,
  Calendar, Copy, MessageCircle,
  Award, Mail, Maximize2, CircleSlash, Dog, AlertCircle, Heart as HeartIcon 
} from 'lucide-react';
import Header from '../components/common/Header';
import AvailabilityCalendar from '../components/apartments/AvailabilityCalendar';
import { amenityIcons } from '../utils/constants';
import { pricingAPI } from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/contexts/AuthContext';
import { favoritesAPI } from '../utils/api';
import { translateAmenity } from '../utils/amenityTranslations';
import { getRuleIconComponent, getSafetyIconComponent, translateRule, translateSafety } from '../utils/rulesTranslations';


interface DetailPageProps {
  selectedItem: any;
  selectedItemType: 'apartments' | 'tours' | null;
  currentLang: string;
  setCurrentLang: (lang: string) => void;
  translations: any;
  setShowLoginModal: (show: boolean) => void;
  setCurrentView: (view: string) => void;
  searchParams?: {
    checkIn: string;
    checkOut: string;
    adults: number;
    children: number;
  };
}

// Oda tipleri ve ikonları - ÇEVİRİ DESTEĞİ İÇİN FONKSIYON
const getRoomTypeConfig = (t: any) => ({
  exterior: { label: t.roomTypes?.exterior || 'Dış Görünüm', icon: Building },
  living: { label: t.roomTypes?.living || 'Salon', icon: Sofa },
  bedroom1: { label: t.roomTypes?.bedroom1 || 'Yatak Odası 1', icon: Bed },
  bedroom2: { label: t.roomTypes?.bedroom2 || 'Yatak Odası 2', icon: Bed },
  bedroom3: { label: t.roomTypes?.bedroom3 || 'Yatak Odası 3', icon: Bed },
  kitchen: { label: t.roomTypes?.kitchen || 'Mutfak', icon: ChefHat },
  bathroom1: { label: t.roomTypes?.bathroom1 || 'Banyo 1', icon: Bath },
  bathroom2: { label: t.roomTypes?.bathroom2 || 'Banyo 2', icon: Bath },
  balcony: { label: t.roomTypes?.balcony || 'Balkon/Teras', icon: TreePine },
  other: { label: t.roomTypes?.other || 'Diğer', icon: Camera }
});


const DetailPage: React.FC<DetailPageProps> = ({
  selectedItem,
  selectedItemType,
  currentLang,
  setCurrentLang,
  translations,
  setShowLoginModal,
  setCurrentView,
  searchParams
}) => {
  const t = translations[currentLang];
  const roomTypeConfig = getRoomTypeConfig(t);
  
  const isApartment = selectedItemType === 'apartments';
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [detailMonth, setDetailMonth] = useState(new Date());
  const [showAllPhotos, setShowAllPhotos] = useState(false);
  const [showAllAmenitiesModal, setShowAllAmenitiesModal] = useState(false);
  const [selectedRoomType, setSelectedRoomType] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const { isAuthenticated } = useAuth();
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [calculatedPrice, setCalculatedPrice] = useState<any>(null);
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [showCopyToast, setShowCopyToast] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [fullscreenImageIndex, setFullscreenImageIndex] = useState<number | null>(null);
  
  const apartmentId = selectedItem?._id || selectedItem?.id?.toString() || '';
  const basePrice = selectedItem?.basePrice || selectedItem?.price || 100;
  
  const navigate = useNavigate();
  
  // NORMALIZED IMAGES VE İLGİLİ FONKSİYONLAR - USEEFFECT'LERDEN ÖNCE TANIMLA
  const normalizeImages = () => {
    if (!selectedItem?.images) return [];
    
    return selectedItem.images.map((img: any, index: number) => {
      if (typeof img === 'string') {
        return {
          url: img,
          roomType: index === 0 ? 'exterior' : 'other'
        };
      }
      return img;
    });
  };
  
  const normalizedImages = normalizeImages();
  const hasRoomTypes = isApartment && selectedItem?.images?.some((img: any) => typeof img === 'object' && img.roomType);
  
  const getFilteredImages = () => {
    if (!hasRoomTypes || !selectedRoomType) return normalizedImages;
    return normalizedImages.filter((img: any) => img.roomType === selectedRoomType);
  };
  
  const filteredImages = getFilteredImages();
  const displayImages = filteredImages.length > 0 ? filteredImages : normalizedImages;
  
  const groupedImages = normalizedImages.reduce((acc: any, img: any) => {
    const roomType = img.roomType || 'other';
    if (!acc[roomType]) acc[roomType] = [];
    acc[roomType].push(img);
    return acc;
  }, {});
  
  // ŞİMDİ USEEFFECT'LER GELEBİLİR
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (isApartment && apartmentId) {
      loadTodayPrice();
    }
  }, [apartmentId, isApartment]);

  // Keyboard navigation for fullscreen gallery - ŞİMDİ ÇALIŞIR
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (fullscreenImageIndex === null) return;
      
      if (e.key === 'ArrowLeft' && fullscreenImageIndex > 0) {
        setFullscreenImageIndex(fullscreenImageIndex - 1);
      } else if (e.key === 'ArrowRight' && fullscreenImageIndex < normalizedImages.length - 1) {
        setFullscreenImageIndex(fullscreenImageIndex + 1);
      } else if (e.key === 'Escape') {
        setFullscreenImageIndex(null);
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [fullscreenImageIndex, normalizedImages.length]);

  useEffect(() => {
    if (isAuthenticated && selectedItem?._id) {
      checkFavoriteStatus();
    }
  }, [isAuthenticated, selectedItem?._id, selectedItemType]);

  useEffect(() => {
    if (isApartment && apartmentId && searchParams?.checkIn && searchParams?.checkOut) {
      calculateTotalPrice();
    }
  }, [apartmentId, searchParams?.checkIn, searchParams?.checkOut, searchParams?.adults, searchParams?.children, isApartment]);
  
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // FONKSİYONLAR
  const loadTodayPrice = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const data = await pricingAPI.getSingleDate(apartmentId, today);
      (data.price || basePrice);
    } catch (error) {
      console.error('Fiyat yüklenemedi:', error);
      (basePrice);
    }
  };

  const checkFavoriteStatus = async () => {
    try {
      const type = isApartment ? 'apartment' : 'tour';
      const result = await favoritesAPI.checkFavorite(type, selectedItem._id || selectedItem.id?.toString());
      setIsLiked(result.isFavorite);
    } catch (error) {
      console.error('Favori kontrol hatası:', error);
    }
  };

  // Fullscreen gallery swipe handlers
  const handleFullscreenTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleFullscreenTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleFullscreenTouchEnd = () => {
    if (!touchStart || !touchEnd || fullscreenImageIndex === null) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;
    
    if (isLeftSwipe && fullscreenImageIndex < normalizedImages.length - 1) {
      setFullscreenImageIndex(fullscreenImageIndex + 1);
    }
    if (isRightSwipe && fullscreenImageIndex > 0) {
      setFullscreenImageIndex(fullscreenImageIndex - 1);
    }
  };

  const handleToggleFavorite = async () => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    
    setFavoriteLoading(true);
    try {
      const id = selectedItem._id || selectedItem.id?.toString();
      const result = isApartment 
        ? await favoritesAPI.toggleApartmentFavorite(id)
        : await favoritesAPI.toggleTourFavorite(id);
      
      setIsLiked(result.isFavorite);
    } catch (error) {
      console.error('Favori işlemi hatası:', error);
    } finally {
      setFavoriteLoading(false);
    }
  };

  const calculateTotalPrice = async () => {
    if (!searchParams?.checkIn || !searchParams?.checkOut) {
      console.warn('SearchParams eksik');
      return;
    }
    
    try {
      setLoadingPrice(true);
      const response = await pricingAPI.calculatePrice({
        apartmentId,
        checkIn: searchParams.checkIn,
        checkOut: searchParams.checkOut,
        adults: searchParams.adults || 1,
        children: searchParams.children || 0
      });
      setCalculatedPrice(response);
    } catch (error) {
      console.error('Fiyat hesaplama hatası:', error);
      setCalculatedPrice(null);
    } finally {
      setLoadingPrice(false);
    }
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 100;
      const elementPosition = element.offsetTop - offset;
      
      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth'
      });
    }
  };

  // Mobil swipe işlevselliği
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;
    
    if (isLeftSwipe && displayImages.length > 1) {
      setCurrentImageIndex((prev: number) => (prev + 1) % displayImages.length);
    }
    if (isRightSwipe && displayImages.length > 1) {
      setCurrentImageIndex((prev: number) => (prev - 1 + displayImages.length) % displayImages.length);
    }
  };

  const handleShare = (platform: string) => {
    const url = window.location.href;
    const title = selectedItem.translations?.[currentLang]?.title || 
              selectedItem.translations?.tr?.title || 
              selectedItem.title;
    
    switch(platform) {
      case 'copy':
        navigator.clipboard.writeText(url);
        setShowCopyToast(true);
        setTimeout(() => setShowCopyToast(false), 3000);
        break;
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}`);
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`);
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`);
        break;
    }
    setShowShareMenu(false);
  };
  
  if (!selectedItem) return null;

  return (
    <div className="min-h-screen bg-[#f5f0e8] overflow-x-hidden">
      {/* Hero Section - Mobilde daha küçük */}
      <div className="relative h-[60vh] md:min-h-screen overflow-hidden">
        <div 
          className="absolute inset-0"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <img
            src={displayImages[currentImageIndex]?.url || displayImages[currentImageIndex]}
            alt={selectedItem.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/70"></div>
        </div>


        {/* Mobilde header'ı özelleştir */}
        <div className="md:hidden absolute top-0 left-0 right-0 z-20">
          <div className="flex items-center justify-between p-4">
            <button
              onClick={() => setCurrentView("rentals")}
              className="bg-white/20 backdrop-blur-md rounded-full p-2 flex-shrink-0" // flex-shrink-0 ekledik
            >
              <ChevronLeft size={24} className="text-white" />
            </button>
            
            <div className="flex gap-2 flex-shrink-0"> {/* flex-shrink-0 ekledik */}
              <button
                onClick={handleToggleFavorite}
                disabled={favoriteLoading}
                className={`p-2 rounded-full backdrop-blur-md ${
                  isLiked ? 'bg-red-500' : 'bg-white/20'
                } text-white`}
              >
                <Heart size={20} className={isLiked ? 'fill-current' : ''} />
              </button>
              <button
                onClick={() => setShowShareMenu(!showShareMenu)}
                className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white"
              >
                <Share2 size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Desktop Header */}
        <div className="hidden md:block">
          <Header 
            transparent={true}
            currentLang={currentLang}
            setCurrentLang={setCurrentLang}
            translations={translations}
            setShowLoginModal={setShowLoginModal}
            setCurrentView={setCurrentView}
          />
        </div>
        
        {/* Hero İçerik - Mobilde daha kompakt */}
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 lg:p-12 overflow-hidden">
          <div className="max-w-7xl mx-auto">
            {/* Desktop geri butonu */}
            <button
              onClick={() => setCurrentView("rentals")}
              className="hidden md:flex items-center text-white hover:text-[#f5e6d3] mb-6 transition-all transform hover:-translate-x-1"
            >
              <ChevronLeft size={20} />
              <span className="ml-1 font-medium">{t.backToList || 'Geri Dön'}</span>
            </button>

            <div className="grid lg:grid-cols-2 gap-4 md:gap-8 items-end">
              <div className="relative overflow-hidden max-w-full">
                {/* Indicators with better overflow control */}
                <div className="md:hidden flex gap-1 justify-center mb-3 overflow-x-auto max-w-full px-2">
                  {displayImages.map((_: any, index: number) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`h-1.5 rounded-full transition-all flex-shrink-0 ${
                        index === currentImageIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/50'
                      }`}
                    />
                  ))}
                </div>
                
                <h1 className="text-2xl md:text-4xl lg:text-6xl font-bold text-white mb-2 md:mb-4 line-clamp-2 break-words max-w-full">
                  {selectedItem.translations?.[currentLang]?.title || 
                  selectedItem.translations?.tr?.title || 
                  selectedItem.title}
                </h1>
                
                <div className="flex flex-wrap items-center gap-2 md:gap-4 text-white/90 max-w-full">
                  <div className="flex items-center min-w-0">
                    <MapPin size={16} className="md:hidden flex-shrink-0" />
                    <MapPin size={20} className="hidden md:block flex-shrink-0" />
                    <span className="ml-1 md:ml-2 text-xs md:text-sm lg:text-base truncate max-w-[200px]">
                      {isApartment
                        ? `${selectedItem.neighborhood}, ${selectedItem.district}`
                        : selectedItem.meetingPoint}
                    </span>
                  </div>
                </div>
              </div>

              {/* Mobilde fiyat bilgisini gizle, altta göster */}
              <div className="hidden lg:block lg:text-right">
                {searchParams?.checkIn && searchParams?.checkOut && isApartment ? (
                  loadingPrice ? (
                    <div className="animate-pulse inline-block">
                      <div className="h-12 bg-white/20 rounded-lg w-40"></div>
                    </div>
                  ) : calculatedPrice ? (
                    <div className="inline-block">
                      {calculatedPrice.hasDiscount && calculatedPrice.totalOriginalPrice && (
                        <div className="text-white/60 text-2xl line-through mb-1">
                          €{calculatedPrice.totalOriginalPrice}
                        </div>
                      )}
                      
                      <div className="flex items-baseline gap-3">
                        <span className="text-5xl lg:text-6xl font-bold text-white">
                          €{calculatedPrice.totalPrice}
                        </span>
                        <div className="text-white/80">
                          <div className="text-sm">{calculatedPrice.nights} {t.nights || 'gece'}</div>
                          {searchParams.adults > 1 && (
                            <div className="text-xs">{searchParams.adults} {t.adults || 'yetişkin'}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : null
                ) : (
                  <div className="inline-block text-white">
                    <div className="text-2xl font-medium mb-1">
                      {t.priceToSee || 'Fiyat görmek için'}
                    </div>
                    <div className="text-lg opacity-80">
                      {t.selectDates || 'tarih seçin'}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Desktop action buttons */}
            <div className="hidden md:flex gap-3 mt-8">
              <button
                onClick={handleToggleFavorite}
                disabled={favoriteLoading}
                className={`p-3 rounded-full backdrop-blur-md transition-all transform hover:scale-110 ${
                  isLiked 
                    ? 'bg-red-500 text-white' 
                    : 'bg-white/20 text-white hover:bg-white/30'
                } ${favoriteLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {favoriteLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                ) : (
                  <Heart size={20} className={isLiked ? 'fill-current' : ''} />
                )}
              </button>
              
              <div className="relative">
                <button
                  onClick={() => setShowShareMenu(!showShareMenu)}
                  className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition-all"
                >
                  <Share2 size={20} />
                </button>
                
                {showShareMenu && (
                  <div className="absolute left-0 bottom-full mb-2 bg-white rounded-lg shadow-xl p-2 min-w-[200px]">
                    <button
                      onClick={() => handleShare('copy')}
                      className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Copy size={18} />
                      <span>{t.copyLink || 'Linki Kopyala'}</span>
                    </button>
                    <button
                      onClick={() => handleShare('whatsapp')}
                      className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <MessageCircle size={18} />
                      <span>WhatsApp</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Image Navigation */}
        {displayImages.length > 1 && (
          <>
            <button
              onClick={() =>
                setCurrentImageIndex(
                  (prev: number) => (prev - 1 + displayImages.length) % displayImages.length
                )
              }
              className="hidden md:block absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 backdrop-blur-md rounded-full p-3 hover:bg-white/20 transition-all transform hover:scale-110"
            >
              <ChevronLeft size={28} className="text-white" />
            </button>
            <button
              onClick={() =>
                setCurrentImageIndex(
                  (prev: number) => (prev + 1) % displayImages.length
                )
              }
              className="hidden md:block absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 backdrop-blur-md rounded-full p-3 hover:bg-white/20 transition-all transform hover:scale-110"
            >
              <ChevronRight size={28} className="text-white" />
            </button>
          </>
        )}

        {/* Desktop Image Counter */}
        <div className="hidden md:block absolute bottom-4 right-4 bg-black/50 backdrop-blur-sm rounded-full px-4 py-2 text-white text-sm">
          {currentImageIndex + 1} / {displayImages.length}
        </div>
      </div>

      {/* Sticky Navigation - Mobilde scroll tabanlı */}
      <div className={`sticky top-0 z-40 bg-white shadow-lg transition-all duration-300 overflow-x-hidden ${scrolled ? 'py-2' : 'py-3 md:py-4'}`}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-12">
          {/* Mobil Navigation */}
          <div className="md:hidden">
            <div className="flex gap-4 overflow-x-auto pb-1">
              <button onClick={() => scrollToSection('overview')} className="text-xs font-medium text-gray-700 whitespace-nowrap px-2 py-1">{t.overview || 'Genel'}</button>
              {isApartment && <button onClick={() => scrollToSection('features')} className="text-xs font-medium text-gray-700 whitespace-nowrap px-2 py-1">{t.features || 'Özellikler'}</button>}
              <button onClick={() => scrollToSection('photos')} className="text-xs font-medium text-gray-700 whitespace-nowrap px-2 py-1">{t.photos || 'Fotoğraflar'}</button>
              <button onClick={() => scrollToSection('rules')} className="text-xs font-medium text-gray-700 whitespace-nowrap px-2 py-1">{t.thingsToKnow || 'Bilgiler'}</button>
              <button onClick={() => scrollToSection('location')} className="text-xs font-medium text-gray-700 whitespace-nowrap px-2 py-1">{t.location || 'Konum'}</button>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center justify-between">
            <nav className="flex gap-8">
              <button onClick={() => scrollToSection('overview')} className="text-sm font-medium text-gray-700 hover:text-[#0a2e23] transition-colors">{t.overview || 'Genel Bakış'}</button>
              {isApartment && <button onClick={() => scrollToSection('features')} className="text-sm font-medium text-gray-700 hover:text-[#0a2e23] transition-colors">{t.features || 'Özellikler'}</button>}
              <button onClick={() => scrollToSection('photos')} className="text-sm font-medium text-gray-700 hover:text-[#0a2e23] transition-colors">{t.photos || 'Fotoğraflar'}</button>
              <button onClick={() => scrollToSection('rules')} className="text-sm font-medium text-gray-700 hover:text-[#0a2e23] transition-colors">{t.thingsToKnow || 'Bilmeniz Gerekenler'}</button>
              <button onClick={() => scrollToSection('location')} className="text-sm font-medium text-gray-700 hover:text-[#0a2e23] transition-colors">{t.location || 'Konum'}</button>
            </nav>
            
            <button
              onClick={() => navigate(`/reservation/${selectedItemType}/${selectedItem._id || selectedItem.id}`)}
              className="bg-[#0a2e23] text-white px-6 py-2 rounded-lg font-medium hover:bg-[#0a2e23]/90 transition-all transform hover:scale-105"
            >
              {t.makeReservation || 'Hemen Rezervasyon Yap'}
            </button>
          </div>
        </div>
      </div>

      {/* Mobil Fiyat Kartı - Sayfanın üstünde */}
      <div className="md:hidden bg-white p-4 shadow-sm border-b">
        <div className="flex items-center justify-between">
          <div>
            {searchParams?.checkIn && searchParams?.checkOut && isApartment && calculatedPrice ? (
              <div>
                {calculatedPrice.hasDiscount && (
                  <span className="text-sm text-gray-400 line-through">€{calculatedPrice.totalOriginalPrice}</span>
                )}
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-[#0a2e23]">€{calculatedPrice.totalPrice}</span>
                  <span className="text-sm text-gray-600">{calculatedPrice.nights} gece</span>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-lg font-bold text-[#0a2e23]">€{basePrice}</p>
                <p className="text-xs text-gray-600">{t.perNight || 'gecelik'}</p>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
          </div>
        </div>
      </div>

      {/* Ana İçerik */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-12 py-6 md:py-12">
        {/* Mobilde tek kolon, desktop'ta 4 kolon */}
        <div id="overview" className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-6 md:mb-8 w-full">
          {isApartment ? (
            <>
              <div className="bg-white rounded-lg md:rounded-xl p-3 md:p-6 text-center hover:shadow-lg transition-all min-w-0">
                <Users size={20} className="md:hidden text-[#0a2e23] mx-auto mb-2" />
                <Users size={32} className="hidden md:block text-[#0a2e23] mx-auto mb-3" />
                <p className="text-xs md:text-sm text-gray-600 mb-1 truncate">{t.guestCapacity || 'Misafir'}</p>
                <p className="text-base md:text-2xl font-bold text-[#0a2e23]">{selectedItem.maxCapacity || selectedItem.capacity || 4} {t.person || 'Kişi'}</p>
              </div>
              <div className="bg-white rounded-lg md:rounded-xl p-4 md:p-6 text-center hover:shadow-lg transition-all">
                <Bed size={24} className="md:hidden text-[#0a2e23] mx-auto mb-2" />
                <Bed size={32} className="hidden md:block text-[#0a2e23] mx-auto mb-3" />
                <p className="text-xs md:text-sm text-gray-600 mb-1">{t.bedroom || 'Yatak Odası'}</p>
                <p className="text-lg md:text-2xl font-bold text-[#0a2e23]">{selectedItem.bedrooms || selectedItem.rooms || 1}</p>
              </div>
              <div className="bg-white rounded-lg md:rounded-xl p-4 md:p-6 text-center hover:shadow-lg transition-all">
                <Bath size={24} className="md:hidden text-[#0a2e23] mx-auto mb-2" />
                <Bath size={32} className="hidden md:block text-[#0a2e23] mx-auto mb-3" />
                <p className="text-xs md:text-sm text-gray-600 mb-1">{t.bathroom || 'Banyo'}</p>
                <p className="text-lg md:text-2xl font-bold text-[#0a2e23]">{selectedItem.bathrooms || 1}</p>
              </div>
              <div className="bg-white rounded-lg md:rounded-xl p-4 md:p-6 text-center hover:shadow-lg transition-all">
                <Home size={24} className="md:hidden text-[#0a2e23] mx-auto mb-2" />
                <Home size={32} className="hidden md:block text-[#0a2e23] mx-auto mb-3" />
                <p className="text-xs md:text-sm text-gray-600 mb-1">{t.area || 'Alan'}</p>
                <p className="text-lg md:text-2xl font-bold text-[#0a2e23]">{selectedItem.area || selectedItem.size || 50} m²</p>
              </div>
            </>
          ) : (
            <>
              <div className="bg-white rounded-lg md:rounded-xl p-4 md:p-6 text-center hover:shadow-lg transition-all">
                <Clock size={24} className="md:hidden text-[#0a2e23] mx-auto mb-2" />
                <Clock size={32} className="hidden md:block text-[#0a2e23] mx-auto mb-3" />
                <p className="text-xs md:text-sm text-gray-600 mb-1">{t.tourDuration || 'Süre'}</p>
                <p className="text-lg md:text-2xl font-bold text-[#0a2e23]">{selectedItem.duration}</p>
              </div>
              <div className="bg-white rounded-lg md:rounded-xl p-4 md:p-6 text-center hover:shadow-lg transition-all">
                <Users size={24} className="md:hidden text-[#0a2e23] mx-auto mb-2" />
                <Users size={32} className="hidden md:block text-[#0a2e23] mx-auto mb-3" />
                <p className="text-xs md:text-sm text-gray-600 mb-1">{t.groupSize || 'Grup'}</p>
                <p className="text-lg md:text-2xl font-bold text-[#0a2e23]">{t.max || 'Maks'} {selectedItem.maxPeople}</p>
              </div>
              <div className="bg-white rounded-lg md:rounded-xl p-4 md:p-6 text-center hover:shadow-lg transition-all">
                <MessageCircle size={24} className="md:hidden text-[#0a2e23] mx-auto mb-2" />
                <MessageCircle size={32} className="hidden md:block text-[#0a2e23] mx-auto mb-3" />
                <p className="text-xs md:text-sm text-gray-600 mb-1">{t.languages || 'Diller'}</p>
                <p className="text-lg md:text-xl font-bold text-[#0a2e23]">{selectedItem.languages?.length || 2}</p>
              </div>
              <div className="bg-white rounded-lg md:rounded-xl p-4 md:p-6 text-center hover:shadow-lg transition-all">
                <Award size={24} className="md:hidden text-[#0a2e23] mx-auto mb-2" />
                <Award size={32} className="hidden md:block text-[#0a2e23] mx-auto mb-3" />
                <p className="text-xs md:text-sm text-gray-600 mb-1">{t.guide || 'Rehber'}</p>
                <p className="text-lg md:text-xl font-bold text-[#0a2e23]">{t.professional || 'Profesyonel'}</p>
              </div>
            </>
          )}
        </div>

        {/* Mobilde fotoğraflar carousel tarzı */}
        {normalizedImages.length > 1 && (
          <div id="photos" className="mb-8 md:mb-12">
            <h2 className="text-xl md:text-2xl font-bold text-[#0a2e23] mb-4 md:mb-6 flex items-center">
              <Camera size={24} className="md:hidden mr-2" />
              <Camera size={28} className="hidden md:block mr-3" />
              {t.photos || 'Fotoğraflar'}
            </h2>

            {/* Mobil Fotoğraf Carousel */}
            <div className="md:hidden">
              <div className="overflow-x-auto">
                <div className="flex gap-2">
                  {displayImages.map((img: any, index: number) => (
                    <div
                      key={index}
                      onClick={() => {
                        setCurrentImageIndex(index);
                        setShowAllPhotos(true);
                      }}
                      className="flex-shrink-0 w-[250px] h-[180px] rounded-xl overflow-hidden"
                    >
                      <img
                        src={img.url || img}
                        alt={`${selectedItem.title} - ${index + 1}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  ))}
                </div>
              </div>
              
              <button
                onClick={() => setShowAllPhotos(true)}
                className="mt-4 text-sm text-[#0a2e23] font-medium flex items-center gap-2"
              >
                <Grid3X3 size={18} />
                {t.showAll || 'Tüm'} {displayImages.length} {t.photosText || 'fotoğraf'}
              </button>
            </div>

            {/* Desktop Fotoğraf Grid */}
            <div className="hidden md:block">
              {hasRoomTypes && (
                <div className="flex flex-wrap gap-2 mb-6">
                  <button
                    onClick={() => setSelectedRoomType(null)}
                    className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all transform hover:scale-105 ${
                      !selectedRoomType
                        ? "bg-[#0a2e23] text-white shadow-lg"
                        : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                    }`}
                  >
                    <Grid3X3 size={16} className="inline mr-2" />
                    {t.allPhotos || 'Tüm Fotoğraflar'} ({normalizedImages.length})
                  </button>
                  
                  {Object.entries(groupedImages).map(([roomType, images]: [string, any]) => {
                    const config = roomTypeConfig[roomType as keyof typeof roomTypeConfig];
                    if (!config) return null;
                    const Icon = config.icon;
                    
                    return (
                      <button
                        key={roomType}
                        onClick={() => setSelectedRoomType(roomType)}
                        className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all transform hover:scale-105 flex items-center ${
                          selectedRoomType === roomType
                            ? "bg-[#0a2e23] text-white shadow-lg"
                            : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                        }`}
                      >
                        <Icon size={16} className="mr-2" />
                        {config.label} ({images.length})
                      </button>
                    );
                  })}
                </div>
              )}
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {displayImages.slice(0, 5).map((img: any, index: number) => (
                  <div
                    key={index}
                    onClick={() => {
                      setCurrentImageIndex(index);
                      setShowAllPhotos(true);
                    }}
                    className={`relative overflow-hidden rounded-2xl cursor-pointer group ${
                      index === 0 ? 'col-span-2 row-span-2' : ''
                    }`}
                  >
                    <div className={`relative ${index === 0 ? 'aspect-square' : 'aspect-[4/3]'}`}>
                      <img
                        src={img.url || img}
                        alt={`${selectedItem.title} - ${index + 1}`}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300" />
                      {index === 4 && displayImages.length > 5 && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center group-hover:bg-black/70 transition-all">
                          <div className="text-white text-center">
                            <Maximize2 size={32} className="mx-auto mb-2" />
                            <span className="text-lg font-medium">+{displayImages.length - 5} {t.photo || 'Fotoğraf'}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              <button
                onClick={() => setShowAllPhotos(true)}
                className="mt-6 flex items-center text-[#0a2e23] hover:text-[#0a2e23]/80 font-medium transition-colors group"
              >
                <Camera size={20} className="mr-2 group-hover:scale-110 transition-transform" />
                {t.showAll || 'Tüm'} {displayImages.length} {t.photosText || 'fotoğrafı göster'}
              </button>
            </div>
          </div>
        )}

        {/* Mobilde tek kolon, desktop'ta 3 kolon layout */}
        <div className="grid lg:grid-cols-3 gap-4 md:gap-8">
          <div className="lg:col-span-2 space-y-4 md:space-y-8 w-full">
            {/* Açıklama */}
            <div id="overview" className="bg-white rounded-xl md:rounded-2xl p-4 md:p-8 shadow-sm hover:shadow-lg transition-shadow">
              <h2 className="text-2xl md:text-3xl font-bold text-[#0a2e23] mb-4 md:mb-6">
                {selectedItem.translations?.[currentLang]?.title || 
                selectedItem.translations?.tr?.title || 
                selectedItem.title}
              </h2>
              <p className="text-gray-700 leading-relaxed text-base md:text-lg">
                {selectedItem.translations?.[currentLang]?.description || 
                selectedItem.translations?.tr?.description || 
                selectedItem.description}
              </p>
            </div>

            {/* Özellikler - Mobilde daha kompakt */}
            {isApartment && selectedItem.amenities && selectedItem.amenities.length > 0 && (
              <div id="features" className="bg-white rounded-xl md:rounded-2xl p-4 md:p-8 shadow-sm hover:shadow-lg transition-shadow">
                <h3 className="text-xl md:text-2xl font-bold text-[#0a2e23] mb-4 md:mb-6 flex items-center">
                  <Sparkles size={24} className="md:hidden mr-2" />
                  <Sparkles size={28} className="hidden md:block mr-3" />
                  {t.features || 'Özellikler'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                  {selectedItem.amenities.slice(0, 6).map((amenity: string, index: number) => {
                    const IconComponent = amenityIcons[amenity as keyof typeof amenityIcons];
                    const Icon = IconComponent || Check;
                    
                    return (
                      <div key={index} className="flex items-center gap-3 p-2 md:p-3 rounded-lg hover:bg-gray-50 transition-colors">
                        <Icon className="text-[#0a2e23] flex-shrink-0" size={18} />
                        <span className="text-sm md:text-base text-gray-700">{translateAmenity(amenity, currentLang)}</span>
                      </div>
                    );
                  })}
                </div>
                
                {selectedItem.amenities.length > 6 && (
                  <button
                    onClick={() => setShowAllAmenitiesModal(true)}
                    className="mt-4 md:mt-6 text-[#0a2e23] font-medium text-sm md:text-base hover:underline flex items-center gap-2 group"
                  >
                    {t.showAll || 'Tüm'} {selectedItem.amenities.length} {t.featureShow || 'özelliği göster'}
                    <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                )}
              </div>
            )}

            {/* Kurallar - Mobilde daha kompakt */}
            {isApartment && (
              <div id="rules" className="bg-white rounded-xl md:rounded-2xl p-4 md:p-8 shadow-sm hover:shadow-lg transition-shadow">
                <h3 className="text-xl md:text-2xl font-bold text-[#0a2e23] mb-4 md:mb-6 flex items-center">
                  <Info size={24} className="md:hidden mr-2" />
                  <Info size={28} className="hidden md:block mr-3" />
                  {t.thingsToKnow || 'Bilmeniz Gerekenler'}
                </h3>
                <div className="grid md:grid-cols-2 gap-6 md:gap-8">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 md:mb-4 text-base md:text-lg">{t.houseRules || 'Ev Kuralları'}</h4>
                    <div className="space-y-2 md:space-y-3">
                      <div className="flex items-center gap-2 md:gap-3 text-gray-700">
                        <span className="text-lg md:text-xl">🕐</span>
                        <span className="text-sm md:text-base">{t.checkIn || 'Giriş'}: {selectedItem.checkInTime || '14:00'} {t.after || 'sonrası'}</span>
                      </div>
                      <div className="flex items-center gap-2 md:gap-3 text-gray-700">
                        <span className="text-lg md:text-xl">🕐</span>
                        <span className="text-sm md:text-base">{t.checkOut || 'Çıkış'}: {selectedItem.checkOutTime || '11:00'} {t.before || 'öncesi'}</span>
                      </div>
                      {selectedItem.rules && selectedItem.rules.length > 0 ? (
                        selectedItem.rules.map((rule: string, index: number) => {
                          const translatedRule = translateRule(rule, currentLang);
                          const IconComponent = getRuleIconComponent(rule);
                          
                          return (
                            <div key={index} className="flex items-start gap-2 md:gap-3 text-gray-700">
                              <div className="text-red-500/80 mt-0.5 flex-shrink-0">
                                <IconComponent size={18} className="md:hidden" />
                                <IconComponent size={20} className="hidden md:block" />
                              </div>
                              <span className="text-sm md:text-base">{translatedRule}</span>
                            </div>
                          );
                        })
                      ) : (
                        <>
                          <div className="flex items-start gap-2 md:gap-3 text-gray-700">
                            <div className="text-red-500/80 mt-0.5 flex-shrink-0">
                              <CircleSlash size={18} className="md:hidden" />
                              <CircleSlash size={20} className="hidden md:block" />
                            </div>
                            <span className="text-sm md:text-base">{translateRule('Sigara içilmez', currentLang)}</span>
                          </div>
                          <div className="flex items-start gap-2 md:gap-3 text-gray-700">
                            <div className="text-red-500/80 mt-0.5 flex-shrink-0">
                              <Dog size={18} className="md:hidden" />
                              <Dog size={20} className="hidden md:block" />
                            </div>
                            <span className="text-sm md:text-base">{translateRule('Evcil hayvan kabul edilmez', currentLang)}</span>
                          </div>
                        </>
                      )}
                      </div>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3 md:mb-4 text-base md:text-lg">{t.safetyAndHealth || 'Güvenlik ve Sağlık'}</h4>
                        <div className="space-y-2 md:space-y-3">
                          {selectedItem.safetyFeatures && selectedItem.safetyFeatures.length > 0 ? (
                            selectedItem.safetyFeatures.map((feature: string, index: number) => {
                              const translatedFeature = translateSafety(feature, currentLang);
                              const IconComponent = getSafetyIconComponent(feature);
                              
                              return (
                                <div key={index} className="flex items-center gap-2 md:gap-3 text-gray-700">
                                  <div className="text-green-600 flex-shrink-0">
                                    <IconComponent size={18} className="md:hidden" />
                                    <IconComponent size={20} className="hidden md:block" />
                                  </div>
                                  <span className="text-sm md:text-base">{translatedFeature}</span>
                                </div>
                              );
                            })
                          ) : (
                            <>
                              <div className="flex items-center gap-2 md:gap-3 text-gray-700">
                                <div className="text-green-600 flex-shrink-0">
                                  <AlertCircle size={18} className="md:hidden" />
                                  <AlertCircle size={20} className="hidden md:block" />
                                </div>
                                <span className="text-sm md:text-base">{translateSafety('Duman dedektörü', currentLang)}</span>
                              </div>
                              <div className="flex items-center gap-2 md:gap-3 text-gray-700">
                                <div className="text-green-600 flex-shrink-0">
                                  <HeartIcon size={18} className="md:hidden" />
                                  <HeartIcon size={20} className="hidden md:block" />
                                </div>
                                <span className="text-sm md:text-base">{translateSafety('İlk yardım çantası', currentLang)}</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                      </div>
                      </div>
                      )}

            {/* Takvim - Mobilde daha kompakt */}
            {isApartment && (
             <div className="bg-white rounded-xl md:rounded-2xl p-4 md:p-8 shadow-sm hover:shadow-lg transition-shadow">
                <h3 className="text-xl md:text-2xl font-bold text-[#0a2e23] mb-4 md:mb-6 flex items-center">
                  <Calendar size={24} className="md:hidden mr-2" />
                  <Calendar size={28} className="hidden md:block mr-3" />
                  {t.availabilityStatus || 'Müsaitlik Durumu'}
                </h3>
                
                {searchParams?.checkIn && searchParams?.checkOut ? (
                  <div className="text-center py-6 md:py-8">
                    <div className="bg-green-50 rounded-xl p-4 md:p-6 inline-block">
                      <Check className="text-green-600 mx-auto mb-2 md:mb-3" size={36} />
                      <p className="text-base md:text-lg font-medium text-gray-700 mb-2">
                        {t.selectedDates || 'Seçtiğiniz tarihler:'}
                      </p>
                      <p className="text-sm md:text-base text-gray-600 font-semibold">
                        {new Date(searchParams.checkIn).toLocaleDateString('tr-TR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })} - {' '}
                        {new Date(searchParams.checkOut).toLocaleDateString('tr-TR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                      <p className="text-xs md:text-sm text-gray-500 mt-3 md:mt-4">
                        {calculatedPrice?.nights} {t.nights || 'gece'} • €{calculatedPrice?.totalPrice}
                      </p>
                    </div>
                  </div>
                ) : (
                  <AvailabilityCalendar
                    apartment={selectedItem}
                    currentMonth={detailMonth}
                    setCurrentMonth={setDetailMonth}
                    translations={translations}
                    currentLang={currentLang}
                  />
                )}
              </div>
            )}

            {/* Konum - Mobilde daha kompakt */}
            <div id="location" className="bg-white rounded-xl md:rounded-2xl p-4 md:p-8 shadow-sm hover:shadow-lg transition-shadow">
              <h3 className="text-xl md:text-2xl font-bold text-[#0a2e23] mb-4 md:mb-6 flex items-center">
                <MapPin size={24} className="md:hidden mr-2" />
                <MapPin size={28} className="hidden md:block mr-3" />
                {t.location || 'Konum'}
              </h3>
              
              {selectedItem.coordinates?.lat && selectedItem.coordinates?.lng ? (
                <>
                  <div className="relative rounded-xl overflow-hidden shadow-lg bg-gray-100">
                    <div className="aspect-video">
                      <iframe
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        loading="lazy"
                        allowFullScreen
                        referrerPolicy="no-referrer-when-downgrade"
                        src={`https://www.google.com/maps/embed/v1/place?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&q=${selectedItem.coordinates.lat},${selectedItem.coordinates.lng}&zoom=15&maptype=roadmap`}
                      />
                    </div>
                  </div>
                  
                  <div className="mt-3 md:mt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <p className="text-xs md:text-sm text-gray-600">
                      {isApartment
                        ? `${selectedItem.neighborhood}, ${selectedItem.district}, ${selectedItem.city}`
                        : selectedItem.meetingPoint}
                    </p>
                    <a 
                      href={`https://www.google.com/maps/search/?api=1&query=${selectedItem.coordinates.lat},${selectedItem.coordinates.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs md:text-sm text-[#0a2e23] hover:text-[#1a4a3a] flex items-center gap-2 transition-colors"
                    >
                      <MapPin size={14} />
                      <span>Google Maps'te Aç</span>
                    </a>
                  </div>
                </>
              ) : (
                <div className="aspect-video bg-gray-100 rounded-xl flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <MapPin size={40} className="md:hidden mx-auto mb-2 opacity-50" />
                    <MapPin size={48} className="hidden md:block mx-auto mb-3 opacity-50" />
                    <p className="text-sm md:text-base">{t.locationNotAvailable || 'Konum bilgisi henüz eklenmemiş'}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Desktop Rezervasyon Kartı */}
          <div className="hidden lg:block lg:col-span-1">
            <div id="reservation-section" className="sticky top-28">
              <div className="bg-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-shadow">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    {searchParams?.checkIn && searchParams?.checkOut && isApartment && calculatedPrice ? (
                      <>
                        {calculatedPrice.hasDiscount && calculatedPrice.totalOriginalPrice && (
                          <div className="text-2xl text-gray-400 line-through">
                            €{calculatedPrice.totalOriginalPrice}
                          </div>
                        )}
                        
                        <span className="text-4xl font-bold text-[#0a2e23]">
                          €{calculatedPrice.totalPrice}
                        </span>
                        <div className="text-sm text-gray-600">
                          {calculatedPrice.nights} {t.nightsTotal || 'gece toplam'}
                        </div>
                        <div className="text-xs text-gray-500">
                          €{calculatedPrice.pricePerNight}/{t.night || 'gece'}
                          {searchParams.adults > 1 && ` • ${searchParams.adults} ${t.adults || 'yetişkin'}`}
                        </div>
                      </>
                    ) : (
                      <div>
                        <p className="text-lg font-medium text-gray-700">
                          {t.feeToSee || 'Ücreti görmek için'}
                        </p>
                        <p className="text-sm text-gray-600">
                          {t.selectDatesSmall || 'tarih seçiniz'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-center">
                  <button
                    onClick={() => navigate(`/reservation/${selectedItemType}/${selectedItem._id || selectedItem.id}`)}
                    className="w-full bg-[#0a2e23] text-white px-6 py-3 rounded-xl hover:bg-[#0f4a3a] transition-colors font-medium flex items-center justify-center space-x-2"
                  >
                    <Calendar size={20} />
                    <span>{t.makeReservation || 'Hemen Rezervasyon Yap'}</span>
                  </button>

                  <p className="text-center text-sm text-gray-600 mt-3">
                    {t.noChargeYet || 'Henüz ücret alınmayacak'}
                  </p>
                </div>

                {isApartment && calculatedPrice && searchParams?.checkIn && (
                  <div className="mt-6 pt-6 border-t space-y-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        €{calculatedPrice.originalPricePerNight || calculatedPrice.pricePerNight} x {calculatedPrice.nights} {t.nights || 'gece'}
                      </span>
                      <span className="font-medium">
                        €{calculatedPrice.totalOriginalPrice || calculatedPrice.totalPrice}
                      </span>
                    </div>
                    
                    {searchParams.adults > 1 && (
                      <div className="flex justify-between text-sm text-blue-600">
                        <span>{searchParams.adults} {t.adultPriceIncluded || 'yetişkin fiyatı dahil'}</span>
                        <span>✓</span>
                      </div>
                    )}
                    
                    {calculatedPrice.hasDiscount && calculatedPrice.totalDiscountAmount > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>{calculatedPrice.discountReason || t.discount || 'İndirim'}</span>
                        <span>-€{calculatedPrice.totalDiscountAmount}</span>
                      </div>
                    )}
                    
                    <div className="pt-4 border-t flex justify-between">
                      <span className="font-semibold">{t.amountToPay || 'Ödenecek Tutar'}</span>
                      <span className="font-bold text-lg">€{calculatedPrice.totalPrice}</span>
                    </div>
                  </div>
                )}

                <div className="mt-6 pt-6 border-t">
                  <p className="text-sm text-gray-600 mb-4 text-center">{t.haveQuestions || 'Sorularınız mı var?'}</p>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => {
                        const message = `Merhaba, ${selectedItem.title} hakkında bilgi almak istiyorum.`;
                        window.open(`https://wa.me/905355117018?text=${encodeURIComponent(message)}`, '_blank');
                      }}
                      className="border border-gray-300 py-3 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <MessageCircle size={18} />
                      {t.sendMessage || 'Mesaj Yaz'}
                    </button>
                    <button 
                      onClick={() => {
                        const subject = `${selectedItem.title} Hakkında Bilgi`;
                        const body = `Merhaba,\n\n${selectedItem.title} için bilgi almak istiyorum.\n\nTarih: ${searchParams?.checkIn ? `${searchParams.checkIn} - ${searchParams.checkOut}` : 'Belirtilmemiş'}\nKişi Sayısı: ${searchParams?.adults || 1} yetişkin${searchParams?.children ? `, ${searchParams.children} çocuk` : ''}\n\nTeşekkürler`;
                        window.location.href = `mailto:info@lagirio.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                      }}
                      className="border border-gray-300 py-3 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <Mail size={18} />
                      {t.email || 'E-posta'}
                    </button>
                  </div>
                </div>

                <div className="mt-6 bg-gray-50 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Shield size={20} className="text-[#0a2e23] mt-0.5" />
                    <div className="text-xs text-gray-600">
                      <p className="font-semibold text-gray-900 mb-1">{t.secureReservation || 'Güvenli rezervasyon'}</p>
                      <p>{t.sslProtection || '256-bit SSL şifreleme ile korunmaktadır.'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobil Alt Rezervasyon Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-xl z-40 p-4">
        <div className="flex items-center justify-between">
          <div>
            {calculatedPrice ? (
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-[#0a2e23]">€{calculatedPrice.totalPrice}</span>
                  <span className="text-sm text-gray-600">{calculatedPrice.nights} gece</span>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-lg font-bold text-[#0a2e23]">€{basePrice}</p>
                <p className="text-xs text-gray-600">{t.perNight || 'gecelik'}</p>
              </div>
            )}
          </div>
          
          <button
            onClick={() => navigate(`/reservation/${selectedItemType}/${selectedItem._id || selectedItem.id}`)}
            className="bg-[#0a2e23] text-white px-6 py-3 rounded-xl font-medium"
          >
            {t.bookNow || 'Rezervasyon'}
          </button>
        </div>
      </div>

      {/* Mobil Share Menu - Bottom Sheet tarzı */}
      {showShareMenu && (
        <div className="md:hidden fixed inset-0 bg-black/50 z-50" onClick={() => setShowShareMenu(false)}>
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold mb-4">{t.share || 'Paylaş'}</h3>
            <div className="space-y-3">
              <button
                onClick={() => handleShare('copy')}
                className="w-full flex items-center gap-3 p-3 hover:bg-gray-100 rounded-lg"
              >
                <Copy size={20} />
                <span>{t.copyLink || 'Linki Kopyala'}</span>
              </button>
              <button
                onClick={() => handleShare('whatsapp')}
                className="w-full flex items-center gap-3 p-3 hover:bg-gray-100 rounded-lg"
              >
                <MessageCircle size={20} />
                <span>WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Copy Link Toast */}
      {showCopyToast && (
        <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 animate-pulse">
          <div className="bg-white rounded-2xl shadow-2xl p-3 md:p-4 flex items-center space-x-3 min-w-[250px] md:min-w-[300px] border border-green-100">
            <div className="bg-green-100 p-2 md:p-3 rounded-full">
              <Copy className="text-green-600" size={18} />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900 text-sm md:text-base">{t.linkCopied || 'Link kopyalandı!'}</p>
              <p className="text-xs md:text-sm text-gray-600">{t.linkCopiedDesc || 'Paylaşmaya hazır'}</p>
            </div>
            <button
              onClick={() => setShowCopyToast(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Tüm Fotoğraflar Modal - GÜNCELLEME */}
      {showAllPhotos && (
        <div className="fixed inset-0 bg-black z-50 overflow-y-auto">
          <div className="sticky top-0 bg-black/90 backdrop-blur-sm p-3 md:p-4 flex justify-between items-center z-10">
            <h3 className="text-white text-base md:text-xl font-semibold">
              {t.allPhotos || 'Tüm Fotoğraflar'}
            </h3>
            <button
              onClick={() => setShowAllPhotos(false)}
              className="text-white hover:text-gray-300 p-2 rounded-full hover:bg-white/10 transition-all"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="p-2 md:p-4 pb-20">
            {isApartment && hasRoomTypes ? (
              Object.entries(groupedImages).map(([roomType, images]: [string, any]) => {
                const config = roomTypeConfig[roomType as keyof typeof roomTypeConfig];
                if (!config || images.length === 0) return null;
                const Icon = config.icon;
                
                return (
                  <div key={roomType} className="mb-8 md:mb-16">
                    <div className="flex items-center mb-3 md:mb-6 text-white">
                      <Icon size={20} className="md:hidden mr-2" />
                      <Icon size={28} className="hidden md:block mr-3" />
                      <h4 className="text-lg md:text-2xl font-semibold">{config.label}</h4>
                      <span className="ml-2 md:ml-3 text-gray-400 text-sm md:text-lg">({images.length} {t.photo || 'fotoğraf'})</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
                      {images.map((img: any, index: number) => {
                        // Tüm images içindeki global index'i bul
                        const globalIndex = normalizedImages.findIndex((nImg: any) => nImg.url === img.url);
                        
                        return (
                          <img
                            key={index}
                            src={img.url}
                            alt={`${selectedItem.title} - ${config.label} ${index + 1}`}
                            className="w-full rounded-lg md:rounded-xl hover:opacity-90 transition-opacity cursor-pointer"
                            loading="lazy"
                            onClick={() => setFullscreenImageIndex(globalIndex)}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="space-y-3 md:space-y-6">
                {normalizedImages.map((img: any, index: number) => (
                  <img
                    key={index}
                    src={img.url || img}
                    alt={`${selectedItem.title} - ${index + 1}`}
                    className="w-full rounded-lg md:rounded-xl hover:opacity-90 transition-opacity cursor-pointer"
                    loading="lazy"
                    onClick={() => setFullscreenImageIndex(index)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Fullscreen Image Viewer */}
      {fullscreenImageIndex !== null && (
        <div className="fixed inset-0 bg-black z-[60] flex items-center justify-center">
          {/* Close Button */}
          <button
            onClick={() => setFullscreenImageIndex(null)}
            className="absolute top-4 right-4 z-10 text-white hover:text-gray-300 p-2 rounded-full hover:bg-white/10 transition-all"
          >
            <X size={24} />
          </button>
          
          {/* Image Counter */}
          <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm rounded-full px-4 py-2 text-white text-sm">
            {fullscreenImageIndex + 1} / {normalizedImages.length}
          </div>
          
          {/* Previous Button */}
          {fullscreenImageIndex > 0 && (
            <button
              onClick={() => setFullscreenImageIndex(prev => prev! - 1)}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 backdrop-blur-md rounded-full p-3 hover:bg-white/20 transition-all transform hover:scale-110 z-10"
            >
              <ChevronLeft size={28} className="text-white" />
            </button>
          )}
          
          {/* Next Button */}
          {fullscreenImageIndex < normalizedImages.length - 1 && (
            <button
              onClick={() => setFullscreenImageIndex(prev => prev! + 1)}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 backdrop-blur-md rounded-full p-3 hover:bg-white/20 transition-all transform hover:scale-110 z-10"
            >
              <ChevronRight size={28} className="text-white" />
            </button>
          )}
          
          {/* Main Image */}
          <div 
            className="relative w-full h-full flex items-center justify-center p-4 md:p-8"
            onTouchStart={handleFullscreenTouchStart}
            onTouchMove={handleFullscreenTouchMove}
            onTouchEnd={handleFullscreenTouchEnd}
          >
            <img
              src={normalizedImages[fullscreenImageIndex]?.url || normalizedImages[fullscreenImageIndex]}
              alt={`${selectedItem.title} - ${fullscreenImageIndex + 1}`}
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          
          {/* Thumbnail Strip - Desktop only */}
          <div className="hidden md:block absolute bottom-4 left-4 right-4">
            <div className="flex gap-2 justify-center overflow-x-auto pb-2">
              {normalizedImages.slice(
                Math.max(0, fullscreenImageIndex - 5),
                Math.min(normalizedImages.length, fullscreenImageIndex + 6)
              ).map((img: any, idx: number) => {
                const actualIndex = Math.max(0, fullscreenImageIndex - 5) + idx;
                return (
                  <button
                    key={actualIndex}
                    onClick={() => setFullscreenImageIndex(actualIndex)}
                    className={`flex-shrink-0 rounded-lg overflow-hidden transition-all ${
                      actualIndex === fullscreenImageIndex
                        ? 'ring-2 ring-white scale-110'
                        : 'opacity-50 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={img.url || img}
                      alt={`Thumbnail ${actualIndex + 1}`}
                      className="w-16 h-16 object-cover"
                    />
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* Mobile Swipe Indicators */}
          <div className="md:hidden absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-1">
            {normalizedImages.map((_: any, index: number) => (
              <button
                key={index}
                onClick={() => setFullscreenImageIndex(index)}
                className={`h-1.5 rounded-full transition-all ${
                  index === fullscreenImageIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/50'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Tüm Özellikler Modal - Mobilde bottom sheet */}
      {showAllAmenitiesModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center md:p-4">
          <div className="bg-white rounded-t-2xl md:rounded-2xl w-full md:max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="p-4 md:p-6 border-b flex items-center justify-between bg-[#f5f0e8]">
              <h3 className="text-xl md:text-2xl font-bold text-[#0a2e23]">
                {t.allFeatures || 'Tüm Özellikler'}
              </h3>
              <button
                onClick={() => setShowAllAmenitiesModal(false)}
                className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-white/50 transition-all"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 md:p-8 overflow-y-auto max-h-[calc(90vh-88px)]">
              <div className="space-y-6 md:space-y-10">
                {(() => {
                  // Dinamik olarak kategorilere ayır
                  const categorizeAmenity = (amenity: string) => {
                    const lowerAmenity = amenity.toLowerCase();
                    
                    // Temel Olanaklar
                    if (lowerAmenity.includes('wi-fi') || lowerAmenity.includes('wifi') || 
                        lowerAmenity === 'tv' || lowerAmenity.includes('klima') || 
                        lowerAmenity.includes('ısıtma') || lowerAmenity.includes('sıcak su') || 
                        lowerAmenity.includes('havlu') || lowerAmenity.includes('çarşaf')) {
                      return t.amenityCategories?.basicAmenities || 'Temel Olanaklar';
                    }
                    
                    // Mutfak
                    if (lowerAmenity.includes('mutfak') || lowerAmenity.includes('buzdolabı') || 
                        lowerAmenity.includes('fırın') || lowerAmenity.includes('ocak') || 
                        lowerAmenity.includes('mikrodalga') || lowerAmenity.includes('bulaşık') || 
                        lowerAmenity.includes('kahve') || lowerAmenity.includes('su ısıtıcısı') || 
                        lowerAmenity.includes('tost') || lowerAmenity.includes('çay') || 
                        lowerAmenity.includes('eşya')) {
                      return t.amenityCategories?.kitchen || 'Mutfak';
                    }
                    
                    // Banyo
                    if (lowerAmenity.includes('duş') || lowerAmenity.includes('küvet') || 
                        lowerAmenity.includes('saç kurutma') || lowerAmenity.includes('şampuan') || 
                        lowerAmenity.includes('sabun') || lowerAmenity.includes('jel') || 
                        lowerAmenity.includes('banyo') || lowerAmenity.includes('tuvalet')) {
                      return t.amenityCategories?.bathroom || 'Banyo';
                    }
                    
                    // Konfor
                    if (lowerAmenity.includes('çamaşır') || lowerAmenity.includes('ütü') || 
                        lowerAmenity.includes('asansör') || lowerAmenity.includes('balkon') || 
                        lowerAmenity.includes('teras') || lowerAmenity.includes('bahçe') || 
                        lowerAmenity.includes('manzara') || lowerAmenity.includes('ses yalıtım') || 
                        lowerAmenity.includes('karartma') || lowerAmenity.includes('kurutma')) {
                      return t.amenityCategories?.comfort || 'Konfor';
                    }
                    
                    // Güvenlik
                    if (lowerAmenity.includes('dedektör') || lowerAmenity.includes('yangın') || 
                        lowerAmenity.includes('ilk yardım') || lowerAmenity.includes('kasa') || 
                        lowerAmenity.includes('güvenlik') || lowerAmenity.includes('kamera') || 
                        lowerAmenity.includes('kilit')) {
                      return t.amenityCategories?.security || 'Güvenlik';
                    }
                    
                    // Otopark
                    if (lowerAmenity.includes('otopark') || lowerAmenity.includes('park') || 
                        lowerAmenity.includes('vale') || lowerAmenity.includes('bisiklet') || 
                        lowerAmenity.includes('araç')) {
                      return t.amenityCategories?.parkingTransport || 'Otopark ve Ulaşım';
                    }
                    
                    // Eğlence
                    if (lowerAmenity.includes('netflix') || lowerAmenity.includes('oyun') || 
                        lowerAmenity.includes('kitap') || lowerAmenity.includes('kablo')) {
                      return 'Eğlence';
                    }
                    
                    // Diğer
                    return 'Diğer';
                  };
                  
                  // Tüm amenities'i kategorize et
                  const categorizedAmenities: Record<string, string[]> = {};
                  
                  selectedItem.amenities.forEach((amenity: string) => {
                    const category = categorizeAmenity(amenity);
                    if (!categorizedAmenities[category]) {
                      categorizedAmenities[category] = [];
                    }
                    categorizedAmenities[category].push(amenity);
                  });
                  
                  // Kategori sıralaması
                  const categoryOrder = [
                    t.amenityCategories?.basicAmenities || 'Temel Olanaklar',
                    t.amenityCategories?.kitchen || 'Mutfak',
                    t.amenityCategories?.bathroom || 'Banyo',
                    t.amenityCategories?.comfort || 'Konfor',
                    t.amenityCategories?.security || 'Güvenlik',
                    t.amenityCategories?.parkingTransport || 'Otopark ve Ulaşım',
                    'Eğlence',
                    'Diğer'
                  ];
                  
                  return categoryOrder.map(category => {
                    const amenities = categorizedAmenities[category];
                    if (!amenities || amenities.length === 0) return null;
                    
                    return (
                      <div key={category} className="bg-gray-50 rounded-xl p-4 md:p-6">
                        <h4 className="font-semibold text-[#0a2e23] mb-3 md:mb-4 text-base md:text-lg">{category}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                          {amenities.map((amenity, index) => {
                            const IconComponent = amenityIcons[amenity as keyof typeof amenityIcons];
                            const Icon = IconComponent || Check;
                            
                            return (
                              <div key={index} className="flex items-center gap-3 bg-white p-2 md:p-3 rounded-lg">
                                <Icon className="text-[#0a2e23] flex-shrink-0" size={18} />
                                <span className="text-xs md:text-sm text-gray-700">{translateAmenity(amenity, currentLang)}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }).filter(Boolean);
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DetailPage;