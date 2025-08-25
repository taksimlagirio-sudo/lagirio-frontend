// utils/rulesTranslations.ts
// utils/rulesTranslations.ts
import { 
  CircleSlash, Dog, PartyPopper, Volume2, Users, Calendar,
  Clock, Baby, Bed, AlertCircle, Heart,
  Flame, Camera, Lock, Bell, Shield, ShieldAlert,
  DoorOpen, KeyRound, Home, LucideIcon
} from 'lucide-react';

// Ev Kuralları Çevirileri
export const rulesTranslations: { [key: string]: { [lang: string]: string } } = {
  // Admin paneldeki preset kurallar
  'Sigara içilmez': {
    tr: 'Sigara içilmez',
    en: 'No smoking',
    ar: 'ممنوع التدخين',
    ru: 'Курение запрещено'
  },
  'Evcil hayvan kabul edilmez': {
    tr: 'Evcil hayvan kabul edilmez',
    en: 'No pets allowed',
    ar: 'الحيوانات الأليفة غير مسموحة',
    ru: 'Домашние животные не допускаются'
  },
  'Parti veya etkinlik düzenlenemez': {
    tr: 'Parti veya etkinlik düzenlenemez',
    en: 'No parties or events',
    ar: 'لا حفلات أو فعاليات',
    ru: 'Вечеринки и мероприятия запрещены'
  },
  'Gece 22:00\'den sonra sessizlik': {
    tr: 'Gece 22:00\'den sonra sessizlik',
    en: 'Quiet hours after 10:00 PM',
    ar: 'الهدوء بعد الساعة 10 مساءً',
    ru: 'Тишина после 22:00'
  },
  'Ziyaretçi kabul edilmez': {
    tr: 'Ziyaretçi kabul edilmez',
    en: 'No visitors allowed',
    ar: 'الزوار غير مسموحين',
    ru: 'Посетители не допускаются'
  },
  'Maksimum konaklama süresi 30 gün': {
    tr: 'Maksimum konaklama süresi 30 gün',
    en: 'Maximum stay 30 days',
    ar: 'أقصى إقامة 30 يومًا',
    ru: 'Максимальный срок проживания 30 дней'
  },
  
  // Olası custom kurallar
  'Giriş saati 14:00': {
    tr: 'Giriş saati 14:00',
    en: 'Check-in time 2:00 PM',
    ar: 'وقت تسجيل الوصول 2:00 مساءً',
    ru: 'Время заезда 14:00'
  },
  'Çıkış saati 11:00': {
    tr: 'Çıkış saati 11:00',
    en: 'Check-out time 11:00 AM',
    ar: 'وقت تسجيل المغادرة 11:00 صباحًا',
    ru: 'Время выезда 11:00'
  },
  'Gece 23:00\'den sonra sessizlik': {
    tr: 'Gece 23:00\'den sonra sessizlik',
    en: 'Quiet hours after 11:00 PM',
    ar: 'الهدوء بعد الساعة 11 مساءً',
    ru: 'Тишина после 23:00'
  },
  'Minimum konaklama 2 gece': {
    tr: 'Minimum konaklama 2 gece',
    en: 'Minimum stay 2 nights',
    ar: 'الحد الأدنى للإقامة ليلتان',
    ru: 'Минимальное проживание 2 ночи'
  },
  'Minimum konaklama 3 gece': {
    tr: 'Minimum konaklama 3 gece',
    en: 'Minimum stay 3 nights',
    ar: 'الحد الأدنى للإقامة 3 ليالي',
    ru: 'Минимальное проживание 3 ночи'
  },
  'Bebek yatağı mevcut': {
    tr: 'Bebek yatağı mevcut',
    en: 'Baby crib available',
    ar: 'سرير أطفال متاح',
    ru: 'Детская кроватка доступна'
  },
  'Ekstra yatak mevcut': {
    tr: 'Ekstra yatak mevcut',
    en: 'Extra bed available',
    ar: 'سرير إضافي متاح',
    ru: 'Дополнительная кровать доступна'
  }
};

