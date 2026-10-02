import React, { useState } from 'react';
import { 
  X, 
  Share2, 
  Copy, 
  Check, 
  ExternalLink, 
  BookOpen, 
  Sparkles,
  MessageCircle,
  Smartphone
} from 'lucide-react';
import { Book } from '../types';

interface BookShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  book: Book;
}

export const BookShareModal: React.FC<BookShareModalProps> = ({
  isOpen,
  onClose,
  book
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedQuote, setCopiedQuote] = useState(false);
  const [copiedInstagram, setCopiedInstagram] = useState(false);

  if (!isOpen) return null;

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/?view=book&book=${encodeURIComponent(book.id)}`
    : `/?view=book&book=${encodeURIComponent(book.id)}`;

  const shareTitle = `« ${book.title} » par ${book.author}`;
  const shareDescription = `Découvrez et lisez l'ouvrage chrétien « ${book.title} » du ${book.author} sur La Bibliothèque Chrétienne de la Dernière Heure.`;

  const isWebShareSupported = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  // 1. Native Web Share API
  const handleNativeShare = async () => {
    if (!isWebShareSupported) return;
    try {
      await navigator.share({
        title: book.title,
        text: `${shareDescription}\n\n`,
        url: shareUrl
      });
      onClose();
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.warn('Native share error:', err);
      }
    }
  };

  // 2. WhatsApp Share
  const handleWhatsAppShare = () => {
    const text = `📖 *${book.title}*\n✍️ _${book.author}_\n\n${shareDescription}\n\n🔗 *Lien de lecture directe :*\n${shareUrl}`;
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  // 3. Facebook Share
  const handleFacebookShare = () => {
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareTitle + ' — ' + shareDescription)}`;
    window.open(fbUrl, '_blank', 'noopener,noreferrer,width=620,height=520');
  };

  // 4. Instagram Share
  const handleInstagramShare = async () => {
    const igText = `📖 Livre : ${book.title}\n✍️ Auteur : ${book.author}\n🕊️ Catégorie : ${book.category}\n\n« ${book.description || shareDescription} »\n\n🔗 À lire sur La Bibliothèque Chrétienne de la Dernière Heure :\n${shareUrl}`;
    try {
      await navigator.clipboard.writeText(igText);
      setCopiedInstagram(true);
      setTimeout(() => setCopiedInstagram(false), 3000);
      // Open Instagram in new tab
      window.open('https://www.instagram.com/', '_blank', 'noopener,noreferrer');
    } catch {
      window.open('https://www.instagram.com/', '_blank', 'noopener,noreferrer');
    }
  };

  // 5. Copy direct URL to clipboard
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // Fallback
    }
  };

  // 6. Copy full formatted study quote
  const handleCopyQuote = async () => {
    const studyText = `📖 Ouvrage : ${book.title}\n✍️ Auteur : ${book.author}\n📚 Catégorie : ${book.category}\n🕊️ Corpus : Bibliothèque Chrétienne de la Dernière Heure\n🔗 Lien de lecture directe : ${shareUrl}`;
    try {
      await navigator.clipboard.writeText(studyText);
      setCopiedQuote(true);
      setTimeout(() => setCopiedQuote(false), 2500);
    } catch {
      // Fallback
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl text-slate-100 space-y-6 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Share2 className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white leading-tight">
                Partager cet ouvrage
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Répandez la saine doctrine et édifiez vos frères et sœurs en Christ
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Book Preview Pill */}
        <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex items-center gap-3.5">
          <div className="w-12 h-16 rounded-xl overflow-hidden bg-slate-800 border border-slate-700/60 flex-shrink-0 shadow-sm">
            {book.cover_image ? (
              <img src={book.cover_image} alt={book.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[9px] font-bold text-sky-300 p-1 text-center">
                LIVRE
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-md border border-sky-500/20">
              {book.category}
            </span>
            <h3 className="text-xs sm:text-sm font-bold text-white truncate mt-1">
              {book.title}
            </h3>
            <p className="text-[11px] text-slate-400 truncate">
              {book.author}
            </p>
          </div>
        </div>

        {/* Primary Share Options */}
        <div className="space-y-2.5">
          
          {/* 1. Native Web Share API (if supported) */}
          {isWebShareSupported && (
            <button
              type="button"
              onClick={handleNativeShare}
              className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-500 hover:to-sky-600 text-white font-bold text-xs sm:text-sm shadow-md shadow-sky-600/20 transition-all flex items-center justify-between group cursor-pointer border border-sky-400/30"
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-xl bg-white/20">
                  <Smartphone className="w-4 h-4 text-white" />
                </div>
                <div className="text-left">
                  <span className="block font-bold">Partage système (Applications mobiles)</span>
                  <span className="block text-[11px] text-sky-100 font-normal">Envoyer via n'importe quelle application installée</span>
                </div>
              </div>
              <Share2 className="w-4 h-4 text-white/80 group-hover:scale-110 transition-transform" />
            </button>
          )}

          {/* Social Channels Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            
            {/* WhatsApp */}
            <button
              type="button"
              onClick={handleWhatsAppShare}
              className="p-3 rounded-2xl bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/30 text-white transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-1.5 group"
            >
              {/* WhatsApp SVG Icon */}
              <div className="w-9 h-9 rounded-xl bg-[#25D366] text-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.592 2.654-.696c1.029.575 1.774.887 2.806.887 3.181 0 5.767-2.587 5.768-5.766.001-3.182-2.585-5.77-5.768-5.77zm3.362 8.169c-.145.408-.847.785-1.18.834-.334.05-.769.076-2.483-.635-1.714-.712-2.827-2.457-2.912-2.571-.086-.115-.697-.927-.697-1.768 0-.842.438-1.255.594-1.428.156-.173.341-.216.455-.216.114 0 .228.001.328.006.104.006.244-.04.382.292.145.349.497 1.215.54 1.303.044.088.073.19.014.305-.058.115-.088.187-.174.288-.087.102-.182.228-.261.306-.088.087-.18.182-.077.36.103.177.458.756.983 1.224.675.602 1.244.788 1.421.875.177.088.281.074.386-.046.105-.12.449-.523.569-.702.12-.179.24-.15.405-.088.165.061 1.05.495 1.23.585.18.09.3.135.344.212.044.077.044.448-.101.856z" />
                </svg>
              </div>
              <span className="text-xs font-bold text-[#4ADE80]">WhatsApp</span>
              <span className="text-[10px] text-slate-400">Discussion & Statut</span>
            </button>

            {/* Facebook */}
            <button
              type="button"
              onClick={handleFacebookShare}
              className="p-3 rounded-2xl bg-[#1877F2]/15 hover:bg-[#1877F2]/25 border border-[#1877F2]/30 text-white transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-1.5 group"
            >
              {/* Facebook SVG Icon */}
              <div className="w-9 h-9 rounded-xl bg-[#1877F2] text-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </div>
              <span className="text-xs font-bold text-[#60A5FA]">Facebook</span>
              <span className="text-[10px] text-slate-400">Fil d'actualité</span>
            </button>

            {/* Instagram */}
            <button
              type="button"
              onClick={handleInstagramShare}
              className="p-3 rounded-2xl bg-[#E1306C]/15 hover:bg-[#E1306C]/25 border border-[#E1306C]/30 text-white transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-1.5 group"
            >
              {/* Instagram Gradient SVG Icon */}
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF] text-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </div>
              <span className="text-xs font-bold text-[#F472B6]">Instagram</span>
              <span className="text-[10px] text-slate-400">
                {copiedInstagram ? 'Copié & ouvert !' : 'Story & Message'}
              </span>
            </button>

          </div>

        </div>

        {/* Direct Link Copy Bar */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
            Lien direct de lecture
          </label>
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-950 border border-slate-800">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="flex-1 bg-transparent px-3 text-xs text-slate-300 font-mono focus:outline-none select-all truncate"
            />
            <button
              type="button"
              onClick={handleCopyLink}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 flex-shrink-0 ${
                copiedLink
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'bg-sky-600 hover:bg-sky-500 text-white'
              }`}
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Copié !</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copier</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Copy with Study Summary & Quote */}
        <div className="pt-2 border-t border-slate-800/80">
          <button
            type="button"
            onClick={handleCopyQuote}
            className="w-full py-2.5 px-3 rounded-2xl bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            {copiedQuote ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Citation complète et lien copiés pour vos groupes !</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-sky-400" />
                <span>Copier le texte de présentation complet (pour groupes de prière)</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
