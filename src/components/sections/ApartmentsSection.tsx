import React, { useState, useEffect } from 'react';
import { Home, Building2, Waves, Users2, UserCheck, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import ApartmentCard from '../apartments/ApartmentCard';
import CategoryFilter from '../common/CategoryFilter';

interface ApartmentsSectionProps {
  apartments: any[];
  filteredApartments: any[];
  searchFilters: any;
  siteImages: any;
  translations: any;
  currentLang: string;
  onOpenModal: (apartment: any, type: string) => void;
  getAvailabilityStatus: (apartment: any) => any;
  isSearching?: boolean;
  onShowLoginModal: () => void;
}

// Skeleton Card Component - Yükleme sırasında gösterilecek
const SkeletonCard: React.FC = () => (
  <div className="bg-white rounded-xl shadow-sm overflow-hidden animate-pulse">
    {/* Görsel alanı */}
    <div className="h-48 sm:h-64 bg-gray-200"></div>
    
    {/* İçerik alanı */}
    <div className="p-4">
      {/* Başlık */}
      <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
      
      {/* Konum */}
      <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
      
      {/* Alt bilgiler */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <div className="h-8 w-16 bg-gray-200 rounded"></div>
          <div className="h-8 w-16 bg-gray-200 rounded"></div>
        </div>
        <div className="h-10 w-24 bg-gray-200 rounded"></div>
      </div>
    </div>
  </div>
);

const ApartmentsSection: React.FC<ApartmentsSectionProps> = ({
  filteredApartments,
  searchFilters,
  siteImages,
  translations,
  currentLang,
  onOpenModal,
  getAvailabilityStatus,
  isSearching,
  onShowLoginModal
}) => {
  const t = translations[currentLang];
  const [selectedApartmentCategory, setSelectedApartmentCategory] = useState("all");
  const [expanded, setExpanded] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [initialItemsCount, setInitialItemsCount] = useState(6);
  const [isMobile, setIsMobile] = useState(false);

  const apartmentCategories = [
    { id: "all", label: t.all, icon: Home },
    { id: "residence", label: t.residenceHotel, icon: Building2 },
    { id: "bosphorus", label: t.bosphorusView, icon: Waves },
    { id: "large-family", label: t.largeGroupFamily, icon: Users2 },
    { id: "small-family", label: t.smallGroup, icon: UserCheck }
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

  // Arama yapıldıysa otomatik genişlet
  useEffect(() => {
    if (searchFilters.checkIn || searchFilters.checkOut || searchFilters.adults > 1) {
      setExpanded(true);
    }
  }, [searchFilters]);

  // Kategori değiştiğinde sayfa 1'e dön
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedApartmentCategory]);

  // Sayfa değiştirme fonksiyonu - Mobile için optimize edildi
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    
    // Mobile'da daha basit scroll
    if (isMobile) {
      const section = document.getElementById('apartments-section');
      if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else {
      // Desktop için mevcut smooth scroll korundu
      setTimeout(() => {
        const section = document.getElementById('apartments-section');
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

  // Çoklu kategori desteği ile filtreleme
  const categoryFilteredApartments = filteredApartments.filter(
    (apt) => {
      if (selectedApartmentCategory === "all") {
        return true;
      }
      
      if (apt.categories && Array.isArray(apt.categories)) {
        return apt.categories.includes(selectedApartmentCategory);
      }
      
      if (apt.category) {
        return apt.category === selectedApartmentCategory;
      }
      
      return false;
    }
  );

  // Sayfalandırma hesaplamaları - Mobile için azaltıldı
  const itemsPerPage = isMobile ? 4 : 9;
  const totalPages = Math.ceil(categoryFilteredApartments.length / itemsPerPage);

  // Gösterilecek daireleri belirle
  let displayedApartments;
  if (isSearching) {
    // Arama yapılıyorsa boş array döndür (skeleton gösterilsin)
    displayedApartments = [];
  } else if (!expanded) {
    displayedApartments = categoryFilteredApartments.slice(0, initialItemsCount);
  } else {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    displayedApartments = categoryFilteredApartments.slice(startIndex, endIndex);
  }

  const displayTitle = searchFilters.locationText || searchFilters.checkIn || searchFilters.adults > 1
    ? t.searchResults
    : t.ourApartments;

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
    <section id="apartments-section" className="relative">
      {/* Üst Yarı - Arka Plan Görsel */}
      <div className="relative h-[300px] sm:h-[400px] flex items-center justify-center">
        <div className="absolute inset-0 z-0">
          <img
            src={siteImages.heroApartments}
            alt="Background"
            className="w-full h-full object-cover"
          />
         <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-[#f5f0e8]"></div>
        </div>
        {/* Başlık - Mobile responsive */}
        <div className="relative z-10 text-center px-4 sm:px-6">
          <h3 className="text-3xl sm:text-5xl md:text-6xl font-bold text-[#2d5a4d] mb-2 sm:mb-4">
            {displayTitle}
          </h3>
          <p className="text-gray-700 text-base sm:text-lg">
            {t.comfortAndStyleSubtitle}
          </p>
        </div>
      </div>

      {/* Alt Yarı - Beyaz Arka Plan */}
      <div className="bg-[#f5f0e8] py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
          {/* Kategori Filtreleri - Mobile için scroll indicator */}
          <div className="relative mb-8 sm:mb-12 -mt-16 sm:-mt-24">
            <div className="flex justify-start md:justify-center gap-2 md:gap-3 relative z-20 
                          overflow-x-auto scrollbar-hide pb-2">
              <CategoryFilter
                categories={apartmentCategories}
                selectedCategory={selectedApartmentCategory}
                onCategoryChange={setSelectedApartmentCategory}
                activeColor="bg-[#1a4a3a]"
                inactiveColor="bg-[#f5e6d3]"
              />
            </div>
            {/* Mobile scroll indicator */}
            <div className="sm:hidden absolute right-0 top-1/2 -translate-y-1/2 bg-gradient-to-l from-[#f5f0e8] to-transparent pl-8 pr-2">
              <ChevronRight className="text-gray-400 animate-pulse" size={20} />
            </div>
          </div>

          {/* İçerik wrapper */}
          <div className={`${expanded ? 'min-h-[400px] sm:min-h-[600px]' : ''}`}>
            {isSearching ? (
              // Yükleme durumu - Skeleton Cards
              <div className={`grid gap-3 sm:gap-6 md:gap-8 mb-6 sm:mb-8 ${
                expanded 
                  ? 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-3'
                  : 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto'
              }`}>
                {[...Array(isMobile ? 4 : 6)].map((_, index) => (
                  <SkeletonCard key={index} />
                ))}
              </div>
            ) : displayedApartments.length > 0 ? (
              <>
                {/* Grid - Mobile optimize */}
                <div className={`grid gap-3 sm:gap-6 md:gap-8 mb-6 sm:mb-8 transition-all duration-500 ${
                  expanded 
                    ? 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-3'  // Mobile'da da 2 kolon
                    : 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto'
                }`}>
                  {displayedApartments.map((apartment) => {
                    const availability = getAvailabilityStatus(apartment);
                    return (
                      <ApartmentCard
                        key={apartment.id || apartment._id}
                        apartment={apartment}
                        onOpenModal={onOpenModal}
                        translations={translations}
                        currentLang={currentLang}
                        availability={availability}
                        showAvailability={searchFilters.checkIn && searchFilters.checkOut}
                        searchParams={searchFilters} 
                        onShowLoginModal={onShowLoginModal}
                      />
                    );
                  })}
                </div>

                {/* Tümünü Gör Butonu - Mobile optimize */}
                {!expanded && categoryFilteredApartments.length > initialItemsCount && (
                  <div className="text-center">
                    <button
                      onClick={() => setExpanded(true)}
                      className="group bg-white text-[#1a4a3a] px-5 py-2.5 sm:px-6 sm:py-3 md:px-8 md:py-4 rounded-full 
                               font-semibold shadow-lg hover:shadow-xl transform 
                               hover:-translate-y-1 transition-all duration-300
                               border-2 border-[#1a4a3a] hover:bg-[#1a4a3a] hover:text-white"
                    >
                      <span className="flex items-center gap-2 md:gap-3 text-sm md:text-base">
                        <span>{t.showAll|| 'Tüm Daireleri Gör'}</span>
                        <span className="bg-[#1a4a3a] text-white px-2 py-0.5 md:px-3 md:py-1 rounded-full 
                                     text-xs md:text-sm group-hover:bg-white group-hover:text-[#1a4a3a] transition-all">
                          {categoryFilteredApartments.length}
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
                          : 'bg-white text-[#1a4a3a] hover:bg-[#1a4a3a] hover:text-white shadow-md active:scale-95'
                      }`}
                    >
                      <ChevronLeft size={18} className="sm:w-5 sm:h-5" />
                    </button>

                    {/* Page Numbers - Mobile Simplified */}
                    <div className="flex items-center gap-1 sm:gap-1">
                      {isMobile ? (
                        // Mobile: Simplified pagination
                        <div className="px-4 py-2 bg-white rounded-full shadow-md">
                          <span className="text-[#1a4a3a] font-medium text-sm">
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
                                ? 'bg-[#1a4a3a] text-white shadow-lg transform scale-110'
                                : page === '...'
                                ? 'text-gray-400 cursor-default'
                                : 'bg-white text-[#1a4a3a] hover:bg-[#1a4a3a] hover:text-white shadow-md'
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
                          : 'bg-white text-[#1a4a3a] hover:bg-[#1a4a3a] hover:text-white shadow-md active:scale-95'
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
                      {categoryFilteredApartments.length} {t.apartmentFrom || 'daireden'} {
                        (currentPage - 1) * itemsPerPage + 1
                      }-{
                        Math.min(currentPage * itemsPerPage, categoryFilteredApartments.length)
                      } {t.showingBetween || 'arası gösteriliyor'}
                    </p>
                    
                    <button
                      onClick={() => {
                        setExpanded(false);
                        setCurrentPage(1);
                        document.getElementById('apartments-section')?.scrollIntoView({ 
                          behavior: 'smooth',
                          block: 'start'
                        });
                      }}
                      className="text-gray-600 hover:text-[#1a4a3a] underline text-xs sm:text-sm 
                               flex items-center gap-1 mx-auto transition-colors"
                    >
                      <ChevronUp size={14} className="sm:w-4 sm:h-4" />
                      <span>{t.showLess || 'Daha Az Göster'}</span>
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-[#f5e6d3]/50 rounded-2xl sm:rounded-3xl p-8 sm:p-12 md:p-20 text-center max-w-4xl mx-auto">
                <p className="text-lg sm:text-xl md:text-2xl text-gray-500">{t.noResults}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ApartmentsSection;