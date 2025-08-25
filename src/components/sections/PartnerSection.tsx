import React from 'react';
import { Star } from 'lucide-react';

interface PartnerSectionProps {
  currentLang: string;
  translations: any;
}

const PartnerSection: React.FC<PartnerSectionProps> = ({ currentLang, translations }) => {
  const t = translations[currentLang];

  const partners = [
    {
      name: "Airbnb",
      logo: "https://download.logo.wine/logo/Airbnb/Airbnb-Logo.wine.png",
      rating: 4.9,
      reviews: "1000+",
      link: "https://www.airbnb.com.tr/users/show/8912265"
    },
    {
      name: "Booking.com",
      logo: "https://logo-marque.com/wp-content/uploads/2021/08/Booking.com-Logo.png",
      rating: 9.5,
      reviews: "500+",
      link: "https://www.booking.com/hotel/tr/orange-residence.tr.html",
      isBooking: true
    },
    {
      name: "Google",
      logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Google_Favicon_2025.svg/800px-Google_Favicon_2025.svg.png",
      rating: 4.7,
      reviews: "20+",
      link: "https://www.google.com/travel/search?q=lagirio+residence"
    }
  ];

  return (
    <section className="px-6 lg:px-12 py-12 md:py-16 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8 md:mb-10">
          <h3 className="text-xl md:text-2xl font-bold text-[#0a2e23] mb-2 md:mb-3">
            {t.trustedPlatformsTitle}
          </h3>
          <p className="text-sm md:text-base text-gray-600">
            {t.trustedPlatformsSubtitle}
          </p>
        </div>

        {/* Mobile Carousel */}
        <div className="md:hidden">
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 -mx-6 px-6 snap-x snap-mandatory">
            {partners.map((partner) => (
              <a
                key={partner.name}
                href={partner.link}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white rounded-2xl shadow-lg p-6 text-center hover:shadow-xl transition-all flex-shrink-0 w-72 snap-center"
              >
                <div className="mb-4 flex items-center justify-center">
                  <img
                    src={partner.logo}
                    alt={partner.name}
                    className={partner.name === "Airbnb" ? "h-16 object-contain" : "h-12 object-contain"}
                    loading="lazy" 
                  />
                </div>

                {partner.isBooking ? (
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <div className="bg-[#003580] text-white rounded-lg px-3 py-1.5">
                      <span className="text-2xl font-bold">{partner.rating}</span>
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-gray-800">{t.excellentRating}</p>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} className="w-3 h-3 fill-[#003580] text-[#003580]" />
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-1.5 mb-2">
                    <span className="text-3xl font-bold text-gray-800">{partner.rating}</span>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  </div>
                )}
                
                <p className="text-gray-600 text-xs">
                  {partner.reviews} {t.reviews || t.ratingScore}
                </p>
              </a>
            ))}
          </div>
          
          {/* Scroll Indicators */}
          <div className="flex justify-center gap-2 mt-4">
            {partners.map((_, index) => (
              <div
                key={index}
                className="w-1.5 h-1.5 rounded-full bg-gray-300 transition-all"
              />
            ))}
          </div>
        </div>

        {/* Desktop Grid */}
        <div className="hidden md:grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {partners.map((partner) => (
            <a
              key={partner.name}
              href={partner.link}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white rounded-2xl shadow-lg p-8 text-center hover:shadow-xl transition-all transform hover:scale-105 cursor-pointer"
            >
              <div className="mb-6 flex items-center justify-center space-x-4">
                <img
                  src={partner.logo}
                  alt={partner.name}
                  className={partner.name === "Airbnb" ? "h-20 object-contain" : "h-16 object-contain"}
                  loading="lazy" 
                />
              </div>

              {partner.isBooking ? (
                <div className="flex items-center justify-center space-x-3 mb-3">
                  <div className="bg-[#003580] text-white rounded-lg px-4 py-2">
                    <span className="text-3xl font-bold">{partner.rating}</span>
                  </div>
                  <div className="text-left">
                    <p className="text-lg font-semibold text-gray-800">{t.excellentRating}</p>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className="w-4 h-4 fill-[#003580] text-[#003580]" />
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2 mb-3">
                  <span className="text-4xl font-bold text-gray-800">{partner.rating}</span>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                </div>
              )}
              
              <p className="text-gray-600 text-sm">
                {partner.reviews} {t.reviews || t.ratingScore}
              </p>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PartnerSection;