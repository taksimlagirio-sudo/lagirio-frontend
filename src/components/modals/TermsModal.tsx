import React, { useState } from 'react';
import { X, FileText, Shield, ChevronDown, ChevronUp } from 'lucide-react';

interface TermsSection {
  title: string;
  content: string;
}

interface TermsContentType {
  title: string;
  lastUpdated: string;
  sections: TermsSection[];
}

interface TermsContentMap {
  [key: string]: TermsContentType;
}

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLang: string;
  translations: any;
  showAcceptButton?: boolean;
  onAccept?: () => void;
}

const TermsModal: React.FC<TermsModalProps> = ({
  isOpen,
  onClose,
  currentLang,
  translations,
  showAcceptButton = false,
  onAccept = () => {}
}) => {
  const [expandedSections, setExpandedSections] = useState<number[]>([0]); // İlk bölüm açık
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const t = translations[currentLang];


  const displayLang = (currentLang === 'ar' || currentLang === 'ru') ? 'en' : currentLang;

  const termsContent: TermsContentMap = {
    tr: {
      title: "Kullanım Koşulları ve Gizlilik Sözleşmesi",
      lastUpdated: "Son Güncelleme: 01.01.2024",
      sections: [
        {
          title: "1. TARAFLAR VE ŞİRKET BİLGİLERİ",
          content: `Bu sözleşme Turuncu Konaklama Turizm Organizasyon ve Ticari Limited Şirketi ("Lagirio" veya "Şirket") ile web sitesi kullanıcısı ("Kullanıcı") arasında akdedilmiştir.

**Şirket Bilgileri:**
- Unvan: Turuncu Konaklama Turizm Organizasyon ve Ticari Limited Şirketi
- Adres: Şehit Muhtar Mah. Tarlabaşı Blv. 116-120C Beyoğlu/İstanbul
- Vergi Dairesi: Beyoğlu
- Vergi No: 8721513313
- Telefon/WhatsApp: +90 535 511 70 18
- E-posta: info@lagirio.com
- Web: www.lagirio.com`
        },
        {
          title: "2. HİZMETLER VE ÜYELİK KOŞULLARI",
          content: `**Hizmetlerimiz:**
- Günlük kiralık daire rezervasyonu
- Tur ve aktivite rezervasyonu
- Turizm danışmanlığı
- Konsiyerj hizmetleri

**Üyelik Şartları:**
- Üyelik ücretsizdir
- 18 yaş üzeri kişiler üye olabilir
- 18 yaş altı kişiler veli/vasi onayı ile işlem yapabilir
- Üyelik bilgileri doğru, güncel ve eksiksiz olmalıdır

**Üyelik Güvenliği:**
- Kullanıcı adı ve şifre güvenliği kullanıcı sorumluluğundadır
- Hesap güvenlik ihlali durumunda derhal bildirim yapılmalıdır
- Üyelik devredilemez ve başkası adına kullanılamaz`
        },
        {
          title: "3. REZERVASYON VE FİYATLANDIRMA",
          content: `**Rezervasyon Süreci:**
- Rezervasyonlar sistem üzerinden otomatik onaylanır
- Onay e-postası ve SMS ile bildirilir
- Rezervasyon numarası ile takip edilebilir
- Özel istekler garanti edilmez ancak dikkate alınır

**Fiyatlandırma:**
- Fiyatlar Euro (€) cinsindendir
- Fiyatlara KDV dahildir
- Konaklama vergisi dahildir
- Temizlik ücreti dahildir
- Ekstra hizmetler ayrıca ücretlendirilir`
        },
        {
          title: "4. İPTAL VE İADE POLİTİKASI",
          content: `**İPTAL EDİLEBİLİR REZERVASYONLAR:**

Check-in tarihine 7 gün veya daha fazla kala iptal edilirse:
- Garanti ücreti dışında kalan tüm tutar iade edilir
- Garanti ücreti kesinlikle iade edilmez

7 günden az kala yapılan iptallerde:
- Hiçbir iade yapılmaz
- Tarih değişikliği kabul edilmez

**İPTAL EDİLEMEZ REZERVASYONLAR:**

Daha uygun fiyatlı bu tarifelerde:
- Hiçbir koşulda iade yapılmaz
- İptal veya değişiklik yapılamaz
- Kullanılmayan rezervasyonlar yakılmış sayılır

**Rezervasyon Değişikliği:**
- Sadece iptal edilebilir rezervasyonlarda mümkündür
- Müsaitlik durumuna bağlıdır
- Fiyat farkı oluşursa tahsil edilir
- Check-in'e 7 gün kala değişiklik yapılamaz`
        },
        {
          title: "5. ÖDEME KOŞULLARI",
          content: `**Ödeme Yöntemleri:**
- Kredi/Banka Kartı: 3D Secure ile güvenli ödeme
- Banka Havalesi/EFT: 24 saat içinde dekont gönderilmelidir
- Kapıda Ödeme: Önceden iletişime geçilmesi ve onay alınması gereklidir

**Ödeme Takvimi:**
- Online ödemede anında tahsilat
- Havale/EFT'de 24 saat bekleme süresi
- Süresi geçen rezervasyonlar iptal edilir

**Garanti Ücreti:**
- İptal edilebilir rezervasyonlarda toplam tutarın %15-25'i arasındadır
- Rezervasyon güvencesi içindir
- Hiçbir koşulda iade edilmez
- Tarih değişikliğinde de iade edilmez`
        },
        {
          title: "6. CHECK-IN / CHECK-OUT KURALLARI",
          content: `**Giriş İşlemleri:**
- Check-in Saati: 14:00
- Erken giriş müsaitliğe bağlıdır
- Geçerli kimlik belgesi/pasaport zorunludur
- Rezervasyon sahibi check-in yapmalıdır
- Misafir sayısı rezervasyonda belirtilen sayıyı aşamaz

**Çıkış İşlemleri:**
- Check-out Saati: 11:00
- Geç çıkış ek ücrete tabidir (saatlik ücretlendirme)
- Anahtarlar teslim edilmelidir
- Eksik/hasarlı eşya kontrolü yapılır`
        },
        {
          title: "7. KONAKLAMA KURALLARI",
          content: `**Genel Kurallar:**
- Sigara içmek yasaktır (balkon hariç)
- Evcil hayvan kabul edilmez
- Parti/etkinlik düzenlenemez
- Gürültü yapılmamalıdır (özellikle 22:00-08:00 arası)
- Misafir sayısı rezervasyondaki sayıyı aşamaz

**Hasar ve Kayıplar:**
- Oluşan hasarlar misafir tarafından tazmin edilir
- Kayıp eşyalar faturalandırılır
- Kaza/hasar durumunda derhal bildirim yapılmalıdır
- Temizlik kurallarına uyulmalıdır`
        },
        {
          title: "8. SORUMLULUKLAR",
          content: `**Şirket Sorumlulukları:**
- Rezervasyon işlemlerini düzgün yürütmek
- Tanıtılan standartta hizmet sunmak
- Kişisel verileri korumak
- 7/24 müşteri desteği sağlamak
- Güvenli konaklama ortamı sunmak

**Kullanıcı Sorumlulukları:**
- Doğru ve güncel bilgi vermek
- Konaklama kurallarına uymak
- Ödemeleri zamanında yapmak
- Diğer misafirlerin huzurunu bozmamak
- Daire ve eşyalarını özenle kullanmak

**Sorumluluk Sınırları:**
- Şirket, misafirlerin kişisel eşyalarından sorumlu değildir
- Değerli eşyalar için sigorta yaptırılması önerilir
- Force majeure durumlarında sorumluluk kabul edilmez`
        },
        {
          title: "9. KİŞİSEL VERİLER VE GİZLİLİK",
          content: `**Veri Toplama:**
- Kişisel veriler 6698 sayılı KVKK kapsamında korunur
- Sadece hizmet sunumu için gerekli veriler toplanır
- Veriler üçüncü taraflarla izinsiz paylaşılmaz

**Veri Kullanımı:**
- Rezervasyon işlemleri
- Yasal yükümlülükler
- Pazarlama (izniniz dahilinde)
- Hizmet kalitesi geliştirme`
        },
        {
          title: "10. MÜCBİR SEBEPLER",
          content: `Aşağıdaki durumlarda Şirket sorumlu tutulamaz:

- Doğal afetler (deprem, sel, yangın vb.)
- Salgın hastalıklar
- Savaş, terör, ayaklanma
- Grev, lokavt
- Altyapı ve internet kesintileri
- Resmi makam kararları`
        },
        {
          title: "11. UYUŞMAZLIKLARIN ÇÖZÜMÜ",
          content: `• Bu sözleşmeden doğan uyuşmazlıklarda Türk Hukuku uygulanır
- İstanbul (Beyoğlu) Mahkemeleri ve İcra Daireleri yetkilidir
- Tüketici Hakem Heyeti'ne başvuru hakkı saklıdır
- Online çözüm platformları kullanılabilir`
        },
        {
          title: "12. İLETİŞİM",
          content: `**Lagirio Müşteri Hizmetleri:**

- Telefon/WhatsApp: +90 535 511 70 18
- E-posta: info@lagirio.com
- Adres: Şehit Muhtar Mah. Tarlabaşı Blv. 116-120C Beyoğlu/İstanbul
- Çalışma Saatleri: 7/24`
        }
      ]
    },
    en: {
      title: "Terms of Service and Privacy Policy",
      lastUpdated: "Last Updated: 01.01.2024",
      sections: [
        {
          title: "1. PARTIES AND COMPANY INFORMATION",
          content: `This agreement is between Turuncu Konaklama Turizm Organizasyon ve Ticari Limited Şirketi ("Lagirio" or "Company") and the website user ("User").

**Company Information:**
- Name: Turuncu Konaklama Turizm Organizasyon ve Ticari Limited Şirketi
- Address: Şehit Muhtar Mah. Tarlabaşı Blv. 116-120C Beyoğlu/Istanbul
- Tax Office: Beyoğlu
- Tax No: 8721513313
- Phone/WhatsApp: +90 535 511 70 18
- Email: info@lagirio.com
- Web: www.lagirio.com`
        },
        {
          title: "2. SERVICES AND MEMBERSHIP",
          content: `**Our Services:**
- Daily rental apartment reservations
- Tour and activity reservations
- Tourism consultancy
- Concierge services

**Membership Terms:**
- Membership is free
- Must be 18 years or older
- Under 18 requires parental consent
- Information must be accurate and current

**Account Security:**
- User is responsible for password security
- Report security breaches immediately
- Accounts are non-transferable`
        },
        {
          title: "3. RESERVATION AND PRICING",
          content: `**Reservation Process:**
- Automatic confirmation through system
- Confirmation via email and SMS
- Track with reservation number
- Special requests not guaranteed

**Pricing:**
- Prices in Euro (€)
- VAT included
- Tourist tax included
- Cleaning fee included
- Extra services charged separately`
        },
        {
          title: "4. CANCELLATION AND REFUND POLICY",
          content: `**REFUNDABLE RESERVATIONS:**

Cancellation 7+ days before check-in:
- Full refund except guarantee fee
- Guarantee fee is non-refundable

Cancellation less than 7 days:
- No refund
- No date changes accepted

**NON-REFUNDABLE RESERVATIONS:**

For these lower-priced rates:
- No refunds under any circumstances
- No cancellations or changes
- Unused reservations are forfeited`
        },
        {
          title: "5. PAYMENT CONDITIONS",
          content: `**Payment Methods:**
- Credit/Debit Card: Secure 3D payment
- Bank Transfer: Receipt within 24 hours
- Payment at Door: Prior approval required

**Payment Schedule:**
- Immediate charge for online payment
- 24-hour wait for bank transfer
- Expired reservations cancelled

**Guarantee Fee:**
- 15-25% of total for refundable bookings
- Reservation security
- Never refundable
- Not refunded for date changes`
        },
        {
          title: "6. CHECK-IN / CHECK-OUT",
          content: `**Check-in:**
- Check-in Time: 14:00
- Early check-in subject to availability
- Valid ID/passport required
- Reservation holder must check-in
- Guest count cannot exceed reservation

**Check-out:**
- Check-out Time: 11:00
- Late check-out incurs fees
- Keys must be returned
- Inspection for damages`
        },
        {
          title: "7. ACCOMMODATION RULES",
          content: `**General Rules:**
- No smoking (except balcony)
- No pets allowed
- No parties/events
- No noise (especially 22:00-08:00)
- Guest limit per reservation

**Damages and Losses:**
- Guest liable for damages
- Lost items will be billed
- Report accidents immediately
- Follow cleaning rules`
        },
        {
          title: "8. RESPONSIBILITIES",
          content: `**Company Responsibilities:**
- Process reservations properly
- Provide advertised service standard
- Protect personal data
- 24/7 customer support
- Provide safe accommodation

**User Responsibilities:**
- Provide accurate information
- Follow accommodation rules
- Make timely payments
- Respect other guests
- Use property carefully`
        },
        {
          title: "9. PERSONAL DATA AND PRIVACY",
          content: `**Data Collection:**
- Personal data protected under GDPR/KVKK
- Only necessary data collected
- No unauthorized third-party sharing

**Data Usage:**
- Reservation processing
- Legal obligations
- Marketing (with consent)
- Service improvement`
        },
        {
          title: "10. FORCE MAJEURE",
          content: `Company not liable for:

- Natural disasters
- Pandemics
- War, terrorism
- Strikes
- Infrastructure/internet outages
- Government decisions`
        },
        {
          title: "11. DISPUTE RESOLUTION",
          content: `• Turkish Law applies
- Istanbul (Beyoğlu) Courts have jurisdiction
- Consumer arbitration rights reserved
- Online resolution platforms available`
        },
        {
          title: "12. CONTACT",
          content: `**Lagirio Customer Service:**

- Phone/WhatsApp: +90 535 511 70 18
- Email: info@lagirio.com
- Address: Şehit Muhtar Mah. Tarlabaşı Blv. 116-120C Beyoğlu/Istanbul
- Hours: 24/7`
        }
      ]
    }
  };



  const content = termsContent[displayLang] || termsContent.en;

    // Modal başlığı için de kontrol ekleyin
  const modalTitle = currentLang === 'ar' ? 'الشروط والأحكام' : 
                     currentLang === 'ru' ? 'Условия использования' :
                     content.title;



  const toggleSection = (index: number) => {
    setExpandedSections(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const isBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 10;
    setScrolledToBottom(isBottom);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] shadow-2xl flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0a2e23] to-[#1a4a3a] text-white p-6 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText size={24} />
            <div>
              <h3 className="text-xl font-bold">{modalTitle}</h3>
              <p className="text-sm opacity-80 mt-1">{content.lastUpdated}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="bg-white/20 hover:bg-white/30 p-2 rounded-full transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div 
          className="flex-1 overflow-y-auto p-6 space-y-3"
          onScroll={handleScroll}
        >
          {content.sections.map((section: TermsSection, index: number) => (
            <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection(index)}
                className="w-full px-5 py-4 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between text-left"
              >
                <span className="font-semibold text-gray-800">{section.title}</span>
                {expandedSections.includes(index) ? 
                  <ChevronUp className="text-gray-500" size={20} /> : 
                  <ChevronDown className="text-gray-500" size={20} />
                }
              </button>
              
              {expandedSections.includes(index) && (
                <div className="px-5 py-4 bg-white">
                  <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-line">
                    {section.content}
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Company Shield */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
            <div className="flex items-start gap-3">
              <Shield className="text-blue-600 mt-0.5" size={20} />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">Güvenli İşlem</p>
                <p>Tüm işlemleriniz SSL şifreleme ile korunmaktadır. Kişisel verileriniz 6698 sayılı KVKK kapsamında güvence altındadır.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer - Only show if showAcceptButton is true */}
        {showAcceptButton && (
          <div className="border-t p-4 bg-gray-50 rounded-b-2xl">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                {!scrolledToBottom && "Kabul etmek için tüm koşulları okuyun"}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  {t.close || 'Kapat'}
                </button>
                <button
                  onClick={onAccept}
                  disabled={!scrolledToBottom}
                  className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                    scrolledToBottom
                      ? 'bg-[#CD853F] text-white hover:bg-[#B8733F]'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {t.accept || 'Kabul Et'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Simple footer if not showing accept button */}
        {!showAcceptButton && (
          <div className="border-t p-4 bg-gray-50 rounded-b-2xl flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-[#CD853F] text-white rounded-lg hover:bg-[#B8733F] transition-colors font-semibold"
            >
              {t.close || 'Kapat'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TermsModal;