import React, { useState, useEffect } from 'react';
import { 
  Mail, Phone, Calendar, Users, UserCheck, MapPin, 
  ChevronLeft, ChevronRight, AlertCircle, CreditCard, 
  Shield, Loader, Baby, CalendarCheck, TrendingUp,
  Percent, Info, Clock, Star, 
  User, MessageSquare, Bed, Bath, ChevronDown, ChevronUp
} from 'lucide-react';
import Header from '../components/common/Header';
import { monthNames, dayNames, getDaysInMonth, getFirstDayOfMonth } from '../utils/dateHelpers';
import { pricingAPI, apartmentAPI, reservationAPI } from '../utils/api';
import { useAuth } from '../components/contexts/AuthContext';
import Toast from '../components/common/Toast';
import PhoneInput from '../components/common/PhoneInput';
import WhatsAppRedirectModal from '../components/modals/WhatsAppRedirectModal';
import EmailVerificationModal from '../components/modals/EmailVerificationModal';
import { useParams, useNavigate } from 'react-router-dom';


interface ReservationPageProps {
  currentLang: string;
  setCurrentLang: (lang: string) => void;
  translations: any;
  setShowLoginModal: (show: boolean) => void;
  setCurrentView: (view: string) => void;
  apartments: any[];
  tours: any[];
  globalSearchParams?: {
    checkIn: string;
    checkOut: string;
    adults: number;
    children: number;
    childrenAgeGroups?: {
      above7: number;
      between2And7: number;
      under2: number;
    };
    priceBreakdown?: PriceBreakdown;
  };
}

interface ReservationData {
  name: string;
  email: string;
  phone: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  childrenAgeGroups: {
    above7: number;
    between2And7: number;
    under2: number;
  };
  message: string;
  isRefundable?: boolean;
}

interface PriceBreakdown {
  basePrice: number;
  nights: number;
  subtotal: number;
  adultSurcharge: number;
  discountPercentage: number;
  discountAmount: number;
  total: number;
  currency: string;
  refundablePrice?: number;
  refundableIncrease?: number;
}

