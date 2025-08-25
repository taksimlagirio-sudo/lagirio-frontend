// src/components/Footer.tsx

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Mail, Phone, MapPin, ChevronDown } from 'lucide-react';

interface FooterProps {
  currentLang: string;
  translations: any;
}

const Footer: React.FC<FooterProps> = ({ currentLang, translations }) => {
  const t = translations[currentLang];
  const [openSections, setOpenSections] = useState<{ legal: boolean; contact: boolean }>({
    legal: false,
    contact: false
  });
  
  const toggleSection = (section: 'legal' | 'contact') => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  
  const legalLinks = [
    { type: 'kvkk', label: t.kvkk || 'KVKK Aydınlatma Metni' },
    { type: 'privacy-policy', label: t.privacyPolicy || 'Gizlilik Politikası' },
    { type: 'terms-conditions', label: t.termsAndConditions || 'Kullanım Koşulları' },
    { type: 'cookie-policy', label: t.cookiePolicy || 'Çerez Politikası' },
    { type: 'distance-sales-contract', label: t.distanceSalesContract || 'Mesafeli Satış Sözleşmesi' }
  ];
  
  return (
    <footer className="bg-[#0a2e23] text-white pt-12 pb-6">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          
          {/* Şirket Bilgileri - Mobilde her zaman açık */}
          <div>
            <h3 className="text-3xl font-bold mb-4 text-[#ff9800]">lagirio.</h3>
            <p className="text-gray-300 text-sm mb-4">
              {t.footerDescription}
            </p>
            {/* Şirket Ünvanı */}
            <p className="text-gray-400 text-xs mb-2">
              Turuncu Konaklama Turizm Organizasyon ve Ticari Ltd. Şti.
            </p>
            <a 
              href="https://www.instagram.com/lagirio.residence/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-gray-300 hover:text-[#ff9800] transition-colors"
            >
              <Instagram size={20} />
              <span className="text-sm">@lagirio.residence</span>
            </a>
          </div>
          
          {/* Yasal - Mobilde Accordion */}
          <div>
            {/* Desktop başlık */}
            <h4 className="hidden md:block font-semibold mb-4 text-white">{t.legal}</h4>
            
            {/* Mobile accordion başlık */}
            <button
              onClick={() => toggleSection('legal')}
              className="md:hidden w-full flex items-center justify-between font-semibold mb-4 text-white"
            >
              <span>{t.legal}</span>
              <ChevronDown 
                size={20} 
                className={`transition-transform duration-200 ${openSections.legal ? 'rotate-180' : ''}`}
              />
            </button>
            
            {/* İçerik - Mobilde conditional, desktop'ta her zaman göster */}
            <div className={`${!openSections.legal ? 'hidden md:block' : ''}`}>
              <ul className="space-y-2 text-gray-300 text-sm">
                {legalLinks.map(link => (
                  <li key={link.type}>
                    <Link 
                      to={`/legal/${link.type}`} 
                      className="hover:text-[#ff9800] transition-colors block py-1 md:py-0"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          {/* İletişim - Mobilde Accordion */}
          <div>
            {/* Desktop başlık */}
            <h4 className="hidden md:block font-semibold mb-4 text-white">{t.contact}</h4>
            
            {/* Mobile accordion başlık */}
            <button
              onClick={() => toggleSection('contact')}
              className="md:hidden w-full flex items-center justify-between font-semibold mb-4 text-white"
            >
              <span>{t.contact}</span>
              <ChevronDown 
                size={20} 
                className={`transition-transform duration-200 ${openSections.contact ? 'rotate-180' : ''}`}
              />
            </button>
            
            {/* İçerik - Mobilde conditional, desktop'ta her zaman göster */}
            <div className={`${!openSections.contact ? 'hidden md:block' : ''}`}>
              <div className="space-y-3 text-gray-300 text-sm">
                <a 
                  href="tel:+905355117018" 
                  className="flex items-center hover:text-[#ff9800] transition-colors"
                >
                  <Phone size={16} className="mr-2" />
                  <span>+90 535 511 70 18</span>
                </a>
                <a 
                  href="mailto:info@lagirio.com" 
                  className="flex items-center hover:text-[#ff9800] transition-colors"
                >
                  <Mail size={16} className="mr-2" />
                  <span>info@lagirio.com</span>
                </a>
                <div className="flex items-start">
                  <MapPin size={16} className="mr-2 mt-1 flex-shrink-0" />
                  <span>
                    Şehit Muhtar Mah. Tarlabaşı Blv. 116-120C
                    <br />
                    Beyoğlu, İstanbul
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Alt Bar */}
        <div className="border-t border-gray-700 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm text-center md:text-left">
              © 2024 Lagirio. {t.allRightsReserved}
            </p>
            <div className="flex items-center space-x-6 mt-4 md:mt-0">
              <span className="text-gray-400 text-xs">
                {t.sslProtected}
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;