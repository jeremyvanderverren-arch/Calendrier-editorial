import React, { useState, useMemo } from "react";
import { Publication, UserProfile } from "../types";
import { 
  Search, 
  Trash2, 
  Edit, 
  Copy, 
  Check, 
  ExternalLink,
  Filter,
  Calendar,
  Layers,
  Sparkles,
  BarChart,
  Users
} from "lucide-react";

interface PublicationTableProps {
  publications: Publication[];
  onSelectPublication: (pub: Publication) => void;
  onDeletePublication: (id: string) => void;
  channels: string[];
  statuses: string[];
  users: UserProfile[];
  activeUser: UserProfile;
}

export default function PublicationTable({ 
  publications, 
  onSelectPublication, 
  onDeletePublication,
  channels,
  statuses,
  users,
  activeUser
}: PublicationTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterChannel, setFilterChannel] = useState<string>("Tous");
  const [filterStatus, setFilterStatus] = useState<string>("Tous");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Sorting: Default by Date descending
  const sortedAndFiltered = useMemo(() => {
    return publications
      .filter(pub => {
        const matchesSearch = 
          pub.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          pub.persona.toLowerCase().includes(searchTerm.toLowerCase()) ||
          pub.copywriting.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesChannel = filterChannel === "Tous" || pub.channel === filterChannel;
        const matchesStatus = filterStatus === "Tous" || pub.status === filterStatus;
        return matchesSearch && matchesChannel && matchesStatus;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [publications, searchTerm, filterChannel, filterStatus]);

  const handleCopy = (e: React.MouseEvent, id: string, text: string) => {
    e.stopPropagation(); // Avoid triggering row click
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getChannelBadge = (channel: string) => {
    switch (channel) {
      case "LinkedIn":
        return "bg-blue-50 text-blue-700 border-blue-100";
      case "Blog":
        return "bg-amber-50 text-amber-700 border-amber-100";
      case "Newsletter":
        return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case "Instagram":
        return "bg-pink-50 text-pink-700 border-pink-100";
      default:
        // Hash the name to assign a stable color
        const colors = [
          "bg-teal-50 text-teal-700 border-teal-100",
          "bg-violet-50 text-violet-700 border-violet-100",
          "bg-orange-55 text-orange-700 border-orange-100",
          "bg-cyan-50 text-cyan-700 border-cyan-100",
          "bg-rose-50 text-rose-700 border-rose-100",
        ];
        let hash = 0;
        for (let i = 0; i < channel.length; i++) {
          hash = channel.charCodeAt(i) + ((hash << 5) - hash);
        }
        const index = Math.abs(hash) % colors.length;
        return colors[index];
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Idée":
        return "bg-slate-100 text-slate-700 border-slate-200";
      case "En rédaction":
        return "bg-amber-50 text-amber-800 border-amber-200";
      case "En révision":
        return "bg-purple-50 text-purple-800 border-purple-200";
      case "Planifié":
        return "bg-indigo-50 text-indigo-800 border-indigo-200";
      case "Publié":
        return "bg-emerald-50 text-emerald-800 border-emerald-200";
      default:
        const colors = [
          "bg-blue-50 text-blue-800 border-blue-200",
          "bg-teal-50 text-teal-800 border-teal-200",
          "bg-pink-50 text-pink-850 border-pink-200",
          "bg-orange-50 text-orange-800 border-orange-200",
        ];
        let hash = 0;
        for (let i = 0; i < status.length; i++) {
          hash = status.charCodeAt(i) + ((hash << 5) - hash);
        }
        const index = Math.abs(hash) % colors.length;
        return colors[index];
    }
  };

  const getKpiBadge = (kpi: string) => {
    switch (kpi) {
      case "Trafic":
        return "text-indigo-600 bg-indigo-50";
      case "Engagement":
        return "text-pink-600 bg-pink-50";
      case "Leads":
        return "text-teal-600 bg-teal-50";
      default:
        const colors = [
          "text-cyan-600 bg-cyan-50",
          "text-violet-600 bg-violet-50",
          "text-amber-600 bg-amber-50",
          "text-emerald-600 bg-emerald-50",
        ];
        let hash = 0;
        for (let i = 0; i < kpi.length; i++) {
          hash = kpi.charCodeAt(i) + ((hash << 5) - hash);
        }
        const index = Math.abs(hash) % colors.length;
        return colors[index];
    }
  };

  return (
    <div className="space-y-5" id="publication-table-root">
      
      {/* Table search + filter controls */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Search bar */}
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Rechercher par titre, persona, texte..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-700"
          />
        </div>

        {/* Filter select tags */}
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          {/* Channel selector */}
          <div className="flex items-center space-x-2 bg-slate-50 rounded-xl px-3 py-1.5 border border-slate-100">
            <span className="text-xs font-semibold text-slate-400">Canal :</span>
            <select 
              value={filterChannel} 
              onChange={(e) => setFilterChannel(e.target.value)}
              className="text-xs font-bold text-slate-700 focus:outline-none bg-transparent cursor-pointer"
            >
              <option value="Tous">Tous les Canaux</option>
              {channels.map(channel => (
                <option key={channel} value={channel}>{channel}</option>
              ))}
            </select>
          </div>

          {/* Status selector */}
          <div className="flex items-center space-x-2 bg-slate-50 rounded-xl px-3 py-1.5 border border-slate-100">
            <span className="text-xs font-semibold text-slate-400">Statut :</span>
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-xs font-bold text-slate-700 focus:outline-none bg-transparent cursor-pointer"
            >
              <option value="Tous">Tous les Statuts</option>
              {statuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Database list rows */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {sortedAndFiltered.length === 0 ? (
          <div className="text-center py-16 text-slate-400 space-y-3">
            <Layers className="h-10 w-10 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold">Aucune publication ne correspond à vos filtres.</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">Essayez de modifier vos critères de recherche ou ajoutez une nouvelle publication.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Date de Publication</th>
                  <th className="px-6 py-4">Titre / Sujet</th>
                  <th className="px-6 py-4">Canal</th>
                  <th className="px-6 py-4">Public Cible (Persona)</th>
                  <th className="px-6 py-4">Auteur / Créé par</th>
                  <th className="px-6 py-4">Statut</th>
                  <th className="px-6 py-4">KPI Visé</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {sortedAndFiltered.map((pub) => (
                  <tr 
                    key={pub.id}
                    onClick={() => onSelectPublication(pub)}
                    className="hover:bg-slate-50/50 cursor-pointer transition-colors group"
                  >
                    {/* Date */}
                    <td className="px-6 py-4.5 whitespace-nowrap">
                      <div className="flex items-center space-x-2 text-slate-700 font-bold">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        <span>{pub.date}</span>
                      </div>
                    </td>

                    {/* Title */}
                    <td className="px-6 py-4.5">
                      <div>
                        <div className="font-bold text-slate-800 text-sm">{pub.title}</div>
                        {pub.copywriting && (
                          <p className="text-xs text-slate-400 mt-1 line-clamp-1 max-w-md italic">
                            "{pub.copywriting}"
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Channel */}
                    <td className="px-6 py-4.5 whitespace-nowrap">
                      <span className={`px-3 py-1 text-xs font-bold border rounded-full ${getChannelBadge(pub.channel)}`}>
                        {pub.channel}
                      </span>
                    </td>

                    {/* Target Persona */}
                    <td className="px-6 py-4.5 whitespace-nowrap">
                      <div className="flex items-center space-x-1.5 text-slate-600 font-semibold text-xs">
                        <Users className="h-3.5 w-3.5 text-slate-400" />
                        <span>{pub.persona || "Tous publics"}</span>
                      </div>
                    </td>

                    {/* Creator Auteur */}
                    <td className="px-6 py-4.5 whitespace-nowrap">
                      {(() => {
                        const creator = users.find(u => u.id === pub.createdBy);
                        return (
                          <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-700">
                            <span className="text-sm select-none shrink-0">{creator ? creator.avatar : "👤"}</span>
                            <span className="truncate max-w-[100px]" title={creator ? creator.name : "Inconnu"}>
                              {creator ? creator.name : "Jérémy"}
                            </span>
                          </div>
                        );
                      })()}
                    </td>

                    {/* Status badge */}
                    <td className="px-6 py-4.5 whitespace-nowrap">
                      <span className={`px-3 py-1 text-xs font-bold border rounded-full ${getStatusBadge(pub.status)}`}>
                        {pub.status}
                      </span>
                    </td>

                    {/* Target success KPI */}
                    <td className="px-6 py-4.5 whitespace-nowrap">
                      <span className={`px-2.5 py-1 text-xs font-bold rounded-lg ${getKpiBadge(pub.kpi)}`}>
                        {pub.kpi}
                      </span>
                    </td>

                    {/* Copy, edit, delete actions */}
                    <td className="px-6 py-4.5 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end space-x-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                        
                        {/* Copy button */}
                        {pub.copywriting && (
                          <button
                            onClick={(e) => handleCopy(e, pub.id, pub.copywriting)}
                            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                            title="Copier le texte rédigé"
                          >
                            {copiedId === pub.id ? (
                              <Check className="h-4 w-4 text-emerald-600" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </button>
                        )}

                        {/* Edit button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectPublication(pub);
                          }}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                          title={activeUser.role === "viewer" ? "Consulter la publication" : "Modifier la publication"}
                        >
                          <Edit className="h-4 w-4" />
                        </button>

                        {/* Delete button (only for editors) */}
                        {activeUser.role !== "viewer" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm("Êtes-vous sûr de vouloir supprimer cette publication ?")) {
                                onDeletePublication(pub.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Supprimer la publication"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
