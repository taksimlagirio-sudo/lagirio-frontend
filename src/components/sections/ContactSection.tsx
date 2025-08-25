import React from 'react';
import { Phone, Mail, MapPin } from 'lucide-react';
interface ContactSectionProps {
translations: any;
currentLang: string;
}
const ContactSection: React.FC<ContactSectionProps> = ({
translations,
currentLang
}) => {
const t = translations[currentLang];
return (
<section className="px-6 lg:px-12 py-20 bg-[#0a2e23]">
<div className="max-w-4xl mx-auto text-center">
<h3 className="text-4xl font-bold text-white mb-12">{t.contact}</h3>
    <div className="grid md:grid-cols-3 gap-8 mb-12">
      <div className="flex flex-col items-center">
        <div className="bg-[#1a7a60] w-16 h-16 rounded-full flex items-center justify-center mb-4">
          <Phone className="text-white" size={28} />
        </div>
        <h4 className="text-xl font-semibold text-white mb-2">
          {t.phone}
        </h4>
        <p className="text-[#a8d5c7]">+90.553.123.4567</p>
      </div>

      <div className="flex flex-col items-center">
        <div className="bg-[#1a7a60] w-16 h-16 rounded-full flex items-center justify-center mb-4">
          <Mail className="text-white" size={28} />
        </div>
        <h4 className="text-xl font-semibold text-white mb-2">
          {t.email}
        </h4>
        <p className="text-[#a8d5c7]">info@lagirio.com</p>
      </div>

      <div className="flex flex-col items-center">
        <div className="bg-[#1a7a60] w-16 h-16 rounded-full flex items-center justify-center mb-4">
          <MapPin className="text-white" size={28} />
        </div>
        <h4 className="text-xl font-semibold text-white mb-2">
          {t.address}
        </h4>
        <p className="text-[#a8d5c7]">İstanbul, Türkiye</p>
      </div>
    </div>

    <button className="bg-[#f5e6d3] text-[#0a2e23] px-10 py-4 rounded-full font-semibold hover:bg-[#e8d9c6] transform hover:scale-105 transition-all text-lg">
      {t.sendMessage}
    </button>
  </div>
</section>
);
};
export default ContactSection;