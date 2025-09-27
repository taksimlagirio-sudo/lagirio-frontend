// components/SEOHead.tsx

import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
  type: 'home' | 'apartment' | 'tour' | 'rentals' | 'owners';
  id?: string;
  currentLang: string;
  customData?: {
    title?: string;
    description?: string;
    keywords?: string;
    image?: string;
    images?: any[];
    url?: string;
    price?: number;
    minPrice?: number;
    maxPrice?: number;
    pricePerNight?: number;
    bedrooms?: number;
    bathrooms?: number;
    size?: number;
    maxCapacity?: number;
    amenities?: string[];
    coordinates?: { lat: number; lng: number };
    neighborhood?: string;
    district?: string;
    city?: string;
    checkInTime?: string;
    checkOutTime?: string;
    availability?: {
      checkIn: string;
      checkOut: string;
      nights: number;
      available: boolean;
    };
    hasDiscount?: boolean;
    originalPrice?: number;
    discountAmount?: number;
  };
}

const SEOHead = ({ type, id, currentLang, customData }: SEOHeadProps) => {
  console.log('📘 SEOHead Props:', {
    type,
    id,
    currentLang,
    hasCustomData: !!customData,
    customDataKeys: customData ? Object.keys(customData) : []
  });
  // Base URL
  const baseURL = 'https://lagirio.com';
  const langPrefix = currentLang === 'tr' ? '' : `/${currentLang}`;
  
  // Static SEO data for different page types
  const staticSEO = {
    home: {
      tr: {
        title: 'Lagirio Residence | Taksim 360 Kiralık Daireler & İstanbul Turları',
        description: 'Taksim 360\'ta lüks kiralık daireler ve profesyonel İstanbul turları. Günlük ve haftalık kiralama seçenekleri. En iyi fiyat garantisi.',
        keywords: 'lagirio residence, taksim 360, kiralık daire, istanbul otel, günlük kiralık, beyoğlu otel'
      },
      en: {
        title: 'Lagirio Residence | Taksim 360 Apartments & Istanbul Tours',
        description: 'Luxury apartments in Taksim 360 and professional Istanbul tours. Daily and weekly rental options. Best price guarantee.',
        keywords: 'lagirio residence, taksim 360, apartment rental, istanbul hotel, daily rental, beyoglu hotel'
      },
      ar: {
        title: 'لاجيريو ريزيدنس | شقق تقسيم 360 وجولات اسطنبول',
        description: 'شقق فاخرة في تقسيم 360 وجولات اسطنبول الاحترافية. خيارات الإيجار اليومي والأسبوعي. ضمان أفضل سعر.',
        keywords: 'لاجيريو ريزيدنس, تقسيم 360, تأجير الشقق, فندق اسطنبول, إيجار يومي, فندق بيوغلو'
      },
      ru: {
        title: 'Лагирио Резиденс | Апартаменты Таксим 360 и туры по Стамбулу',
        description: 'Роскошные апартаменты в Таксим 360 и профессиональные туры по Стамбулу. Варианты посуточной и недельной аренды. Гарантия лучшей цены.',
        keywords: 'лагирио резиденс, таксим 360, аренда квартир, отель стамбул, посуточная аренда, отель бейоглу'
      }
    },
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
  
  // Get static SEO or use custom data
  const baseSEO = (staticSEO as any)[type]?.[currentLang] || {};
  const seo = {
    ...baseSEO,
    ...customData
  };
  
  // Generate alternate URLs
  const alternates = ['tr', 'en', 'ar', 'ru'].reduce((acc, lang) => {
    const prefix = lang === 'tr' ? '' : `/${lang}`;
    let path = '';
    
    if (type === 'apartment' && customData?.url) {
      const slug = customData.url.split('/').pop();
      path = `/apartment/${slug}`;
    } else if (type === 'tour' && id) {
      path = `/tour/${id}`;
    } else if (type === 'rentals') {
      path = '/rentals';
    } else if (type === 'owners') {
      path = '/owners';
    }
    
    acc[lang] = `${baseURL}${prefix}${path}`;
    return acc;
  }, {} as Record<string, string>);
  
  return (
    <Helmet>
      {/* HTML lang attribute */}
      <html lang={currentLang} />
      
      {/* Title & Meta */}
      <title>{seo.title || 'Lagirio Residence'}</title>
      <meta name="description" content={seo.description || ''} />
      {seo.keywords && <meta name="keywords" content={seo.keywords} />}
      
      {/* Viewport meta */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      
      {/* Open Graph */}
      <meta property="og:title" content={seo.title || 'Lagirio Residence'} />
      <meta property="og:description" content={seo.description || ''} />
      <meta property="og:image" content={seo.image || `${baseURL}/og-image.jpg`} />
      <meta property="og:url" content={seo.url || `${baseURL}${langPrefix}`} />
      <meta property="og:type" content={type === 'apartment' || type === 'tour' ? 'product' : 'website'} />
      <meta property="og:locale" content={currentLang === 'tr' ? 'tr_TR' : currentLang === 'en' ? 'en_US' : currentLang === 'ar' ? 'ar_AR' : 'ru_RU'} />
      <meta property="og:site_name" content="Lagirio Residence" />
      
      {/* Product specific Open Graph for apartments */}
      {type === 'apartment' && seo.price && (
        <>
          <meta property="product:price:amount" content={seo.price.toString()} />
          <meta property="product:price:currency" content="EUR" />
          {seo.availability?.available && (
            <meta property="product:availability" content="in stock" />
          )}
        </>
      )}
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={seo.title || 'Lagirio Residence'} />
      <meta name="twitter:description" content={seo.description || ''} />
      <meta name="twitter:image" content={seo.image || `${baseURL}/og-image.jpg`} />
      <meta name="twitter:site" content="@lagirio" />
      
      {/* Alternate languages */}
      {Object.entries(alternates).map(([lang, url]) => (
        <link 
          key={lang} 
          rel="alternate" 
          hrefLang={lang}
          href={url} 
        />
      ))}
      
      {/* Canonical URL */}
      <link rel="canonical" href={seo.url || `${baseURL}${langPrefix}`} />
      
      {/* Additional meta tags */}
      <meta name="robots" content="index, follow, max-image-preview:large" />
      <meta name="googlebot" content="index, follow" />
      <meta name="author" content="Lagirio Residence" />
      <meta name="publisher" content="Lagirio Residence" />
      <meta name="copyright" content="Lagirio Residence" />
      
      {/* Geo tags */}
      <meta name="geo.region" content="TR-34" />
      <meta name="geo.placename" content="Istanbul" />
      <meta name="geo.position" content="41.0369;28.9850" />
      <meta name="ICBM" content="41.0369, 28.9850" />
      
      {/* APARTMENT STRUCTURED DATA */}
      {(() => {
        const shouldRenderSchema = type === 'apartment' && customData;
        console.log('📙 Schema Check:', {
          type,
          customData: !!customData,
          shouldRender: shouldRenderSchema
        });
        
        if (!shouldRenderSchema) {
          console.log('❌ Schema NOT rendering because:', {
            typeNotApartment: type !== 'apartment',
            noCustomData: !customData
          });
          return null;
        }
        
        console.log('✅ Rendering Apartment Schemas!');
        return (
          <>
            {/* 1. LodgingBusiness Schema */}
            <script type="application/ld+json">
              {JSON.stringify({
                "@context": "https://schema.org",
                "@type": "LodgingBusiness",
                "@id": customData.url,
                "name": customData.title,
                "description": customData.description,
                "url": customData.url,
                
                // All images
                "image": customData.images?.map((img: any, index: number) => ({
                  "@type": "ImageObject",
                  "url": img.url || img,
                  "caption": `${customData.title} - Photo ${index + 1}`,
                  "name": customData.title,
                  "width": "1920",
                  "height": "1080"
                })) || [customData.image],
                
                // Pricing
                "priceRange": `€${customData.minPrice || customData.price}-€${customData.maxPrice || Math.round((customData.price || 100) * 1.5)}`,
                "currenciesAccepted": "EUR,USD,TRY",
                "paymentAccepted": "Cash, Credit Card, Bank Transfer",
                
                // Location
                "address": {
                  "@type": "PostalAddress",
                  "streetAddress": "Tarlabası Bulvarı No:116",
                  "addressLocality": customData.neighborhood || "Beyoğlu",
                  "addressRegion": customData.district || "İstanbul",
                  "postalCode": "34435",
                  "addressCountry": "TR"
                },
                "geo": customData.coordinates ? {
                  "@type": "GeoCoordinates",
                  "latitude": customData.coordinates.lat,
                  "longitude": customData.coordinates.lng
                } : {
                  "@type": "GeoCoordinates",
                  "latitude": 41.0369,
                  "longitude": 28.9850
                },
                
                // Contact
                "telephone": "+905355117018",
                "email": "info@lagirio.com",
                
                // Check-in/out
                "checkinTime": customData.checkInTime || "14:00",
                "checkoutTime": customData.checkOutTime || "11:00",
                
                // Languages
                "availableLanguage": ["Turkish", "English", "Arabic", "Russian"],
                
                // Amenities
                "amenityFeature": customData.amenities?.map((amenity: string) => ({
                  "@type": "LocationFeatureSpecification",
                  "name": amenity,
                  "value": true
                })),
                
                // Room details
                "numberOfRooms": customData.bedrooms || 1,
                "numberOfBathroomsTotal": customData.bathrooms || 1,
                "floorSize": {
                  "@type": "QuantitativeValue",
                  "value": customData.size || 50,
                  "unitCode": "MTK" // Square meters
                },
                "occupancy": {
                  "@type": "QuantitativeValue",
                  "minValue": 1,
                  "maxValue": customData.maxCapacity || 4
                }
              })}
            </script>
            
            {/* 2. Product Schema (for reservations) */}
            <script type="application/ld+json">
              {JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Product",
                "name": customData.title,
                "description": customData.description,
                "image": customData.images?.[0]?.url || customData.image,
                "brand": {
                  "@type": "Organization",
                  "name": "Lagirio Residence"
                },
                "offers": {
                  "@type": "AggregateOffer",
                  "priceCurrency": "EUR",
                  "lowPrice": customData.minPrice || customData.price,
                  "highPrice": customData.maxPrice || Math.round((customData.price || 100) * 1.5),
                  "offerCount": "10",
                  "availability": customData.availability?.available ? 
                    "https://schema.org/InStock" : 
                    "https://schema.org/LimitedAvailability",
                  "validFrom": new Date().toISOString(),
                  "validThrough": new Date(Date.now() + 365*24*60*60*1000).toISOString(),
                  "priceValidUntil": new Date(Date.now() + 30*24*60*60*1000).toISOString(),
                  "seller": {
                    "@type": "Organization",
                    "name": "Lagirio Residence",
                    "url": baseURL,
                    "telephone": "+905355117018",
                    "email": "info@lagirio.com"
                  },
                  ...(customData.hasDiscount && {
                    "discount": {
                      "@type": "Offer",
                      "price": customData.price,
                      "priceCurrency": "EUR",
                      "discountCode": "SPECIAL",
                      "discountValue": customData.discountAmount
                    }
                  })
                },
                "review": [{
                  "@type": "Review",
                  "reviewRating": {
                    "@type": "Rating",
                    "ratingValue": "5",
                    "bestRating": "5"
                  },
                  "author": {
                    "@type": "Person",
                    "name": "Ahmet Y."
                  },
                  "datePublished": "2024-10-15",
                  "reviewBody": "Harika konum ve temiz daire. Kesinlikle tavsiye ederim."
                }]
              })}
            </script>
            
            {/* 3. BreadcrumbList */}
            <script type="application/ld+json">
              {JSON.stringify({
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                "itemListElement": [
                  {
                    "@type": "ListItem",
                    "position": 1,
                    "name": "Ana Sayfa",
                    "item": baseURL
                  },
                  {
                    "@type": "ListItem", 
                    "position": 2,
                    "name": "Kiralık Daireler",
                    "item": `${baseURL}${langPrefix}/rentals`
                  },
                  {
                    "@type": "ListItem",
                    "position": 3,
                    "name": customData.title,
                    "item": customData.url
                  }
                ]
              })}
            </script>
            
            {/* 4. FAQPage Schema */}
            <script type="application/ld+json">
              {JSON.stringify({
                "@context": "https://schema.org",
                "@type": "FAQPage",
                "mainEntity": [
                  {
                    "@type": "Question",
                    "name": "Check-in ve check-out saatleri nedir?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": `Check-in: ${customData.checkInTime || '14:00'} sonrası, Check-out: ${customData.checkOutTime || '11:00'} öncesi`
                    }
                  },
                  {
                    "@type": "Question",
                    "name": "Daire kaç kişi konaklayabilir?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": `Dairemiz maksimum ${customData.maxCapacity || 4} kişi konaklayabilir.`
                    }
                  },
                  {
                    "@type": "Question",
                    "name": "Evcil hayvan kabul ediyor musunuz?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "Maalesef evcil hayvan kabul etmiyoruz."
                    }
                  }
                ]
              })}
            </script>
          </>
        );
      })()}
      
      {/* TOUR STRUCTURED DATA */}
      {type === 'tour' && customData && (
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "TouristTrip",
            "name": customData.title,
            "description": customData.description,
            "image": customData.image,
            "offers": {
              "@type": "Offer",
              "price": customData.price,
              "priceCurrency": "EUR",
              "availability": "https://schema.org/InStock",
              "validFrom": new Date().toISOString()
            },
            "provider": {
              "@type": "Organization",
              "name": "Lagirio Residence",
              "url": baseURL
            }
          })}
        </script>
      )}
      
      {/* ORGANIZATION SCHEMA - for all pages */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "Lagirio Residence",
          "url": baseURL,
          "logo": `${baseURL}/logo.png`,
          "description": "Taksim 360'ta lüks kiralık daireler ve profesyonel İstanbul turları",
          "address": {
            "@type": "PostalAddress",
            "streetAddress": "Tarlabası Bulvarı No:116",
            "addressLocality": "Beyoğlu",
            "addressRegion": "İstanbul",
            "postalCode": "34435",
            "addressCountry": "TR"
          },
          "contactPoint": {
            "@type": "ContactPoint",
            "telephone": "+905355117018",
            "contactType": "reservations",
            "availableLanguage": ["Turkish", "English", "Arabic", "Russian"]
          },
          "sameAs": [
            "https://www.facebook.com/lagirio",
            "https://www.instagram.com/lagirio",
            "https://www.twitter.com/lagirio"
          ]
        })}
      </script>
    </Helmet>
  );
};

export default SEOHead;