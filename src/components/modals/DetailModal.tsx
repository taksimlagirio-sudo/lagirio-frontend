import React, { useState, useEffect, useRef } from 'react';
import {
  X, Heart, Share2, ChevronLeft, ChevronRight, Camera,
  MapPin, Users, Clock, Bed, Bath, Home, ArrowRight,
  Check, Calendar, Maximize2
} from 'lucide-react';
import { amenityIcons } from '../../utils/constants';
import { pricingAPI } from '../../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { favoritesAPI } from '../../utils/api';
import { translateAmenity } from '../../utils/amenityTranslations';

interface ItemImage {
  url: string;
  roomType?: string;
}

interface Item {
  id: string | number;
  _id?: string;
  title: string;
  translations?: {  // ← EKLE
    tr?: { title?: string; description?: string };
    en?: { title?: string; description?: string };
    ar?: { title?: string; description?: string };
    ru?: { title?: string; description?: string };
    [key: string]: { title?: string; description?: string } | undefined;
  };
  images: ItemImage[] | string[];
  internalCode?: string;
  basePrice?: number;
  price?: number;
  description: string;
  neighborhood?: string;
  district?: string;
  meetingPoint?: string;
  capacity?: number;
  maxCapacity?: number;
  rooms?: number;
  bathrooms?: number;
  size?: number;
  amenities?: string[];
  duration?: string;
  maxPeople?: number;
  defaultMinStay?: number;
  defaultAdultPriceIncrease?: number;
}

interface DetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: Item | null;
  itemType: 'apartments' | 'tours' | null;
  currentLang: string;
  translations: any;
  onDetailNavigation: (scrollToReservation: boolean) => void;
  searchParams?: {
    checkIn: string;
    checkOut: string;
    adults: number;
    children: number;
    childrenAgeGroups?: {
      above7: number;
      between2And7: number;
      under2: number;
    };
  };
  onShowLoginModal?: () => void;
}

