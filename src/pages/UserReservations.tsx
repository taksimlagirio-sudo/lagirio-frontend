import React, { useState, useEffect } from 'react';
import { 
  Calendar, MapPin, Users, Clock, CheckCircle, XCircle, 
  AlertCircle, ChevronRight, Search,
  Home, Plane, Euro, Phone, MessageCircle, X,
  Building, Shield, Info,
  RefreshCw,
} from 'lucide-react';
import Header from '../components/common/Header';
import { userReservationAPI } from '../utils/api';
import Toast from '../components/common/Toast';

interface UserReservationsProps {
  currentLang: string;
  setCurrentLang: (lang: string) => void;
  translations: any;
  setShowLoginModal: (show: boolean) => void;
  setCurrentView: (view: string) => void;
}

interface Reservation {
  _id: string;
  reservationNumber: string;
  apartment?: {
    _id: string;
    title: string;
    internalCode: string;
    images: any[];
    city?: string;
    district?: string;
  };
  tour?: {
    _id: string;
    title: string;
    images: any[];
    category?: string;
  };
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  childrenAgeGroups?: {
    above7: number;
    between2And7: number;
    under2: number;
  };
  totalPrice: number;
  isRefundable?: boolean;
  refundablePrice?: number;
  canBeCancelled?: boolean;
  daysUntilCheckIn?: number;
  paymentStatus?: 'pending' | 'partial' | 'paid' | 'refunded' | 'partially_refunded';
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  message?: string;
  createdAt: string;
  nights?: number;
  totalGuests?: number;
  guestDetails?: {
    adults: number;
    childrenAbove7: number;
    childrenBetween2And7: number;
    childrenUnder2: number;
    total: number;
  };
  statusDetails?: {
    current: string;
  };
  payment?: {
    summary?: {
      totalPaid: number;
      totalRefunded: number;
    };
    pricing?: {
      refundableFee: number;
    };
  };
  cancellation?: {
    cancelledBy: 'customer' | 'admin';
  };
  refundAmount?: number;
}

