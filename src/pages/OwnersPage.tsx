import React from 'react';
import Header from '../components/common/Header';
interface OwnersPageProps {
currentLang: string;
setCurrentLang: (lang: string) => void;
translations: any;
setShowLoginModal: (show: boolean) => void;
setCurrentView: (view: string) => void;
}
const OwnersPage: React.FC<OwnersPageProps> = ({
currentLang,
setCurrentLang,
translations,
setShowLoginModal,
setCurrentView
}) => {
const t = translations[currentLang];
return (
<div className="min-h-screen bg-[#0a2e23] flex items-center justify-center">
<Header 
     transparent={true}
     currentLang={currentLang}
     setCurrentLang={setCurrentLang}
     translations={translations}
     setShowLoginModal={setShowLoginModal}
     setCurrentView={setCurrentView}
   />
<div className="max-w-4xl mx-auto px-6 lg:px-12 text-center">
<h2 className="text-5xl font-bold text-white mb-8">
{t.propertyOwners}
</h2>
<div className="bg-white/10 backdrop-blur-sm rounded-3xl p-20">
<p className="text-2xl text-white/70">{t.comingSoon}</p>
</div>
</div>
</div>
);
};
export default OwnersPage;