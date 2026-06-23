import React, { useMemo } from "react";
import { Publication, ChannelType, KpiType, StatusType } from "../types";
import { 
  BarChart, 
  TrendingUp, 
  Users, 
  Layers, 
  Calendar, 
  CheckCircle, 
  FileText, 
  Sparkles 
} from "lucide-react";

interface DashboardProps {
  publications: Publication[];
}

export default function Dashboard({ publications }: DashboardProps) {
  // 1. High level figures
  const total = publications.length;
  const statusCounts = useMemo(() => {
    const counts = {
      Idée: 0,
      "En rédaction": 0,
      "En révision": 0,
      Planifié: 0,
      Publié: 0
    };
    publications.forEach(p => {
      if (p.status in counts) {
        counts[p.status as StatusType]++;
      }
    });
    return counts;
  }, [publications]);

  const readyOrPublished = statusCounts["Planifié"] + statusCounts["Publié"];

  // 2. Channel Distribution
  const channelData = useMemo(() => {
    const channels: Record<ChannelType, number> = {
      LinkedIn: 0,
      Blog: 0,
      Newsletter: 0,
      Instagram: 0
    };
    publications.forEach(p => {
      if (p.channel in channels) {
        channels[p.channel]++;
      }
    });
    return Object.entries(channels).map(([name, value]) => ({
      name: name as ChannelType,
      value,
      color: 
        name === "LinkedIn" ? "bg-blue-600" :
        name === "Blog" ? "bg-amber-500" :
        name === "Newsletter" ? "bg-emerald-500" : "bg-pink-500",
      textColor:
        name === "LinkedIn" ? "text-blue-600" :
        name === "Blog" ? "text-amber-500" :
        name === "Newsletter" ? "text-emerald-500" : "text-pink-500",
    }));
  }, [publications]);

  // 3. KPI Distribution
  const kpiData = useMemo(() => {
    const kpis: Record<KpiType, number> = {
      Trafic: 0,
      Engagement: 0,
      Leads: 0
    };
    publications.forEach(p => {
      if (p.kpi in kpis) {
        kpis[p.kpi]++;
      }
    });
    return Object.entries(kpis).map(([name, value]) => ({
      name: name as KpiType,
      value,
      color: 
        name === "Trafic" ? "#6366f1" /* indigo */ :
        name === "Engagement" ? "#ec4899" /* pink */ : "#14b8a6" /* teal */,
    }));
  }, [publications]);

  // 4. Persona Diversity
  const personaData = useMemo(() => {
    const map: Record<string, number> = {};
    publications.forEach(p => {
      const pName = p.persona ? p.persona.trim() : "Non spécifié";
      map[pName] = (map[pName] || 0) + 1;
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [publications]);

  const maxKpiValue = Math.max(...kpiData.map(d => d.value), 1);

  return (
    <div className="space-y-8" id="dashboard-root">
      
      {/* High-Level KPIs Widgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5" id="kpi-grid">
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex items-center space-x-4 hover:border-slate-200 transition-all">
          <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
            <Layers className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Publications</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">{total}</h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex items-center space-x-4 hover:border-slate-200 transition-all">
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Prêt / Publié</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">
              {readyOrPublished} <span className="text-xs text-slate-400 font-normal">({total ? Math.round((readyOrPublished / total) * 100) : 0}%)</span>
            </h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex items-center space-x-4 hover:border-slate-200 transition-all">
          <div className="p-3 bg-amber-50 rounded-xl text-amber-500">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">En cours de rédaction</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">
              {statusCounts["En rédaction"] + statusCounts["En révision"]}
            </h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex items-center space-x-4 hover:border-slate-200 transition-all">
          <div className="p-3 bg-pink-50 rounded-xl text-pink-600">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Idées en attente</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">{statusCounts["Idée"]}</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Custom SVG Chart: Publications by Channel */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h4 className="text-base font-bold text-slate-800">Volume de Publications par Canal</h4>
              <p className="text-xs text-slate-400">Répartition stratégique de la voix de marque</p>
            </div>
            <span className="p-2 bg-slate-50 rounded-lg text-slate-400">
              <Calendar className="h-4 w-4" />
            </span>
          </div>

          <div className="space-y-5">
            {channelData.map(ch => {
              const pct = total ? Math.round((ch.value / total) * 100) : 0;
              return (
                <div key={ch.name} className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-semibold text-slate-700 flex items-center space-x-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${ch.color}`}></span>
                      <span>{ch.name}</span>
                    </span>
                    <span className="text-slate-500">
                      <strong>{ch.value}</strong> post{ch.value > 1 ? "s" : ""} ({pct}%)
                    </span>
                  </div>
                  <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${ch.color}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Custom SVG Chart: Distribution by success KPI */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h4 className="text-base font-bold text-slate-800">Cibles de KPI de Succès</h4>
              <p className="text-xs text-slate-400">Objectif principal par publication</p>
            </div>
            <span className="p-2 bg-slate-50 rounded-lg text-slate-400">
              <TrendingUp className="h-4 w-4" />
            </span>
          </div>

          {/* Bar Chart Graphics custom styled in SVG */}
          <div className="flex items-end justify-around h-48 pb-3 relative">
            
            {/* Grid lines in background */}
            <div className="absolute inset-x-0 top-0 h-full flex flex-col justify-between pointer-events-none">
              <div className="border-t border-slate-100 w-full h-0"></div>
              <div className="border-t border-slate-100 w-full h-0"></div>
              <div className="border-t border-slate-100 w-full h-0"></div>
              <div className="border-t border-slate-100 w-full h-0"></div>
            </div>

            {kpiData.map(item => {
              const barHeightPct = total ? (item.value / maxKpiValue) * 80 + 10 : 10;
              return (
                <div key={item.name} className="flex flex-col items-center group relative z-10 w-16">
                  {/* Tooltip on hover */}
                  <div className="absolute -top-12 bg-slate-800 text-white text-xs px-2.5 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-md pointer-events-none">
                    {item.value} publications
                  </div>
                  
                  {/* The bar element */}
                  <div 
                    className="w-10 rounded-t-lg transition-all duration-500 hover:scale-x-105"
                    style={{ 
                      height: `${barHeightPct}%`, 
                      backgroundColor: item.color,
                      boxShadow: `0 4px 12px ${item.color}30`
                    }}
                  />

                  <span className="text-xs font-semibold text-slate-600 mt-3">{item.name}</span>
                  <span className="text-[10px] text-slate-400 font-medium">{item.value} posts</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Top Target Personas */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <h4 className="text-base font-bold text-slate-800 mb-2">Ciblage Publics Cibles (Personas)</h4>
          <p className="text-xs text-slate-400 mb-5">Vos segments les plus sollicités d'audience</p>
          
          {personaData.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">Aucune donnée disponible. Ajoutez des publications.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {personaData.map(([name, count], index) => {
                const percent = total ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={name} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                    <div className="flex items-center space-x-3">
                      <span className="h-6 w-6 bg-slate-50 border border-slate-100 rounded-md flex items-center justify-center text-xs font-bold text-indigo-500">
                        #{index + 1}
                      </span>
                      <span className="text-sm font-semibold text-slate-700">{name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs bg-indigo-55/10 text-indigo-650 px-2.5 py-1 rounded-full font-medium">
                        {count} post{count > 1 ? "s" : ""}
                      </span>
                      <span className="text-xs text-slate-300">
                        {percent}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Dynamic Marketing Health Matrix Indicator & Summary */}
        <div className="bg-slate-900 text-white rounded-2xl p-6 relative overflow-hidden shadow-sm flex flex-col justify-between">
          <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 opacity-10 pointer-events-none">
            <Users className="h-64 w-64" />
          </div>

          <div>
            <div className="flex items-center space-x-2 text-indigo-400 mb-3">
              <Sparkles className="h-5 w-5" />
              <span className="text-xs font-bold uppercase tracking-wider">Maturité de la Stratégie</span>
            </div>

            <h4 className="text-lg font-bold">Cohérence & Tunnel Editorial</h4>
            <p className="text-sm text-slate-300 mt-2 leading-relaxed">
              Pour une présence efficace, nous vous conseillons de maintenir une balance saine de KPI:
              <strong> Trafic</strong> pour attirer de nouveaux visiteurs, <strong> Engagement</strong> pour construire l'audience, et <strong> Leads</strong> pour transformer l'effort en conversions de ventes.
            </p>
          </div>

          <div className="mt-6 border-t border-slate-800 pt-5 grid grid-cols-3 gap-2">
            <div>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Cibles Actives</p>
              <h5 className="text-base font-bold text-white mt-1">{personaData.length}</h5>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Canaux Explorés</p>
              <h5 className="text-base font-bold text-white mt-1">
                {channelData.filter(d => d.value > 0).length} / 4
              </h5>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Score d'Équilibre</p>
              <h5 className="text-base font-bold text-indigo-400 mt-1">
                {total > 0 ? "Excellent" : "Saisir données"}
              </h5>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
