import React, { useState, useEffect, useRef } from 'react';
import { Star, MapPin, Calendar, ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { Link } from 'react-router-dom';
import useSwipeGesture from '../../hooks/useSwipeGesture';

interface Review {
  _id: string;
  customerName: string;
  customerLocation?: string;
  customerAvatar?: string;
  rating: number;
  comment: string;
  platform: string;
  platformDisplayName?: string;
  platformColors?: {
    bg: string;
    border: string;
    text: string;
  };
  apartment?: {
    _id: string;
    title: string;
    images: any[];
    translations?: any;
    slugs?: {
      tr?: string;
      en?: string;
      ar?: string;
      ru?: string;
    };
  };
  reviewDate: string;
  stayDate?: {
    month: string;
    year: number;
  };
  translations?: {
    tr?: { comment: string };
    en?: { comment: string };
    ar?: { comment: string };
    ru?: { comment: string };
  };
}

interface ReviewsSectionProps {
  translations: any;
  currentLang: string;
  siteImages?: any;
}

const ReviewsSection: React.FC<ReviewsSectionProps> = ({
  translations,
  currentLang,
}) => {
  const t = translations[currentLang];
  const [reviews, setReviews] = useState<Review[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const autoPlayRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isSwipeHintVisible, setIsSwipeHintVisible] = useState(true);

  // Platform Logos
  const platformLogos: { [key: string]: string } = {
    google: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Google_Favicon_2025.svg/800px-Google_Favicon_2025.svg.png",
    airbnb: "https://download.logo.wine/logo/Airbnb/Airbnb-Logo.wine.png",
    booking: "https://logo-marque.com/wp-content/uploads/2021/08/Booking.com-Logo.png",
    tripadvisor: "https://static.tacdn.com/img2/brand_refresh/Tripadvisor_logomark.svg"
  };

  // SWIPE GESTURE HOOK
  const {
    swipeX,
    isDragging,
    handlers,
    getSwipeTransform,
    getSwipeOpacity
  } = useSwipeGesture({
    onSwipeLeft: () => {
      if (reviews.length > 1) {
        handleNext();
      }
    },
    onSwipeRight: () => {
      if (reviews.length > 1) {
        handlePrev();
      }
    },
    enabled: isMobile,
    threshold: 25,
    velocityThreshold: 0.15
  });

  // Mobil kontrolü
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Swipe hint'i otomatik gizle
  useEffect(() => {
    if (isSwipeHintVisible && isMobile) {
      const timer = setTimeout(() => {
        setIsSwipeHintVisible(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isSwipeHintVisible, isMobile]);

  // Yorumları yükle
  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002/api';
      const response = await fetch(`${API_URL}/reviews/random?limit=6`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (Array.isArray(data)) {
        setReviews(data);
      } else if (data && typeof data === 'object' && Array.isArray(data.reviews)) {
        setReviews(data.reviews);
      } else {
        console.warn('Unexpected data format:', data);
        setReviews([]);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setError(t?.errorLoading || 'Yorumlar yüklenirken bir hata oluştu.');
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Timer'ı sıfırlama fonksiyonu
  const resetTimer = (delay: number = 5000) => {
    if (autoPlayRef.current) {
      clearTimeout(autoPlayRef.current);
    }
    
    if (!isPaused && reviews.length > 1) {
      autoPlayRef.current = setTimeout(() => {
        handleNext();
      }, delay);
    }
  };

  // Otomatik geçiş
  useEffect(() => {
    if (!isPaused && reviews.length > 1 && !isDragging) {
      const delay = isMobile ? 7000 : 5000;
      autoPlayRef.current = setTimeout(() => {
        handleNext();
      }, delay);
    }
    
    return () => {
      if (autoPlayRef.current) {
        clearTimeout(autoPlayRef.current);
      }
    };
  }, [currentIndex, reviews.length, isPaused, isMobile, isDragging]);

  // ANLIK GEÇİŞ - setTimeout KALDIRILDI
  const handleNext = () => {
    if (reviews.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % reviews.length);
    resetTimer(8000);
  };

  const handlePrev = () => {
    if (reviews.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
    resetTimer(8000);
  };

  const handleDotClick = (index: number) => {
    if (index === currentIndex) return;
    setCurrentIndex(index);
    resetTimer(isMobile ? 8000 : 5000);
  };

  // GÜNCEL getCardStyle - Arkadaki kartlar tıklanabilir
  // getCardStyle fonksiyonunu düzelt
    const getCardStyle = (index: number) => {
    const offset = index - currentIndex;
    
    // Wrap-around için düzeltme
    let visualOffset = offset;
    if (reviews.length > 1) {
        if (offset > reviews.length / 2) {
        visualOffset = offset - reviews.length;
        } else if (offset < -reviews.length / 2) {
        visualOffset = offset + reviews.length;
        }
    }
    
    const normalizedSwipe = swipeX / 250;
    
    // Görünmeyen kartlar
    if (Math.abs(visualOffset) > 2) {
        return {
        opacity: 0,
        transform: 'translateZ(-200px) scale(0.5)',
        pointerEvents: 'none' as const,
        display: 'none'
        };
    }
    
    // Ana kart
    if (visualOffset === 0) {
        return {
        zIndex: 30,
        opacity: isDragging ? getSwipeOpacity() : 1,
        transform: isDragging 
            ? getSwipeTransform('translate3d(0, 0, 0)')
            : 'translate3d(0, 0, 0) rotateY(0deg)',
        transition: isDragging ? 'none' : 'all 0.25s ease-out',
        willChange: isDragging ? 'transform, opacity' : 'auto',
        cursor: isDragging ? 'grabbing' : 'grab'
        };
    }
    // Sonraki kart - TIKLANABİLİR
    else if (visualOffset === 1) {
        const progress = Math.max(0, -normalizedSwipe);
        return {
        zIndex: 20,
        opacity: 0.75 + progress * 0.25,
        transform: `
            translate3d(${70 - progress * 70}px, 0, -30px) 
            rotateY(${-10 + progress * 10}deg) 
            scale(${0.92 + progress * 0.08})
        `,
        transition: isDragging ? 'none' : 'all 0.25s ease-out',
        pointerEvents: 'auto' as const,
        cursor: 'pointer'
        };
    }
    // Önceki kart - TIKLANABİLİR
    else if (visualOffset === -1) {
        const progress = Math.max(0, normalizedSwipe);
        return {
        zIndex: 20,
        opacity: 0.75 + progress * 0.25,
        transform: `
            translate3d(${-70 + progress * 70}px, 0, -30px) 
            rotateY(${10 - progress * 10}deg) 
            scale(${0.92 + progress * 0.08})
        `,
        transition: isDragging ? 'none' : 'all 0.25s ease-out',
        pointerEvents: 'auto' as const,
        cursor: 'pointer'
        };
    }
    // Diğer arka plan kartları
    else {
        return {
        zIndex: 10,
        opacity: 0.3,
        transform: `
            translate3d(${visualOffset * 40}px, 0, -60px) 
            rotateY(${visualOffset * -6}deg) 
            scale(0.8)
        `,
        transition: 'all 0.25s ease-out',
        pointerEvents: 'none' as const,
        };
    }
    };

  // Helper fonksiyonlar
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-2">
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              size={isMobile ? 14 : 16}  // Mobilde daha küçük yıldızlar
              className={star <= rating ? 'fill-[#ff9800] text-[#ff9800]' : 'text-white/30'}
            />
          ))}
        </div>
        <span className="text-white font-semibold text-xs md:text-sm">
          {rating.toFixed(1)}
        </span>
      </div>
    );
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getReviewComment = (review: Review) => {
    if (review.translations) {
      const langComment = review.translations[currentLang as keyof typeof review.translations]?.comment;
      if (langComment) return langComment;
    }
    return review.comment;
  };

  const formatDate = (review: Review) => {
    const monthMap: { [key: string]: string } = {
      'ocak': 'january',
      'şubat': 'february', 
      'mart': 'march',
      'nisan': 'april',
      'mayıs': 'may',
      'haziran': 'june',
      'temmuz': 'july',
      'ağustos': 'august',
      'eylül': 'september',
      'ekim': 'october',
      'kasım': 'november',
      'aralık': 'december'
    };

    if (review.stayDate?.month && review.stayDate?.year) {
      const turkishMonth = review.stayDate.month.toLowerCase();
      const englishKey = monthMap[turkishMonth];
      let translatedMonth = review.stayDate.month;
      
      if (englishKey) {
        translatedMonth = t[englishKey] || review.stayDate.month;
      }
      
      return `${translatedMonth} ${review.stayDate.year}`;
    }
    
    try {
      const date = new Date(review.reviewDate);
      const monthKeys = ['january', 'february', 'march', 'april', 'may', 'june', 
                         'july', 'august', 'september', 'october', 'november', 'december'];
      const monthKey = monthKeys[date.getMonth()];
      const translatedMonth = t[monthKey] || '';
      
      return `${translatedMonth} ${date.getFullYear()}`;
    } catch (e) {
      return '';
    }
  };

  const getApartmentLink = (apartment: any) => {
    if (apartment.slugs && apartment.slugs[currentLang]) {
      const langPrefix = currentLang === 'tr' ? '' : `/${currentLang}`;
      return `${langPrefix}/apartment/${apartment.slugs[currentLang]}`;
    } else {
      const langPrefix = currentLang === 'tr' ? '' : `/${currentLang}`;
      return `${langPrefix}/detail/apartments/${apartment._id}`;
    }
  };

  // Loading state
  if (loading) {
    return (
      <section className="relative py-12 md:py-20 overflow-hidden bg-gradient-to-br from-[#faf5f0] via-white to-[#fff8f0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-[#ff9800] to-[#f57c00] bg-clip-text text-transparent animate-pulse">
              {t?.guestReviews || 'Misafir Yorumları'}
            </h2>
          </div>
          <div className="flex items-center justify-center h-[350px] md:h-[450px]">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#ff9800] border-t-transparent"></div>
          </div>
        </div>
      </section>
    );
  }

  // Error state
  if (error) {
    return (
      <section className="relative py-12 md:py-20 overflow-hidden bg-gradient-to-br from-[#faf5f0] via-white to-[#fff8f0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-500 mb-4">{error}</p>
            <button 
              onClick={fetchReviews}
              className="px-6 py-3 bg-[#ff9800] text-white rounded-lg hover:bg-[#f57c00] transition-colors"
            >
              {t?.tryAgain || 'Tekrar Dene'}
            </button>
          </div>
        </div>
      </section>
    );
  }

  // No reviews
  if (reviews.length === 0) {
    return null;
  }

  const currentReview = reviews[currentIndex];

  return (
    <section className="relative py-12 md:py-20 overflow-hidden bg-gradient-to-br from-[#faf5f0] via-white to-[#fff8f0]">
      {/* Arka Plan Desenleri */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-64 opacity-10">
          <svg viewBox="0 0 1200 200" className="absolute inset-0 w-full h-full">
            <path
              d="M0,100 C150,60 350,140 600,100 C850,60 1050,140 1200,100 L1200,200 L0,200 Z"
              fill="#ff9800"
              className="animate-pulse"
            />
          </svg>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#ff9800]/10 to-transparent rounded-full transform translate-x-32 -translate-y-32"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-[#2d5a4d]/10 to-transparent rounded-full transform -translate-x-48 translate-y-48"></div>
        <div 
          className="absolute inset-0 opacity-[0.02]" 
          style={{
            backgroundImage: 'radial-gradient(circle, #ff9800 1px, transparent 1px)',
            backgroundSize: '30px 30px'
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Başlık */}
        <div className="text-center mb-8 md:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-[#ff9800] via-[#f57c00] to-[#ff9800] bg-clip-text text-transparent mb-2 md:mb-4">
            {t?.guestReviews || 'Misafir Yorumları'}
          </h2>
          <p className="text-base md:text-lg text-gray-600 px-4">
            {t?.reviewsSubtitle || 'Değerli misafirlerimizin deneyimleri'}
          </p>
          <div className="flex items-center justify-center gap-3 mt-3 md:mt-4">
            <div className="h-px w-12 bg-[#2d5a4d]/30"></div>
            <div className="w-2 h-2 rounded-full bg-[#ff9800]"></div>
            <div className="h-px w-12 bg-[#2d5a4d]/30"></div>
          </div>
        </div>

        {/* Ana Container */}
        <div 
          className="relative max-w-6xl mx-auto"
          onMouseEnter={() => !isMobile && setIsPaused(true)}
          onMouseLeave={() => !isMobile && setIsPaused(false)}
        >
          {/* Desktop Navigation Arrows */}
          {reviews.length > 1 && !isMobile && (
            <>
              <button
                onClick={handlePrev}
                className="absolute -left-4 md:-left-14 top-1/2 -translate-y-1/2 z-30
                         bg-white shadow-xl rounded-full p-3 md:p-4
                         transition-all hover:scale-110 hover:shadow-2xl hover:bg-[#ff9800] group
                         hidden md:flex items-center justify-center"
                aria-label={t?.previousReview || 'Önceki yorum'}
              >
                <ChevronLeft size={22} className="text-[#2d5a4d] group-hover:text-white transition-colors" />
              </button>
              <button
                onClick={handleNext}
                className="absolute -right-4 md:-right-14 top-1/2 -translate-y-1/2 z-30
                         bg-white shadow-xl rounded-full p-3 md:p-4
                         transition-all hover:scale-110 hover:shadow-2xl hover:bg-[#ff9800] group
                         hidden md:flex items-center justify-center"
                aria-label={t?.nextReview || 'Sonraki yorum'}
              >
                <ChevronRight size={22} className="text-[#2d5a4d] group-hover:text-white transition-colors" />
              </button>
            </>
          )}

          {/* MOBILE 3D STACK VIEW */}
          {isMobile ? (
            <div 
              className="relative h-[350px] sm:h-[400px] touch-none"
              style={{
                perspective: '1200px',
                perspectiveOrigin: '50% 50%',
                transformStyle: 'preserve-3d'
              }}
              {...handlers}
              onTouchStart={(e) => {
                setIsSwipeHintVisible(false);
                handlers.onTouchStart(e);
              }}
            >
              {reviews.map((review, idx) => {
                const cardStyle = getCardStyle(idx);
                const visualOffset = idx - currentIndex;
                
                // Wrap-around düzeltmesi
                let correctedOffset = visualOffset;
                if (reviews.length > 1) {
                  if (visualOffset > reviews.length / 2) {
                    correctedOffset = visualOffset - reviews.length;
                  } else if (visualOffset < -reviews.length / 2) {
                    correctedOffset = visualOffset + reviews.length;
                  }
                }
                
                if (cardStyle.display === 'none') return null;
                
                return (
                  <div
                    key={review._id}
                    className="absolute inset-x-4 rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl h-full transform-gpu"
                    style={{
                      ...cardStyle,
                      transformStyle: 'preserve-3d'
                    }}
                    onClick={() => {
                      // ARKADAKI KARTLARA TIKLAMA
                      if (correctedOffset === 1) {
                        handleNext();
                      } else if (correctedOffset === -1) {
                        handlePrev();
                      }
                    }}
                  >
                    {/* Swipe Hint */}
                    {idx === currentIndex && isSwipeHintVisible && reviews.length > 1 && (
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 pointer-events-none animate-pulse">
                        <div className="bg-black/40 backdrop-blur-sm rounded-full px-6 py-3 flex items-center gap-2 shadow-lg">
                          <ChevronLeft size={18} className="text-white" />
                          <span className="text-white text-sm font-medium">Kaydır</span>
                          <ChevronRight size={18} className="text-white" />
                        </div>
                      </div>
                    )}

                    {/* Arka Plan Görsel */}
                    <div className="absolute inset-0">
                      {review.apartment?.images?.[0] ? (
                        <>
                          <img
                            src={review.apartment.images[0].url || review.apartment.images[0]}
                            alt={review.apartment.title}
                            className="w-full h-full object-cover"
                            draggable={false}
                          />
                          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-transparent"></div>
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
                        </>
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#2d5a4d]/95 to-[#2d5a4d]/80"></div>
                      )}
                    </div>

                    {/* İçerik */}
                    <div className="relative z-10 h-full flex items-center pointer-events-none">
                      <div className="w-full md:w-2/3 lg:w-7/12 p-4 sm:p-6 md:p-10 lg:p-12">
                        {/* Yorum Metni */}
                        <div className="mb-4 sm:mb-5 md:mb-8">
                          <Quote className="text-[#ff9800]/70 mb-2 sm:mb-3 md:mb-4" size={isMobile ? 20 : 24} />
                          <blockquote>
                            <p className="text-white text-xs sm:text-sm md:text-xl lg:text-2xl font-light leading-relaxed line-clamp-5 sm:line-clamp-4">
                              {getReviewComment(review)}
                            </p>
                          </blockquote>
                        </div>

                        {/* Müşteri Bilgileri ve Rating */}
                        <div className="space-y-2 sm:space-y-3 md:space-y-6">
                          {/* Rating */}
                          <div>
                            {renderStars(review.rating || 5)}
                          </div>

                          {/* Müşteri ve Platform Logo */}
                          <div className="flex items-center justify-between gap-2">
                            {/* Sol: Müşteri Bilgileri */}
                            <div className="flex items-center gap-2 sm:gap-3 md:gap-4 min-w-0 flex-1">
                              {/* Avatar - MOBİLDE DAHA KÜÇÜK */}
                              <div className="flex-shrink-0">
                                {review.customerAvatar ? (
                                  <img
                                    src={review.customerAvatar}
                                    alt={review.customerName}
                                    className="w-8 sm:w-10 md:w-14 h-8 sm:h-10 md:h-14 rounded-full object-cover ring-2 sm:ring-3 ring-white/30 shadow-lg"
                                    draggable={false}
                                  />
                                ) : (
                                  <div className="w-8 sm:w-10 md:w-14 h-8 sm:h-10 md:h-14 rounded-full bg-gradient-to-br from-[#ff9800] to-[#f57c00] 
                                                flex items-center justify-center text-white font-bold shadow-lg text-[10px] sm:text-xs md:text-base">
                                    {getInitials(review.customerName || '')}
                                  </div>
                                )}
                              </div>

                              {/* İsim ve Detaylar - MOBİLDE DAHA KÜÇÜK */}
                              <div className="min-w-0 flex-1">
                                <h4 className="font-bold text-white text-xs sm:text-sm md:text-lg truncate">
                                  {review.customerName}
                                </h4>
                                <div className="flex flex-wrap items-center gap-1 sm:gap-2 md:gap-3 text-white/70 text-[10px] md:text-sm">
                                  {review.customerLocation && (
                                    <span className="flex items-center gap-0.5 sm:gap-1">
                                      <MapPin size={10} className="sm:w-3 sm:h-3 md:w-3.5 md:h-3.5 flex-shrink-0" />
                                      <span className="truncate">{review.customerLocation}</span>
                                    </span>
                                  )}
                                  <span className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
                                    <Calendar size={10} className="sm:w-3 sm:h-3 md:w-3.5 md:h-3.5" />
                                    {formatDate(review)}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Sağ: Platform Logo - MOBİLDE DAHA BÜYÜK */}
                            {platformLogos[review.platform] && (
                              <div className="flex-shrink-0">
                                <img 
                                  src={platformLogos[review.platform]}
                                  alt=""
                                  className={`${
                                    review.platform === 'airbnb' 
                                      ? 'h-12 sm:h-10 md:h-12 lg:h-16'  // Mobilde h-12
                                      : review.platform === 'booking'
                                      ? 'h-10 sm:h-8 md:h-10 lg:h-12'   // Booking mobilde h-10
                                      : 'h-8 sm:h-8 md:h-10 lg:h-12'    // Diğerleri mobilde h-8
                                  } w-auto opacity-90`}
                                  style={{
                                    filter: review.platform === 'booking' 
                                      ? 'brightness(0) invert(1)' 
                                      : undefined
                                  }}
                                  draggable={false}
                                />
                              </div>
                            )}
                          </div>

                          {/* Daire Bilgisi - MOBİLDE DAHA KÜÇÜK */}
                          {review.apartment && (
                            <div className="pt-2 sm:pt-2.5 md:pt-4 border-t border-white/20">
                              <p className="text-white/60 text-[9px] md:text-xs uppercase tracking-wider mb-0.5">
                                {t?.accommodation || 'Konaklama'}
                              </p>
                              <Link
                                to={getApartmentLink(review.apartment)}
                                className="text-white font-medium text-[11px] sm:text-xs md:text-base hover:text-[#ff9800] transition-colors inline-flex items-center gap-0.5 group pointer-events-auto"
                              >
                                <span className="line-clamp-1">
                                  {review.apartment.translations?.[currentLang]?.title || review.apartment.title}
                                </span>
                                <ChevronRight size={10} className="sm:w-3 sm:h-3 md:w-4 md:h-4 transition-transform group-hover:translate-x-1 flex-shrink-0" />
                              </Link>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // DESKTOP VIEW
            <div 
              className="relative rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl
                       h-[350px] sm:h-[400px] md:h-[450px] lg:h-[500px]
                       transition-all duration-300"
            >
              {currentReview && (
                <div className="relative h-full">
                  {/* Arka Plan Görsel */}
                  <div className="absolute inset-0">
                    {currentReview.apartment?.images?.[0] ? (
                      <>
                        <img
                          src={currentReview.apartment.images[0].url || currentReview.apartment.images[0]}
                          alt={currentReview.apartment.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-transparent"></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
                      </>
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#2d5a4d]/95 to-[#2d5a4d]/80"></div>
                    )}
                  </div>

                  {/* İçerik */}
                  <div className="relative z-10 h-full flex items-center">
                    <div className="w-full md:w-2/3 lg:w-7/12 p-4 sm:p-6 md:p-10 lg:p-12">
                      {/* Desktop içeriği aynı... */}
                      {/* Yorum Metni */}
                      <div className="mb-5 sm:mb-6 md:mb-8">
                        <Quote className="text-[#ff9800]/70 mb-2 sm:mb-3 md:mb-4" size={36} />
                        <blockquote>
                          <p className="text-white text-sm sm:text-base md:text-xl lg:text-2xl font-light leading-relaxed line-clamp-4">
                            {getReviewComment(currentReview)}
                          </p>
                        </blockquote>
                      </div>

                      {/* Müşteri Bilgileri */}
                      <div className="space-y-3 sm:space-y-4 md:space-y-6">
                        <div>
                          {renderStars(currentReview.rating || 5)}
                        </div>

                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 sm:gap-3 md:gap-4 min-w-0 flex-1">
                            <div className="flex-shrink-0">
                              {currentReview.customerAvatar ? (
                                <img
                                  src={currentReview.customerAvatar}
                                  alt={currentReview.customerName}
                                  className="w-10 sm:w-12 md:w-14 h-10 sm:h-12 md:h-14 rounded-full object-cover ring-2 sm:ring-3 ring-white/30 shadow-lg"
                                />
                              ) : (
                                <div className="w-10 sm:w-12 md:w-14 h-10 sm:h-12 md:h-14 rounded-full bg-gradient-to-br from-[#ff9800] to-[#f57c00] 
                                              flex items-center justify-center text-white font-bold shadow-lg text-xs sm:text-sm md:text-base">
                                  {getInitials(currentReview.customerName || '')}
                                </div>
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <h4 className="font-bold text-white text-sm sm:text-base md:text-lg truncate">
                                {currentReview.customerName}
                              </h4>
                              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 md:gap-3 text-white/70 text-xs md:text-sm">
                                {currentReview.customerLocation && (
                                  <span className="flex items-center gap-0.5 sm:gap-1">
                                    <MapPin size={11} className="sm:w-3 sm:h-3 md:w-3.5 md:h-3.5 flex-shrink-0" />
                                    <span className="truncate">{currentReview.customerLocation}</span>
                                  </span>
                                )}
                                <span className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
                                  <Calendar size={11} className="sm:w-3 sm:h-3 md:w-3.5 md:h-3.5" />
                                  {formatDate(currentReview)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {platformLogos[currentReview.platform] && (
                            <div className="flex-shrink-0">
                              <img 
                                src={platformLogos[currentReview.platform]}
                                alt=""
                                className={`${
                                  currentReview.platform === 'airbnb' 
                                    ? 'h-8 sm:h-10 md:h-12 lg:h-16'
                                    : 'h-6 sm:h-8 md:h-10 lg:h-12'
                                } w-auto opacity-90`}
                                style={{
                                  filter: currentReview.platform === 'booking' 
                                    ? 'brightness(0) invert(1)' 
                                    : undefined
                                }}
                              />
                            </div>
                          )}
                        </div>

                        {currentReview.apartment && (
                          <div className="pt-2.5 sm:pt-3 md:pt-4 border-t border-white/20">
                            <p className="text-white/60 text-[10px] md:text-xs uppercase tracking-wider mb-0.5 md:mb-1">
                              {t?.accommodation || 'Konaklama'}
                            </p>
                            <Link
                              to={getApartmentLink(currentReview.apartment)}
                              className="text-white font-medium text-xs sm:text-sm md:text-base hover:text-[#ff9800] transition-colors inline-flex items-center gap-1 group"
                            >
                              <span className="line-clamp-1">
                                {currentReview.apartment.translations?.[currentLang]?.title || currentReview.apartment.title}
                              </span>
                              <ChevronRight size={12} className="sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 transition-transform group-hover:translate-x-1 flex-shrink-0" />
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pagination Dots */}
        {reviews.length > 1 && (
          <div className="flex justify-center items-center gap-2 md:gap-3 mt-6 md:mt-10">
            {reviews.map((_, idx) => (
              <button
                key={idx}
                onClick={() => handleDotClick(idx)}
                className={`
                  transition-all duration-300 rounded-full
                  ${currentIndex === idx 
                    ? 'w-8 md:w-10 h-2.5 md:h-2.5 bg-gradient-to-r from-[#ff9800] to-[#f57c00]' 
                    : 'w-2.5 md:w-2.5 h-2.5 md:h-2.5 bg-[#2d5a4d]/30 hover:bg-[#2d5a4d]/50'}
                  ${isMobile ? 'p-2 -m-2' : ''}
                `}
                style={isMobile ? { minWidth: '44px', minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' } : undefined}
                aria-label={`${t?.review || 'Yorum'} ${idx + 1}`}
              />
            ))}
          </div>
        )}

        {/* Mobil Swipe İndikatörü */}
        {isMobile && reviews.length > 1 && (
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              ← {t?.swipeToNavigate || 'Kaydırarak gezin'} →
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default ReviewsSection;