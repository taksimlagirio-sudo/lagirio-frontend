import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { countryPhoneCodes, CountryPhoneCode } from '../../utils/countryPhoneCodes';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  label?: string;
  error?: string;
}

const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChange,
  required = false,
  placeholder = "555 123 4567",
  className = "",
  disabled = false,
  label,
  error
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<CountryPhoneCode>(
    countryPhoneCodes.find(c => c.code === 'TR')!
  );
  const [phoneNumber, setPhoneNumber] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Value'yu parse et
  useEffect(() => {
    if (value) {
      // Telefon numarasından ülke kodunu ayır
      const country = countryPhoneCodes.find(c => value.startsWith(c.dial_code));
      if (country) {
        setSelectedCountry(country);
        setPhoneNumber(value.replace(country.dial_code, '').trim());
      } else {
        // Varsayılan olarak +90 ile başlıyorsa
        if (value.startsWith('+90')) {
          setPhoneNumber(value.replace('+90', '').trim());
        } else {
          setPhoneNumber(value);
        }
      }
    }
  }, []);

  // Dropdown dışına tıklandığında kapat
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Telefon numarası değiştiğinde
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPhone = e.target.value.replace(/[^\d\s]/g, ''); // Sadece rakam ve boşluk
    setPhoneNumber(newPhone);
    onChange(`${selectedCountry.dial_code} ${newPhone}`);
  };

  // Ülke seçildiğinde
  const handleCountrySelect = (country: CountryPhoneCode) => {
    setSelectedCountry(country);
    setShowDropdown(false);
    setSearchTerm('');
    onChange(`${country.dial_code} ${phoneNumber}`);
  };

  // Filtrelenmiş ülkeler
  const filteredCountries = countryPhoneCodes.filter(country =>
    country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    country.dial_code.includes(searchTerm) ||
    country.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      <div className="relative">
        <div className="flex">
          {/* Ülke Seçici - Mobilde genişlik sınırlandı */}
          <div className="relative flex-shrink-0" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setShowDropdown(!showDropdown)}
              disabled={disabled}
              className="flex items-center space-x-1 md:space-x-2 px-2 md:px-3 py-3 md:py-4 border border-r-0 border-gray-300 rounded-l-xl bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#ff9800] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="text-base md:text-lg">{selectedCountry.flag}</span>
              <span className="text-xs md:text-sm font-medium">{selectedCountry.dial_code}</span>
              <ChevronDown size={14} className={`md:w-4 md:h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown - Mobilde pozisyon ve genişlik ayarlandı */}
            {showDropdown && (
              <div className="absolute top-full left-0 mt-1 w-64 md:w-72 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-80 md:max-h-96 overflow-hidden">
                {/* Arama */}
                <div className="p-2 md:p-3 border-b">
                  <div className="relative">
                    <Search size={16} className="md:w-[18px] md:h-[18px] absolute left-2 md:left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Ülke ara..."
                      className="w-full pl-8 md:pl-10 pr-2 md:pr-3 py-1.5 md:py-2 text-sm md:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff9800] focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Ülke Listesi */}
                <div className="max-h-60 md:max-h-80 overflow-y-auto">
                  {filteredCountries.map((country) => (
                    <button
                      key={country.code}
                      onClick={() => handleCountrySelect(country)}
                      className="w-full px-3 md:px-4 py-2 md:py-3 flex items-center space-x-2 md:space-x-3 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors"
                    >
                      <span className="text-base md:text-lg">{country.flag}</span>
                      <span className="flex-1 text-left">
                        <div className="font-medium text-gray-900 text-sm md:text-base">{country.name}</div>
                        <div className="text-xs md:text-sm text-gray-500">{country.dial_code}</div>
                      </span>
                      {selectedCountry.code === country.code && (
                        <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-[#ff9800] rounded-full"></div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Telefon Numarası Input - Flex-1 ile kalan alanı kaplar */}
          <input
            type="tel"
            value={phoneNumber}
            onChange={handlePhoneChange}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            className="flex-1 min-w-0 px-3 md:px-4 py-3 md:py-4 text-sm md:text-base border border-gray-300 rounded-r-xl focus:outline-none focus:ring-2 focus:ring-[#ff9800] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
      </div>

      {error && (
        <p className="mt-1 text-xs md:text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default PhoneInput;