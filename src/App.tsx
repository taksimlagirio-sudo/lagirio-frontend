import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { AuthProvider } from './components/contexts/AuthContext';
import { authAPI, apartmentAPI, siteImageAPI, tourAPI } from './utils/api';
import ProtectedRoute from './components/ProtectedRoute';
import { validatePhoneNumber } from './utils/phoneValidation';
import { countryPhoneCodes } from './utils/countryPhoneCodes';
import Footer from './components/Footer';
import ForgotPasswordModal from './components/modals/ForgotPasswordModal';
import WhatsAppRedirectModal from './components/modals/WhatsAppRedirectModal';
import { HelmetProvider } from 'react-helmet-async';
import SEOHead from './components/SEOHead';

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
const LegalPage = lazy(() => import('./pages/LegalPage'));
const AuthCallback = lazy(() => import('./pages/AuthCallback'));

// Modals
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

// Loading component
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
    let viewportMeta = document.querySelector('meta[name="viewport"]');
    if (!viewportMeta) {
      viewportMeta = document.createElement('meta');
      viewportMeta.setAttribute('name', 'viewport');
      document.head.appendChild(viewportMeta);
    }
    viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes, viewport-fit=cover');

    let themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (!themeColorMeta) {
      themeColorMeta = document.createElement('meta');
      themeColorMeta.setAttribute('name', 'theme-color');
      document.head.appendChild(themeColorMeta);
    }
    themeColorMeta.setAttribute('content', '#ff9800');

    let appleMeta = document.querySelector('meta[name="apple-mobile-web-app-capable"]');
    if (!appleMeta) {
      appleMeta = document.createElement('meta');
      appleMeta.setAttribute('name', 'apple-mobile-web-app-capable');
      appleMeta.setAttribute('content', 'yes');
      document.head.appendChild(appleMeta);
    }

    let statusBarMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
    if (!statusBarMeta) {
      statusBarMeta = document.createElement('meta');
      statusBarMeta.setAttribute('name', 'apple-mobile-web-app-status-bar-style');
      statusBarMeta.setAttribute('content', 'default');
      document.head.appendChild(statusBarMeta);
    }

    document.body.style.overscrollBehavior = 'none';

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
  
  // URL'den dili al
  const getLanguageFromURL = () => {
    const path = window.location.pathname;
    if (path.startsWith('/en')) return 'en';
    if (path.startsWith('/ar')) return 'ar';
    if (path.startsWith('/ru')) return 'ru';
    return 'tr';
  };
  
  const [currentLang, setCurrentLang] = useState(() => {
    const urlLang = getLanguageFromURL();
    const storedLang = localStorage.getItem('preferredLanguage');
    
    if (urlLang !== 'tr') {
      return urlLang;
    }
    
    return storedLang || 'tr';
  });

  const changeLanguage = (newLang: string) => {
    const currentPath = window.location.pathname;
    const pathWithoutLang = currentPath.replace(/^\/(en|ar|ru)/, '');
    
    if (newLang === 'tr') {
      navigate(pathWithoutLang || '/');
    } else {
      navigate(`/${newLang}${pathWithoutLang}`);
    }
    
    setCurrentLang(newLang);
    localStorage.setItem('preferredLanguage', newLang);
  };

  useEffect(() => {
    localStorage.setItem('preferredLanguage', currentLang);
  }, [currentLang]);

  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [whatsAppData,] = useState<{
    url: string;
    reservationNumber: string;
  }>({
    url: '',
    reservationNumber: ''
  });

  const [apartments, setApartments] = useState<any[]>([]);
  const [tours, setTours] = useState<any[]>([]);
  const [siteImages, setSiteImages] = useState(defaultSiteImages);
  const [isGlobalSearching, setIsGlobalSearching] = useState(false);
  const [activeModal, setActiveModal] = useState<'login' | 'register' | 'forgotPassword' | 'detail' | 'reservation' | null>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedItemType, setSelectedItemType] = useState<'apartments' | 'tours' | null>(null);
  const [modalItem, setModalItem] = useState<any>(null);
  const [modalItemType, setModalItemType] = useState<'apartments' | 'tours' | null>(null);
  const [verificationStep, setVerificationStep] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [tempToken, setTempToken] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

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
      isRefundable: false
    }
  });

  const [globalSearchParams, setGlobalSearchParams] = useState({
    checkIn: '',
    checkOut: '',
    adults: 1,
    children: 0,
    childrenAgeGroups: {
      above7: 0,
      between2And7: 0,
      under2: 0
    }
  });

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const hasModal = activeModal !== null;
    if (hasModal) {
      document.body.style.overflow = 'hidden';
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

  const t = (translations as any)[currentLang];

  const navigateWithLang = (path: string) => {
    const langPrefix = currentLang === 'tr' ? '' : `/${currentLang}`;
    navigate(`${langPrefix}${path}`);
  };

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
          // YENİ - Slug kontrolü ekle
          if (selectedItemType === 'apartments' && selectedItem.slugs?.[currentLang]) {
            navigateWithLang(`/apartment/${selectedItem.slugs[currentLang]}`);
          } else {
            navigateWithLang(`/detail/${selectedItemType}/${selectedItem.id}`);
          }
        }
        break;
    }
  };

  const fetchApartments = async (
    checkIn?: string, 
    checkOut?: string,
    adults?: number,
    children?: number,
    childrenAgeGroups?: { above7: number; between2And7: number; under2: number }
  ) => {
    try {
      if (checkIn && checkOut) {
        setApartments([]);
        setIsGlobalSearching(true);
      }
      
      let data;
      
      if (checkIn && checkOut) {
        console.log('Gönderilen parametreler:', { checkIn, checkOut, adults, children, childrenAgeGroups });
        
        data = await apartmentAPI.getAvailable({
          checkIn,
          checkOut,
          adults: adults || globalSearchParams.adults,
          children: children || globalSearchParams.children,
          childrenAges: childrenAgeGroups || globalSearchParams.childrenAgeGroups
        });
        
        console.log('Backend response:', data);
      } else {
        data = await apartmentAPI.getAll();
      }
      
      const apartmentsWithReservations = data.map((apt: any) => ({
        ...apt,
        id: apt._id || apt.id,
        reservations: apt.reservations || []
      }));
      
      setApartments(apartmentsWithReservations);
      
      setTimeout(() => {
        setIsGlobalSearching(false);
      }, 300);
      
    } catch (error) {
      console.error('Daireler yüklenemedi:', error);
      addToast('Daireler yüklenemedi', 'error');
      setIsGlobalSearching(false);
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

  const addToast = (message: string, type: ToastMessage['type'] = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const openModal = (modalType: 'login' | 'register' | 'forgotPassword' | 'detail' | 'reservation') => {
    setActiveModal(modalType);
  };

  const closeModal = () => {
    setActiveModal(null);
  };

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
          childrenAgeGroups: globalSearchParams.childrenAgeGroups
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

  const handleDetailNavigation = (scrollToReservation = false) => {
    handleCloseModal();
    setSelectedItem(modalItem);
    setSelectedItemType(modalItemType);
    
    const itemId = modalItem.id || modalItem._id || modalItem.apartmentNumber || modalItem.tourNumber;
    
    if (scrollToReservation) {
      navigateWithLang(`/reservation/${modalItemType}/${itemId}`);
    } else {
      // YENİ - Slug kontrolü
      if (modalItemType === 'apartments' && modalItem.slugs?.[currentLang]) {
        navigateWithLang(`/apartment/${modalItem.slugs[currentLang]}`);
      } else {
        navigateWithLang(`/detail/${modalItemType}/${itemId}`);
      }
    }
  };

  const handleLogin = async () => {
    try {
      const response = await authAPI.login({
        email: formData.login.email,
        password: formData.login.password
      });
      
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      addToast(t.loginSuccess + ' ' + response.user.name || 'Hoş geldiniz ' + response.user.name, 'success');
      closeModal();
      
      setFormData(prev => ({
        ...prev,
        login: { email: '', password: '', rememberMe: false }
      }));
      
      window.location.reload();
      
    } catch (error: any) {
      if (error.response?.status === 429) {
        const retryAfter = error.response.headers['retry-after'];
        const minutes = retryAfter ? Math.ceil(retryAfter / 60) : 15;
        
        addToast(
          t.tooManyAttempts || `Çok fazla giriş denemesi yaptınız. Lütfen ${minutes} dakika sonra tekrar deneyin.`,
          'error'
        );
      } else {
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
      
      const response = await authAPI.register({
        name: formData.register.name.trim(),
        email: formData.register.email.toLowerCase().trim(),
        password: formData.register.password,
        phone: formData.register.phone.trim(),
        preferredLanguage: currentLang
      });
      
      if (response.requiresVerification && response.tempToken) {
        setTempToken(response.tempToken);
        setVerificationStep(true);
        addToast(t.verificationCodeSent || 'Doğrulama kodu email adresinize gönderildi', 'success');
      } else {
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
      
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      addToast(t.emailVerificationSuccess || 'Email adresiniz başarıyla doğrulandı!', 'success');
      
      setVerificationStep(false);
      setVerificationCode('');
      setTempToken('');
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

  useEffect(() => {
    fetchSiteImages();
    fetchApartments();
    fetchTours();
  }, []);

  // YENİ - Apartment Slug Detail Wrapper
  const ApartmentSlugWrapper = () => {
    const { slug } = useParams();
    const [localLoading, setLocalLoading] = useState(false);

    // DEBUG EKLE
    console.log('🔴 ApartmentSlugWrapper:', { 
      slug, 
      selectedItem: !!selectedItem,
      selectedItemType,
      apartments: apartments.length 
    });
    
    useEffect(() => {
      const fetchApartmentBySlug = async () => {
        if (slug) {
          // Önce state'de slug ile arama yap
          const apartment = apartments.find(apt => 
            apt.slugs?.tr === slug ||
            apt.slugs?.en === slug ||
            apt.slugs?.ar === slug ||
            apt.slugs?.ru === slug
          );

          console.log('🟡 Found in state:', !!apartment); // DEBUG

          
          if (apartment) {
            setSelectedItem(apartment);
            setSelectedItemType('apartments');
          } else {
            // State'de yoksa API'den çek
            setLocalLoading(true);
            try {
              const response = await apartmentAPI.getBySlug(slug, currentLang);
              const apt = {
                ...response,
                id: response._id || response.id,
                _id: response._id || response.id,
                reservations: response.reservations || []
              };
              setSelectedItem(apt);
              setSelectedItemType('apartments');
              
              // Eski URL'den gelindiyse redirect kontrolü
              if (response.shouldRedirect && response.redirectUrl) {
                navigateWithLang(response.redirectUrl);
              }
            } catch (error) {
              console.error('Apartment fetch error:', error);
              setSelectedItem(null);
            } finally {
              setLocalLoading(false);
            }
          }
        }
      };
      
      fetchApartmentBySlug();
    }, [slug, apartments, currentLang]);

    if (localLoading) {
      console.log('⏳ Loading...');
      return <PageLoader />;
    }

    if (!selectedItem && !localLoading) {
      console.log('✅ Rendering DetailPage with:', selectedItem); // DEBUG

      return (
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="text-center">
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4">
              Daire bulunamadı
            </h2>
            <button
              onClick={() => navigateWithLang('/rentals')} 
              className="bg-[#ff9800] text-white px-6 py-3 rounded-full hover:bg-[#f57c00] transition-colors"
            >
              Tüm Dairelere Dön
            </button>
          </div>
        </div>
      );
    }

    if (selectedItem) {
      return (
        <DetailPage
          selectedItem={selectedItem}
          selectedItemType="apartments"
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

  // Mevcut DetailPageWrapper (eski ID bazlı)
  // DetailPageWrapper component'inde güncelleme
  const DetailPageWrapper = () => {
    const { type, id } = useParams();
    const [localLoading, setLocalLoading] = useState(false);
    
    useEffect(() => {
      if (type && id) {
        if (type === 'apartments') {
          const apartment = apartments.find(apt => 
            apt.id === id || 
            apt._id === id
          );
          
          if (apartment) {
            setSelectedItem(apartment);
            setSelectedItemType('apartments');
            
            // YENİ - Slug varsa yeni URL'e 301 redirect
            if (apartment.slugs?.[currentLang]) {
              const newUrl = currentLang === 'tr' 
                ? `/apartment/${apartment.slugs[currentLang]}`
                : `/${currentLang}/apartment/${apartment.slugs[currentLang]}`;
              
              // Browser'da replace ile yönlendir (geri butonu sorunlarını önler)
              window.history.replaceState(null, '', newUrl);
              navigateWithLang(`/apartment/${apartment.slugs[currentLang]}`);
              return;
            }
          } else if (apartments.length === 0) {
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
                
                // Slug varsa yeni URL'e yönlendir
                if (apt.slugs?.[currentLang]) {
                  navigateWithLang(`/apartment/${apt.slugs[currentLang]}`);
                }
              })
              .catch(error => {
                console.error('Apartment fetch error:', error);
                setSelectedItem(null);
              })
              .finally(() => setLocalLoading(false));
          }
        } else if (type === 'tours') {
          const tour = tours.find(t => 
            t.id === id || 
            t._id === id
          );
          
          if (tour) {
            setSelectedItem(tour);
            setSelectedItemType('tours');
          } else if (tours.length === 0) {
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
    }, [type, id, apartments.length, tours.length, currentLang]);

    if (localLoading) {
      return <PageLoader />;
    }

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
        
        {/* YENİ - Apartment Slug Route */}
        <Route path="/apartment/:slug" element={
          <>
            <SEOHead type="apartment" currentLang={currentLang} />
            <ApartmentSlugWrapper />
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
        
        {/* Eski Detail Route (Geriye dönük uyumluluk) */}
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
    addToast,
    isGlobalSearching
  };

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Türkçe Routes */}
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