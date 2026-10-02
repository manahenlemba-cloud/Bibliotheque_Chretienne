import React from 'react';
import { BookOpen, ShieldCheck, Mail, Heart, ScrollText, Sparkles, Phone, UserCheck, Church, Headphones } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface FooterProps {
  onNavigate: (view: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const { t } = useLanguage();

  return (
    <footer className="bg-slate-100/95 border-t border-slate-200 text-slate-600 transition-colors">
      {/* Top Leadership & Church Header Banner */}
      <div className="bg-gradient-to-r from-sky-900 via-sky-800 to-indigo-900 text-white py-5 px-4 sm:px-6 lg:px-8 border-b border-sky-700/50 shadow-inner">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 border border-white/20">
              <Church className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <p className="text-sm sm:text-base font-semibold text-white tracking-wide">
                « {t('overseerNoticeText')} »
              </p>
              <p className="text-xs text-sky-200 font-medium mt-0.5">
                Église Cereshe/OUA • Centre du Réveil Spirituel de la dernière Heure / Ministère d'Évangélisation Internationale
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('contact')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all flex-shrink-0 cursor-pointer"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>{t('footerContactPastorsBtn')}</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          
          {/* Mission & Creator column */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-sky-600/20">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <span className="font-display font-bold text-slate-900 text-sm tracking-wider block">
                  {t('siteNamePart1')}
                </span>
                <span className="text-[10px] font-bold tracking-widest text-sky-700 uppercase block">
                  {t('siteNamePart2')}
                </span>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
              {t('heroSubtitle')}
            </p>
            
            {/* Creator acknowledgment */}
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1">
              <span className="text-[10px] uppercase font-bold text-sky-700 tracking-wider flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-sky-600" />
                <span>{t('footerAuthorRole')}</span>
              </span>
              <p className="text-xs font-bold text-slate-900">
                {t('authorOfficialName')}
              </p>
              <p className="text-[11px] text-slate-500">
                « {t('showcase5StepsLabel')} » (1 Pierre 5:10)
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="space-y-3">
            <h4 className="font-display font-bold text-slate-900 text-sm tracking-wider uppercase">
              {t('footerSectionsTitle')}
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm font-medium">
              <li>
                <button 
                  onClick={() => onNavigate('home')} 
                  className="hover:text-sky-700 transition-colors text-left flex items-center gap-2 cursor-pointer"
                >
                  <span>{t('navHome')}</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate('sermons')} 
                  className="hover:text-sky-700 transition-colors text-left flex items-center gap-2 cursor-pointer text-sky-800 font-semibold"
                >
                  <Headphones className="w-3.5 h-3.5 text-sky-600" />
                  <span>{t('footerSermons')}</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate('reading-plan')} 
                  className="hover:text-sky-700 transition-colors text-left flex items-center gap-2 cursor-pointer text-emerald-800 font-semibold"
                >
                  <ScrollText className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{t('footerReadingPlan')}</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate('library')} 
                  className="hover:text-sky-700 transition-colors text-left flex items-center gap-2 cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5 text-sky-600" />
                  <span>{t('navLibrary')}</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate('bible')} 
                  className="hover:text-sky-700 transition-colors text-left flex items-center gap-2 cursor-pointer"
                >
                  <ScrollText className="w-3.5 h-3.5 text-sky-600" />
                  <span>{t('navBible')}</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate('ai')} 
                  className="hover:text-sky-700 transition-colors text-left flex items-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>{t('footerTheologicalAi')}</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Direct Pastors & Admin Contact Info */}
          <div className="space-y-3">
            <h4 className="font-display font-bold text-slate-900 text-sm tracking-wider uppercase">
              {t('footerPastoralDirection')}
            </h4>
            <div className="space-y-2.5 text-xs sm:text-sm">
              {/* Pasteur Principal */}
              <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">{t('footerSeniorPastorLabel')} :</span>
                <p className="font-bold text-slate-900 text-xs mt-0.5">
                  {t('overseerPastorName')}
                </p>
                <a 
                  href="tel:+243817974033"
                  className="text-sky-700 hover:text-sky-800 font-mono font-bold flex items-center gap-1.5 mt-1 text-xs"
                >
                  <Phone className="w-3 h-3 text-sky-600" />
                  <span>+243 817 974 033</span>
                </a>
              </div>

              {/* Pasteur Adjoint */}
              <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">{t('footerAssistantPastorLabel')} :</span>
                <p className="font-bold text-slate-900 text-xs mt-0.5">
                  Le Pasteur LUKANGILA FARIALA Manassé
                </p>
                <a 
                  href="tel:+243823844629"
                  className="text-sky-700 hover:text-sky-800 font-mono font-bold flex items-center gap-1.5 mt-1 text-xs"
                >
                  <Phone className="w-3 h-3 text-sky-600" />
                  <span>+243 823 844 629</span>
                </a>
              </div>

              {/* Administrateur du site (en dessous des pasteurs) */}
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-300/80 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-amber-900 font-extrabold uppercase block">{t('footerAdminLabel')} :</span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-400 text-slate-950 uppercase">Admin</span>
                </div>
                <p className="font-bold text-slate-900 text-xs mt-0.5">
                  {t('authorOfficialName')}
                </p>
                <div className="mt-1 space-y-0.5">
                  <a 
                    href="tel:+243811733778"
                    className="text-amber-800 hover:text-amber-950 font-mono font-bold flex items-center gap-1.5 text-xs"
                  >
                    <Phone className="w-3 h-3 text-amber-600" />
                    <span>{t('footerTelLabel')} : +243811733778</span>
                  </a>
                  <a 
                    href="mailto:bibliothequechretien@gmail.com"
                    className="text-amber-800 hover:text-amber-950 font-medium flex items-center gap-1.5 text-xs"
                  >
                    <Mail className="w-3 h-3 text-amber-600" />
                    <span>{t('footerEmailLabel')} : bibliothequechretien@gmail.com</span>
                  </a>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 flex items-center gap-1.5 font-medium">
                <Church className="w-3.5 h-3.5 text-slate-400" />
                <span>Église Cereshe/OUA</span>
              </p>
            </div>
          </div>

          {/* Spiritual Verse & Admin Access */}
          <div className="space-y-4">
            <h4 className="font-display font-bold text-slate-900 text-sm tracking-wider uppercase">
              {t('footerWatchTitle')}
            </h4>
            <div className="p-4 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 italic leading-relaxed shadow-xs">
              « {t('footerWatchVerseText')} »
              <span className="block not-italic font-bold text-sky-700 text-right mt-1.5">
                — {t('footerWatchVerseRef')}
              </span>
            </div>
            <div>
              <button
                onClick={() => onNavigate('admin')}
                className="inline-flex items-center gap-2 text-xs px-3.5 py-2 rounded-xl bg-white hover:bg-sky-50 text-slate-700 hover:text-sky-800 border border-slate-200 hover:border-sky-300 font-semibold shadow-2xs transition-all cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
                <span>{t('navAdmin')}</span>
              </button>
            </div>
          </div>

        </div>

        {/* Bottom copyright - Note: "Maranatha" is completely removed as requested */}
        <div className="border-t border-slate-200 pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>
            © {new Date().getFullYear()} {t('siteName')} • Église Cereshe/OUA.
          </p>
          <div className="flex items-center gap-4">
            <span>{t('footerMultiVersions')}</span>
            <span className="hidden sm:inline text-slate-300">•</span>
            <span className="text-sky-700 font-semibold">« {t('footerGodGloryAlone')} »</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