const UserReservations: React.FC<UserReservationsProps> = ({
  currentLang,
  setCurrentLang,
  translations,
  setShowLoginModal,
  setCurrentView
}) => {
  const t = translations[currentLang];
  
  // States
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<any[]>([]);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [reservationToCancel, setReservationToCancel] = useState<Reservation | null>(null);

  // Load reservations
  useEffect(() => {
    loadReservations();
  }, [activeTab]);

  const loadReservations = async () => {
    setLoading(true);
    try {
      let data;
      if (activeTab === 'active') {
        data = await userReservationAPI.getMyActiveReservations();
      } else {
        data = await userReservationAPI.getMyReservationHistory();
      }
      setReservations(data);
    } catch (error) {
      console.error('Error loading reservations:', error);
      addToast(t.reservationsLoadError || 'Failed to load reservations', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Toast functions
  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const handleCancelReservation = async (reservation: Reservation) => {
    // Check if can be cancelled
    if (!reservation.canBeCancelled) {
      addToast(t.cannotCancelReservation || 'This reservation cannot be cancelled', 'error');
      return;
    }
    
    // Open modal
    setReservationToCancel(reservation);
    setShowCancelModal(true);
  };

  const confirmCancellation = async () => {
    if (!reservationToCancel) return;
    
    setCancellingId(reservationToCancel._id);
    try {
      await userReservationAPI.cancelReservation(reservationToCancel._id, JSON.stringify({ 
        reason: 'Customer request' 
      }));
      await loadReservations();
      addToast(t.reservationCancelSuccess || 'Reservation cancelled successfully', 'success');
      setShowDetailModal(false);
      setShowCancelModal(false);
      setReservationToCancel(null);
    } catch (error: any) {
      addToast(
        error.response?.data?.message || 
        t.reservationCancelError || 
        'Failed to cancel reservation', 
        'error'
      );
    } finally {
      setCancellingId(null);
    }
  };

  // Get payment status badge - UPDATED
  const getPaymentStatusBadge = (reservation: Reservation) => {
    const paymentStatus = reservation.paymentStatus;
    const payment = reservation.payment;
    
    // Check for partial payment - DÜZELTİLDİ
    if (paymentStatus === 'partial') {  // 'pending' yerine 'partial'
      const totalPrice = reservation.totalPrice || 0;
      const paidAmount = payment?.summary?.totalPaid || 0;
      const percentage = Math.round((paidAmount / totalPrice) * 100);
      
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
          <Clock size={12} className="mr-1" />
          {t.partiallyPaid || 'Kısmi Ödendi'} ({percentage}%)
        </span>
      );
    }
    
    const statusConfig = {
      pending: { 
        bg: 'bg-yellow-100', 
        text: 'text-yellow-800', 
        icon: Clock, 
        label: t.paymentPending || 'Ödeme Bekliyor' 
      },
      partial: {  // EKLE - 'partial' durumu için de config
        bg: 'bg-orange-100', 
        text: 'text-orange-800', 
        icon: Clock, 
        label: t.partiallyPaid || 'Kısmi Ödendi' 
      },
      paid: { 
        bg: 'bg-green-100', 
        text: 'text-green-800', 
        icon: CheckCircle, 
        label: t.paymentStatusPaid || 'Ödendi' 
      },
      refunded: { 
        bg: 'bg-blue-100', 
        text: 'text-blue-800', 
        icon: RefreshCw, 
        label: t.paymentStatusRefunded || 'İade Edildi' 
      },
      partially_refunded: { 
        bg: 'bg-purple-100', 
        text: 'text-purple-800', 
        icon: RefreshCw, 
        label: t.partiallyRefunded || 'Kısmi İade' 
      }
    };
    
    const badge = statusConfig[paymentStatus as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = badge.icon;
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        <Icon size={12} className="mr-1" />
        {badge.label}
      </span>
    );
  };

  // Get status badge
  const getStatusBadge = (reservation: Reservation) => {
    const currentStatus = reservation.statusDetails?.current || reservation.status;
    
    const statusConfig: Record<string, { bg: string; text: string; icon: any; label: string }> = {
      pending: { 
        bg: 'bg-yellow-100', 
        text: 'text-yellow-800', 
        icon: Clock, 
        label: t.pending || 'Pending' 
      },
      confirmed: { 
        bg: 'bg-green-100', 
        text: 'text-green-800', 
        icon: CheckCircle, 
        label: t.confirmed || 'Confirmed' 
      },
      cancelled: { 
        bg: 'bg-red-100', 
        text: 'text-red-800', 
        icon: XCircle, 
        label: t.cancelled || 'Cancelled' 
      },
      cancelled_by_customer: { 
        bg: 'bg-red-100', 
        text: 'text-red-800', 
        icon: XCircle, 
        label: t.cancelledByYou || 'Cancelled by You' 
      },
      cancelled_by_admin: { 
        bg: 'bg-orange-100', 
        text: 'text-orange-800', 
        icon: XCircle, 
        label: t.cancelledBySystem || 'System Cancellation' 
      },
      completed: { 
        bg: 'bg-blue-100', 
        text: 'text-blue-800', 
        icon: CheckCircle, 
        label: t.completed || 'Completed' 
      }
    };
    
    const badge = statusConfig[currentStatus] || statusConfig.pending;
    const Icon = badge.icon;
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${badge.bg} ${badge.text}`}>
        <Icon size={14} className="mr-1" />
        {badge.label}
      </span>
    );
  };

  // Filter reservations
  const filteredReservations = reservations.filter(res => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      res.reservationNumber?.toLowerCase().includes(searchLower) ||
      res.apartment?.title.toLowerCase().includes(searchLower) ||
      res.tour?.title.toLowerCase().includes(searchLower)
    );
  });

  // Format guest info
  const formatGuestInfo = (reservation: Reservation) => {
    let guestInfo = `${reservation.adults} ${t.adult || 'Adult'}`;
    
    if (reservation.children > 0) {
      if (reservation.childrenAgeGroups) {
        const groups = [];
        if (reservation.childrenAgeGroups.above7 > 0) {
          groups.push(`${reservation.childrenAgeGroups.above7} ${t.child || 'Child'} (7+ ${t.age || 'years'})`);
        }
        if (reservation.childrenAgeGroups.between2And7 > 0) {
          groups.push(`${reservation.childrenAgeGroups.between2And7} ${t.child || 'Child'} (2-7 ${t.age || 'years'})`);
        }
        if (reservation.childrenAgeGroups.under2 > 0) {
          groups.push(`${reservation.childrenAgeGroups.under2} ${t.infant || 'Infant'}`);
        }
        if (groups.length > 0) {
          guestInfo += `, ${groups.join(', ')}`;
        }
      } else {
        guestInfo += `, ${reservation.children} ${t.child || 'Child'}`;
      }
    }
    
    return guestInfo;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Header
        transparent={true}
        currentLang={currentLang}
        setCurrentLang={setCurrentLang}
        translations={translations}
        setShowLoginModal={setShowLoginModal}
        setCurrentView={setCurrentView}
      />

      <div className="relative h-64 bg-gradient-to-b from-[#0a2e23] via-[#0a2e23]/60 to-transparent">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a2e23] to-[#1a4a3a] opacity-90" />
      </div>

      <div className="container mx-auto px-4 py-8 -mt-32 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Page Header */}
          <div className="bg-gradient-to-r from-[#ff9800] to-[#f57c00] rounded-3xl shadow-xl p-8 mb-8 text-white">
            <h1 className="text-4xl font-bold mb-2 text-white">{t.myReservations || 'My Reservations'}</h1>
            <p className="text-white/80 text-lg">{t.manageReservationsDesc || 'You can manage all your reservations here'}</p>
          </div>

          {/* Tabs and Search */}
          <div className="bg-white rounded-2xl shadow-sm mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between p-6 border-b">
              {/* Tabs */}
              <div className="flex space-x-1 mb-4 md:mb-0">
                <button
                  onClick={() => setActiveTab('active')}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === 'active'
                      ? 'bg-[#ff9800] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {t.activeReservations || 'Active Reservations'}
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === 'history'
                      ? 'bg-[#ff9800] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {t.pastReservations || 'Past Reservations'}
                </button>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder={t.searchReservation || "Search reservation..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff9800] focus:border-transparent"
                />
              </div>
            </div>

            {/* Reservations List */}
            <div className="p-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#ff9800] border-t-transparent"></div>
                </div>
              ) : filteredReservations.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="mx-auto text-gray-300 mb-4" size={64} />
                  <p className="text-gray-500 text-lg">
                    {searchTerm 
                      ? t.noReservationMatchingSearch || 'No reservations matching your search.' 
                      : t.noReservationYet || 'No reservations yet.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredReservations.map((reservation) => (
                    <div
                      key={reservation._id}
                      onClick={() => {
                        setSelectedReservation(reservation);
                        setShowDetailModal(true);
                      }}
                      className="bg-gray-50 hover:bg-white rounded-2xl p-6 cursor-pointer transition-all hover:shadow-lg border border-gray-100 group"
                    >
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                        {/* Reservation Info */}
                        <div className="flex-1">
                          <div className="flex items-start space-x-4">
                            {/* Image */}
                            <div className="relative">
                              <img 
                                src={reservation.apartment?.images?.[0]?.url || reservation.tour?.images?.[0]?.url || '/placeholder.jpg'}
                                alt={reservation.apartment?.title || reservation.tour?.title}
                                className="w-24 h-24 rounded-xl object-cover shadow-sm"
                              />
                              <div className="absolute -top-2 -right-2">
                                {reservation.apartment ? (
                                  <div className="bg-blue-500 text-white p-1.5 rounded-full">
                                    <Home size={14} />
                                  </div>
                                ) : (
                                  <div className="bg-green-500 text-white p-1.5 rounded-full">
                                    <Plane size={14} />
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Details */}
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <h3 className="font-semibold text-lg text-gray-800 group-hover:text-[#ff9800] transition-colors">
                                    {reservation.apartment?.title || reservation.tour?.title}
                                  </h3>
                                  <p className="text-sm text-gray-500 flex items-center mt-1">
                                    <MapPin size={14} className="mr-1" />
                                    {reservation.apartment?.district || reservation.apartment?.city || reservation.tour?.category}
                                  </p>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                  {getStatusBadge(reservation)}
                                  {reservation.paymentStatus && getPaymentStatusBadge(reservation)}
                                </div>
                              </div>

                              {/* Dates & Guests */}
                              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                                <div className="flex items-center">
                                  <Calendar size={16} className="mr-1.5 text-gray-400" />
                                  {new Date(reservation.checkIn).toLocaleDateString(currentLang === 'tr' ? 'tr-TR' : currentLang === 'en' ? 'en-US' : currentLang === 'ar' ? 'ar-SA' : 'ru-RU')}
                                  {reservation.checkOut && ' - ' + new Date(reservation.checkOut).toLocaleDateString(currentLang === 'tr' ? 'tr-TR' : currentLang === 'en' ? 'en-US' : currentLang === 'ar' ? 'ar-SA' : 'ru-RU')}
                                </div>
                                <div className="flex items-center">
                                  <Users size={16} className="mr-1.5 text-gray-400" />
                                  {formatGuestInfo(reservation)}
                                </div>
                                {reservation.isRefundable && (
                                  <div className="flex items-center">
                                    <Shield size={16} className="mr-1.5 text-green-600" />
                                    <span className="text-green-600">{t.refundable || 'Refundable'}</span>
                                  </div>
                                )}
                              </div>

                              {/* Price */}
                              <div className="mt-3 flex items-baseline">
                                <span className="text-2xl font-bold text-[#ff9800]">
                                  €{reservation.isRefundable && reservation.refundablePrice 
                                    ? reservation.refundablePrice 
                                    : reservation.totalPrice}
                                </span>
                                <span className="text-sm text-gray-500 ml-2">
                                  {reservation.nights && `/ ${reservation.nights} ${t.nights || 'nights'}`}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Arrow */}
                        <div className="mt-4 md:mt-0 md:ml-4">
                          <div className="flex items-center justify-end text-[#ff9800] group-hover:translate-x-1 transition-transform">
                            <span className="text-sm mr-1">{t.viewDetails || 'View Details'}</span>
                            <ChevronRight size={20} />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedReservation && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#ff9800] to-[#f57c00] p-6 rounded-t-3xl text-white sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold">{t.reservationDetails || 'Reservation Details'}</h3>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="bg-white/20 backdrop-blur-sm p-2 rounded-full hover:bg-white/30 transition-all"
                >
                  <X size={24} />
                </button>
              </div>
              <p className="text-white/90 mt-1">#{selectedReservation.reservationNumber}</p>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Property/Tour Info */}
              <div className="bg-gray-50 rounded-2xl p-5 mb-6">
                <h4 className="font-semibold mb-3 text-gray-800 flex items-center">
                  {selectedReservation.apartment ? <Building size={20} className="mr-2 text-[#ff9800]" /> : <Plane size={20} className="mr-2 text-[#ff9800]" />}
                  {selectedReservation.apartment ? t.accommodationDetails || 'Accommodation Details' : t.tourDetails || 'Tour Details'}
                </h4>
                <div className="flex items-start space-x-4">
                  <img 
                    src={selectedReservation.apartment?.images?.[0]?.url || selectedReservation.tour?.images?.[0]?.url}
                    alt={selectedReservation.apartment?.title || selectedReservation.tour?.title}
                    className="w-32 h-32 rounded-xl object-cover"
                  />
                  <div className="flex-1">
                    <h5 className="font-semibold text-lg mb-2">
                      {selectedReservation.apartment?.title || selectedReservation.tour?.title}
                    </h5>
                    <p className="text-gray-600 mb-2">
                      <MapPin size={16} className="inline mr-1" />
                      {selectedReservation.apartment?.district || selectedReservation.apartment?.city || selectedReservation.tour?.category}
                    </p>
                    {selectedReservation.apartment?.internalCode && (
                      <p className="text-sm text-gray-500">
                        {t.code || 'Code'}: {selectedReservation.apartment.internalCode}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Dates and Guests */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-blue-50 rounded-xl p-4">
                  <h5 className="font-medium text-gray-700 mb-2 flex items-center">
                    <Calendar size={18} className="mr-2 text-blue-600" />
                    {t.dates || 'Dates'}
                  </h5>
                  <p className="text-sm">
                    <span className="font-medium">{t.checkIn || 'Check-in'}:</span> {new Date(selectedReservation.checkIn).toLocaleDateString(currentLang === 'tr' ? 'tr-TR' : currentLang === 'en' ? 'en-US' : currentLang === 'ar' ? 'ar-SA' : 'ru-RU', { 
                      day: 'numeric', 
                      month: 'long', 
                      year: 'numeric' 
                    })}
                  </p>
                  {selectedReservation.checkOut && (
                    <>
                      <p className="text-sm mt-1">
                        <span className="font-medium">{t.checkOut || 'Check-out'}:</span> {new Date(selectedReservation.checkOut).toLocaleDateString(currentLang === 'tr' ? 'tr-TR' : currentLang === 'en' ? 'en-US' : currentLang === 'ar' ? 'ar-SA' : 'ru-RU', { 
                          day: 'numeric', 
                          month: 'long', 
                          year: 'numeric' 
                        })}
                      </p>
                      {selectedReservation.nights && (
                        <p className="text-sm mt-1 text-blue-600 font-medium">
                          {selectedReservation.nights} {t.nights || 'nights'}
                        </p>
                      )}
                    </>
                  )}
                </div>

                <div className="bg-green-50 rounded-xl p-4">
                  <h5 className="font-medium text-gray-700 mb-2 flex items-center">
                    <Users size={18} className="mr-2 text-green-600" />
                    {t.guests || 'Guests'}
                  </h5>
                  <p className="text-sm">{formatGuestInfo(selectedReservation)}</p>
                  {selectedReservation.totalGuests && (
                    <p className="text-sm mt-1 text-green-600 font-medium">
                      {t.total || 'Total'}: {selectedReservation.totalGuests} {t.person || 'person'}
                    </p>
                  )}
                </div>
              </div>

              {/* Cancellation Policy */}
              {selectedReservation.isRefundable && (
                <div className="bg-purple-50 rounded-xl p-4 mb-6">
                  <h5 className="font-medium text-gray-700 mb-2 flex items-center">
                    <Shield size={18} className="mr-2 text-purple-600" />
                    {t.cancellationPolicy || 'Cancellation Policy'}
                  </h5>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p>✓ {t.freeCancellationUntil7Days || 'Free cancellation up to 7 days before check-in'}</p>
                    {selectedReservation.payment?.pricing?.refundableFee && selectedReservation.payment.pricing.refundableFee > 0 && (
                      <p>✓ {t.guaranteeFeeNonRefundable
                        ?.replace('{fee}', selectedReservation.payment.pricing.refundableFee.toString())
                        || `Guarantee fee €${selectedReservation.payment.pricing.refundableFee} is non-refundable`}</p>
                    )}
                    {selectedReservation.daysUntilCheckIn !== undefined && (
                      <p className={`font-medium ${
                        selectedReservation.daysUntilCheckIn >= 7 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        → {selectedReservation.daysUntilCheckIn} {t.daysUntilCheckIn || 'days until check-in'}
                        {selectedReservation.daysUntilCheckIn >= 7 
                          ? `, ${t.canCancelFree || 'can cancel for free'}` 
                          : `, ${t.cannotCancelNow || 'cancellation period expired'}`
                        }
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Price Info */}
              <div className="bg-orange-50 rounded-xl p-4 mb-6">
                <h5 className="font-medium text-gray-700 mb-2 flex items-center">
                  <Euro size={18} className="mr-2 text-orange-600" />
                  {t.paymentInfo || 'Payment Information'}
                </h5>
                <div className="flex items-baseline justify-between">
                  <span className="text-sm">{t.totalAmount || 'Total Amount'}:</span>
                  <span className="text-2xl font-bold text-[#ff9800]">
                    €{selectedReservation.isRefundable && selectedReservation.refundablePrice 
                      ? selectedReservation.refundablePrice 
                      : selectedReservation.totalPrice}
                  </span>
                </div>
                {selectedReservation.isRefundable && (
                  <p className="text-xs text-gray-500 mt-1">
                    * {t.refundableFeeIncluded || 'Refundable reservation fee included'}
                  </p>
                )}
              </div>

              {/* Refund Status */}
              {selectedReservation.cancellation && 
                selectedReservation.payment?.summary?.totalRefunded !== undefined && 
                selectedReservation.payment.summary.totalRefunded > 0 && (
                    <div className="bg-blue-50 rounded-xl p-4 mb-6">
                  <h5 className="font-medium text-gray-700 mb-2 flex items-center">
                    <RefreshCw size={18} className="mr-2 text-blue-600" />
                    {t.refundStatus || 'Refund Status'}
                  </h5>
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm">{t.refundedAmount || 'Refunded Amount'}:</span>
                    <span className="text-xl font-bold text-blue-600">
                      €{selectedReservation.payment.summary.totalRefunded}
                    </span>
                  </div>
                </div>
              )}

              {/* Payment Details */}
              {selectedReservation?.payment?.summary && (
                <div className="bg-yellow-50 rounded-xl p-4 mb-6">
                  <h5 className="font-medium text-gray-700 mb-3 flex items-center">
                    <Euro size={18} className="mr-2 text-yellow-600" />
                    {t.paymentDetails || 'Payment Details'}
                  </h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t.totalAmount || 'Total Amount'}:</span>
                      <span className="font-medium">€{selectedReservation.totalPrice}</span>
                    </div>
                    {selectedReservation.payment.summary.totalPaid > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">{t.paidAmount || 'Paid'}:</span>
                        <span className="font-medium text-green-600">
                          €{selectedReservation.payment.summary.totalPaid}
                        </span>
                      </div>
                    )}
                    {selectedReservation.payment.summary.totalPaid < selectedReservation.totalPrice && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">{t.remainingAmount || 'Remaining'}:</span>
                        <span className="font-medium text-orange-600">
                          €{selectedReservation.totalPrice - selectedReservation.payment.summary.totalPaid}
                        </span>
                      </div>
                    )}
                    {/* Progress bar */}
                    {selectedReservation.payment.summary.totalPaid > 0 && 
                    selectedReservation.payment.summary.totalPaid < selectedReservation.totalPrice && (
                      <div className="mt-3">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-yellow-400 to-orange-500 h-2 rounded-full transition-all"
                            style={{
                              width: `${(selectedReservation.payment.summary.totalPaid / selectedReservation.totalPrice) * 100}%`
                            }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {Math.round((selectedReservation.payment.summary.totalPaid / selectedReservation.totalPrice) * 100)}% {t.paid || 'paid'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Special Requests */}
              {selectedReservation.message && (
                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                  <h5 className="font-medium text-gray-700 mb-2 flex items-center">
                    <MessageCircle size={18} className="mr-2 text-gray-600" />
                    {t.specialRequests || 'Special Requests'}
                  </h5>
                  <p className="text-sm text-gray-600">{selectedReservation.message}</p>
                </div>
              )}

              {/* Action Buttons */}
              {(selectedReservation.status === 'confirmed' || selectedReservation.status === 'pending') && (
                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                  <button
                    onClick={() => {
                      const phoneNumber = '+905355117018';
                      window.open(`tel:${phoneNumber}`, '_self');
                    }}
                    className="flex-1 bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition-all flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
                  >
                    <Phone size={20} />
                    <span>{t.contact || 'Contact'}</span>
                  </button>
                  
                  {/* Cancel Button */}
                  {(() => {
                    const currentStatus = selectedReservation.statusDetails?.current || selectedReservation.status;
                    const isCancelled = currentStatus.includes('cancelled');
                    
                    if (isCancelled) {
                      return null;
                    }
                    
                    if (selectedReservation.isRefundable) {
                      if (selectedReservation.canBeCancelled) {
                        return (
                          <button
                            onClick={() => handleCancelReservation(selectedReservation)}
                            disabled={cancellingId === selectedReservation._id}
                            className="flex-1 bg-red-600 text-white px-6 py-3 rounded-xl hover:bg-red-700 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 shadow-lg hover:shadow-xl"
                          >
                            {cancellingId === selectedReservation._id ? (
                              <>
                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                                <span>{t.cancelling || 'Cancelling...'}</span>
                              </>
                            ) : (
                              <>
                                <XCircle size={20} />
                                <span>{t.cancel || 'Cancel'}</span>
                              </>
                            )}
                          </button>
                        );
                      } else {
                        return (
                          <div className="flex-1 bg-gray-200 text-gray-600 px-6 py-3 rounded-xl flex items-center justify-center space-x-2 cursor-not-allowed">
                            <Info size={20} />
                            <span>{t.cannotCancelLast7Days || 'Cannot cancel within last 7 days'}</span>
                          </div>
                        );
                      }
                    } else {
                      return (
                        <div className="flex-1 bg-gray-200 text-gray-600 px-6 py-3 rounded-xl flex items-center justify-center space-x-2 cursor-not-allowed">
                          <Info size={20} />
                          <span>{t.nonRefundableReservation || 'Non-refundable reservation'}</span>
                        </div>
                      );
                    }
                  })()}
                </div>
              )}

              {/* Cancelled or completed reservations */}
              {(selectedReservation.status === 'cancelled' || selectedReservation.status === 'completed' || 
                selectedReservation.statusDetails?.current === 'cancelled_by_customer' || 
                selectedReservation.statusDetails?.current === 'cancelled_by_admin') && (
                <div className="text-center text-gray-500 bg-gray-50 rounded-xl p-4">
                  {(selectedReservation.status === 'cancelled' || 
                    selectedReservation.statusDetails?.current?.includes('cancelled'))
                    ? t.reservationCancelled || 'This reservation has been cancelled.' 
                    : t.reservationCompleted || 'This reservation has been completed.'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelModal && reservationToCancel && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl animate-scale-in">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 rounded-t-3xl">
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center space-x-3">
                  <div className="bg-white/20 p-3 rounded-full">
                    <AlertCircle size={28} />
                  </div>
                  <h3 className="text-xl font-bold">{t.cancelReservationTitle || 'Cancel Reservation'}</h3>
                </div>
                <button
                  onClick={() => {
                    setShowCancelModal(false);
                    setReservationToCancel(null);
                  }}
                  className="bg-white/20 p-2 rounded-full hover:bg-white/30 transition-all"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <div className="mb-6">
                <p className="text-gray-700 text-center font-medium mb-4">
                  {t.cancelReservationConfirm || 'Are you sure you want to cancel this reservation?'}
                </p>
                
                {/* Reservation Info */}
                <div className="bg-gray-50 rounded-xl p-4 mb-4">
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t.reservationNo || 'Reservation No'}:</span>
                      <span className="font-medium">#{reservationToCancel.reservationNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t.accommodation || 'Accommodation'}:</span>
                      <span className="font-medium text-right">
                        {reservationToCancel.apartment?.title || reservationToCancel.tour?.title}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Refund Info */}
                {reservationToCancel.refundAmount !== undefined && (
                  <div className={`rounded-xl p-4 mb-4 ${
                    reservationToCancel.refundAmount > 0 
                      ? 'bg-green-50 border border-green-200' 
                      : 'bg-yellow-50 border border-yellow-200'
                  }`}>
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-full ${
                        reservationToCancel.refundAmount > 0 
                          ? 'bg-green-100 text-green-600' 
                          : 'bg-yellow-100 text-yellow-600'
                      }`}>
                        <Euro size={20} />
                      </div>
                      <div className="flex-1">
                        {reservationToCancel.refundAmount > 0 ? (
                          <>
                            <p className="font-semibold text-green-800 mb-1">
                              {t.refundAmount || 'Refund Amount'}: €{reservationToCancel.refundAmount}
                            </p>
                           {reservationToCancel.payment?.pricing?.refundableFee && 
                              reservationToCancel.payment.pricing.refundableFee > 0 && (
                                <p className="text-sm text-green-700">
                                  {t.guaranteeFeeNote
                                    ?.replace('{fee}', reservationToCancel.payment.pricing.refundableFee.toString())
                                    || `Guarantee fee €${reservationToCancel.payment.pricing.refundableFee} is non-refundable`}
                                </p>
                              )}
                          </>
                        ) : (
                          <p className="font-semibold text-yellow-800">
                            {t.noRefundAvailable || 'No refund available for this reservation'}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Warning Message */}
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-start space-x-2">
                    <AlertCircle size={18} className="text-red-600 mt-0.5" />
                    <p className="text-sm text-red-700">
                      {t.cancelWarning || 'This action cannot be undone. Once confirmed, your reservation will be cancelled.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowCancelModal(false);
                    setReservationToCancel(null);
                  }}
                  className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-200 transition-all font-medium"
                >
                  {t.goBack || 'Go Back'}
                </button>
                <button
                  onClick={confirmCancellation}
                  disabled={cancellingId === reservationToCancel._id}
                  className="flex-1 bg-red-600 text-white px-6 py-3 rounded-xl hover:bg-red-700 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 font-medium shadow-lg hover:shadow-xl"
                >
                  {cancellingId === reservationToCancel._id ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                      <span>{t.cancelling || 'Cancelling...'}</span>
                    </>
                  ) : (
                    <>
                      <XCircle size={20} />
                      <span>{t.cancelReservation || 'Cancel Reservation'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toasts */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </div>
  );
};

export default UserReservations;