import React, { useState, useEffect, useRef } from 'react';
import { Building, Home, Globe, ChevronLeft, ChevronRight, MapPin, Sparkles, Bed, Users } from 'lucide-react';
import HeroSection from '../components/sections/HeroSection';
import PartnerSection from '../components/sections/PartnerSection';
import OwnersPage from '../pages/OwnersPage';
import { useSEO } from '../utils/seoHelper';
import { apartmentAPI } from '../utils/api';

interface HomePageProps {
  siteImages: {
    heroMain: string;
    heroApartments?: string;
    heroTours?: string;
    heroRentals?: string | string[];
  };
  currentLang: string;
  setCurrentLang: (lang: string) => void;
  translations: any;
  setCurrentView: (view: string) => void;
   setShowLoginModal?: () => void;
  apartments?: any[];
  globalSearchParams?: any;
  setGlobalSearchParams?: (params: any) => void;
  fetchApartments?: () => Promise<void>;
}

const HomePage: React.FC<HomePageProps> = ({
  siteImages,
  currentLang,
  setCurrentLang,
  translations,
  setCurrentView,
  setShowLoginModal = () => {},
  apartments = [],
  globalSearchParams = { checkIn: '', checkOut: '', adults: 1, children: 0, childrenAgeGroups: { above7: 0, between2And7: 0, under2: 0 } },
  setGlobalSearchParams = () => {},
  fetchApartments = async () => {}
}) => {
  const t = translations[currentLang];
  const { updateMetaTags } = useSEO(); // SEO Hook'u kullan
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [slideProgress, setSlideProgress] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldScrollToApartments, setShouldScrollToApartments] = useState(false);
  
  // Rastgele öne çıkan daireler
  const [featuredApartments, setFeaturedApartments] = useState<any[]>([]);
  
  // SEO için meta tag'leri güncelle
  useEffect(() => {
    const seoData = {
      tr: {
        title: 'Taksim Lagirio Residence | Taksim 360 Premium Otel | İstanbul',
        description: 'Taksim Lagirio Residence - Taksim 360\'da lüks konaklama. İstanbul\'un kalbinde, Taksim Meydanı\'na yürüme mesafesinde premium apart otel.',
        keywords: 'taksim lagirio residence, taksim otel, istanbul otel, taksim 360, lagirio',
      },
      en: {
        title: 'Taksim Lagirio Residence | Luxury Hotel in Taksim 360 Istanbul',
        description: 'Experience luxury accommodation at Taksim Lagirio Residence in the heart of Istanbul. Walking distance to Taksim Square.',
        keywords: 'taksim hotel, luxury residence istanbul, taksim square hotel, lagirio',
      },
      ar: {
        title: 'تقسيم لاجيريو ريزيدنس | فندق فاخر في تقسيم 360',
        description: 'تجربة إقامة فاخرة في قلب إسطنبول. على بعد دقائق من ساحة تقسيم.',
        keywords: 'فندق تقسيم, لاجيريو, اسطنبول, تقسيم 360',
      },
      ru: {
        title: 'Taksim Lagirio Residence | Люкс Отель в Таксим 360',
        description: 'Роскошное размещение в самом сердце Стамбула. В пешей доступности от площади Таксим.',
        keywords: 'отель таксим, резиденция стамбул, лагирио, таксим 360',
      }
    };

    const currentSeo = seoData[currentLang as keyof typeof seoData] || seoData.tr;
    
    updateMetaTags({
      title: currentSeo.title,
      description: currentSeo.description,
      keywords: currentSeo.keywords,
      ogImage: siteImages.heroMain,
      ogType: 'hotel',
      canonical: `https://lagirio.com/${currentLang === 'tr' ? '' : currentLang}`
    });

    // Structured Data için JSON-LD
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "Hotel",
      "name": "Taksim Lagirio Residence",
      "alternateName": "lagirio.",
      "image": siteImages.heroMain,
      "url": `https://lagirio.com/${currentLang === 'tr' ? '' : currentLang}`,
      "telephone": "+90-XXX-XXX-XXXX",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Taksim 360",
        "addressLocality": "Beyoğlu",
        "addressRegion": "İstanbul",
        "postalCode": "34437",
        "addressCountry": "TR"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": 41.0369,
        "longitude": 28.9850
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.8",
        "reviewCount": "127"
      },
      "priceRange": "$$$$",
      "availableLanguage": ["Turkish", "English", "Arabic", "Russian"]
    };

    // JSON-LD Script'i ekle
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.innerHTML = JSON.stringify(structuredData);
    document.head.appendChild(script);

    // Cleanup
    return () => {
      const existingScript = document.querySelector('script[type="application/ld+json"]');
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, [currentLang, siteImages.heroMain]);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // useEffect'i güncelleyin
  useEffect(() => {
    const fetchFeaturedApartments = async () => {
      try {
        const data = await apartmentAPI.getFeatured();
        
        if (data && data.length > 0) {
          setFeaturedApartments(data);
        } else {
          // Fallback: rastgele seçim
          if (apartments.length > 0) {
            const apartmentsWithImages = apartments.filter(apt => apt.images && apt.images.length > 0);
            const shuffled = [...apartmentsWithImages];
            for (let i = shuffled.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            setFeaturedApartments(shuffled.slice(0, 3));
          }
        }
      } catch (error) {
        console.error('Featured apartments fetch error:', error);
        // Hata durumunda fallback
        if (apartments.length > 0) {
          const apartmentsWithImages = apartments.filter(apt => apt.images && apt.images.length > 0);
          const shuffled = [...apartmentsWithImages];
          for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
          }
          setFeaturedApartments(shuffled.slice(0, 3));
        }
      }
    };
    
    fetchFeaturedApartments();
  }, [apartments]);

  // RentalsPage için arka plan görselleri
  const rentalsBackgrounds = Array.isArray(siteImages.heroRentals) 
    ? siteImages.heroRentals 
    : [
        siteImages.heroRentals || "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1600&h=900&fit=crop",
        "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1600&h=900&fit=crop"
      ];

  // Mouse/Touch Events - Mobilde daha yavaş
  const handleStart = (clientX: number) => {
    if (isTransitioning) return;
    setIsDragging(true);
    setStartX(clientX);
  };

  const handleMove = (clientX: number) => {
    if (!isDragging || isTransitioning) return;
    
    const diff = startX - clientX;
    const maxDrag = isMobile ? window.innerWidth * 0.7 : window.innerWidth * 0.5;
    const progress = Math.max(-1, Math.min(1, diff / maxDrag));
    setSlideProgress(progress);
  };

  const handleEnd = () => {
    if (!isDragging || isTransitioning) return;
    
    const threshold = isMobile ? 0.25 : 0.25;
    
    if (Math.abs(slideProgress) > threshold) {
      setIsTransitioning(true);
      
      if (slideProgress > 0) {
        setSlideProgress(1);
        setTimeout(() => {
          setCurrentView("rentals");
          setSlideProgress(0);
          setIsTransitioning(false);
        }, 700);
      } else {
        setSlideProgress(-1);
        setTimeout(() => {
          setCurrentView("owners");
          setSlideProgress(0);
          setIsTransitioning(false);
        }, 700);
      }
    } else {
      setSlideProgress(0);
    }
    
    setIsDragging(false);
    setStartX(0);
  };

  // HomePage arka plan animasyonu
  const [bgIndex, setBgIndex] = useState(0);
  const backgrounds = [
    siteImages.heroMain,
    siteImages.heroApartments || siteImages.heroMain,
    siteImages.heroTours || siteImages.heroMain
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % backgrounds.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [backgrounds.length]);

  // handleSearch fonksiyonunu güncelleyin:
  const handleSearch = async () => {
    await fetchApartments();
    setCurrentView("rentals");
    
    // Apartments section'a scroll için flag
    if (shouldScrollToApartments) {
      setTimeout(() => {
        const apartmentsSection = document.getElementById('apartments-section');
        if (apartmentsSection) {
          apartmentsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        setShouldScrollToApartments(false);
      }, 500); // RentalsPage yüklenmesi için kısa bekleme
    }
  };

  // Rentals sayfasına geçince scroll yapsın
  useEffect(() => {
    if (shouldScrollToApartments && !isMobile) {
      const checkAndScroll = () => {
        const apartmentsSection = document.getElementById('apartments-section');
        if (apartmentsSection) {
          apartmentsSection.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          });
          setShouldScrollToApartments(false);
        }
      };

      // İlk deneme
      setTimeout(checkAndScroll, 300);
      
      // Backup deneme
      setTimeout(checkAndScroll, 800);
    }
  }, [shouldScrollToApartments, isMobile]);

  // MOBİL TASARIM - RentalsPage Hero + Partner Section Stili
  if (isMobile) {
    return (
      <div
        ref={containerRef}
        className="min-h-screen bg-white relative overflow-hidden"
        role="region"
        aria-label={t.swipeArea || "Swipe area for navigation"}
        onTouchStart={(e) => {
          const target = e.target as HTMLElement;
          const isFeaturedArea = target.closest('.featured-area');
          if (!isFeaturedArea) {
            handleStart(e.touches[0].clientX);
          }
        }}
        onTouchMove={(e) => {
          const target = e.target as HTMLElement;
          const isFeaturedArea = target.closest('.featured-area');
          if (!isFeaturedArea) {
            handleMove(e.touches[0].clientX);
          }
        }}
        onTouchEnd={(e) => {
          const target = e.target as HTMLElement;
          const isFeaturedArea = target.closest('.featured-area');
          if (!isFeaturedArea) {
            handleEnd();
          }
        }}
      >
        {/* RentalsPage Preview - Sola swipe */}
        <div 
          className="absolute inset-0 bg-white"
          style={{
            transform: `translateX(${100 - Math.max(0, slideProgress) * 100}%)`,
            transition: isDragging ? 'none' : 'transform 0.7s cubic-bezier(0.4, 0.0, 0.2, 1)',
            pointerEvents: slideProgress > 0.8 ? 'auto' : 'none',
            boxShadow: slideProgress > 0 ? '-15px 0 40px rgba(0,0,0,0.3)' : 'none'
          }}
        >
          <div style={{ opacity: Math.max(0, slideProgress) }}>
            <HeroSection
              backgroundImages={rentalsBackgrounds}
              searchFilters={globalSearchParams}
              setSearchFilters={setGlobalSearchParams}
              onSearch={handleSearch}
              translations={translations}
              currentLang={currentLang}
              tagline={t.tagline || "Lagirio ile her yerde eviniz."}
            />
            <PartnerSection 
              currentLang={currentLang} 
              translations={translations} 
            />
          </div>
        </div>

        {/* Owners Page Preview - Sağa swipe */}
        <div 
          className="absolute inset-0"
          style={{
            transform: `translateX(${-100 - slideProgress * 100}%)`,
            transition: isDragging ? 'none' : 'transform 0.7s cubic-bezier(0.4, 0.0, 0.2, 1)',
            pointerEvents: slideProgress < -0.8 ? 'auto' : 'none',
            boxShadow: slideProgress < 0 ? '15px 0 40px rgba(0,0,0,0.3)' : 'none'
          }}
        >
          <div style={{ opacity: Math.max(0, -slideProgress) }}>
            <OwnersPage
              currentLang={currentLang}
              setCurrentLang={setCurrentLang}
              translations={translations}
              setShowLoginModal={setShowLoginModal || (() => {})}
              setCurrentView={setCurrentView}
            />
          </div>
        </div>

        {/* Ana HomePage İçeriği */}
        <div 
          className="relative z-10 h-full flex flex-col"
          style={{
            transform: `translateX(${-slideProgress * 100}%)`,
            transition: isDragging ? 'none' : 'transform 0.7s cubic-bezier(0.4, 0.0, 0.2, 1)'
          }}
      >
          {/* Hero Section - RentalsPage stili */}
          <section className="relative min-h-[60vh] flex items-center justify-center">
            {/* Background Images */}
            <div className="absolute inset-0">
              {backgrounds.map((bg, index) => (
                <div
                  key={index}
                  className={`absolute inset-0 transition-opacity duration-1000 ${
                    index === bgIndex ? 'opacity-100' : 'opacity-0'
                  }`}
                  style={{
                    backgroundImage: `url(${bg})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center 70%'
                  }}
                />
              ))}
              <div className="absolute inset-0 bg-black/40"></div>
            </div>

            {/* Sol Swipe Indicator */}
            <div className={`absolute left-0 top-1/2 -translate-y-1/2 flex items-center transition-all duration-500 ${
              slideProgress < -0.05 ? 'opacity-100' : 'opacity-90'
            }`}>
              <div className={`h-28 w-1.5 rounded-r-full transition-all duration-300 ${
                slideProgress < -0.05 ? 'w-2 shadow-lg bg-[#0a2e23]' : 'bg-[#0a2e23]/70'
              }`} />
              
              <div 
                className="ml-1 select-none pointer-events-none"
                style={{ 
                  writingMode: 'vertical-lr', 
                  transform: 'rotate(180deg)',
                  fontSize: '11px',
                  fontFamily: "'Inter', -apple-system, sans-serif",
                  fontWeight: '600',
                  letterSpacing: '0.15em',
                  color: '#0a2e23',
                  textShadow: '0 0 8px rgba(10, 46, 35, 0.3), 0 1px 3px rgba(255,255,255,0.9)',
                  WebkitFontSmoothing: 'antialiased'
                }}
              >
                {t.propertyOwners?.toUpperCase() || 'EV SAHİPLERİ'}
              </div>
            </div>

            {/* Sağ Swipe Indicator */}
            <div className={`absolute right-0 top-1/2 -translate-y-1/2 flex items-center transition-all duration-500 ${
              slideProgress > 0.05 ? 'opacity-100' : 'opacity-90'
            }`}>
              <div 
                className="mr-1 select-none pointer-events-none"
                style={{ 
                  writingMode: 'vertical-lr',
                  fontSize: '11px',
                  fontFamily: "'Inter', -apple-system, sans-serif",
                  fontWeight: '600',
                  letterSpacing: '0.15em',
                  color: '#ff9800',
                  textShadow: '0 0 8px rgba(255, 152, 0, 0.3), 0 1px 3px rgba(255,255,255,0.9)',
                  WebkitFontSmoothing: 'antialiased'
                }}
              >
                {t.rentalsAndTours?.toUpperCase() || 'KİRALIK DAİRELER'}
              </div>
              
              <div className={`h-28 w-1.5 rounded-l-full transition-all duration-300 ${
                slideProgress > 0.05 ? 'w-2 shadow-lg bg-[#ff9800]' : 'bg-[#ff9800]/70'
              }`} />
            </div>

            {/* Language Selector - Dropdown */}
            <div className="absolute top-4 right-4 z-30">
              <div className="relative group">
                <button 
                  className="flex items-center space-x-2 bg-white/20 backdrop-blur-md px-3 py-2 rounded-full"
                  aria-label={`${t.switchLanguage || 'Change language'}: ${currentLang.toUpperCase()}`}
                >
                  <Globe size={16} className="text-white" />
                  <span className="text-white text-sm font-medium">{currentLang.toUpperCase()}</span>
                </button>
                <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  {['tr', 'en', 'ar', 'ru'].map(lang => (
                    <button 
                      key={lang}
                      onClick={() => setCurrentLang(lang)} 
                      className="block w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors text-gray-700 text-sm"
                      aria-label={`Switch to ${lang === 'tr' ? 'Turkish' : lang === 'en' ? 'English' : lang === 'ar' ? 'Arabic' : 'Russian'}`}
                    >
                      {lang === 'tr' && '🇹🇷 Türkçe'}
                      {lang === 'en' && '🇬🇧 English'}
                      {lang === 'ar' && '🇸🇦 العربية'}
                      {lang === 'ru' && '🇷🇺 Русский'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Logo ve Pull Left and Right - GÜNCELLENDİ */}
            <div className="relative z-10 px-4 py-12 w-full text-center">
              <h2 className="text-4xl font-bold mb-4 drop-shadow-lg">
                <span className="text-[#f5e6d3] block">Home Sweet </span>
                <span className="text-[#ff9800]">lagirio.</span>
              </h2>
              

              {/* Pull Left and Right - DAHA AŞAĞI VE NORMAL BOYUT */}
              <div className="bg-black/20 backdrop-blur-md rounded-full shadow-lg px-5 py-1.5 inline-flex items-center gap-2 mt-12">
                <span className="text-[#0a2e23]/70 text-xs">▶</span>
                <span className="text-[11px] text-white/90 font-medium tracking-wider uppercase">
                  {t.pullLeftAndRightmb || 'Sola ve sağa çekerek keşfet'}
                </span>
                <span className="text-[#ff9800]/70 text-xs">◀</span>
              </div>
            </div>
          </section>

          {/* Featured Apartments Section - Partner Section stili */}
          <section className="px-6 py-8 bg-gradient-to-b from-gray-50 to-white featured-area">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-[#0a2e23] mb-2">
                {t.featured || 'Öne Çıkan Dairelerimiz'}
              </h3>
              <p className="text-sm text-gray-600">
                {t.featuredSubtitle || 'En çok tercih edilen konaklama seçeneklerimiz'}
              </p>
            </div>

            {/* Featured Apartments Carousel */}
            {featuredApartments.length > 0 && (
              <div>
                <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 -mx-6 px-6 snap-x snap-mandatory">
                  {featuredApartments.map((apt) => (
                    <div
                      key={apt._id || apt.id}
                      onClick={() => {
                        setCurrentView("rentals");
                        setTimeout(() => {
                          const apartmentsSection = document.getElementById('apartments-section');
                          if (apartmentsSection) {
                            apartmentsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }
                        }, 300);
                      }}
                      className="bg-white rounded-2xl shadow-lg text-center hover:shadow-xl transition-all flex-shrink-0 w-72 snap-center cursor-pointer"
                    >
                      {/* Apartment Image */}
                      <div className="relative h-48 overflow-hidden rounded-t-2xl">
                        <img
                          src={apt.images?.[0]?.url || apt.images?.[0]}
                          alt={`${apt.translations?.[currentLang]?.title || apt.title} - Taksim Lagirio Residence`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        {apt.featured && (
                          <div className="absolute top-3 left-3 bg-[#ff9800] text-white px-3 py-1 rounded-full text-xs font-semibold">
                            {t.featured || 'Öne Çıkan'}
                          </div>
                        )}
                      </div>

                      {/* Apartment Details */}
                      <div className="p-6">
                        <h4 className="font-semibold text-lg text-gray-800 mb-2">
                          {apt.translations?.[currentLang]?.title || apt.title}
                        </h4>
                        
                        <div className="flex items-center justify-center gap-3 text-sm text-gray-600 mb-3">
                          <span className="flex items-center gap-1">
                            <Bed size={14} />
                            {apt.bedrooms || 2} {t.bedrooms || 'Yatak'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users size={14} />
                            {apt.maxGuests || 4} {t.guests || 'Kişi'}
                          </span>
                        </div>

                        <div className="flex items-center justify-center gap-1 mb-2">
                          <MapPin size={14} className="text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {apt.district || apt.neighborhood || 'Taksim'}
                          </span>
                        </div>

                        <div className="mt-4 pt-4 border-t">
                          <div className="flex items-baseline justify-center">
                            <span className="text-2xl font-bold text-[#ff9800]">
                              €{apt.price || apt.basePrice || '100'}
                            </span>
                            <span className="text-gray-600 ml-1">/{t.perNight || 'Gece'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Scroll Indicators */}
                <div className="flex justify-center gap-2 mt-4">
                  {featuredApartments.map((_, index) => (
                    <div
                      key={index}
                      className="w-1.5 h-1.5 rounded-full bg-gray-300 transition-all"
                    />
                  ))}
                </div>

                {/* See All Button - SAYFA ÜSTÜNDEN SCROLL */}
                <div className="text-center mt-6">
                  <button
                    onClick={() => {
                      // RentalsPage'e geç
                      setCurrentView("rentals");
                      
                      // Önce sayfanın en üstüne git
                      setTimeout(() => {
                        // Sayfanın en üstüne git
                        window.scrollTo(0, 0);
                        
                        // Sonra apartments section'a smooth scroll et
                        setTimeout(() => {
                          const apartmentsSection = document.getElementById('apartments-section');
                          if (apartmentsSection) {
                            apartmentsSection.scrollIntoView({ 
                              behavior: 'smooth', 
                              block: 'start' 
                            });
                          }
                        }, 100); // Önce üste gitmesi için kısa bekleme
                      }, 500); // RentalsPage'in yüklenmesi için bekleme
                    }}
                    className="bg-[#ff9800] text-white px-6 py-3 rounded-full font-semibold hover:bg-[#f57c00] transition-colors inline-flex items-center gap-2 active:scale-95"
                  >
                    {t.seeAllApartments || 'Tüm Daireleri Gör'}
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    );
  }
  // DESKTOP VERSION (aynı kalacak)
  return (
    <div
      ref={containerRef}
      className="min-h-screen relative overflow-hidden select-none"
      style={{ cursor: isDragging ? 'grabbing' : 'auto' }}
      role="region"
      aria-label={t.swipeArea || "Swipe area for navigation"}
      onMouseDown={(e) => handleStart(e.clientX)}
      onMouseMove={(e) => handleMove(e.clientX)}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
    >
      {/* RentalsPage Preview */}
      <div 
        className="absolute inset-0"
        style={{
          transform: `translateX(${100 - Math.max(0, slideProgress) * 100}%)`,
          transition: isDragging ? 'none' : 'transform 0.7s cubic-bezier(0.4, 0.0, 0.2, 1)',
          pointerEvents: slideProgress > 0.8 ? 'auto' : 'none'
        }}
      >
        <div style={{ opacity: Math.max(0, slideProgress) }}>
          <HeroSection
            backgroundImages={rentalsBackgrounds}
            searchFilters={globalSearchParams}
            setSearchFilters={setGlobalSearchParams}
            onSearch={handleSearch}
            translations={translations}
            currentLang={currentLang}
            tagline={t.tagline || "Lagirio ile her yerde eviniz."}
          />
        </div>
      </div>

      {/* Owners Page Preview */}
      <div 
        className="absolute inset-0"
        style={{
          transform: `translateX(${-100 - slideProgress * 100}%)`,
          transition: isDragging ? 'none' : 'transform 0.7s cubic-bezier(0.4, 0.0, 0.2, 1)',
          pointerEvents: slideProgress < -0.8 ? 'auto' : 'none',
          boxShadow: slideProgress < 0 ? '15px 0 40px rgba(0,0,0,0.3)' : 'none'
        }}
      >
        <div style={{ opacity: Math.max(0, -slideProgress) }}>
          <OwnersPage
            currentLang={currentLang}
            setCurrentLang={setCurrentLang}
            translations={translations}
            setShowLoginModal={setShowLoginModal || (() => {})}
            setCurrentView={setCurrentView}
          />
        </div>
      </div>

      {/* Main HomePage Content */}
      <div 
        className="relative z-10 min-h-screen"
        style={{
          transform: `translateX(${-slideProgress * 100}%)`,
          transition: isDragging ? 'none' : 'transform 0.7s cubic-bezier(0.4, 0.0, 0.2, 1)',
          opacity: 1 - Math.abs(slideProgress) * 0.4,
          pointerEvents: Math.abs(slideProgress) > 0.5 ? 'none' : 'auto'
        }}
      >
        {/* Animated Background */}
        <div className="absolute inset-0">
          {backgrounds.map((bg, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                index === bgIndex ? 'opacity-100' : 'opacity-0'
              }`}
              style={{
                backgroundImage: `url(${bg})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/50 to-black/60" />
        </div>

        {/* Animated Navigation Buttons - DÜZGÜN VERSİYON */}
        {/* Sol Buton - Owners'a gider, SAĞA BAKAR */}
        <button
          onClick={() => {
            // Çekme animasyonunu başlat
            setIsTransitioning(true);
            // Önce küçük bir çekme hareketi
            setSlideProgress(-0.1);
            
            setTimeout(() => {
              // Sonra tam çek
              setSlideProgress(-1);
              
              setTimeout(() => {
                setCurrentView("owners");
                setSlideProgress(0);
                setIsTransitioning(false);
              }, 700);
            }, 100);
          }}
          className="absolute left-8 top-1/2 -translate-y-1/2 z-20 group"
          aria-label={t.goToPropertyOwners || 'Go to property owners page'}
        >
          <div className="relative">
            {/* Glow Effect */}
            <div className="absolute -inset-4 bg-gradient-to-r from-[#0a2e23]/20 to-transparent 
                            rounded-full blur-2xl group-hover:from-[#0a2e23]/40 transition-all duration-500" />
            
            {/* Main Button Container */}
            <div className="relative flex items-center gap-3">
              {/* Arrow Container */}
              <div className="relative">
                {/* Pulse Ring */}
                <div className="absolute inset-0 bg-[#0a2e23]/20 rounded-full animate-ping" />
                
                {/* Button Circle */}
                <div className="relative bg-gradient-to-br from-black/40 to-black/60 backdrop-blur-md 
                                rounded-full w-16 h-16 flex items-center justify-center
                                border border-white/10 group-hover:border-[#0a2e23]/50
                                shadow-2xl group-hover:shadow-[#0a2e23]/20
                                transition-all duration-500 group-hover:scale-110
                                group-hover:bg-gradient-to-br group-hover:from-[#0a2e23]/40 group-hover:to-[#0a2e23]/60">
                  {/* SAĞA BAKAN OK */}
                  <ChevronRight 
                    size={32} 
                    className="text-white/70 group-hover:text-[#f5e6d3] transition-all duration-300
                              group-hover:translate-x-1"
                  />
                </div>
                
                {/* Rotating Border */}
                <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="absolute inset-0 rounded-full border-2 border-transparent 
                                  border-t-[#0a2e23] border-r-[#0a2e23] animate-spin" 
                      style={{ animationDuration: '3s' }} />
                </div>
              </div>
              
              {/* Floating Text */}
              <div className="absolute left-20 opacity-0 group-hover:opacity-100 
                              transition-all duration-500 group-hover:translate-x-2
                              pointer-events-none">
                <div className="bg-gradient-to-r from-[#0a2e23] to-[#1a4a3a] 
                                text-white px-4 py-2 rounded-xl text-sm font-semibold
                                shadow-xl whitespace-nowrap backdrop-blur-sm">
                  <span className="drop-shadow-sm">{t.propertyOwners || 'Ev Sahipleri'}</span>
                </div>
              </div>
            </div>
            
            {/* Direction Hint Line */}
            <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 w-8 h-[2px]
                            bg-gradient-to-r from-white/20 to-transparent
                            opacity-0 group-hover:opacity-100 transition-all duration-500
                            group-hover:w-12" />
          </div>
        </button>

        {/* Sağ Buton - Rentals'a gider, SOLA BAKAR */}
        <button
          onClick={() => {
            // Çekme animasyonunu başlat
            setIsTransitioning(true);
            // Önce küçük bir çekme hareketi
            setSlideProgress(0.1);
            
            setTimeout(() => {
              // Sonra tam çek
              setSlideProgress(1);
              
              setTimeout(() => {
                setCurrentView("rentals");
                setSlideProgress(0);
                setIsTransitioning(false);
              }, 700);
            }, 100);
          }}
          className="absolute right-8 top-1/2 -translate-y-1/2 z-20 group"
          aria-label={t.goToRentals || 'Go to rentals page'}
        >
          <div className="relative">
            {/* Glow Effect */}
            <div className="absolute -inset-4 bg-gradient-to-l from-[#ff9800]/20 to-transparent 
                            rounded-full blur-2xl group-hover:from-[#ff9800]/40 transition-all duration-500" />
            
            {/* Main Button Container */}
            <div className="relative flex items-center gap-3">
              {/* Floating Text - SAĞ TARAFTA */}
              <div className="absolute right-20 opacity-0 group-hover:opacity-100 
                              transition-all duration-500 group-hover:-translate-x-2
                              pointer-events-none">
                <div className="bg-gradient-to-r from-[#ff9800] to-[#f57c00] 
                                text-white px-4 py-2 rounded-xl text-sm font-semibold
                                shadow-xl whitespace-nowrap backdrop-blur-sm">
                  <span className="drop-shadow-sm">{t.rentalsAndTours || 'Kiralık Daireler'}</span>
                </div>
              </div>
              
              {/* Arrow Container */}
              <div className="relative">
                {/* Pulse Ring */}
                <div className="absolute inset-0 bg-[#ff9800]/20 rounded-full animate-ping" />
                
                {/* Button Circle */}
                <div className="relative bg-gradient-to-bl from-black/40 to-black/60 backdrop-blur-md 
                                rounded-full w-16 h-16 flex items-center justify-center
                                border border-white/10 group-hover:border-[#ff9800]/50
                                shadow-2xl group-hover:shadow-[#ff9800]/20
                                transition-all duration-500 group-hover:scale-110
                                group-hover:bg-gradient-to-bl group-hover:from-[#ff9800]/40 group-hover:to-[#ff9800]/60">
                  {/* SOLA BAKAN OK */}
                  <ChevronLeft 
                    size={32} 
                    className="text-white/70 group-hover:text-white transition-all duration-300
                              group-hover:-translate-x-1"
                  />
                </div>
                
                {/* Rotating Border */}
                <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="absolute inset-0 rounded-full border-2 border-transparent 
                                  border-t-[#ff9800] border-l-[#ff9800] animate-spin" 
                      style={{ animationDuration: '3s', animationDirection: 'reverse' }} />
                </div>
              </div>
            </div>
            
            {/* Direction Hint Line */}
            <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 w-8 h-[2px]
                            bg-gradient-to-l from-white/20 to-transparent
                            opacity-0 group-hover:opacity-100 transition-all duration-500
                            group-hover:w-12" />
          </div>
        </button>

        {/* Language Selector */}
        <div className="absolute top-6 right-6 z-30">
          <div className="relative group">
            <button 
              className="flex items-center space-x-2 text-white hover:text-[#ff9800] transition-colors bg-black/30 backdrop-blur-sm px-4 py-2 rounded-full"
              aria-label={`${t.switchLanguage || 'Change language'}: ${currentLang.toUpperCase()}`}
            >
              <Globe size={20} />
              <span className="font-medium">{currentLang.toUpperCase()}</span>
            </button>
            <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
              {['tr', 'en', 'ar', 'ru'].map(lang => (
                <button 
                  key={lang}
                  onClick={() => setCurrentLang(lang)} 
                  className="block w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors text-gray-700"
                  aria-label={`Switch to ${lang === 'tr' ? 'Turkish' : lang === 'en' ? 'English' : lang === 'ar' ? 'Arabic' : 'Russian'}`}
                >
                  {lang === 'tr' && '🇹🇷 Türkçe'}
                  {lang === 'en' && '🇬🇧 English'}
                  {lang === 'ar' && '🇸🇦 العربية'}
                  {lang === 'ru' && '🇷🇺 Русский'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="relative z-20 min-h-screen flex flex-col items-center justify-center px-6">
          {/* Logo - Daha aşağıda konumlandırma */}
          <div className="mb-12 animate-fade-in mt-16"> {/* mt-16 eklendi */}
            <p className="text-[#f5e6d3] text-2xl md:text-3xl text-center font-light mb-2">
              Home Sweet
            </p>
            <h1 className="text-6xl md:text-8xl font-bold text-center relative">
              <span className="text-[#ff9800] drop-shadow-2xl relative">
                lagirio
                <Sparkles className="absolute -top-6 -right-6 text-yellow-400 animate-pulse" size={24} />
              </span>
              <span className="text-[#ff9800] text-8xl">.</span>
            </h1>
          </div>

          {/* Navigation Hint */}
          <div className="mb-8 text-center">
            <p className="text-white/70 text-sm mb-4 flex items-center justify-center gap-2">
              <ChevronRight size={16} />
              {t.pullLeftAndRight || 'Sola ve sağa çekerek keşfet'}
              <ChevronLeft size={16} />
            </p>
            
            {/* Quick Access Buttons */}
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setCurrentView("owners")}
                className="group relative px-6 py-3 bg-white/10 backdrop-blur-md rounded-full 
                         hover:bg-[#0a2e23] transition-all duration-300 overflow-hidden"
                aria-label={t.goToPropertyOwners || 'Go to property owners page'}
              >
                <span className="relative z-10 text-white flex items-center gap-2">
                  <Home size={18} />
                  {t.propertyOwners || 'Ev Sahipleri'}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-[#0a2e23] to-[#1a4a3a] 
                              translate-x-[100%] group-hover:translate-x-0 transition-transform duration-300" />
              </button>
              
              <button
                onClick={() => setCurrentView("rentals")}
                className="group relative px-6 py-3 bg-white/10 backdrop-blur-md rounded-full 
                         hover:bg-[#CD853F] transition-all duration-300 overflow-hidden"
                aria-label={t.goToRentals || 'Go to rentals page'}
              >
                <span className="relative z-10 text-white flex items-center gap-2">
                  <Building size={18} />
                  {t.rentalsAndTours || 'Kiralık Daireler'}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-[#CD853F] to-[#8B6914] 
                              translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300" />
              </button>
            </div>
          </div>

          {/* Featured Apartments */}
          {featuredApartments.length > 0 && (
            <div className="w-full max-w-5xl mx-auto mt-8">
              <h3 className="text-white/80 text-center mb-4 text-sm uppercase tracking-wider">
                {t.featured || 'Öne Çıkan Daireler'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {featuredApartments.map((apt, index) => (
                <div
                  key={apt._id || apt.id}
                  onClick={() => {
                    setShouldScrollToApartments(true);
                    setCurrentView("rentals");
                  }}
                    className="group cursor-pointer bg-white/10 backdrop-blur-md rounded-xl overflow-hidden
                            hover:bg-white/20 transition-all duration-300 hover:scale-105 animate-fade-in"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="relative h-32 overflow-hidden">
                      <img
                        src={apt.images?.[0]?.url || apt.images?.[0] || '/placeholder.jpg'}
                        alt={`${apt.translations?.[currentLang]?.title || apt.title} - Taksim Lagirio Residence`}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        loading="lazy"
                        width="400"
                        height="128"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    </div>
                    <div className="p-3">
                      <h4 className="text-white font-medium text-sm truncate">
                        {apt.translations?.[currentLang]?.title || apt.title}
                      </h4>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-white/60 text-xs flex items-center gap-1">
                          <MapPin size={12} />
                          {apt.district || apt.neighborhood}
                        </p>
                        <div className="flex items-center gap-2 text-white/60 text-xs">
                          <span className="flex items-center gap-1">
                            <Bed size={12} />
                            {apt.bedrooms || 2}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users size={12} />
                            {apt.maxGuests || 4}
                          </span>
                        </div>
                      </div>
                      <p className="text-[#ff9800] font-semibold text-sm mt-2">
                        €{apt.price || apt.basePrice || '100'}/{t.perNight || 'Gece'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;