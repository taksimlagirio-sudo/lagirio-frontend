// utils/seoSchemaManager.ts

interface Apartment {
  _id?: string;
  id?: string;
  title?: string;
  description?: string;
  translations?: {
    [key: string]: {
      title: string;
      description: string;
    };
  };
  slugs?: {
    [key: string]: string;
  };
  images?: any[];
  basePrice?: number;
  price?: number;
  bedrooms?: number;
  rooms?: number;
  bathrooms?: number;
  size?: number;
  area?: number;
  maxCapacity?: number;
  capacity?: number;
  amenities?: string[];
  neighborhood?: string;
  district?: string;
  city?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  checkInTime?: string;
  checkOutTime?: string;
  rules?: string[];
  safetyFeatures?: string[];
}

export class SEOSchemaManager {
  private static schemas: Map<string, HTMLScriptElement> = new Map();
  private static readonly BASE_URL = 'https://lagirio.com';
  
  /**
   * Ana method - Tüm apartment schema'larını enjekte eder
   */
  static injectApartmentSchema(apartment: Apartment, currentLang: string): void {
    if (!apartment) return;
    
    console.log('[SEOSchemaManager] Injecting schemas for:', apartment.title);
    
    const schemas = [
      {
        id: 'apartment-lodging-schema',
        data: this.buildLodgingSchema(apartment, currentLang)
      },
      {
        id: 'apartment-product-schema',
        data: this.buildProductSchema(apartment, currentLang)
      },
      {
        id: 'apartment-breadcrumb-schema',
        data: this.buildBreadcrumbSchema(apartment, currentLang)
      },
      {
        id: 'apartment-faq-schema',
        data: this.buildFAQSchema(apartment, currentLang)
      }
    ];
    
    schemas.forEach(({ id, data }) => {
      if (data) {
        this.injectSchema(id, data);
      }
    });
  }
  
  /**
   * Tüm schema'ları temizler
   */
  static removeAllSchemas(): void {
    console.log('[SEOSchemaManager] Removing all schemas');
    
    // forEach yerine for...of kullan
    for (const script of this.schemas.values()) {
        if (script && script.parentNode) {
        script.parentNode.removeChild(script);
        }
    }
    this.schemas.clear();
    }
  
  /**
   * Tek bir schema'yı DOM'a enjekte eder
   */
  private static injectSchema(id: string, data: object): void {
    // Eski schema'yı kaldır
    this.removeSchema(id);
    
    // Yeni schema oluştur
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = id;
    script.textContent = JSON.stringify(data, null, 2);
    
    // DOM'a ekle
    document.head.appendChild(script);
    
    // Map'e kaydet
    this.schemas.set(id, script);
    
    console.log(`[SEOSchemaManager] Injected schema: ${id}`);
  }
  
  /**
   * Belirli bir schema'yı kaldırır
   */
  private static removeSchema(id: string): void {
    const existing = document.getElementById(id);
    if (existing && existing.parentNode) {
      existing.parentNode.removeChild(existing);
    }
    this.schemas.delete(id);
  }
  
  /**
   * URL builder helper
   */
  private static buildUrl(apartment: Apartment, lang: string): string {
    const langPrefix = lang === 'tr' ? '' : `/${lang}`;
    const slug = apartment.slugs?.[lang] || apartment.slugs?.tr || apartment.id;
    return `${this.BASE_URL}${langPrefix}/apartment/${slug}`;
  }
  
