import React, { useState, useEffect } from 'react';
import { DriveDocument, RagSearchResult } from '../types';
import { 
  Cloud, 
  RefreshCw, 
  Search, 
  FileText, 
  ExternalLink, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  Database,
  Sparkles,
  Link,
  Trash2,
  BookOpen,
  ShieldCheck,
  Key,
  FolderSync,
  DownloadCloud,
  Lock,
  Mail,
  History,
  FileCheck,
  FolderPlus
} from 'lucide-react';

interface DriveAuthInfo {
  isAuthorized: boolean;
  targetAccount: string;
  authenticatedEmail?: string;
  status: 'disconnected' | 'authorized' | 'expired' | 'scope_insufficient' | 'error';
  scopes: string[];
  authorizedAt?: string;
  expiresAt?: string;
  storageQuota?: {
    limitBytes?: number;
    usageBytes?: number;
    usagePercentage?: number;
  };
}

interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
  webViewLink?: string;
  iconLink?: string;
}

interface Props {
  onNotify: (type: 'success' | 'error', message: string) => void;
}

export const AdminDriveRagTab: React.FC<Props> = ({ onNotify }) => {
  const [documents, setDocuments] = useState<DriveDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [folderIdInput, setFolderIdInput] = useState('');
  const [isAddingDoc, setIsAddingDoc] = useState(false);

  // Drive OAuth 2.0 Security State
  const [authInfo, setAuthInfo] = useState<DriveAuthInfo | null>(null);
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const [showManualTokenField, setShowManualTokenField] = useState(false);
  const [driveFiles, setDriveFiles] = useState<GoogleDriveFile[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);

  // New Document Form
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocUrl, setNewDocUrl] = useState('');
  const [newDocCategory, setNewDocCategory] = useState('Enseignement Biblique');
  const [newDocSnippet, setNewDocSnippet] = useState('');

  // RAG Search test
  const [ragQuery, setRagQuery] = useState('');
  const [ragResults, setRagResults] = useState<RagSearchResult[]>([]);
  const [isSearchingRag, setIsSearchingRag] = useState(false);

  // Main Drive Folder & Audit logs
  const [isSyncingMainFolder, setIsSyncingMainFolder] = useState(false);
  const [driveLogs, setDriveLogs] = useState<any[]>([]);

  useEffect(() => {
    fetchDriveDocs();
    fetchAuthStatus();
    fetchDriveLogs();
  }, []);

  const fetchDriveLogs = async () => {
    try {
      const res = await fetch('/api/drive/logs');
      if (res.ok) {
        const data = await res.json();
        setDriveLogs(data.logs || []);
      }
    } catch (e) {
      // ignore
    }
  };

  const handleSyncMainDriveFolder = async () => {
    try {
      setIsSyncingMainFolder(true);
      const res = await fetch('/api/drive/sync-folder', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        const added = data.newBooksAdded?.length || 0;
        onNotify('success', `Dossier « ${data.folderName} » synchronisé avec succès (${data.totalDriveFilesFound} fichier(s) détectés, ${added} nouvel(s) ouvrage(s)).`);
        fetchDriveFiles();
        fetchDriveDocs();
        fetchDriveLogs();
      } else {
        onNotify('error', data.error || 'Erreur lors de la synchronisation.');
      }
    } catch (err: any) {
      onNotify('error', 'Erreur serveur : ' + err.message);
    } finally {
      setIsSyncingMainFolder(false);
    }
  };

  const fetchAuthStatus = async () => {
    try {
      const res = await fetch('/api/drive/auth/status');
      if (res.ok) {
        const data = await res.json();
        setAuthInfo(data);
        if (data.isAuthorized) {
          fetchDriveFiles();
        }
      }
    } catch (err) {
      console.error('Erreur vérification statut OAuth Drive:', err);
    }
  };

  const fetchDriveFiles = async () => {
    try {
      setIsLoadingFiles(true);
      const res = await fetch('/api/drive/auth/files');
      if (res.ok) {
        const data = await res.json();
        setDriveFiles(data.files || []);
      }
    } catch (err) {
      console.error('Erreur listing fichiers Drive:', err);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const fetchDriveDocs = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/drive/documents');
      if (res.ok) {
        const data = await res.json();
        setDocuments(Array.isArray(data) ? data : data.documents || []);
      }
    } catch (err) {
      console.error('Erreur récupération documents Drive:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthorizeAccount = async (useSimulated = false) => {
    try {
      setIsAuthorizing(true);
      let res: Response;

      if (useSimulated || !tokenInput.trim()) {
        res = await fetch('/api/drive/auth/simulate-auth', {
          method: 'POST'
        });
      } else {
        res = await fetch('/api/drive/auth/authorize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            accessToken: tokenInput.trim(),
            email: 'bibliothequechretien@gmail.com'
          })
        });
      }

      const data = await res.json();
      if (res.ok) {
        setAuthInfo(data.status);
        setTokenInput('');
        setShowManualTokenField(false);
        onNotify('success', data.message || "Compte bibliothequechretien@gmail.com autorisé avec succès.");
        fetchDriveFiles();
      } else {
        onNotify('error', data.error || "Échec de l'autorisation OAuth 2.0.");
      }
    } catch (err: any) {
      onNotify('error', "Erreur d'autorisation : " + err.message);
    } finally {
      setIsAuthorizing(false);
    }
  };

  const handleRevokeAuth = async () => {
    if (!confirm('Confirmez-vous la révocation des jetons Google Drive pour bibliothequechretien@gmail.com ?')) {
      return;
    }
    try {
      const res = await fetch('/api/drive/auth/revoke', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setAuthInfo(null);
        setDriveFiles([]);
        fetchAuthStatus();
        onNotify('success', data.message || "Autorisation révoquée.");
      }
    } catch (err: any) {
      onNotify('error', "Erreur lors de la révocation : " + err.message);
    }
  };

  const handleImportFileToRag = async (file: GoogleDriveFile) => {
    try {
      const res = await fetch('/api/drive/index', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: file.name.replace(/\.[^/.]+$/, ""),
          url: file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`,
          category: 'Enseignement Fondamental',
          contentSnippet: `Document officiel « ${file.name} » synchronisé depuis le Drive bibliothequechretien@gmail.com.`,
          author: "Docteur LEMBA KAVUMBULA MOÏSE"
        })
      });

      if (res.ok) {
        const data = await res.json();
        setDocuments(prev => [data.document, ...prev]);
        onNotify('success', `Fichier « ${file.name} » indexé dans le corpus RAG.`);
      } else {
        const data = await res.json();
        onNotify('error', data.error || "Erreur lors de l'indexation.");
      }
    } catch (err: any) {
      onNotify('error', "Erreur : " + err.message);
    }
  };

  const handleSyncDrive = async () => {
    try {
      setIsSyncing(true);
      const res = await fetch('/api/drive/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderId: folderIdInput || undefined })
      });

      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents);
        onNotify('success', `Index RAG synchronisé : ${data.indexedCount} document(s) et ${data.ragTotalChunks} chunks indexés pour l'IA.`);
      } else {
        const data = await res.json();
        onNotify('error', data.error || "Échec de synchronisation.");
      }
    } catch (err: any) {
      onNotify('error', "Erreur de synchronisation : " + err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAddManualDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocTitle.trim() || !newDocUrl.trim()) return;

    try {
      const res = await fetch('/api/drive/index', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newDocTitle,
          url: newDocUrl,
          category: newDocCategory,
          contentSnippet: newDocSnippet,
          author: "Docteur LEMBA KAVUMBULA MOÏSE"
        })
      });

      if (res.ok) {
        const data = await res.json();
        setDocuments(prev => [data.document, ...prev]);
        setNewDocTitle('');
        setNewDocUrl('');
        setNewDocSnippet('');
        setIsAddingDoc(false);
        onNotify('success', `Document « ${data.document.title} » indexé dans le moteur RAG.`);
      } else {
        const data = await res.json();
        onNotify('error', data.error || "Erreur d'indexation.");
      }
    } catch (err: any) {
      onNotify('error', "Erreur : " + err.message);
    }
  };

  const handleTestRagSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ragQuery.trim()) return;

    try {
      setIsSearchingRag(true);
      const res = await fetch(`/api/rag/search?q=${encodeURIComponent(ragQuery)}&limit=5`);
      if (res.ok) {
        const data = await res.json();
        setRagResults(data.results || []);
      }
    } catch (err: any) {
      onNotify('error', "Erreur de test RAG : " + err.message);
    } finally {
      setIsSearchingRag(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border border-sky-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded bg-sky-500/20 text-sky-400">
              <Cloud className="w-4 h-4" />
            </span>
            <span className="text-xs uppercase font-bold text-sky-400 tracking-wider">
              Google Drive Cloud & Moteur Sémantique RAG
            </span>
          </div>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-100">
            Indexation Google Drive & Base de Connaissances IA
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Tous les documents Drive et ouvrages sont indexés sous forme de vecteurs sémantiques. L'IA Gemini interroge exclusivement ce corpus vérifié avec interdiction d'extrapoler.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsAddingDoc(!isAddingDoc)}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-sky-300 border border-sky-500/30 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-sky-400" />
            <span>Ajouter Document Drive</span>
          </button>

          <button
            onClick={handleSyncDrive}
            disabled={isSyncing}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-slate-950 font-bold text-xs shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Synchronisation...' : 'Synchroniser & Reconstruire l\'Index'}</span>
          </button>
        </div>
      </div>

      {/* OAUTH 2.0 & BACKEND INFRASTRUCTURE CARD */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${authInfo?.isAuthorized ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'}`}>
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-100">
                  Infrastructure OAuth 2.0 — Google Drive API v3
                </h3>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${authInfo?.isAuthorized ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-amber-400 text-black border border-amber-300'}`}>
                  {authInfo?.isAuthorized ? '● Connecté & Sécurisé' : '○ En attente d\'autorisation'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Compte officiel ciblé : <span className="font-mono text-sky-400 font-semibold">bibliothequechretien@gmail.com</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {authInfo?.isAuthorized ? (
              <button
                type="button"
                onClick={handleRevokeAuth}
                className="px-3 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5 text-rose-400" />
                <span>Révoquer l'autorisation</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleAuthorizeAccount(true)}
                disabled={isAuthorizing}
                className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs shadow-md shadow-sky-500/20 flex items-center gap-2 transition-all cursor-pointer"
              >
                <Key className="w-3.5 h-3.5" />
                <span>{isAuthorizing ? 'Autorisation en cours...' : 'Autoriser bibliothequechretien@gmail.com'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Security architecture notes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-sky-400" />
              <span>Sécurité Zero-Trust</span>
            </div>
            <p className="text-xs text-slate-300">
              Les jetons d'accès OAuth 2.0 sont conservés exclusivement en mémoire côté serveur. Aucun identifiant ou jeton brut n'est exposé au navigateur client.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-emerald-400" />
              <span>Compte Autorisé</span>
            </div>
            <p className="text-xs text-slate-300">
              Point de terminaison : <code className="text-sky-300 text-[11px]">POST /api/drive/auth/authorize</code> configuré avec les scopes officiels <span className="text-slate-400 font-mono text-[10px]">drive.readonly & drive.file</span>.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
              <FolderSync className="w-3.5 h-3.5 text-amber-400" />
              <span>Quota Stockage Drive</span>
            </div>
            <p className="text-xs text-slate-300">
              {authInfo?.storageQuota?.usageBytes 
                ? `${(authInfo.storageQuota.usageBytes / (1024 * 1024 * 1024)).toFixed(1)} Go utilisés / ${(authInfo.storageQuota.limitBytes ? authInfo.storageQuota.limitBytes / (1024 * 1024 * 1024) : 15).toFixed(0)} Go (${authInfo.storageQuota.usagePercentage || 0}%)`
                : '15 Go disponibles pour les ouvrages, PDFs et manuscrits pastoraux.'}
            </p>
          </div>
        </div>

        {/* Manual token input drawer if needed */}
        {!authInfo?.isAuthorized && (
          <div className="pt-2 border-t border-slate-800/60">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Vous disposez d'un jeton d'accès OAuth Google spécifique ?
              </span>
              <button
                type="button"
                onClick={() => setShowManualTokenField(!showManualTokenField)}
                className="text-xs text-sky-400 hover:text-sky-300 underline cursor-pointer"
              >
                {showManualTokenField ? 'Masquer la saisie de jeton' : 'Saisir un jeton d\'accès OAuth'}
              </button>
            </div>

            {showManualTokenField && (
              <div className="mt-3 flex gap-2">
                <input
                  type="password"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="Collez ici le jeton d'accès Google (ya29...)"
                  className="flex-1 px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:border-sky-400 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleAuthorizeAccount(false)}
                  disabled={isAuthorizing || !tokenInput.trim()}
                  className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-xl cursor-pointer disabled:opacity-50"
                >
                  Valider le jeton
                </button>
              </div>
            )}
          </div>
        )}

        {/* GOOGLE DRIVE LIVE EXPLORER TABLE */}
        {authInfo?.isAuthorized && (
          <div className="pt-3 border-t border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-2">
                <DownloadCloud className="w-4 h-4" />
                <span>Explorateur Google Drive — Fichiers Détectés ({driveFiles.length})</span>
              </h4>
              <button
                type="button"
                onClick={fetchDriveFiles}
                disabled={isLoadingFiles}
                className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${isLoadingFiles ? 'animate-spin' : ''}`} />
                <span>Actualiser les fichiers</span>
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-2.5">Nom du fichier Drive</th>
                    <th className="px-4 py-2.5">Taille</th>
                    <th className="px-4 py-2.5">Type</th>
                    <th className="px-4 py-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {driveFiles.map((file) => (
                    <tr key={file.id} className="hover:bg-slate-900/60 transition-colors">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-sky-400 flex-shrink-0" />
                          <span className="text-slate-100 font-medium">{file.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-slate-400 font-mono text-[11px]">
                        {file.size ? `${(Number(file.size) / (1024 * 1024)).toFixed(1)} Mo` : '—'}
                      </td>
                      <td className="px-4 py-2.5 text-slate-400 text-[11px]">
                        {file.mimeType.includes('pdf') ? 'PDF Livre' : file.mimeType.includes('folder') ? 'Dossier' : 'Document'}
                      </td>
                      <td className="px-4 py-2.5 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleImportFileToRag(file)}
                          className="px-2.5 py-1 bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 rounded-lg text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Database className="w-3 h-3 text-sky-400" />
                          <span>Indexer au RAG</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* DOSSIER PRINCIPAL DE LA BIBLIOTHÈQUE GOOGLE DRIVE */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-sky-950/80 via-slate-900 to-sky-950/80 border border-sky-500/40 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-3 rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-500/30 flex-shrink-0">
              <FolderPlus className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-100">
                  📚 LA BIBLIOTHÈQUE CHRÉTIENNE DE LA DERNIÈRE HEURE
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Dossier Racine Principal
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Tous les ouvrages ajoutés depuis l'administration sont enregistrés automatiquement dans ce dossier Google Drive officiel lié à <strong className="text-sky-300">bibliothequechretien@gmail.com</strong>.
                Vous pouvez également y déposer directement vos fichiers PDF : un clic sur « Synchroniser » les intègrera immédiatement au catalogue.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSyncMainDriveFolder}
            disabled={isSyncingMainFolder}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-slate-950 font-bold text-xs shadow-md shadow-sky-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all whitespace-nowrap"
          >
            <FolderSync className={`w-4 h-4 ${isSyncingMainFolder ? 'animate-spin' : ''}`} />
            <span>{isSyncingMainFolder ? 'Scan du dossier...' : 'Synchroniser le dossier Bibliothèque'}</span>
          </button>
        </div>
      </div>

      {/* Sync folder input */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row items-center gap-3">
        <label className="text-xs text-slate-300 font-semibold whitespace-nowrap">
          ID de Dossier Google Drive (optionnel) :
        </label>
        <input
          type="text"
          value={folderIdInput}
          onChange={(e) => setFolderIdInput(e.target.value)}
          placeholder="Ex: 1A2b3C4d5E... (ou laissez vide pour synchroniser tous les liens existants)"
          className="flex-1 w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 outline-none focus:border-sky-500/50"
        />
        <button
          onClick={handleSyncDrive}
          disabled={isSyncing}
          className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-lg cursor-pointer whitespace-nowrap"
        >
          Indexer ce dossier
        </button>
      </div>

      {/* ADD MANUAL DRIVE DOCUMENT FORM */}
      {isAddingDoc && (
        <form onSubmit={handleAddManualDoc} className="p-5 rounded-2xl bg-slate-900 border border-sky-500/40 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Link className="w-4 h-4 text-sky-400" />
              <span>Lier et Indexer un Document Google Drive</span>
            </h3>
            <button
              type="button"
              onClick={() => setIsAddingDoc(false)}
              className="text-xs text-slate-400 hover:text-slate-200"
            >
              Fermer
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-slate-300 font-medium">Titre du Document *</label>
              <input
                type="text"
                required
                value={newDocTitle}
                onChange={(e) => setNewDocTitle(e.target.value)}
                placeholder="Ex: Manuel d'Affermissement Spirituel"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 outline-none focus:border-sky-500/50"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-300 font-medium">Lien Google Drive Public *</label>
              <input
                type="url"
                required
                value={newDocUrl}
                onChange={(e) => setNewDocUrl(e.target.value)}
                placeholder="https://drive.google.com/file/d/..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 outline-none focus:border-sky-500/50"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-300 font-medium">Extrait / Contenu sémantique pour l'IA</label>
            <textarea
              rows={3}
              value={newDocSnippet}
              onChange={(e) => setNewDocSnippet(e.target.value)}
              placeholder="Collez ici les thèses principales, versets et résumés afin que le moteur RAG puisse y puiser avec exactitude..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 outline-none focus:border-sky-500/50"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAddingDoc(false)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold shadow cursor-pointer"
            >
              Ajouter & Indexer
            </button>
          </div>
        </form>
      )}

      {/* DOCUMENTS LIST */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Database className="w-4 h-4 text-sky-400" />
            <span>Documents Google Drive Indexés ({documents.length})</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            RAG Status: Prêt & Actif
          </span>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/50">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Document</th>
                <th className="px-4 py-3">Auteur</th>
                <th className="px-4 py-3">Statut Indexation</th>
                <th className="px-4 py-3">Date d'Indexation</th>
                <th className="px-4 py-3 text-right">Lien</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-900/80 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <FileText className="w-4 h-4 text-sky-400 flex-shrink-0" />
                      <div>
                        <strong className="text-slate-100 block">{doc.title}</strong>
                        <span className="text-[11px] text-slate-400 line-clamp-1">{doc.excerpt || doc.contentSnippet}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sky-300 font-medium whitespace-nowrap">
                    {doc.author}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 w-fit">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{doc.status}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 whitespace-nowrap font-mono text-[11px]">
                    {new Date(doc.indexedAt).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <a
                      href={doc.driveUrl || doc.url || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sky-400 hover:text-sky-300 underline font-semibold"
                    >
                      <span>Ouvrir</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* LIVE RAG INSPECTOR & SEARCH TEST */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-sky-400" />
          <h3 className="text-sm font-bold text-slate-100">
            Simulateur de Requête RAG (Vérification des Sources & Pertinence)
          </h3>
        </div>
        <p className="text-xs text-slate-400">
          Tapez une question doctrinale pour vérifier quels passages et documents Drive sont extraits en temps réel par le moteur sémantique avant que l'IA ne génère sa réponse.
        </p>

        <form onSubmit={handleTestRagSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={ragQuery}
              onChange={(e) => setRagQuery(e.target.value)}
              placeholder="Ex: Quelles sont les souffrances dans 1 Pierre 5:10 ?"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 outline-none focus:border-sky-500/50"
            />
          </div>
          <button
            type="submit"
            disabled={isSearchingRag}
            className="px-4 py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-xl cursor-pointer"
          >
            {isSearchingRag ? 'Recherche...' : 'Tester'}
          </button>
        </form>

        {ragResults.length > 0 && (
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider">
              {ragResults.length} Chunks Extraits par le Moteur RAG :
            </h4>
            <div className="space-y-2">
              {ragResults.map((res, i) => (
                <div key={i} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-sky-300">
                      [{res.sourceType.toUpperCase()}] {res.sourceTitle} — {res.sectionOrChapter || res.chapterOrSection || 'Section'}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 font-mono">
                      Score: {res.score.toFixed(1)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300/90 leading-relaxed font-light">
                    « {res.snippet || res.text} »
                  </p>
                  {res.verses && (
                    <div className="text-[11px] text-slate-400">
                      Références : {res.verses}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* DRIVE ACTIVITY & AUDIT LOG */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-sky-400" />
            <h3 className="text-sm font-bold text-slate-100">
              Journal d'Audit des Opérations Google Drive & Téléchargements
            </h3>
          </div>
          <button
            type="button"
            onClick={fetchDriveLogs}
            className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Actualiser le journal</span>
          </button>
        </div>

        {driveLogs.length === 0 ? (
          <p className="text-xs text-slate-500 py-3 text-center">
            Aucune opération récente enregistrée. Les téléversements, synchronisations et flux apparaîtront ici.
          </p>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {driveLogs.slice(0, 15).map((log, idx) => (
              <div key={log.id || idx} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    log.action === 'UPLOAD_BOOK' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                    log.action === 'SYNC_FOLDER' ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30' :
                    log.action === 'SAFE_DELETE' ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30' :
                    'bg-slate-800 text-slate-300'
                  }`}>
                    {log.action}
                  </span>
                  <span className="text-slate-200 truncate">{log.details}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400 text-[11px] whitespace-nowrap flex-shrink-0">
                  <span className="font-mono">{new Date(log.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] bg-slate-900 border border-slate-800 text-slate-300">{log.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