const DetailModal: React.FC<DetailModalProps> = ({
  isOpen,
  onClose,
  item,
  itemType,
  currentLang,
  translations,
  onDetailNavigation,
  searchParams,
  onShowLoginModal
}) => {
  const t = translations[currentLang];
  const [isFavorite, setIsFavorite] = useState(false);
  const [showThumbnails, setShowThumbnails] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const { isAuthenticated } = useAuth();
  const [modalImageIndex, setModalImageIndex] = useState(0);
  const [calculatedPrice, setCalculatedPrice] = useState<any>(null);
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  
  // Mobile swipe controls
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const modalRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const touchStartTime = useRef<number>(0);
  
  const isApartment = itemType === 'apartments';
  const apartmentId = item?._id || item?.id?.toString() || '';

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Prevent body scroll when modal open - ESKİ HALİ GİBİ
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Price calculation
  useEffect(() => {
    if (isOpen && isApartment && searchParams?.checkIn && searchParams?.checkOut && item) {
      calculatePrice();
    }
  }, [isOpen, searchParams, item]);

  // Check favorite status
  useEffect(() => {
    if (isOpen && isAuthenticated && item?._id) {
      checkFavoriteStatus();
    }
  }, [isOpen, isAuthenticated, item?._id, itemType]);

  const calculatePrice = async () => {
    try {
      setLoadingPrice(true);
      const response = await pricingAPI.calculatePrice({
        apartmentId,
        checkIn: searchParams!.checkIn,
        checkOut: searchParams!.checkOut,
        adults: searchParams!.adults,
        children: searchParams!.children
      });
      setCalculatedPrice(response);
    } catch (error) {
      console.error('Fiyat hesaplama hatası:', error);
    } finally {
      setLoadingPrice(false);
    }
  };

  const checkFavoriteStatus = async () => {
    try {
      const type = isApartment ? 'apartment' : 'tour';
      const result = await favoritesAPI.checkFavorite(type, item?._id || item?.id?.toString() || '');
      setIsFavorite(result.isFavorite);
    } catch (error) {
      console.error('Favori kontrol hatası:', error);
    }
  };

  const handleToggleFavorite = async () => {
    if (!isAuthenticated) {
      onClose();
      onShowLoginModal?.();
      return;
    }
    
    setFavoriteLoading(true);
    try {
      const id = item?._id || item?.id?.toString() || '';
      const result = isApartment 
        ? await favoritesAPI.toggleApartmentFavorite(id)
        : await favoritesAPI.toggleTourFavorite(id);
      
      setIsFavorite(result.isFavorite);
    } catch (error) {
      console.error('Favori işlemi hatası:', error);
    } finally {
      setFavoriteLoading(false);
    }
  };

  // Touch handlers - GENIŞLETILMIŞ SWIPE ALANI İÇİN
  const handleTouchStart = (e: React.TouchEvent) => {
    // Eğer tıklanan element bir buton, link veya interaktif element ise swipe başlatma
    const target = e.target as HTMLElement;
    const isInteractive = target.closest('button, a, img') || 
                          target.tagName === 'BUTTON' || 
                          target.tagName === 'A' || 
                          target.tagName === 'IMG';
    
    if (isInteractive) {
      return; // İnteraktif elementlerde swipe başlatma
    }
    
    const touch = e.touches[0];
    setStartY(touch.clientY);
    setIsDragging(true);
    touchStartTime.current = Date.now();
    
    if (modalRef.current) {
      modalRef.current.style.transition = 'none';
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const touch = e.touches[0];
    const deltaY = touch.clientY - startY;
    
    // Sadece aşağı kaydırma
    if (deltaY > 0 && modalRef.current) {
      modalRef.current.style.transform = `translateY(${deltaY}px)`;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isDragging || !modalRef.current) return;
    
    setIsDragging(false);
    
    const touch = e.changedTouches[0];
    const deltaY = touch.clientY - startY;
    const velocity = deltaY / (Date.now() - touchStartTime.current);
    
    modalRef.current.style.transition = 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    
    if (velocity > 0.5 || deltaY > 100) {
      modalRef.current.style.transform = 'translateY(100%)';
      setTimeout(onClose, 300);
    } else {
      modalRef.current.style.transform = 'translateY(0)';
    }
  };

  if (!isOpen || !item) return null;

  const title = item!.translations?.[currentLang]?.title || 
                item!.translations?.tr?.title || 
                item!.title;
                
  const description = item!.translations?.[currentLang]?.description || 
                      item!.translations?.tr?.description || 
                      item!.description;

  // MOBILE LAYOUT
  if (isMobile) {
    return (
      <>
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black/60 z-50 transition-opacity"
          onClick={onClose}
        />
        
        {/* Bottom Sheet Modal */}
        <div
          ref={modalRef}
          className="fixed bottom-0 left-0 right-0 bg-white z-50 rounded-t-3xl max-h-[90vh]"
          style={{
            boxShadow: '0 -10px 40px rgba(0,0,0,0.1)',
            transform: 'translateY(0)',
            transition: 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
          }}
        >
          {/* Swipe Handle ve Başlık Alanı - GENIŞLETILMIŞ SWIPE */}
          <div>
            {/* Swipe Alanı - Handle + Başlık */}
            <div 
              className="cursor-grab active:cursor-grabbing"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {/* Swipe Handle */}
              <div className="p-3 pb-0">
                <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto" />
              </div>

              {/* Başlık ve Konum - SWIPE ALANI İÇİNDE */}
              <div className="px-4 pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 mr-2">
                    <h2 className="text-lg font-bold text-gray-900 line-clamp-1">
                      {title}
                    </h2>
                    <div className="flex items-center text-gray-600 mt-0.5">
                      <MapPin size={14} className="mr-1" />
                      <span className="text-xs truncate">
                        {isApartment
                          ? `${item.neighborhood}, ${item.district}`
                          : item.meetingPoint}
                      </span>
                    </div>
                  </div>
                  
                  {/* Butonlar - Touch auto ile korunmuş */}
                  <div className="flex items-center gap-1.5 touch-auto">
                <button
                  onClick={handleToggleFavorite}
                  disabled={favoriteLoading}
                  className="p-2 rounded-full bg-gray-50"
                >
                  {favoriteLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-transparent" />
                  ) : (
                    <Heart
                      size={18}
                      className={`${
                        isFavorite ? "fill-red-500 text-red-500" : "text-gray-600"
                      }`}
                    />
                  )}
                </button>
                <button className="p-2 rounded-full bg-gray-50">
                  <Share2 size={18} className="text-gray-600" />
                </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Horizontal Image Gallery - SWIPE ALANI DIŞINDA */}
            <div className="px-4 pb-3">
              <div className="relative">
              <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4">
                {item.images.map((img: ItemImage | string, index: number) => (
                  <div
                    key={index}
                    className="relative flex-shrink-0"
                    onClick={() => setModalImageIndex(index)}
                  >
                    <img
                      src={typeof img === 'string' ? img : img?.url || '/placeholder.jpg'}
                      alt={`${title} ${index + 1}`}
                      loading="lazy" 
                      className={`w-40 h-28 object-cover rounded-xl ${
                        index === modalImageIndex ? 'ring-2 ring-[#0a2e23]' : ''
                      }`}
                    />
                    {index === 0 && (
                      <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                        <Camera size={12} />
                        <span>{item.images.length}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {/* View All Photos Button */}
              <button
                onClick={() => onDetailNavigation(false)}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-lg"
              >
                <Maximize2 size={16} className="text-gray-700" />
              </button>
              </div>
            </div>
          </div>

          {/* Scrollable Content */}
          <div 
            ref={scrollRef}
            className="overflow-y-auto px-4 pb-28"
            style={{ 
              maxHeight: 'calc(90vh - 280px)',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            {/* Quick Stats */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              {isApartment ? (
                <>
                  <div className="bg-gray-50 rounded-xl p-2.5 text-center">
                    <Users size={16} className="text-gray-600 mx-auto mb-1" />
                    <p className="text-xs font-medium">{item.maxCapacity || item.capacity}</p>
                    <p className="text-[10px] text-gray-500">{t.guests}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-2.5 text-center">
                    <Bed size={16} className="text-gray-600 mx-auto mb-1" />
                    <p className="text-xs font-medium">{item.rooms}</p>
                    <p className="text-[10px] text-gray-500">{t.bedroom}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-2.5 text-center">
                    <Bath size={16} className="text-gray-600 mx-auto mb-1" />
                    <p className="text-xs font-medium">{item.bathrooms || 1}</p>
                    <p className="text-[10px] text-gray-500">{t.bathroom}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-2.5 text-center">
                    <Home size={16} className="text-gray-600 mx-auto mb-1" />
                    <p className="text-xs font-medium">{item.size || 50}</p>
                    <p className="text-[10px] text-gray-500">m²</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-gray-50 rounded-xl p-2.5 text-center col-span-2">
                    <Clock size={16} className="text-gray-600 mx-auto mb-1" />
                    <p className="text-xs font-medium">{item.duration}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-2.5 text-center col-span-2">
                    <Users size={16} className="text-gray-600 mx-auto mb-1" />
                    <p className="text-xs font-medium">Max {item.maxPeople}</p>
                  </div>
                </>
              )}
            </div>

            {/* Description */}
            <div className="mb-4">
              <h3 className="font-semibold text-gray-900 mb-1.5 text-sm">{t.description}</h3>
              <p className={`text-gray-700 text-sm leading-relaxed ${
                !showFullDescription ? 'line-clamp-2' : ''
              }`}>
                {description}
              </p>
              {item.description.length > 100 && (
                <button
                  onClick={() => setShowFullDescription(!showFullDescription)}
                  className="text-[#0a2e23] text-xs font-medium mt-1"
                >
                  {showFullDescription ? t.showLess : t.showMore}
                </button>
              )}
            </div>

            {/* Top Amenities */}
            {isApartment && item.amenities && item.amenities.length > 0 && (
              <div className="mb-4">
                <h3 className="font-semibold text-gray-900 mb-1.5 text-sm">{t.topAmenities}</h3>
                <div className="grid grid-cols-2 gap-2">
                  {item.amenities.slice(0, 4).map((amenity: string, index: number) => {
                    const Icon = amenityIcons[amenity] || Check;
                    return (
                      <div
                        key={index}
                        className="flex items-center gap-2 text-sm text-gray-700"
                      >
                        <Icon size={16} className="text-gray-600" />
                        <span className="text-xs">{translateAmenity(amenity, currentLang)}</span>
                      </div>
                    );
                  })}
                </div>
                {item.amenities.length > 4 && (
                  <button
                    onClick={() => onDetailNavigation(false)}
                    className="text-[#0a2e23] text-xs font-medium mt-2"
                  >
                    +{item.amenities.length - 4} {t.moreAmenities}
                  </button>
                )}
              </div>
            )}

            {/* View Full Details Button */}
            <button
              onClick={() => onDetailNavigation(false)}
              className="w-full flex items-center justify-between bg-gray-50 p-3 rounded-xl mb-4"
            >
              <span className="text-sm font-medium text-gray-700">
                {t.viewDetails}
              </span>
              <ArrowRight size={16} className="text-gray-600" />
            </button>
          </div>

          {/* Fixed Bottom Bar */}
          <div className="absolute bottom-0 left-0 right-0 bg-white border-t p-4 safe-bottom">
            <div className="flex items-center justify-between">
              {/* Price Info */}
              <div>
                {searchParams?.checkIn && searchParams?.checkOut && isApartment ? (
                  loadingPrice ? (
                    <div className="animate-pulse h-10 w-24 bg-gray-200 rounded"></div>
                  ) : calculatedPrice ? (
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-[#0a2e23]">
                          €{calculatedPrice.totalPrice}
                        </span>
                        {calculatedPrice.hasDiscount && (
                          <span className="text-sm text-gray-400 line-through">
                            €{calculatedPrice.totalOriginalPrice}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600">
                        {calculatedPrice.nights} {t.nights}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-medium text-gray-700">{t.fromPrice}</p>
                      <p className="text-xl font-bold text-[#0a2e23]">
                        €{item.basePrice || item.price}
                        <span className="text-xs font-normal text-gray-600">/{t.night}</span>
                      </p>
                    </div>
                  )
                ) : (
                  <div>
                    <p className="text-sm font-medium text-gray-700">{t.fromPrice}</p>
                    <p className="text-xl font-bold text-[#0a2e23]">
                      €{item.basePrice || item.price}
                      <span className="text-xs font-normal text-gray-600">
                        /{isApartment ? t.night : t.person}
                      </span>
                    </p>
                  </div>
                )}
              </div>
              
              {/* Book Now Button */}
              <button
                onClick={() => {
                  onDetailNavigation(true);
                  // Modal kapandıktan sonra scroll
                  setTimeout(() => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }, 300);
                }}
                className="bg-[#0a2e23] text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2"
              >
                <Calendar size={16} />
                <span>{t.bookNow}</span>
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // DESKTOP LAYOUT (Değişmemiş)
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl h-[80vh] overflow-hidden shadow-2xl">
        {/* Header Butonları */}
        <div className="absolute top-4 right-4 z-30 flex items-center gap-2">
          <button
            onClick={handleToggleFavorite}
            disabled={favoriteLoading}
            className="bg-white/90 backdrop-blur-sm p-2.5 rounded-full hover:bg-white transition-all shadow-lg group"
          >
            {favoriteLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-transparent" />
            ) : (
              <Heart
                size={18}
                className={`transition-all ${
                  isFavorite
                    ? "fill-red-500 text-red-500"
                    : "text-gray-700 group-hover:text-red-500"
                }`}
              />
            )}
          </button>
          <button className="bg-white/90 backdrop-blur-sm p-2.5 rounded-full hover:bg-white transition-all shadow-lg">
            <Share2 size={18} className="text-gray-700" />
          </button>
          <button
            onClick={onClose}
            className="bg-white/90 backdrop-blur-sm p-2.5 rounded-full hover:bg-white transition-all shadow-lg group"
          >
            <X
              size={18}
              className="text-gray-700 group-hover:text-gray-900"
            />
          </button>
        </div>
        
        <div className="flex h-full">
          {/* Sol - Büyük Görsel */}
          <div className="w-3/5 relative bg-gray-100">
            <img
              src={typeof item.images[modalImageIndex] === 'string' 
                ? item.images[modalImageIndex] 
                : (item.images[modalImageIndex] as ItemImage)?.url || '/placeholder.jpg'}
              alt={title}
              loading="lazy" 
              className="w-full h-full object-cover"
            />

            {/* Görsel Navigasyon */}
            {item.images.length > 1 && (
              <>
                <button
                  onClick={() =>
                    setModalImageIndex(
                      (prev) =>
                        (prev - 1 + item.images.length) % item.images.length
                    )
                  }
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm rounded-full p-2 hover:bg-white transition-all shadow-lg"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={() =>
                    setModalImageIndex(
                      (prev) => (prev + 1) % item.images.length
                    )
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm rounded-full p-2 hover:bg-white transition-all shadow-lg"
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}

            {/* Görsel Sayacı ve Thumbnail Butonu */}
            <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
              <div className="bg-black/60 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-sm">
                {modalImageIndex + 1} / {item.images.length}
              </div>

              <button
                onClick={() => setShowThumbnails(!showThumbnails)}
                className="bg-black/60 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-sm hover:bg-black/80 transition-all flex items-center gap-2"
              >
                <Camera size={16} />
                <span>{t.showAllPhotos || 'Tüm fotoğrafları göster'}</span>
              </button>
            </div>

            {/* Thumbnail Overlay */}
            {showThumbnails && (
              <div className="absolute inset-0 bg-black/90 z-20 overflow-y-auto p-4">
                <button
                  onClick={() => setShowThumbnails(false)}
                  className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm p-2 rounded-full hover:bg-white/30 transition-all"
                >
                  <X size={20} className="text-white" />
                </button>

                <div className="grid grid-cols-3 gap-2 mt-12">
                  {item.images.map((img: ItemImage | string, index: number) => (
                    <img
                      key={index}
                      src={typeof img === 'string' ? img : img?.url || '/placeholder.jpg'}
                      alt={`${title} ${index + 1}`}
                      loading="lazy" 
                      onClick={() => {
                        setModalImageIndex(index);
                        setShowThumbnails(false);
                      }}
                      className={`w-full h-32 object-cover rounded-lg cursor-pointer transition-all ${
                        index === modalImageIndex
                          ? "ring-2 ring-white"
                          : "hover:opacity-80"
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sağ - Bilgi Alanı */}
          <div
            className={`w-2/5 flex flex-col ${
              isApartment ? "bg-[#f5f0e8]" : "bg-[#fdf6ee]"
            }`}
          >
            <div className="flex-1 p-6 space-y-5 overflow-y-auto">
              {/* Başlık ve Konum */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {title}
                </h2>
                <div className="flex items-center text-gray-700">
                  <MapPin size={16} className="mr-1.5 text-[#0a2e23]" />
                  <span className="text-sm">
                    {isApartment
                      ? `${item.neighborhood}, ${item.district}`
                      : item.meetingPoint}
                  </span>
                </div>
              </div>

              {/* Açıklama */}
              <p className="text-gray-700 text-sm leading-relaxed">
                {description}
              </p>

              {/* Temel Bilgiler */}
              <div className="bg-white/50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-3 text-sm">
                  {t.features}
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {isApartment ? (
                    <>
                      <div className="flex items-center gap-2">
                        <Users size={16} className="text-gray-600" />
                        <span>{item.maxCapacity || item.capacity} {t.guests}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Bed size={16} className="text-gray-600" />
                        <span>{item.rooms} {t.rooms || 'Oda'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Bath size={16} className="text-gray-600" />
                        <span>{item.bathrooms || 1} {t.bathrooms}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Home size={16} className="text-gray-600" />
                        <span>{item.size || 50} m²</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <Clock size={16} className="text-gray-600" />
                        <span>{item.duration}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users size={16} className="text-gray-600" />
                        <span>{t.maximum} {item.maxPeople} {t.person}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Olanaklar */}
              {isApartment && item.amenities && (
                <div className="bg-white/50 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 text-sm">
                    {t.amenities}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {item.amenities.slice(0, 5).map((amenity: string, index: number) => {
                      const Icon = amenityIcons[amenity] || Check;
                      return (
                        <div
                          key={index}
                          className="flex items-center gap-1 bg-white/70 px-2 py-1 rounded-lg text-xs"
                        >
                          <Icon size={14} className="text-gray-600" />
                          <span>{translateAmenity(amenity, currentLang)}</span>
                        </div>
                      );
                    })}
                    {item.amenities.length > 5 && (
                      <span className="text-xs text-gray-600">
                        +{item.amenities.length - 5} {t.more || 'daha'}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Alt Rezervasyon Alanı - Sabit */}
            <div className="border-t bg-white p-5 space-y-4">
              {/* Fiyat */}
              <div className="text-right">
                {searchParams?.checkIn && searchParams?.checkOut && isApartment ? (
                  loadingPrice ? (
                    <div className="animate-pulse">
                      <div className="h-8 bg-gray-200 rounded w-24"></div>
                    </div>
                  ) : calculatedPrice ? (
                    <div>
                      {/* İndirim varsa orijinal fiyatı göster */}
                      {calculatedPrice.hasDiscount && calculatedPrice.totalOriginalPrice && (
                        <div className="text-2xl text-gray-400 line-through">
                          €{calculatedPrice.totalOriginalPrice}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-end">
                        <span className="text-3xl font-bold text-[#0a2e23]">
                          €{calculatedPrice.totalPrice}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        {calculatedPrice.nights} {t.nightsTotal || 'gece için toplam'}
                      </div>
                      <div className="text-xs text-gray-500">
                        €{calculatedPrice.pricePerNight}/{t.perNight}
                      </div>
                      {searchParams.adults > 1 && (
                        <div className="text-xs text-blue-600 mt-1">
                          {searchParams.adults} {t.forAdults || 'yetişkin için'}
                        </div>
                      )}
                    </div>
                  ) : null
                ) : (
                  <div>
                    <p className="text-base font-medium text-gray-700">
                      {t.selectDateForPrice || 'Fiyat için tarih seçin'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {t.findOutNow || 'Hemen öğrenin'}
                    </p>
                  </div>
                )}
              </div>

              {/* Butonlar */}
              <div className="space-y-2">
                <button
                  onClick={() => onDetailNavigation(false)}
                  className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                >
                  {t.viewDetails}
                </button>

                <div className="mt-6 flex justify-center">
                  <button
                    onClick={() => {
                      onDetailNavigation(true);
                      setTimeout(() => {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }, 300);
                    }}
                    className="w-full max-w-sm bg-[#0a2e23] text-white px-6 py-3 rounded-xl hover:bg-[#0f4a3a] transition-colors font-medium flex items-center justify-center space-x-2"
                  >
                    <Calendar size={20} />
                    <span>{t.bookNow}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailModal;