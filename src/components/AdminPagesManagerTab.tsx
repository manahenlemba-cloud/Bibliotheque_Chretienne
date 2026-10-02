import React, { useState } from 'react';
import { 
  FileText, 
  Save, 
  ExternalLink, 
  CheckCircle2, 
  FolderOpen, 
  Globe, 
  Layers, 
  BookOpen, 
  Headphones, 
  Calendar, 
  MessageSquare, 
  Sparkles,
  Link,
  Edit3,
  HelpCircle
} from 'lucide-react';
import { SiteSettings, Book } from '../types';

export interface PageContentItem {
  id: string;
  name: string;
  route: string;
  iconName: string;
  description: string;
  title: string;
  subtitle: string;
  introText: string;
  mainActionText: string;
  mainActionDriveUrl?: string;
  customNotes?: string;
  allowPublicComments?: boolean;
}

export interface DriveLinkItem {
  id: string;
  label: string;
  category: string;
  driveUrl: string;
  targetPage: string;
  description?: string;
}

interface Props {
  siteSettings: SiteSettings | null;
  books: Book[];
  onNotify: (type: 'success' | 'error', message: string) => void;
  onRefreshSettings: () => void;
  onRefreshBooks: () => void;
}

export const AdminPagesManagerTab: React.FC<Props> = ({
  siteSettings,
  books,
  onNotify,
  onRefreshSettings,
  onRefreshBooks
}) => {
  // Available pages to configure
  const defaultPages: PageContentItem[] = [
    {
      id: 'home',
      name: 'Accueil & Vitrine',
      route: 'home',
      iconName: 'Home',
      description: "Page principale de la bibliothèque, vitrine de l'ouvrage phare, bannières et photos de couverture.",
      title: siteSettings?.heroTitle || "Bibliothèque Complète de Réveil et de Sanctification",
      subtitle: siteSettings?.heroDescription || "Ouvrages magistraux et études théologiques bibliques fondés sur 1 Pierre 5:10, centrés sur la préparation de l'Église pour le retour glorieux de notre Seigneur Jésus-Christ.",
      introText: siteSettings?.siteNotice || "Base documentaire consacrée à la sainte veille, la sanctification et la préparation au retour du Seigneur Jésus-Christ.",
      mainActionText: "Explorer la Bibliothèque",
      mainActionDriveUrl: siteSettings?.googleDriveUrl || "https://drive.google.com/drive/folders/bibliothequechretien",
      customNotes: "Affiche le verset du jour, la vitrine de photos défilantes et le livre en vedette."
    },
    {
      id: 'library',
      name: 'Bibliothèque & Ouvrages',
      route: 'library',
      iconName: 'BookOpen',
      description: "Collection intégrale de tous les livres et traités spirituels téléchargeables et lisibles en ligne.",
      title: siteSettings?.libraryTitle || "Collection Complète des Ouvrages de Sanctification",
      subtitle: "Consultez, lisez directement en ligne ou téléchargez gratuitement tous les ouvrages au format PDF sur Google Drive.",
      introText: "Tous nos ouvrages sont offerts sans aucun frais pour l'édification du Corps de Christ.",
      mainActionText: "Accéder au dossier Google Drive complet",
      mainActionDriveUrl: siteSettings?.googleDriveUrl || "https://drive.google.com/drive/folders/bibliothequechretien",
      customNotes: "Permet le filtrage par catégories de sanctification, prière, et foi."
    },
    {
      id: 'spiritual-steps',
      name: '5 Étapes Spirituelles',
      route: 'spiritual-steps',
      iconName: 'Layers',
      description: "Étude doctrinale approfondie selon 1 Pierre 5:10 (Appel, Souffrance, Perfectionnement, Affermissement, Fortification).",
      title: "Les 5 Étapes Spirituelles Pour Devenir Chrétien",
      subtitle: "Parcours fondamental de sanctification et d'affermissement fondé sur 1 Pierre 5:10 par le Dr. LEMBA KAVUMBULA Moïse.",
      introText: "« Le Dieu de toute grâce vous perfectionnera lui-même, vous affermira, vous fortifiera, vous rendra inébranlables. »",
      mainActionText: "Télécharger le manuel complet des 5 Étapes (PDF)",
      mainActionDriveUrl: books.find(b => b.id === '1')?.google_drive_url || siteSettings?.googleDriveUrl || "https://drive.google.com/",
      customNotes: "Page clé expliquant pas à pas chaque palier de la croissance dans la sanctification."
    },
    {
      id: 'sermons',
      name: 'Prédications & Sermons Audio/Texte',
      route: 'sermons',
      iconName: 'Headphones',
      description: "Enseignements pastoraux, messages du réveil de la dernière heure et exhortations enregistrées.",
      title: "Prédications & Sermons Apostoliques",
      subtitle: "Écoutez et méditez les sermons prêchés sous la conduite de l'Esprit pour ranimer la flamme de la veille.",
      introText: "Messages délivrés à l'Église Cereshe/OUA et lors des campagnes d'évangélisation internationale.",
      mainActionText: "Dossier Drive des Prédications & Audios",
      mainActionDriveUrl: siteSettings?.googleDriveUrl || "https://drive.google.com/",
      customNotes: "Comprend les transcriptions textuelles et les pistes audio téléchargeables."
    },
    {
      id: 'reading-plan',
      name: 'Plan de Lecture Biblique',
      route: 'reading-plan',
      iconName: 'Calendar',
      description: "Guides chronologiques et systématiques de lecture des Saintes Écritures.",
      title: "Plan de Lecture Biblique & Méditation Quotidienne",
      subtitle: "Nourrissez quotidiennement votre âme avec la sainte Parole de Dieu pour grandir de gloire en gloire.",
      introText: "Parcours structuré pour lire l'Ancien et le Nouveau Testament dans la sanctification.",
      mainActionText: "Télécharger le calendrier de lecture annuel (PDF)",
      mainActionDriveUrl: siteSettings?.googleDriveUrl || "https://drive.google.com/",
      customNotes: "Inclut le suivi de lecture interactif et les passages recommandés du jour."
    },
    {
      id: 'bible',
      name: 'Sainte Bible Multi-Versions',
      route: 'bible',
      iconName: 'BookOpen',
      description: "Lecteur biblique intégral avec versions Louis Segond (LSG), King James (KJV), Ostervald, Darby, Swahili et Lingala.",
      title: "La Sainte Bible — Ancien & Nouveau Testament",
      subtitle: "Lecteur interactif verset par verset avec dictionnaire des racines hébraïques et grecques.",
      introText: "« Toute Écriture est inspirée de Dieu, et utile pour enseigner, convaincre, corriger et instruire dans la justice. »",
      mainActionText: "Télécharger la Bible complète (PDF)",
      mainActionDriveUrl: siteSettings?.googleDriveUrl || "https://drive.google.com/",
      customNotes: "Intègre le lexique théologique avec l'assistance IA Gemini."
    },
    {
      id: 'contact',
      name: 'Contact & Direction Pastorale',
      route: 'contact',
      iconName: 'MessageSquare',
      description: "Coordonnées de l'administrateur Dr. LEMBA KAVUMBULA Moïse, du Pasteur Principal KAYEMBE MWANANGIZI Lawi et du Pasteur Adjoint LUKANGILA FARIALA Manassé.",
      title: "Nous Écrire ou Joindre les Pasteurs",
      subtitle: "Pour toute demande de prière, conseil pastoral, échange sur la sainte doctrine ou question sur les ouvrages.",
      introText: "« Toute cette œuvre est chapeautée par le Serviteur de Dieu KAYEMBE MWANANGIZI Lawi ainsi que les anciens de l'église. »",
      mainActionText: "Écrire directement à l'Administrateur",
      mainActionDriveUrl: "mailto:bibliothequechretien@gmail.com",
      customNotes: "Formulaire de contact relié aux notifications en direct par Email et WhatsApp."
    }
  ];

  // Initialize pages state from siteSettings or defaultPages
  const [pages, setPages] = useState<PageContentItem[]>(() => {
    if (siteSettings?.customPages && siteSettings.customPages.length > 0) {
      return siteSettings.customPages;
    }
    return defaultPages;
  });

  const [selectedPageId, setSelectedPageId] = useState<string>('home');
  const [isSaving, setIsSaving] = useState(false);

  // Drive links manager state
  const [bulkDriveModalOpen, setBulkDriveModalOpen] = useState(false);
  const [activeBookDriveEdit, setActiveBookDriveEdit] = useState<{ id: string; title: string; url: string } | null>(null);

  const selectedPage = pages.find(p => p.id === selectedPageId) || pages[0];

  const handleUpdatePageField = (field: keyof PageContentItem, val: any) => {
    setPages(prev => prev.map(p => p.id === selectedPageId ? { ...p, [field]: val } : p));
  };

  const handleSaveAllPages = async () => {
    setIsSaving(true);
    try {
      // Also sync hero and library title to main settings for backward compatibility
      const homePage = pages.find(p => p.id === 'home');
      const libraryPage = pages.find(p => p.id === 'library');

      const payload = {
        ...siteSettings,
        customPages: pages,
        heroTitle: homePage?.title || siteSettings?.heroTitle,
        heroDescription: homePage?.subtitle || siteSettings?.heroDescription,
        siteNotice: homePage?.introText || siteSettings?.siteNotice,
        libraryTitle: libraryPage?.title || siteSettings?.libraryTitle,
        googleDriveUrl: homePage?.mainActionDriveUrl || siteSettings?.googleDriveUrl
      };

      const res = await fetch('/api/site-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        onNotify('success', 'Toutes les pages et leurs contenus ont été mis à jour avec succès !');
        onRefreshSettings();
      } else {
        onNotify('error', 'Erreur lors de la sauvegarde des contenus de page.');
      }
    } catch (e: any) {
      onNotify('error', 'Erreur de communication avec le serveur.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveBookDriveLink = async (bookId: string, newUrl: string) => {
    try {
      const book = books.find(b => b.id === bookId);
      if (!book) return;

      const res = await fetch(`/api/books/${bookId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...book,
          google_drive_url: newUrl.trim()
        })
      });

      if (res.ok) {
        onNotify('success', `Lien Google Drive mis à jour pour « ${book.title} » !`);
        setActiveBookDriveEdit(null);
        onRefreshBooks();
      } else {
        onNotify('error', 'Erreur lors de la mise à jour du lien Drive du livre.');
      }
    } catch (e) {
      onNotify('error', 'Impossible de contacter le serveur.');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* Top Banner: Full Administrator Powers */}
      <div className="relative rounded-3xl bg-gradient-to-r from-slate-900 via-sky-950 to-indigo-950 border border-sky-500/30 p-6 sm:p-8 overflow-hidden shadow-xl text-white">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center flex-shrink-0 font-bold shadow-lg">
              <Globe className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] uppercase font-extrabold bg-amber-400 text-slate-950">
                  Pouvoir Administrateur Intégral
                </span>
                <span className="text-xs text-sky-300 font-mono">Dr. LEMBA KAVUMBULA Moïse</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-display font-bold">
                Gestionnaire des Pages, Textes & Liens Google Drive
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-3xl">
                Vous avez le plein pouvoir pour modifier n'importe quelle page du site, reformuler les textes, titres, sous-titres, explications et rediriger tous les boutons de téléchargement vers vos fichiers Google Drive.
              </p>
            </div>
          </div>

          <button
            onClick={handleSaveAllPages}
            disabled={isSaving}
            className="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg transition-all flex items-center gap-2 cursor-pointer flex-shrink-0 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Enregistrement...' : 'Enregistrer toutes les modifications'}</span>
          </button>
        </div>
      </div>

      {/* Grid: Left Page Selector, Right Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left: Navigation Pages List */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xs uppercase font-extrabold tracking-wider text-slate-400">
              Sélectionnez la page à modifier
            </h3>
            <span className="text-[11px] text-sky-400 font-mono">{pages.length} pages</span>
          </div>

          <div className="space-y-2">
            {pages.map((p) => {
              const isSelected = p.id === selectedPageId;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedPageId(p.id)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-sky-950/80 border-sky-400 text-white shadow-md'
                      : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-900 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold ${
                      isSelected ? 'bg-sky-500 text-slate-950' : 'bg-slate-800 text-sky-300'
                    }`}>
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <strong className="text-xs sm:text-sm font-bold block">{p.name}</strong>
                      <span className="text-[10px] text-slate-400 block font-mono">Route: /{p.route}</span>
                    </div>
                  </div>
                  {isSelected && (
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-400 shadow-sm shadow-sky-400" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Direct Access to Google Drive Links for all Books */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 mt-6">
            <div className="flex items-center gap-2 text-sky-300 font-bold text-xs">
              <FolderOpen className="w-4 h-4 text-sky-400" />
              <span>Liens Google Drive des Ouvrages ({books.length})</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Modifiez rapidement le lien de téléchargement PDF de n'importe quel livre directement depuis cette interface.
            </p>
            <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
              {books.map((b) => (
                <div key={b.id} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-200 truncate">{b.title}</p>
                    <span className="text-[10px] text-sky-400 truncate block font-mono">
                      {b.google_drive_url.slice(0, 35)}...
                    </span>
                  </div>
                  <button
                    onClick={() => setActiveBookDriveEdit({ id: b.id, title: b.title, url: b.google_drive_url })}
                    className="p-1.5 rounded-lg bg-sky-900/50 hover:bg-sky-900 text-sky-300 text-[11px] font-semibold flex items-center gap-1 cursor-pointer flex-shrink-0"
                    title="Modifier le lien Google Drive"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Modifier</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Page Content & Drive Link Editor */}
        <div className="lg:col-span-8 bg-slate-900/90 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl space-y-6">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30 uppercase">
                  Édition en direct
                </span>
                <h3 className="font-display text-lg sm:text-xl font-bold text-slate-100">
                  Page : {selectedPage.name}
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {selectedPage.description}
              </p>
            </div>

            <a 
              href={`/?view=${selectedPage.route}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 text-xs font-semibold transition-colors"
            >
              <span>Voir la page en direct</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="space-y-5">
            {/* Titre Principal */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
                <span>Titre Principal de la Page</span>
                <span className="text-[10px] text-slate-500 font-normal">Balise H1 / Grand titre</span>
              </label>
              <input
                type="text"
                value={selectedPage.title}
                onChange={(e) => handleUpdatePageField('title', e.target.value)}
                placeholder="Titre de la page..."
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 outline-none focus:border-sky-500 font-medium"
              />
            </div>

            {/* Sous-Titre / Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
                <span>Sous-Titre / Présentation Spirituelle</span>
                <span className="text-[10px] text-slate-500 font-normal">Accroche visible sous le titre</span>
              </label>
              <textarea
                rows={2}
                value={selectedPage.subtitle}
                onChange={(e) => handleUpdatePageField('subtitle', e.target.value)}
                placeholder="Sous-titre explicatif..."
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-200 outline-none focus:border-sky-500 leading-relaxed"
              />
            </div>

            {/* Texte d'Introduction ou Verset Clé */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
                <span>Texte d'Introduction ou Fondement Biblique</span>
                <span className="text-[10px] text-slate-500 font-normal">Exhortation ou verset d'appui</span>
              </label>
              <textarea
                rows={3}
                value={selectedPage.introText}
                onChange={(e) => handleUpdatePageField('introText', e.target.value)}
                placeholder="Texte introductif ou verset..."
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-200 outline-none focus:border-sky-500 leading-relaxed font-serif"
              />
            </div>

            {/* Bouton d'Action & Lien Google Drive */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
              <div className="flex items-center gap-2">
                <Link className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                  Bouton Principal & Lien de Téléchargement Google Drive
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Intitulé du Bouton</label>
                  <input
                    type="text"
                    value={selectedPage.mainActionText}
                    onChange={(e) => handleUpdatePageField('mainActionText', e.target.value)}
                    placeholder="Ex: Télécharger sur Google Drive..."
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1 flex items-center justify-between">
                    <span>Lien URL Google Drive</span>
                    <a
                      href={selectedPage.mainActionDriveUrl || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-400 hover:underline text-[10px] flex items-center gap-1"
                    >
                      <span>Tester le lien</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </label>
                  <input
                    type="url"
                    value={selectedPage.mainActionDriveUrl || ''}
                    onChange={(e) => handleUpdatePageField('mainActionDriveUrl', e.target.value)}
                    placeholder="https://drive.google.com/..."
                    className="w-full px-3.5 py-2 bg-slate-900 border border-amber-500/30 rounded-xl text-xs text-amber-200 outline-none focus:border-amber-400 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Notes & Explications complémentaires */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                Consignes ou Notes Pastorales pour cette Page
              </label>
              <textarea
                rows={2}
                value={selectedPage.customNotes || ''}
                onChange={(e) => handleUpdatePageField('customNotes', e.target.value)}
                placeholder="Notes pastorales visibles ou directives doctrinales..."
                className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 outline-none focus:border-sky-500"
              />
            </div>

            {/* Actions Bar */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <span className="text-[11px] text-slate-400">
                Toutes les modifications sont enregistrées sur le serveur pour tous les visiteurs.
              </span>
              <button
                type="button"
                onClick={handleSaveAllPages}
                disabled={isSaving}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-2"
              >
                {isSaving ? <Save className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                <span>Enregistrer la page</span>
              </button>
            </div>

          </div>

        </div>

      </div>

      {/* MODAL: EDIT BOOK GOOGLE DRIVE URL QUICKLY */}
      {activeBookDriveEdit && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-sky-500/40 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-sky-400" />
                <h3 className="font-display font-bold text-base text-slate-100">
                  Modifier le Lien Google Drive
                </h3>
              </div>
              <button
                onClick={() => setActiveBookDriveEdit(null)}
                className="text-slate-400 hover:text-slate-200 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-xs text-slate-400 block">Ouvrage sélectionné :</span>
                <strong className="text-sm text-slate-100 block mt-0.5">{activeBookDriveEdit.title}</strong>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300 block">
                  Nouveau Lien Google Drive (PDF)
                </label>
                <input
                  type="url"
                  value={activeBookDriveEdit.url}
                  onChange={(e) => setActiveBookDriveEdit({ ...activeBookDriveEdit, url: e.target.value })}
                  placeholder="https://drive.google.com/file/d/.../view?usp=sharing"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-sky-500/40 rounded-xl text-xs text-sky-200 outline-none focus:border-sky-400 font-mono"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Tous les boutons de téléchargement de cet ouvrage redirigeront instantanément vers ce lien.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setActiveBookDriveEdit(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => handleSaveBookDriveLink(activeBookDriveEdit.id, activeBookDriveEdit.url)}
                className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold cursor-pointer shadow-md"
              >
                Enregistrer le lien
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
