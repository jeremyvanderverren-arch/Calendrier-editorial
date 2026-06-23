import React, { useState, useMemo } from "react";
import { Publication, UserProfile } from "../types";
import { 
  ChevronLeft, 
  ChevronRight, 
  Filter, 
  Users, 
  Calendar as CalendarIcon, 
  Plus, 
  Clock, 
  CheckCircle, 
  Layers,
  Sparkles,
  Zap
} from "lucide-react";

interface CalendarViewProps {
  publications: Publication[];
  onSelectPublication: (pub: Publication) => void;
  onAddOnDate: (dateString: string) => void;
  channels: string[];
  personas: string[];
  users: UserProfile[];
  activeUser: UserProfile;
}

const getDatesBetween = (startYmd: string, endYmd: string): string[] => {
  const dates: string[] = [];
  try {
    const startY = parseInt(startYmd.substring(0, 4), 10);
    const startM = parseInt(startYmd.substring(5, 7), 10) - 1;
    const startD = parseInt(startYmd.substring(8, 10), 10);

    const endY = parseInt(endYmd.substring(0, 4), 10);
    const endM = parseInt(endYmd.substring(5, 7), 10) - 1;
    const endD = parseInt(endYmd.substring(8, 10), 10);

    const start = new Date(startY, startM, startD);
    const end = new Date(endY, endM, endD);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return [startYmd];
    }
    if (end < start) {
      return [startYmd];
    }

    const current = new Date(start);
    while (current <= end) {
      const y = current.getFullYear();
      const m = String(current.getMonth() + 1).padStart(2, "0");
      const d = String(current.getDate()).padStart(2, "0");
      dates.push(`${y}-${m}-${d}`);
      current.setDate(current.getDate() + 1);
    }
  } catch (e) {
    console.error(e);
    return [startYmd];
  }
  return dates;
};

const getDaysDifference = (fromYmd: string, toYmd: string): number => {
  try {
    const fY = parseInt(fromYmd.substring(0, 4), 10);
    const fM = parseInt(fromYmd.substring(5, 7), 10) - 1;
    const fD = parseInt(fromYmd.substring(8, 10), 10);

    const tY = parseInt(toYmd.substring(0, 4), 10);
    const tM = parseInt(toYmd.substring(5, 7), 10) - 1;
    const tD = parseInt(toYmd.substring(8, 10), 10);

    const fromDate = new Date(fY, fM, fD);
    const toDate = new Date(tY, tM, tD);

    const diffTime = toDate.getTime() - fromDate.getTime();
    return Math.round(diffTime / (1000 * 60 * 60 * 24));
  } catch (e) {
    return 0;
  }
};

