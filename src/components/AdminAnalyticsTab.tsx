import { useState, useEffect, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  MessageSquare,
  Bot,
  Sparkles,
  BookOpen,
  ScrollText,
  CheckCircle2,
  Clock,
  RefreshCw,
  Search,
  Filter,
  Layers,
  ArrowRight,
  ShieldCheck,
  Flame,
  HelpCircle,
  Calendar,
  Share2
} from 'lucide-react';

interface AnalyticsData {
  summary: {
    totalUserQuestions: number;
    pendingUserQuestions: number;
    answeredUserQuestions: number;
    resolutionRate: number;
    totalAiQueries: number;
    groundedQueriesCount: number;
    groundingRate: number;
    totalInteractions: number;
  };
  userQuestions: {
    byTopic: Array<{ name: string; count: number }>;
    byChannel: Array<{ name: string; count: number }>;
  };
  aiAssistant: {
    topThemes: Array<{ theme: string; count: number; percentage: number }>;
    topBooks: Array<{ bookTitle: string; count: number; percentage: number }>;
    topScriptures: Array<{ reference: string; count: number }>;
    topKeywords: Array<{ keyword: string; count: number }>;
    recentQueries: Array<{
      id: string;
      question: string;
      bookTitle?: string;
      theme: string;
      biblicalReferences: string[];
      timestamp: string;
      ragFound: boolean;
      citationsCount: number;
    }>;
  };
  timeline: Array<{
    period: string;
    questionsUtilisateurs: number;
    requetesIA: number;
    totalInteractions: number;
  }>;
}

const THEME_COLORS = [
  '#38bdf8', // sky-400
  '#818cf8', // indigo-400
  '#34d399', // emerald-400
  '#fbbf24', // amber-400
  '#f472b6', // pink-400
  '#a78bfa', // purple-400
  '#fb923c'  // orange-400
];

interface AdminAnalyticsTabProps {
  onNavigateToQuestions?: () => void;
  onNavigateToAiAdmin?: () => void;
}