// Güvenlik Özellikleri Çevirileri
export const safetyTranslations: { [key: string]: { [lang: string]: string } } = {
  // Admin paneldeki preset güvenlik özellikleri
  'Duman dedektörü': {
    tr: 'Duman dedektörü',
    en: 'Smoke detector',
    ar: 'كاشف الدخان',
    ru: 'Детектор дыма'
  },
  'Karbonmonoksit dedektörü': {
    tr: 'Karbonmonoksit dedektörü',
    en: 'Carbon monoxide detector',
    ar: 'كاشف أول أكسيد الكربون',
    ru: 'Детектор угарного газа'
  },
  'İlk yardım çantası': {
    tr: 'İlk yardım çantası',
    en: 'First aid kit',
    ar: 'حقيبة الإسعافات الأولية',
    ru: 'Аптечка первой помощи'
  },
  'Yangın söndürücü': {
    tr: 'Yangın söndürücü',
    en: 'Fire extinguisher',
    ar: 'طفاية حريق',
    ru: 'Огнетушитель'
  },
  'Güvenlik kamerası (dış alan)': {
    tr: 'Güvenlik kamerası (dış alan)',
    en: 'Security camera (outdoor)',
    ar: 'كاميرا أمنية (خارجية)',
    ru: 'Камера безопасности (снаружи)'
  },
  'Kapı kilidi': {
    tr: 'Kapı kilidi',
    en: 'Door lock',
    ar: 'قفل الباب',
    ru: 'Дверной замок'
  },
  'Pencere güvenlik kilidi': {
    tr: 'Pencere güvenlik kilidi',
    en: 'Window security lock',
    ar: 'قفل أمان النافذة',
    ru: 'Замок безопасности окна'
  },
  
  // Olası custom güvenlik özellikleri
  'Alarm sistemi': {
    tr: 'Alarm sistemi',
    en: 'Alarm system',
    ar: 'نظام إنذار',
    ru: 'Сигнализация'
  },
  'Güvenlik görevlisi': {
    tr: 'Güvenlik görevlisi',
    en: 'Security guard',
    ar: 'حارس أمن',
    ru: 'Охранник'
  },
  '24 saat güvenlik': {
    tr: '24 saat güvenlik',
    en: '24-hour security',
    ar: 'أمن على مدار 24 ساعة',
    ru: '24-часовая охрана'
  },
  'Kapı zili': {
    tr: 'Kapı zili',
    en: 'Doorbell',
    ar: 'جرس الباب',
    ru: 'Дверной звонок'
  },
  'Görüntülü diafon': {
    tr: 'Görüntülü diafon',
    en: 'Video intercom',
    ar: 'اتصال داخلي بالفيديو',
    ru: 'Видеодомофон'
  },
  'Kasa': {
    tr: 'Kasa',
    en: 'Safe',
    ar: 'خزنة',
    ru: 'Сейф'
  },
  'Acil durum çıkışı': {
    tr: 'Acil durum çıkışı',
    en: 'Emergency exit',
    ar: 'مخرج الطوارئ',
    ru: 'Аварийный выход'
  },
  'Güvenlik kamerası (iç alan)': {
    tr: 'Güvenlik kamerası (iç alan)',
    en: 'Security camera (indoor)',
    ar: 'كاميرا أمنية (داخلية)',
    ru: 'Камера безопасности (внутри)'
  }
};

// Helper fonksiyonlar
export const translateRule = (rule: string, lang: string): string => {
  if (rulesTranslations[rule] && rulesTranslations[rule][lang]) {
    return rulesTranslations[rule][lang];
  }
  return rule;
};

export const translateSafety = (safety: string, lang: string): string => {
  if (safetyTranslations[safety] && safetyTranslations[safety][lang]) {
    return safetyTranslations[safety][lang];
  }
  return safety;
};