  /**
   * LodgingBusiness Schema - Konaklama işletmesi
   */
  private static buildLodgingSchema(apartment: Apartment, lang: string): object {
    const url = this.buildUrl(apartment, lang);
    const title = apartment.translations?.[lang]?.title || apartment.title || '';
    const description = apartment.translations?.[lang]?.description || apartment.description || '';
    const price = apartment.basePrice || apartment.price || 100;
    
    return {
      "@context": "https://schema.org",
      "@type": "LodgingBusiness",
      "@id": url,
      "name": title,
      "description": description,
      "url": url,
      
      // Görseller - Tüm görselleri ekle
      "image": apartment.images?.map((img: any, index: number) => {
        const imageUrl = img.url || img;
        return {
          "@type": "ImageObject",
          "url": imageUrl,
          "contentUrl": imageUrl,
          "caption": `${title} - ${img.roomType || `Fotoğraf ${index + 1}`}`,
          "name": title,
          "width": "1920",
          "height": "1080"
        };
      }) || [],
      
      // Ana fotoğraf
      "photo": apartment.images?.[0]?.url || apartment.images?.[0] || '',
      
      // Fiyat aralığı
      "priceRange": `€${price} - €${Math.round(price * 1.5)} per night`,
      "currenciesAccepted": "EUR, USD, TRY",
      "paymentAccepted": "Cash, Credit Card, Bank Transfer, PayPal",
      
      // Adres bilgileri
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Şehit Muhtar, Tarlabası Bulvarı No:116",
        "addressLocality": apartment.neighborhood || "Beyoğlu",
        "addressRegion": apartment.district || "İstanbul",
        "addressCountry": "TR",
        "postalCode": "34435"
      },
      
      // Coğrafi konum
      "geo": apartment.coordinates ? {
        "@type": "GeoCoordinates",
        "latitude": apartment.coordinates.lat,
        "longitude": apartment.coordinates.lng
      } : {
        "@type": "GeoCoordinates",
        "latitude": 41.0369,
        "longitude": 28.9850
      },
      
      // İletişim
      "telephone": "+905355117018",
      "email": "info@lagirio.com",
      
      // Check-in/out saatleri
      "checkinTime": apartment.checkInTime || "14:00",
      "checkoutTime": apartment.checkOutTime || "11:00",
      
      // Diller
      "availableLanguage": [
        {"@type": "Language", "name": "Turkish"},
        {"@type": "Language", "name": "English"},
        {"@type": "Language", "name": "Arabic"},
        {"@type": "Language", "name": "Russian"}
      ],
      
      // Oda detayları
      "numberOfRooms": apartment.bedrooms || apartment.rooms || 1,
      "numberOfBathroomsTotal": apartment.bathrooms || 1,
      "floorSize": {
        "@type": "QuantitativeValue",
        "value": apartment.size || apartment.area || 50,
        "unitCode": "MTK"
      },
      "occupancy": {
        "@type": "QuantitativeValue",
        "minValue": 1,
        "maxValue": apartment.maxCapacity || apartment.capacity || 4
      },
      
      // Olanaklar
      "amenityFeature": apartment.amenities?.map((amenity: string) => ({
        "@type": "LocationFeatureSpecification",
        "name": amenity,
        "value": true
      })) || [],
      
      // Açık olduğu saatler (24/7)
      "openingHours": "Mo,Tu,We,Th,Fr,Sa,Su 00:00-24:00"
    };
  }
  
  /**
   * Product Schema - Ürün/Hizmet
   */
  private static buildProductSchema(apartment: Apartment, lang: string): object {
    const url = this.buildUrl(apartment, lang);
    const title = apartment.translations?.[lang]?.title || apartment.title || '';
    const description = apartment.translations?.[lang]?.description || apartment.description || '';
    const price = apartment.basePrice || apartment.price || 100;
    
    return {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": title,
      "description": description,
      "url": url,
      "image": apartment.images?.map(img => img.url || img) || [],
      
      // Marka
      "brand": {
        "@type": "Organization",
        "name": "Lagirio Residence"
      },
      
      // SKU/ID
      "sku": apartment._id || apartment.id || '',
      "mpn": apartment._id || apartment.id || '',
      
      // Fiyat teklifi
      "offers": {
        "@type": "AggregateOffer",
        "url": url,
        "priceCurrency": "EUR",
        "lowPrice": price,
        "highPrice": Math.round(price * 1.5),
        "offerCount": "30", // Ayda ortalama müsait gün sayısı
        "availability": "https://schema.org/InStock",
        "validFrom": new Date().toISOString(),
        "validThrough": new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        
        // Satıcı bilgileri
        "seller": {
          "@type": "Organization",
          "name": "Lagirio Residence",
          "url": this.BASE_URL
        },
        
        // Fiyat spesifikasyonu
        "priceSpecification": [
          {
            "@type": "UnitPriceSpecification",
            "price": price,
            "priceCurrency": "EUR",
            "unitCode": "DAY",
            "unitText": "gece / night"
          }
        ]
      },
      
      // Kategori
      "category": "Vacation Rentals > Apartments",
      
      // Özellikler
      "additionalProperty": [
        {
          "@type": "PropertyValue",
          "name": "Yatak Odası",
          "value": apartment.bedrooms || apartment.rooms || 1
        },
        {
          "@type": "PropertyValue",
          "name": "Banyo",
          "value": apartment.bathrooms || 1
        },
        {
          "@type": "PropertyValue",
          "name": "Alan",
          "value": `${apartment.size || apartment.area || 50} m²`
        },
        {
          "@type": "PropertyValue",
          "name": "Kapasite",
          "value": `${apartment.maxCapacity || apartment.capacity || 4} kişi`
        }
      ]
    };
  }
  
  /**
   * BreadcrumbList Schema - Sayfa yolu
   */
  private static buildBreadcrumbSchema(apartment: Apartment, lang: string): object {
    const url = this.buildUrl(apartment, lang);
    const langPrefix = lang === 'tr' ? '' : `/${lang}`;
    const title = apartment.translations?.[lang]?.title || apartment.title || '';
    
    // Dil bazlı breadcrumb metinleri
    const texts = {
      tr: { home: 'Ana Sayfa', rentals: 'Kiralık Daireler' },
      en: { home: 'Home', rentals: 'Apartments' },
      ar: { home: 'الصفحة الرئيسية', rentals: 'شقق للإيجار' },
      ru: { home: 'Главная', rentals: 'Квартиры' }
    };
    
    const t = texts[lang as keyof typeof texts] || texts.tr;
    
    return {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": t.home,
          "item": this.BASE_URL + langPrefix
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": t.rentals,
          "item": `${this.BASE_URL}${langPrefix}/rentals`
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": title,
          "item": url
        }
      ]
    };
  }
  
  /**
   * FAQPage Schema - Sıkça sorulan sorular
   */
  private static buildFAQSchema(apartment: Apartment, lang: string): object {
    const checkIn = apartment.checkInTime || "14:00";
    const checkOut = apartment.checkOutTime || "11:00";
    const capacity = apartment.maxCapacity || apartment.capacity || 4;
    
    // Dil bazlı FAQ'lar
    const faqs = {
      tr: [
        {
          q: "Check-in ve check-out saatleri nedir?",
          a: `Check-in saati ${checkIn} sonrası, check-out saati ise ${checkOut} öncesidir.`
        },
        {
          q: "Daire kaç kişi konaklayabilir?",
          a: `Dairemiz maksimum ${capacity} kişi konaklayabilir.`
        },
        {
          q: "Evcil hayvan kabul ediyor musunuz?",
          a: "Maalesef evcil hayvan kabul etmiyoruz."
        },
        {
          q: "İptal politikanız nedir?",
          a: "48 saat öncesine kadar ücretsiz iptal imkanı sunuyoruz."
        }
      ],
      en: [
        {
          q: "What are the check-in and check-out times?",
          a: `Check-in is after ${checkIn}, check-out is before ${checkOut}.`
        },
        {
          q: "How many guests can stay?",
          a: `The apartment can accommodate up to ${capacity} guests.`
        },
        {
          q: "Do you accept pets?",
          a: "Unfortunately, we do not accept pets."
        },
        {
          q: "What is your cancellation policy?",
          a: "We offer free cancellation up to 48 hours before arrival."
        }
      ]
    };
    
    const currentFaqs = faqs[lang as keyof typeof faqs] || faqs.tr;
    
    return {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": currentFaqs.map(faq => ({
        "@type": "Question",
        "name": faq.q,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.a
        }
      }))
    };
  }
}