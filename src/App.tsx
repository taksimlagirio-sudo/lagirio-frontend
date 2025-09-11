import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { AuthProvider } from './components/contexts/AuthContext';
import { authAPI, apartmentAPI, siteImageAPI, tourAPI } from './utils/api';
import ProtectedRoute from './components/ProtectedRoute';
import { validatePhoneNumber } from './utils/phoneValidation';
import { countryPhoneCodes } from './utils/countryPhoneCodes';
import Footer from './components/Footer'; // Footer import - KALACAK
import ForgotPasswordModal from './components/modals/ForgotPasswordModal';
import WhatsAppRedirectModal from './components/modals/WhatsAppRedirectModal';
import { HelmetProvider } from 'react-helmet-async';
import SEOHead from './components/SEOHead'; // YENİ - SEO Component




// Lazy loaded pages
const HomePage = lazy(() => import('./pages/HomePage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const RentalsPage = lazy(() => import('./pages/RentalsPage'));
const OwnersPage = lazy(() => import('./pages/OwnersPage'));
const DetailPage = lazy(() => import('./pages/DetailPage'));
const UserProfile = lazy(() => import('./pages/UserProfile'));
const UserReservations = lazy(() => import('./pages/UserReservations'));
const UserFavorites = lazy(() => import('./pages/UserFavorites'));
const ReservationPage = lazy(() => import('./pages/ReservationPage'));
const LegalPage = lazy(() => import('./pages/LegalPage')); // Sadece lazy load - TEK IMPORT
const AuthCallback = lazy(() => import('./pages/AuthCallback'));

// Modals (bunlar lazy load edilmez)
import LoginModal from './components/modals/LoginModal';
import RegisterModal from './components/modals/RegisterModal';
import DetailModal from './components/modals/DetailModal';

// Components
import Toast from './components/common/Toast';

// Utils
import { translations } from './utils/translations';
import { defaultSiteImages } from './utils/constants';

// Types
interface ToastMessage {
  id: number;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

// Loading component - Mobile optimized
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 md:h-16 md:w-16 border-4 border-[#ff9800] border-t-transparent mx-auto mb-4"></div>
      <p className="text-gray-600 text-base md:text-lg">Yükleniyor...</p>
    </div>
  </div>
);

// Mobile detection hook
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
};

// Ana App Component
function App() {
  // Mobile viewport meta tags
  useEffect(() => {
    // Viewport meta tag
    let viewportMeta = document.querySelector('meta[name="viewport"]');
    if (!viewportMeta) {
      viewportMeta = document.createElement('meta');
      viewportMeta.setAttribute('name', 'viewport');
      document.head.appendChild(viewportMeta);
    }
    viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes, viewport-fit=cover');

    // Theme color meta tag
    let themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (!themeColorMeta) {
      themeColorMeta = document.createElement('meta');
      themeColorMeta.setAttribute('name', 'theme-color');
      document.head.appendChild(themeColorMeta);
    }
    themeColorMeta.setAttribute('content', '#ff9800');

    // Apple mobile web app capable
    let appleMeta = document.querySelector('meta[name="apple-mobile-web-app-capable"]');
    if (!appleMeta) {
      appleMeta = document.createElement('meta');
      appleMeta.setAttribute('name', 'apple-mobile-web-app-capable');
      appleMeta.setAttribute('content', 'yes');
      document.head.appendChild(appleMeta);
    }

    // Apple status bar style
    let statusBarMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
    if (!statusBarMeta) {
      statusBarMeta = document.createElement('meta');
      statusBarMeta.setAttribute('name', 'apple-mobile-web-app-status-bar-style');
      statusBarMeta.setAttribute('content', 'default');
      document.head.appendChild(statusBarMeta);
    }

    // Prevent iOS bounce effect
    document.body.style.overscrollBehavior = 'none';

    // iOS input zoom fix - minimum font size
    const style = document.createElement('style');
    style.innerHTML = `
      @supports (-webkit-touch-callout: none) {
        input[type="text"],
        input[type="email"],
        input[type="tel"],
        input[type="password"],
        input[type="number"],
        textarea,
        select {
          font-size: 16px !important;
        }
      }
    `;
    document.head.appendChild(style);

    return () => {
      // Cleanup
      document.body.style.overscrollBehavior = '';
    };
  }, []);

  return (
    <HelmetProvider>
      <BrowserRouter>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </BrowserRouter>
    </HelmetProvider>
  );
}



// App içeriği - tüm state ve logic burada
const AppContent: React.FC = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  // YENİ - URL'den dili al
  const getLanguageFromURL = () => {
    const path = window.location.pathname;
    if (path.startsWith('/en')) return 'en';
    if (path.startsWith('/ar')) return 'ar';
    if (path.startsWith('/ru')) return 'ru';
    return 'tr';
  };
  
  // Language - localStorage'dan al (mobile için önemli)
  const [currentLang, setCurrentLang] = useState(() => {
    const urlLang = getLanguageFromURL();
    const storedLang = localStorage.getItem('preferredLanguage');
    
    // URL'deki dil öncelikli
    if (urlLang !== 'tr') {
      return urlLang;
    }
    
    return storedLang || 'tr';
  });

  // YENİ - Dil değiştirme fonksiyonu (URL'li)
  const changeLanguage = (newLang: string) => {
    const currentPath = window.location.pathname;
    // Mevcut dil prefix'ini temizle
    const pathWithoutLang = currentPath.replace(/^\/(en|ar|ru)/, '');
    
    if (newLang === 'tr') {
      navigate(pathWithoutLang || '/');
    } else {
      navigate(`/${newLang}${pathWithoutLang}`);
    }
    
    setCurrentLang(newLang);
    localStorage.setItem('preferredLanguage', newLang);
  };

  // Language değiştiğinde localStorage'a kaydet
  useEffect(() => {
    localStorage.setItem('preferredLanguage', currentLang);
  }, [currentLang]);

  // WhatsApp Modal States
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [whatsAppData,] = useState<{
    url: string;
    reservationNumber: string;
  }>({
    url: '',
    reservationNumber: ''
  });

  // Data States
  const [apartments, setApartments] = useState<any[]>([]);
  const [tours, setTours] = useState<any[]>([]);
  const [siteImages, setSiteImages] = useState(defaultSiteImages);

  // Modal States
  const [activeModal, setActiveModal] = useState<'login' | 'register' | 'forgotPassword' | 'detail' | 'reservation' | null>(null);

  // Selected Items
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedItemType, setSelectedItemType] = useState<'apartments' | 'tours' | null>(null);
  const [modalItem, setModalItem] = useState<any>(null);
  const [modalItemType, setModalItemType] = useState<'apartments' | 'tours' | null>(null);

  // EMAIL VERIFICATION STATES - YENİ
  const [verificationStep, setVerificationStep] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [tempToken, setTempToken] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  // Form Data - GÜNCELLEME: Tutarlı isimlendirme
  const [formData, setFormData] = useState({
    login: {
      email: '',
      password: '',
      rememberMe: false
    },
    register: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      phone: '',
      acceptTerms: false
    },
    reservation: {
      name: '',
      email: '',
      phone: '',
      checkIn: '',
      checkOut: '',
      adults: 1,
      children: 0,
      childrenAgeGroups: { 
        above7: 0,
        between2And7: 0,
        under2: 0
      },
      message: '',
      country: 'TR',
      isRefundable: false // YENİ - İptal edilebilir rezervasyon seçeneği
    }
  });

  // Global search state - GÜNCELLEME: Tutarlı isimlendirme
  const [globalSearchParams, setGlobalSearchParams] = useState({
    checkIn: '',
    checkOut: '',
    adults: 1,
    children: 0,
    childrenAgeGroups: { // Tutarlı isimlendirme
      above7: 0,
      between2And7: 0, // under7 yerine
      under2: 0 // infant yerine
    }
  });

  // Toast Messages
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Modal açıkken scroll'u engelle
  useEffect(() => {
    const hasModal = activeModal !== null;
    if (hasModal) {
      document.body.style.overflow = 'hidden';
      // iOS için ek önlem
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [activeModal]);

  // Current translations
  const t = (translations as any)[currentLang];

  // GÜNCELLEME: Navigation helper fonksiyonu - DİL PREFIX'İNİ KORUR
  const navigateWithLang = (path: string) => {
    const langPrefix = currentLang === 'tr' ? '' : `/${currentLang}`;
    navigate(`${langPrefix}${path}`);
  };

  // GÜNCELLEME: Navigation function - DİL PREFIX'İNİ KORUR
  const setCurrentView = (view: string) => {
    switch(view) {
      case 'home':
        navigateWithLang('/');
        break;
      case 'rentals':
        navigateWithLang('/rentals');
        break;
      case 'owners':
        navigateWithLang('/owners');
        break;
      case 'detail':
        if (selectedItem && selectedItemType) {
          navigateWithLang(`/detail/${selectedItemType}/${selectedItem.id}`);
        }
        break;
    }
  };

  // Fetch functions - GÜNCELLEME: childrenAges tipini düzelt
  const fetchApartments = async (
    checkIn?: string, 
    checkOut?: string,
    adults?: number,
    children?: number,
    childrenAgeGroups?: { above7: number; between2And7: number; under2: number }
  ) => {
    try {
      let data;
      
      if (checkIn && checkOut) {
        // Parametreler varsa yaş grupları ile birlikte gönder
        data = await apartmentAPI.getAvailable({
          checkIn,
          checkOut,
          adults: adults || globalSearchParams.adults,
          children: children || globalSearchParams.children,
          childrenAges: childrenAgeGroups || globalSearchParams.childrenAgeGroups
        });
      } else {
        // Parametreler yoksa tüm daireleri getir
        data = await apartmentAPI.getAll();
      }
      
      const apartmentsWithReservations = data.map((apt: any) => ({
        ...apt,
        id: apt._id || apt.id,
        reservations: apt.reservations || []
      }));
      
      setApartments(apartmentsWithReservations);
    } catch (error) {
      console.error('Daireler yüklenemedi:', error);
      addToast('Daireler yüklenemedi', 'error');
    }
  };

  const fetchTours = async () => {
    try {
      const data = await tourAPI.getAll();
      const toursWithId = data.map((tour: any) => ({
        ...tour,
        id: tour._id || tour.id
      }));
      setTours(toursWithId);
    } catch (error) {
      console.error('Turlar yüklenemedi:', error);
      addToast('Turlar yüklenemedi', 'error');
    }
  };

  const fetchSiteImages = async () => {
    try {
      const response = await siteImageAPI.getAll();
      const images = response;
      
      const heroMain = images.find((img: any) => img.category === 'hero');
      const heroRentals = images.filter((img: any) => img.category === 'hero-rentals').map((img: any) => img.url);
      const heroApartments = images.find((img: any) => img.category === 'hero-apartments');
      const heroTours = images.find((img: any) => img.category === 'hero-tours');
      
      setSiteImages({
        heroMain: heroMain?.url || defaultSiteImages.heroMain,
        heroRentals: heroRentals.length > 0 ? heroRentals : defaultSiteImages.heroRentals,
        heroApartments: heroApartments?.url || defaultSiteImages.heroApartments,
        heroTours: heroTours?.url || defaultSiteImages.heroTours
      });
    } catch (error) {
      console.error('Site görselleri yüklenemedi:', error);
    }
  };

  // Toast functions
  const addToast = (message: string, type: ToastMessage['type'] = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  // Modal handlers
  const openModal = (modalType: 'login' | 'register' | 'forgotPassword' | 'detail' | 'reservation') => {
    setActiveModal(modalType);
  };

  const closeModal = () => {
    setActiveModal(null);
  };

  // GÜNCELLEME: handleOpenModal'da childrenAgeGroups'u da ekle
  const handleOpenModal = (item: any, type: string) => {
    setSelectedItem(item);
    setSelectedItemType(type as 'apartments' | 'tours');
    setModalItem(item);
    setModalItemType(type as 'apartments' | 'tours');
    
    if (type === 'apartments' && globalSearchParams.checkIn && globalSearchParams.checkOut) {
      setFormData(prev => ({
        ...prev,
        reservation: {
          ...prev.reservation,
          checkIn: globalSearchParams.checkIn,
          checkOut: globalSearchParams.checkOut,
          adults: globalSearchParams.adults,
          children: globalSearchParams.children,
          childrenAgeGroups: globalSearchParams.childrenAgeGroups // YENİ
        }
      }));
    }
    
    openModal('detail');
  };

  const handleCloseModal = () => {
    closeModal();
    setModalItem(null);
    setModalItemType(null);
  };

  // GÜNCELLEME: handleDetailNavigation - DİL PREFIX'İNİ KORUR
  const handleDetailNavigation = (scrollToReservation = false) => {
    handleCloseModal();
    setSelectedItem(modalItem);
    setSelectedItemType(modalItemType);
    
    const itemId = modalItem.id || modalItem._id || modalItem.apartmentNumber || modalItem.tourNumber;
    
    if (scrollToReservation) {
      // Direkt rezervasyon sayfasına git
      navigateWithLang(`/reservation/${modalItemType}/${itemId}`);
    } else {
      navigateWithLang(`/detail/${modalItemType}/${itemId}`);
    }
  };

  // Auth handlers
const handleLogin = async () => {
  try {
    const response = await authAPI.login({
      email: formData.login.email,
      password: formData.login.password
    });
    
    // Token'ı kaydet
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
    
    // Başarı mesajı
    addToast(t.loginSuccess + ' ' + response.user.name || 'Hoş geldiniz ' + response.user.name, 'success');
    closeModal();
    
    // Form temizle
    setFormData(prev => ({
      ...prev,
      login: { email: '', password: '', rememberMe: false }
    }));
    
    // Sayfayı yenile
    window.location.reload();
    
  } catch (error: any) {
    // Rate limit kontrolü
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'];
      const minutes = retryAfter ? Math.ceil(retryAfter / 60) : 15;
      
      addToast(
        t.tooManyAttempts || `Çok fazla giriş denemesi yaptınız. Lütfen ${minutes} dakika sonra tekrar deneyin.`,
        'error'
      );
    } else {
      // Diğer hatalar
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          t.loginFailed || 
                          'Giriş başarısız';
      addToast(errorMessage, 'error');
    }
  }
};

  const handleRegister = async () => {
    const t = translations[currentLang as keyof typeof translations];
    
    try {
      // Frontend validasyonları
      const errors: Record<string, string> = {};
      
      if (!formData.register.name || formData.register.name.trim().length < 2) {
        errors.name = t.nameRequired + ' (Min. 2 karakter)' || 'Name must be at least 2 characters';
      }
      
      if (!formData.register.email) {
        errors.email = t.emailRequired || 'Email is required';
      } else if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(formData.register.email)) {
        errors.email = t.invalidEmail || 'Please enter a valid email';
      }
      
      if (!formData.register.phone) {
        errors.phone = t.phoneRequired || 'Phone number is required';
      } else {
        const phoneValue = formData.register.phone;
        const country = countryPhoneCodes.find(c => phoneValue.startsWith(c.dial_code));
        
        if (country) {
          const phoneNumber = phoneValue.replace(country.dial_code, '').trim();
          const validation = validatePhoneNumber(phoneNumber, country.code);
          
          if (!validation.isValid) {
            errors.phone = validation.error || t.invalidPhone || 'Geçersiz telefon numarası';
          }
        } else {
          errors.phone = t.selectCountryCode || 'Lütfen ülke kodu seçin';
        }
      }
      
      if (!formData.register.password) {
        errors.password = t.requiredField || 'Password is required';
      } else if (formData.register.password.length < 6) {
        errors.password = t.passwordTooShort || 'Password must be at least 6 characters';
      }
      
      if (formData.register.password !== formData.register.confirmPassword) {
        errors.confirmPassword = t.passwordsNotMatch || 'Passwords do not match';
      }
      
      if (!formData.register.acceptTerms) {
        errors.terms = t.acceptTermsRequired || 'You must accept the terms';
      }
      
   
      
      // API çağrısı
      const response = await authAPI.register({
        name: formData.register.name.trim(),
        email: formData.register.email.toLowerCase().trim(),
        password: formData.register.password,
        phone: formData.register.phone.trim(),
        preferredLanguage: currentLang
      });
      
      // YENİ - Email verification gerekiyorsa
      if (response.requiresVerification && response.tempToken) {
        setTempToken(response.tempToken);
        setVerificationStep(true);
        addToast(t.verificationCodeSent || 'Doğrulama kodu email adresinize gönderildi', 'success');
      } else {
        // Eski akış (eğer verification kapalıysa)
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        
        addToast(`${t.registerSuccess || 'Registration successful!'} ${response.user.name}`, 'success');
        closeModal();
        
        setFormData(prev => ({
          ...prev,
          register: {
            name: '',
            email: '',
            password: '',
            confirmPassword: '',
            phone: '',
            acceptTerms: false
          }
        }));
        
        window.location.reload();
      }
      
    } catch (error: any) {
      console.error('Register error:', error);
      
      if (error.response?.data?.errors) {
        if (error.response.data.errors.email) {
          addToast(t.emailAlreadyExists || 'This email is already in use', 'error');
        } else {
          const firstError = Object.values(error.response.data.errors)[0] as string;
          addToast(firstError, 'error');
        }
      } else if (error.message) {
        if (error.message.includes('Network') || error.message.includes('bağlan')) {
          addToast(t.networkError || 'Please check your internet connection', 'error');
        } else {
          addToast(error.message, 'error');
        }
      } else {
        addToast(t.registrationFailed || 'Registration failed. Please try again.', 'error');
      }
    }
  };

  // YENİ - Email verification handler
  const handleVerifyEmail = async () => {
    const t = translations[currentLang as keyof typeof translations];
    
    if (verificationCode.length !== 6) {
      addToast(t.enterVerificationCode || 'Lütfen 6 haneli kodu girin', 'error');
      return;
    }
    
    setIsVerifying(true);
    
    try {
      const response = await authAPI.verifyEmail({
        code: verificationCode,
        tempToken: tempToken
      });
      
      // Başarılı verification
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      addToast(t.emailVerificationSuccess || 'Email adresiniz başarıyla doğrulandı!', 'success');
      
      // State'leri temizle
      setVerificationStep(false);
      setVerificationCode('');
      setTempToken('');
      closeModal();
      
      // Form temizle
      setFormData(prev => ({
        ...prev,
        register: {
          name: '',
          email: '',
          password: '',
          confirmPassword: '',
          phone: '',
          acceptTerms: false
        }
      }));
      
      // Sayfayı yenile
      setTimeout(() => {
        window.location.reload();
      }, 1500);
      
    } catch (error: any) {
      console.error('Verification error:', error);
      
      const errorMap: Record<string, string> = {
        'expired': t.verificationCodeExpired || 'Doğrulama kodunun süresi dolmuş',
        'invalid_code': t.invalidVerificationCode || 'Geçersiz doğrulama kodu',
        'too_many_attempts': t.tooManyVerificationAttempts || 'Çok fazla hatalı deneme'
      };
      
      const errorMessage = error.response?.data?.error 
        ? errorMap[error.response.data.error] || error.response.data.message
        : error.message || t.verificationFailed || 'Doğrulama başarısız';
      
      addToast(errorMessage, 'error');
    } finally {
      setIsVerifying(false);
    }
  };

  // YENİ - Resend verification code handler
  const handleResendVerificationCode = async () => {
    const t = translations[currentLang as keyof typeof translations];
    
    setIsResending(true);
    
    try {
      await authAPI.resendVerificationCode({
        tempToken: tempToken
      });
      
      addToast(t.resendCodeSuccess || 'Yeni doğrulama kodu gönderildi', 'success');
      setVerificationCode('');
      
    } catch (error: any) {
      console.error('Resend code error:', error);
      
      if (error.response?.status === 429) {
        addToast(t.resendCodeTooSoon || 'Yeni kod için lütfen biraz bekleyin', 'warning');
      } else {
        addToast(t.resendCodeFailed || 'Kod gönderilemedi. Lütfen tekrar deneyin', 'error');
      }
    } finally {
      setIsResending(false);
    }
  };

  // Helper functions
  const updateLoginData = (data: Partial<typeof formData.login>) => {
    setFormData(prev => ({
      ...prev,
      login: { ...prev.login, ...data }
    }));
  };

  const updateRegisterData = (data: Partial<typeof formData.register>) => {
    setFormData(prev => ({
      ...prev,
      register: { ...prev.register, ...data }
    }));
  };


  // Initial data load
  useEffect(() => {
    fetchSiteImages();
    fetchApartments();
    fetchTours();
  }, []);

  // Detail Page Component - params kullanarak
  const DetailPageWrapper = () => {
    const { type, id } = useParams();
    const [localLoading, setLocalLoading] = useState(false);
    
    useEffect(() => {
    // Önce state'den bulmayı dene
    if (type && id) {
      if (type === 'apartments') {
        // Apartments için
        const apartment = apartments.find(apt => 
          apt.id === id || 
          apt._id === id
        );
        
        if (apartment) {
          setSelectedItem(apartment);
          setSelectedItemType('apartments');
        } else if (apartments.length === 0) {
          // State boşsa API'den çek
          setLocalLoading(true);
          apartmentAPI.getOne(id)
            .then(response => {
              const apt = {
                ...response,
                id: response._id || response.id,
                _id: response._id || response.id,
                reservations: response.reservations || []
              };
              setSelectedItem(apt);
              setSelectedItemType('apartments');
            })
            .catch(error => {
              console.error('Apartment fetch error:', error);
              setSelectedItem(null);
            })
            .finally(() => setLocalLoading(false));
        }
      } else if (type === 'tours') {
        // Tours için
        const tour = tours.find(t => 
          t.id === id || 
          t._id === id
        );
        
        if (tour) {
          setSelectedItem(tour);
          setSelectedItemType('tours');
        } else if (tours.length === 0) {
          // State boşsa API'den çek
          setLocalLoading(true);
          tourAPI.getOne(id)
            .then(response => {
              const tr = {
                ...response,
                id: response._id || response.id,
                _id: response._id || response.id
              };
              setSelectedItem(tr);
              setSelectedItemType('tours');
            })
            .catch(error => {
              console.error('Tour fetch error:', error);
              setSelectedItem(null);
            })
            .finally(() => setLocalLoading(false));
        }
      }
    }
  }, [type, id, apartments.length, tours.length]);

    // Loading durumu
    if (localLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#ff9800] border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600">Yükleniyor...</p>
          </div>
        </div>
      );
    }

    // Henüz seçili item yoksa ve loading de değilse
    if (!selectedItem && !localLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="text-center">
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4">
              {type === 'apartments' ? 'Daire' : 'Tur'} bulunamadı
            </h2>
            <button
              onClick={() => navigateWithLang('/rentals')} 
              className="bg-[#ff9800] text-white px-6 py-3 rounded-full hover:bg-[#f57c00] transition-colors"
            >
              Tüm {type === 'apartments' ? 'Dairelere' : 'Turlara'} Dön
            </button>
          </div>
        </div>
      );
    }

    // selectedItem varsa DetailPage'i render et
    if (selectedItem) {
      return (
        <DetailPage
          selectedItem={selectedItem}
          selectedItemType={selectedItemType}
          currentLang={currentLang}
          setCurrentLang={changeLanguage}
          translations={translations}
          setShowLoginModal={() => openModal('login')}
          setCurrentView={setCurrentView}
          searchParams={globalSearchParams} 
        />
      );
    }

    return null;
  };

  // YENİ - LanguageRoutes component
  const LanguageRoutes = ({ currentLang, changeLanguage, ...props }: any) => {
    return (
      <Routes>
        {/* Ana Sayfa */}
        <Route path="/" element={
          <>
            <SEOHead type="home" currentLang={currentLang} />
            <HomePage
              {...props}
              currentLang={currentLang}
              setCurrentLang={changeLanguage}
            />
          </>
        } />
        
        {/* Rentals Sayfası */}
        <Route path="/rentals" element={
          <>
            <SEOHead type="rentals" currentLang={currentLang} />
            <RentalsPage
              {...props}
              currentLang={currentLang}
              setCurrentLang={changeLanguage}
            />
          </>
        } />
        
        {/* Owners Sayfası */}
        <Route path="/owners" element={
          <>
            <SEOHead type="owners" currentLang={currentLang} />
            <OwnersPage
              {...props}
              currentLang={currentLang}
              setCurrentLang={changeLanguage}
            />
          </>
        } />
        
        {/* Detail Sayfası */}
        <Route path="/detail/:type/:id" element={
          <DetailWithSEO 
            {...props}
            currentLang={currentLang}
            changeLanguage={changeLanguage}
          />
        } />
        
        {/* Diğer route'lar */}
        <Route path="/reservation/:type/:id" element={
          <ReservationPage
            {...props}
            currentLang={currentLang}
            setCurrentLang={changeLanguage}
          />
        } />
        
        <Route path="/legal/:type" element={
          <LegalPage 
            currentLang={currentLang}
            translations={translations}
          />
        } />
        
        {/* Protected Routes */}
        <Route path="/profile" element={
          <ProtectedRoute>
            <UserProfile
              {...props}
              currentLang={currentLang}
              setCurrentLang={changeLanguage}
            />
          </ProtectedRoute>
        } />
        
        <Route path="/reservations" element={
          <ProtectedRoute>
            <UserReservations
              {...props}
              currentLang={currentLang}
              setCurrentLang={changeLanguage}
            />
          </ProtectedRoute>
        } />
        
        <Route path="/favorites" element={
          <ProtectedRoute>
            <UserFavorites
              {...props}
              currentLang={currentLang}
              setCurrentLang={changeLanguage}
            />
          </ProtectedRoute>
        } />
        
        <Route path="/reset-password" element={
          <ResetPasswordPage />
        } />
        
        <Route path="/auth/callback" element={
          <AuthCallback />
        } />
      </Routes>
    );
  };

  // YENİ - DetailWithSEO component
  // YENİ - DetailWithSEO component - Props kullanılan versiyon
  const DetailWithSEO = (props: any) => {
    const { type, id } = useParams();
    const { currentLang, changeLanguage, ...restProps } = props;
    
    return (
      <>
        <SEOHead 
          type={type === 'apartments' ? 'apartment' : 'tour'} 
          id={id} 
          currentLang={currentLang} 
        />
        <DetailPageWrapper {...restProps} />
      </>
    );
  };

  // YENİ - allProps objesi
  const allProps = {
    apartments,
    tours,
    siteImages,
    globalSearchParams,
    setGlobalSearchParams,
    fetchApartments,
    fetchTours,
    translations,
    setCurrentView,
    setShowLoginModal: () => openModal('login'),
    handleOpenModal,
    selectedItem,
    selectedItemType,
    modalItem,
    modalItemType,
    formData,
    setFormData,
    addToast
  };

    return (
      <div className="min-h-screen flex flex-col">
        {/* Ana içerik wrapper */}
        <main className="flex-grow">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Türkçe (default) Routes */}
              <Route path="/*" element={
                <LanguageRoutes 
                  currentLang="tr" 
                  changeLanguage={changeLanguage}
                  {...allProps}
                />
              } />
              
              {/* İngilizce Routes */}
              <Route path="/en/*" element={
                <LanguageRoutes 
                  currentLang="en" 
                  changeLanguage={changeLanguage}
                  {...allProps}
                />
              } />
              
              {/* Arapça Routes */}
              <Route path="/ar/*" element={
                <LanguageRoutes 
                  currentLang="ar" 
                  changeLanguage={changeLanguage}
                  {...allProps}
                />
              } />
              
              {/* Rusça Routes */}
              <Route path="/ru/*" element={
                <LanguageRoutes 
                  currentLang="ru" 
                  changeLanguage={changeLanguage}
                  {...allProps}
                />
              } />
            </Routes>
          </Suspense>
        </main>

        {/* Footer - TÜM SAYFALARDA GÖRÜNÜR */}
        <Footer 
          currentLang={currentLang}
          translations={translations}
        />

        {/* Modals */}
        <DetailModal
          isOpen={activeModal === 'detail'}
          onClose={handleCloseModal}
          item={modalItem}
          itemType={modalItemType}
          currentLang={currentLang}
          translations={translations}
          onDetailNavigation={handleDetailNavigation}
          searchParams={globalSearchParams}
          onShowLoginModal={() => openModal('login')}
        />

        {/* WhatsApp Redirect Modal */}
        <WhatsAppRedirectModal
          isOpen={showWhatsAppModal}
          onClose={() => setShowWhatsAppModal(false)}
          whatsappUrl={whatsAppData.url}
          reservationNumber={whatsAppData.reservationNumber}
          translations={translations}
          currentLang={currentLang}
        />
        
        <LoginModal
          isOpen={activeModal === 'login'}
          onClose={closeModal}
          loginData={formData.login}
          setLoginData={updateLoginData}
          onLogin={handleLogin}
          onSwitchToRegister={() => {
            closeModal();
            openModal('register');
          }}
          onSwitchToForgotPassword={() => setActiveModal('forgotPassword')}
          translations={translations}
          currentLang={currentLang}
        />

        {/* Forgot Password Modal - YENİ */}
        <ForgotPasswordModal
          isOpen={activeModal === 'forgotPassword'}
          onClose={() => setActiveModal(null)}
          onBackToLogin={() => setActiveModal('login')}
          translations={translations}
          currentLang={currentLang}
        />
        
        <RegisterModal
          isOpen={activeModal === 'register'}
          onClose={closeModal}
          registerData={formData.register}
          setRegisterData={updateRegisterData}
          onRegister={handleRegister}
          onSwitchToLogin={() => {
            closeModal();
            openModal('login');
          }}
          translations={translations}
          currentLang={currentLang}
          verificationStep={verificationStep}
          verificationCode={verificationCode}
          setVerificationCode={setVerificationCode}
          onVerifyCode={handleVerifyEmail}
          onResendCode={handleResendVerificationCode}
          isVerifying={isVerifying}
          isResending={isResending}
          tempToken={tempToken}
        />
        
        {/* Toast Notifications - Mobile optimized position */}
        <div className={`fixed z-50 space-y-2 ${
          isMobile 
            ? 'top-20 left-4 right-4' 
            : 'bottom-4 right-4'
        }`}>
          {toasts.map((toast) => (
            <Toast
              key={toast.id}
              message={toast.message}
              type={toast.type}
              onClose={() => removeToast(toast.id)}
            />
          ))}
        </div>
      </div>
    );
  };

export default App;