export default function CalendarView({ 
  publications, 
  onSelectPublication, 
  onAddOnDate,
  channels,
  personas,
  users,
  activeUser
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2026, 5, 17)); // default to June 17, 2026 as per target meta
  const [viewType, setViewType] = useState<"month" | "week" | "day">("month");
  const [filterChannel, setFilterChannel] = useState<string>("Tous");
  const [filterPersona, setFilterPersona] = useState<string>("Tous");

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Navigation handlers depending on active view
  const handlePrev = () => {
    if (viewType === "month") {
      setCurrentDate(new Date(year, month - 1, 1));
    } else if (viewType === "week") {
      const prevWeek = new Date(currentDate);
      prevWeek.setDate(currentDate.getDate() - 7);
      setCurrentDate(prevWeek);
    } else {
      const prevDay = new Date(currentDate);
      prevDay.setDate(currentDate.getDate() - 1);
      setCurrentDate(prevDay);
    }
  };

  const handleNext = () => {
    if (viewType === "month") {
      setCurrentDate(new Date(year, month + 1, 1));
    } else if (viewType === "week") {
      const nextWeek = new Date(currentDate);
      nextWeek.setDate(currentDate.getDate() + 7);
      setCurrentDate(nextWeek);
    } else {
      const nextDay = new Date(currentDate);
      nextDay.setDate(currentDate.getDate() + 1);
      setCurrentDate(nextDay);
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date(2026, 5, 17)); // Back to June 17, 2026
  };

  // Convert Date to YYYY-MM-DD
  const formatDateStr = (date: Date): string => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  };

  const currentDateStr = useMemo(() => formatDateStr(currentDate), [currentDate]);

  // Merge dynamic personas from settings + any assigned personas in publications
  const filterPersonaOptions = useMemo(() => {
    const list = new Set(personas.map(p => p.trim()));
    publications.forEach(p => {
      if (p.persona) list.add(p.persona.trim());
    });
    return Array.from(list);
  }, [personas, publications]);

  // Filtered publications
  const filteredPublications = useMemo(() => {
    return publications.filter(p => {
      const matchChannel = filterChannel === "Tous" || p.channel === filterChannel;
      const matchPersona = filterPersona === "Tous" || p.persona.trim() === filterPersona.trim();
      return matchChannel && matchPersona;
    });
  }, [publications, filterChannel, filterPersona]);

  // Calendar calculations for "MONTH" view
  const monthName = currentDate.toLocaleString("fr-FR", { month: "long", year: "numeric" });
  
  // First day of the month (0 = Sunday, 1 = Monday...) -> convert to 0 = Monday for European calendar layout
  const firstDayIndex = useMemo(() => {
    const d = new Date(year, month, 1);
    const day = d.getDay();
    return day === 0 ? 6 : day - 1; // 0=Mon, 1=Tue...6=Sun
  }, [year, month]);

  const daysInMonth = useMemo(() => {
    return new Date(year, month + 1, 0).getDate();
  }, [year, month]);

  const prevMonthDays = useMemo(() => {
    return new Date(year, month, 0).getDate();
  }, [year, month]);

  const calendarWeeks = useMemo(() => {
    const days: Array<{ dayNum: number; dateStr: string; isCurrentMonth: boolean }> = [];
    
    // Fill previous month days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dNum = prevMonthDays - i;
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, "0")}-${String(dNum).padStart(2, "0")}`;
      days.push({ dayNum: dNum, dateStr, isCurrentMonth: false });
    }

    // Fill current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
      days.push({ dayNum: i, dateStr, isCurrentMonth: true });
    }

    // Fill next month days to align index multiples of 7
    const remainingSlots = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remainingSlots; i++) {
      const nextMonth = month === 11 ? 0 : month + 1;
      const nextYear = month === 11 ? year + 1 : year;
      const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
      days.push({ dayNum: i, dateStr, isCurrentMonth: false });
    }

    // Split array into weeks of 7 days
    const weeksList = [];
    for (let i = 0; i < days.length; i += 7) {
      weeksList.push(days.slice(i, i + 7));
    }
    return weeksList;
  }, [year, month, firstDayIndex, daysInMonth, prevMonthDays]);

  // WEEK calculations: Find the monday of the current date's week
  const startOfWeek = useMemo(() => {
    const d = new Date(currentDate);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const start = new Date(d.getFullYear(), d.getMonth(), diff);
    return start;
  }, [currentDate]);

  const weekDays = useMemo(() => {
    const list = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      const dateStr = formatDateStr(d);
      list.push({
        date: d,
        dateStr,
        dayNum: d.getDate(),
        dayName: d.toLocaleString("fr-FR", { weekday: "long" }),
        formattedShort: d.toLocaleString("fr-FR", { day: "numeric", month: "short" })
      });
    }
    return list;
  }, [startOfWeek]);

  // End of Week for nicer UI labels
  const endOfWeek = useMemo(() => {
    const end = new Date(startOfWeek);
    end.setDate(startOfWeek.getDate() + 6);
    return end;
  }, [startOfWeek]);

  // Group publication by dates
  const pubByDateMap = useMemo(() => {
    const map: Record<string, Publication[]> = {};
    filteredPublications.forEach(p => {
      const dates = p.endDate ? getDatesBetween(p.date, p.endDate) : [p.date];
      dates.forEach(d => {
        if (!map[d]) {
          map[d] = [];
        }
        if (!map[d].some(existing => existing.id === p.id)) {
          map[d].push(p);
        }
      });
    });

    // Stable sort to ensure multi-day items align cleanly across week rows
    Object.keys(map).forEach(d => {
      map[d].sort((a, b) => {
        const aIsMulti = !!a.endDate && a.endDate !== a.date;
        const bIsMulti = !!b.endDate && b.endDate !== b.date;
        if (aIsMulti && !bIsMulti) return -1;
        if (!aIsMulti && bIsMulti) return 1;
        return a.id.localeCompare(b.id);
      });
    });

    return map;
  }, [filteredPublications]);

  const calendarWeeksSlots = useMemo(() => {
    return calendarWeeks.map((week) => {
      const startOfWeekYmd = week[0].dateStr;
      const endOfWeekYmd = week[6].dateStr;

      // Find all publications in filteredPublications that overlap with this week
      const pubsInWeek = filteredPublications.filter((p) => {
        const pStart = p.date;
        const pEnd = p.endDate || p.date;
        return pStart <= endOfWeekYmd && pEnd >= startOfWeekYmd;
      });

      // Sort publications: multi-day first (descending duration), then by start date, then by ID
      pubsInWeek.sort((a, b) => {
        const aEnd = a.endDate || a.date;
        const bEnd = b.endDate || b.date;
        const aDur = getDaysDifference(a.date, aEnd);
        const bDur = getDaysDifference(b.date, bEnd);
        
        if (aDur !== bDur) {
          return bDur - aDur; // longer duration first
        }
        return a.date.localeCompare(b.date); // earlier start date first
      });

      // Assign slots (each slot is an array of size 7 which contains Publication | null)
      const slots: (Publication | null)[][] = [];

      pubsInWeek.forEach((pub) => {
        const pStartYmd = pub.date;
        const pEndYmd = pub.endDate || pub.date;

        const startIdx = Math.max(0, getDaysDifference(startOfWeekYmd, pStartYmd));
        const endIdx = Math.min(6, getDaysDifference(startOfWeekYmd, pEndYmd));

        // Find the first slot where all spots from startIdx to endIdx are free
        let slotIndex = 0;
        let found = false;
        while (!found) {
          if (slotIndex >= slots.length) {
            slots.push(new Array(7).fill(null));
          }
          let free = true;
          for (let i = startIdx; i <= endIdx; i++) {
            if (slots[slotIndex][i] !== null) {
              free = false;
              break;
            }
          }
          if (free) {
            found = true;
          } else {
            slotIndex++;
          }
        }

        // Fill slot
        for (let i = startIdx; i <= endIdx; i++) {
          slots[slotIndex][i] = pub;
        }
      });

      return slots;
    });
  }, [calendarWeeks, filteredPublications]);

  const getChannelStyle = (channel: string) => {
    switch (channel) {
      case "LinkedIn":
        return "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100/70";
      case "Blog":
        return "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100/70";
      case "Newsletter":
        return "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/70";
      case "Instagram":
        return "bg-pink-50 text-pink-700 border-pink-200 hover:bg-pink-100/70";
      default:
        const colors = [
          "bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100/70",
          "bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100/70",
          "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100/70",
          "bg-cyan-50 text-cyan-700 border-cyan-200 hover:bg-cyan-100/70",
          "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100/70",
        ];
        let hash = 0;
        for (let i = 0; i < channel.length; i++) {
          hash = channel.charCodeAt(i) + ((hash << 5) - hash);
        }
        const index = Math.abs(hash) % colors.length;
        return colors[index];
    }
  };

  const getChannelColorDot = (channel: string) => {
    switch (channel) {
      case "LinkedIn": return "bg-blue-600";
      case "Blog": return "bg-amber-500";
      case "Newsletter": return "bg-emerald-500";
      case "Instagram": return "bg-pink-500";
      default:
        const colors = [
          "bg-teal-500",
          "bg-violet-500",
          "bg-orange-500",
          "bg-cyan-500",
          "bg-rose-500",
        ];
        let hash = 0;
        for (let i = 0; i < channel.length; i++) {
          hash = channel.charCodeAt(i) + ((hash << 5) - hash);
        }
        const index = Math.abs(hash) % colors.length;
        return colors[index];
    }
  };

  // Human view type labels
  const formatHeaderLabel = () => {
    if (viewType === "month") {
      return monthName;
    } else if (viewType === "week") {
      const startStr = startOfWeek.toLocaleString("fr-FR", { day: "numeric", month: "long" });
      const endStr = endOfWeek.toLocaleString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
      return `Semaine du ${startStr} au ${endStr}`;
    } else {
      return currentDate.toLocaleString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    }
  };

  return (
    <div className="space-y-6" id="calendar-view-root">
      
      {/* Calendar Filter + View Selector Controls */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        
        {/* Left Side: View Mode Toggles */}
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl shrink-0">
          <button
            onClick={() => setViewType("month")}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
              viewType === "month" 
                ? "bg-white text-slate-900 shadow-sm" 
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Mois
          </button>
          <button
            onClick={() => setViewType("week")}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
              viewType === "week" 
                ? "bg-white text-slate-900 shadow-sm" 
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Semaine
          </button>
          <button
            onClick={() => setViewType("day")}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
              viewType === "day" 
                ? "bg-white text-slate-900 shadow-sm" 
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Jour
          </button>
        </div>

        {/* Right Side: Filters */}
        <div className="flex flex-wrap gap-3 items-center w-full xl:w-auto">
          <div className="flex items-center space-x-2 text-slate-505 mr-2">
            <Filter className="h-4 w-4 text-indigo-500" />
            <span className="text-xs font-bold">Filtres rapides :</span>
          </div>

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

          {/* Persona selector */}
          <div className="flex items-center space-x-2 bg-slate-50 rounded-xl px-3 py-1.5 border border-slate-100">
            <span className="text-xs font-semibold text-slate-400">Public Cible :</span>
            <select 
              value={filterPersona} 
              onChange={(e) => setFilterPersona(e.target.value)}
              className="text-xs font-bold text-slate-700 focus:outline-none bg-transparent cursor-pointer max-w-[185px]"
            >
              <option value="Tous">Tous les Personas</option>
              {filterPersonaOptions.map(persona => (
                <option key={persona} value={persona}>{persona}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Calendar Display Box */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        
        {/* Navigation Banner */}
        <div className="flex flex-col sm:flex-row justify-between items-center bg-slate-50/75 px-6 py-4.5 border-b border-slate-100 gap-3">
          <div className="flex items-center space-x-3 text-slate-800">
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
              <CalendarIcon className="h-4.5 w-4.5" />
            </div>
            <h3 className="text-base font-extrabold text-slate-850 capitalize tracking-tight">
              {formatHeaderLabel()}
            </h3>
          </div>

          <div className="flex items-center space-x-2">
            <button 
              onClick={handlePrev}
              className="p-2 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors border border-slate-200 bg-white shadow-xs cursor-pointer"
              title="Précédent"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button 
              onClick={handleToday}
              className="px-3.5 py-1.5 text-xs font-bold text-indigo-600 hover:bg-indigo-50 border border-indigo-150 rounded-lg transition-colors bg-white shadow-xs"
            >
              Aujourd'hui
            </button>
            <button 
              onClick={handleNext}
              className="p-2 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors border border-slate-200 bg-white shadow-xs cursor-pointer"
              title="Suivant"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* VIEW 1: MONTHLY GRID */}
        {viewType === "month" && (
          <div>
            {/* Days of the Week headers */}
            <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50 text-center py-2.5 text-xs font-bold text-slate-450 tracking-wider">
              <div>Lun</div>
              <div>Mar</div>
              <div>Mer</div>
              <div>Jeu</div>
              <div>Ven</div>
              <div>Sam</div>
              <div>Dim</div>
            </div>

            {/* Grid de calendrier groupé par semaine */}
            <div className="flex flex-col border-t border-slate-100 bg-slate-100 divide-y divide-slate-100">
              {calendarWeeks.map((week, wIndex) => {
                const weekSlots = calendarWeeksSlots[wIndex] || [];
                return (
                  <div key={wIndex} className="grid grid-cols-7 divide-x divide-slate-100 bg-slate-100">
                    {week.map((item, dIndex) => {
                      const isToday = item.dateStr === "2026-06-17";
                      
                      return (
                        <div 
                          key={dIndex} 
                          className={`min-h-[145px] bg-white py-3 px-0 hover:bg-slate-50 transition-colors flex flex-col justify-between group relative ${
                            item.isCurrentMonth ? "" : "bg-slate-50/40"
                          } ${activeUser.role === "viewer" ? "cursor-default" : "cursor-pointer"}`}
                          onClick={() => {
                            if (activeUser.role === "viewer") return;
                            onAddOnDate(item.dateStr);
                          }}
                        >
                          <div className="px-3 flex justify-between items-center">
                            <span 
                              className={`text-xs font-extrabold rounded-lg h-6.5 w-6.5 flex items-center justify-center ${
                                isToday 
                                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/15" 
                                  : item.isCurrentMonth 
                                    ? "text-slate-700" 
                                    : "text-slate-350"
                              }`}
                            >
                              {item.dayNum}
                            </span>
                            {isToday && (
                              <span className="text-[8px] font-extrabold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-1.5 py-0.5 rounded-full">
                                Actuel
                              </span>
                            )}
                          </div>
  
                          {/* Liste des publications alignée sur les slots hebdomadaires */}
                          <div 
                            className="mt-2 text-slate-800 space-y-1 my-1 overflow-x-visible overflow-y-auto max-h-[92px] scrollbar-none"
                            onClick={(e) => e.stopPropagation()} 
                          >
                            {weekSlots.map((slot, sIndex) => {
                              const pub = slot[dIndex];
                              if (!pub) {
                                return (
                                  <div 
                                    key={`empty-${sIndex}`} 
                                    className="text-[10px] py-1.5 border border-transparent opacity-0 select-none pointer-events-none"
                                  >
                                    &nbsp;
                                  </div>
                                );
                              }
  
                              const isMulti = pub.endDate && pub.endDate !== pub.date;
                              let multiStyles = "";
  
                              if (isMulti) {
                                const isStart = item.dateStr === pub.date;
                                const isEnd = item.dateStr === pub.endDate;
                                const isSunday = dIndex === 6;
  
                                // Style du côté gauche (Début ou continuation)
                                if (isStart) {
                                  multiStyles += " ml-3 rounded-l-lg ";
                                } else {
                                  multiStyles += " ml-0 rounded-l-none border-l-0 ";
                                }
  
                                // Style du côté droit (Fin ou continuation)
                                if (isEnd) {
                                  multiStyles += " mr-3 rounded-r-lg ";
                                } else {
                                  multiStyles += " rounded-r-none border-r-0 ";
                                  if (!isSunday) {
                                    multiStyles += " -mr-[1px] relative z-10 ";
                                  } else {
                                    multiStyles += " mr-0 ";
                                  }
                                }
                              } else {
                                multiStyles += " mx-3 rounded-lg ";
                              }
  
                              const isRowStart = dIndex === 0;
                              const mainDisplay = !isMulti || (item.dateStr === pub.date || isRowStart);
  
                              const pubCreator = users.find(u => u.id === pub.createdBy);
                              const creatorNameOfPub = pubCreator ? `${pubCreator.avatar} ${pubCreator.name}` : "Jérémy (Système)";

                              return (
                                <div 
                                  key={pub.id}
                                  onClick={() => onSelectPublication(pub)}
                                  className={`text-[10px] font-bold border px-2 py-1.5 flex items-center justify-between pointer-events-auto transition-transform active:scale-95 cursor-pointer truncate border-solid ${getChannelStyle(pub.channel)} ${multiStyles}`}
                                  title={`[${pub.channel}] ${pub.title} | Créé par de : ${creatorNameOfPub} (${pub.date}${pub.endDate ? ` -> ${pub.endDate}` : ""})`}
                                >
                                  {mainDisplay ? (
                                    <>
                                      <span className="truncate pr-1">
                                        {pubCreator ? `${pubCreator.avatar} ` : ""}
                                        {pub.title}
                                      </span>
                                      <span className="text-[8px] font-extrabold opacity-75 uppercase ml-1 shrink-0 px-1 py-0.5 bg-black/5 rounded">
                                        {pub.status === "Publié" ? "✓" : "•"}
                                      </span>
                                    </>
                                  ) : (
                                    <span className="opacity-0 select-none">&nbsp;</span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
  
                          {/* Indicateur création rapide */}
                          {activeUser.role !== "viewer" && (
                            <div className="opacity-0 group-hover:opacity-100 text-[10px] text-slate-400 font-medium text-center transition-all absolute right-3 bottom-2.5 flex items-center space-x-1 pointer-events-none">
                              <span className="bg-slate-50 hover:bg-indigo-50 border border-slate-200 text-slate-500 hover:text-indigo-600 px-2 py-0.5 rounded-lg text-[9px] font-bold">
                                + Nouveau
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW 2: WEEKLY AGENDA */}
        {viewType === "week" && (
          <div className="p-6 bg-slate-50/50">
            <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
              {weekDays.map((wd) => {
                const isSelectedDay = wd.dateStr === currentDateStr;
                const isTodayStr = wd.dateStr === "2026-06-17";
                const dayPubs = pubByDateMap[wd.dateStr] || [];

                return (
                  <div 
                    key={wd.dateStr}
                    onClick={() => {
                      if (activeUser.role === "viewer") return;
                      onAddOnDate(wd.dateStr);
                    }}
                    className={`bg-white rounded-2xl border transition-all p-4.5 flex flex-col h-[280px] group hover:shadow-md relative ${
                      activeUser.role === "viewer" ? "cursor-default" : "cursor-pointer"
                    } ${
                      isSelectedDay 
                        ? "border-indigo-500 ring-2 ring-indigo-500/10" 
                        : isTodayStr 
                          ? "border-indigo-200 hover:border-indigo-300"
                          : "border-slate-100 hover:border-slate-200"
                    }`}
                  >
                    {/* Week day header card */}
                    <div className="flex justify-between items-start border-b border-slate-100 pb-3 mb-3">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide capitalize">
                          {wd.dayName}
                        </p>
                        <h4 className="text-base font-extrabold text-slate-800 mt-0.5">
                          {wd.formattedShort}
                        </h4>
                      </div>
                      
                      {isTodayStr && (
                        <span className="text-[8px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Aujourd'hui
                        </span>
                      )}
                    </div>

                    {/* Posts for this week day split */}
                    <div 
                      className="flex-1 space-y-2 overflow-y-auto scrollbar-thin"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {dayPubs.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-300 py-6">
                          <Layers className="h-5 w-5 opacity-40 mb-1" />
                          <p className="text-[9px] font-semibold">Aucun post</p>
                        </div>
                      ) : (
                        dayPubs.map(pub => {
                          const isMulti = pub.endDate && pub.endDate !== pub.date;
                          const isStart = wd.dateStr === pub.date;
                          const isEnd = wd.dateStr === pub.endDate;
                          
                          return (
                            <div
                              key={pub.id}
                              onClick={() => onSelectPublication(pub)}
                              className={`p-2.5 rounded-xl border border-solid text-xs font-bold space-y-1 block hover:scale-[1.02] active:scale-95 transition-all text-left truncate cursor-pointer ${getChannelStyle(pub.channel)}`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[8px] tracking-wide uppercase px-1 py-0.5 rounded bg-black/5 flex items-center gap-1">
                                  <span>{pub.channel}</span>
                                  {isMulti && (
                                    <span className="text-[7px] font-bold text-slate-500 bg-white/65 px-1 py-0.2 rounded uppercase">
                                      {isStart ? "Début" : isEnd ? "Fin" : "En cours"}
                                    </span>
                                  )}
                                </span>
                                <span className="text-[8px] font-black bg-white/40 px-1 py-0.5 rounded shrink-0">
                                  {pub.kpi}
                                </span>
                              </div>
                              <p className="text-[11px] font-extrabold text-slate-850 truncate leading-snug">
                                {pub.title}
                              </p>
                              <p className="text-[9px] font-medium text-slate-450 truncate">
                                Cible : {pub.persona}
                              </p>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Quick creation indicator bottom week element */}
                    {activeUser.role !== "viewer" && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddOnDate(wd.dateStr);
                        }}
                        className="mt-3 w-full py-1.5 border border-dashed border-slate-200 hover:border-indigo-400 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/40 rounded-xl text-[10px] font-bold transition-all flex items-center justify-center space-x-1"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Ajouter un post</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW 3: DETAILED SINGLE DAY VIEW */}
        {viewType === "day" && (
          <div className="p-8 bg-slate-50/50">
            {/* Split layout: Left for items list, Right for add quick tips */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Day's posts list */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-sm font-extrabold text-slate-700 uppercase tracking-widest flex items-center gap-2">
                    <Clock className="h-4 w-4 text-indigo-500" />
                    <span>Planification du Jour ({pubByDateMap[currentDateStr]?.length || 0})</span>
                  </h4>

                  {activeUser.role !== "viewer" && (
                    <button 
                      onClick={() => onAddOnDate(currentDateStr)}
                      className="flex items-center space-x-1 text-xs font-bold text-indigo-600 hover:text-indigo-700"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Planifier un post supplémentaire</span>
                    </button>
                  )}
                </div>

                {!pubByDateMap[currentDateStr] || pubByDateMap[currentDateStr].length === 0 ? (
                  <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center text-slate-400 space-y-4 shadow-xs">
                    <div className="h-12 w-12 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-slate-355 mx-auto">
                      <CalendarIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-extrabold text-slate-700">Aucune publication planifiée pour ce jour</p>
                      <p className="text-xs text-slate-400 mt-1">Donnez plus de voix à votre marque le {currentDate.toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}.</p>
                    </div>
                    {activeUser.role !== "viewer" && (
                      <button
                        onClick={() => onAddOnDate(currentDateStr)}
                        className="px-4.5 py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-md hover:bg-indigo-700 transition-all"
                      >
                        + Créer le premier post de la journée
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pubByDateMap[currentDateStr].map((pub) => {
                      const isMulti = pub.endDate && pub.endDate !== pub.date;
                      const isStart = currentDateStr === pub.date;
                      const isEnd = currentDateStr === pub.endDate;

                      return (
                        <div 
                          key={pub.id}
                          onClick={() => onSelectPublication(pub)}
                          className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col md:flex-row justify-between items-start md:items-center gap-4 group"
                        >
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2 flex-wrap gap-1">
                              <span className={`px-2.5 py-1 text-[10px] font-bold border rounded-full ${getChannelStyle(pub.channel)}`}>
                                {pub.channel}
                              </span>
                              {isMulti && (
                                <span className="px-2 py-0.5 text-[9px] font-bold bg-indigo-50 text-indigo-650 border border-indigo-100 rounded-md">
                                  📅 Multi-jours : {isStart ? "Début" : isEnd ? "Fin" : "En cours"}
                                </span>
                              )}
                              <span className="text-[10px] bg-slate-150 text-slate-600 px-2 py-0.5 rounded-md font-bold text-[9px]">
                                KPI: {pub.kpi}
                              </span>
                              <span className="text-[10px] bg-purple-50 text-purple-600 px-2 py-0.5 rounded-md font-bold text-[9px]">
                                Statut: {pub.status}
                              </span>
                            </div>

                          <h5 className="font-extrabold text-slate-800 text-base group-hover:text-indigo-600 transition-colors">
                            {pub.title}
                          </h5>

                          {pub.copywriting && (
                            <blockquote className="text-xs text-slate-500 italic border-l-2 border-slate-200 pl-3 leading-relaxed mt-1 line-clamp-2">
                              "{pub.copywriting}"
                            </blockquote>
                          )}

                          <div className="flex items-center space-x-2 text-xs text-slate-400 font-semibold pt-1 flex-wrap gap-y-1">
                            <Users className="h-3.5 w-3.5 text-slate-400" />
                            <span>Persona ciblé : {pub.persona}</span>
                            <span className="text-slate-300">|</span>
                            <span>Créé par : {(() => {
                              const creator = users.find(u => u.id === pub.createdBy);
                              return creator ? `${creator.avatar} ${creator.name}` : "👤 Jérémy";
                            })()}</span>
                          </div>
                        </div>

                        <div className="shrink-0">
                          <span className="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50/80 px-3 py-1.5 rounded-xl border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition-all text-center block">
                            {activeUser.role === "viewer" ? "Consulter en lecture seule" : "Modifier / Optimiser"}
                          </span>
                        </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Sidebar Quick-Tips context block */}
              <div className="space-y-6">
                <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-sm space-y-4">
                  <div className="flex items-center space-x-2 text-indigo-400">
                    <Sparkles className="h-4 w-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Coutumes du Jour</span>
                  </div>

                  <h5 className="font-extrabold text-white text-sm">Fréquence de communication saine</h5>
                  <p className="text-xs text-slate-350 leading-relaxed">
                    Selon les piliers de votre calendrier éditorial, publier plus d'une fois par canal un même jour peut diluer l'engagement par auto-cannibalisation des algorithmes.
                  </p>

                  <div className="bg-slate-850 p-4 rounded-xl border border-slate-800 space-y-3.5 text-xs text-slate-300">
                    <div className="flex items-center space-x-2">
                      <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0"></span>
                      <span><strong>LinkedIn :</strong> 1 post optimal le matin (GMT)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="h-2 w-2 rounded-full bg-pink-500 shrink-0"></span>
                      <span><strong>Instagram :</strong> Formats Reels pour la visibilité</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0"></span>
                      <span><strong>Newsletter :</strong> Le mardi & jeudi pour l'ouverture</span>
                    </div>
                  </div>
                </div>

                <div className="bg-indigo-650 text-white rounded-2xl p-6 shadow-sm relative overflow-hidden">
                  <div className="absolute right-0 bottom-0 translate-x-3 translate-y-3 opacity-10">
                    <Zap className="h-24 w-24" />
                  </div>

                  <h5 className="font-extrabold text-sm mb-1">Génération Automatique active</h5>
                  <p className="text-xs text-indigo-100 leading-relaxed mb-4">
                    Besoin de plus de publications ? Saisissez une simple consigne dans l'IA Brainstorming de gauche de la page.
                  </p>
                  
                  <button 
                    onClick={() => {
                      const inputElement = document.querySelector("textarea") as HTMLTextAreaElement | null;
                      if (inputElement) {
                        inputElement.focus();
                        inputElement.scrollIntoView({ behavior: "smooth" });
                      }
                    }}
                    className="bg-white text-indigo-600 hover:bg-slate-50 font-bold text-xs px-3 py-1.5 rounded-lg transition-all"
                  >
                    Formuler l'idée par l'IA
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>

      {/* Mini Color Codes Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-slate-500 mt-2">
        {channels.map(channel => (
          <span key={channel} className="flex items-center space-x-1.5">
            <span className={`h-2.5 w-2.5 rounded-full ${getChannelColorDot(channel)}`}></span>
            <span>{channel}</span>
          </span>
        ))}
      </div>

    </div>
  );
}
