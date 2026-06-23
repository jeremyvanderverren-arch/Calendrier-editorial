import React, { useState, useEffect, useMemo } from "react";
import { Publication, ValidationAlert, ChannelType, StatusType, KpiType, UserProfile } from "./types";
import Dashboard from "./components/Dashboard";
import CalendarView from "./components/CalendarView";
import PublicationTable from "./components/PublicationTable";
import { 
  Plus, 
  Sparkles, 
  AlertTriangle, 
  Info, 
  TrendingUp, 
  BarChart, 
  Calendar as CalendarIcon, 
  List, 
  BookOpen, 
  Loader2, 
  Copy, 
  Check, 
  X, 
  Smartphone, 
  ArrowLeftRight,
  Settings,
  Flame,
  UserCheck,
  Users,
  Mail
} from "lucide-react";

// Initial seed publications matching around June 17, 2026
const DEFAULT_PUBLICATIONS: Publication[] = [
  {
    id: "pub-1",
    date: "2026-06-17",
    title: "Le futur de l'IA en SaaS",
    channel: "LinkedIn",
    persona: "CTO / Leaders Tech",
    status: "Publié",
    copywriting: "L'IA ne remplacera pas les développeurs. Mais les développeurs qui maîtrisent l'IA remplaceront ceux qui s'en méfient.\n\nVoici 3 compétences clés à acquérir dès aujourd'hui pour garder l'avantage.",
    kpi: "Engagement",
    createdBy: "u-1"
  },
  {
    id: "pub-2",
    date: "2026-06-19",
    title: "Guide: Recrutement Marketing B2B",
    channel: "Blog",
    persona: "CEO & Fondateurs",
    status: "Planifié",
    copywriting: "Arrêtez de chercher le candidat miracle à tout faire.\n\nConstruisez une équipe aux talents complémentaires. Notre guide gratuit vous dévoile la structure optimale en 2026.",
    kpi: "Trafic",
    createdBy: "u-1"
  },
  {
    id: "pub-3",
    date: "2026-06-19",
    title: "Newsletter #42 : Spécial Automatisation",
    channel: "Newsletter",
    persona: "Tous abonnés",
    status: "En rédaction",
    copywriting: "Cette semaine, découvrez comment diviser par 2 le temps consacré à vos tâches répétitives.\n\n3 outils simples et un plan d'action immédiat pour booster votre productivité de marketeur.",
    kpi: "Leads",
    createdBy: "u-3"
  },
  {
    id: "pub-4",
    date: "2026-06-21",
    title: "Notre culture d'entreprise en image",
    channel: "Instagram",
    persona: "Futurs Talents",
    status: "Idée",
    copywriting: "Flexibilité totale, projets ambitieux et apprentissage continu.\n\nVoici le quotidien de notre équipe marketing en coulisses. Rejoignez l'aventure !",
    kpi: "Engagement",
    createdBy: "u-3"
  }
];

export default function App() {
  const [publications, setPublications] = useState<Publication[]>(() => {
    const saved = localStorage.getItem("marketing_calendar_pubs");
    return saved ? JSON.parse(saved) : DEFAULT_PUBLICATIONS;
  });

  const [activeTab, setActiveTab] = useState<"dashboard" | "calendar" | "list" | "technique">("dashboard");
  const [selectedPub, setSelectedPub] = useState<Publication | null>(null);

  // Users State Management
  const [users, setUsers] = useState<UserProfile[]>(() => {
    const saved = localStorage.getItem("marketing_calendar_users");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as any[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((u, idx) => ({
            id: u.id || `u-${idx}`,
            name: u.name || "Collaborateur",
            email: u.email || `${(u.name || "user").toLowerCase().replace(/\s+/g, ".")}@ucm.be`,
            role: u.role || "viewer",
            avatar: u.avatar || "👤"
          }));
        }
      } catch (e) {
        // Fallback to defaults
      }
    }
    return [
      { id: "u-1", name: "Jérémy", email: "jeremy.vanderverren@ucm.be", role: "editor", avatar: "👨‍💻" },
      { id: "u-2", name: "Alice", email: "alice@ucm.be", role: "viewer", avatar: "👩‍💼" },
      { id: "u-3", name: "Laurent", email: "laurent@ucm.be", role: "editor", avatar: "👨‍🎨" },
      { id: "u-4", name: "Sophie", email: "sophie@ucm.be", role: "viewer", avatar: "👩‍🔬" }
    ];
  });

  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    const saved = localStorage.getItem("marketing_calendar_current_user_id");
    return saved || "u-1";
  });

  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [userFormError, setUserFormError] = useState<string | null>(null);
  const [userFormSuccess, setUserFormSuccess] = useState<string | null>(null);

  const activeUser = useMemo(() => {
    return users.find(u => u.id === currentUserId) || users[0] || { id: "u-1", name: "Jérémy", email: "jeremy.vanderverren@ucm.be", role: "editor", avatar: "👨‍💻" };
  }, [users, currentUserId]);

  // Dynamic lists states for technical section
  const [channels, setChannels] = useState<string[]>(() => {
    const saved = localStorage.getItem("marketing_calendar_channels");
    return saved ? JSON.parse(saved) : ["LinkedIn", "Blog", "Newsletter", "Instagram"];
  });
  const [kpis, setKpis] = useState<string[]>(() => {
    const saved = localStorage.getItem("marketing_calendar_kpis");
    return saved ? JSON.parse(saved) : ["Engagement", "Trafic", "Leads"];
  });
  const [statuses, setStatuses] = useState<string[]>(() => {
    const saved = localStorage.getItem("marketing_calendar_statuses");
    return saved ? JSON.parse(saved) : ["Idée", "En rédaction", "En révision", "Planifié", "Publié"];
  });
  const [personas, setPersonas] = useState<string[]>(() => {
    const saved = localStorage.getItem("marketing_calendar_personas");
    return saved ? JSON.parse(saved) : ["CTO / Leaders Tech", "CEO & Fondateurs", "Futurs Talents", "Tous abonnés"];
  });
  
  // App wide state
  const [rawIdeaInput, setRawIdeaInput] = useState("");
  const [isParsingIdeas, setIsParsingIdeas] = useState(false);
  const [isOptimizingCopy, setIsOptimizingCopy] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [alerts, setAlerts] = useState<ValidationAlert[]>([]);
  const [copiedTextId, setCopiedTextId] = useState<string | null>(null);

  // Form state for creating or editing an item
  const [showFormModal, setShowFormModal] = useState(false);
  const [formData, setFormData] = useState<Partial<Publication>>({
    date: "2026-06-17",
    title: "",
    channel: "LinkedIn",
    persona: "CTO / Leaders Tech",
    status: "Idée",
    copywriting: "",
    kpi: "Engagement",
  });

  // Save changes locally
  useEffect(() => {
    localStorage.setItem("marketing_calendar_pubs", JSON.stringify(publications));
  }, [publications]);

  useEffect(() => {
    localStorage.setItem("marketing_calendar_users", JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem("marketing_calendar_current_user_id", currentUserId);
  }, [currentUserId]);

  useEffect(() => {
    localStorage.setItem("marketing_calendar_channels", JSON.stringify(channels));
  }, [channels]);

  useEffect(() => {
    localStorage.setItem("marketing_calendar_kpis", JSON.stringify(kpis));
  }, [kpis]);

  useEffect(() => {
    localStorage.setItem("marketing_calendar_statuses", JSON.stringify(statuses));
  }, [statuses]);

  useEffect(() => {
    localStorage.setItem("marketing_calendar_personas", JSON.stringify(personas));
  }, [personas]);

  // Request calendar validation when publications structure changes
  const checkCohortConflicts = async (currentPubs: Publication[]) => {
    setIsValidating(true);
    try {
      const response = await fetch("/api/gemini/validate-calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publications: currentPubs })
      });
      if (response.ok) {
        const data = await response.json();
        setAlerts(data.alerts || []);
      }
    } catch (err) {
      console.error("Failed to check calendar validation", err);
    } finally {
      setIsValidating(false);
    }
  };

  useEffect(() => {
    checkCohortConflicts(publications);
  }, [publications]);

  // Handle parsing raw text from the AI Dump panel
  const handleParseIdeas = async () => {
    if (!rawIdeaInput.trim()) return;
    setIsParsingIdeas(true);
    try {
      const response = await fetch("/api/gemini/parse-ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawInput: rawIdeaInput,
          currentDateString: "2026-06-17"
        })
      });

      if (!response.ok) {
        throw new Error("Failed to parse thoughts");
      }

      const data = await response.json();
      if (data.publications && Array.isArray(data.publications)) {
        const added: Publication[] = data.publications.map((p: any, i: number) => ({
          ...p,
          id: `ai-pub-${Date.now()}-${i}`,
          // Ensure correct defaults if fields are missing
          channel: p.channel || "LinkedIn",
          status: p.status || "Idée",
          kpi: p.kpi || "Engagement",
          persona: p.persona || "Utilisateur Cible",
          copywriting: p.copywriting || "",
          createdBy: currentUserId
        }));
        
        const newPubs = [...publications, ...added];
        setPublications(newPubs);
        setRawIdeaInput("");
        alert(`${added.length} publication(s) générée(s) avec succès et insérée(s) dans le calendrier !`);
      }
    } catch (err: any) {
      console.error(err);
      alert("Erreur lors de la génération : " + err.message);
    } finally {
      setIsParsingIdeas(false);
    }
  };

  // Trigger Gemini Copywriter Optimizer
  const handleOptimizeCopywriting = async (pubId: string) => {
    const target = publications.find(p => p.id === pubId);
    if (!target) return;
    
    setIsOptimizingCopy(true);
    try {
      const response = await fetch("/api/gemini/optimize-copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          copywriting: target.copywriting,
          title: target.title,
          channel: target.channel,
          persona: target.persona
        })
      });

      if (!response.ok) {
        throw new Error("Erreur serveur copywriting optimization");
      }

      const data = await response.json();
      const optimizedStr = data.optimizedText;

      setPublications(prev => prev.map(p => {
        if (p.id === pubId) {
          return { ...p, copywriting: optimizedStr };
        }
        return p;
      }));

      // Update current selected item visual
      if (selectedPub && selectedPub.id === pubId) {
        setSelectedPub(prev => prev ? { ...prev, copywriting: optimizedStr } : null);
      }

    } catch (err: any) {
      console.error(err);
      alert("Impossible de polir le texte : " + err.message);
    } finally {
      setIsOptimizingCopy(false);
    }
  };

  // Add on calendar selection helper
  const handleAddOnDate = (dateString: string) => {
    setFormData({
      date: dateString,
      endDate: "",
      title: "",
      channel: channels[0] || "LinkedIn",
      persona: personas[0] || "CTO / Leaders Tech",
      status: statuses[0] || "Idée",
      copywriting: "",
      kpi: kpis[0] || "Engagement"
    });
    setSelectedPub(null);
    setShowFormModal(true);
  };

  // Clean form modal launch
  const handleNewPublication = () => {
    setFormData({
      date: "2026-06-17",
      endDate: "",
      title: "",
      channel: channels[0] || "LinkedIn",
      persona: personas[0] || "CTO / Leaders Tech",
      status: statuses[0] || "Idée",
      copywriting: "",
      kpi: kpis[0] || "Engagement",
    });
    setSelectedPub(null);
    setShowFormModal(true);
  };

  // Trigger edit of existing publication
  const handleSelectPubForEdit = (pub: Publication) => {
    setSelectedPub(pub);
    setFormData({ ...pub });
    setShowFormModal(true);
  };

  // Form Submission
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.date) {
      alert("Le titre et la date sont obligatoires.");
      return;
    }

    if (formData.endDate && new Date(formData.endDate) < new Date(formData.date)) {
      alert("La date de fin ne peut pas être antérieure à la date de début.");
      return;
    }

    const payload: Publication = {
      id: selectedPub ? selectedPub.id : `pub-${Date.now()}`,
      date: formData.date || "2026-06-17",
      endDate: formData.endDate || undefined,
      title: formData.title || "Titre vide",
      channel: (formData.channel as ChannelType) || "LinkedIn",
      persona: formData.persona || "Tous publics",
      status: (formData.status as StatusType) || "Idée",
      copywriting: formData.copywriting || "",
      kpi: (formData.kpi as KpiType) || "Engagement",
      createdBy: selectedPub ? (selectedPub.createdBy || currentUserId) : currentUserId,
    };

    if (selectedPub) {
      // Modify
      setPublications(prev => prev.map(p => p.id === selectedPub.id ? payload : p));
    } else {
      // Add new
      setPublications(prev => [...prev, payload]);
    }

    setShowFormModal(false);
    setSelectedPub(null);
  };

  const handleDeletePub = (id: string) => {
    setPublications(prev => prev.filter(p => p.id !== id));
    if (selectedPub?.id === id) {
      setSelectedPub(null);
    }
  };

  // Quick helper to copy optimized copywriting to clipboard
  const handleCopyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTextId(id);
    setTimeout(() => setCopiedTextId(null), 2000);
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden" id="app-root">
      
      {/* Sidebar - Matching exactly Professional Polish Theme */}
      <aside className="w-80 bg-slate-950 flex flex-col border-r border-slate-900 overflow-y-auto shrink-0 select-none">
        
        {/* Brand identity */}
        <div className="p-6 pb-2.5">
          <h1 className="text-white font-extrabold text-xl tracking-tight flex items-center gap-2">
            <span className="p-1.5 bg-indigo-600 rounded-lg text-white">
              <CalendarIcon className="h-5 w-5" />
            </span>
            <span>EditoFlow</span>
          </h1>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1.5">
            CALENDRIER ÉDITORIAL INTELLIGENT
          </p>
        </div>

        {/* Current Active User Profile Selector with role status */}
        <div className="mx-4 my-2 p-3 bg-slate-900 border border-slate-855 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
              Profil Actif / Rôle
            </span>
            <span className={`text-[9.5px] font-extrabold px-1.5 py-0.5 rounded-md uppercase tracking-wide ${
              activeUser.role === "editor" 
                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" 
                : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
            }`}>
              {activeUser.role === "editor" ? "Éditeur" : "Lecteur seul"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xl shrink-0 select-none">{activeUser.avatar || "👤"}</span>
            <div className="min-w-0 flex-1">
              <select 
                value={currentUserId}
                onChange={(e) => setCurrentUserId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-100 font-extrabold rounded-lg px-2 py-1.5 cursor-pointer focus:outline-none focus:border-indigo-650"
              >
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role === "editor" ? "Modif" : "Lecture"})
                  </option>
                ))}
              </select>
            </div>
          </div>
          {activeUser.role === "viewer" && (
            <div className="mt-2 text-[9px] text-amber-400 bg-amber-500/5 px-2 py-1.5 rounded-lg border border-amber-500/10 flex items-center gap-1 font-semibold leading-normal select-none">
              🔒 Écritures désactivées
            </div>
          )}
        </div>

        {/* Navigation selectors */}
        <nav className="px-4 py-4 space-y-1">
          <button 
            onClick={() => setActiveTab("dashboard")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "dashboard" 
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10" 
                : "text-slate-400 hover:text-slate-100 hover:bg-slate-900"
            }`}
          >
            <BarChart className="h-4.5 w-4.5" />
            <span>Dashboard Global</span>
          </button>

          <button 
            onClick={() => setActiveTab("calendar")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "calendar" 
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10" 
                : "text-slate-400 hover:text-slate-100 hover:bg-slate-900"
            }`}
          >
            <CalendarIcon className="h-4.5 w-4.5" />
            <span>Calendrier Mensuel</span>
          </button>

          <button 
            onClick={() => setActiveTab("list")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "list" 
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10" 
                : "text-slate-400 hover:text-slate-100 hover:bg-slate-900"
            }`}
          >
            <List className="h-4.5 w-4.5" />
            <span>Liste de Production</span>
          </button>

          <button 
            onClick={() => setActiveTab("technique")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "technique" 
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10" 
                : "text-slate-400 hover:text-slate-100 hover:bg-slate-900"
            }`}
          >
            <Settings className="h-4.5 w-4.5" />
            <span>Configuration Technique</span>
          </button>
        </nav>

        {/* Directive 1: Input sector for raw/unstructured ideas */}
        <div className="mx-4 p-4.5 bg-slate-900/60 rounded-xl border border-slate-900 space-y-3.5 mt-2">
          <div className="flex items-center space-x-1.5 text-indigo-400">
            <Sparkles className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Brainstorming IA</span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Désactivez la routine. Saisissez vos idées en vrac : l'IA va structurer, planifier et optimiser les publications.
          </p>

          <div className="space-y-2">
            <textarea
              value={rawIdeaInput}
              onChange={(e) => setRawIdeaInput(e.target.value)}
              placeholder="Idée 1: Un post LinkedIn sur l'usage de Recharts pour la dataviz.
