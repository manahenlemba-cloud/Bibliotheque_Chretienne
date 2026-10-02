import React, { useState } from 'react';
import { 
  Mail, 
  Phone, 
  Send, 
  CheckCircle2, 
  Church, 
  UserCheck, 
  Copy, 
  MessageCircle, 
  ScrollText, 
  Clock, 
  MapPin, 
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const ContactView: React.FC = () => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'Question théologique ou pastorale',
    message: ''
  });

  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Exact contact information requested
  const seniorPastor = {
    title: "Pasteur Principal",
    name: "Le Serviteur de Dieu KAYEMBE MWANANGIZI Lawi",
    phone: "+243 817 974 033",
    cleanPhone: "243817974033"
  };

  const assistantPastor = {
    title: "Pasteur Adjoint",
    name: "Le Pasteur LUKANGILA FARIALA Manassé",
    phone: "+243 823 844 629",
    cleanPhone: "243823844629"
  };

  const adminAndAuthor = {
    title: "Administrateur du Site & Auteur",
    name: "Dr. LEMBA KAVUMBULA Moïse",
    phone: "+243811733778",
    cleanPhone: "243811733778",
    email: "bibliothequechretien@gmail.com"
  };

  const churchName = "Église Cereshe/OUA";
  const contactEmail = "bibliothequechretien@gmail.com";

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      setStatus('error');
      setFeedbackMsg('Veuillez renseigner tous les champs obligatoires.');
      return;
    }

    setStatus('submitting');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (res.ok) {
        setStatus('success');
        setFeedbackMsg(data.message || 'Votre message a été transmis avec succès.');
        setFormData({
          name: '',
          email: '',
          subject: 'Question théologique ou pastorale',
          message: ''
        });
      } else {
        setStatus('error');
        setFeedbackMsg(data.error || 'Une erreur est survenue lors de l\'envoi.');
      }
    } catch (err: any) {
      setStatus('error');
      setFeedbackMsg('Impossible de joindre le serveur. Veuillez vérifier votre connexion.');
    }
  };

  const faqs = [
    {
      q: "Comment joindre directement le Pasteur Principal ou l'équipe pastorale ?",
      a: "Vous pouvez appeler ou envoyer un message WhatsApp directement au Serviteur de Dieu KAYEMBE MWANANGIZI Lawi (+243 817 974 033) ou au Pasteur Adjoint LUKANGILA FARIALA Manassé (+243 823 844 629)."
    },
    {
      q: "Comment se déroulent les cultes et réunions à l'Église Cereshe/OUA ?",
      a: "L'assemblée se réunit pour la prière, la louange, l'étude de la sainte doctrine et l'exhortation dans la perspective du retour de Jésus-Christ."
    },
    {
      q: "Comment obtenir ou partager les sermons et livres gratuitement ?",
      a: "Tous les ouvrages, méditations et prédications de notre bibliothèque sont entièrement libres et téléchargeables sans frais."
    }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12 bg-white/70 min-h-screen">
      
      {/* OVERSEER BANNER - EXACT REQUEST */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-sky-900 via-sky-800 to-indigo-900 p-7 sm:p-9 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
          <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 flex-shrink-0 shadow-lg">
            <Church className="w-8 h-8 text-white" />
          </div>
          <div className="space-y-1.5 flex-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-black text-xs font-bold uppercase tracking-wider shadow-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-black" />
              Direction & Parrainage Spirituel
            </span>
            <h2 className="text-xl sm:text-2xl font-display font-bold text-white tracking-wide">
              « {t('overseerNoticeText')} »
            </h2>
            <p className="text-sm text-sky-200 font-medium">
              {churchName} • Ministère consacré à l'édification de l'Épouse de Christ et à la sainte marche de la dernière heure.
            </p>
          </div>
        </div>
      </div>

      {/* Page Heading */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-100 text-sky-800 text-xs font-bold uppercase tracking-wider">
          <Mail className="w-4 h-4 text-sky-600" />
          <span>Contact Direct & Pastoral</span>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-slate-900">
          Nous Écrire ou Joindre les Pasteurs
        </h1>
        <p className="text-sm sm:text-base text-slate-600 font-normal leading-relaxed">
          Pour toute demande de prière, conseil pastoral, échange sur la sainte doctrine ou question sur les ouvrages de sanctification.
        </p>
      </div>

      {/* LEADERSHIP CONTACT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* 1. Pasteur Principal */}
        <div className="p-6 rounded-3xl bg-white border border-sky-200 shadow-md hover:shadow-lg transition-all space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
                <UserCheck className="w-6 h-6" />
              </div>
              <span className="text-[11px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-sky-50 text-sky-800 border border-sky-200">
                {seniorPastor.title}
              </span>
            </div>
            <div>
              <h3 className="font-display font-bold text-base sm:text-lg text-slate-900 leading-snug">
                {seniorPastor.name}
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">{churchName}</p>
            </div>
            <div className="pt-2">
              <span className="text-[11px] text-slate-500 font-medium block">Téléphone direct :</span>
              <div className="flex items-center justify-between mt-1">
                <a 
                  href={`tel:${seniorPastor.cleanPhone}`}
                  className="font-mono text-base font-bold text-sky-700 hover:text-sky-800"
                >
                  {seniorPastor.phone}
                </a>
                <button
                  onClick={() => handleCopy(seniorPastor.phone, 'pastor-1')}
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs flex items-center gap-1 transition-colors cursor-pointer"
                  title="Copier le numéro"
                >
                  {copiedField === 'pastor-1' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100">
            <a
              href={`tel:${seniorPastor.cleanPhone}`}
              className="py-2 px-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold text-center flex items-center justify-center gap-1.5 transition-colors shadow-xs"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Appeler</span>
            </a>
            <a
              href={`https://wa.me/${seniorPastor.cleanPhone}`}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold text-center flex items-center justify-center gap-1.5 transition-colors shadow-xs"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </a>
          </div>
        </div>

        {/* 2. Pasteur Adjoint */}
        <div className="p-6 rounded-3xl bg-white border border-sky-200 shadow-md hover:shadow-lg transition-all space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                <UserCheck className="w-6 h-6" />
              </div>
              <span className="text-[11px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200">
                {assistantPastor.title}
              </span>
            </div>
            <div>
              <h3 className="font-display font-bold text-base sm:text-lg text-slate-900 leading-snug">
                {assistantPastor.name}
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">{churchName}</p>
            </div>
            <div className="pt-2">
              <span className="text-[11px] text-slate-500 font-medium block">Téléphone direct :</span>
              <div className="flex items-center justify-between mt-1">
                <a 
                  href={`tel:${assistantPastor.cleanPhone}`}
                  className="font-mono text-base font-bold text-indigo-700 hover:text-indigo-800"
                >
                  {assistantPastor.phone}
                </a>
                <button
                  onClick={() => handleCopy(assistantPastor.phone, 'pastor-2')}
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs flex items-center gap-1 transition-colors cursor-pointer"
                  title="Copier le numéro"
                >
                  {copiedField === 'pastor-2' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100">
            <a
              href={`tel:${assistantPastor.cleanPhone}`}
              className="py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold text-center flex items-center justify-center gap-1.5 transition-colors shadow-xs"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Appeler</span>
            </a>
            <a
              href={`https://wa.me/${assistantPastor.cleanPhone}`}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold text-center flex items-center justify-center gap-1.5 transition-colors shadow-xs"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </a>
          </div>
        </div>

        {/* 3. Administrateur du Site & Auteur */}
        <div className="p-6 rounded-3xl bg-white border-2 border-amber-300 shadow-md hover:shadow-lg transition-all space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold shadow-xs">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <span className="text-[11px] uppercase font-extrabold tracking-wider px-2.5 py-1 rounded-full bg-amber-400 text-slate-950">
                Administrateur du Site
              </span>
            </div>
            <div>
              <h3 className="font-display font-bold text-base sm:text-lg text-slate-900 leading-snug">
                {adminAndAuthor.name}
              </h3>
              <p className="text-xs text-amber-700 font-bold mt-0.5">
                Auteur & Enseignant « Les 5 Étapes Spirituelles »
              </p>
            </div>

            {/* Téléphone direct de l'administrateur */}
            <div className="pt-1">
              <span className="text-[11px] text-slate-500 font-medium block">Téléphone direct :</span>
              <div className="flex items-center justify-between mt-1">
                <a 
                  href={`tel:${adminAndAuthor.cleanPhone}`}
                  className="font-mono text-base font-bold text-amber-800 hover:text-amber-950"
                >
                  {adminAndAuthor.phone}
                </a>
                <button
                  onClick={() => handleCopy(adminAndAuthor.phone, 'admin-phone')}
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs flex items-center gap-1 transition-colors cursor-pointer"
                  title="Copier le numéro"
                >
                  {copiedField === 'admin-phone' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Courriel officiel */}
            <div>
              <span className="text-[11px] text-slate-500 font-medium block">Email officiel :</span>
              <div className="flex items-center justify-between mt-1">
                <a 
                  href={`mailto:${adminAndAuthor.email}`}
                  className="text-xs sm:text-sm font-semibold text-slate-900 hover:text-amber-800 break-all"
                >
                  {adminAndAuthor.email}
                </a>
                <button
                  onClick={() => handleCopy(adminAndAuthor.email, 'email')}
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs flex items-center gap-1 transition-colors cursor-pointer flex-shrink-0"
                  title="Copier l'email"
                >
                  {copiedField === 'email' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100">
            <a
              href={`tel:${adminAndAuthor.cleanPhone}`}
              className="py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold text-center flex items-center justify-center gap-1.5 transition-colors shadow-xs"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Appeler</span>
            </a>
            <a
              href={`https://wa.me/${adminAndAuthor.cleanPhone}`}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold text-center flex items-center justify-center gap-1.5 transition-colors shadow-xs"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </a>
          </div>
        </div>

      </div>

      {/* CONTACT FORM & INFO SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Contact Form */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-lg space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-xl font-display font-bold text-slate-900">
              Formulaire de Contact
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Remplissez ce formulaire pour poser une question doctrinale ou solliciter un échange.
            </p>
          </div>

          {status === 'success' && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Message transmis avec succès !</p>
                <p className="text-xs text-emerald-700 mt-0.5">{feedbackMsg}</p>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
              <p className="font-bold">Erreur lors de l'envoi</p>
              <p className="text-xs text-rose-700 mt-0.5">{feedbackMsg}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Votre Nom Complet *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Frère Jean-Baptiste"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 text-sm text-slate-900 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Adresse Courriel *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="votre.email@exemple.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 text-sm text-slate-900 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Objet du Message
              </label>
              <select
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 text-sm text-slate-900 outline-none transition-all bg-white"
              >
                <option value="Question théologique ou pastorale">Question théologique ou pastorale</option>
                <option value="Demande d'entretien ou conseil pastoral">Demande d'entretien ou conseil pastoral</option>
                <option value="Proposition d'ouvrage ou manuscrit">Proposition d'ouvrage ou manuscrit</option>
                <option value="Témoignage d'édification spirituelle">Témoignage d'édification spirituelle</option>
                <option value="Autre demande">Autre demande</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Votre Message *
              </label>
              <textarea
                required
                rows={5}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Écrivez ici votre message, vos questions ou vos requêtes spirituelles..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 text-sm text-slate-900 outline-none transition-all resize-y"
              />
            </div>

            <button
              type="submit"
              disabled={status === 'submitting'}
              className="w-full py-3 px-6 rounded-xl bg-sky-700 hover:bg-sky-800 disabled:opacity-50 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>{status === 'submitting' ? 'Envoi en cours...' : 'Envoyer le message'}</span>
            </button>
          </form>
        </div>

        {/* FAQs & Church Details */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200 space-y-4">
            <h3 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
              <Church className="w-5 h-5 text-sky-600" />
              <span>L'Assemblée Locale</span>
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              <strong>{churchName}</strong> est une communauté chrétienne vouée à l'enseignement biblique apostolique, au retour aux sentiers anciens de la sanctification et à la préparation vigilante pour le retour du Sauveur Jésus-Christ.
            </p>
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 text-xs text-slate-700 space-y-1">
              <p className="font-bold text-slate-900">Fondement scripturaire :</p>
              <p className="italic">« Recherchez la paix avec tous, et la sanctification, sans laquelle personne ne verra le Seigneur. » — Hébreux 12:14</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-4 shadow-sm">
            <h3 className="font-display font-bold text-base text-slate-900">
              Questions Fréquentes
            </h3>
            <div className="space-y-3">
              {faqs.map((faq, i) => (
                <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <p className="text-xs font-bold text-slate-900">{faq.q}</p>
                  <p className="text-xs text-slate-600 leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
