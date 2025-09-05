// components/SEOHead.tsx - DÜZELTİLMİŞ VERSİYON

import { Helmet } from 'react-helmet-async';
import { useEffect, useState } from 'react';

interface SEOHeadProps {
  type: 'home' | 'apartment' | 'tour' | 'rentals' | 'owners';
  id?: string;
  currentLang: string;
  customData?: any;
}

export const SEOHead = ({ type, id, currentLang, customData }: SEOHeadProps) => {
  const [seoData, setSeoData] = useState<any>(null);
  
  useEffect(() => {
    if (type === 'apartment' && id) {
      fetch(`/api/seo/apartment/${id}?lang=${currentLang}`)
        .then(res => res.json())
        .then(data => setSeoData(data))
        .catch(err => console.error('SEO fetch error:', err));
    } else if (type === 'tour' && id) {
      fetch(`/api/seo/tour/${id}?lang=${currentLang}`)
        .then(res => res.json())
        .then(data => setSeoData(data))
        .catch(err => console.error('SEO fetch error:', err));
    } else if (type === 'home') {
      fetch(`/api/seo/homepage?lang=${currentLang}`)
        .then(res => res.json())
        .then(data => setSeoData(data))
        .catch(err => console.error('SEO fetch error:', err));
    }
  }, [type, id, currentLang]);
  
  // Statik sayfalar için
  const staticSEO = {
    rentals: {
      tr: {
        title: 'Kiralık Daireler ve Turlar | Lagirio Residence',
        description: 'Taksim 360\'ta kiralık lüks daireler ve İstanbul turları. Günlük, haftalık kiralama seçenekleri.',
        keywords: 'kiralık daire, taksim 360, istanbul otel, günlük kiralık, turlar'
      },
      en: {
        title: 'Apartments for Rent and Tours | Lagirio Residence',
        description: 'Luxury apartments for rent in Taksim 360 and Istanbul tours. Daily, weekly rental options.',
        keywords: 'apartments for rent, taksim 360, istanbul hotel, daily rental, tours'
      },
      ar: {
        title: 'شقق للإيجار وجولات | لاجيريو ريزيدنس',
        description: 'شقق فاخرة للإيجار في تقسيم 360 وجولات اسطنبول. خيارات الإيجار اليومي والأسبوعي.',
        keywords: 'شقق للإيجار, تقسيم 360, فندق اسطنبول, إيجار يومي, جولات'
      },
      ru: {
        title: 'Квартиры в аренду и туры | Лагирио Резиденс',
        description: 'Роскошные квартиры в аренду в Таксим 360 и туры по Стамбулу. Варианты посуточной, недельной аренды.',
        keywords: 'аренда квартир, таксим 360, отель стамбул, посуточная аренда, туры'
      }
    },
    owners: {
      tr: {
        title: 'Ev Sahipleri İçin | Lagirio Residence',
        description: 'Ev sahipleri için profesyonel yönetim hizmetleri. Airbnb ve Booking.com yönetimi.',
        keywords: 'ev sahibi, airbnb yönetimi, booking yönetimi, kısa dönem kiralama'
      },
      en: {
        title: 'For Property Owners | Lagirio Residence',
        description: 'Professional management services for property owners. Airbnb and Booking.com management.',
        keywords: 'property owner, airbnb management, booking management, short term rental'
      },
      ar: {
        title: 'لأصحاب العقارات | لاجيريو ريزيدنس',
        description: 'خدمات إدارة احترافية لأصحاب العقارات. إدارة Airbnb و Booking.com.',
        keywords: 'مالك العقار, إدارة airbnb, إدارة booking, تأجير قصير المدى'
      },
      ru: {
        title: 'Для владельцев недвижимости | Лагирио Резиденс',
        description: 'Профессиональные услуги управления для владельцев недвижимости. Управление Airbnb и Booking.com.',
        keywords: 'владелец недвижимости, управление airbnb, управление booking, краткосрочная аренда'
      }
    }
  };
  
  const finalSEO = seoData || customData || (staticSEO as any)[type]?.[currentLang] || {};
  
  return (
    <Helmet>
      {/* HTML lang attribute */}
      <html lang={currentLang} />
      
      {/* Title & Meta */}
      <title>{finalSEO.title || 'Lagirio Residence'}</title>
      <meta name="description" content={finalSEO.description || ''} />
      {finalSEO.keywords && <meta name="keywords" content={finalSEO.keywords} />}
      
      {/* Open Graph */}
      <meta property="og:title" content={finalSEO.title || 'Lagirio Residence'} />
      <meta property="og:description" content={finalSEO.description || ''} />
      <meta property="og:image" content={finalSEO.image || '/og-image.jpg'} />
      <meta property="og:url" content={finalSEO.url || window.location.href} />
      <meta property="og:type" content="website" />
      <meta property="og:locale" content={currentLang === 'tr' ? 'tr_TR' : currentLang === 'en' ? 'en_US' : currentLang === 'ar' ? 'ar_AR' : 'ru_RU'} />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={finalSEO.title || 'Lagirio Residence'} />
      <meta name="twitter:description" content={finalSEO.description || ''} />
      <meta name="twitter:image" content={finalSEO.image || '/og-image.jpg'} />
      
      {/* Alternate languages - DÜZELTİLMİŞ: hrefLang (camelCase) */}
      {finalSEO.alternates && Object.entries(finalSEO.alternates).map(([lang, url]) => (
        <link 
          key={lang} 
          rel="alternate" 
          hrefLang={lang}  // ⚠️ hreflang DEĞİL, hrefLang!
          href={url as string} 
        />
      ))}
      
      {/* Canonical URL */}
      <link rel="canonical" href={finalSEO.url || window.location.href} />
      
      {/* Additional meta tags for better SEO */}
      <meta name="robots" content="index, follow" />
      <meta name="googlebot" content="index, follow" />
      <meta name="author" content="Lagirio Residence" />
      
      {/* Structured Data (JSON-LD) */}
      {type === 'apartment' && finalSEO.price && (
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Accommodation",
            "name": finalSEO.title,
            "description": finalSEO.description,
            "image": finalSEO.image,
            "priceRange": `€${finalSEO.price}`,
            "address": {
              "@type": "PostalAddress",
              "addressLocality": "Beyoğlu",
              "addressRegion": "İstanbul",
              "addressCountry": "TR"
            }
          })}
        </script>
      )}
    </Helmet>
  );
};

export default SEOHead;