// Icon mapping - Lucide React Icons
export const getRuleIconComponent = (rule: string): LucideIcon => {
  // Sigara kuralları
  if (rule.includes('Sigara') || rule.includes('smoking') || rule.includes('التدخين') || rule.includes('Курение')) {
    return CircleSlash; // Sigara yasağı için daha uygun
  }
  // Evcil hayvan kuralları
  if (rule.includes('Evcil') || rule.includes('pets') || rule.includes('الحيوانات') || rule.includes('животные')) {
    return Dog;
  }
  // Parti kuralları
  if (rule.includes('Parti') || rule.includes('parti') || rule.includes('event') || rule.includes('حفلات') || rule.includes('Вечеринки')) {
    return PartyPopper;
  }
  // Sessizlik kuralları
  if (rule.includes('sessizlik') || rule.includes('Quiet') || rule.includes('الهدوء') || rule.includes('Тишина')) {
    return Volume2;
  }
  // Ziyaretçi kuralları
  if (rule.includes('Ziyaretçi') || rule.includes('visitor') || rule.includes('الزوار') || rule.includes('Посетители')) {
    return Users;
  }
  // Konaklama süresi
  if (rule.includes('konaklama') || rule.includes('stay') || rule.includes('إقامة') || rule.includes('проживания')) {
    return Calendar;
  }
  // Giriş/Çıkış saatleri
  if (rule.includes('Giriş saati') || rule.includes('Check-in') || rule.includes('الوصول') || rule.includes('заезда') ||
      rule.includes('Çıkış saati') || rule.includes('Check-out') || rule.includes('المغادرة') || rule.includes('выезда')) {
    return Clock;
  }
  // Bebek
  if (rule.includes('Bebek') || rule.includes('Baby') || rule.includes('أطفال') || rule.includes('Детская')) {
    return Baby;
  }
  // Yatak
  if (rule.includes('yatak') || rule.includes('bed') || rule.includes('سرير') || rule.includes('кровать')) {
    return Bed;
  }
  
  // Default
  return Home;
};

export const getSafetyIconComponent = (safety: string): LucideIcon => {
  // Duman dedektörü
  if (safety.includes('Duman') || safety.includes('Smoke') || safety.includes('الدخان') || safety.includes('дыма')) {
    return AlertCircle;
  }
  // Karbonmonoksit
  if (safety.includes('Karbonmonoksit') || safety.includes('Carbon') || safety.includes('الكربون') || safety.includes('угарного')) {
    return ShieldAlert;
  }
  // İlk yardım
  if (safety.includes('İlk yardım') || safety.includes('First aid') || safety.includes('الإسعافات') || safety.includes('Аптечка')) {
    return Heart;
  }
  // Yangın söndürücü
  if (safety.includes('Yangın') || safety.includes('Fire') || safety.includes('حريق') || safety.includes('Огнетушитель')) {
    return Flame;
  }
  // Güvenlik kamerası
  if (safety.includes('kamera') || safety.includes('camera') || safety.includes('كاميرا') || safety.includes('Камера')) {
    return Camera;
  }
  // Kilit
  if (safety.includes('kilit') || safety.includes('lock') || safety.includes('قفل') || safety.includes('замок')) {
    return Lock;
  }
  // Alarm
  if (safety.includes('Alarm') || safety.includes('alarm') || safety.includes('إنذار') || safety.includes('Сигнализация')) {
    return Bell;
  }
  // Güvenlik görevlisi
  if (safety.includes('görevli') || safety.includes('guard') || safety.includes('حارس') || safety.includes('Охранник')) {
    return Shield;
  }
  // Diafon/Zil
  if (safety.includes('diafon') || safety.includes('zili') || safety.includes('intercom') || safety.includes('doorbell')) {
    return Bell;
  }
  // Kasa
  if (safety.includes('Kasa') || safety.includes('Safe') || safety.includes('خزنة') || safety.includes('Сейф')) {
    return KeyRound;
  }
  // Acil çıkış
  if (safety.includes('Acil') || safety.includes('Emergency') || safety.includes('الطوارئ') || safety.includes('Аварийный')) {
    return DoorOpen;
  }
  
  // Default
  return Shield;
};
