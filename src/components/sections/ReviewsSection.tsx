import React, { useState, useEffect, useRef } from 'react';
import { Star, MapPin, Calendar, ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { Link } from 'react-router-dom';

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
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  // Platform Logos
  const platformLogos: { [key: string]: string } = {
    google: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Google_Favicon_2025.svg/800px-Google_Favicon_2025.svg.png",
    airbnb: "https://download.logo.wine/logo/Airbnb/Airbnb-Logo.wine.png",
    booking: "https://logo-marque.com/wp-content/uploads/2021/08/Booking.com-Logo.png",
    tripadvisor: "https://static.tacdn.com/img2/brand_refresh/Tripadvisor_logomark.svg"
  };

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

  // Otomatik geçiş
  useEffect(() => {
    if (!isPaused && reviews.length > 1) {
      autoPlayRef.current = setTimeout(() => {
        handleNext();
      }, 5000);
    }
    
    return () => {
      if (autoPlayRef.current) {
        clearTimeout(autoPlayRef.current);
      }
    };
  }, [currentIndex, reviews.length, isPaused]);

  const handleNext = () => {
    if (isTransitioning || reviews.length === 0) return;
    
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % reviews.length);
      setIsTransitioning(false);
    }, 300);
  };

  const handlePrev = () => {
    if (isTransitioning || reviews.length === 0) return;
    
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
      setIsTransitioning(false);
    }, 300);
  };

  const handleDotClick = (index: number) => {
    if (isTransitioning || index === currentIndex) return;
    
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex(index);
      setIsTransitioning(false);
    }, 300);
  };

  // Yıldız render
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-2">
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              size={16}
              className={star <= rating ? 'fill-[#ff9800] text-[#ff9800]' : 'text-white/30'}
            />
          ))}
        </div>
        <span className="text-white font-semibold text-sm">
          {rating.toFixed(1)}
        </span>
      </div>
    );
  };

  // Avatar baş harfleri
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Yorum metnini al
  const getReviewComment = (review: Review) => {
    if (review.translations) {
      const langComment = review.translations[currentLang as keyof typeof review.translations]?.comment;
      if (langComment) return langComment;
    }
    return review.comment;
  };

  // Tarih formatla - Backend'den Türkçe gelen ayları çevir
  const formatDate = (review: Review) => {
    // Türkçe ay isimlerinden İngilizce key'lere map
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
      // Backend'den gelen Türkçe ay ismini al ve lowercase yap
      const turkishMonth = review.stayDate.month.toLowerCase();
      
      // İngilizce key'i bul
      const englishKey = monthMap[turkishMonth];
      
      // Mevcut dile göre çeviriyi al
      let translatedMonth = review.stayDate.month; // fallback olarak orijinal
      
      if (englishKey) {
        // translations.ts'den doğru çeviriyi al
        translatedMonth = t[englishKey] || review.stayDate.month;
      }
      
      return `${translatedMonth} ${review.stayDate.year}`;
    }
    
    // Eğer reviewDate kullanılacaksa
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

  // Daire link'ini oluştur
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
      <section className="relative py-20 overflow-hidden bg-gradient-to-br from-[#faf5f0] via-white to-[#fff8f0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#ff9800] to-[#f57c00] bg-clip-text text-transparent animate-pulse">
              {t?.guestReviews || 'Misafir Yorumları'}
            </h2>
          </div>
          <div className="flex items-center justify-center h-[450px]">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#ff9800] border-t-transparent"></div>
          </div>
        </div>
      </section>
    );
  }

  // Error state
  if (error) {
    return (
      <section className="relative py-20 overflow-hidden bg-gradient-to-br from-[#faf5f0] via-white to-[#fff8f0]">
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
  if (!currentReview) return null;

  return (
    <section className="relative py-20 overflow-hidden bg-gradient-to-br from-[#faf5f0] via-white to-[#fff8f0]">
      {/* Yaratıcı Arka Plan Desenleri */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Animasyonlu Dalgalar */}
        <div className="absolute top-0 left-0 right-0 h-64 opacity-10">
          <svg viewBox="0 0 1200 200" className="absolute inset-0 w-full h-full">
            <path
              d="M0,100 C150,60 350,140 600,100 C850,60 1050,140 1200,100 L1200,200 L0,200 Z"
              fill="#ff9800"
              className="animate-pulse"
            />
          </svg>
        </div>
        
        {/* Köşe Dekorasyon */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#ff9800]/10 to-transparent rounded-full transform translate-x-32 -translate-y-32"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-[#2d5a4d]/10 to-transparent rounded-full transform -translate-x-48 translate-y-48"></div>
        
        {/* Dot Pattern */}
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
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-[#ff9800] via-[#f57c00] to-[#ff9800] bg-clip-text text-transparent mb-4">
            {t?.guestReviews || 'Misafir Yorumları'}
          </h2>
          <p className="text-gray-600 text-lg">
            {t?.reviewsSubtitle || 'Değerli misafirlerimizin deneyimleri'}
          </p>
          <div className="flex items-center justify-center gap-3 mt-4">
            <div className="h-px w-12 bg-[#2d5a4d]/30"></div>
            <div className="w-2 h-2 rounded-full bg-[#ff9800]"></div>
            <div className="h-px w-12 bg-[#2d5a4d]/30"></div>
          </div>
        </div>

        {/* Ana Container */}
        <div 
          className="relative max-w-6xl mx-auto"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Navigation Arrows */}
          {reviews.length > 1 && (
            <>
              <button
                onClick={handlePrev}
                className="absolute -left-4 md:-left-14 top-1/2 -translate-y-1/2 z-30
                         bg-white shadow-xl rounded-full p-3 md:p-4
                         transition-all hover:scale-110 hover:shadow-2xl hover:bg-[#ff9800] group"
                aria-label={t?.previousReview || 'Önceki yorum'}
              >
                <ChevronLeft size={22} className="text-[#2d5a4d] group-hover:text-white transition-colors" />
              </button>
              <button
                onClick={handleNext}
                className="absolute -right-4 md:-right-14 top-1/2 -translate-y-1/2 z-30
                         bg-white shadow-xl rounded-full p-3 md:p-4
                         transition-all hover:scale-110 hover:shadow-2xl hover:bg-[#ff9800] group"
                aria-label={t?.nextReview || 'Sonraki yorum'}
              >
                <ChevronRight size={22} className="text-[#2d5a4d] group-hover:text-white transition-colors" />
              </button>
            </>
          )}

          {/* Review Card */}
          <div className={`
            relative rounded-3xl overflow-hidden shadow-2xl
            transition-all duration-500 transform
            ${isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}
            h-[450px] md:h-[500px]
          `}>
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
              <div className="w-full md:w-2/3 lg:w-7/12 p-8 md:p-10 lg:p-12">
                {/* Yorum Metni */}
                <div className="mb-8">
                  <Quote className="text-[#ff9800]/70 mb-4" size={36} />
                  <blockquote>
                    <p className="text-white text-lg md:text-xl lg:text-2xl font-light leading-relaxed line-clamp-4">
                      {getReviewComment(currentReview)}
                    </p>
                  </blockquote>
                </div>

                {/* Müşteri Bilgileri ve Rating */}
                <div className="space-y-6">
                  {/* Rating */}
                  <div>
                    {renderStars(currentReview.rating || 5)}
                  </div>

                  {/* Müşteri ve Platform Logo - AYNI HİZADA */}
                  <div className="flex items-center justify-between">
                    {/* Sol: Müşteri Bilgileri */}
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="flex-shrink-0">
                        {currentReview.customerAvatar ? (
                          <img
                            src={currentReview.customerAvatar}
                            alt={currentReview.customerName}
                            className="w-14 h-14 rounded-full object-cover ring-3 ring-white/30 shadow-lg"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#ff9800] to-[#f57c00] 
                                        flex items-center justify-center text-white font-bold shadow-lg">
                            {getInitials(currentReview.customerName || '')}
                          </div>
                        )}
                      </div>

                      {/* İsim ve Detaylar */}
                      <div>
                        <h4 className="font-bold text-white text-lg">
                          {currentReview.customerName}
                        </h4>
                        <div className="flex flex-wrap items-center gap-3 text-white/70 text-sm">
                          {currentReview.customerLocation && (
                            <span className="flex items-center gap-1">
                              <MapPin size={14} />
                              {currentReview.customerLocation}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar size={14} />
                            {formatDate(currentReview)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Sağ: Platform Logo */}
                    {platformLogos[currentReview.platform] && (
                      <div className="flex-shrink-0">
                        <img 
                          src={platformLogos[currentReview.platform]}
                          alt=""
                          className={`${
                            currentReview.platform === 'airbnb' 
                              ? 'h-12 md:h-16'  // Airbnb daha büyük
                              : 'h-10 md:h-12'
                          } w-auto opacity-90 hover:opacity-100 transition-opacity`}
                          style={{
                            filter: currentReview.platform === 'booking' 
                              ? 'brightness(0) invert(1)' 
                              : undefined
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Daire Bilgisi - Tıklanabilir */}
                  {currentReview.apartment && (
                    <div className="pt-4 border-t border-white/20">
                      <p className="text-white/60 text-xs uppercase tracking-wider mb-1">
                        {t?.accommodation || 'Konaklama'}
                      </p>
                      <Link
                        to={getApartmentLink(currentReview.apartment)}
                        className="text-white font-medium hover:text-[#ff9800] transition-colors inline-flex items-center gap-1 group"
                      >
                        {currentReview.apartment.translations?.[currentLang]?.title || currentReview.apartment.title}
                        <ChevronRight size={16} className="transition-transform group-hover:translate-x-1" />
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pagination Dots */}
        {reviews.length > 1 && (
          <div className="flex justify-center items-center gap-3 mt-10">
            {reviews.map((_, idx) => (
              <button
                key={idx}
                onClick={() => handleDotClick(idx)}
                className={`
                  transition-all duration-300 rounded-full
                  ${currentIndex === idx 
                    ? 'w-10 h-2.5 bg-gradient-to-r from-[#ff9800] to-[#f57c00]' 
                    : 'w-2.5 h-2.5 bg-[#2d5a4d]/30 hover:bg-[#2d5a4d]/50'}
                `}
                aria-label={`${t?.review || 'Yorum'} ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default ReviewsSection;