import React, { useState } from 'react';
import Header from '../components/common/Header';
import HeroSection from '../components/sections/HeroSection';
import ApartmentsSection from '../components/sections/ApartmentsSection';
import ToursSection from '../components/sections/ToursSection';
import PartnerSection from '../components/sections/PartnerSection';

interface RentalsPageProps {
  apartments: any[];
  tours: any[];
  siteImages: any;
  currentLang: string;
  setCurrentLang: (lang: string) => void;
  translations: any;
  setShowLoginModal: (show: boolean) => void;
  setCurrentView: (view: string) => void;
  handleOpenModal: (item: any, type: string) => void;
  fetchApartments: (
    checkIn?: string, 
    checkOut?: string, 
    adults?: number, 
    children?: number, 
    childrenAges?: { above7: number; between2And7: number; under2: number }
  ) => Promise<void>;
  globalSearchParams: {
    checkIn: string;
    checkOut: string;
    adults: number;
    children: number;
    childrenAgeGroups?: { // YENİ
      above7: number;
      between2And7: number;
      under2: number;
    };
  };
  setGlobalSearchParams: (params: any) => void;
}

const RentalsPage: React.FC<RentalsPageProps> = ({
  apartments,
  tours,
  siteImages,
  currentLang,
  setCurrentLang,
  translations,
  setShowLoginModal,
  setCurrentView,
  handleOpenModal,
  fetchApartments,
  globalSearchParams,
  setGlobalSearchParams
}) => {
  const t = translations[currentLang];
  const [isSearching, setIsSearching] = useState(false);

  // Arka plan fotoğrafları
  const backgroundImages = siteImages?.heroRentals || [
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1600&h=900&fit=crop",
    "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1600&h=900&fit=crop",
  ];

  // Müsaitlik kontrolü için yardımcı fonksiyon
  const isDateBooked = (dateStr: string, apartmentId: number) => {
    const apartment = apartments.find((apt) => apt.id === apartmentId);
    if (!apartment) return false;
    
    return apartment.reservations?.some((res: any) => {
      const checkIn = new Date(res.checkIn);
      const checkOut = new Date(res.checkOut);
      const currentDate = new Date(dateStr);
      return currentDate >= checkIn && currentDate < checkOut;
    });
  };

  // Müsaitlik durumu hesaplama
  const getAvailabilityStatus = (apartment: any) => {
    if (!globalSearchParams.checkIn || !globalSearchParams.checkOut) {
      return { available: true, percentage: 100 };
    }
    
    const checkIn = new Date(globalSearchParams.checkIn);
    const checkOut = new Date(globalSearchParams.checkOut);
    const totalDays = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    let bookedDays = 0;

    for (let d = new Date(checkIn); d < checkOut; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split("T")[0];
      if (isDateBooked(dateStr, apartment.id)) {
        bookedDays++;
      }
    }

    const availablePercentage = Math.round(
      ((totalDays - bookedDays) / totalDays) * 100
    );

    return {
      available: bookedDays === 0,
      percentage: availablePercentage,
      bookedDays: bookedDays,
      totalDays: totalDays,
    };
  };

  // Custom smooth scroll fonksiyonu
  const smoothScrollTo = (elementId: string, duration = 1500) => {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const targetPosition = element.getBoundingClientRect().top + window.pageYOffset - 1;
    const startPosition = window.pageYOffset;
    const distance = targetPosition - startPosition;
    let startTime: number | null = null;

    const animation = (currentTime: number) => {
      if (startTime === null) startTime = currentTime;
      const timeElapsed = currentTime - startTime;
      const progress = Math.min(timeElapsed / duration, 1);

      const easeInOutCubic =
        progress < 0.5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      window.scrollTo(0, startPosition + distance * easeInOutCubic);

      if (timeElapsed < duration) {
        requestAnimationFrame(animation);
      }
    };

    requestAnimationFrame(animation);
  };

  // GÜNCELLENEN handleSearch fonksiyonu
  const handleSearch = async () => {
    console.log('handleSearch çağrıldı!');
    console.log('Search params:', globalSearchParams);
    
    setIsSearching(true);
    smoothScrollTo("apartments-section", 1500);
    
    if (globalSearchParams.checkIn && globalSearchParams.checkOut) {
      console.log('Tarihler var, fetchApartments çağrılıyor...');
      
      await fetchApartments(
        globalSearchParams.checkIn, 
        globalSearchParams.checkOut,
        globalSearchParams.adults,
        globalSearchParams.children,
        globalSearchParams.childrenAgeGroups
      );
      
      console.log('fetchApartments tamamlandı');
      
      setTimeout(() => {
        setIsSearching(false);
      }, 800);
    } else {
      console.log('Tarihler yok!');
      setIsSearching(false);
    }
  };

  // GÜNCELLENEN KAPASİTE FİLTRELEME - Yeni sistem için
  const getFilteredApartments = () => {
    // Eğer tarih seçilmişse, backend zaten filtreleme yaptı
    if (globalSearchParams.checkIn && globalSearchParams.checkOut) {
      return apartments; // Backend'den gelen filtrelenmiş veriyi direkt kullan
    }
    
    // Tarih seçilmemişse, sadece basit kapasite kontrolü yap
    return apartments.filter((apt) => {
      const totalGuests = globalSearchParams.adults + globalSearchParams.children;
      
      // Yeni sistem kontrolü (maxCapacity)
      if (apt.maxCapacity) {
        return apt.maxCapacity >= totalGuests;
      }
      
      // Eski sistem için geriye dönük uyumluluk (capacity)
      if (apt.capacity) {
        return apt.capacity >= totalGuests;
      }
      
      return true;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        transparent={true}
        currentLang={currentLang}
        setCurrentLang={setCurrentLang}
        translations={translations}
        setShowLoginModal={setShowLoginModal}
        setCurrentView={setCurrentView}
      />
      
      {/* Hero Section with Background */}
      <HeroSection
        backgroundImages={backgroundImages}
        searchFilters={globalSearchParams}
        setSearchFilters={setGlobalSearchParams}
        onSearch={handleSearch}
        translations={translations}
        currentLang={currentLang}
        tagline={t.tagline}
      />

      {/* İş Ortakları ve Puanlarımız */}
      <PartnerSection currentLang={currentLang} translations={translations} />

      {/* Dairelerimiz Section */}
      <ApartmentsSection
        apartments={apartments}
        filteredApartments={getFilteredApartments()}
        searchFilters={globalSearchParams}
        siteImages={siteImages}
        translations={translations}
        currentLang={currentLang}
        onOpenModal={handleOpenModal}
        getAvailabilityStatus={getAvailabilityStatus}
        isSearching={isSearching}
        onShowLoginModal={() => setShowLoginModal(true)}
      />

      {/* Turlar Section */}
      <ToursSection
        tours={tours}
        siteImages={siteImages}
        translations={translations}
        currentLang={currentLang}
        onOpenModal={handleOpenModal}
        onShowLoginModal={() => setShowLoginModal(true)} 
      />

      {/* ContactSection'ı KALDIR */}
      {/* <ContactSection 
        translations={translations}
        currentLang={currentLang}
      /> */}
    </div>
  );
};

export default RentalsPage;