Idée 2: Un article de blog pour annoncer notre intégration Stripe."
              rows={3}
              className="w-full text-xs bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg p-2.5 text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            
            <button
              onClick={handleParseIdeas}
              disabled={activeUser.role === "viewer" || isParsingIdeas || !rawIdeaInput.trim()}
              className="w-full flex items-center justify-center space-x-2 bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-indigo-950/20 disabled:text-slate-500 py-1.5 px-3 rounded-lg text-xs font-bold transition-all"
            >
              {isParsingIdeas ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Traitement en cours...</span>
                </>
              ) : activeUser.role === "viewer" ? (
                <>
                  <span>🔒 Droits insuffisants (Lecture)</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3 w-3" />
                  <span>Générer Publications</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Dynamic Alerts and Coherehce Module (Directive 3) */}
        <div className="p-4 mt-auto">
          {isValidating ? (
            <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-900 text-slate-500 text-[11px] flex items-center justify-center space-x-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Analyse de cohérence en cours...</span>
            </div>
          ) : alerts.length > 0 ? (
            <div className="space-y-3">
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider px-1">
                Conformité & Cohérence ({alerts.length})
              </div>
              
              <div className="max-h-[160px] overflow-y-auto space-y-2 scrollbar-thin">
                {alerts.map((alert, index) => (
                  <div 
                    key={index} 
                    className={`rounded-xl p-3 border text-xs ${
                      alert.type === "warning" 
                        ? "bg-amber-950/20 border-amber-900/40 text-amber-300" 
                        : "bg-indigo-950/20 border-indigo-900/40 text-indigo-300"
                    }`}
                  >
                    <div className="flex items-start space-x-2">
                      <span className="mt-0.5 shrink-0">
                        {alert.type === "warning" ? (
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                        ) : (
                          <Info className="h-3.5 w-3.5 text-indigo-400" />
                        )}
                      </span>
                      <div className="space-y-1">
                        <p className="font-bold leading-normal">{alert.message}</p>
                        <p className="text-[10px] text-slate-400 leading-relaxed italic">
                          💡 Suggestion : {alert.suggestion}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/40 p-3.5 rounded-xl border border-slate-900 text-slate-400 text-xs">
              <div className="flex items-center space-x-2 text-emerald-400">
                <Check className="h-4 w-4" />
                <span className="font-bold uppercase tracking-wider text-[10px]">Calendrier Conforme</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Excellent planning. Aucun chevauchement ni surcharge détecté.</p>
            </div>
          )}
        </div>

      </aside>

      {/* Main Container Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* Top Header - Matching style specification */}
        <header className="bg-white border-b border-slate-200 px-8 py-6 shrink-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {activeTab === "dashboard" && "Dashboard Global"}
              {activeTab === "calendar" && "Calendrier Mensuel"}
              {activeTab === "list" && "Liste de Production"}
              {activeTab === "technique" && "Configuration Technique"}
            </h2>
            <p className="text-xs font-semibold text-slate-400 mt-1">
              Date courante simulée : 17 Juin 2026 • Alignement du tunnel d'acquisition marketing.
            </p>
          </div>

          <button 
            onClick={activeUser.role === "viewer" ? undefined : handleNewPublication}
            disabled={activeUser.role === "viewer"}
            className={`flex items-center space-x-2 font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm active:scale-95 transition-all ${
              activeUser.role === "viewer"
                ? "bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed opacity-75"
                : "bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-600/10 cursor-pointer"
            }`}
            title={activeUser.role === "viewer" ? "Seuls les Éditeurs peuvent créer des publications" : "Créer une nouvelle publication"}
          >
            <Plus className="h-4.5 w-4.5" />
            <span>Nouvelle Publication</span>
          </button>
        </header>

        {/* Interactive Main Body Sector */}
        <section className="flex-1 p-8 space-y-8" id="view-layer">
          
          {activeTab === "dashboard" && <Dashboard publications={publications} />}
          {activeTab === "calendar" && (
            <CalendarView 
              publications={publications} 
              onSelectPublication={handleSelectPubForEdit} 
              onAddOnDate={handleAddOnDate}
              channels={channels}
              personas={personas}
              users={users}
              activeUser={activeUser}
            />
          )}
          {activeTab === "list" && (
            <PublicationTable 
              publications={publications} 
              onSelectPublication={handleSelectPubForEdit}
              onDeletePublication={handleDeletePub}
              channels={channels}
              statuses={statuses}
              users={users}
              activeUser={activeUser}
            />
          )}

          {activeTab === "technique" && (
            <div className="space-y-6" id="tech-setup-container">
              {/* Technical configuration header card */}
              <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                <h3 className="text-lg font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                  <Settings className="h-5 w-5 text-indigo-500" />
                  <span>Gestion Technique des Taxonomies</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Configurez dynamiquement les choix disponibles pour l'ensemble de votre calendrier éditorial. Les nouveaux éléments s'intègrent instantanément dans vos outils de création, de filtrage et d'affichage.
                </p>
              </div>

              {/* Section Gestion des Utilisateurs & Rôles (Nouveau) */}
              <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-6" id="user-management-section">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                      <Users className="h-5 w-5 text-indigo-500" />
                      <span>Gestion des Utilisateurs, Rôles & Droits</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Déclarez des collaborateurs, attribuez-leur des rôles de droits et simulez leur expérience en temps réel.
                    </p>
                  </div>
                  
                  <div className="text-xs font-semibold text-slate-500 shrink-0">
                    <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 px-3 py-1 rounded-full font-bold">
                      {users.length} Profil{users.length > 1 ? "s" : ""} enregistré{users.length > 1 ? "s" : ""}
                    </span>
                  </div>
                </div>

                {/* Return values alerts for Inline User feedback (Standard interface feedback) */}
                {(userFormError || userFormSuccess) && (
                  <div className="space-y-2">
                    {userFormError && (
                      <div className="p-3 bg-red-50 border border-red-250/50 text-red-800 text-xs font-semibold rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" />
                          <span>{userFormError}</span>
                        </div>
                        <button onClick={() => setUserFormError(null)} className="text-red-400 hover:text-red-700 font-bold px-1 text-sm cursor-pointer">×</button>
                      </div>
                    )}
                    {userFormSuccess && (
                      <div className="p-3 bg-emerald-50 border border-emerald-250/20 text-emerald-800 text-xs font-semibold rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 shrink-0 text-emerald-500" />
                          <span>{userFormSuccess}</span>
                        </div>
                        <button onClick={() => setUserFormSuccess(null)} className="text-emerald-400 hover:text-emerald-700 font-bold px-1 text-sm cursor-pointer">×</button>
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Reconnaissance par Email widget */}
                  <div className="bg-gradient-to-r from-indigo-500 to-indigo-700 rounded-xl p-5 text-white space-y-3 shadow-md lg:col-span-3">
                    <div className="flex items-center gap-2">
                      <Mail className="h-5 w-5 text-indigo-100" />
                      <h4 className="text-sm font-extrabold tracking-tight">Accès & Reconnaissance par adresse e-mail</h4>
                    </div>
                    <p className="text-xs text-indigo-100 max-w-xl">
                      Saisissez votre e-mail pour que l'application charge automatiquement votre profil personnel et vos permissions associées.
                    </p>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const emailInput = e.currentTarget.elements.namedItem("recognize_email") as HTMLInputElement;
                        const email = emailInput.value.trim().toLowerCase();
                        if (!email) return;
                        
                        const matchedUser = users.find(u => u.email.toLowerCase() === email);
                        if (matchedUser) {
                          setCurrentUserId(matchedUser.id);
                          setUserFormSuccess(`Utilisateur identifié avec succès. Bienvenue, ${matchedUser.name} (${matchedUser.role === 'editor' ? 'Éditeur' : 'Lecteur seul'}) !`);
                          setUserFormError(null);
                        } else {
                          setUserFormError(`Aucun collaborateur trouvé pour l'adresse mail "${email}". Vous pouvez l'ajouter ci-dessous.`);
                          setUserFormSuccess(null);
                        }
                        e.currentTarget.reset();
                      }}
                      className="flex gap-2 max-w-md pt-1"
                    >
                      <input
                        name="recognize_email"
                        type="email"
                        placeholder="Ex: jeremy.vanderverren@ucm.be"
                        className="flex-1 text-xs bg-white/10 backdrop-blur-xs border border-white/20 rounded-lg px-3 py-2 text-white placeholder:text-indigo-250 focus:outline-none focus:bg-white focus:text-slate-800 transition-all font-semibold"
                        required
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 bg-white text-indigo-700 hover:bg-indigo-50 rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer shrink-0"
                      >
                        Se connecter
                      </button>
                    </form>
                  </div>

                  {/* Formulaire de création d'utilisateur */}
                  <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 space-y-4">
                    <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                      <Plus className="h-3.5 w-3.5 text-indigo-550" />
                      <span>Ajouter un collaborateur</span>
                    </h4>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const form = e.currentTarget;
                        const nameInput = form.elements.namedItem("user_name") as HTMLInputElement;
                        const emailInput = form.elements.namedItem("user_email") as HTMLInputElement;
                        const roleSelect = form.elements.namedItem("user_role") as HTMLSelectElement;
                        const avatarSelect = form.elements.namedItem("user_avatar") as HTMLSelectElement;
                        
                        const name = nameInput.value.trim();
                        const email = emailInput.value.trim().toLowerCase();
                        if (!name || !email) return;
                        
                        if (users.some(u => u.name.toLowerCase() === name.toLowerCase())) {
                          setUserFormError("Un collaborateur avec ce nom existe déjà.");
                          setUserFormSuccess(null);
                          return;
                        }

                        if (users.some(u => u.email.toLowerCase() === email)) {
                          setUserFormError("Cette adresse e-mail est déjà associée à un autre utilisateur.");
                          setUserFormSuccess(null);
                          return;
                        }
                        
                        const newUser: UserProfile = {
                          id: `u-${Date.now()}`,
                          name,
                          email,
                          role: roleSelect.value as "editor" | "viewer",
                          avatar: avatarSelect.value
                        };
                        
                        setUsers(prev => [...prev, newUser]);
                        setUserFormSuccess(`Le collaborateur ${name} (${email}) a été enregistré avec succès !`);
                        setUserFormError(null);
                        form.reset();
                      }}
                      className="space-y-3"
                    >
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-500">Nom Complet</label>
                        <input
                          name="user_name"
                          type="text"
                          placeholder="Ex: Jérémy V."
                          className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500"
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-500">Adresse e-mail unique</label>
                        <input
                          name="user_email"
                          type="email"
                          placeholder="Ex: jeremy.vanderverren@ucm.be"
                          className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500"
                          required
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-500">Droits / Rôle</label>
                          <select
                            name="user_role"
                            className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-lg px-2 py-2 text-slate-850 cursor-pointer focus:outline-none focus:border-indigo-500"
                          >
                            <option value="editor">Admin/Éditeur</option>
                            <option value="viewer">Lecteur Seul</option>
                          </select>
                        </div>
                        
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-500">Avatar</label>
                          <select
                            name="user_avatar"
                            className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-lg px-2 py-2 text-slate-850 cursor-pointer focus:outline-none focus:border-indigo-500"
                          >
                            <option value="👨‍💻">👨‍💻 Tech Dev</option>
                            <option value="👩‍💼">👩‍💼 Manager</option>
                            <option value="👨‍🎨">👨‍🎨 Designer</option>
                            <option value="👩‍🔬">👩‍🔬 Analyst</option>
                            <option value="👩‍💻">👩‍💻 Copywriter</option>
                            <option value="👤">👤 Neutre</option>
                          </select>
                        </div>
                      </div>
                      
                      <button
                        type="submit"
                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/10 cursor-pointer text-center"
                      >
                        Enregistrer le Collaborateur
                      </button>
                    </form>
                  </div>

                  {/* Liste des profils */}
                  <div className="lg:col-span-2 space-y-3">
                    <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-widest pl-1">
                      Liste des Profils & Simulateur de Session
                    </h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-1">
                      {users.map(u => {
                        const isActive = u.id === currentUserId;
                        const isConfirmingDelete = deletingUserId === u.id;

                        return (
                          <div 
                            key={u.id} 
                            className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all gap-3 ${
                              isActive 
                                ? "bg-indigo-50/50 border-indigo-200 ring-2 ring-indigo-500/10" 
                                : "bg-white border-slate-100 hover:border-slate-200"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3 min-w-0">
                              <div className="flex items-center gap-3 min-w-0">
                                <span className="text-2xl shrink-0 select-none">{u.avatar || "👤"}</span>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-extrabold text-slate-800 text-xs truncate">{u.name}</span>
                                    {isActive && (
                                      <span className="text-[8px] bg-indigo-600 text-white px-1.5 py-0.5 rounded font-extrabold uppercase tracking-wide">
                                        Simulé
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-slate-400 font-semibold truncate" title={u.email}>
                                    {u.email}
                                  </div>
                                  <span className={`text-[9px] flex items-center gap-1 font-bold mt-1 ${
                                    u.role === "editor" ? "text-emerald-650" : "text-amber-655"
                                  }`}>
                                    {u.role === "editor" ? "✍️ modification complète" : "👁️ lecture seule"}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center space-x-1 shrink-0">
                                {!isActive ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setCurrentUserId(u.id);
                                      setDeletingUserId(null); // Clear deleting state to avoid confusing UX
                                    }}
                                    className="text-[10px] font-extrabold text-indigo-600 hover:bg-indigo-50 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                                  >
                                    Activer
                                  </button>
                                ) : (
                                  <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-lg select-none">
                                    En cours
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Delete management: standard inline confirmation panel to fix iframe bugs */}
                            <div className="border-t border-slate-50 pt-2 flex items-center justify-between text-[11px]">
                              {isConfirmingDelete ? (
                                <div className="flex items-center justify-between w-full bg-red-50 text-red-800 p-2 rounded-lg gap-2">
                                  <span className="font-extrabold text-[10px]">Confirmer suppression ?</span>
                                  <div className="flex space-x-1.5 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (users.length <= 1) {
                                          setUserFormError("Action impossible : au moins un collaborateur doit être configuré.");
                                          setDeletingUserId(null);
                                          return;
                                        }
                                        
                                        // Execute delete
                                        const remainingUsers = users.filter(item => item.id !== u.id);
                                        setUsers(remainingUsers);
                                        setUserFormSuccess(`Le profil de ${u.name} a été supprimé définitivement.`);
                                        setUserFormError(null);
                                        
                                        if (isActive) {
                                          const fallback = remainingUsers[0];
                                          if (fallback) setCurrentUserId(fallback.id);
                                        }
                                        
                                        setDeletingUserId(null);
                                      }}
                                      className="bg-red-650 hover:bg-red-700 text-white font-extrabold px-2.5 py-1 rounded-md transition-colors cursor-pointer"
                                    >
                                      Oui
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setDeletingUserId(null)}
                                      className="bg-slate-250 text-slate-700 hover:bg-slate-300 font-extrabold px-2.5 py-1 rounded-md transition-colors cursor-pointer"
                                    >
                                      Non
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex justify-between items-center w-full">
                                  <span className="text-[9px] text-slate-400 font-medium">ID: {u.id}</span>
                                  <button
                                    type="button"
                                    onClick={() => setDeletingUserId(u.id)}
                                    className="text-slate-400 hover:text-red-500 p-1 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer flex items-center gap-1 font-bold text-[9px]"
                                    title="Supprimer ce profil"
                                  >
                                    <X className="h-3 w-3" />
                                    <span>Supprimer</span>
                                  </button>
                                </div>
                              )}
                            </div>

                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Grid of config sections */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* 1. Canaux */}
                <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-bold text-slate-800">Canaux de communication</h4>
                    <span className="text-[10px] bg-blue-50 text-blue-600 border border-blue-100 font-extrabold px-2 py-0.5 rounded-full">
                      {channels.length} au total
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {channels.map(channel => (
                        <span key={channel} className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-slate-50 border border-slate-200 text-slate-700 rounded-xl">
                          <span>{channel}</span>
                          {activeUser.role !== "viewer" && (
                            <button 
                              type="button"
                              onClick={() => {
                                if (channels.length <= 1) {
                                  alert("Vous devez conserver au moins un canal.");
                                  return;
                                }
                                setChannels(prev => prev.filter(c => c !== channel));
                              }}
                              className="text-slate-450 hover:text-red-500 font-bold ml-0.5 cursor-pointer"
                            >
                              ×
                            </button>
                          )}
                        </span>
                      ))}
                    </div>
                    
                    {/* Add Channel */}
                    {activeUser.role !== "viewer" ? (
                      <form 
                        onSubmit={(e) => {
                          e.preventDefault();
                          const val = (e.currentTarget.elements.namedItem("new_channel") as HTMLInputElement).value.trim();
                          if (!val) return;
                          if (channels.includes(val)) {
                            alert("Ce canal existe déjà.");
                            return;
                          }
                          setChannels(prev => [...prev, val]);
                          e.currentTarget.reset();
                        }}
                        className="flex gap-2 pt-2"
                      >
                        <input 
                          name="new_channel"
                          type="text" 
                          placeholder="Nouveau canal (ex: TikTok, Pinterest...)"
                          className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 font-semibold text-slate-800"
                          required
                        />
                        <button type="submit" className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer">
                          Ajouter
                        </button>
                      </form>
                    ) : (
                      <p className="text-[10px] text-slate-400 italic pt-2">🔒 Mode lecture seule : seul un éditeur peut modifier la liste des canaux.</p>
                    )}
                  </div>
                </div>

                {/* 2. KPIs */}
                <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-bold text-slate-800">KPIs de succès</h4>
                    <span className="text-[10px] bg-indigo-50 text-indigo-650 border border-indigo-100 font-extrabold px-2 py-0.5 rounded-full">
                      {kpis.length} au total
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {kpis.map(kpi => (
                        <span key={kpi} className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-slate-50 border border-slate-200 text-slate-700 rounded-xl">
                          <span>{kpi}</span>
                          {activeUser.role !== "viewer" && (
                            <button 
                              type="button"
                              onClick={() => {
                                if (kpis.length <= 1) {
                                  alert("Vous devez conserver au moins un KPI.");
                                  return;
                                }
                                setKpis(prev => prev.filter(k => k !== kpi));
                              }}
                              className="text-slate-450 hover:text-red-500 font-bold ml-0.5 cursor-pointer"
                            >
                              ×
                            </button>
                          )}
                        </span>
                      ))}
                    </div>
                    
                    {/* Add KPI */}
                    {activeUser.role !== "viewer" ? (
                      <form 
                        onSubmit={(e) => {
                          e.preventDefault();
                          const val = (e.currentTarget.elements.namedItem("new_kpi") as HTMLInputElement).value.trim();
                          if (!val) return;
                          if (kpis.includes(val)) {
                            alert("Ce KPI existe déjà.");
                            return;
                          }
                          setKpis(prev => [...prev, val]);
                          e.currentTarget.reset();
                        }}
                        className="flex gap-2 pt-2"
                      >
                        <input 
                          name="new_kpi"
                          type="text" 
                          placeholder="Nouveau KPI (ex: ..."
                          className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 font-semibold text-slate-800"
                          required
                        />
                        <button type="submit" className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer">
                          Ajouter
                        </button>
                      </form>
                    ) : (
                      <p className="text-[10px] text-slate-400 italic pt-2">🔒 Mode lecture seule : seul un éditeur peut modifier la liste des KPIs.</p>
                    )}
                  </div>
                </div>

                {/* 3. Statuts */}
                <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-bold text-slate-800">Statuts de production</h4>
                    <span className="text-[10px] bg-purple-50 text-purple-600 border border-purple-100 font-extrabold px-2 py-0.5 rounded-full">
                      {statuses.length} au total
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {statuses.map(status => (
                        <span key={status} className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-slate-50 border border-slate-200 text-slate-700 rounded-xl">
                          <span>{status}</span>
                          {activeUser.role !== "viewer" && (
                            <button 
                              type="button"
                              onClick={() => {
                                if (statuses.length <= 1) {
                                  alert("Vous devez conserver au moins un statut.");
                                  return;
                                }
                                setStatuses(prev => prev.filter(s => s !== status));
                              }}
                              className="text-slate-455 hover:text-red-500 font-bold ml-0.5 cursor-pointer"
                            >
                              ×
                            </button>
                          )}
                        </span>
                      ))}
                    </div>
                    
                    {/* Add Status */}
                    {activeUser.role !== "viewer" ? (
                      <form 
                        onSubmit={(e) => {
                          e.preventDefault();
                          const val = (e.currentTarget.elements.namedItem("new_status") as HTMLInputElement).value.trim();
                          if (!val) return;
                          if (statuses.includes(val)) {
                            alert("Ce statut existe déjà.");
                            return;
                          }
                          setStatuses(prev => [...prev, val]);
                          e.currentTarget.reset();
                        }}
                        className="flex gap-2 pt-2"
                      >
                        <input 
                          name="new_status"
                          type="text" 
                          placeholder="Nouveau statut (ex: ..."
                          className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 font-semibold text-slate-800"
                          required
                        />
                        <button type="submit" className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer">
                          Ajouter
                        </button>
                      </form>
                    ) : (
                      <p className="text-[10px] text-slate-400 italic pt-2">🔒 Mode lecture seule : seul un éditeur peut modifier la liste des statuts.</p>
                    )}
                  </div>
                </div>

                 {/* 4. Publics Cibles / Personas */}
                 <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
                   <div className="flex justify-between items-center">
                     <h4 className="text-sm font-bold text-slate-800">Publics Cibles (Personas)</h4>
                     <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-100 font-extrabold px-2 py-0.5 rounded-full">
                       {personas.length} au total
                     </span>
                   </div>
                   <div className="space-y-2">
                     <div className="flex flex-wrap gap-2">
                       {personas.map(persona => (
                         <span key={persona} className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-slate-50 border border-slate-200 text-slate-700 rounded-xl" title={persona}>
                           <span className="truncate max-w-[150px]">{persona}</span>
                           {activeUser.role !== "viewer" && (
                             <button 
                               type="button"
                               onClick={() => {
                                 if (personas.length <= 1) {
                                   alert("Vous devez conserver au moins un public cible.");
                                   return;
                                 }
                                 setPersonas(prev => prev.filter(p => p !== persona));
                               }}
                               className="text-slate-455 hover:text-red-500 font-bold ml-0.5 cursor-pointer"
                             >
                               ×
                             </button>
                           )}
                         </span>
                       ))}
                     </div>
                     
                     {/* Add Persona / Target */}
                     {activeUser.role !== "viewer" ? (
                       <form 
                         onSubmit={(e) => {
                           e.preventDefault();
                           const val = (e.currentTarget.elements.namedItem("new_persona") as HTMLInputElement).value.trim();
                           if (!val) return;
                           if (personas.includes(val)) {
                             alert("Ce public cible existe déjà.");
                             return;
                           }
                           setPersonas(prev => [...prev, val]);
                           e.currentTarget.reset();
                         }}
                         className="flex gap-2 pt-2"
                       >
                         <input 
                           name="new_persona"
                           type="text" 
                           placeholder="Nouveau persona (ex: Freelances, Managers...)"
                           className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 font-semibold text-slate-800"
                           required
                         />
                         <button type="submit" className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer">
                           Ajouter
                         </button>
                       </form>
                     ) : (
                       <p className="text-[10px] text-slate-400 italic pt-2">🔒 Mode lecture seule : seul un éditeur peut modifier la liste des publics cibles.</p>
                     )}
                   </div>
                 </div>

               </div>

               {/* Reset defaults block */}
               {activeUser.role !== "viewer" ? (
                 <div className="bg-slate-50 rounded-2xl border border-slate-100 p-5 flex flex-col sm:flex-row justify-between items-center gap-4">
                   <div className="text-left">
                     <h5 className="text-xs font-bold text-slate-800">Restaurer la configuration d'origine ?</h5>
                     <p className="text-[11px] text-slate-400 mt-0.5">Cela écrasera vos modifications de canaux, KPIs, statuts et personas par les valeurs standards d'EditoFlow.</p>
                   </div>
                   <button
                     type="button"
                     onClick={() => {
                       if (confirm("Voulez-vous vraiment restaurer les taxonomies par défaut ? Vos publications existantes ne seront pas supprimées.")) {
                         setChannels(["LinkedIn", "Blog", "Newsletter", "Instagram"]);
                         setKpis(["Engagement", "Trafic", "Leads"]);
                         setStatuses(["Idée", "En rédaction", "En révision", "Planifié", "Publié"]);
                         setPersonas(["CTO / Leaders Tech", "CEO & Fondateurs", "Futurs Talents", "Tous abonnés"]);
                         alert("Configuration technique restaurée !");
                       }
                     }}
                     className="px-4 py-2 border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition-all shadow-xs shrink-0 cursor-pointer"
                   >
                     Restaurer les valeurs globales
                   </button>
                 </div>
               ) : (
                 <div className="bg-slate-100/50 rounded-2xl border border-slate-250/20 p-5 text-center text-slate-400 font-bold text-xs italic">
                   💡 Les fonctions de modification de configuration générale sont désactivées pour les comptes Invité (Lecteur). Activer une session Éditeur pour y accéder.
                 </div>
               )}

            </div>
          )}

          {/* Bottom Custom Draft Copywriting Block - Deliverables and Directives Highlight */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-4 mb-4 gap-2">
              <div>
                <h4 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                  <BookOpen className="h-4.5 w-4.5 text-indigo-500" />
                  <span>Draft Copywriting Actif & Rédaction</span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Visualisez, optimisez ou modifiez votre texte de publication final à copier-coller.
                </p>
              </div>

              {publications.length > 0 && (
                <div className="text-xs font-semibold text-slate-500 min-w-[200px]">
                  Sélectionner un post :
                  <select 
                    onChange={(e) => {
                      const matched = publications.find(p => p.id === e.target.value);
                      if (matched) handleSelectPubForEdit(matched);
                    }}
                    className="ml-2 bg-slate-50 border border-slate-200 rounded-lg p-1 text-xs text-slate-700 cursor-pointer font-bold focus:outline-none"
                  >
                    <option value="">-- Choisir --</option>
                    {publications.map(p => (
                      <option key={p.id} value={p.id}>{p.title} ({p.channel})</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {selectedPub ? (
              <div className="space-y-4">
                
                {/* Visualizing item summary info card */}
                <div className="bg-slate-50 rounded-xl p-4 flex flex-wrap gap-4 items-center justify-between text-xs font-semibold border border-slate-100">
                  <div>
                    <span className="text-slate-400">Sujet :</span>{" "}
                    <span className="text-slate-800 font-extrabold">{selectedPub.title}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Canal :</span>{" "}
                    <span className="text-indigo-650 bg-indigo-55/10 px-2 py-0.5 rounded font-bold">
                      {selectedPub.channel}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">Cible :</span>{" "}
                    <span className="text-slate-700 font-bold">{selectedPub.persona}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Statut actuel :</span>{" "}
                    <span className="text-slate-700 font-bold">{selectedPub.status}</span>
                  </div>
                </div>

                {/* Directive 2: Mini Copywriting optimized display boxes */}
                <div className="bg-slate-900 border border-slate-850 rounded-xl p-4 text-slate-100 relative overflow-hidden">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 border-b border-slate-800/80 pb-2">
                    <span className="flex items-center space-x-1.5 text-indigo-400">
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Accroche Copywriting Polie</span>
                    </span>

                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => handleOptimizeCopywriting(selectedPub.id)}
                        disabled={isOptimizingCopy}
                        className="text-[10px] text-indigo-300 hover:text-white flex items-center space-x-1 font-bold bg-indigo-500/10 hover:bg-indigo-500/20 px-2 py-1 rounded transition-colors"
                      >
                        {isOptimizingCopy ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin" />
                            <span>Optimisation...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-2.5 w-2.5" />
                            <span>Polir Copywriting (Gemini)</span>
                          </>
                        )}
                      </button>

                      <button 
                        onClick={() => handleCopyToClipboard(selectedPub.copywriting, selectedPub.id)}
                        className="text-slate-400 hover:text-white flex items-center space-x-1 font-bold"
                        title="Copier le texte"
                      >
                        {copiedTextId === selectedPub.id ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-500" />
                            <span className="text-emerald-500 text-[10px]">Copié !</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span className="text-[10px]">Copier</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <blockquote className="border-l-3 border-indigo-500 pl-4 py-1 text-slate-200 text-sm italic leading-relaxed whitespace-pre-wrap font-medium">
                    {selectedPub.copywriting || (
                      <span className="text-slate-500 italic">Aucun texte rédigé pour le moment. Cliquez sur "Éditer" pour l'ajouter ou utilisez "Polir Copywriting" pour laisser l'IA écrire pour vous.</span>
                    )}
                  </blockquote>
                </div>

              </div>
            ) : (
              <div className="text-center py-6 text-slate-400 text-xs italic">
                Aucune publication sélectionnée. Cliquez sur la ligne d'une publication, ou choisissez-en une dans le sélecteur ci-dessus pour polir son copywriting.
              </div>
            )}
          </div>

        </section>

      </main>

      {/* Structured Drawer / Modal for adding and updating a publication */}
      {showFormModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-105 shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="px-6 py-5.5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="font-extrabold text-slate-800 text-base">
                  {selectedPub ? "Modifier la Publication" : "Créer une Publication"}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Spécifiez les caractéristiques stratégiques du post.
                </p>
              </div>
              <button 
                onClick={() => {
                  setShowFormModal(false);
                  setSelectedPub(null);
                }}
                className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Modal Form body */}
            <form onSubmit={handleSaveForm} className="p-6 overflow-y-auto space-y-4">
              
              {/* Creator Info Alert Banner */}
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Auteur / Créé par :</span>
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-800">
                  {(() => {
                    const creatorId = formData.createdBy || (selectedPub ? selectedPub.createdBy : currentUserId);
                    const creator = users.find(u => u.id === creatorId);
                    return creator ? (
                      <>
                        <span className="text-sm">{creator.avatar}</span>
                        <span>{creator.name} ({creator.role === "editor" ? "Éditeur" : "Lecteur"})</span>
                      </>
                    ) : (
                      <span>👤 Inconnu</span>
                    );
                  })()}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Date Selection */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">Date de Début</label>
                  <input 
                    type="date"
                    required
                    disabled={activeUser.role === "viewer"}
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-705 focus:outline-none focus:border-indigo-500 disabled:bg-slate-100 disabled:text-slate-400"
                  />
                </div>

                {/* Optional End Date Selection */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-500">Date de Fin</label>
                    <span className="text-[9px] text-slate-400 font-bold font-mono">Optionnelle</span>
                  </div>
                  <input 
                    type="date"
                    disabled={activeUser.role === "viewer"}
                    value={formData.endDate || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value || undefined }))}
                    className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-705 focus:outline-none focus:border-indigo-500 disabled:bg-slate-100 disabled:text-slate-400"
                  />
                </div>

                {/* Channel Selection */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">Canal Stratégique</label>
                  <select 
                    value={formData.channel}
                    disabled={activeUser.role === "viewer"}
                    onChange={(e) => setFormData(prev => ({ ...prev, channel: e.target.value }))}
                    className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-705 cursor-pointer focus:outline-none focus:border-indigo-550 disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    {channels.map(channel => (
                      <option key={channel} value={channel}>{channel}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Title / Subject of publication */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Sujet / Titre de la publication</label>
                <input 
                  type="text"
                  required
                  disabled={activeUser.role === "viewer"}
                  placeholder="ex: Recrutement Tech en 2026 : Éviter les pièges classiques"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 disabled:bg-slate-100 disabled:text-slate-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Persona Target */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">Public Cible (Persona)</label>
                  <select 
                    value={formData.persona || ""}
                    disabled={activeUser.role === "viewer"}
                    onChange={(e) => setFormData(prev => ({ ...prev, persona: e.target.value }))}
                    className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 cursor-pointer focus:outline-none focus:border-indigo-550 disabled:bg-slate-100 disabled:text-slate-400"
                    required
                  >
                    <option value="" disabled>-- Choisir un persona --</option>
                    {personas.map(persona => (
                      <option key={persona} value={persona}>{persona}</option>
                    ))}
                  </select>
                </div>

                {/* KPI Targeted */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">KPI de Succès Visé</label>
                  <select 
                    value={formData.kpi}
                    disabled={activeUser.role === "viewer"}
                    onChange={(e) => setFormData(prev => ({ ...prev, kpi: e.target.value }))}
                    className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-705 cursor-pointer focus:outline-none focus:border-indigo-500 disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    {kpis.map(kpi => (
                      <option key={kpi} value={kpi}>{kpi}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {/* Status selector */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">Statut de Production</label>
                  <select 
                    value={formData.status}
                    disabled={activeUser.role === "viewer"}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-705 cursor-pointer focus:outline-none focus:border-indigo-500 disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    {statuses.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Text draft / copywriting */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-500">Copywriting / Accroche de base (Optionnel)</label>
                  <span className="text-[10px] text-indigo-400 font-semibold">Conseil : Restez impactant & concis</span>
                </div>
                <textarea 
                  placeholder="Saisissez un brouillon ou une accroche de base..."
                  disabled={activeUser.role === "viewer"}
                  value={formData.copywriting}
                  onChange={(e) => setFormData(prev => ({ ...prev, copywriting: e.target.value }))}
                  rows={4}
                  className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-800 placeholder-slate-450 focus:outline-none focus:border-indigo-500 disabled:bg-slate-100 disabled:text-slate-400"
                />
              </div>

              {/* Action buttons */}
              <div className="border-t border-slate-100 pt-4 flex justify-end space-x-2.5">
                <button 
                  type="button"
                  onClick={() => {
                    setShowFormModal(false);
                    setSelectedPub(null);
                  }}
                  className="px-4 py-2 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 transition-colors"
                >
                  {activeUser.role === "viewer" ? "Fermer" : "Annuler"}
                </button>
                {activeUser.role === "viewer" ? (
                  <span className="px-4 py-2 bg-slate-100 text-slate-400 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 select-none animate-pulse">
                    🔒 Lecture seule
                  </span>
                ) : (
                  <button 
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-xs font-bold text-white shadow-md shadow-indigo-600/10 transition-colors"
                  >
                    Confirmer
                  </button>
                )}
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
