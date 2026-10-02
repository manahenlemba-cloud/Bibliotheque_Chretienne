import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Sparkles, 
  ScrollText, 
  Mail, 
  ShieldCheck, 
  Menu, 
  X, 
  Bookmark, 
  Search, 
  Compass, 
  MessageSquare, 
  User, 
  LogOut, 
  Layers, 
  HardDrive, 
  WifiOff,
  Headphones,
  History
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useOffline } from '../context/OfflineContext';
import { LanguageBar } from './LanguageBar';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string, bookId?: string) => void;
  favoritesCount: number;
  onOpenAuthModal?: () => void;
  onPreloadView?: (view: string) => void;
  onOpenGlobalSearch?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  currentView, 
  onNavigate, 
  favoritesCount,
  onOpenAuthModal,
  onPreloadView,
  onOpenGlobalSearch
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const { t } = useLanguage();
  const { user, isAuthenticated, logout } = useAuth();
  const { isOnline, stats } = useOffline();

  // Global keyboard shortcut listener for Ctrl+K / Cmd+K
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onOpenGlobalSearch?.();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [onOpenGlobalSearch]);

  const navItems = [
    { id: 'home', label: t('navHome'), icon: Compass },
    { id: 'sermons', label: t('navSermons'), icon: Headphones, badge: t('badgeNew') },
    { id: 'reading-plan', label: t('navReadingPlan'), icon: ScrollText },
    { id: 'spiritual-steps', label: t('navSpiritualSteps'), icon: Layers, badge: '1 Pi 5:10' },
    { id: 'library', label: t('navLibrary'), icon: BookOpen },
    { id: 'bible', label: t('navBible'), icon: ScrollText },
    { id: 'ai', label: t('navAi'), icon: Sparkles, badge: 'IA' },
    { id: 'contact', label: t('navContact'), icon: Mail },
    { id: 'admin', label: t('navAdmin'), icon: ShieldCheck },
  ];

  const handleNav = (viewId: string) => {
    onNavigate(viewId);
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs transition-all">
      {/* Top Banner: Sacred Motto & Language Switcher shortcut */}
      <div className="bg-gradient-to-r from-sky-50 via-sky-100/60 to-amber-50/50 border-b border-sky-100 py-1 px-4 text-xs tracking-wider text-sky-950 font-medium">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <span className="truncate">{t('mottoText')}</span>
          <div className="hidden sm:flex items-center gap-2 pl-4">
            <span className="text-[11px] text-sky-800 font-semibold">{t('langBarLabel')} :</span>
            <LanguageBar variant="header" />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Brand Logo */}
          <button 
            onClick={() => handleNav('home')}
            className="flex items-center gap-3.5 text-left group cursor-pointer focus:outline-none"
            aria-label="Accueil"
          >
            <div className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-sky-600 to-sky-700 p-0.5 shadow-md shadow-sky-600/20 group-hover:shadow-sky-600/35 transition-all duration-300">
              <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-sky-600 group-hover:scale-110 transition-transform duration-300" />
              </div>
            </div>
            <div>
              <span className="font-display font-bold text-base sm:text-lg tracking-wider text-slate-900 block leading-tight group-hover:text-sky-700 transition-colors">
                {t('siteNamePart1')}
              </span>
              <span className="text-[11px] font-bold tracking-widest text-sky-700 uppercase block">
                {t('siteNamePart2')}
              </span>
            </div>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1.5 xl:gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              const isHighlight = (item as any).highlight;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNav(item.id)}
                  onMouseEnter={() => onPreloadView?.(item.id)}
                  className={`relative flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-sky-600 text-white shadow-sm shadow-sky-600/25'
                      : isHighlight
                      ? 'bg-sky-50 text-sky-800 hover:bg-sky-100 border border-sky-200'
                      : 'text-slate-700 hover:text-sky-700 hover:bg-slate-100/80'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : isHighlight ? 'text-sky-700' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded-full ${
                      isActive 
                        ? 'bg-sky-800 text-white' 
                        : 'bg-sky-100 text-sky-800 border border-sky-200'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Action shortcuts, User Profile & Search */}
          <div className="hidden sm:flex items-center gap-2.5">
            {/* Offline IndexedDB indicator */}
            <button
              onClick={() => handleNav('library')}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border transition-colors cursor-pointer font-medium ${
                !isOnline
                  ? 'bg-amber-100 text-black border-amber-300 animate-pulse font-bold'
                  : stats.totalBooks > 0
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-slate-100 text-slate-600 border-slate-200 hover:text-slate-800'
              }`}
              title={!isOnline ? "Mode Hors-Connexion : Vous lisez les livres stockés en cache IndexedDB" : `Stockage hors-ligne IndexedDB (${stats.totalBooks} livre(s) disponible(s), ${stats.totalSizeFormatted})`}
            >
              {!isOnline ? (
                <WifiOff className="w-3.5 h-3.5 text-slate-900" />
              ) : (
                <HardDrive className="w-3.5 h-3.5 text-emerald-600" />
              )}
              <span className="text-black">{!isOnline ? t('navOffline') : `${t('navOffline')} (${stats.totalBooks})`}</span>
            </button>

            <button
              onClick={() => handleNav('library')}
              className="flex items-center gap-1.5 text-xs text-slate-700 hover:text-sky-800 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl border border-slate-200 transition-colors cursor-pointer font-medium"
              title={t('navFavorites')}
            >
              <Bookmark className="w-3.5 h-3.5 text-sky-600" />
              <span>{t('navFavorites')} ({favoritesCount})</span>
            </button>

            {/* Link to Reading History */}
            <button
              onClick={() => handleNav('history')}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border transition-colors cursor-pointer font-medium ${
                currentView === 'history'
                  ? 'bg-sky-600 text-white border-sky-600 shadow-2xs'
                  : 'text-slate-700 hover:text-sky-800 bg-slate-100 hover:bg-slate-200 border-slate-200'
              }`}
              title="Mon Historique de Lecture"
            >
              <History className="w-3.5 h-3.5 text-sky-600" />
              <span className="hidden xl:inline">Historique</span>
            </button>

            {/* Link to My Questions for all users */}
            <button
              onClick={() => handleNav('my-questions')}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border transition-colors cursor-pointer font-medium ${
                currentView === 'my-questions'
                  ? 'bg-sky-600 text-white border-sky-600'
                  : 'text-slate-700 hover:text-sky-800 bg-slate-100 hover:bg-slate-200 border-slate-200'
              }`}
              title={t('navMyQuestions')}
            >
              <MessageSquare className="w-3.5 h-3.5 text-sky-600" />
              <span>{t('navMyQuestions')}</span>
            </button>

            {/* User Auth Pill / Dropdown */}
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 hover:border-sky-300 shadow-2xs transition-all cursor-pointer font-medium"
                >
                  <div className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="max-w-[100px] truncate font-semibold">{user.name}</span>
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95">
                    <div className="px-3 py-2 border-b border-slate-100 text-xs">
                      <p className="font-bold text-slate-900 truncate">{user.name}</p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {user.email || user.name}
                      </p>
                    </div>

                    <div className="py-1 space-y-0.5 text-xs">
                      <button
                        onClick={() => handleNav('history')}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-sky-50 hover:text-sky-800 transition-colors cursor-pointer text-left"
                      >
                        <History className="w-4 h-4 text-sky-600" />
                        <span>Mon Historique de Lecture</span>
                      </button>

                      <button
                        onClick={() => handleNav('my-questions')}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-sky-50 hover:text-sky-800 transition-colors cursor-pointer text-left"
                      >
                        <MessageSquare className="w-4 h-4 text-sky-600" />
                        <span>{t('navQuestionsAndAnswers')}</span>
                      </button>

                      <button
                        onClick={() => handleNav('ask-admin')}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-sky-50 hover:text-sky-800 transition-colors cursor-pointer text-left"
                      >
                        <Mail className="w-4 h-4 text-sky-600" />
                        <span>{t('navAskNewQuestion')}</span>
                      </button>

                      <button
                        onClick={() => {
                          logout();
                          setUserDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer text-left font-medium"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>{t('navLogout')}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => onOpenAuthModal?.()}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-800 text-xs font-semibold transition-all cursor-pointer"
                title={t('navLogin')}
              >
                <Mail className="w-3.5 h-3.5 text-sky-600" />
                <span>{t('navLogin')}</span>
              </button>
            )}

            {/* Global Search Trigger Bar */}
            <button
              onClick={() => onOpenGlobalSearch?.()}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-sky-50 text-slate-600 hover:text-sky-900 border border-slate-200 hover:border-sky-300 shadow-2xs transition-all cursor-pointer group text-xs font-semibold"
              title="Rechercher des livres, versets ou sujets théologiques (Ctrl+K)"
              aria-label="Recherche globale"
            >
              <Search className="w-3.5 h-3.5 text-sky-600 group-hover:scale-110 transition-transform" />
              <span className="hidden xl:inline text-slate-500 group-hover:text-slate-800">Rechercher...</span>
              <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded-md bg-white border border-slate-300 text-[10px] font-mono font-bold text-slate-500 shadow-2xs">
                ⌘K
              </kbd>
            </button>

            {/* Global Language Selector */}
            <div className="pl-1 hidden md:block">
              <LanguageBar variant="header" />
            </div>
          </div>

          {/* Mobile search & menu toggles */}
          <div className="flex items-center gap-1.5 lg:hidden">
            <button
              onClick={() => onOpenGlobalSearch?.()}
              className="p-2.5 rounded-xl bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 transition-colors cursor-pointer"
              title="Recherche globale"
              aria-label="Rechercher"
            >
              <Search className="w-5 h-5 text-sky-700" />
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-xl bg-slate-100 text-slate-800 hover:text-sky-700 border border-slate-200 transition-colors cursor-pointer"
              aria-label="Menu de navigation"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white/98 border-b border-slate-200 px-4 pt-3 pb-6 space-y-3 animate-in slide-in-from-top-2 shadow-xl">
          
          {/* Mobile Global Search Trigger */}
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenGlobalSearch?.();
            }}
            className="w-full flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-sky-50 to-slate-50 border border-sky-200/80 text-sky-950 text-xs font-bold shadow-2xs group cursor-pointer hover:border-sky-300 transition-all"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-xl bg-sky-600 text-white shadow-2xs">
                <Search className="w-3.5 h-3.5" />
              </div>
              <div className="text-left">
                <span className="block text-slate-900 font-bold">Recherche Globale</span>
                <span className="block text-[10px] text-slate-500 font-medium">Livres, Versets, Théologie & 5 Étapes</span>
              </div>
            </div>
            <span className="px-2 py-1 rounded-lg bg-sky-600 text-white text-[10px] font-bold shadow-2xs">
              Ouvrir
            </span>
          </button>

          {/* Mobile Language Bar */}
          <LanguageBar variant="mobile" />

          {/* User Profile on Mobile */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
            {isAuthenticated && user ? (
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block truncate max-w-[140px]">{user.name}</span>
                    <span className="text-[10px] text-slate-500 block truncate max-w-[140px]">{user.email || user.name}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleNav('my-questions')}
                    className="px-2.5 py-1 rounded-lg bg-sky-100 text-sky-800 text-xs font-semibold"
                  >
                    {t('navMyQuestions')}
                  </button>
                  <button
                    onClick={() => logout()}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600"
                    title={t('navLogout')}
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="w-full flex items-center gap-2">
                <button
                  onClick={() => handleNav('my-questions')}
                  className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-sky-600" />
                  <span>{t('navMyQuestions')}</span>
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAuthModal?.();
                  }}
                  className="flex-1 py-2 px-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>{t('navLogin')}</span>
                </button>
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <div className="space-y-1 pt-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              const isHighlight = (item as any).highlight;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNav(item.id)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-sky-600 text-white'
                      : isHighlight
                      ? 'bg-sky-50 text-sky-800 border border-sky-200'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-sky-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : isHighlight ? 'text-sky-700' : 'text-slate-500'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 px-2 flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleNav('history')}
                className="flex items-center gap-1.5 text-slate-800 font-semibold"
              >
                <History className="w-3.5 h-3.5 text-sky-600" />
                <span>Mon Historique</span>
              </button>

              <button
                onClick={() => handleNav('library')}
                className="flex items-center gap-1.5 text-sky-700 font-medium"
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>{t('navFavorites')} ({favoritesCount})</span>
              </button>

              <button
                onClick={() => handleNav('library')}
                className="flex items-center gap-1 text-emerald-700 font-medium"
              >
                <HardDrive className="w-3.5 h-3.5" />
                <span>{t('navOffline')} ({stats.totalBooks})</span>
              </button>
            </div>
            <span>LSG 1910</span>
          </div>
        </div>
      )}
    </header>
  );
};
