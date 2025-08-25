// src/utils/api.ts
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002/api';


// Token'ı localStorage'dan al
const getToken = (): string | null => localStorage.getItem('token');

// API çağrısı için yardımcı fonksiyon
const apiCall = async <T = any>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> => {
  const token = getToken();
  
  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  };

  try {
    const response = await fetch(`${API_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      // Detaylı hata objesi oluştur
      const error: any = new Error(data.message || 'Bir hata oluştu');
      error.response = { data };
      error.errors = data.errors;
      error.type = data.type;
      throw error;
    }

    return data;
  } catch (error: any) {
    // Network hatası
    if (!error.response) {
      error.message = 'Sunucuya bağlanılamadı. İnternet bağlantınızı kontrol edin.';
    }
    throw error;
  }
};

// Auth API'leri
export const authAPI = {
  login: (credentials: { email: string; password: string }) => 
    apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    }),
    
  register: (userData: { name: string; email: string; preferredLanguage?: string; password: string; phone?: string }) => 
    apiCall('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    }),
  
  // YENİ - Email doğrulama
  verifyEmail: (data: { code: string; tempToken: string }) => 
    apiCall('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  
  // YENİ - Doğrulama kodunu yeniden gönder
  resendVerificationCode: (data: { tempToken: string }) => 
    apiCall('/auth/resend-verification-code', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    
  logout: () => 
    apiCall('/auth/logout', {
      method: 'POST'
    }),
    
  getMe: () => 
    apiCall('/auth/me'),
    
  updateProfile: (data: { name?: string; phone?: string }) => 
    apiCall('/auth/update-profile', {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
    
  changePassword: (data: { currentPassword: string; newPassword: string }) => 
    apiCall('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify(data)
    }),  

  updatePhone: (data: { phone: string }) => 
    apiCall('/auth/update-phone', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    
  verifyToken: () => 
    apiCall('/auth/verify-token'),
    
  checkEmail: (email: string) => 
    apiCall('/auth/check-email', {
      method: 'POST',
      body: JSON.stringify({ email })
    }),
  
  // YENİ - Şifre sıfırlama isteği
  // Şifremi unuttum - email gönder
  forgotPassword: (email: string) => 
    apiCall('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    }),
    
  // Şifre sıfırlama - yeni şifre belirle
  resetPassword: (token: string, password: string) => 
    apiCall('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password })
    }),

  deleteAccount: () => 
    apiCall('/auth/delete-account', {
      method: 'DELETE'
    }),
    
  checkDeleteEligibility: () => 
    apiCall('/auth/check-delete-eligibility', {
      method: 'GET'
    }),
};

// Apartment API - GÜNCELLENDİ
export const apartmentAPI = {
  getAll: () => apiCall('/apartments'),
  
  getOne: (id: string) => apiCall(`/apartments/${id}`),

  // YENİ - Featured apartments'ı getir
  getFeatured: () => apiCall('/apartments/featured'),
  
  // GÜNCELLEME: Yaş grupları desteği eklendi
  getAvailable: (params: {
    checkIn: string;
    checkOut: string;
    adults?: number;
    children?: number;
    childrenAges?: {
      above7: number;
      between2And7: number;
      under2: number;
    };
  }) => {
    const queryParams = new URLSearchParams({
      checkIn: params.checkIn,
      checkOut: params.checkOut,
      ...(params.adults && { adults: params.adults.toString() }),
      ...(params.children && { children: params.children.toString() }),
      ...(params.childrenAges && { childrenAges: JSON.stringify(params.childrenAges) })
    });
    
    return apiCall(`/apartments/available?${queryParams}`);
  },
  
  getByCategory: (category: string) => 
    apiCall(`/apartments/category/${category}`),
  
  search: (params: any) => {
    const queryString = new URLSearchParams(params).toString();
    return apiCall(`/apartments/search?${queryString}`);
  },
  
  // YENİ: İzin verilen kombinasyonları getir
  getAllowedCombinations: (id: string) => 
    apiCall(`/apartments/${id}/allowed-combinations`),
  
  // YENİ: Misafir kombinasyonunu kontrol et
  checkOccupancy: (id: string, data: {
    adults: number;
    childrenAbove7: number;
    childrenBetween2And7: number;
    childrenUnder2: number;
  }) => apiCall(`/apartments/${id}/check-occupancy`, {
    method: 'POST',
    body: JSON.stringify(data)
  })
};

// Tour API
export const tourAPI = {
  getAll: () => apiCall('/tours'),
  
  getOne: (id: string) => apiCall(`/tours/${id}`),
  
  getByCategory: (category: string) => 
    apiCall(`/tours/category/${category}`)
};

// Legal API'leri
export const legalAPI = {
  // Tüm aktif yasal belgeleri getir
  getDocuments: (lang: string = 'tr') => 
    apiCall(`/legal/documents?lang=${lang}`),
  
  // Belirli bir belgeyi getir
  getDocument: (type: string, lang: string = 'tr') => 
    apiCall(`/legal/documents/${type}?lang=${lang}`),
  
  // Admin - Belge oluştur/güncelle
  saveDocument: (data: {
    type: string;
    title: any;
    content: any;
    metadata?: any;
  }) => 
    apiCall('/legal/documents', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  
  // Admin - Belge sil
  deleteDocument: (type: string) => 
    apiCall(`/legal/documents/${type}`, {
      method: 'DELETE'
    })
};

// Reservation API - GÜNCELLENDİ
export const reservationAPI = {
  getAll: () => apiCall('/reservations/all'),
  
  getAvailable: (checkIn: string, checkOut: string) => 
    apiCall(`/reservations/available?checkIn=${checkIn}&checkOut=${checkOut}`),
  
  // ⭐ YENİ METOD - BURAYA EKLEYİN
  getByApartmentPublic: (apartmentId: string) => 
    apiCall(`/reservations/public/apartment/${apartmentId}`),
  
  // YENİ - Guest email doğrulama kodu gönder
  sendGuestVerificationCode: (data: { email: string; name: string }) => 
    apiCall('/auth/guest/send-verification', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  
  // YENİ - Guest email doğrulama kodunu kontrol et
  verifyGuestEmail: (data: { code: string; tempToken: string }) => 
    apiCall('/auth/guest/verify', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  
  // YENİ - Guest için doğrulama kodunu yeniden gönder
  resendGuestVerificationCode: (data: { tempToken: string }) => 
    apiCall('/auth/guest/resend', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    
  create: (data: {
    apartmentId?: string;
    tourId?: string;
    checkIn: string;
    checkOut: string;
    adults: number;
    children: number;
    childrenAgeGroups?: {  // GÜNCELLEME: Yaş grupları
      above7: number;
      between2And7: number;
      under2: number;
    };
    totalPrice: number;
    isRefundable?: boolean;      // YENİ EKLE
    refundablePrice?: number;
    message?: string;
    // Giriş yapmamış kullanıcılar için
    guestName?: string;
    guestEmail?: string;
    guestPhone?: string;
    verifiedToken?: string; // YENİ - Guest doğrulama token'ı
  }) => apiCall('/reservations/create', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  
  update: (id: string, data: any) => apiCall(`/reservations/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  
  delete: (id: string) => apiCall(`/reservations/${id}`, {
    method: 'DELETE'
  })
};

// User Reservation API'leri
export const userReservationAPI = {
  getMyReservations: () => 
    apiCall('/reservations/my-reservations'),

  getMyUpcomingReservations: () => 
    apiCall('/reservations/my-upcoming'),

  getMyActiveReservations: () => 
    apiCall('/reservations/my-active'),
    
  getMyReservationHistory: () => 
    apiCall('/reservations/my-history'),
    
  getReservationDetail: (id: string) => 
    apiCall(`/reservations/${id}`),
    
  cancelReservation: (id: string, data?: any) =>
    apiCall(`/reservations/${id}/cancel`, {
      method: 'PUT',
      body: typeof data === 'string' ? data : JSON.stringify(data || { reason: 'Müşteri talebi' })
    }),
    
  getMyStats: () => 
    apiCall('/reservations/my-stats'),


};

// Pricing API - GÜNCELLENDİ
export const pricingAPI = {
  // Tarih aralığı için fiyatları getir
  getDateRange: (apartmentId: string, startDate: string, endDate: string) => 
    apiCall(`/pricing-calendar/range?apartmentId=${apartmentId}&startDate=${startDate}&endDate=${endDate}`),
  
  // Tek bir tarih için fiyat getir
  getSingleDate: (apartmentId: string, date: string) =>
    apiCall(`/pricing-calendar/single?apartmentId=${apartmentId}&date=${date}`),
    
  // Fiyat hesaplama - GÜNCELLEME: Yaş grupları desteği
  calculatePrice: (data: {
    apartmentId: string;
    checkIn: string;
    checkOut: string;
    adults: number;
    children: number;
    childrenAgeGroups?: {  // YENİ
      above7: number;
      between2And7: number;
      under2: number;
    };
    isRefundable?: boolean;
  }) => apiCall('/pricing-calendar/calculate-price', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  
  // Minimum kalış kontrolü
  checkMinStay: (data: {
    apartmentId: string;
    checkIn: string;
    nights: number;
  }) => apiCall('/pricing-calendar/check-min-stay', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  
  // Toplu güncelleme
  bulkUpdate: (data: {
    apartmentId: string;
    dates: string[];
    updates: {
      price?: number;
      discount?: { percentage: number; reason: string };
      minStay?: number;
      adultPriceIncrease?: number;
      refundableRateIncrease?: number;
    }
  }) => apiCall('/pricing-calendar/bulk-update', {
    method: 'PUT',
    body: JSON.stringify(data)
  })
};

// Favorites API'leri
export const favoritesAPI = {
  // Favorileri getir
  getFavoriteApartments: () => 
    apiCall('/favorites/apartments'),
    
  getFavoriteTours: () => 
    apiCall('/favorites/tours'),
    
  getAllFavorites: () => 
    apiCall('/favorites/all'),
    
  // Toggle (ekle/çıkar)
  toggleApartmentFavorite: (id: string) => 
    apiCall(`/favorites/apartments/${id}/toggle`, {
      method: 'POST'
    }),
    
  toggleTourFavorite: (id: string) => 
    apiCall(`/favorites/tours/${id}/toggle`, {
      method: 'POST'
    }),
    
  // Kontrol
  checkFavorite: (type: 'apartment' | 'tour', id: string) => 
    apiCall(`/favorites/check/${type}/${id}`),
    
  checkMultipleFavorites: (data: { apartments?: string[]; tours?: string[] }) => 
    apiCall('/favorites/check-multiple', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    
  // Temizle
  clearAllFavorites: () => 
    apiCall('/favorites/clear-all', {
      method: 'DELETE'
    }),
    
  // İstatistikler
  getFavoriteStats: () => 
    apiCall('/favorites/stats')
};

// Site Image API'leri
export const siteImageAPI = {
  getAll: () => apiCall('/upload/site-images')
};

// Error handler helper
export const handleApiError = (error: any): string => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  
  if (error.message) {
    return error.message;
  }
  
  return 'Bir hata oluştu. Lütfen tekrar deneyin.';
};