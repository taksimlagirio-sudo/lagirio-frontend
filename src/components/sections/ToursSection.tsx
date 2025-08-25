import React, { useState, useEffect } from 'react';
import { Sparkles, Landmark, Trees, Sailboat, PartyPopper, Umbrella, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import TourCard from '../tours/TourCard';
import CategoryFilter from '../common/CategoryFilter';

interface ToursSectionProps {
  tours: any[];
  siteImages: any;
  translations: any;
  currentLang: string;
  onOpenModal: (tour: any, type: string) => void;
  onShowLoginModal: () => void;  
}

const ToursSection: React.FC<ToursSectionProps> = ({
  tours,
  siteImages,
  translations,
  currentLang,
  onOpenModal,
  onShowLoginModal
}) => {
  const t = translations[currentLang];
  const [selectedTourCategory, setSelectedTourCategory] = useState("all");
  const [expanded, setExpanded] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [initialItemsCount, setInitialItemsCount] = useState(6);
  const [isMobile, setIsMobile] = useState(false);

  const tourCategories = [
    { id: "all", label: t.all || "Tümü", icon: Sparkles },
    { id: "cultural", label: t.historicalCultural || "Tarihi/Kültürel", icon: Landmark },
    { id: "nature", label: t.natureTours || "Doğa Turları", icon: Trees },
    { id: "sea", label: t.seaTours || "Deniz Turları", icon: Sailboat },
    { id: "adventure", label: t.adventure || "Eğlence", icon: PartyPopper },
    { id: "beach", label: t.beachTour || "Plaj Turu", icon: Umbrella }
  ];

  // Mobile detection ve item count ayarı
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 640);
      
      if (width < 640) {
        setInitialItemsCount(4); // Mobile'da 4'e çıkardık
      } else if (width < 1024) {
        setInitialItemsCount(4);
      } else {
        setInitialItemsCount(6);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Kategori değiştiğinde sayfa 1'e dön
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedTourCategory]);
  
  // Smooth scroll - Mobile için optimize edildi
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    
    // Mobile'da daha basit scroll
    if (isMobile) {
      const section = document.getElementById('tours-section');
      if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else {
      // Desktop için mevcut smooth scroll korundu
      setTimeout(() => {
        const section = document.getElementById('tours-section');
        if (section) {
          const headerOffset = 100;
          const elementPosition = section.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
          
          const startPosition = window.pageYOffset;
          const distance = offsetPosition - startPosition;
          const duration = 800;
          let start: number | null = null;
          
          const animation = (currentTime: number) => {
            if (start === null) start = currentTime;
            const timeElapsed = currentTime - start;
            const progress = Math.min(timeElapsed / duration, 1);
            
            const easeInOutCubic = progress < 0.5
              ? 4 * progress * progress * progress
              : 1 - Math.pow(-2 * progress + 2, 3) / 2;
            
            window.scrollTo(0, startPosition + distance * easeInOutCubic);
            
            if (timeElapsed < duration) {
              requestAnimationFrame(animation);
            }
          };
          
          requestAnimationFrame(animation);
        }
      }, 50);
    }
  };

  // Aktif turları filtrele
  const activeTours = tours.filter((tour) => tour.status === "active");
  const categoryFilteredTours = activeTours.filter(
    (tour) =>
      selectedTourCategory === "all" ||
      tour.category === selectedTourCategory
  );

  // Sayfalandırma hesaplamaları - Mobile için azaltıldı
  const itemsPerPage = isMobile ? 4 : 9;
  const totalPages = Math.ceil(categoryFilteredTours.length / itemsPerPage);

  // Gösterilecek turları belirle
  let displayedTours;
  if (!expanded) {
    displayedTours = categoryFilteredTours.slice(0, initialItemsCount);
  } else {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    displayedTours = categoryFilteredTours.slice(startIndex, endIndex);
  }

  // Sayfa numaralarını oluştur - Desktop için
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  return (
    <section id="tours-section" className="py-0 bg-gray-50">
      {/* Üst Yarı - Arka Plan Görsel - Mobile responsive */}
      <div className="relative h-[300px] sm:h-[400px] flex items-center justify-center">
        <div className="absolute inset-0 z-0">
          <img
            src={siteImages.heroTours}
            alt="Tours Background"  
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-[#fdf6ee]"></div>
        </div>
        {/* Başlık - Mobile responsive */}
        <div className="relative z-10 text-center px-4 sm:px-6">
          <h3 className="text-3xl sm:text-5xl md:text-6xl font-bold text-[#ff9800] mb-2 sm:mb-4 flex items-center justify-center drop-shadow-lg">
            {t.ourTours}
          </h3>
          <p className="text-gray-700 text-base sm:text-lg drop-shadow px-2 sm:px-0">
            {t.unforgettableExperiences || 'Unutulmaz tur deneyimleri'}
          </p>
        </div>
      </div>

      {/* Alt Yarı - Krem Arka Plan */}
      <div className="bg-[#fdf6ee] py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
          {/* Kategori Filtreleri - Mobile için scroll indicator */}
          <div className="relative mb-8 sm:mb-12 -mt-16 sm:-mt-24">
            <div className="flex justify-start md:justify-center gap-2 md:gap-3 relative z-20 
                          overflow-x-auto scrollbar-hide pb-2">
              <CategoryFilter
                categories={tourCategories}
                selectedCategory={selectedTourCategory}
                onCategoryChange={setSelectedTourCategory}
                activeColor="bg-[#ff9800]"
                inactiveColor="bg-[#f5e6d3]"
              />
            </div>
            {/* Mobile scroll indicator */}
            <div className="sm:hidden absolute right-0 top-1/2 -translate-y-1/2 bg-gradient-to-l from-[#fdf6ee] to-transparent pl-8 pr-2">
              <ChevronRight className="text-gray-400 animate-pulse" size={20} />
            </div>
          </div>

          {/* İçerik wrapper */}
          <div className={`${expanded ? 'min-h-[400px] sm:min-h-[600px]' : ''}`}>
            {displayedTours.length > 0 ? (
              <>
                {/* Grid - Mobile optimize */}
                <div className={`grid gap-3 sm:gap-6 md:gap-8 mb-6 sm:mb-8 transition-all duration-500 ${
                  expanded 
                    ? 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-3'  // Mobile'da da 2 kolon
                    : 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto'
                }`}>
                  {displayedTours.map((tour) => (
                    <TourCard
                      key={tour.id}
                      tour={tour}
                      onOpenModal={onOpenModal}
                      translations={translations}
                      currentLang={currentLang}
                      onShowLoginModal={onShowLoginModal} 
                    />
                  ))}
                </div>

                {/* Tümünü Gör Butonu - Mobile optimize */}
                {!expanded && categoryFilteredTours.length > initialItemsCount && (
                  <div className="text-center">
                    <button
                      onClick={() => setExpanded(true)}
                      className="group bg-white text-[#ff9800] px-5 py-2.5 sm:px-6 sm:py-3 md:px-8 md:py-4 rounded-full 
                               font-semibold shadow-lg hover:shadow-xl transform 
                               hover:-translate-y-1 transition-all duration-300
                               border-2 border-[#ff9800] hover:bg-[#ff9800] hover:text-white"
                    >
                      <span className="flex items-center gap-2 md:gap-3 text-sm md:text-base">
                        <span>{t.seeAllTours || 'Tüm Turları Gör'}</span>
                        <span className="bg-[#ff9800] text-white px-2 py-0.5 md:px-3 md:py-1 rounded-full 
                                     text-xs md:text-sm group-hover:bg-white group-hover:text-[#ff9800] transition-all">
                          {categoryFilteredTours.length}
                        </span>
                        <ChevronDown className="group-hover:translate-y-1 transition-transform" size={18} />
                      </span>
                    </button>
                  </div>
                )}

                {/* Sayfalandırma - Mobile için tamamen farklı */}
                {expanded && totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mb-6">
                    {/* Previous Button */}
                    <button
                      onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className={`p-2 sm:p-2 rounded-full transition-all touch-target ${
                        currentPage === 1
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-white text-[#ff9800] hover:bg-[#ff9800] hover:text-white shadow-md active:scale-95'
                      }`}
                    >
                      <ChevronLeft size={18} className="sm:w-5 sm:h-5" />
                    </button>

                    {/* Page Numbers - Mobile Simplified */}
                    <div className="flex items-center gap-1 sm:gap-1">
                      {isMobile ? (
                        // Mobile: Simplified pagination
                        <div className="px-4 py-2 bg-white rounded-full shadow-md">
                          <span className="text-[#ff9800] font-medium text-sm">
                            {currentPage} / {totalPages}
                          </span>
                        </div>
                      ) : (
                        // Desktop: Full pagination
                        getPageNumbers().map((page, index) => (
                          <button
                            key={index}
                            onClick={() => typeof page === 'number' && handlePageChange(page)}
                            disabled={page === '...'}
                            className={`px-3 py-1.5 md:px-4 md:py-2 rounded-full font-medium transition-all text-sm md:text-base ${
                              page === currentPage
                                ? 'bg-[#ff9800] text-white shadow-lg transform scale-110'
                                : page === '...'
                                ? 'text-gray-400 cursor-default'
                                : 'bg-white text-[#ff9800] hover:bg-[#ff9800] hover:text-white shadow-md'
                            }`}
                          >
                            {page}
                          </button>
                        ))
                      )}
                    </div>

                    {/* Next Button */}
                    <button
                      onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className={`p-2 sm:p-2 rounded-full transition-all touch-target ${
                        currentPage === totalPages
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-white text-[#ff9800] hover:bg-[#ff9800] hover:text-white shadow-md active:scale-95'
                      }`}
                    >
                      <ChevronRight size={18} className="sm:w-5 sm:h-5" />
                    </button>
                  </div>
                )}

                {/* Sonuç Bilgisi ve Daralt Butonu */}
                {expanded && (
                  <div className="text-center">
                    <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
                      {categoryFilteredTours.length} {t.tourFrom || 'turdan'} {
                        (currentPage - 1) * itemsPerPage + 1
                      }-{
                        Math.min(currentPage * itemsPerPage, categoryFilteredTours.length)
                      } {t.showingBetween || 'arası gösteriliyor'}
                    </p>
                    
                    <button
                      onClick={() => {
                        setExpanded(false);
                        setCurrentPage(1);
                        document.getElementById('tours-section')?.scrollIntoView({ 
                          behavior: 'smooth',
                          block: 'start'
                        });
                      }}
                      className="text-gray-600 hover:text-[#ff9800] underline text-xs sm:text-sm 
                               flex items-center gap-1 mx-auto transition-colors"
                    >
                      <ChevronUp size={14} className="sm:w-4 sm:h-4" />
                      <span>{t.showLess || 'Daha az göster'}</span>
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-[#ff9800]/10 rounded-2xl sm:rounded-3xl p-8 sm:p-12 md:p-20 text-center max-w-4xl mx-auto">
                <p className="text-lg sm:text-xl md:text-2xl text-gray-500">{t.comingSoon}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ToursSection;