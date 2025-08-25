import React, { useState, useEffect } from 'react';
import SearchBar from '../common/SearchBar';
import { Search } from 'lucide-react';

interface HeroSectionProps {
  backgroundImages: string[];
  searchFilters: {
    checkIn: string;
    checkOut: string;
    adults: number;
    children: number;
  };
  setSearchFilters: (filters: any) => void;
  onSearch: () => void;
  translations: any;
  currentLang: string;
  tagline: string;
}

const HeroSection: React.FC<HeroSectionProps> = ({
  backgroundImages,
  searchFilters,
  setSearchFilters,
  onSearch,
  translations,
  currentLang,
  tagline
}) => {
  const [currentBgIndex, setCurrentBgIndex] = useState(0);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Otomatik fotoğraf değiştirme
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBgIndex((prevIndex) => (prevIndex + 1) % backgroundImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [backgroundImages.length]);

  const t = translations[currentLang];

  return (
    <>
      <section className="relative min-h-[60vh] md:min-h-screen flex items-center justify-center">
        {/* Background Images */}
        <div className="absolute inset-0">
          {backgroundImages.map((img, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                index === currentBgIndex ? "opacity-100" : "opacity-0"
              }`}
              style={{
                backgroundImage: `url(${img})`,
                backgroundSize: "cover",
                backgroundPosition: isMobile ? "center 70%" : "center",
              }}
            />
          ))}
          <div className="absolute inset-0 bg-black/40 md:bg-black/50"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 px-4 sm:px-6 lg:px-12 py-12 md:py-20 w-full">
          <div className="max-w-5xl mx-auto text-center">
            {/* Optimized Title */}
            <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 md:mb-6 drop-shadow-lg">
              <span className="text-[#f5e6d3] block sm:inline">Home Sweet </span>
              <span className="text-[#ff9800]">lagirio.</span>
            </h2>
            
            {/* Optimized Tagline */}
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white/90 mb-8 md:mb-12 drop-shadow-lg px-4 md:px-0">
              {tagline}
            </p>

            {/* Desktop Search Bar */}
            <div className="hidden md:block">
              <SearchBar
                searchFilters={searchFilters}
                setSearchFilters={setSearchFilters}
                onSearch={onSearch}
                translations={translations}
                currentLang={currentLang}
              />
            </div>

            {/* Mobile CTA Button */}
            <div className="md:hidden">
              <button
                onClick={() => setShowMobileSearch(true)}
                className="bg-[#ff9800] hover:bg-[#f57c00] text-white font-bold py-4 px-8 rounded-full shadow-lg transform transition-all hover:scale-105 active:scale-95 flex items-center gap-3 mx-auto"
              >
                <Search size={20} />
                <span className="text-lg">{t.searchNow || 'Hemen Ara'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Slide indicators - Mobilde daha küçük */}
        <div className="hidden md:flex absolute bottom-4 md:bottom-8 left-1/2 transform -translate-x-1/2 space-x-1.5 md:space-x-2">
          {backgroundImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentBgIndex(index)}
              className={`h-1.5 md:h-2 rounded-full transition-all ${
                index === currentBgIndex 
                  ? "bg-white w-6 md:w-8" 
                  : "bg-white/50 w-1.5 md:w-2"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </section>

      {/* Mobile Search Modal */}
      {showMobileSearch && (
        <div className="fixed inset-0 z-50 bg-white md:hidden overflow-y-auto">
          {/* Modal Header */}
          <div className="sticky top-0 bg-white flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-semibold">{t.search || 'Ara'}</h3>
            <div className="flex items-center gap-2">
              {/* Filtreleri Temizle Butonu */}
              <button
                onClick={() => {
                  setSearchFilters({
                    checkIn: "",
                    checkOut: "",
                    adults: 1,
                    children: 0,
                    childrenAgeGroups: { above7: 0, between2And7: 0, under2: 0 }
                  });
                }}
                className="text-sm text-[#ff9800] px-3 py-1.5 rounded-lg hover:bg-gray-100"
              >
                {t.clearFilters || 'Temizle'}
              </button>
              {/* Kapat Butonu */}
              <button
                onClick={() => setShowMobileSearch(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-4 pt-8">
            <SearchBar
              searchFilters={searchFilters}
              setSearchFilters={setSearchFilters}
              onSearch={() => {
                onSearch();
                setShowMobileSearch(false);
              }}
              translations={translations}
              currentLang={currentLang}
              isMobileModal={true}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default HeroSection;