import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Home, Globe, User, LogOut, Calendar, Heart, 
  ChevronDown, Menu, X, Mail, ChevronRight, Check
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
  transparent?: boolean;
  currentLang: string;
  setCurrentLang: (lang: string) => void;
  translations: Record<string, any>;
  setShowLoginModal: (show: boolean) => void;
  setCurrentView: (view: string) => void;
}

const Header: React.FC<HeaderProps> = ({ 
  transparent = true, 
  currentLang, 
  setCurrentLang, 
  translations, 
  setShowLoginModal,
  setCurrentView 
}) => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const t = translations[currentLang];
  
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  const userMenuRef = useRef<HTMLDivElement>(null);
  const langMenuRef = useRef<HTMLDivElement>(null);

  // Language options
  const languages = [
    { code: 'tr', label: 'Türkçe', flag: '🇹🇷' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'ar', label: 'العربية', flag: '🇸🇦' },
    { code: 'ru', label: 'Русский', flag: '🇷🇺' }
  ];

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setShowLangMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Mobile menü açıkken scroll'u engelle
  useEffect(() => {
    if (showMobileMenu) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showMobileMenu]);

  // Handle logout
  const handleLogout = async () => {
    await logout();
    setShowUserMenu(false);
    setShowMobileMenu(false);
    navigate('/');
  };

  // Navigate to pages
  const handleNavigation = (path: string) => {
    navigate(path);
    setShowUserMenu(false);
    setShowMobileMenu(false);
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user?.name) return 'U';
    return user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Handle language change - DÜZELTME
  const handleLanguageChange = (langCode: string) => {
    console.log('Changing language to:', langCode); // Debug için
    setCurrentLang(langCode);
    setShowMobileMenu(false);
    setShowLangMenu(false);
    // Language değişimini localStorage'a kaydet
    localStorage.setItem('preferredLanguage', langCode);
  };

  return (
    <>
      <header
        className={`w-full ${
          transparent ? "bg-transparent absolute" : "bg-white shadow-sm"
        } top-0 z-50 transition-all duration-300`}
      >
        <div className="px-4 lg:px-12 py-3 md:py-4">
          <div className="flex items-center justify-between">
            {/* Logo - Responsive boyut */}
            <h1
              className="text-2xl md:text-3xl font-bold cursor-pointer"
              onClick={() => {
                setCurrentView("home");
                setShowMobileMenu(false);
              }}
            >
              <span className="text-[#ff9800]">lagirio.</span>
            </h1>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-4">
              {/* User Menu */}
              {isAuthenticated && user ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className={`flex items-center space-x-2 ${
                      transparent
                        ? "bg-white/20 backdrop-blur-sm text-white border-white/30 hover:bg-white/30"
                        : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
                    } px-4 py-2.5 rounded-full font-medium transition-all border`}
                  >
                    <User size={18} />
                    <span>{user.name}</span>
                    <ChevronDown size={16} className={`transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu */}
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg overflow-hidden animate-fade-in">
                      <div className="px-4 py-3 border-b">
                        <p className="text-sm font-medium text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                      
                      <div className="py-2">
                        <button
                          onClick={() => handleNavigation('/profile')}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-center space-x-3"
                        >
                          <User size={18} className="text-gray-500" />
                          <span>{t.profile || 'Profil'}</span>
                        </button>
                        
                        <button
                          onClick={() => handleNavigation('/reservations')}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-center space-x-3"
                        >
                          <Calendar size={18} className="text-gray-500" />
                          <span>{t.myReservations || 'Rezervasyonlarım'}</span>
                        </button>
                        
                        <button
                          onClick={() => handleNavigation('/favorites')}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-center space-x-3"
                        >
                          <Heart size={18} className="text-gray-500" />
                          <span>{t.myFavorites || 'Favorilerim'}</span>
                        </button>
                      </div>
                      
                      <div className="border-t py-2">
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-4 py-3 hover:bg-red-50 text-red-600 transition-colors flex items-center space-x-3"
                        >
                          <LogOut size={18} />
                          <span>{t.logout || 'Çıkış Yap'}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setShowLoginModal(true)}
                  className={`${
                    transparent
                      ? "bg-white/20 backdrop-blur-sm text-white border-white/30 hover:bg-white/30"
                      : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
                  } px-6 py-2.5 rounded-full font-medium transition-all flex items-center space-x-2 border`}
                >
                  <Home size={18} />
                  <span>{t.login}</span>
                </button>
              )}

              {/* Language Selector - Desktop */}
              <div className="relative" ref={langMenuRef}>
                <button
                  onClick={() => setShowLangMenu(!showLangMenu)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                    transparent
                      ? "text-white hover:bg-white/10"
                      : "text-gray-700 hover:bg-gray-100"
                  } transition-all`}
                >
                  <Globe size={20} />
                  <span className="font-medium">{currentLang.toUpperCase()}</span>
                  <ChevronDown size={16} className={`transition-transform ${showLangMenu ? 'rotate-180' : ''}`} />
                </button>
                
                {showLangMenu && (
                  <div className="absolute right-0 mt-2 w-44 bg-white rounded-lg shadow-lg overflow-hidden animate-fade-in">
                    {languages.map(lang => (
                      <button
                        key={lang.code}
                        onClick={() => handleLanguageChange(lang.code)}
                        className={`block w-full text-left px-4 py-3.5 hover:bg-gray-50 transition-colors flex items-center justify-between ${
                          currentLang === lang.code ? 'bg-gray-50 font-medium' : ''
                        }`}
                      >
                        <span>{lang.flag} {lang.label}</span>
                        {currentLang === lang.code && <Check size={16} className="text-[#ff9800]" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Menu Button - Touch-friendly boyut */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className={`md:hidden relative p-2 -mr-2 rounded-xl transition-all ${
                transparent 
                  ? "text-white" 
                  : "text-gray-700"
              }`}
              aria-label="Menu"
            >
              <div className={`transform transition-all duration-300 ${showMobileMenu ? 'rotate-180 scale-75' : ''}`}>
                {showMobileMenu ? (
                  <X size={28} className="relative z-50" />
                ) : (
                  <Menu size={28} />
                )}
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay - Gradient */}
      {showMobileMenu && (
        <div 
          className="fixed inset-0 bg-gradient-to-br from-black/60 via-black/50 to-black/60 backdrop-blur-sm z-40 md:hidden animate-fade-in"
          onClick={() => setShowMobileMenu(false)}
        />
      )}

      {/* Mobile Menu Drawer - Premium Design */}
      <div className={`fixed top-0 right-0 w-[85%] max-w-sm h-full bg-gradient-to-b from-[#0a2e23] via-[#0a2e23] to-[#061a14] z-50 transform transition-all duration-500 md:hidden shadow-2xl ${
        showMobileMenu ? 'translate-x-0' : 'translate-x-full'
      }`}>
        
        {/* Decorative Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl transform translate-x-32 -translate-y-32"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#ff9800] rounded-full blur-3xl transform -translate-x-32 translate-y-32"></div>
        </div>

        {/* Mobile Menu Header with User Info */}
        <div className="relative p-6 pb-4">
          {/* Close Button */}
          <button
            onClick={() => setShowMobileMenu(false)}
            className="absolute top-6 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all"
            aria-label="Close menu"
          >
            <X size={20} className="text-white" />
          </button>

          {/* User Profile Section */}
          {isAuthenticated && user ? (
            <div className="mt-8">
              {/* Avatar */}
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#ff9800] to-[#f57c00] flex items-center justify-center text-white text-2xl font-bold mb-4 shadow-lg">
                {getUserInitials()}
              </div>
              
              {/* User Info */}
              <h3 className="text-white text-xl font-semibold mb-1">{user.name}</h3>
              <p className="text-white/60 text-sm flex items-center">
                <Mail size={14} className="mr-1" />
                {user.email}
              </p>
            </div>
          ) : (
            <div className="mt-8">
              <h3 className="text-white text-2xl font-bold mb-2">{t.welcome || 'Hoş Geldiniz'}</h3>
              <p className="text-white/60 text-sm">{t.login || 'Hesabınıza giriş yapın'}</p>
            </div>
          )}
        </div>

        {/* Mobile Menu Content */}
        <div className="flex flex-col h-[calc(100%-180px)] overflow-y-auto">
          <div className="flex-1 px-4">
            {isAuthenticated && user ? (
              <div className="space-y-2">
                {/* Main Navigation */}
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-2">
                  <button
                    onClick={() => handleNavigation('/profile')}
                    className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-white/10 rounded-xl transition-all group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-[#ff9800]/20 flex items-center justify-center">
                        <User size={20} className="text-[#ff9800]" />
                      </div>
                      <span className="text-white font-medium">{t.profile || 'Profilim'}</span>
                    </div>
                    <ChevronRight size={18} className="text-white/40 group-hover:text-white/60 transition-colors" />
                  </button>
                  
                  <button
                    onClick={() => handleNavigation('/reservations')}
                    className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-white/10 rounded-xl transition-all group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <Calendar size={20} className="text-blue-400" />
                      </div>
                      <span className="text-white font-medium">{t.myReservations || 'Rezervasyonlarım'}</span>
                    </div>
                    <ChevronRight size={18} className="text-white/40 group-hover:text-white/60 transition-colors" />
                  </button>
                  
                  <button
                    onClick={() => handleNavigation('/favorites')}
                    className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-white/10 rounded-xl transition-all group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                        <Heart size={20} className="text-red-400" />
                      </div>
                      <span className="text-white font-medium">{t.myFavorites || 'Favorilerim'}</span>
                    </div>
                    <ChevronRight size={18} className="text-white/40 group-hover:text-white/60 transition-colors" />
                  </button>
                </div>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="w-full mt-4 bg-red-500/20 hover:bg-red-500/30 backdrop-blur-sm px-4 py-3.5 rounded-xl transition-all flex items-center justify-center space-x-3 group"
                >
                  <LogOut size={20} className="text-red-400" />
                  <span className="text-red-400 font-medium">{t.logout || 'Çıkış Yap'}</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <button
                  onClick={() => {
                    setShowLoginModal(true);
                    setShowMobileMenu(false);
                  }}
                  className="w-full bg-gradient-to-r from-[#ff9800] to-[#f57c00] text-white px-6 py-4 rounded-2xl font-semibold hover:shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  {t.login || 'Giriş Yap'}
                </button>
              </div>
            )}
          </div>

          {/* Language Selector - Mobile Bottom - DÜZELTME */}
          <div className="p-4 border-t border-white/10">
            <p className="text-white/60 text-xs uppercase tracking-wider mb-3">
              {t.selectLanguage || 'Dil Seçimi'}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {languages.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => {
                    console.log('Mobile language button clicked:', lang.code); // Debug
                    handleLanguageChange(lang.code);
                  }}
                  className={`relative px-3 py-3 rounded-xl transition-all text-sm font-medium active:scale-95 ${
                    currentLang === lang.code 
                      ? 'bg-[#ff9800] text-white shadow-lg' 
                      : 'bg-white/10 text-white/80 hover:bg-white/20 active:bg-white/30'
                  }`}
                >
                  <span className="flex items-center justify-center space-x-2">
                    <span>{lang.flag}</span>
                    <span>{lang.label}</span>
                  </span>
                  {currentLang === lang.code && (
                    <Check size={14} className="absolute top-1 right-1 text-white" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 text-center border-t border-white/10">
            <p className="text-white/40 text-xs">© 2024 lagirio.</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Header;