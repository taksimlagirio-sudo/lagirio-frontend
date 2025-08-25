// utils/phoneValidation.ts

interface CountryPhoneValidation {
  code: string;
  minDigits: number;
  maxDigits: number;
  regex?: RegExp;
}

// Her ülke için telefon numarası kuralları
export const phoneValidationRules: CountryPhoneValidation[] = [
  { code: "TR", minDigits: 10, maxDigits: 10, regex: /^5\d{9}$/ }, // 5XX XXX XX XX
  { code: "US", minDigits: 10, maxDigits: 10, regex: /^\d{10}$/ },
  { code: "GB", minDigits: 10, maxDigits: 11, regex: /^\d{10,11}$/ },
  { code: "DE", minDigits: 10, maxDigits: 12, regex: /^\d{10,12}$/ },
  { code: "FR", minDigits: 9, maxDigits: 9, regex: /^\d{9}$/ },
  { code: "IT", minDigits: 9, maxDigits: 10, regex: /^\d{9,10}$/ },
  { code: "ES", minDigits: 9, maxDigits: 9, regex: /^\d{9}$/ },
  { code: "NL", minDigits: 9, maxDigits: 9, regex: /^\d{9}$/ },
  { code: "BE", minDigits: 8, maxDigits: 9, regex: /^\d{8,9}$/ },
  { code: "RU", minDigits: 10, maxDigits: 10, regex: /^\d{10}$/ },
  { code: "CN", minDigits: 11, maxDigits: 11, regex: /^1\d{10}$/ },
  { code: "JP", minDigits: 10, maxDigits: 11, regex: /^\d{10,11}$/ },
  { code: "IN", minDigits: 10, maxDigits: 10, regex: /^[6-9]\d{9}$/ },
  { code: "BR", minDigits: 10, maxDigits: 11, regex: /^\d{10,11}$/ },
  { code: "AE", minDigits: 8, maxDigits: 9, regex: /^\d{8,9}$/ },
  { code: "SA", minDigits: 9, maxDigits: 9, regex: /^5\d{8}$/ },
];

// Varsayılan kural (listede olmayan ülkeler için)
const defaultRule: CountryPhoneValidation = {
  code: "DEFAULT",
  minDigits: 7,
  maxDigits: 15
};

// Telefon numarası validasyonu
export const validatePhoneNumber = (phone: string, countryCode: string): { isValid: boolean; error?: string } => {
  // Sadece rakamları al
  const digitsOnly = phone.replace(/\D/g, '');
  
  // Ülke kuralını bul
  const rule = phoneValidationRules.find(r => r.code === countryCode) || defaultRule;
  
  // Uzunluk kontrolü
  if (digitsOnly.length < rule.minDigits) {
    return { 
      isValid: false, 
      error: `Telefon numarası en az ${rule.minDigits} rakam olmalıdır` 
    };
  }
  
  if (digitsOnly.length > rule.maxDigits) {
    return { 
      isValid: false, 
      error: `Telefon numarası en fazla ${rule.maxDigits} rakam olmalıdır` 
    };
  }
  
  // Regex kontrolü (varsa)
  if (rule.regex && !rule.regex.test(digitsOnly)) {
    return { 
      isValid: false, 
      error: 'Geçersiz telefon numarası formatı' 
    };
  }
  
  return { isValid: true };
};

// Telefon numarasını formatla
export const formatPhoneNumber = (phone: string, countryCode: string): string => {
  const digitsOnly = phone.replace(/\D/g, '');
  
  switch(countryCode) {
    case 'TR':
      // 5XX XXX XX XX
      if (digitsOnly.length === 10) {
        return `${digitsOnly.slice(0, 3)} ${digitsOnly.slice(3, 6)} ${digitsOnly.slice(6, 8)} ${digitsOnly.slice(8)}`;
      }
      break;
    case 'US':
    case 'CA':
      // (XXX) XXX-XXXX
      if (digitsOnly.length === 10) {
        return `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6)}`;
      }
      break;
    case 'GB':
      // XXXX XXX XXXX
      if (digitsOnly.length === 11) {
        return `${digitsOnly.slice(0, 4)} ${digitsOnly.slice(4, 7)} ${digitsOnly.slice(7)}`;
      }
      break;
    default:
      // Varsayılan: 3'lü gruplar
      return digitsOnly.replace(/(\d{3})(?=\d)/g, '$1 ');
  }
  
  return phone;
};