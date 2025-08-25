import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, Calendar, Camera, Edit2, 
  Save, X, Lock, Award, TrendingUp, Heart, 
  Shield, LogOut, Trash2, AlertTriangle, AlertCircle
} from 'lucide-react';
import Header from '../components/common/Header';
import { useAuth } from '../components/contexts/AuthContext';
import { userReservationAPI, favoritesAPI, authAPI } from '../utils/api';
import Toast from '../components/common/Toast';
import PhoneInput from '../components/common/PhoneInput';

interface UserProfileProps {
  currentLang: string;
  setCurrentLang: (lang: string) => void;
  translations: any;
  setShowLoginModal: (show: boolean) => void;
  setCurrentView: (view: string) => void;
}

const UserProfile: React.FC<UserProfileProps> = ({
  currentLang,
  setCurrentLang,
  translations,
  setShowLoginModal,
  setCurrentView
}) => {
  const navigate = useNavigate();
  const { user, logout, updateProfile, changePassword } = useAuth();
  const t = translations[currentLang];
  
  // States
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [toasts, setToasts] = useState<any[]>([]);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Load user stats
  useEffect(() => {
    loadUserStats();
  }, []);

  const loadUserStats = async () => {
    try {
      const reservationStats = await userReservationAPI.getMyStats();
      const favoriteStats = await favoritesAPI.getFavoriteStats();
      
      setStats({
        ...reservationStats,
        ...favoriteStats
      });
    } catch (error) {
      console.error('Error loading stats:', error);
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

  // Handle profile update
  const handleUpdateProfile = async () => {
    setLoading(true);
    try {
      await updateProfile({
        name: formData.name,
        phone: formData.phone
      });
      
      setIsEditing(false);
      addToast(t.profileUpdateSuccess || 'Profil başarıyla güncellendi', 'success');
    } catch (error: any) {
      addToast(error.message || t.profileUpdateFailed || 'Profil güncellenemedi', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle password change
  const handleChangePassword = async () => {
    if (formData.newPassword !== formData.confirmPassword) {
      addToast(t.passwordsNotMatch || 'Şifreler eşleşmiyor', 'error');
      return;
    }

    if (formData.newPassword.length < 6) {
      addToast(t.passwordTooShort || 'Yeni şifre en az 6 karakter olmalıdır', 'error');
      return;
    }

    setLoading(true);
    try {
      await changePassword(formData.currentPassword, formData.newPassword);
      
      setIsChangingPassword(false);
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
      
      addToast(t.passwordChangeSuccess || 'Şifre başarıyla değiştirildi', 'success');
    } catch (error: any) {
      addToast(error.message || t.passwordChangeFailed || 'Şifre değiştirilemedi', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle account deletion
  const handleDeleteAccount = async () => {
    const deletePhrase = t.deletePermanently || 'DELETE PERMANENTLY';
    
    if (deleteConfirmText.toUpperCase() !== deletePhrase.toUpperCase()) {
      addToast(
        `${t.confirmDeleteMessage || 'Silme işlemini onaylamak için'} "${deletePhrase}" ${t.typeToConfirm || 'yazın'}`, 
        'error'
      );
      return;
    }

    setLoading(true);
    try {
      const eligibility = await authAPI.checkDeleteEligibility();
      
      if (!eligibility.canDelete) {
        const hasApartments = eligibility.activeReservations.apartments.length > 0;
        const hasTours = eligibility.activeReservations.tours.length > 0;
        
        let errorMessage = t.hasActiveReservationsError || 
          'Aktif rezervasyonlarınız bulunmaktadır. Hesabınızı silmek için:';
        
        if (hasApartments) {
          errorMessage += `\n• ${eligibility.activeReservations.apartments.length} adet daire rezervasyonu`;
        }
        if (hasTours) {
          errorMessage += `\n• ${eligibility.activeReservations.tours.length} adet tur rezervasyonu`;
        }
        
        errorMessage += '\n' + (t.mustCancelReservationsFirst || 
          'Önce iptal edilmeli veya tarihlerinin geçmesi beklenmelidir.');
        
        addToast(errorMessage, 'error');
        setShowDeleteModal(false);
        setDeleteConfirmText('');
        return;
      }
      
      await authAPI.deleteAccount();
      
      addToast(t.accountDeleteSuccess || 'Hesabınız başarıyla silindi', 'success');
      
      await logout();
      navigate('/');
      
    } catch (error: any) {
      const message = error.response?.data?.message || 
                    error.message || 
                    t.accountDeleteFailed || 
                    'Hesap silinemedi';
      addToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    await logout();
    navigate('/');
  };

  // Member level badge
  const getMemberLevelBadge = () => {
    const level = user?.memberLevel || 'bronze';
    const badges: Record<string, { color: string; bgColor: string; icon: string }> = {
      bronze: { color: 'text-orange-700', bgColor: 'bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200', icon: '🥉' },
      silver: { color: 'text-gray-700', bgColor: 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200', icon: '🥈' },
      gold: { color: 'text-yellow-700', bgColor: 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200', icon: '🥇' },
      platinum: { color: 'text-purple-700', bgColor: 'bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200', icon: '💎' }
    };
    
    return badges[level] || badges.bronze;
  };

  const badge = getMemberLevelBadge();

  // Member level names
  const getMemberLevelName = (level: string) => {
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

      {/* Hero Gradient - Mobile optimize */}
      <div className="relative h-48 md:h-64 bg-gradient-to-b from-[#0a2e23] via-[#0a2e23]/60 to-transparent">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a2e23] to-[#1a4a3a] opacity-90" />
      </div>

      <div className="container mx-auto px-4 py-4 md:py-8 -mt-24 md:-mt-32 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Profile Header - Mobile responsive */}
          <div className="bg-gradient-to-r from-[#ff9800] to-[#f57c00] rounded-2xl md:rounded-3xl shadow-xl p-4 md:p-8 mb-6 md:mb-8 text-white">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-4 md:space-x-6">
                {/* Profile Photo */}
                <div className="relative">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-4 border-white/30">
                    {user?.profilePhoto ? (
                      <img 
                        src={user.profilePhoto} 
                        alt={user.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <User size={32} className="md:w-12 md:h-12 text-white/80" />
                    )}
                  </div>
                  <button className="absolute bottom-0 right-0 bg-white text-[#ff9800] p-1.5 md:p-2.5 rounded-full hover:bg-gray-100 transition-all shadow-lg">
                    <Camera size={14} className="md:w-[18px] md:h-[18px]" />
                  </button>
                </div>

                {/* User Info */}
                <div className="text-center sm:text-left">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 md:mb-2">
                    {user?.name}
                  </h1>
                  <p className="text-white/90 text-sm md:text-lg mb-2 md:mb-3 break-all">{user?.email}</p>
                  <div className="flex flex-col sm:flex-row items-center sm:space-x-4 space-y-2 sm:space-y-0">
                    <span className={`inline-flex items-center px-3 py-1.5 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-medium ${badge.bgColor} ${badge.color} border`}>
                      <span className="mr-1.5 text-base md:text-lg">{badge.icon}</span>
                      {getMemberLevelName(user?.memberLevel || 'bronze')} {t.member || 'Üye'}
                    </span>
                    <span className="text-xs md:text-sm text-white/80">
                      {t.memberSince || 'Üyelik'}: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString(currentLang === 'tr' ? 'tr-TR' : currentLang === 'en' ? 'en-US' : currentLang === 'ar' ? 'ar-SA' : 'ru-RU') : t.unknown || 'Bilinmiyor'}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center justify-center space-x-2 bg-white/20 backdrop-blur-sm text-white px-4 py-2 md:px-5 md:py-2.5 rounded-full hover:bg-white/30 transition-all text-sm md:text-base w-full sm:w-auto mt-4 sm:mt-0"
              >
                <LogOut size={18} className="md:w-5 md:h-5" />
                <span>{t.logout || 'Çıkış Yap'}</span>
              </button>
            </div>
          </div>

          {/* Stats Cards - Mobile 2x2 grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
            <div className="bg-white rounded-xl md:rounded-2xl shadow-lg hover:shadow-xl transition-shadow p-4 md:p-6 border border-gray-100">
              <div className="flex flex-col items-center md:flex-row md:justify-between mb-2 md:mb-3">
                <div className="p-2 md:p-3 bg-[#ff9800]/10 rounded-lg md:rounded-xl mb-2 md:mb-0">
                  <Calendar className="text-[#ff9800]" size={20} />
                </div>
                <span className="text-2xl md:text-3xl font-bold text-gray-800">{stats?.totalReservations || 0}</span>
              </div>
              <p className="text-gray-600 font-medium text-xs md:text-base text-center md:text-left">{t.totalReservations || 'Toplam Rezervasyon'}</p>
            </div>

            <div className="bg-white rounded-xl md:rounded-2xl shadow-lg hover:shadow-xl transition-shadow p-4 md:p-6 border border-gray-100">
              <div className="flex flex-col items-center md:flex-row md:justify-between mb-2 md:mb-3">
                <div className="p-2 md:p-3 bg-green-100 rounded-lg md:rounded-xl mb-2 md:mb-0">
                  <TrendingUp className="text-green-600" size={20} />
                </div>
                <span className="text-2xl md:text-3xl font-bold text-gray-800">{stats?.activeReservations || 0}</span>
              </div>
              <p className="text-gray-600 font-medium text-xs md:text-base text-center md:text-left">{t.activeReservations || 'Aktif Rezervasyon'}</p>
            </div>

            <div className="bg-white rounded-xl md:rounded-2xl shadow-lg hover:shadow-xl transition-shadow p-4 md:p-6 border border-gray-100">
              <div className="flex flex-col items-center md:flex-row md:justify-between mb-2 md:mb-3">
                <div className="p-2 md:p-3 bg-red-100 rounded-lg md:rounded-xl mb-2 md:mb-0">
                  <Heart className="text-red-600" size={20} />
                </div>
                <span className="text-2xl md:text-3xl font-bold text-gray-800">{stats?.totalFavorites || 0}</span>
              </div>
              <p className="text-gray-600 font-medium text-xs md:text-base text-center md:text-left">{t.myFavorites || 'Favori'}</p>
            </div>

            <div className="bg-white rounded-xl md:rounded-2xl shadow-lg hover:shadow-xl transition-shadow p-4 md:p-6 border border-gray-100">
              <div className="flex flex-col items-center md:flex-row md:justify-between mb-2 md:mb-3">
                <div className="p-2 md:p-3 bg-purple-100 rounded-lg md:rounded-xl mb-2 md:mb-0">
                  <Award className="text-purple-600" size={20} />
                </div>
                <span className="text-xl md:text-3xl font-bold text-gray-800">€{stats?.totalSpent || 0}</span>
              </div>
              <p className="text-gray-600 font-medium text-xs md:text-base text-center md:text-left">{t.totalSpent || 'Toplam Harcama'}</p>
            </div>
          </div>

          {/* Tabs - Mobile optimize */}
          <div className="bg-white rounded-2xl md:rounded-3xl shadow-lg overflow-hidden">
            <div className="border-b border-gray-100">
              <div className="flex">
                {[
                  { id: 'profile', label: t.profileInfo || 'Profil Bilgileri', icon: User },
                  { id: 'security', label: t.security || 'Güvenlik', icon: Shield }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center space-x-2 py-4 md:py-5 font-medium transition-all relative text-sm md:text-base ${
                      activeTab === tab.id
                        ? 'text-[#ff9800] bg-[#ff9800]/5'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <tab.icon size={18} className="md:w-5 md:h-5" />
                    <span>{tab.label}</span>
                    {activeTab === tab.id && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#ff9800]" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 md:p-8">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="space-y-4 md:space-y-6">
                  <div className="flex items-center justify-between mb-4 md:mb-6">
                    <h3 className="text-lg md:text-xl font-semibold text-gray-800">{t.personalInfo || 'Kişisel Bilgiler'}</h3>
                    {!isEditing ? (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center space-x-1 md:space-x-2 text-[#ff9800] hover:text-[#f57c00] transition-colors text-sm md:text-base"
                      >
                        <Edit2 size={16} className="md:w-[18px] md:h-[18px]" />
                        <span>{t.edit || 'Düzenle'}</span>
                      </button>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setIsEditing(false);
                            setFormData({
                              ...formData,
                              name: user?.name || '',
                              phone: user?.phone || ''
                            });
                          }}
                          className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
                        >
                          <X size={18} className="md:w-5 md:h-5" />
                        </button>
                        <button
                          onClick={handleUpdateProfile}
                          className="px-3 py-1.5 md:px-6 md:py-2 bg-[#ff9800] text-white rounded-lg hover:bg-[#f57c00] transition-colors flex items-center space-x-1 md:space-x-2 text-sm md:text-base"
                          disabled={loading}
                        >
                          <Save size={16} className="md:w-[18px] md:h-[18px]" />
                          <span>{t.save || 'Kaydet'}</span>
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t.fullName || 'Ad Soyad'}
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full px-3 py-2 md:px-4 md:py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#ff9800] focus:border-transparent transition-all text-sm md:text-base"
                        />
                      ) : (
                        <p className="text-gray-900 py-2 md:py-3 text-sm md:text-base">{user?.name}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t.email || 'E-posta'}
                      </label>
                      <p className="text-gray-900 py-2 md:py-3 text-sm md:text-base break-all">{user?.email}</p>
                      <p className="text-xs md:text-sm text-gray-500 mt-1">{t.emailCannotChange || 'E-posta adresi değiştirilemez'}</p>
                    </div>

                    <div className="md:col-span-1">
                      <PhoneInput
                        label={t.phoneLabel || 'Telefon Numarası'}
                        value={formData.phone}
                        onChange={(value) => setFormData({ ...formData, phone: value })}
                        required={false}
                        disabled={!isEditing}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t.membershipDate || 'Üyelik Tarihi'}
                      </label>
                      <p className="text-gray-900 py-2 md:py-3 text-sm md:text-base">
                        {new Date(user?.createdAt || '').toLocaleDateString(currentLang === 'tr' ? 'tr-TR' : currentLang === 'en' ? 'en-US' : currentLang === 'ar' ? 'ar-SA' : 'ru-RU', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div className="space-y-6 md:space-y-8">
                  {/* Password Change */}
                  <div>
                    <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-4 md:mb-6">{t.changePassword || 'Şifre Değiştir'}</h3>
                    
                    {!isChangingPassword ? (
                      <button
                        onClick={() => setIsChangingPassword(true)}
                        className="flex items-center space-x-2 px-4 py-2.5 md:px-6 md:py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm md:text-base w-full sm:w-auto"
                      >
                        <Lock size={18} className="md:w-5 md:h-5" />
                        <span>{t.changeMyPassword || 'Şifremi Değiştir'}</span>
                      </button>
                    ) : (
                      <div className="space-y-4 max-w-full md:max-w-md">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t.currentPassword || 'Mevcut Şifre'}
                          </label>
                          <input
                            type="password"
                            value={formData.currentPassword}
                            onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                            className="w-full px-3 py-2 md:px-4 md:py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#ff9800] focus:border-transparent text-sm md:text-base"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t.newPassword || 'Yeni Şifre'}
                          </label>
                          <input
                            type="password"
                            value={formData.newPassword}
                            onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                            className="w-full px-3 py-2 md:px-4 md:py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#ff9800] focus:border-transparent text-sm md:text-base"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t.confirmNewPassword || 'Yeni Şifre (Tekrar)'}
                          </label>
                          <input
                            type="password"
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            className="w-full px-3 py-2 md:px-4 md:py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#ff9800] focus:border-transparent text-sm md:text-base"
                          />
                        </div>

                        <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
                          <button
                            onClick={() => {
                              setIsChangingPassword(false);
                              setFormData(prev => ({
                                ...prev,
                                currentPassword: '',
                                newPassword: '',
                                confirmPassword: ''
                              }));
                            }}
                            className="w-full sm:w-auto px-4 py-2 md:px-6 md:py-2.5 text-gray-600 hover:text-gray-800 transition-colors text-sm md:text-base"
                            disabled={loading}
                          >
                            {t.cancel || 'İptal'}
                          </button>
                          <button
                            onClick={handleChangePassword}
                            className="w-full sm:w-auto px-4 py-2 md:px-6 md:py-2.5 bg-[#ff9800] text-white rounded-lg hover:bg-[#f57c00] transition-colors text-sm md:text-base"
                            disabled={loading}
                          >
                            {t.changePasswordButton || 'Şifreyi Değiştir'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Account Delete */}
                  <div className="border-t pt-6 md:pt-8">
                    <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-4 md:mb-6">{t.accountOperations || 'Hesap İşlemleri'}</h3>
                    
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 md:p-6">
                      <div className="flex items-start space-x-3 mb-4">
                        <AlertTriangle className="text-red-600 mt-0.5 flex-shrink-0" size={20} />
                        <div>
                          <h4 className="font-semibold text-red-900 mb-2 text-sm md:text-base">{t.deletePermanentlyTitle || 'Hesabı Kalıcı Olarak Sil'}</h4>
                          <p className="text-red-700 text-xs md:text-sm">
                            {t.deleteAccountWarning || 'Bu işlem geri alınamaz. Tüm verileriniz, rezervasyonlarınız ve favorileriniz kalıcı olarak silinecektir.'}
                          </p>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => setShowDeleteModal(true)}
                        className="flex items-center justify-center space-x-2 px-4 py-2.5 md:px-6 md:py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm md:text-base w-full sm:w-auto"
                      >
                        <Trash2 size={18} className="md:w-5 md:h-5" />
                        <span>{t.deleteMyAccount || 'Hesabımı Sil'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Account Modal - Mobile optimize */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 md:p-8">
            <div className="flex items-center space-x-3 mb-4 md:mb-6">
              <div className="p-2 md:p-3 bg-red-100 rounded-full">
                <AlertTriangle className="text-red-600" size={24} />
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-gray-800">{t.deleteAccount || 'Hesabı Sil'}</h3>
            </div>
            
            <p className="text-gray-600 mb-4 md:mb-6 text-sm md:text-base">
              {t.deleteAccountConfirmMessage || 'Hesabınızı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz ve tüm verileriniz kalıcı olarak silinir.'}
            </p>
            
            <div className="mb-4 md:mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.confirmDeleteLabel || 'Onaylamak için'} <span className="font-bold text-red-600">{t.deletePermanently || 'KALICI SIL'}</span> {t.typeLabel || 'yazın:'}
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="w-full px-3 py-2 md:px-4 md:py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm md:text-base"
                placeholder={t.deletePermanently || 'DELETE PERMANENTLY'}
                autoComplete="off"
              />
            </div>
            
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText('');
                }}
                className="flex-1 w-full px-4 py-2.5 md:px-6 md:py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-sm md:text-base"
              >
                {t.cancel || 'İptal'}
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={
                  deleteConfirmText.toUpperCase() !== (t.deletePermanently || 'DELETE PERMANENTLY').toUpperCase() || 
                  loading
                }
                className="flex-1 w-full px-4 py-2.5 md:px-6 md:py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
              >
                {loading ? (t.deleting || 'Siliniyor...') : (t.deleteAccount || 'Hesabı Sil')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal - Mobile optimize */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl md:rounded-3xl max-w-md w-full shadow-2xl animate-scale-in">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-gray-600 to-gray-700 p-4 md:p-6 rounded-t-2xl md:rounded-t-3xl">
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center space-x-2 md:space-x-3">
                  <div className="bg-white/20 p-2 md:p-3 rounded-full">
                    <LogOut size={20} />
                  </div>
                  <h3 className="text-lg md:text-xl font-bold">{t.logout || 'Çıkış Yap'}</h3>
                </div>
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="bg-white/20 p-1.5 md:p-2 rounded-full hover:bg-white/30 transition-all"
                >
                  <X size={18} className="md:w-5 md:h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-4 md:p-6">
              <div className="mb-4 md:mb-6">
                <p className="text-gray-700 text-center mb-4 md:mb-6 text-sm md:text-base">
                  {t.logoutConfirm || 'Çıkış yapmak istediğinize emin misiniz?'}
                </p>
                
                {/* User Info Summary */}
                <div className="bg-gray-50 rounded-xl p-3 md:p-4 mb-3 md:mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-200 rounded-full flex items-center justify-center">
                      {user?.profilePhoto ? (
                        <img 
                          src={user.profilePhoto} 
                          alt={user.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <User size={20} className="text-gray-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 text-sm md:text-base truncate">{user?.name}</p>
                      <p className="text-xs md:text-sm text-gray-600 truncate">{user?.email}</p>
                    </div>
                  </div>
                </div>

                {/* Active Sessions Info */}
                {stats?.activeReservations > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 md:p-4">
                    <div className="flex items-start space-x-2">
                      <AlertCircle size={16} className="text-yellow-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs md:text-sm text-yellow-800">
                          {stats.activeReservations} {t.activeReservationsWarning || 'aktif rezervasyonunuz bulunmaktadır.'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="flex-1 bg-gray-100 text-gray-700 px-4 py-2.5 md:px-6 md:py-3 rounded-xl hover:bg-gray-200 transition-all font-medium text-sm md:text-base"
                >
                  {t.cancel || 'Vazgeç'}
                </button>
                <button
                  onClick={confirmLogout}
                  className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-2.5 md:px-6 md:py-3 rounded-xl hover:from-red-700 hover:to-red-800 transition-all flex items-center justify-center space-x-2 font-medium shadow-lg hover:shadow-xl text-sm md:text-base"
                >
                  <LogOut size={18} className="md:w-5 md:h-5" />
                  <span>{t.confirmLogout || 'Çıkış Yap'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

export default UserProfile;