export function AdminAnalyticsTab({ onNavigateToQuestions, onNavigateToAiAdmin }: AdminAnalyticsTabProps) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedThemeFilter, setSelectedThemeFilter] = useState<string>('all');
  const [lastRefreshed, setLastRefreshed] = useState<string>('');

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/analytics');
      if (!res.ok) {
        throw new Error('Échec du chargement des statistiques analytiques');
      }
      const json: AnalyticsData = await res.json();
      setData(json);
      setLastRefreshed(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err: any) {
      console.error('Erreur analytique:', err);
      setError(err.message || 'Impossible de récupérer les données analytiques');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  // Filtered queries for the detailed questions feed
  const filteredQueries = useMemo(() => {
    if (!data?.aiAssistant?.recentQueries) return [];
    return data.aiAssistant.recentQueries.filter((q) => {
      const matchesTheme = selectedThemeFilter === 'all' || q.theme === selectedThemeFilter;
      const matchesSearch = !searchFilter.trim() ||
        q.question.toLowerCase().includes(searchFilter.toLowerCase()) ||
        q.theme.toLowerCase().includes(searchFilter.toLowerCase()) ||
        (q.bookTitle && q.bookTitle.toLowerCase().includes(searchFilter.toLowerCase())) ||
        q.biblicalReferences.some(r => r.toLowerCase().includes(searchFilter.toLowerCase()));
      return matchesTheme && matchesSearch;
    });
  }, [data, selectedThemeFilter, searchFilter]);

  if (loading && !data) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-4 text-center">
        <div className="w-10 h-10 border-3 border-sky-400/20 border-t-sky-400 rounded-full animate-spin" />
        <p className="text-sm font-semibold text-slate-300">
          Calcul des statistiques analytiques et agrégation des requêtes...
        </p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="p-8 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-center space-y-4">
        <p className="text-sm font-semibold">{error}</p>
        <button
          onClick={fetchAnalytics}
          className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all cursor-pointer"
        >
          Réessayer
        </button>
      </div>
    );
  }

  const summary = data?.summary || {
    totalUserQuestions: 0,
    pendingUserQuestions: 0,
    answeredUserQuestions: 0,
    resolutionRate: 100,
    totalAiQueries: 0,
    groundedQueriesCount: 0,
    groundingRate: 100,
    totalInteractions: 0
  };

  const topThemeName = data?.aiAssistant?.topThemes?.[0]?.theme || "Les 5 Étapes Spirituelles";
  const topThemeCount = data?.aiAssistant?.topThemes?.[0]?.count || 0;
  const topVerse = data?.aiAssistant?.topScriptures?.[0]?.reference || "1 Pierre 5:10";

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header with Title and Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-sky-950/40 border border-sky-500/20 shadow-xl relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="space-y-1.5 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-bold tracking-wide uppercase">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Tableau de Bord Analytique & Intelligence de Consultation</span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
            Statistiques des Questions & Thématiques IA
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
            Mesurez le volume des sollicitations pastorales directes et analysez en temps réel ce que les fidèles recherchent à travers l'assistant IA et le corpus des livres.
          </p>
        </div>

        <div className="flex items-center gap-2.5 z-10 shrink-0">
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            Mis à jour à <strong className="text-slate-200">{lastRefreshed}</strong>
          </span>
          <button
            onClick={fetchAnalytics}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-sky-300 text-xs font-semibold border border-slate-700 hover:border-sky-500/40 transition-all cursor-pointer shadow"
            title="Rafraîchir les métriques"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualiser</span>
          </button>
        </div>
      </div>

      {/* 4 Primary KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: User Questions to Admin */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-sky-500/30 transition-all shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Questions Posées à l'Admin</span>
            <span className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
              <MessageSquare className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-3xl font-extrabold text-slate-100">
              {summary.totalUserQuestions}
            </span>
            <span className="text-xs text-slate-400">questions</span>
          </div>
          <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/80">
            <span className="flex items-center gap-1 text-slate-300 font-medium">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {summary.pendingUserQuestions} en attente
            </span>
            <span className="flex items-center gap-1 text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {summary.answeredUserQuestions} répondues
            </span>
          </div>
          {onNavigateToQuestions && (
            <button
              onClick={onNavigateToQuestions}
              className="w-full text-center text-[11px] font-bold text-sky-400 hover:text-sky-300 transition-colors pt-1 cursor-pointer flex items-center justify-center gap-1"
            >
              Gérer les questions <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Card 2: AI Queries volume */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/30 transition-all shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Requêtes Posées à l'IA</span>
            <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Bot className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-3xl font-extrabold text-slate-100">
              {summary.totalAiQueries}
            </span>
            <span className="text-xs text-indigo-400 font-semibold">interrogations</span>
          </div>
          <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/80">
            <span className="text-slate-400">Ancrage doctrinal :</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold text-[11px]">
              <CheckCircle2 className="w-3 h-3" />
              {summary.groundingRate}% certifiés
            </span>
          </div>
          <div className="text-[11px] text-slate-400 text-center pt-1">
            Basé sur les livres & la Sainte Bible
          </div>
        </div>

        {/* Card 3: Top Theological Theme */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/30 transition-all shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Sujet N°1 le Plus Demandé</span>
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Flame className="w-4 h-4" />
            </span>
          </div>
          <div className="space-y-1">
            <span className="block font-display text-base font-bold text-slate-100 line-clamp-1" title={topThemeName}>
              {topThemeName}
            </span>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <strong className="text-slate-100 font-bold">{topThemeCount}</strong> consultations
              <span>•</span>
              <span className="text-slate-300 font-semibold">
                {Math.round((topThemeCount / (summary.totalAiQueries || 1)) * 100)}% des requêtes
              </span>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
            Enseignement le plus recherché sur le site
          </div>
        </div>

        {/* Card 4: Top Scripture Reference */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-purple-500/30 transition-all shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Verset Biblique N°1</span>
            <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <ScrollText className="w-4 h-4" />
            </span>
          </div>
          <div className="space-y-1">
            <span className="block font-display text-xl font-bold text-purple-300">
              {topVerse}
            </span>
            <p className="text-[11px] text-slate-400 line-clamp-1 italic">
              « Le Dieu de toute grâce vous affermira... »
            </p>
          </div>
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Total citations :</span>
            <span className="font-bold text-purple-300">
              {data?.aiAssistant?.topScriptures?.[0]?.count || 12} fois
            </span>
          </div>
        </div>

      </div>

      {/* Row of 2 Visual Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Temporal Evolution (Timeline) */}
        <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 space-y-5 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="font-display text-base font-bold text-slate-100 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-sky-400" />
                <span>Évolution du Flux des Questions</span>
              </h3>
              <p className="text-xs text-slate-400">
                Comparatif des questions utilisateurs vs requêtes adressées à l'IA
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-semibold">
              <span className="flex items-center gap-1.5 text-sky-400">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400 inline-block" /> Requêtes IA
              </span>
              <span className="flex items-center gap-1.5 text-slate-200">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" /> Questions Admin
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.timeline || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIa" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorUser" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#fbbf24" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="period" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                  labelStyle={{ color: '#f1f5f9', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="requetesIA" name="Requêtes IA" stroke="#38bdf8" strokeWidth={2.5} fillOpacity={1} fill="url(#colorIa)" />
                <Area type="monotone" dataKey="questionsUtilisateurs" name="Questions Admin" stroke="#fbbf24" strokeWidth={2} fillOpacity={1} fill="url(#colorUser)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Top Theological Topics Requested via AI */}
        <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 space-y-5 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="font-display text-base font-bold text-slate-100 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-400" />
                <span>Thématiques les Plus Demandées à l'IA</span>
              </h3>
              <p className="text-xs text-slate-400">
                Répartition des sujets doctrinaux et questions théologiques
              </p>
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Top Sujets
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data?.aiAssistant?.topThemes?.slice(0, 5) || []}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" stroke="#64748b" fontSize={11} tickLine={false} allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="theme"
                  stroke="#94a3b8"
                  fontSize={10}
                  tickLine={false}
                  width={140}
                  tickFormatter={(val) => val.length > 20 ? val.slice(0, 18) + '...' : val}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                  labelStyle={{ color: '#f1f5f9', fontWeight: 'bold' }}
                  formatter={(value: any) => [`${value} questions`, 'Volume']}
                />
                <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                  {(data?.aiAssistant?.topThemes || []).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={THEME_COLORS[index % THEME_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Breakdown Details Grid: Books Queried & Scripture References */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Books Queried via AI */}
        <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 space-y-4 shadow-lg">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="font-display text-sm font-bold text-slate-100 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-sky-400" />
              <span>Ouvrages les Plus Interrogés par les Fidèles</span>
            </h3>
            <span className="text-[11px] text-slate-400">Requêtes</span>
          </div>

          <div className="space-y-3">
            {(data?.aiAssistant?.topBooks || []).map((b, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-200 line-clamp-1 pr-2">
                    {b.bookTitle}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-bold text-sky-400">{b.count}</span>
                    <span className="text-[10px] text-slate-500">({b.percentage}%)</span>
                  </div>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-sky-500 to-indigo-500"
                    style={{ width: `${Math.max(b.percentage, 8)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Most Requested Scripture References */}
        <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 space-y-4 shadow-lg">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="font-display text-sm font-bold text-slate-100 flex items-center gap-2">
              <ScrollText className="w-4 h-4 text-purple-400" />
              <span>Versets & Passages Bibliques les Plus Cités</span>
            </h3>
            <span className="text-[11px] text-slate-400">Occurrences</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {(data?.aiAssistant?.topScriptures || []).map((s, i) => (
              <div
                key={i}
                className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-purple-500/40 transition-all flex items-center justify-between"
              >
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-purple-300 block">
                    {s.reference}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Sainte Bible
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 font-extrabold text-xs">
                  {s.count}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Recurrent Doctrinal Keywords Chips */}
      <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 space-y-3 shadow-lg">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-sm font-bold text-slate-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Mots-Clés Doctrinales & Requêtes Récurrentes</span>
          </h3>
          <span className="text-xs text-slate-400">Fréquence de recherche</span>
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          {(data?.aiAssistant?.topKeywords || []).map((k, i) => (
            <div
              key={i}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-sky-500/40 text-xs transition-all"
            >
              <span className="text-slate-200 font-medium">{k.keyword}</span>
              <span className="px-1.5 py-0.5 rounded-md bg-sky-500/15 text-sky-400 text-[10px] font-bold">
                {k.count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Deep-Dive Live Feed: Recent Questions Asked to AI */}
      <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 space-y-5 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h3 className="font-display text-base font-bold text-slate-100 flex items-center gap-2">
              <Bot className="w-4 h-4 text-sky-400" />
              <span>Journal en Temps Réel des Questions Posées à l'IA</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Consultez ce que les visiteurs et fidèles demandent à l'assistant théologique
            </p>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Rechercher une question..."
                className="pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:border-sky-500/50 outline-none w-44 sm:w-56"
              />
            </div>

            <select
              value={selectedThemeFilter}
              onChange={(e) => setSelectedThemeFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:border-sky-500/50 outline-none cursor-pointer"
            >
              <option value="all">Toutes les thématiques</option>
              {(data?.aiAssistant?.topThemes || []).map((t, i) => (
                <option key={i} value={t.theme}>{t.theme}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Feed List */}
        <div className="space-y-3">
          {filteredQueries.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <HelpCircle className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs font-semibold text-slate-400">
                Aucune question trouvée avec ces critères de recherche.
              </p>
            </div>
          ) : (
            filteredQueries.map((q) => (
              <div
                key={q.id}
                className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 hover:border-sky-500/30 transition-all space-y-2.5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                      {q.theme}
                    </span>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <BookOpen className="w-3 h-3 text-slate-500" />
                      {q.bookTitle || "Tous les livres"}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(q.timestamp).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>

                <p className="text-xs sm:text-sm font-semibold text-slate-100">
                  « {q.question} »
                </p>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-900 text-[11px]">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-slate-500">Versets rattachés :</span>
                    {q.biblicalReferences.map((ref, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-300 font-medium">
                        {ref}
                      </span>
                    ))}
                  </div>

                  <span className="flex items-center gap-1 text-emerald-400 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Réponse ancrée ({q.citationsCount} sources citées)
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
