import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Mail, ShieldCheck, ArrowRight, CheckCircle2, AlertTriangle, Sparkles, User } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const {
    authModalOpen,
    closeAuthModal,
    loginWithGoogle,
    loginAsDemoUser
  } = useAuth();

  // Google form state
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');

  // UI status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!authModalOpen) return null;

  const handleGoogleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const emailTrimmed = googleEmail.trim();
    if (!emailTrimmed || !emailTrimmed.includes('@')) {
      setError('Veuillez saisir une adresse Gmail valide (ex : votre.nom@gmail.com).');
      return;
    }

    setLoading(true);
    try {
      const res = await loginWithGoogle({
        email: emailTrimmed,
        name: googleName.trim() || undefined
      });
      if (!res.success) {
        setError(res.error || '❌ Impossible de vous authentifier avec Gmail. Veuillez réessayer.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (email: string, name: string) => {
    setError(null);
    setLoading(true);
    try {
      const res = await loginWithGoogle({ email, name });
      if (!res.success) {
        setError(res.error || 'Erreur lors de la connexion.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div 
        className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl shadow-sky-950/60 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header decoration */}
        <div className="bg-gradient-to-r from-sky-950 via-slate-900 to-indigo-950/50 p-5 border-b border-slate-800 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-slate-100 text-lg flex items-center gap-2">
                <span>🔐 Connexion avec Gmail</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Authentification par compte Google / Gmail
              </p>
            </div>
          </div>
          <button
            onClick={closeAuthModal}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2.5 animate-shake">
              <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="text-xs text-slate-300 bg-sky-950/30 border border-sky-500/20 p-3.5 rounded-xl space-y-1">
            <p className="font-semibold text-sky-300 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              <span>Accès réservé aux fidèles & lecteurs</span>
            </p>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Connectez-vous pour poser vos questions sur les livres du site, échanger avec l'administrateur et recevoir ses réponses sur la plateforme et par e-mail.
            </p>
          </div>

          <form onSubmit={handleGoogleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Votre Adresse Gmail <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4 text-sky-400" />
                </div>
                <input
                  type="email"
                  required
                  value={googleEmail}
                  onChange={(e) => setGoogleEmail(e.target.value)}
                  placeholder="exemple.chretien@gmail.com"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Votre Nom ou Prénom <span className="text-slate-500 text-[10px] font-normal">(facultatif)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={googleName}
                  onChange={(e) => setGoogleName(e.target.value)}
                  placeholder="Ex : Frère Jean ou Sœur Marie"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm tracking-wide shadow-lg shadow-sky-500/25 transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
            >
              {/* Google G icon */}
              <svg className="w-4 h-4 bg-white rounded-full p-0.5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>{loading ? 'Connexion en cours...' : 'Se connecter avec mon compte Gmail'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Guest / Visitor Interaction Option */}
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={closeAuthModal}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-sky-300 text-xs font-medium border border-slate-700/60 transition-colors cursor-pointer"
            >
              💬 Continuer sans compte Gmail (Mode Visiteur Ouvert)
            </button>
            <p className="text-[10px] text-slate-500 mt-1.5">
              Vous pouvez poser vos questions et consulter vos échanges librement sans vous connecter.
            </p>
          </div>

          {/* Quick Demo Access for convenience */}
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <span className="text-[11px] font-semibold text-slate-400 block text-center">
              Comptes de démonstration rapide :
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('grace.mbemba@gmail.com', 'Sœur Grace Mbemba')}
                className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 text-left transition-colors cursor-pointer group"
              >
                <span className="block font-semibold text-xs text-slate-200 group-hover:text-sky-300">
                  Sœur Grace Mbemba
                </span>
                <span className="text-[10px] text-slate-400 truncate block">
                  grace.mbemba@gmail.com
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('david.kalombo@gmail.com', 'Frère David Kalombo')}
                className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 text-left transition-colors cursor-pointer group"
              >
                <span className="block font-semibold text-xs text-slate-200 group-hover:text-sky-300">
                  Frère David Kalombo
                </span>
                <span className="text-[10px] text-slate-400 truncate block">
                  david.kalombo@gmail.com
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950/60 border-t border-slate-800 text-center text-[11px] text-slate-500">
          La Bibliothèque Chrétienne de la Dernière Heure • Respect strict de vos données
        </div>
      </div>
    </div>
  );
};
