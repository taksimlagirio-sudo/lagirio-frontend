import React, { useState, useEffect } from 'react';
import { Calendar, Users, Search, ChevronDown, ChevronLeft, ChevronRight, Baby } from 'lucide-react';
import { monthNames, dayNames, getDaysInMonth, getFirstDayOfMonth } from '../../utils/dateHelpers';

interface SearchFilters {
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  childrenAgeGroups?: {
    above7: number;
    between2And7: number;
    under2: number;
  };
}

interface SearchBarProps {
  searchFilters: SearchFilters;
  setSearchFilters: (filters: SearchFilters) => void;
  onSearch: (searchData: SearchFilters) => void; // Açık ve net: SearchFilters alıyor
  translations: any;
  currentLang: string;
  isMobileModal?: boolean;
}

const getTurkeyDate = () => {
  const now = new Date();
  const turkeyTime = new Date(now.getTime() + (3 * 60 * 60 * 1000) - (now.getTimezoneOffset() * 60 * 1000));
  return turkeyTime;
};

const getTurkeyDateString = () => {
  const turkeyDate = getTurkeyDate();
  return turkeyDate.toISOString().split('T')[0];
};

const SearchBar: React.FC<SearchBarProps> = ({
  searchFilters: initialFilters,
  setSearchFilters: onFiltersChange,
  onSearch,
  translations,
  currentLang,
  isMobileModal = false,
}) => {
  const t = translations[currentLang];
  
  // Local state
  const [localFilters, setLocalFilters] = useState(initialFilters);
  
  // Parent'tan gelen değişiklikleri takip et
  useEffect(() => {
    setLocalFilters(initialFilters);
  }, [initialFilters]);
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showGuestsDropdown, setShowGuestsDropdown] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(getTurkeyDate());
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  
  // Çocuk yaş grupları state'i
  const [childrenAgeGroups, setChildrenAgeGroups] = useState({
    above7: localFilters.childrenAgeGroups?.above7 || 0,
    between2And7: localFilters.childrenAgeGroups?.between2And7 || 0,
    under2: localFilters.childrenAgeGroups?.under2 || 0
  });

  // Parent'tan gelen childrenAgeGroups değişikliklerini takip et
  useEffect(() => {
    setChildrenAgeGroups({
      above7: initialFilters.childrenAgeGroups?.above7 || 0,
      between2And7: initialFilters.childrenAgeGroups?.between2And7 || 0,
      under2: initialFilters.childrenAgeGroups?.under2 || 0
    });
  }, [initialFilters.childrenAgeGroups]);
  
  // Dil ayarları (kısaltılmış)
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

  // Çocuk yaş gruplarını güncelle
  const updateChildrenAgeGroups = (group: 'above7' | 'between2And7' | 'under2', value: number) => {
    const newGroups = { ...childrenAgeGroups, [group]: value };
    setChildrenAgeGroups(newGroups);
    
    const totalChildren = newGroups.above7 + newGroups.between2And7 + newGroups.under2;
    setLocalFilters({ 
      ...localFilters, 
      children: totalChildren,
      childrenAgeGroups: newGroups
    });
  };

  // Çocuk sayısı değişimi
  const handleChildrenChange = (newCount: number) => {
    if (newCount === 0) {
      setChildrenAgeGroups({ above7: 0, between2And7: 0, under2: 0 });
      setLocalFilters({ 
        ...localFilters, 
        children: 0,
        childrenAgeGroups: { above7: 0, between2And7: 0, under2: 0 }
      });
    } else {
      setLocalFilters({ ...localFilters, children: newCount });
    }
  };

  // Tarih seçimi
  const handleDateSelect = (dateStr: string) => {
    if (!localFilters.checkIn || localFilters.checkOut) {
      setLocalFilters({ ...localFilters, checkIn: dateStr, checkOut: '' });
    } else {
      if (dateStr > localFilters.checkIn) {
        setLocalFilters({ ...localFilters, checkOut: dateStr });
      } else {
        setLocalFilters({ ...localFilters, checkIn: dateStr, checkOut: '' });
      }
    }
  };

  // ARAMA FONKSİYONU - ÇOK BASİT
  const handleSearch = () => {
    // Parent state'ini güncelle
    onFiltersChange(localFilters);
    
    // Direkt local değerlerle arama yap
    onSearch(localFilters);
  };
  
  // Component geri kalanı aynı...
  return (
    <div className={`${isMobileModal ? '' : 'bg-[#f5e6d3] rounded-2xl p-6 shadow-xl'}`}>
      {/* Tüm JSX kodunuz aynı kalacak, sadece handleSearch değişti */}
      {/* Date picker, guest selector vs. hepsi aynı */}
      <div className={`${isMobileModal ? 'flex flex-col space-y-4' : 'grid md:grid-cols-4 gap-4 items-center'}`}>
        {/* Date Selection */}
        <div className={`relative date-picker-container ${isMobileModal ? 'w-full' : 'md:col-span-2'}`}>
          <button
            onClick={() => setShowDatePicker(!showDatePicker)}
            className={`w-full px-4 py-3 bg-white rounded-lg flex items-center justify-between hover:bg-gray-50 transition-colors ${isMobileModal ? 'text-base' : ''}`}
          >
            <div className="flex items-center space-x-2">
              <Calendar size={20} className="text-[#0a2e23]" />
              <span className="text-[#0a2e23]">
                {localFilters.checkIn && localFilters.checkOut
                  ? `${new Date(localFilters.checkIn).toLocaleDateString(currentLang === 'tr' ? "tr-TR" : "en-US")} - ${new Date(localFilters.checkOut).toLocaleDateString(currentLang === 'tr' ? "tr-TR" : "en-US")}`
                  : localFilters.checkIn
                  ? `${new Date(localFilters.checkIn).toLocaleDateString(currentLang === 'tr' ? "tr-TR" : "en-US")} - ?`
                  : t.checkIn || 'Check-in'}
              </span>
            </div>
            <ChevronDown size={20} className="text-[#0a2e23]" />
          </button>

          {/* Date picker modal - aynı kalacak */}
          {showDatePicker && (
            <div className={`absolute top-full mt-2 bg-white rounded-lg shadow-xl p-4 z-50 ${isMobileModal ? 'left-0 right-0 mx-4' : 'w-full md:w-[500px]'}`}>
              {/* Calendar içeriği aynı */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() => {
                      const newMonth = new Date(currentMonth);
                      newMonth.setMonth(newMonth.getMonth() - 1);
                      setCurrentMonth(newMonth);
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <h3 className={`font-semibold ${isMobileModal ? 'text-base' : ''}`}>
                    {localMonthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                  </h3>
                  <button
                    onClick={() => {
                      const newMonth = new Date(currentMonth);
                      newMonth.setMonth(newMonth.getMonth() + 1);
                      setCurrentMonth(newMonth);
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>

                {/* Gün isimleri */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {localDayNames.map((day) => (
                    <div key={day} className={`text-center text-gray-500 font-medium py-1 ${isMobileModal ? 'text-xs' : 'text-xs'}`}>
                      {day}
                    </div>
                  ))}
                </div>

                {/* Takvim günleri */}
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({
                    length: getFirstDayOfMonth(currentMonth) === 0 ? 6 : getFirstDayOfMonth(currentMonth) - 1,
                  }).map((_, i) => (
                    <div key={`empty-${i}`} className={isMobileModal ? "h-8" : "h-10"}></div>
                  ))}

                  {Array.from({ length: getDaysInMonth(currentMonth) }).map((_, i) => {
                    const day = i + 1;
                    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                    const isToday = dateStr === getTurkeyDateString();
                    const isInRange = localFilters.checkIn && localFilters.checkOut && dateStr > localFilters.checkIn && dateStr < localFilters.checkOut;
                    const isBooked = false;
                    const isPast = dateStr < getTurkeyDateString();
                    const isHovered = dateStr === hoveredDate;
                    const isCheckIn = dateStr === localFilters.checkIn;
                    const isCheckOut = dateStr === localFilters.checkOut;

                    return (
                      <button
                        key={day}
                        onClick={() => !isPast && !isBooked && handleDateSelect(dateStr)}
                        onMouseEnter={() => setHoveredDate(dateStr)}
                        onMouseLeave={() => setHoveredDate(null)}
                        disabled={isPast || isBooked}
                        className={`
                          ${isMobileModal ? 'h-8 text-xs' : 'h-10 text-sm'} 
                          rounded-lg font-medium transition-all
                          ${isPast ? 'text-gray-300 cursor-not-allowed' : ''}
                          ${isBooked ? 'bg-red-100 text-red-400 cursor-not-allowed' : ''}
                          ${isCheckIn || isCheckOut ? 'bg-[#ff9800] text-white' : ''}
                          ${isInRange ? 'bg-[#ff9800]/20 text-[#ff9800]' : ''}
                          ${isHovered ? 'bg-[#ff9800]/10' : ''}
                          ${!isPast && !isBooked && !isCheckIn && !isCheckOut && !isInRange ? 'hover:bg-gray-200' : ''}
                          ${isToday ? 'ring-2 ring-[#ff9800] ring-offset-2' : ''}
                        `}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Aksiyonlar */}
              <div className="flex justify-between items-center pt-4 border-t">
                <button
                  onClick={() => {
                    setLocalFilters({ ...localFilters, checkIn: '', checkOut: '' });
                  }}
                  className="text-sm text-gray-600 hover:text-gray-800"
                >
                  {t.clear || 'Temizle'}
                </button>
                <button
                  onClick={() => setShowDatePicker(false)}
                  className="text-sm bg-[#0a2e23] text-white px-4 py-2 rounded-lg hover:bg-[#0f4a3a]"
                >
                  {t.done || 'Tamam'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Misafirler */}
        <div className={`relative ${isMobileModal ? 'w-full' : ''}`}>
          <button
            onClick={() => setShowGuestsDropdown(!showGuestsDropdown)}
            className={`w-full px-4 py-3 bg-white rounded-lg flex items-center justify-between hover:bg-gray-50 transition-colors h-14 ${isMobileModal ? 'text-base' : ''}`}
          >
            <div className="flex items-center space-x-2">
              <Users size={20} className="text-[#0a2e23] flex-shrink-0" />
              <span className="text-[#0a2e23] text-sm">
                {localFilters.adults} {t.adults || 'Yetişkin'}
                {localFilters.children > 0 && `, ${localFilters.children} ${localFilters.children === 1 ? (t.child || 'Çocuk') : (t.children || 'Çocuk')}`}
              </span>
            </div>
            <ChevronDown size={20} className="text-[#0a2e23] flex-shrink-0" />
          </button>

          {showGuestsDropdown && (
            <div className={`absolute top-full mt-2 bg-white rounded-lg shadow-lg p-4 z-50 ${isMobileModal ? 'left-0 right-0' : 'w-full'}`}>
              {/* Yetişkinler */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-gray-700">{t.adults}</span>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setLocalFilters({ ...localFilters, adults: Math.max(1, localFilters.adults - 1) })}
                    className="w-8 h-8 bg-gray-200 rounded-full hover:bg-gray-300 flex items-center justify-center"
                  >
                    -
                  </button>
                  <span className="w-8 text-center font-medium">{localFilters.adults}</span>
                  <button
                    onClick={() => setLocalFilters({ ...localFilters, adults: localFilters.adults + 1 })}
                    className="w-8 h-8 bg-gray-200 rounded-full hover:bg-gray-300 flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Çocuklar */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-gray-700">{t.children}</span>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleChildrenChange(Math.max(0, localFilters.children - 1))}
                    className="w-8 h-8 bg-gray-200 rounded-full hover:bg-gray-300 flex items-center justify-center"
                  >
                    -
                  </button>
                  <span className="w-8 text-center font-medium">{localFilters.children}</span>
                  <button
                    onClick={() => handleChildrenChange(localFilters.children + 1)}
                    className="w-8 h-8 bg-gray-200 rounded-full hover:bg-gray-300 flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Çocuk yaş grupları - aynı kalacak */}
              {localFilters.children > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center mb-3">
                    <Baby size={16} className="text-gray-600 mr-2" />
                    <p className="text-sm font-medium text-gray-700">
                      Çocuk yaşlarını belirtin
                    </p>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                    <p className="text-xs text-blue-800">
                      Toplam: {childrenAgeGroups.above7 + childrenAgeGroups.between2And7 + childrenAgeGroups.under2} / {localFilters.children} çocuk
                    </p>
                  </div>
                  
                  {/* 7 Yaş ve Üstü */}
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="text-sm text-gray-700 font-medium">7-18 Yaş</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateChildrenAgeGroups('above7', Math.max(0, childrenAgeGroups.above7 - 1))}
                        disabled={childrenAgeGroups.above7 === 0}
                        className="w-7 h-7 bg-gray-200 rounded-full hover:bg-gray-300 flex items-center justify-center text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-sm font-medium">{childrenAgeGroups.above7}</span>
                      <button
                        onClick={() => updateChildrenAgeGroups('above7', childrenAgeGroups.above7 + 1)}
                        disabled={childrenAgeGroups.above7 + childrenAgeGroups.between2And7 + childrenAgeGroups.under2 >= localFilters.children}
                        className="w-7 h-7 bg-gray-200 rounded-full hover:bg-gray-300 flex items-center justify-center text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* 2-7 Yaş Arası */}
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="text-sm text-gray-700 font-medium">2-7 Yaş</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateChildrenAgeGroups('between2And7', Math.max(0, childrenAgeGroups.between2And7 - 1))}
                        disabled={childrenAgeGroups.between2And7 === 0}
                        className="w-7 h-7 bg-gray-200 rounded-full hover:bg-gray-300 flex items-center justify-center text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-sm font-medium">{childrenAgeGroups.between2And7}</span>
                      <button
                        onClick={() => updateChildrenAgeGroups('between2And7', childrenAgeGroups.between2And7 + 1)}
                        disabled={childrenAgeGroups.above7 + childrenAgeGroups.between2And7 + childrenAgeGroups.under2 >= localFilters.children}
                        className="w-7 h-7 bg-gray-200 rounded-full hover:bg-gray-300 flex items-center justify-center text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* 0-2 Yaş (Bebek) */}
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm text-gray-700 font-medium">0-2 Yaş</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateChildrenAgeGroups('under2', Math.max(0, childrenAgeGroups.under2 - 1))}
                        disabled={childrenAgeGroups.under2 === 0}
                        className="w-7 h-7 bg-gray-200 rounded-full hover:bg-gray-300 flex items-center justify-center text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-sm font-medium">{childrenAgeGroups.under2}</span>
                      <button
                        onClick={() => updateChildrenAgeGroups('under2', childrenAgeGroups.under2 + 1)}
                        disabled={childrenAgeGroups.above7 + childrenAgeGroups.between2And7 + childrenAgeGroups.under2 >= localFilters.children}
                        className="w-7 h-7 bg-gray-200 rounded-full hover:bg-gray-300 flex items-center justify-center text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Uyarı */}
                  {(childrenAgeGroups.above7 + childrenAgeGroups.between2And7 + childrenAgeGroups.under2) !== localFilters.children && localFilters.children > 0 && (
                    <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
                      <p className="text-xs text-red-600 flex items-center">
                        <span className="mr-1">⚠️</span>
                        Lütfen tüm çocukların yaş gruplarını belirtin
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-4 pt-4 border-t">
                <button
                  onClick={() => setShowGuestsDropdown(false)}
                  className="w-full text-sm bg-[#0a2e23] text-white px-4 py-2 rounded-lg hover:bg-[#0f4a3a]"
                >
                  Tamam
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Arama butonu */}
        <button
          onClick={handleSearch}
          disabled={localFilters.children > 0 && (childrenAgeGroups.above7 + childrenAgeGroups.between2And7 + childrenAgeGroups.under2) !== localFilters.children}
          className={`w-full bg-[#0a2e23] text-white px-6 py-3 rounded-lg hover:bg-[#0f4a3a] transition-colors flex items-center justify-center space-x-2 h-14 disabled:opacity-50 disabled:cursor-not-allowed ${isMobileModal ? 'mt-8 text-lg font-semibold' : ''}`}
        >
          <Search size={20} />
          <span>{t.searchApartments || 'Ara'}</span>
        </button>
      </div>

      {!isMobileModal && (
        <div className="flex justify-between items-center mt-4">
          <button
            onClick={() => {
              setLocalFilters({
                checkIn: "",
                checkOut: "",
                adults: 1,
                children: 0,
                childrenAgeGroups: { above7: 0, between2And7: 0, under2: 0 }
              });
              setChildrenAgeGroups({ above7: 0, between2And7: 0, under2: 0 });
            }}
            className="text-sm text-[#0a2e23] hover:text-[#0f4a3a] transition-colors"
          >
            {t.clearFilters || 'Filtreleri Temizle'}
          </button>
        </div>
      )}
    </div>
  );
};

export default SearchBar;