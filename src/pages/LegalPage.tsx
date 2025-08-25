// src/pages/LegalPage.tsx

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, FileText, Calendar, Shield, Download, Share2, Home, ChevronRight } from 'lucide-react';
import { legalAPI } from '../utils/api';

interface LegalPageProps {
  currentLang: string;
  translations: any;
}

interface LegalDocument {
  type: string;
  title: string;
  content: string;
  version: string;
  lastUpdated: string;
}

const LegalPage: React.FC<LegalPageProps> = ({ currentLang, translations }) => {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();
  const [legalDoc, setLegalDoc] = useState<LegalDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string>('');
  
  const t = translations[currentLang];
  
  // ARAPÇA VE RUSÇA İÇİN İNGİLİZCE İÇERİK KULLAN
  const contentLang = (currentLang === 'ar' || currentLang === 'ru') ? 'en' : currentLang;
  
  useEffect(() => {
    if (type) {
      fetchDocument();
    }
  }, [type, currentLang]);
  
  const fetchDocument = async () => {
    if (!type) return;
    
    try {
      setLoading(true);
      setError(null);
      // İçerik için contentLang, başlık için currentLang kullan
      const response = await legalAPI.getDocument(type, contentLang);
      
      // Başlığı orijinal dilden al (eğer varsa)
      const titleResponse = await legalAPI.getDocument(type, currentLang);
      
      setLegalDoc({
        ...response,
        title: titleResponse.title || response.title // Başlık için orijinal dil
      });
    } catch (error: any) {
      console.error('Belge yüklenemedi:', error);
      setError(error.message || 'Belge yüklenemedi');
    } finally {
      setLoading(false);
    }
  };
  
  // İçeriği section'lara ayır
  const getSections = (content: string) => {
    const sections: { id: string; title: string; content: string }[] = [];
    const lines = content.split('\n');
    let currentSection: any = null;
    
    lines.forEach(line => {
      if (line.startsWith('## ')) {
        if (currentSection) {
          sections.push(currentSection);
        }
        const title = line.substring(3);
        const id = title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        currentSection = { id, title, content: '' };
      } else if (currentSection) {
        currentSection.content += line + '\n';
      }
    });
    
    if (currentSection) {
      sections.push(currentSection);
    }
    
    return sections;
  };
  
  const formatSectionContent = (content: string) => {
    const lines = content.split('\n');
    let html = '';
    let inList = false;
    
    lines.forEach(line => {
      if (line.startsWith('### ')) {
        html += `<h3 class="text-lg font-semibold text-gray-800 mb-3 mt-6">${line.substring(4)}</h3>`;
      } else if (line.startsWith('- ')) {
        if (!inList) {
          html += '<ul class="space-y-2 mb-4">';
          inList = true;
        }
        html += `<li class="flex items-start">
          <span class="text-[#2a7f3e] mr-2 mt-1">•</span>
          <span class="text-gray-700">${line.substring(2)}</span>
        </li>`;
      } else {
        if (inList) {
          html += '</ul>';
          inList = false;
        }
        if (line.trim()) {
          html += `<p class="text-gray-700 leading-relaxed mb-4">${line}</p>`;
        }
      }
    });
    
    if (inList) {
      html += '</ul>';
    }
    
    return html;
  };
  
  const handleSectionClick = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };
  
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    
    // Tailwind class'ları ile bildirim
    const notification = document.createElement('div');
    notification.className = 'fixed top-20 right-4 bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg z-50 flex items-center space-x-2 animate-slideIn';
    notification.innerHTML = `
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
      </svg>
      <span>${t.linkCopied || 'Link kopyalandı!'}</span>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('animate-fadeIn');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#2a7f3e] border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600">{t.loading || 'Yükleniyor...'}</p>
        </div>
      </div>
    );
  }
  
  if (error || !legalDoc) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-sm p-8 max-w-md w-full">
          <FileText size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-center text-gray-600 mb-6">
            {error || t.documentNotFound || 'Belge bulunamadı'}
          </p>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-[#2a7f3e] text-white py-3 rounded-lg hover:bg-[#236632] transition-colors mb-2"
          >
            <Home size={20} className="inline mr-2" />
            {t.home || 'Ana Sayfa'}
          </button>
          <button
            onClick={() => navigate(-1)}
            className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <ArrowLeft size={20} className="inline mr-2" />
            {t.goBack || 'Geri Dön'}
          </button>
        </div>
      </div>
    );
  }
  
  const sections = getSections(legalDoc.content);
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Professional Header */}
      <div className="bg-white border-b border-gray-200 no-print">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft size={20} className="mr-2" />
                <span className="hidden sm:inline">{t.back || 'Geri'}</span>
              </button>
              
              {/* Ana Sayfa Linki */}
              <Link
                to="/"
                className="flex items-center text-gray-600 hover:text-[#2a7f3e] transition-colors"
              >
                <Home size={20} className="mr-2" />
                <span className="hidden sm:inline">{t.home || 'Ana Sayfa'}</span>
              </Link>
            </div>
            
            {/* Logo - Tıklanabilir */}
            <Link 
              to="/"
              className="text-[#ff9800] font-bold text-xl hover:opacity-80 transition-opacity cursor-pointer"
            >
              lagirio.
            </Link>
          </div>
        </div>
      </div>
      
      {/* Breadcrumb - Mobil */}
      <div className="md:hidden bg-gray-50 border-b border-gray-200 px-4 py-2 no-print">
        <div className="flex items-center text-xs text-gray-500">
          <Link to="/" className="hover:text-[#2a7f3e] transition-colors">
            <Home size={14} />
          </Link>
          <ChevronRight size={14} className="mx-1" />
          <span>{t.legal || 'Yasal'}</span>
          <ChevronRight size={14} className="mx-1" />
          <span className="text-gray-700 truncate">{legalDoc?.title || '...'}</span>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sol Sidebar - İçindekiler */}
          <div className="lg:col-span-1 no-print">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
              <h3 className="font-semibold text-gray-900 mb-4">{t.tableOfContents || 'İçindekiler'}</h3>
              <nav className="space-y-2">
                {sections.map((section, index) => (
                  <button
                    key={section.id}
                    onClick={() => handleSectionClick(section.id)}
                    className={`w-full text-left block px-3 py-2 text-sm rounded-lg transition-colors ${
                      activeSection === section.id
                        ? 'bg-[#2a7f3e] text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <span className="opacity-50 mr-2">{index + 1}.</span>
                    {section.title}
                  </button>
                ))}
              </nav>
              
              {/* Hızlı Linkler */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-900 mb-3">
                  {t.quickLinks || 'Hızlı Linkler'}
                </h4>
                <div className="space-y-2">
                  <Link
                    to="/"
                    className="block text-sm text-gray-600 hover:text-[#2a7f3e] transition-colors"
                  >
                    → {t.home || 'Ana Sayfa'}
                  </Link>
                  <Link
                    to="/rentals"
                    className="block text-sm text-gray-600 hover:text-[#2a7f3e] transition-colors"
                  >
                    → {t.ourApartments || 'Daireler'}
                  </Link>
                  <Link
                    to="/rentals#tours"
                    className="block text-sm text-gray-600 hover:text-[#2a7f3e] transition-colors"
                  >
                    → {t.ourTours || 'Turlar'}
                  </Link>
                  {localStorage.getItem('token') && (
                    <Link
                      to="/profile"
                      className="block text-sm text-gray-600 hover:text-[#2a7f3e] transition-colors"
                    >
                      → {t.profile || 'Profilim'}
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Ana İçerik */}
          <div className="lg:col-span-3 legal-document">
            {/* Belge Başlığı Kartı */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-8">
              <div className="bg-gradient-to-r from-[#2a7f3e] to-[#236632] p-8 legal-header">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-white mb-2">
                      {legalDoc.title}
                    </h1>
                    <div className="flex flex-wrap items-center gap-4 text-white/80 text-sm">
                      <div className="flex items-center">
                        <Shield size={16} className="mr-2" />
                        {t.version || 'Versiyon'}: {legalDoc.version}
                      </div>
                      <div className="flex items-center">
                        <Calendar size={16} className="mr-2" />
                        {new Date(legalDoc.lastUpdated).toLocaleDateString(
                          currentLang === 'tr' ? 'tr-TR' : 
                          currentLang === 'ar' ? 'ar-SA' : 
                          currentLang === 'ru' ? 'ru-RU' : 
                          'en-US'
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 no-print">
                    <button
                      onClick={() => window.print()}
                      className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                      title={t.print || 'Yazdır'}
                    >
                      <Download size={20} className="text-white" />
                    </button>
                    <button
                      onClick={handleShare}
                      className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                      title={t.share || 'Paylaş'}
                    >
                      <Share2 size={20} className="text-white" />
                    </button>
                  </div>
                </div>
              </div>
              
              {/* İçerik */}
              <div className="p-8">
                {sections.length === 0 ? (
                  <div className="prose prose-lg max-w-none">
                    <div dangerouslySetInnerHTML={{ __html: formatSectionContent(legalDoc.content) }} />
                  </div>
                ) : (
                  sections.map((section, index) => (
                    <div 
                      key={section.id} 
                      id={section.id} 
                      className={`mb-12 scroll-mt-20 ${index > 0 ? 'page-break' : ''}`}
                    >
                      <div className="flex items-center mb-6">
                        <div className="w-10 h-10 bg-[#2a7f3e] text-white rounded-lg flex items-center justify-center font-semibold mr-4">
                          {index + 1}
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">
                          {section.title}
                        </h2>
                      </div>
                      
                      <div 
                        className="pl-14"
                        dangerouslySetInnerHTML={{ __html: formatSectionContent(section.content) }}
                      />
                    </div>
                  ))
                )}
              </div>
            </div>
            
            {/* Alt Bilgi Kartı */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-6 no-print">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-center sm:text-left">
                  <p className="text-sm text-gray-600 mb-1">
                    {t.lastUpdatedOn || 'Son Güncelleme'}
                  </p>
                  <p className="font-semibold text-gray-900">
                    {new Date(legalDoc.lastUpdated).toLocaleDateString(
                      currentLang === 'tr' ? 'tr-TR' : 
                      currentLang === 'ar' ? 'ar-SA' : 
                      currentLang === 'ru' ? 'ru-RU' : 
                      'en-US',
                      { year: 'numeric', month: 'long', day: 'numeric' }
                    )}
                  </p>
                </div>
                <div className="text-center sm:text-right">
                  <p className="text-sm text-gray-600 mb-1">
                    {t.documentVersion || 'Belge Versiyonu'}
                  </p>
                  <p className="font-semibold text-gray-900">
                    v{legalDoc.version}
                  </p>
                </div>
              </div>
              
              {/* Footer Actions */}
              <div className="mt-6 pt-6 border-t border-gray-200 flex flex-wrap justify-center gap-3">
                <Link
                  to="/"
                  className="px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                >
                  {t.backToHome || 'Ana Sayfaya Dön'}
                </Link>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-[#2a7f3e] text-white rounded-lg hover:bg-[#236632] transition-colors text-sm"
                >
                  {t.printDocument || 'Belgeyi Yazdır'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LegalPage;