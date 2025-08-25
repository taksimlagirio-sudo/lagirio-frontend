// components/apartments/AvailabilityCalendar.tsx

import React, { useState, useEffect } from 'react';
import { CalendarCheck, ChevronLeft, ChevronRight, Euro } from 'lucide-react';
import { monthNames, dayNames, getDaysInMonth, getFirstDayOfMonth } from '../../utils/dateHelpers';
import { pricingAPI, reservationAPI } from '../../utils/api';

interface Reservation {
  _id?: string;
  apartmentId?: string;
  apartment?: any;
  checkIn: string;
  checkOut: string;
  status: string;
  guestName?: string;
  guestInfo?: {
    name: string;
    email: string;
    phone: string;
  };
  user?: {
    name: string;
    email: string;
  };
}

interface Apartment {
  id: number;
  _id?: string;
  basePrice?: number;
  price?: number;
  reservations?: Reservation[]; // Geriye uyumluluk için
}

interface PricingData {
  [key: string]: {
    price: number;
    isAvailable: boolean;
  };
}

interface AvailabilityCalendarProps {
  apartment: Apartment;
  currentMonth: Date;
  setCurrentMonth: (date: Date) => void;
  translations: any;
  currentLang: string;
}

const AvailabilityCalendar: React.FC<AvailabilityCalendarProps> = ({
  apartment,
  currentMonth,
  setCurrentMonth,
  translations,
  currentLang
}) => {
  const t = translations[currentLang];
  const [hoveredInfo, setHoveredInfo] = useState<{ date: string; guest: string; price: number; available: boolean } | null>(null);
  const [dailyPrices, setDailyPrices] = useState<PricingData>({});
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [allReservations, setAllReservations] = useState<Reservation[]>([]);
  const [loadingReservations, setLoadingReservations] = useState(false);

  const apartmentId = apartment._id || apartment.id.toString();
  const basePrice = apartment.basePrice || apartment.price || 100;

  // Dile göre ay ve gün isimleri
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

  // Tarihi YYYY-MM-DD formatına çeviren yardımcı fonksiyon
  const formatLocalDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Tüm rezervasyonları yükle (RoomPlan gibi)
  useEffect(() => {
    loadAllReservations();
  }, [apartmentId]);

  // Fiyatları yükle
  useEffect(() => {
    loadMonthlyPrices();
  }, [currentMonth, apartmentId]);

  const loadAllReservations = async () => {
    try {
      setLoadingReservations(true);
      // ✅ Public endpoint kullan - auth gerektirmez
      const response = await reservationAPI.getByApartmentPublic(apartmentId);
      
      // Artık filtrelemeye gerek yok, sadece bu dairenin rezervasyonları geliyor
      setAllReservations(response);
      
    } catch (error) {
      console.error('Rezervasyonlar yüklenemedi:', error);
      // Fallback olarak component'e gelen rezervasyonları kullan
      if (apartment.reservations) {
        setAllReservations(apartment.reservations);
      } else {
        setAllReservations([]);
      }
    } finally {
      setLoadingReservations(false);
    }
  };

  const loadMonthlyPrices = async () => {
    try {
      setLoadingPrices(true);
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      
      // Tarihleri YYYY-MM-DD formatında gönder
      const startDate = formatLocalDate(new Date(year, month, 1));
      const endDate = formatLocalDate(new Date(year, month + 1, 0));
      
      const prices = await pricingAPI.getDateRange(apartmentId, startDate, endDate);
      setDailyPrices(prices);
    } catch (error) {
      console.error('Fiyatlar yüklenemedi:', error);
    } finally {
      setLoadingPrices(false);
    }
  };

  const isDateBooked = (dateStr: string): boolean => {
    return allReservations.some((res) => {
      const checkIn = new Date(res.checkIn);
      const checkOut = new Date(res.checkOut);
      const currentDate = new Date(dateStr);
      return currentDate >= checkIn && currentDate < checkOut;
    });
  };

  const isDateClosed = (dateStr: string): boolean => {
    const key = `${apartmentId}-${dateStr}`;
    return dailyPrices[key]?.isAvailable === false;
  };

  // Tarih müsait değil mi? (rezerve veya kapalı)
  const isDateUnavailable = (dateStr: string): boolean => {
    return isDateBooked(dateStr) || isDateClosed(dateStr);
  };

  const getReservationForDate = (dateStr: string): Reservation | undefined => {
    return allReservations.find((res) => {
      const checkIn = new Date(res.checkIn);
      const checkOut = new Date(res.checkOut);
      const currentDate = new Date(dateStr);
      return currentDate >= checkIn && currentDate < checkOut;
    });
  };

  const getDayPrice = (dateStr: string): number => {
    const key = `${apartmentId}-${dateStr}`;
    return dailyPrices[key]?.price || basePrice;
  };

  // Misafir ismini al
  const getGuestName = (reservation: Reservation): string => {
    return reservation.user?.name || 
           reservation.guestInfo?.name || 
           reservation.guestName || 
           'Misafir';
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg">
      <h3 className="text-xl font-semibold text-[#0a2e23] mb-4 flex items-center justify-between">
        <div className="flex items-center">
          <CalendarCheck size={24} className="mr-2" />
          {t.viewAvailability || 'Müsaitlik Takvimini Görüntüle'}
        </div>
        {(loadingPrices || loadingReservations) && (
          <span className="text-sm text-gray-500">
            {currentLang === 'tr' ? 'Yükleniyor...' : 
             currentLang === 'en' ? 'Loading...' :
             currentLang === 'ar' ? 'جار التحميل...' :
             currentLang === 'ru' ? 'Загрузка...' : 'Yükleniyor...'}
          </span>
        )}
      </h3>

      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => {
              const newDate = new Date(currentMonth);
              newDate.setMonth(newDate.getMonth() - 1);
              setCurrentMonth(newDate);
            }}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft size={20} />
          </button>

          <h4 className="font-semibold text-lg">
            {localMonthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h4>

          <button
            onClick={() => {
              const newDate = new Date(currentMonth);
              newDate.setMonth(newDate.getMonth() + 1);
              setCurrentMonth(newDate);
            }}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {localDayNames.map((day) => (
            <div
              key={day}
              className="text-center text-xs text-gray-500 font-medium py-2"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {Array.from({
            length:
              getFirstDayOfMonth(currentMonth) === 0
                ? 6
                : getFirstDayOfMonth(currentMonth) - 1,
          }).map((_, i) => (
            <div key={`empty-${i}`} className="h-16"></div>
          ))}

          {Array.from({ length: getDaysInMonth(currentMonth) }).map((_, i) => {
            const day = i + 1;
            const dateStr = `${currentMonth.getFullYear()}-${String(
              currentMonth.getMonth() + 1
            ).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const isToday = dateStr === new Date().toISOString().split("T")[0];
            const isPast = dateStr < new Date().toISOString().split("T")[0];
            const isUnavailable = isDateUnavailable(dateStr);
            const reservation = getReservationForDate(dateStr);
            const dayPrice = getDayPrice(dateStr);

            return (
              <div
                key={day}
                onMouseEnter={() =>
                  setHoveredInfo({
                    date: dateStr,
                    guest: reservation ? getGuestName(reservation) : '',
                    price: dayPrice,
                    available: !isUnavailable && !isPast
                  })
                }
                onMouseLeave={() => setHoveredInfo(null)}
                className={`
                  h-16 rounded-lg flex flex-col items-center justify-center text-sm font-medium relative p-1 transition-all
                  ${isPast ? "bg-gray-50 text-gray-400 cursor-not-allowed" : ""}
                  ${isToday ? "ring-2 ring-[#ff9800] ring-offset-1" : ""}
                  ${!isPast && isUnavailable ? "bg-red-50 text-red-600 hover:bg-red-100" : ""}
                  ${!isPast && !isUnavailable ? "bg-green-50 text-green-700 hover:bg-green-100 hover:scale-105" : ""}
                `}
              >
                <span className="text-base font-semibold">{day}</span>
                {!isPast && (
                  <span className="text-xs mt-0.5 font-medium">
                    {isUnavailable ? (
                      <span className="text-red-500">{t.unavailable || 'Dolu'}</span>
                    ) : (
                      <span className="text-green-600">€{dayPrice}</span>
                    )}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Hover bilgisi */}
        {hoveredInfo && (
          <div className="absolute z-10 bg-gray-900 text-white p-3 rounded-lg shadow-lg pointer-events-none"
               style={{ 
                 bottom: '100%', 
                 left: '50%', 
                 transform: 'translateX(-50%)',
                 marginBottom: '10px'
               }}>
            <div className="text-sm space-y-1">
              <p className="font-medium">
                {new Date(hoveredInfo.date).toLocaleDateString(
                  currentLang === 'tr' ? 'tr-TR' : 
                  currentLang === 'en' ? 'en-US' : 
                  currentLang === 'ar' ? 'ar-SA' : 
                  'ru-RU', 
                  { 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric' 
                  }
                )}
              </p>
              {hoveredInfo.guest ? (
                <p>{t.guest || 'Misafir'}: {hoveredInfo.guest}</p>
              ) : hoveredInfo.available ? (
                <>
                  <p className="flex items-center">
                    <Euro size={14} className="mr-1" />
                    {hoveredInfo.price} / {t.night || 'gece'}
                  </p>
                  <p className="text-green-400 font-medium">{t.available || 'Müsait'}</p>
                </>
              ) : (
                <p className="text-red-400 font-medium">{t.notAvailable || 'Müsait Değil'}</p>
              )}
            </div>
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-0 h-0 
                            border-l-8 border-l-transparent border-r-8 border-r-transparent 
                            border-t-8 border-t-gray-900"></div>
          </div>
        )}
      </div>

      {/* Açıklama - Sadeleştirilmiş */}
      <div className="mt-6 flex items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-50 border border-green-200 rounded"></div>
          <span className="text-gray-600">{t.available || 'Müsait'}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-50 border border-red-200 rounded"></div>
          <span className="text-gray-600">{t.notAvailable || 'Müsait Değil'}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-50 border border-gray-200 rounded"></div>
          <span className="text-gray-600">{t.past || 'Geçmiş'}</span>
        </div>
      </div>
    </div>
  );
};

export default AvailabilityCalendar;