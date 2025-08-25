import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Heart, Plane, MapPin, Euro, 
  Users, Star, ChevronRight, Building
} from 'lucide-react';
import Header from '../components/common/Header';
import { useAuth } from '../components/contexts/AuthContext';
import { favoritesAPI } from '../utils/api';
import Toast from '../components/common/Toast';

interface UserFavoritesProps {
  currentLang: string;
  setCurrentLang: (lang: string) => void;
  translations: any;
  setShowLoginModal: (show: boolean) => void;
  setCurrentView: (view: string) => void;
}

const UserFavorites: React.FC<UserFavoritesProps> = ({
  currentLang,
  setCurrentLang,
  translations,
  setShowLoginModal,
  setCurrentView
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const t = translations[currentLang];
  
  // States
  const [activeTab, setActiveTab] = useState<'apartments' | 'tours'>('apartments');
  const [favorites, setFavorites] = useState<any>({ apartments: [], tours: [] });
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<any[]>([]);

  // Load favorites
  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    setLoading(true);
    try {
      const data = await favoritesAPI.getAllFavorites();
      setFavorites(data);
    } catch (error) {
      console.error('Error loading favorites:', error);
      addToast(t.favoritesLoadError || 'Favoriler yüklenemedi', 'error');
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

  // Remove from favorites
  const handleRemoveFavorite = async (id: string, type: 'apartment' | 'tour') => {
    setRemovingId(id);
    try {
      if (type === 'apartment') {
        await favoritesAPI.toggleApartmentFavorite(id);
      } else {
        await favoritesAPI.toggleTourFavorite(id);
      }
      
      addToast(t.removedFromFavorites || 'Favorilerden çıkarıldı', 'success');
      loadFavorites(); // Reload
    } catch (error: any) {
      addToast(error.message || t.operationFailed || 'İşlem başarısız', 'error');
    } finally {
      setRemovingId(null);
    }
  };

  // Navigate to detail
  const handleNavigateToDetail = (item: any, type: 'apartments' | 'tours') => {
    navigate(`/detail/${type}/${item._id || item.id}`);
  };

  const currentFavorites = activeTab === 'apartments' ? favorites.apartments : favorites.tours;

  // Get member level name
  const getMemberLevelName = () => {
    const level = user?.memberLevel || 'bronze';
    const levelNames: Record<string, string> = {
      bronze: t.bronzeMember || 'Bronze',
      silver: t.silverMember || 'Silver',
      gold: t.goldMember || 'Gold',
      platinum: t.platinumMember || 'Platinum'
    };
    return levelNames[level] || levelNames.bronze;
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
          {/* Page Header - Modern gradient style */}
          <div className="bg-gradient-to-r from-[#ff9800] to-[#f57c00] rounded-3xl shadow-xl p-8 mb-8 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2 flex items-center">
                  <Heart className="mr-3" size={36} />
                  {t.myFavorites || 'Favorilerim'}
                </h1>
                <p className="text-white/90">{t.favoritesDescription || 'Beğendiğiniz daire ve turları buradan görüntüleyebilirsiniz'}</p>
              </div>
              
              {/* Quick Stats */}
              <div className="hidden md:flex items-center space-x-6">
                <div className="text-center">
                  <p className="text-3xl font-bold">{(favorites.apartments?.length || 0) + (favorites.tours?.length || 0)}</p>
                  <p className="text-white/80 text-sm">{t.totalFavorites || 'Toplam Favori'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards - Modern design */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow p-6 text-center border border-gray-100">
              <div className="bg-[#ff9800]/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Building className="text-[#ff9800]" size={28} />
              </div>
              <p className="text-3xl font-bold text-gray-800">{favorites.apartments?.length || 0}</p>
              <p className="text-gray-600 font-medium">{t.favoriteApartments || 'Favori Daire'}</p>
            </div>
            
            <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow p-6 text-center border border-gray-100">
              <div className="bg-blue-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Plane className="text-blue-600" size={28} />
              </div>
              <p className="text-3xl font-bold text-gray-800">{favorites.tours?.length || 0}</p>
              <p className="text-gray-600 font-medium">{t.favoriteTours || 'Favori Tur'}</p>
            </div>
            
            <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow p-6 text-center border border-gray-100">
              <div className="bg-red-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Heart className="text-red-600" size={28} />
              </div>
              <p className="text-3xl font-bold text-gray-800">{(favorites.apartments?.length || 0) + (favorites.tours?.length || 0)}</p>
              <p className="text-gray-600 font-medium">{t.totalFavorites || 'Toplam Favori'}</p>
            </div>
            
            <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow p-6 text-center border border-gray-100">
              <div className="bg-yellow-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Star className="text-yellow-600" size={28} />
              </div>
              <p className="text-3xl font-bold text-gray-800">{getMemberLevelName()}</p>
              <p className="text-gray-600 font-medium">{t.membershipLevel || 'Üyelik Seviyesi'}</p>
            </div>
          </div>

          {/* Content Card with Tabs */}
          <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
            {/* Modern Tabs */}
            <div className="p-2 bg-gray-50 border-b">
              <div className="flex bg-gray-100 rounded-xl p-1">
                <button
                  onClick={() => setActiveTab('apartments')}
                  className={`flex-1 flex items-center justify-center space-x-2 py-3 px-6 rounded-lg font-medium transition-all ${
                    activeTab === 'apartments'
                      ? 'bg-white text-[#ff9800] shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <Building size={20} />
                  <span>{t.apartments || 'Daireler'} ({favorites.apartments?.length || 0})</span>
                </button>
                <button
                  onClick={() => setActiveTab('tours')}
                  className={`flex-1 flex items-center justify-center space-x-2 py-3 px-6 rounded-lg font-medium transition-all ${
                    activeTab === 'tours'
                      ? 'bg-white text-[#ff9800] shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <Plane size={20} />
                  <span>{t.tours || 'Turlar'} ({favorites.tours?.length || 0})</span>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {loading ? (
                <div className="text-center py-16">
                  <div className="inline-flex items-center space-x-2 text-gray-500">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#ff9800] border-t-transparent" />
                    <span>{t.loading || 'Yükleniyor...'}</span>
                  </div>
                </div>
              ) : currentFavorites.length === 0 ? (
                <div className="text-center py-16">
                  <Heart className="mx-auto text-gray-300 mb-4" size={64} />
                  <p className="text-gray-500 text-lg mb-2">
                    {activeTab === 'apartments' 
                      ? t.noFavoriteApartmentsYet || 'Henüz favori daireniz yok'
                      : t.noFavoriteToursYet || 'Henüz favori turunuz yok'}
                  </p>
                  <p className="text-gray-400">
                    {activeTab === 'apartments'
                      ? t.addApartmentToFavoritesHint || 'Beğendiğiniz daireleri kalp ikonuna tıklayarak favorilere ekleyebilirsiniz'
                      : t.addTourToFavoritesHint || 'Beğendiğiniz turları kalp ikonuna tıklayarak favorilere ekleyebilirsiniz'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {currentFavorites.map((item: any) => (
                    <div
                      key={item._id}
                      className="group bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer hover:transform hover:-translate-y-1"
                    >
                      {/* Image Container */}
                      <div className="relative h-48 overflow-hidden bg-gray-100">
                        {item.images?.[0] && (
                          <img
                            src={typeof item.images[0] === 'string' ? item.images[0] : item.images[0].url}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        )}
                        
                        {/* Type Badge */}
                        <div className="absolute top-3 left-3">
                          <div className={`px-3 py-1 rounded-full text-xs font-medium text-white backdrop-blur-sm ${
                            activeTab === 'apartments' ? 'bg-[#ff9800]/80' : 'bg-blue-600/80'
                          }`}>
                            {activeTab === 'apartments' ? t.apartment || 'Daire' : t.tour || 'Tur'}
                          </div>
                        </div>
                        
                        {/* Remove button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveFavorite(item._id, activeTab === 'apartments' ? 'apartment' : 'tour');
                          }}
                          className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm p-2.5 rounded-full hover:bg-red-500 hover:text-white transition-all shadow-lg"
                          disabled={removingId === item._id}
                        >
                          {removingId === item._id ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-red-500 border-t-transparent"></div>
                          ) : (
                            <Heart size={20} className="fill-current text-red-500" />
                          )}
                        </button>
                      </div>

                      {/* Content */}
                      <div 
                        className="p-5"
                        onClick={() => handleNavigateToDetail(item, activeTab)}
                      >
                        <h3 className="font-bold text-lg text-gray-800 mb-2 line-clamp-1 group-hover:text-[#ff9800] transition-colors">
                          {item.title}
                        </h3>
                        
                        <div className="flex items-center text-gray-600 text-sm mb-4">
                          <MapPin size={16} className="mr-1.5 text-[#ff9800]" />
                          <span className="line-clamp-1">
                            {activeTab === 'apartments' 
                              ? `${item.district}, ${item.city}`
                              : item.category
                            }
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                          <div className="flex items-center">
                            <Euro size={20} className="text-[#ff9800] mr-1" />
                            <span className="text-2xl font-bold text-gray-800">
                              {item.basePrice || item.price}
                            </span>
                            <span className="text-gray-500 text-sm ml-2">
                              /{activeTab === 'apartments' ? t.perNight || 'gece' : t.perPerson || 'kişi'}
                            </span>
                          </div>
                          
                          <div className="flex items-center text-[#ff9800] group-hover:translate-x-1 transition-transform">
                            <span className="text-sm mr-1">{t.details || 'Detaylar'}</span>
                            <ChevronRight size={18} />
                          </div>
                        </div>

                        {activeTab === 'apartments' && item.capacity && (
                          <div className="flex items-center text-gray-500 text-sm mt-3 bg-gray-50 rounded-lg px-3 py-2">
                            <Users size={14} className="mr-1.5" />
                            <span>{t.maximum || 'Maksimum'} {item.capacity} {t.person || 'kişi'}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notifications */}
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
};

export default UserFavorites;