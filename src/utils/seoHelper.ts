// utils/seoUtils.ts - DÜZELTİLMİŞ

interface SEOData {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  ogType?: string;
  canonical?: string;
}

export const updateMetaTags = (data: SEOData): void => {
  // Title
  if (data.title) {
    document.title = data.title;
    updateMetaProperty('og:title', data.title);
  }

  // Description
  if (data.description) {
    updateMetaTag('description', data.description);
    updateMetaProperty('og:description', data.description);
  }

  // Keywords
  if (data.keywords) {
    updateMetaTag('keywords', data.keywords);
  }

  // OG Image
  if (data.ogImage) {
    updateMetaProperty('og:image', data.ogImage);
  }

  // OG Type
  if (data.ogType) {
    updateMetaProperty('og:type', data.ogType);
  }

  // Canonical
  if (data.canonical) {
    let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    link.href = data.canonical;
  }
};

const updateMetaTag = (name: string, content: string): void => {
  // TİP AÇIKÇA BELİRTİLDİ
  let meta: HTMLMetaElement | null = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = name;
    document.head.appendChild(meta);
  }
  meta.content = content;
};

const updateMetaProperty = (property: string, content: string): void => {
  // TİP AÇIKÇA BELİRTİLDİ
  let meta: HTMLMetaElement | null = document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
  
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('property', property);
    document.head.appendChild(meta);
  }
  meta.content = content;
};

// Custom Hook
export const useSEO = () => {
  return { updateMetaTags };
};