const ReservationPage: React.FC<ReservationPageProps> = ({
  currentLang,
  setCurrentLang,
  translations,
  setShowLoginModal,
  setCurrentView,
  apartments,
  tours,
  globalSearchParams
}) => {
  const { type, id } = useParams<{ type: string; id: string }>();
  const navigate = useNavigate();

  const { user, isAuthenticated } = useAuth();
  const t = translations[currentLang];
  
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isApartment, setIsApartment] = useState(type === 'apartments');
  const [loading, setLoading] = useState(true);
  
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const [bookedDates, setBookedDates] = useState<string[]>([]);
  const [blockedDates, setBlockedDates] = useState<string[]>([]);

  const [capacityError, setCapacityError] = useState<string>('');
  const [isValidCombination, setIsValidCombination] = useState(true);
  const [minStayError, setMinStayError] = useState<string>('');

  const [canBeRefundable, setCanBeRefundable] = useState(true);

  // Mobile specific states
  const [mobileStep, setMobileStep] = useState(1);
  const [showMobileSummary, setShowMobileSummary] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // WhatsApp Modal States
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [whatsAppData, setWhatsAppData] = useState<{
    url: string;
    reservationNumber: string;
  }>({
    url: '',
    reservationNumber: ''
  });
  
  const [reservationData, setReservationData] = useState<ReservationData>({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    checkIn: globalSearchParams?.checkIn || '',
    checkOut: globalSearchParams?.checkOut || '',
    adults: globalSearchParams?.adults || 2,
    children: globalSearchParams?.children || 0,
    childrenAgeGroups: {
      above7: globalSearchParams?.childrenAgeGroups?.above7 || 0,
      between2And7: globalSearchParams?.childrenAgeGroups?.between2And7 || 0,
      under2: globalSearchParams?.childrenAgeGroups?.under2 || 0
    },
    message: '',
    isRefundable: false
  });
  
  const [priceBreakdown, setPriceBreakdown] = useState<PriceBreakdown | null>(
    globalSearchParams?.priceBreakdown || null
  );
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | null }>({ 
    message: '', 
    type: null 
  });
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const [selectedDate, setSelectedDate] = useState<'checkIn' | 'checkOut' | null>(null);

  // Guest Email Verification States
  const [showGuestVerification, setShowGuestVerification] = useState(false);
  const [guestVerificationCode, setGuestVerificationCode] = useState('');
  const [guestTempToken, setGuestTempToken] = useState('');
  const [isGuestVerifying, setIsGuestVerifying] = useState(false);
  const [isGuestResending, setIsGuestResending] = useState(false);
  const [pendingReservationData, setPendingReservationData] = useState<any>(null);

  // Mobile swipe handlers for calendar
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;
    
    if (isLeftSwipe) {
      setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
    }
    if (isRightSwipe) {
      setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
    }
  };

  // URL'den veya global search'den item'ı yükle
  useEffect(() => {
    const loadItem = async () => {
      setLoading(true);
      try {
        if (type === 'apartments') {
          const apartment = apartments.find(a => 
            a.id === id || a._id === id || 
            a.id === parseInt(id!) || a.apartmentNumber === parseInt(id!)
          );
          if (apartment) {
            setSelectedItem(apartment);
            setIsApartment(true);
          }
        } else if (type === 'tours') {
          const tour = tours.find(t => 
            t.id === id || t._id === id || 
            t.id === parseInt(id!) || t.tourNumber === parseInt(id!)
          );
          if (tour) {
            setSelectedItem(tour);
            setIsApartment(false);
          }
        }
      } catch (error) {
        console.error('Error loading item:', error);
      } finally {
        setLoading(false);
      }
    };

    if ((apartments.length > 0 || tours.length > 0) && type && id) {
      loadItem();
    } else {
      // type veya id yoksa veya apartments/tours boşsa loading'i kapat
      setLoading(false);
    }
  }, [type, id, apartments, tours]);

  useEffect(() => {
    if (user && isAuthenticated) {
      setReservationData(prev => ({
        ...prev,
        name: user.name || prev.name || '',
        email: user.email || prev.email || '',
        phone: user.phone || prev.phone || '',
      }));
    }
  }, [user, isAuthenticated]);

  // Takvim ayını seçilen tarihe göre güncelle
  useEffect(() => {
    if (reservationData.checkIn) {
      const checkInDate = new Date(reservationData.checkIn);
      setCurrentMonth(new Date(checkInDate.getFullYear(), checkInDate.getMonth(), 1));
    } else if (reservationData.checkOut) {
      const checkOutDate = new Date(reservationData.checkOut);
      setCurrentMonth(new Date(checkOutDate.getFullYear(), checkOutDate.getMonth(), 1));
    }
  }, [reservationData.checkIn, reservationData.checkOut]);

  // Availability yükle
  useEffect(() => {
    if (selectedItem && isApartment) {
      fetchAvailability();
    }
  }, [selectedItem, isApartment]);

  useEffect(() => {
    if (reservationData.checkIn && reservationData.checkOut) {
      checkMinimumStay();
    }
  }, [reservationData.checkIn, reservationData.checkOut]);

  // Refundable kontrolü
  useEffect(() => {
    if (reservationData.checkIn) {
      const checkInDate = new Date(reservationData.checkIn);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const daysDiff = Math.ceil((checkInDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      setCanBeRefundable(daysDiff > 7);
      
      if (daysDiff <= 7 && reservationData.isRefundable) {
        setReservationData(prev => ({ ...prev, isRefundable: false }));
      }
    }
  }, [reservationData.checkIn]);

  // Fiyat hesapla
  useEffect(() => {
    if (!globalSearchParams?.priceBreakdown && isApartment && reservationData.checkIn && reservationData.checkOut && selectedItem) {
      calculatePrice();
    }
  }, [reservationData.checkIn, reservationData.checkOut, reservationData.adults, reservationData.children, reservationData.isRefundable, selectedItem, isApartment]);

  useEffect(() => {
    if (isApartment && selectedItem) {
      checkOccupancy();
    }
  }, [reservationData.adults, reservationData.childrenAgeGroups.above7, 
      reservationData.childrenAgeGroups.between2And7, 
      reservationData.childrenAgeGroups.under2, selectedItem]);
  
  // ReservationPage component'inin başına, diğer useEffect'lerden sonra ekleyin:
  useEffect(() => {
    // Sayfa yüklendiğinde en üste scroll
    window.scrollTo(0, 0);
  }, []); // Boş dependency array ile sadece component mount olduğunda çalışır

  // useEffect'e ekleyin
  useEffect(() => {
    if (selectedItem && isApartment) {
      fetchAvailability();
      fetchBlockedDates();
    }
  }, [selectedItem, isApartment]);

  // Hangi step'te hata olduğunu bul
  const getErrorStep = (errors: any) => {
    if (errors.checkIn || errors.checkOut || errors.minStay) return 1;
    if (errors.childrenAges || errors.capacity) return 2;
    if (errors.name || errors.email || errors.phone) return 3;
    return null;
  };

  // Hata mesajlarını topla
  const getErrorSummary = (errors: any) => {
    const messages = [];
    if (errors.checkIn) messages.push(t.checkInRequired || 'Giriş tarihi seçin');
    if (errors.checkOut) messages.push(t.checkOutRequired || 'Çıkış tarihi seçin');
    if (errors.minStay) messages.push(errors.minStay);
    if (errors.name) messages.push(t.nameRequired || 'İsim girin');
    if (errors.email) messages.push(t.emailRequired || 'E-posta girin');
    if (errors.phone) messages.push(t.phoneRequired || 'Telefon girin');
    if (errors.childrenAges) messages.push(errors.childrenAges);
    if (errors.capacity) messages.push(errors.capacity);
    if (errors.terms) messages.push(t.mustAcceptTerms || 'Şartları kabul edin');
    return messages;
  };

  // İlk hataya scroll et
  const scrollToFirstError = (errors: any) => {
    // Öncelik sırası
    const errorFields = [
      { key: 'checkIn', id: 'date-selection' },
      { key: 'checkOut', id: 'date-selection' },
      { key: 'minStay', id: 'date-selection' },
      { key: 'capacity', id: 'guest-info' },
      { key: 'childrenAges', id: 'children-ages' },
      { key: 'name', id: 'personal-info' },
      { key: 'email', id: 'personal-info' },
      { key: 'phone', id: 'personal-info' },
      { key: 'terms', id: 'terms-section' }
    ];

    for (const field of errorFields) {
      if (errors[field.key]) {
        const element = document.getElementById(field.id);
        if (element) {
          const isMobile = window.innerWidth < 768;
          const offset = isMobile ? 100 : 150;
          
          window.scrollTo({
            top: element.offsetTop - offset,
            behavior: 'smooth'
          });
          
          // Elementi highlight et
          element.classList.add('error-highlight');
          setTimeout(() => {
            element.classList.remove('error-highlight');
          }, 3000);
          
          break;
        }
      }
    }
  };

  const fetchAvailability = async () => {
    try {
      const currentApartmentId = selectedItem._id || selectedItem.id;
      
      const apartmentReservations = await reservationAPI.getByApartmentPublic(currentApartmentId);
      
      const bookedDatesArray: string[] = [];
      apartmentReservations.forEach((reservation: any) => {
        const checkIn = new Date(reservation.checkIn);
        const checkOut = new Date(reservation.checkOut);
        
        for (let d = new Date(checkIn); d < checkOut; d.setDate(d.getDate() + 1)) {
          bookedDatesArray.push(d.toISOString().split('T')[0]);
        }
      });
      
      setBookedDates(bookedDatesArray);
      
    } catch (error) {
      console.error('Error fetching reservations:', error);
      try {
        const response = await apartmentAPI.getAvailable({
          checkIn: new Date().toISOString().split('T')[0],
          checkOut: new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString().split('T')[0],
          adults: reservationData.adults,
          children: reservationData.children
        });
        
        const currentApartmentId = selectedItem._id || selectedItem.id;
        const availableApartment = response.data?.find((apt: any) => apt._id === currentApartmentId);
        
        if (!availableApartment) {
          const dates = [];
          const start = new Date();
          const end = new Date();
          end.setMonth(end.getMonth() + 3);
          
          for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            dates.push(d.toISOString().split('T')[0]);
          }
          setBookedDates(dates);
        } else {
          setBookedDates([]);
        }
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
      }
    }
  };

  const fetchBlockedDates = async () => {
    if (!selectedItem || !isApartment) return;
    
    try {
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 3);
      
      const response = await pricingAPI.getDateRange(
        selectedItem._id || selectedItem.id,
        new Date().toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );
      
      const blocked: string[] = [];
      Object.entries(response).forEach(([key, value]: [string, any]) => {
        if (!value.isAvailable) {
          const date = key.split('-').slice(1).join('-');
          blocked.push(date);
        }
      });
      
      setBlockedDates(blocked);
    } catch (error) {
      console.error('Error fetching blocked dates:', error);
    }
  };

  const checkOccupancy = async () => {
    if (!selectedItem || !isApartment) return;
    
    try {
      const response = await apartmentAPI.checkOccupancy(
        selectedItem._id || selectedItem.id,
        {
          adults: reservationData.adults,
          childrenAbove7: reservationData.childrenAgeGroups.above7,
          childrenBetween2And7: reservationData.childrenAgeGroups.between2And7,
          childrenUnder2: reservationData.childrenAgeGroups.under2
        }
      );
      
      setIsValidCombination(response.isValid);
      setCapacityError(response.isValid ? '' : (t.invalidGuestCombination || 'Bu misafir kombinasyonu bu daire için uygun değil'));
    } catch (error) {
      console.error('Kapasite kontrol hatası:', error);
    }
  };

  const checkMinimumStay = async () => {
    if (!reservationData.checkIn || !reservationData.checkOut || !selectedItem) return;
    
    const nights = calculateNights();
    
    try {
      const response = await pricingAPI.checkMinStay({
        apartmentId: selectedItem._id || selectedItem.id,
        checkIn: reservationData.checkIn,
        nights: nights
      });
      
      if (!response.valid) {
        setMinStayError(response.message || `${t.minimumStay || 'Minimum'} ${response.minStay} ${t.nightsStay || 'gece konaklamalısınız'}`);
        return false;
      } else {
        setMinStayError('');
        return true;
      }
    } catch (error) {
      console.error('Min stay check error:', error);
      return true;
    }
  };

  const calculatePrice = async () => {
    if (!reservationData.checkIn || !reservationData.checkOut || !selectedItem) return;
    
    setLoadingPrice(true);
    try {
      const requestData = {
        apartmentId: selectedItem._id || selectedItem.id,
        checkIn: reservationData.checkIn,
        checkOut: reservationData.checkOut,
        adults: reservationData.adults,
        children: reservationData.children,
        childrenAgeGroups: reservationData.children > 0 ? {
          above7: reservationData.childrenAgeGroups.above7,
          between2And7: reservationData.childrenAgeGroups.between2And7,
          under2: reservationData.childrenAgeGroups.under2
        } : undefined,
        isRefundable: reservationData.isRefundable
      };

      const response = await pricingAPI.calculatePrice(requestData);

      setPriceBreakdown({
        basePrice: response.pricePerNight || response.averagePrice || selectedItem.price || 0,
        nights: response.nights || calculateNights() || 1,
        subtotal: response.subtotal || (response.pricePerNight * response.nights) || 0,
        adultSurcharge: response.adultSurcharge || response.extraGuestCharge || 0,
        discountPercentage: response.discountPercentage || 0,
        discountAmount: response.discountAmount || 0,
        total: response.totalPrice || response.total || 0,
        currency: response.currency || 'EUR',
        refundablePrice: response.refundablePrice,
        refundableIncrease: response.refundableIncrease
      });
    } catch (error) {
      console.error('Error calculating price:', error);
      const nights = calculateNights();
      const basePrice = selectedItem.price || 0;
      setPriceBreakdown({
        basePrice,
        nights,
        subtotal: basePrice * nights,
        adultSurcharge: 0,
        discountPercentage: 0,
        discountAmount: 0,
        total: basePrice * nights,
        currency: 'EUR'
      });
    } finally {
      setLoadingPrice(false);
    }
  };

  const isDateBooked = (dateStr: string) => {
    return bookedDates.includes(dateStr);
  };

  const isDateBlocked = (dateStr: string) => {
    return blockedDates.includes(dateStr);
  };

  const handleDateSelect = async (dateStr: string) => {
    if (!reservationData.checkIn || (reservationData.checkIn && reservationData.checkOut)) {
      if (isDateBlocked(dateStr)) {
        setToast({ message: t.dateNotAvailableForCheckin || 'Bu tarih check-in için uygun değil', type: 'error' });
        return;
      }
      setReservationData({ ...reservationData, checkIn: dateStr, checkOut: '' });
      setSelectedDate('checkOut');
      setMinStayError('');
    } else if (reservationData.checkIn && !reservationData.checkOut) {
      if (dateStr < reservationData.checkIn) {
        if (isDateBlocked(dateStr)) {
          setToast({ message: t.dateNotAvailableForCheckin || 'Bu tarih check-in için uygun değil', type: 'error' });
          return;
        }
        setReservationData({ ...reservationData, checkIn: dateStr, checkOut: '' });
        setMinStayError('');
      } else {
        const start = new Date(reservationData.checkIn);
        const end = new Date(dateStr);
        let hasBookedDate = false;
        
        for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
          const checkDate = d.toISOString().split('T')[0];
          if (isDateBooked(checkDate) || isDateBlocked(checkDate)) {
            hasBookedDate = true;
            break;
          }
        }
        
        if (hasBookedDate) {
          setToast({ message: t.unavailableDatesInRange || 'Seçilen tarih aralığında müsait olmayan günler var', type: 'error' });
        } else {
          setReservationData({ ...reservationData, checkOut: dateStr });
          setSelectedDate(null);
        }
      }
    }
  };

  const validateForm = async () => {
    const newErrors: any = {};
    
    if (!reservationData.name) newErrors.name = t.nameRequired || 'İsim gereklidir';
    if (!reservationData.email) newErrors.email = t.emailRequired || 'E-posta gereklidir';
    if (!reservationData.phone) newErrors.phone = t.phoneRequired || 'Telefon gereklidir';
    if (isApartment && !reservationData.checkIn) newErrors.checkIn = t.checkInRequired || 'Giriş tarihi gereklidir';
    if (isApartment && !reservationData.checkOut) newErrors.checkOut = t.checkOutRequired || 'Çıkış tarihi gereklidir';
    if (!termsAccepted) newErrors.terms = t.mustAcceptTerms || 'Şartları kabul etmelisiniz';
    
    if (isApartment && reservationData.checkIn && reservationData.checkOut) {
      const isMinStayValid = await checkMinimumStay();
      if (!isMinStayValid) {
        newErrors.minStay = minStayError;
      }
    }
    
    if (reservationData.children > 0) {
      const totalChildrenAges = reservationData.childrenAgeGroups.above7 + 
                              reservationData.childrenAgeGroups.between2And7 + 
                              reservationData.childrenAgeGroups.under2;
      if (totalChildrenAges !== reservationData.children) {
        newErrors.childrenAges = t.specifyAllChildrenAges || 'Lütfen tüm çocukların yaş gruplarını belirtin';
      }
    }
    
    if (!isValidCombination) {
      newErrors.capacity = t.invalidGuestCombination || 'Bu misafir kombinasyonu bu daire için uygun değil';
    }
    
    setErrors(newErrors);
    
    // Hata varsa işlemleri yap
    if (Object.keys(newErrors).length > 0) {
      // Mobilde doğru step'e git
      const isMobile = window.innerWidth < 768;
      if (isMobile) {
        const errorStep = getErrorStep(newErrors);
        if (errorStep && errorStep !== mobileStep) {
          setMobileStep(errorStep);
          
          // Step değişiminden sonra scroll
          setTimeout(() => {
            scrollToFirstError(newErrors);
          }, 300);
        } else {
          scrollToFirstError(newErrors);
        }
      } else {
        scrollToFirstError(newErrors);
      }
      
      // Hata özetini toast olarak göster
      const errorMessages = getErrorSummary(newErrors);
      if (errorMessages.length > 0) {
        const message = errorMessages.length === 1 
          ? errorMessages[0]
          : `${t.pleaseFillRequired || 'Lütfen eksik alanları doldurun'}:\n• ${errorMessages.join('\n• ')}`;
        
        setToast({ 
          message, 
          type: 'error' 
        });
      }
      
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault?.();
    
    if (pendingReservationData && guestTempToken) {
      setSubmitting(true);
      try {
        const data: any = {
          name: pendingReservationData.name,
          email: pendingReservationData.email,
          phone: pendingReservationData.phone,
          message: pendingReservationData.message,
          adults: pendingReservationData.adults,
          children: pendingReservationData.children,
          childrenAgeGroups: pendingReservationData.children > 0 ? pendingReservationData.childrenAgeGroups : undefined,
          isRefundable: pendingReservationData.isRefundable,
          guestName: pendingReservationData.name,
          guestEmail: pendingReservationData.email,
          guestPhone: pendingReservationData.phone,
          verifiedToken: guestTempToken
        };

        if (pendingReservationData.isApartment) {
          data.apartmentId = pendingReservationData.selectedItem._id || pendingReservationData.selectedItem.id;
          data.checkIn = pendingReservationData.checkIn;
          data.checkOut = pendingReservationData.checkOut;
          data.totalPrice = pendingReservationData.priceBreakdown?.total || pendingReservationData.selectedItem.price;
          
          if (pendingReservationData.isRefundable && pendingReservationData.priceBreakdown?.refundablePrice) {
            data.totalPrice = pendingReservationData.priceBreakdown.total;
            data.refundablePrice = pendingReservationData.priceBreakdown.refundablePrice;
          } else {
            data.totalPrice = pendingReservationData.priceBreakdown?.total || pendingReservationData.selectedItem.price;
            data.refundablePrice = data.totalPrice;
          }
        } else {
          data.tourId = pendingReservationData.selectedItem._id || pendingReservationData.selectedItem.id;
          data.checkIn = pendingReservationData.checkIn || new Date().toISOString().split('T')[0];
          data.checkOut = pendingReservationData.checkOut || new Date().toISOString().split('T')[0];
          data.totalPrice = pendingReservationData.selectedItem.price;
        }
        
        const response = await reservationAPI.create(data);
        
        setToast({ 
          message: t.reservationSuccess || 'Rezervasyonunuz başarıyla oluşturuldu!', 
          type: 'success' 
        });
        
        const whatsappNumber = '905357816469';
        const checkInDate = pendingReservationData.checkIn ? 
          new Date(pendingReservationData.checkIn).toLocaleDateString('en-GB') : 
          new Date().toLocaleDateString('en-GB');
        const checkOutDate = pendingReservationData.checkOut ? 
          new Date(pendingReservationData.checkOut).toLocaleDateString('en-GB') : 
          new Date().toLocaleDateString('en-GB');
        
        const finalPrice = pendingReservationData.isRefundable && pendingReservationData.priceBreakdown?.refundablePrice 
          ? pendingReservationData.priceBreakdown.refundablePrice 
          : (pendingReservationData.priceBreakdown?.total || pendingReservationData.selectedItem.price);
        
        const reservationNumber = response?.reservation?.reservationNumber || 
                                response?.reservationNumber || 
                                response?.data?.reservationNumber ||
                                response?.data?.reservation?.reservationNumber ||
                                'N/A';
        
        const whatsappMessage = encodeURIComponent(
          `🏠 *New Reservation*\n` +
          `📋 Reservation No: ${reservationNumber}\n` +
          `👤 Name: ${pendingReservationData.name}\n` +
          `📅 Check-in: ${checkInDate}\n` +
          `📅 Check-out: ${checkOutDate}\n` +
          `👥 Guests: ${pendingReservationData.adults} Adult${pendingReservationData.adults > 1 ? 's' : ''}${pendingReservationData.children > 0 ? `, ${pendingReservationData.children} Child${pendingReservationData.children > 1 ? 'ren' : ''}` : ''}\n` +
          `🏡 Accommodation: ${pendingReservationData.selectedItem.title || pendingReservationData.selectedItem.name}\n` +
          `💰 Total: €${finalPrice}\n` +
          `📞 Phone: ${pendingReservationData.phone}\n` +
          `📧 Email: ${pendingReservationData.email}\n` +
          `💬 Note: ${pendingReservationData.message || 'No special requests'}`
        );

        const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

        setShowWhatsAppModal(true);
        setWhatsAppData({
          url: whatsappUrl,
          reservationNumber: reservationNumber
        });

        setPendingReservationData(null);
        setGuestTempToken('');

        setTimeout(() => {
          if (isAuthenticated) {
            navigate('/reservations');
          } else {
            setToast({ 
              message: `${t.reservationNumber || 'Rezervasyon Numaranız'}: ${reservationNumber}`, 
              type: 'success' 
            });
          }
        }, 9000);
        
        return;
        
      } catch (error: any) {
        console.error('Rezervasyon hatası:', error);
        setToast({ 
          message: error.response?.data?.message || t.reservationError || 'Rezervasyon oluşturulamadı', 
          type: 'error' 
        });
      } finally {
        setSubmitting(false);
      }
    }
    
    const isValid = await validateForm();
    if (!isValid) return;
    
    if (!isAuthenticated && !guestTempToken) {
      try {
        const response = await reservationAPI.sendGuestVerificationCode({
          email: reservationData.email,
          name: reservationData.name
        });
        
        setGuestTempToken(response.tempToken);
        setShowGuestVerification(true);
        
        setPendingReservationData({
          ...reservationData,
          selectedItem,
          isApartment,
          priceBreakdown
        });
        
        setToast({ 
          message: t.verificationCodeSent || 'Doğrulama kodu email adresinize gönderildi', 
          type: 'success' 
        });
      } catch (error: any) {
        setToast({ 
          message: error.response?.data?.message || t.emailSendFailed || 'Email gönderilemedi', 
          type: 'error' 
        });
      }
      return;
    }
    
    setSubmitting(true);
    try {
      const data: any = {
        name: reservationData.name,
        email: reservationData.email,
        phone: reservationData.phone,
        message: reservationData.message,
        adults: reservationData.adults,
        children: reservationData.children,
        childrenAgeGroups: reservationData.children > 0 ? reservationData.childrenAgeGroups : undefined,
        isRefundable: reservationData.isRefundable,
        guestName: !isAuthenticated ? reservationData.name : undefined,
        guestEmail: !isAuthenticated ? reservationData.email : undefined,
        guestPhone: !isAuthenticated ? reservationData.phone : undefined,
        verifiedToken: guestTempToken || undefined
      };

      if (isApartment) {
        data.apartmentId = selectedItem._id || selectedItem.id;
        data.checkIn = reservationData.checkIn;
        data.checkOut = reservationData.checkOut;
        data.totalPrice = priceBreakdown?.total || selectedItem.price;
        
        if (reservationData.isRefundable) {
          if (!priceBreakdown?.refundablePrice) {
            alert('İptal edilebilir fiyat hesaplanamadı. Lütfen tekrar deneyin.');
            setSubmitting(false);
            return;
          }
          data.totalPrice = priceBreakdown.total;
          data.refundablePrice = priceBreakdown.refundablePrice;
        } else {
          data.totalPrice = priceBreakdown?.total || selectedItem.price;
          data.refundablePrice = data.totalPrice;
        }
      } else {
        data.tourId = selectedItem._id || selectedItem.id;
        data.checkIn = reservationData.checkIn || new Date().toISOString().split('T')[0];
        data.checkOut = reservationData.checkOut || new Date().toISOString().split('T')[0];
        data.totalPrice = selectedItem.price;
      }
      
      const response = await reservationAPI.create(data);
      
      setToast({ 
        message: t.reservationSuccess || 'Rezervasyonunuz başarıyla oluşturuldu!', 
        type: 'success' 
      });
      
      const whatsappNumber = '905357816469';
      const checkInDate = reservationData.checkIn ? 
        new Date(reservationData.checkIn).toLocaleDateString('en-GB') : 
        new Date().toLocaleDateString('en-GB');
      const checkOutDate = reservationData.checkOut ? 
        new Date(reservationData.checkOut).toLocaleDateString('en-GB') : 
        new Date().toLocaleDateString('en-GB');
      
      const finalPrice = reservationData.isRefundable && priceBreakdown?.refundablePrice 
        ? priceBreakdown.refundablePrice 
        : (priceBreakdown?.total || selectedItem.price);
      
      const reservationNumber = response?.reservation?.reservationNumber || 
                              response?.reservationNumber || 
                              response?.data?.reservationNumber ||
                              response?.data?.reservation?.reservationNumber ||
                              'N/A';
      
      const whatsappMessage = encodeURIComponent(
        `🏠 *New Reservation*\n` +
        `📋 Reservation No: ${reservationNumber}\n` +
        `👤 Name: ${reservationData.name}\n` +
        `📅 Check-in: ${checkInDate}\n` +
        `📅 Check-out: ${checkOutDate}\n` +
        `👥 Guests: ${reservationData.adults} Adult${reservationData.adults > 1 ? 's' : ''}${reservationData.children > 0 ? `, ${reservationData.children} Child${reservationData.children > 1 ? 'ren' : ''}` : ''}\n` +
        `🏡 Accommodation: ${selectedItem.title || selectedItem.name}\n` +
        `💰 Total: €${finalPrice}\n` +
        `📞 Phone: ${reservationData.phone}\n` +
        `📧 Email: ${reservationData.email}\n` +
        `💬 Note: ${reservationData.message || 'No special requests'}`
      );

      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

      setShowWhatsAppModal(true);
      setWhatsAppData({
        url: whatsappUrl,
        reservationNumber: reservationNumber
      });

      if (!isAuthenticated) {
        setGuestTempToken('');
        setPendingReservationData(null);
      }

      setTimeout(() => {
        if (isAuthenticated) {
          navigate('/reservations');
        } else {
          setToast({ 
            message: `${t.reservationNumber || 'Rezervasyon Numaranız'}: ${reservationNumber}`, 
            type: 'success' 
          });
        }
      }, 9000);
      
    } catch (error: any) {
      console.error('Rezervasyon hatası:', error);
      setToast({ 
        message: error.response?.data?.message || t.reservationError || 'Rezervasyon oluşturulamadı', 
        type: 'error' 
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Guest Email Verification Handler
  const handleGuestVerifyEmail = async (code?: string) => {
    const verificationCode = code || guestVerificationCode;
    
    if (verificationCode.length !== 6) {
      setToast({ 
        message: t.enterSixDigitCode || 'Lütfen 6 haneli kodu girin', 
        type: 'error' 
      });
      return;
    }
    
    setIsGuestVerifying(true);
    
    try {
      const response = await reservationAPI.verifyGuestEmail({
        tempToken: guestTempToken,
        code: verificationCode
      });
      
      if (response.success) {
        setShowGuestVerification(false);
        setGuestVerificationCode('');
        
        setToast({ 
          message: t.emailVerified || 'Email doğrulandı! Rezervasyonunuz işleniyor...', 
          type: 'success' 
        });
        
        if (pendingReservationData) {
          setTimeout(async () => {
            await handleSubmit();
          }, 500);
        } else {
          console.error('Pending reservation data not found');
          setToast({ 
            message: t.errorOccurred || 'Bir hata oluştu. Lütfen tekrar deneyin.', 
            type: 'error' 
          });
          
          setGuestTempToken('');
          setShowGuestVerification(false);
        }
      }
      
    } catch (error: any) {
      console.error('Guest verification error:', error);
      
      const errorMessages: Record<string, string> = {
        'expired': t.verificationCodeExpired || 'Kodun süresi dolmuş',
        'invalid_code': t.invalidVerificationCode || 'Geçersiz kod', 
        'invalid_token': t.invalidToken || 'Geçersiz doğrulama oturumu',
        'too_many_attempts': t.tooManyVerificationAttempts || 'Çok fazla hatalı deneme',
        'email_mismatch': t.emailMismatch || 'Email adresi eşleşmiyor'
      };
      
      const errorKey = error.response?.data?.error;
      const errorMessage = errorKey && errorMessages[errorKey] 
        ? errorMessages[errorKey]
        : error.response?.data?.message || error.message || t.verificationFailed || 'Doğrulama başarısız';
      
      setToast({ 
        message: errorMessage, 
        type: 'error' 
      });
      
      if (errorKey === 'invalid_token' || errorKey === 'expired') {
        setTimeout(() => {
          setShowGuestVerification(false);
          setGuestTempToken('');
          setPendingReservationData(null);
          setGuestVerificationCode('');
          
          setToast({ 
            message: t.pleaseStartOver || 'Lütfen işlemi baştan başlatın', 
            type: 'error' 
          });
        }, 2000);
      }
      
      if (errorKey === 'too_many_attempts') {
        setGuestVerificationCode('');
      }
      
    } finally {
      setIsGuestVerifying(false);
    }
  };

  // Guest Resend Code Handler
  const handleGuestResendCode = async () => {
    setIsGuestResending(true);
    
    try {
      await reservationAPI.resendGuestVerificationCode({
        tempToken: guestTempToken
      });
      
      setToast({ 
        message: t.resendCodeSuccess || 'Yeni doğrulama kodu gönderildi', 
        type: 'success' 
      });
      setGuestVerificationCode('');
      
    } catch (error: any) {
      console.error('Resend guest code error:', error);
      
      if (error.response?.status === 429) {
        setToast({ 
          message: t.resendCodeTooSoon || 'Yeni kod için lütfen biraz bekleyin', 
          type: 'error'
        });
      } else {
        setToast({ 
          message: t.resendCodeFailed || 'Kod gönderilemedi. Lütfen tekrar deneyin', 
          type: 'error' 
        });
      }
    } finally {
      setIsGuestResending(false);
    }
  };

  const calculateNights = () => {
    if (!reservationData.checkIn || !reservationData.checkOut) return 0;
    const start = new Date(reservationData.checkIn);
    const end = new Date(reservationData.checkOut);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  };

  const updateChildrenAgeGroup = (group: 'above7' | 'between2And7' | 'under2', increment: boolean) => {
    setReservationData(prev => {
      const currentValue = prev.childrenAgeGroups[group];
      const otherGroups = {
        above7: group === 'above7' ? 0 : prev.childrenAgeGroups.above7,
        between2And7: group === 'between2And7' ? 0 : prev.childrenAgeGroups.between2And7,
        under2: group === 'under2' ? 0 : prev.childrenAgeGroups.under2
      };
      
      const totalOthers = Object.values(otherGroups).reduce((sum, val) => sum + val, 0);
      const newValue = increment ? currentValue + 1 : Math.max(0, currentValue - 1);
      
      const maxAllowed = prev.children - totalOthers;
      const finalValue = Math.min(newValue, maxAllowed);
      
      return {
        ...prev,
        childrenAgeGroups: {
          ...prev.childrenAgeGroups,
          [group]: finalValue
        }
      };
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f0e8]">
        <Loader className="animate-spin text-[#ff9800]" size={48} />
      </div>
    );
  }

  if (!selectedItem) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f0e8]">
        <p className="text-gray-600">{t.itemNotFound || 'İlan bulunamadı.'}</p>
      </div>
    );
  }

  const localMonthNames = currentLang === 'tr' ? monthNames : 
    currentLang === 'en' ? ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] :
    currentLang === 'ar' ? ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'] :
    currentLang === 'ru' ? ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'] :
    monthNames;

  const localDayNames = currentLang === 'tr' ? dayNames :
    currentLang === 'en' ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] :
    currentLang === 'ar' ? ['الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت', 'الأحد'] :
    currentLang === 'ru' ? ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'] :
    dayNames;

  return (
    <div className="min-h-screen bg-[#f5f0e8]">
      {/* Hero Section - Mobilde daha küçük */}
      <div className="relative h-48 md:h-72 lg:h-96">
        <img
          src={selectedItem.images?.[0]?.url || selectedItem.images?.[0]}
          alt={selectedItem.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/60" />
        
        {/* Desktop Header */}
        <div className="hidden md:block">
          <Header
            transparent={true}
            currentLang={currentLang}
            setCurrentLang={setCurrentLang}
            translations={translations}
            setShowLoginModal={setShowLoginModal}
            setCurrentView={setCurrentView}
          />
        </div>

        {/* Mobile Header */}
        <div className="md:hidden absolute top-0 left-0 right-0 z-20">
          <div className="flex items-center justify-between p-4">
           <button onClick={() => navigate(-1)} 
                  className="bg-white/20 backdrop-blur-md rounded-full p-2">
              <ChevronLeft size={24} className="text-white" />
            </button>
            <div className="bg-white/20 backdrop-blur-md rounded-full px-3 py-1">
              <span className="text-white text-sm font-medium">{t.reservation || 'Rezervasyon'}</span>
            </div>
          </div>
        </div>
        
        {/* Hero Content - Mobilde daha kompakt */}
        <div className="absolute bottom-0 left-0 right-0 z-20 px-4 md:px-6 pb-4 md:pb-10">
          <div className="max-w-7xl mx-auto">
            {/* Desktop breadcrumb */}
            <div className="hidden md:flex items-center text-white/90 text-sm mb-3">
              <button onClick={() => navigate(-1)} className="hover:text-white flex items-center transition-colors">
                <ChevronLeft size={20} className="mr-1" />
                {t.back || 'Geri'}
              </button>
              <span className="mx-3">/</span>
              <span>{isApartment ? (t.ourApartments || 'Daireler') : (t.ourTours || 'Turlar')}</span>
              <span className="mx-3">/</span>
              <span className="font-medium">{t.makeReservation || 'Rezervasyon'}</span>
            </div>
            
            <h1 className="text-2xl md:text-3xl lg:text-5xl font-bold text-white mb-2 md:mb-4 drop-shadow-lg">
              {selectedItem.translations?.[currentLang]?.title || 
              selectedItem.translations?.tr?.title || 
              selectedItem.title}
            </h1>
            
            {/* Mobilde sadece konum */}
            <div className="md:hidden flex items-center text-white/90 text-sm">
              <MapPin size={16} className="mr-1" />
              {selectedItem.district || selectedItem.city || selectedItem.meetingPoint}
            </div>
            
            {/* Desktop detaylar */}
            <div className="hidden md:flex flex-wrap items-center gap-6 text-white/90">
              <div className="flex items-center">
                <MapPin size={20} className="mr-2" />
                {selectedItem.district || selectedItem.city || selectedItem.meetingPoint}
              </div>
              {selectedItem.rating && (
                <div className="flex items-center">
                  <Star size={20} className="mr-1 fill-current text-yellow-400" />
                  <span className="font-medium">{selectedItem.rating}</span>
                </div>
              )}
              {isApartment && (
                <div className="flex items-center gap-6">
                  <div className="flex items-center">
                    <Users size={20} className="mr-2" />
                    {selectedItem.maxCapacity || selectedItem.capacity} {t.person || 'Kişi'}
                  </div>
                  <div className="flex items-center">
                    <Bed size={20} className="mr-2" />
                    {selectedItem.bedrooms} {t.bedrooms || 'Yatak Odası'}
                  </div>
                  <div className="flex items-center">
                    <Bath size={20} className="mr-2" />
                    {selectedItem.bathrooms} {t.bathrooms || 'Banyo'}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Summary Card - Sayfanın üstünde */}
      <div className="md:hidden bg-white shadow-lg p-4 -mt-8 mx-4 rounded-xl relative z-30">
        <button
          onClick={() => setShowMobileSummary(!showMobileSummary)}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <img
              src={selectedItem.images?.[0]?.url || selectedItem.images?.[0]}
              alt={selectedItem.title}
              className="w-16 h-16 rounded-lg object-cover"
            />
            <div className="text-left">
              <p className="font-semibold text-gray-800">{t.reservationSummary || 'Özet'}</p>
              {priceBreakdown && (
                <p className="text-2xl font-bold text-[#ff9800]">
                  €{reservationData.isRefundable && priceBreakdown.refundablePrice 
                    ? priceBreakdown.refundablePrice 
                    : priceBreakdown.total}
                </p>
              )}
            </div>
          </div>
          {showMobileSummary ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
        
        {showMobileSummary && (
          <div className="mt-4 pt-4 border-t space-y-3">
            {isApartment && reservationData.checkIn && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{t.checkIn || 'Giriş'}</span>
                <span className="font-medium">
                  {new Date(reservationData.checkIn).toLocaleDateString(currentLang === 'tr' ? 'tr-TR' : 'en-US')}
                </span>
              </div>
            )}
            {isApartment && reservationData.checkOut && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{t.checkOut || 'Çıkış'}</span>
                <span className="font-medium">
                  {new Date(reservationData.checkOut).toLocaleDateString(currentLang === 'tr' ? 'tr-TR' : 'en-US')}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">{t.guests || 'Misafirler'}</span>
              <span className="font-medium">
                {reservationData.adults} {t.adult || 'Yetişkin'}
                {reservationData.children > 0 && `, ${reservationData.children} ${t.child || 'Çocuk'}`}
              </span>
            </div>
            {priceBreakdown && (
              <div className="pt-3 border-t">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{t.total || 'Toplam'}</span>
                  <span className="text-xl font-bold text-[#ff9800]">
                    €{reservationData.isRefundable && priceBreakdown.refundablePrice 
                      ? priceBreakdown.refundablePrice 
                      : priceBreakdown.total}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mobile Progress Steps */}
      <div className="md:hidden px-4 mt-6">
        <div className="flex items-center justify-between mb-4">
          {[1, 2, 3].map((step) => (
            <div
              key={step}
              className={`flex-1 h-2 rounded-full mx-1 ${
                mobileStep >= step ? 'bg-[#ff9800]' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
        <p className="text-center text-sm font-medium text-gray-700">
          {mobileStep === 1 && (t.dateSelection || 'Tarih Seçimi')}
          {mobileStep === 2 && (t.guestInfo || 'Misafir Bilgileri')}
          {mobileStep === 3 && (t.payment || 'Ödeme')}
        </p>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-10 md:-mt-16 relative z-30">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {/* Sol Taraf - Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl md:rounded-3xl shadow-xl p-6 md:p-8">
              {/* Desktop Progress Steps */}
              <div className="hidden md:flex items-center justify-between mb-10">
                {[
                  { icon: Calendar, label: t.dateSelection || 'Tarih Seçimi', step: 1 },
                  { icon: Users, label: t.guestInfo || 'Misafir Bilgileri', step: 2 },
                  { icon: CreditCard, label: t.payment || 'Ödeme', step: 3 }
                ].map((item, index) => (
                  <div key={index} className="flex items-center flex-1">
                    <div className={`flex items-center justify-center w-14 h-14 rounded-full transition-all ${
                      index === 0 ? 'bg-[#ff9800] text-white shadow-lg' : 'bg-gray-100 text-gray-400'
                    }`}>
                      <item.icon size={24} />
                    </div>
                    <div className="flex-1 ml-4">
                      <p className={`text-sm font-semibold ${
                        index === 0 ? 'text-[#ff9800]' : 'text-gray-400'
                      }`}>
                        {item.label}
                      </p>
                    </div>
                    {index < 2 && (
                      <div className="flex-1 h-0.5 bg-gray-200 mx-4" />
                    )}
                  </div>
                ))}
              </div>

              <div className="space-y-6 md:space-y-8">
                {/* Tarih Seçimi - Mobilde step kontrolü */}
                {isApartment && (mobileStep === 1 || window.innerWidth >= 768) && (
                   <div 
                      id="date-selection"
                      className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl md:rounded-2xl p-6 md:p-8"
                    >
                    <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-6 md:mb-8 flex items-center">
                      <Calendar className="mr-2 md:mr-3 text-[#ff9800]" size={24} />
                      {t.stayDates || 'Konaklama Tarihleri'}
                    </h3>

                    {/* Seçili Tarihler - Mobilde üst üste */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
                      <div 
                        onClick={() => setSelectedDate('checkIn')}
                        className={`bg-white rounded-xl p-4 md:p-5 cursor-pointer transition-all border-2 hover:shadow-lg ${
                          selectedDate === 'checkIn' ? 'border-[#ff9800] shadow-xl md:scale-105' : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2 md:mb-3">
                          <label className="text-sm font-semibold text-gray-600">{t.checkInDate || 'Giriş Tarihi'}</label>
                          <CalendarCheck size={18} className="text-[#ff9800]" />
                        </div>
                        <p className="text-lg md:text-xl font-bold text-gray-800">
                          {reservationData.checkIn
                            ? new Date(reservationData.checkIn).toLocaleDateString(currentLang === 'tr' ? "tr-TR" : currentLang === 'en' ? "en-US" : currentLang === 'ar' ? "ar-SA" : "ru-RU", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              })
                            : t.selectDate || "Tarih Seçin"}
                        </p>
                      </div>
                      
                      <div 
                        onClick={() => setSelectedDate('checkOut')}
                        className={`bg-white rounded-xl p-4 md:p-5 cursor-pointer transition-all border-2 hover:shadow-lg ${
                          selectedDate === 'checkOut' ? 'border-[#ff9800] shadow-xl md:scale-105' : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2 md:mb-3">
                          <label className="text-sm font-semibold text-gray-600">{t.checkOutDate || 'Çıkış Tarihi'}</label>
                          <CalendarCheck size={18} className="text-[#ff9800]" />
                        </div>
                        <p className="text-lg md:text-xl font-bold text-gray-800">
                          {reservationData.checkOut
                            ? new Date(reservationData.checkOut).toLocaleDateString(currentLang === 'tr' ? "tr-TR" : currentLang === 'en' ? "en-US" : currentLang === 'ar' ? "ar-SA" : "ru-RU", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              })
                            : t.selectDate || "Tarih Seçin"}
                        </p>
                      </div>
                    </div>

                    {minStayError && (
                      <div className="mb-4 md:mb-6 p-3 md:p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                        <p className="text-yellow-800 flex items-start text-sm md:text-base">
                          <AlertCircle size={18} className="mr-2 mt-0.5 flex-shrink-0" />
                          {minStayError}
                        </p>
                      </div>
                    )}

                    {/* Takvim - Mobilde swipe desteği */}
                    <div 
                      className="bg-white rounded-xl p-4 md:p-6 shadow-sm"
                      onTouchStart={handleTouchStart}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}
                    >
                      <div className="flex items-center justify-between mb-4 md:mb-6">
                        <button
                          type="button"
                          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                          className="p-2 md:p-3 hover:bg-gray-100 rounded-full transition-colors"
                        >
                          <ChevronLeft size={20} />
                        </button>
                        <h4 className="text-lg md:text-xl font-semibold text-gray-800">
                          {localMonthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                        </h4>
                        <button
                          type="button"
                          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                          className="p-2 md:p-3 hover:bg-gray-100 rounded-full transition-colors"
                        >
                          <ChevronRight size={20} />
                        </button>
                      </div>

                      <div className="grid grid-cols-7 gap-1 md:gap-2">
                        {localDayNames.map((day) => (
                          <div key={day} className="text-center text-xs md:text-sm font-semibold text-gray-600 py-2 md:py-3">
                            {day}
                          </div>
                        ))}
                        
                        {[...Array(getFirstDayOfMonth(currentMonth))].map((_, i) => (
                          <div key={`empty-${i}`} />
                        ))}
                        
                        {[...Array(getDaysInMonth(currentMonth))].map((_, i) => {
                          const day = i + 1;
                          const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                          const isPast = new Date(dateStr) < new Date(new Date().setHours(0, 0, 0, 0));
                          const isUnavailable = isDateBooked(dateStr) || isDateBlocked(dateStr);
                          const isCheckIn = dateStr === reservationData.checkIn;
                          const isCheckOut = dateStr === reservationData.checkOut;
                          const isInRange = reservationData.checkIn && reservationData.checkOut &&
                            dateStr > reservationData.checkIn && dateStr < reservationData.checkOut;
                          const isHovered = dateStr === hoveredDate;
                          const isToday = dateStr === new Date().toISOString().split('T')[0];
                          
                          const isSelectingCheckOut = reservationData.checkIn && !reservationData.checkOut;
                          let canBeCheckOut = false;
                          
                          if (isSelectingCheckOut && dateStr > reservationData.checkIn) {
                            const start = new Date(reservationData.checkIn);
                            const end = new Date(dateStr);
                            let hasUnavailableBetween = false;
                            
                            for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
                              const checkDate = d.toISOString().split('T')[0];
                              if (checkDate !== reservationData.checkIn && (isDateBooked(checkDate) || isDateBlocked(checkDate))) {
                                hasUnavailableBetween = true;
                                break;
                              }
                            }
                            
                            canBeCheckOut = !hasUnavailableBetween;
                          }
                          
                          const showAsUnavailable = isUnavailable && !(isSelectingCheckOut && canBeCheckOut && isDateBlocked(dateStr) && !isDateBooked(dateStr));
                          
                          return (
                            <button
                              key={day}
                              type="button"
                              onClick={() => !isPast && !showAsUnavailable && handleDateSelect(dateStr)}
                              onMouseEnter={() => setHoveredDate(dateStr)}
                              onMouseLeave={() => setHoveredDate(null)}
                              disabled={isPast || showAsUnavailable}
                              className={`
                                p-2 md:p-4 text-xs md:text-sm font-medium rounded-lg md:rounded-xl transition-all transform relative
                                ${isPast ? 'text-gray-300 cursor-not-allowed' : ''}
                                ${showAsUnavailable ? 'bg-red-100 text-red-400 cursor-not-allowed line-through' : ''}
                                ${isCheckIn || isCheckOut ? 'bg-[#ff9800] text-white shadow-lg scale-105 md:scale-110' : ''}
                                ${isInRange ? 'bg-[#ff9800]/20 text-[#ff9800]' : ''}
                                ${isHovered && !isPast && !showAsUnavailable ? 'bg-[#ff9800]/10 scale-105' : ''}
                                ${!isPast && !showAsUnavailable && !isCheckIn && !isCheckOut && !isInRange ? 'hover:bg-gray-50 hover:shadow-md' : ''}
                                ${isToday ? 'ring-2 ring-[#ff9800] ring-offset-1 md:ring-offset-2' : ''}
                              `}
                            >
                              {day}
                            </button>
                          );
                        })}
                      </div>

                      <div className="mt-6 md:mt-8 flex items-center justify-center gap-4 md:gap-8 text-xs md:text-sm">
                        <div className="flex items-center">
                          <div className="w-4 h-4 md:w-5 md:h-5 bg-[#ff9800] rounded-md mr-2"></div>
                          <span className="text-gray-600">{t.selected || 'Seçili'}</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-4 h-4 md:w-5 md:h-5 bg-red-100 rounded-md mr-2 border border-red-200"></div>
                          <span className="text-gray-600">{t.booked || 'Dolu'}</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-4 h-4 md:w-5 md:h-5 bg-white rounded-md mr-2 border border-gray-300"></div>
                          <span className="text-gray-600">{t.available || 'Müsait'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Mobile Next Button */}
                    <div className="md:hidden mt-6">
                      <button
                        type="button"
                        onClick={async () => {
                          const stepErrors: any = {};
                          
                          if (!reservationData.checkIn) stepErrors.checkIn = t.checkInRequired;
                          if (!reservationData.checkOut) stepErrors.checkOut = t.checkOutRequired;
                          
                          if (reservationData.checkIn && reservationData.checkOut) {
                            const isMinStayValid = await checkMinimumStay();
                            if (!isMinStayValid) {
                              stepErrors.minStay = minStayError;
                            }
                          }
                          
                          if (Object.keys(stepErrors).length > 0) {
                            setErrors(stepErrors);
                            const messages = getErrorSummary(stepErrors);
                            setToast({ 
                              message: messages.join(', '), 
                              type: 'error' 
                            });
                          } else {
                            setMobileStep(2);
                          }
                        }}
                        className="w-full py-3 bg-[#ff9800] text-white rounded-xl font-medium"
                      >
                        {t.continue || 'Devam Et'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Misafir Sayısı - Mobilde step 2 */}
                {(mobileStep === 2 || window.innerWidth >= 768) && (
                    <div 
                      id="guest-info"
                      className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl md:rounded-2xl p-6 md:p-8"
                    >
                    <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-6 md:mb-8 flex items-center">
                      <Users className="mr-2 md:mr-3 text-[#ff9800]" size={24} />
                      {t.guestInfo || 'Misafir Bilgileri'}
                    </h3>
                    
                    {isApartment && (
                      <div className="mb-4 md:mb-6 p-3 md:p-4 bg-blue-50 rounded-xl border border-blue-100">
                        <p className="text-xs md:text-sm text-blue-800 flex items-center">
                          <Info size={16} className="mr-2" />
                          {t.maxCapacity || 'Maksimum kapasite'}: {selectedItem?.maxCapacity || selectedItem?.capacity || 4} {t.person || 'kişi'}
                        </p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4 md:gap-6">
                      <div>
                        <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2 md:mb-3">
                          {t.adultCount || 'Yetişkin Sayısı'}
                        </label>
                        <div className="flex items-center justify-between bg-white rounded-xl px-3 md:px-4 py-2 md:py-3 shadow-sm">
                          <button
                            type="button"
                            onClick={() => setReservationData({...reservationData, adults: Math.max(1, reservationData.adults - 1)})}
                            className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-lg"
                          >
                            -
                          </button>
                          <span className="font-semibold text-lg">{reservationData.adults}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const maxCapacity = selectedItem?.maxCapacity || selectedItem?.capacity || 4;
                              const currentTotal = reservationData.adults + reservationData.children;
                              
                              if (currentTotal < maxCapacity) {
                                setReservationData({...reservationData, adults: reservationData.adults + 1});
                              } else {
                                setToast({ 
                                  message: `${t.maxCapacity || 'Maksimum kapasite'} ${maxCapacity} ${t.person || 'kişidir'}.`, 
                                  type: 'error' 
                                });
                              }
                            }}
                            className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-all text-lg ${
                              (reservationData.adults + reservationData.children) >= (selectedItem?.maxCapacity || selectedItem?.capacity || 4)
                              ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                              : 'bg-gray-100 hover:bg-gray-200 cursor-pointer'
                            }`}
                            disabled={
                              (reservationData.adults + reservationData.children) >= (selectedItem?.maxCapacity || selectedItem?.capacity || 4)
                            }
                          >
                            +
                          </button>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2 md:mb-3">
                          {t.childCount || 'Çocuk Sayısı'}
                        </label>
                        <div className="flex items-center justify-between bg-white rounded-xl px-3 md:px-4 py-2 md:py-3 shadow-sm">
                          <button
                            type="button"
                            onClick={() => setReservationData({...reservationData, children: Math.max(0, reservationData.children - 1)})}
                            className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-lg"
                          >
                            -
                          </button>
                          <span className="font-semibold text-lg">{reservationData.children}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const maxCapacity = selectedItem?.maxCapacity || selectedItem?.capacity || 4;
                              const currentTotal = reservationData.adults + reservationData.children;
                              
                              if (currentTotal < maxCapacity) {
                                setReservationData({...reservationData, children: reservationData.children + 1});
                              } else {
                                setToast({ 
                                  message: `${t.maxCapacity || 'Maksimum kapasite'} ${maxCapacity} ${t.person || 'kişidir'}.`, 
                                  type: 'error' 
                                });
                              }
                            }}
                            className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-all text-lg ${
                              (reservationData.adults + reservationData.children) >= (selectedItem?.maxCapacity || selectedItem?.capacity || 4)
                              ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                              : 'bg-gray-100 hover:bg-gray-200 cursor-pointer'
                            }`}
                            disabled={
                              (reservationData.adults + reservationData.children) >= (selectedItem?.maxCapacity || selectedItem?.capacity || 4)
                            }
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Çocuk Yaş Grupları - Mobilde daha kompakt */}
                    {reservationData.children > 0 && (
                      <div 
                        id="children-ages"
                        className="mt-6 md:mt-8 p-4 md:p-6 bg-white rounded-xl border border-gray-100"
                      >
                        <h4 className="text-base md:text-lg font-semibold text-gray-800 mb-4 md:mb-6 flex items-center">
                          <Baby size={20} className="mr-2 text-[#ff9800]" />
                          {t.childrenAgeGroups || 'Çocuk Yaş Grupları'}
                        </h4>
                        <div className="space-y-3 md:space-y-4">
                          {[
                            { key: 'above7', label: t.age7AndAbove || '7 yaş ve üzeri', icon: UserCheck },
                            { key: 'between2And7', label: t.age2To7 || '2-7 yaş arası', icon: User },
                            { key: 'under2', label: t.ageUnder2 || '2 yaş altı (Bebek)', icon: Baby }
                          ].map(({ key, label, icon: Icon }) => (
                            <div key={key} className="flex items-center justify-between p-3 md:p-4 bg-gray-50 rounded-xl">
                              <div className="flex items-center">
                                <Icon size={18} className="text-gray-600 mr-2 md:mr-3" />
                                <span className="text-xs md:text-sm font-medium text-gray-700">{label}</span>
                              </div>
                              <div className="flex items-center gap-2 md:gap-3">
                                <button
                                  type="button"
                                  onClick={() => updateChildrenAgeGroup(key as 'above7' | 'between2And7' | 'under2', false)}
                                  className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-white border border-gray-300 hover:bg-gray-100 flex items-center justify-center transition-all"
                                >
                                  -
                                </button>
                                <span className="w-6 md:w-8 text-center font-semibold text-gray-800">
                                  {reservationData.childrenAgeGroups[key as keyof typeof reservationData.childrenAgeGroups]}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => updateChildrenAgeGroup(key as 'above7' | 'between2And7' | 'under2', true)}
                                  className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-white border border-gray-300 hover:bg-gray-100 flex items-center justify-center transition-all"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                        {errors.childrenAges && (
                          <p className="text-red-500 text-xs md:text-sm mt-3 flex items-center">
                            <AlertCircle size={14} className="mr-1" />
                            {errors.childrenAges}
                          </p>
                        )}
                      </div>
                    )}

                    {capacityError && (
                      <div className="mt-4 md:mt-6 p-3 md:p-4 bg-red-50 border border-red-200 rounded-xl">
                        <p className="text-red-800 text-xs md:text-sm flex items-center">
                          <AlertCircle size={16} className="mr-2" />
                          {capacityError}
                        </p>
                      </div>
                    )}

                    {/* Mobile Navigation Buttons */}
                    <div className="md:hidden mt-6 flex gap-3">
                      <button
                        type="button"
                        onClick={() => setMobileStep(1)}
                        className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium"
                      >
                        {t.back || 'Geri'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setMobileStep(3)}
                        className="flex-1 py-3 bg-[#ff9800] text-white rounded-xl font-medium"
                      >
                        {t.continue || 'Devam Et'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Kişisel Bilgiler - Mobilde step 3 */}
                {(mobileStep === 3 || window.innerWidth >= 768) && (
                  <div 
                    id="personal-info"
                    className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl md:rounded-2xl p-6 md:p-8"
                  >
                    <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-6 md:mb-8 flex items-center">
                      <UserCheck className="mr-2 md:mr-3 text-[#ff9800]" size={24} />
                      {t.personalInfo || 'Kişisel Bilgiler'}
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                      <div className="md:col-span-1">
                        <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">{t.fullNameLabel || 'Ad Soyad'} *</label>
                        <div className="relative">
                          <User size={18} className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            type="text"
                            value={reservationData.name}
                            onChange={(e) => setReservationData({ ...reservationData, name: e.target.value })}
                            className={`w-full pl-10 md:pl-12 pr-3 md:pr-4 py-3 md:py-4 border rounded-xl focus:outline-none focus:ring-2 transition-all text-sm md:text-base ${
                              errors.name ? 'border-red-500 focus:ring-red-200' : 'border-gray-200 focus:ring-[#ff9800]/20 focus:border-[#ff9800]'
                            }`}
                            placeholder={t.namePlaceholder || "Adınız Soyadınız"}
                          />
                        </div>
                        {errors.name && <p className="text-red-500 text-xs md:text-sm mt-2">{errors.name}</p>}
                      </div>
                      
                      <div className="md:col-span-1">
                        <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">{t.emailLabel || 'E-posta'} *</label>
                        <div className="relative">
                          <Mail size={18} className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            type="email"
                            value={reservationData.email}
                            onChange={(e) => setReservationData({ ...reservationData, email: e.target.value })}
                            className={`w-full pl-10 md:pl-12 pr-3 md:pr-4 py-3 md:py-4 border rounded-xl focus:outline-none focus:ring-2 transition-all text-sm md:text-base ${
                              errors.email ? 'border-red-500 focus:ring-red-200' : 'border-gray-200 focus:ring-[#ff9800]/20 focus:border-[#ff9800]'
                            }`}
                            placeholder="email@example.com"
                          />
                        </div>
                        {errors.email && <p className="text-red-500 text-xs md:text-sm mt-2">{errors.email}</p>}
                      </div>
                      
                      <div className="col-span-1">
                        <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">{t.phoneLabel || 'Telefon'} *</label>
                        <PhoneInput
                          value={reservationData.phone}
                          onChange={(phone) => setReservationData({ ...reservationData, phone })}
                          error={errors.phone}
                        />
                      </div>
                                            
                      <div className="col-span-1 md:col-span-2">
                        <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">{t.specialNote || 'Özel Not'} ({t.optional || 'İsteğe Bağlı'})</label>
                        <div className="relative">
                          <MessageSquare size={18} className="absolute left-3 md:left-4 top-3 md:top-4 text-gray-400" />
                          <textarea
                            value={reservationData.message}
                            onChange={(e) => setReservationData({ ...reservationData, message: e.target.value })}
                            className="w-full pl-10 md:pl-12 pr-3 md:pr-4 py-3 md:py-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff9800]/20 focus:border-[#ff9800] transition-all resize-none text-sm md:text-base"
                            rows={3}
                            placeholder={t.specialNotePlaceholder || "Özel istekleriniz varsa belirtebilirsiniz..."}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Mobile Back Button */}
                    <div className="md:hidden mt-6">
                      <button
                        type="button"
                        onClick={() => setMobileStep(2)}
                        className="w-full py-3 border border-gray-300 text-gray-700 rounded-xl font-medium"
                      >
                        {t.back || 'Geri'}
                      </button>
                    </div>
                  </div>
                )}

                {/* İptal Politikası */}
                {isApartment && (
                  <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl md:rounded-2xl p-6 md:p-8">
                    <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-6 md:mb-8 flex items-center">
                      <Shield className="mr-2 md:mr-3 text-[#ff9800]" size={24} />
                      {t.cancellationPolicy || 'İptal Politikası'}
                    </h3>
                    
                    <div className="space-y-4 md:space-y-6">
                      {/* Non-refundable Seçeneği - HER ZAMAN ÜSTTE */}
                      <label className={`flex items-start p-4 md:p-6 bg-white rounded-xl border-2 cursor-pointer transition-all hover:shadow-lg ${
                        !reservationData.isRefundable ? 'border-[#ff9800] shadow-lg' : 'border-gray-200 hover:border-gray-300'
                      }`}>
                        <input
                          type="radio"
                          name="refundable"
                          checked={!reservationData.isRefundable}
                          onChange={() => setReservationData({ ...reservationData, isRefundable: false })}
                          className="mt-1 mr-3 md:mr-4 w-4 h-4 md:w-5 md:h-5 text-[#ff9800] focus:ring-[#ff9800]"
                        />
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-800 mb-2 text-sm md:text-base">{t.nonRefundableOption || 'İptal Edilemez'}</h4>
                          <p className="text-gray-600 text-xs md:text-sm mb-3">{t.nonRefundableDescription || 'Bu rezervasyon iptal edilemez ve iade yapılmaz.'}</p>
                          {priceBreakdown && (
                            <p className="text-xl md:text-2xl font-bold text-[#ff9800]">
                              €{priceBreakdown.total}
                            </p>
                          )}
                        </div>
                      </label>
                      
                      {/* Refundable Seçeneği - GUEST İÇİN DISABLED */}
                      <div className={`relative ${!isAuthenticated ? 'opacity-60' : ''}`}>
                        <label className={`flex items-start p-4 md:p-6 bg-white rounded-xl border-2 transition-all ${
                          isAuthenticated 
                            ? `cursor-pointer hover:shadow-lg ${
                                reservationData.isRefundable ? 'border-[#ff9800] shadow-lg' : 'border-gray-200 hover:border-gray-300'
                              } ${!canBeRefundable ? 'opacity-50 cursor-not-allowed' : ''}`
                            : 'border-gray-200 cursor-not-allowed'
                        }`}>
                          <input
                            type="radio"
                            name="refundable"
                            checked={reservationData.isRefundable}
                            onChange={() => isAuthenticated && canBeRefundable && setReservationData({ ...reservationData, isRefundable: true })}
                            disabled={!isAuthenticated || !canBeRefundable}
                            className="mt-1 mr-3 md:mr-4 w-4 h-4 md:w-5 md:h-5 text-[#ff9800] focus:ring-[#ff9800] disabled:opacity-50"
                          />
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-800 mb-2 text-sm md:text-base flex items-center">
                              {t.refundableOption || 'İptal Edilebilir'}
                              {priceBreakdown?.refundableIncrease && (
                                <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                                  +%{priceBreakdown.refundableIncrease} {t.increase || 'artış'}
                                </span>
                              )}
                            </h4>
                            <div className="space-y-2 mb-3">
                              <p className="text-gray-600 text-xs md:text-sm">
                                {t.refundableDescription || 'Giriş tarihinden 7 gün öncesine kadar iptal edilebilir.'}
                              </p>
                              
                              {isAuthenticated && priceBreakdown?.refundableIncrease && (
                                <div className="text-xs text-gray-500 bg-amber-50 rounded-md px-2 py-1.5 inline-block">
                                  ⚠️ {t.guaranteeFeeNote
                                      ?.replace('{fee}', ((priceBreakdown.total * priceBreakdown.refundableIncrease) / 100).toFixed(2))
                                    || `Bu tutarın €${((priceBreakdown.total * priceBreakdown.refundableIncrease) / 100).toFixed(2)} kadarlık kısmı garanti ücretidir ve iade kapsamında değildir`}
                                </div>
                              )}
                            </div>
                            
                            {priceBreakdown && (
                              <div className="space-y-1">
                                {priceBreakdown.refundableIncrease && (
                                  <p className="text-lg text-gray-400 line-through">
                                    €{priceBreakdown.total}
                                  </p>
                                )}
                                <p className="text-xl md:text-2xl font-bold text-[#ff9800]">
                                  €{priceBreakdown.refundableIncrease 
                                    ? Math.round(priceBreakdown.total * (1 + priceBreakdown.refundableIncrease / 100))
                                    : priceBreakdown.total}
                                </p>
                              </div>
                            )}
                            
                            {isAuthenticated && !canBeRefundable && (
                              <p className="text-red-600 text-xs md:text-sm mt-2 flex items-center">
                                <AlertCircle size={14} className="mr-1" />
                                {t.refundableTooLate || 'Giriş tarihine 7 günden az kaldığı için bu seçenek kullanılamaz.'}
                              </p>
                            )}
                          </div>
                        </label>
                        
                        {/* GUEST KULLANICI İÇİN OVERLAY UYARI */}
                        {!isAuthenticated && (
                          <div className="absolute inset-0 bg-white/90 backdrop-blur-sm rounded-xl flex items-center justify-center">
                            <div className="text-center px-6 py-4">
                              <div className="inline-flex items-center justify-center w-12 h-12 bg-[#ff9800]/10 rounded-full mb-3">
                                <Shield className="text-[#ff9800]" size={24} />
                              </div>
                              <p className="text-sm font-semibold text-gray-800 mb-2">
                                {t.membershipRequired || 'Üyelik Gerekli'}
                              </p>
                              <p className="text-xs text-gray-600 mb-3 max-w-xs mx-auto">
                                {t.refundableForMembers || 'İptal edilebilir rezervasyon sadece üyelerimize özeldir'}
                              </p>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setShowLoginModal(true);
                                }}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-[#ff9800] text-white rounded-lg hover:bg-[#f57c00] transition-colors text-sm font-medium"
                              >
                                <User size={16} />
                                {t.loginOrRegister || 'Giriş Yap / Üye Ol'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Onay Kutusu */}
                <div 
                  id="terms-section"
                  className="bg-gray-50 rounded-xl md:rounded-2xl p-4 md:p-6"
                >
                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      id="terms"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="mt-1 mr-2 md:mr-3 w-4 h-4 md:w-5 md:h-5 text-[#ff9800] rounded focus:ring-[#ff9800]"
                    />
                    <label htmlFor="terms" className="text-xs md:text-sm text-gray-700 leading-relaxed">
                      {t.termsAcceptance || 'İptal politikası, ödeme koşulları ve ev kuralları hakkında bilgilendirildim ve kabul ediyorum.'}
                    </label>
                  </div>
                  {errors.terms && <p className="text-red-500 text-xs md:text-sm mt-2 ml-6 md:ml-8">{errors.terms}</p>}
                </div>

                {/* Desktop Submit Button */}
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !isValidCombination}
                  className={`hidden md:flex w-full py-4 md:py-5 rounded-xl font-bold text-base md:text-lg transition-all items-center justify-center gap-3
                    ${!isValidCombination 
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-[#ff9800] to-[#f57c00] text-white hover:shadow-xl transform hover:scale-[1.02]'
                    }`}
                >
                  {submitting ? (
                    <>
                      <Loader className="animate-spin" size={24} />
                      {t.processing || 'İşleniyor...'}
                    </>
                  ) : (
                    <>
                      <CreditCard size={24} />
                      {t.completeReservation || 'Rezervasyonu Tamamla'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Sağ Taraf - Desktop Özet (Sticky) */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Rezervasyon Özeti */}
              <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
                {/* Başlık */}
                <div className="bg-gradient-to-r from-[#ff9800] to-[#f57c00] p-6 text-white">
                  <h3 className="text-xl font-bold">{t.reservationSummary || 'Rezervasyon Özeti'}</h3>
                </div>
                
                {/* İçerik */}
                <div className="p-6 space-y-6">
                  {/* İlan Bilgisi */}
                  <div className="flex items-start gap-4 pb-6 border-b border-gray-100">
                    <img
                      src={selectedItem.images?.[0]?.url || selectedItem.images?.[0]}
                      alt={selectedItem.title}
                      className="w-28 h-28 rounded-xl object-cover shadow-md"
                    />
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-800 mb-2">
                        {selectedItem.translations?.[currentLang]?.title || 
                        selectedItem.translations?.tr?.title || 
                        selectedItem.title}
                      </h4>
                      <p className="text-sm text-gray-600 flex items-center mb-2">
                        <MapPin size={16} className="mr-1" />
                        {selectedItem.district || selectedItem.city}
                      </p>
                      {selectedItem.rating && (
                        <div className="flex items-center">
                          <Star size={16} className="text-yellow-500 fill-current mr-1" />
                          <span className="text-sm text-gray-700 font-medium">{selectedItem.rating}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tarih ve Misafir Bilgileri */}
                  <div className="space-y-4">
                    {isApartment ? (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 flex items-center">
                            <CalendarCheck size={18} className="mr-2 text-gray-400" />
                            {t.checkIn || 'Giriş'}
                          </span>
                          <span className="font-semibold text-gray-800">
                            {reservationData.checkIn ? new Date(reservationData.checkIn).toLocaleDateString(currentLang === 'tr' ? 'tr-TR' : currentLang === 'en' ? 'en-US' : currentLang === 'ar' ? 'ar-SA' : 'ru-RU') : '-'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 flex items-center">
                            <Calendar size={18} className="mr-2 text-gray-400" />
                            {t.checkOut || 'Çıkış'}
                          </span>
                          <span className="font-semibold text-gray-800">
                            {reservationData.checkOut ? new Date(reservationData.checkOut).toLocaleDateString(currentLang === 'tr' ? 'tr-TR' : currentLang === 'en' ? 'en-US' : currentLang === 'ar' ? 'ar-SA' : 'ru-RU') : '-'}
                          </span>
                        </div>
                        {reservationData.checkIn && reservationData.checkOut && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600 flex items-center">
                              <Clock size={18} className="mr-2 text-gray-400" />
                              {t.duration || 'Süre'}
                            </span>
                            <span className="font-semibold text-gray-800">
                              {calculateNights()} {t.nights || 'Gece'}
                            </span>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 flex items-center">
                          <Calendar size={18} className="mr-2 text-gray-400" />
                          {t.tourDate || 'Tur Tarihi'}
                        </span>
                        <span className="font-semibold text-gray-800">{t.toBeArranged || 'Tur sahibi ile belirlenecek'}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 flex items-center">
                        <Users size={18} className="mr-2 text-gray-400" />
                        {t.guests || 'Misafirler'}
                      </span>
                      <span className="font-semibold text-gray-800">
                        {reservationData.adults} {t.adult || 'Yetişkin'}
                        {reservationData.children > 0 && `, ${reservationData.children} ${t.child || 'Çocuk'}`}
                      </span>
                    </div>
                  </div>

                  {/* Fiyat Detayları */}
                  {priceBreakdown && (
                    <div className="pt-6 border-t border-gray-100 space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">
                          {isApartment ? `€${priceBreakdown.basePrice} x ${priceBreakdown.nights} ${t.perNight || 'gece'}` : t.tourFee || 'Tur Ücreti'}
                        </span>
                        <span className="text-gray-800">€{priceBreakdown.subtotal}</span>
                      </div>
                      
                      {priceBreakdown.adultSurcharge > 0 && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">{t.extraGuestFee || 'Ekstra Misafir Ücreti'}</span>
                          <span className="text-gray-800">€{priceBreakdown.adultSurcharge}</span>
                        </div>
                      )}
                      
                      {priceBreakdown.discountAmount > 0 && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 flex items-center">
                            <Percent size={16} className="mr-1" />
                            {t.discount || 'İndirim'} ({priceBreakdown.discountPercentage}%)
                          </span>
                          <span className="text-green-600">-€{priceBreakdown.discountAmount}</span>
                        </div>
                      )}
                      
                      {reservationData.isRefundable && priceBreakdown.refundableIncrease && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">{t.refundableOption || 'İptal Edilebilir'} (+{priceBreakdown.refundableIncrease}%)</span>
                          <span className="text-gray-800">
                            €{((priceBreakdown.total * priceBreakdown.refundableIncrease) / 100).toFixed(2)}
                          </span>
                        </div>
                      )}
                      
                      <div className="pt-4 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-gray-800">{t.total || 'Toplam'}</span>
                          <div className="text-right">
                            <span className="text-2xl font-bold text-[#ff9800]">
                              €{reservationData.isRefundable && priceBreakdown.refundablePrice 
                                ? priceBreakdown.refundablePrice 
                                : priceBreakdown.total}
                            </span>
                            {reservationData.checkIn && reservationData.checkOut && (
                              <p className="text-xs text-gray-500 mt-1">{t.taxesIncluded || 'Vergiler dahil'}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Fiyat Yükleniyor */}
                  {loadingPrice && (
                    <div className="flex items-center justify-center py-8">
                      <Loader className="animate-spin text-[#ff9800] mr-2" size={24} />
                      <span className="text-gray-600">{t.calculatingPrice || 'Fiyat hesaplanıyor...'}</span>
                    </div>
                  )}

                  {/* Fiyat Bilgisi Yok */}
                  {!priceBreakdown && !loadingPrice && isApartment && (
                    <div className="py-8 text-center">
                      <TrendingUp size={48} className="text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm">{t.selectDatesForPrice || 'Fiyat bilgisi için tarih seçin'}</p>
                    </div>
                  )}

                  {/* Güvenlik Notu */}
                  <div className="bg-green-50 rounded-xl p-4">
                    <div className="flex items-start">
                      <Shield size={20} className="text-green-600 mr-3 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-green-800 mb-1">{t.secureReservation || 'Güvenli Rezervasyon'}</p>
                        <p className="text-xs text-green-700">{t.sslDescription || 'Ödeme bilgileriniz 256-bit SSL ile korunmaktadır'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Destek Kartı */}
              <div className="bg-white rounded-3xl shadow-lg p-6">
                <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
                  <Phone size={20} className="mr-2 text-[#ff9800]" />
                  {t.callSupport || 'Yardıma mı ihtiyacınız var?'}
                </h4>
                <p className="text-sm text-gray-600 mb-4">
                  {t.supportText || 'Rezervasyon sürecinde size yardımcı olmaktan mutluluk duyarız.'}
                </p>
                <a href="tel:+905355117018" className="block w-full py-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-center font-medium text-gray-800 transition-all">
                  {t.callNow || 'Hemen Ara'}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Fixed Bottom Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-xl z-40 p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs text-gray-600">{t.total || 'Toplam'}</p>
            {priceBreakdown ? (
              <p className="text-2xl font-bold text-[#ff9800]">
                €{reservationData.isRefundable && priceBreakdown.refundablePrice 
                  ? priceBreakdown.refundablePrice 
                  : priceBreakdown.total}
              </p>
            ) : (
              <p className="text-lg font-medium text-gray-700">
                {t.selectDates || 'Tarih seçin'}
              </p>
            )}
          </div>
          {priceBreakdown && (
            <div className="text-right">
              <p className="text-xs text-gray-500">{calculateNights()} {t.nights || 'gece'}</p>
              <p className="text-xs text-gray-500">
                {reservationData.adults} {t.adult || 'yetişkin'}
                {reservationData.children > 0 && `, ${reservationData.children} ${t.child || 'çocuk'}`}
              </p>
            </div>
          )}
        </div>
        
        <button
          onClick={handleSubmit}
          disabled={submitting || !isValidCombination}
          className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2
            ${!isValidCombination 
              ? 'bg-gray-300 text-gray-500' 
              : 'bg-[#ff9800] text-white'
            }`}
        >
          {submitting ? (
            <>
              <Loader className="animate-spin" size={20} />
              {t.processing || 'İşleniyor...'}
            </>
          ) : (
            <>
              <CreditCard size={20} />
              {t.completeReservation || 'Rezervasyonu Tamamla'}
            </>
          )}
        </button>
      </div>

      {/* WhatsApp Redirect Modal */}
      <WhatsAppRedirectModal
        isOpen={showWhatsAppModal}
        onClose={() => setShowWhatsAppModal(false)}
        whatsappUrl={whatsAppData.url}
        reservationNumber={whatsAppData.reservationNumber}
        translations={translations}
        currentLang={currentLang}
      />
      
      {/* Guest Email Verification Modal */}
      {showGuestVerification && (
        <EmailVerificationModal
          isOpen={showGuestVerification}
          onClose={() => {
            setShowGuestVerification(false);
            setGuestVerificationCode('');
            setGuestTempToken('');
            setPendingReservationData(null);
          }}
          email={reservationData.email}
          onVerifyCode={async (code: string) => {
            setGuestVerificationCode(code);
            await handleGuestVerifyEmail();
          }}
          onResendCode={handleGuestResendCode}
          isVerifying={isGuestVerifying}
          isResending={isGuestResending}
          translations={translations}
          currentLang={currentLang}
          modalType="guest"
          guestName={reservationData.name}
        />
      )}

      {/* Toast Messages */}
      {toast.type && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ message: '', type: null })}
        />
      )}
    </div>
  );
};

export default ReservationPage;