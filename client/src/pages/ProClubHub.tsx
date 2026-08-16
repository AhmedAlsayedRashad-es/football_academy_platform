import { useState, useEffect, useRef, useCallback } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useLanguage } from "../contexts/LanguageContext";
import { trpc } from "../lib/trpc";
import { toast } from "sonner";
import {
  TrendingUp, TrendingDown, Minus, DollarSign, Users, ShoppingCart,
  Brain, RefreshCw, Plus, X, ChevronDown, ChevronUp,
  Activity, Bookmark, CheckCircle2, MessageSquare,
  Globe, FileText, Search, SlidersHorizontal, ArrowUpDown,
  Clock, AlertTriangle, XCircle, BarChart3, Zap, Award, Filter,
  Download, Image, CalendarRange
} from "lucide-react";
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import { Radar } from "react-chartjs-2";

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab = "squad" | "market" | "valuation" | "comparison" | "watchlist" | "offers" | "history";

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatValue(v: number | string | null | undefined): string {
  const n = Number(v);
  if (!n) return "N/A";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

function calcAge(dob: string | Date): number {
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000));
}

function TrendIcon({ trend }: { trend?: string }) {
  if (trend === "rising") return <TrendingUp className="w-4 h-4 text-green-700 dark:text-green-400" />;
  if (trend === "declining") return <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />;
  return <Minus className="w-4 h-4 text-muted-foreground" />;
}

function RatingBar({ value, max = 100, color = "bg-emerald-500" }: { value: number; max?: number; color?: string }) {
  return (
    <div className="w-full bg-muted rounded-full h-1.5">
      <div className={`${color} h-1.5 rounded-full transition-all`} style={{ width: `${Math.min((value / max) * 100, 100)}%` }} />
    </div>
  );
}

// ─── Comparison Radar Chart (2 players side by side) ─────────────────────────
function ComparisonRadarChart({ dataA, dataB, nameA, nameB, exportRef }: { dataA: Record<string, number>; dataB: Record<string, number>; nameA: string; nameB: string; exportRef?: React.RefObject<HTMLDivElement | null> }) {
  const labels = ["Technical", "Physical", "Mental", "Performance", "Potential", "Market Demand", "Injury Safety", "Contract"];
  const valA = [dataA.technicalScore??50, dataA.physicalScore??50, dataA.mentalScore??50, dataA.performanceScore??50, dataA.potentialScore??50, dataA.marketDemandScore??50, dataA.injuryRiskScore??50, dataA.contractScore??50];
  const valB = [dataB.technicalScore??50, dataB.physicalScore??50, dataB.mentalScore??50, dataB.performanceScore??50, dataB.potentialScore??50, dataB.marketDemandScore??50, dataB.injuryRiskScore??50, dataB.contractScore??50];
  const chartData = {
    labels,
    datasets: [
      { label: nameA, data: valA, backgroundColor: "rgba(16,185,129,0.15)", borderColor: "rgba(16,185,129,0.9)", borderWidth: 2, pointBackgroundColor: "rgba(16,185,129,1)", pointBorderColor: "#fff", pointRadius: 4 },
      { label: nameB, data: valB, backgroundColor: "rgba(99,102,241,0.15)", borderColor: "rgba(99,102,241,0.9)", borderWidth: 2, pointBackgroundColor: "rgba(99,102,241,1)", pointBorderColor: "#fff", pointRadius: 4 },
    ],
  };
  const options = { responsive: true, maintainAspectRatio: true, plugins: { legend: { display: true, labels: { color: "#d1d5db", font: { size: 12 } } }, tooltip: { callbacks: { label: (ctx: any) => ` ${ctx.dataset.label}: ${ctx.raw}/100` } } }, scales: { r: { min: 0, max: 100, ticks: { stepSize: 25, color: "rgba(156,163,175,0.8)", backdropColor: "transparent", font: { size: 10 } }, grid: { color: "rgba(75,85,99,0.4)" }, angleLines: { color: "rgba(75,85,99,0.4)" }, pointLabels: { color: "rgba(209,213,219,0.9)", font: { size: 11, weight: 500 as const } } } } };
  return (
    <div ref={exportRef} className="bg-muted/50 border border-border rounded-2xl p-5">
      <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2"><Activity className="w-4 h-4 text-emerald-700 dark:text-emerald-400" /> Side-by-Side Radar Comparison</h4>
      <div style={{ height: "320px" }}><Radar data={chartData} options={options} /></div>
      <div className="grid grid-cols-2 gap-4 mt-4">
        {[{name: nameA, vals: valA, color: "text-emerald-700 dark:text-emerald-400"}, {name: nameB, vals: valB, color: "text-indigo-600 dark:text-indigo-400"}].map(({name, vals, color}) => (
          <div key={name}>
            <div className={`text-xs font-bold ${color} mb-2`}>{name}</div>
            <div className="grid grid-cols-4 gap-1">
              {labels.map((l, i) => (
                <div key={l} className="text-center">
                  <div className={`text-sm font-bold ${vals[i]>=75?"text-green-700 dark:text-green-400":vals[i]>=55?"text-yellow-700 dark:text-yellow-400":"text-red-600 dark:text-red-400"}`}>{vals[i]}</div>
                  <div className="text-xs text-muted-foreground leading-tight" style={{fontSize:"9px"}}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
// ─── Radar Chart Component ────────────────────────────────────────────────────
function ValuationRadarChart({ data, playerName }: { data: Record<string, number>; playerName: string }) {
  const labels = ["Technical", "Physical", "Mental", "Performance", "Potential", "Market Demand", "Injury Safety", "Contract"];
  const values = [
    data.technicalScore ?? 50,
    data.physicalScore ?? 50,
    data.mentalScore ?? 50,
    data.performanceScore ?? 50,
    data.potentialScore ?? 50,
    data.marketDemandScore ?? 50,
    data.injuryRiskScore ?? 50,
    data.contractScore ?? 50,
  ];

  const chartData = {
    labels,
    datasets: [
      {
        label: playerName,
        data: values,
        backgroundColor: "rgba(16, 185, 129, 0.15)",
        borderColor: "rgba(16, 185, 129, 0.9)",
        borderWidth: 2,
        pointBackgroundColor: "rgba(16, 185, 129, 1)",
        pointBorderColor: "#fff",
        pointHoverBackgroundColor: "#fff",
        pointHoverBorderColor: "rgba(16, 185, 129, 1)",
        pointRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: any) => ` ${ctx.label}: ${ctx.raw}/100`,
        },
      },
    },
    scales: {
      r: {
        min: 0,
        max: 100,
        ticks: {
          stepSize: 25,
          color: "rgba(156,163,175,0.8)",
          backdropColor: "transparent",
          font: { size: 10 },
        },
        grid: { color: "rgba(75,85,99,0.4)" },
        angleLines: { color: "rgba(75,85,99,0.4)" },
        pointLabels: {
          color: "rgba(209,213,219,0.9)",
          font: { size: 11, weight: 500 as const },
        },
      },
    },
  };

  return (
    <div className="bg-muted/50 border border-border rounded-2xl p-5">
      <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
        <Activity className="w-4 h-4 text-emerald-700 dark:text-emerald-400" /> 8-Factor Radar Analysis
      </h4>
      <div style={{ height: "300px" }}>
        <Radar data={chartData} options={options} />
      </div>
      <div className="grid grid-cols-4 gap-2 mt-3">
        {labels.map((label, i) => (
          <div key={label} className="text-center">
            <div className={`text-sm font-bold ${values[i] >= 75 ? "text-green-700 dark:text-green-400" : values[i] >= 55 ? "text-yellow-700 dark:text-yellow-400" : "text-red-600 dark:text-red-400"}`}>
              {values[i]}
            </div>
            <div className="text-xs text-muted-foreground leading-tight">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Market Stats Banner ──────────────────────────────────────────────────────
function MarketStatsBanner() {
  const { data: stats } = trpc.transferMarket.getMarketStats.useQuery();
  const cards = [
    { label: "Active Listings", value: stats?.activeListings ?? 0, icon: ShoppingCart, color: "text-blue-600 dark:text-blue-400" },
    { label: "Pending Offers", value: stats?.pendingOffers ?? 0, icon: MessageSquare, color: "text-yellow-700 dark:text-yellow-400" },
    { label: "Completed Transfers", value: stats?.completedTransfers ?? 0, icon: CheckCircle2, color: "text-green-700 dark:text-green-400" },
    { label: "AI Valuations Done", value: stats?.totalValuations ?? 0, icon: Brain, color: "text-purple-600 dark:text-purple-400" },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      {cards.map(c => (
        <div key={c.label} className="bg-muted border border-border rounded-xl p-4 flex items-center gap-3">
          <c.icon className={`w-8 h-8 ${c.color} flex-shrink-0`} />
          <div>
            <div className="text-2xl font-bold text-foreground">{c.value}</div>
            <div className="text-xs text-muted-foreground">{c.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Squad Overview Tab ───────────────────────────────────────────────────────
function SquadOverview() {
  const [teamType, setTeamType] = useState<"main" | "academy">("main");
  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null);
  const { data: squad, refetch } = trpc.transferMarket.getSquadWithValuations.useQuery({ teamType });
  const valuateMutation = trpc.transferMarket.valuatePlayer.useMutation({
    onSuccess: (data) => {
      toast.success(`AI Valuation: ${formatValue(data.estimatedValue)} — ${data.comparablePlayer}`);
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const positionOrder = ["goalkeeper", "defender", "midfielder", "forward"];
  const grouped = positionOrder.reduce((acc, pos) => {
    acc[pos] = (squad || []).filter(s => s.player.position === pos);
    return acc;
  }, {} as Record<string, typeof squad>);

  const totalValue = (squad || []).reduce((sum, s) => sum + Number(s.valuation?.estimatedValue || 0), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          {(["main", "academy"] as const).map(t => (
            <button key={t} onClick={() => setTeamType(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${teamType === t ? "bg-emerald-600 text-white" : "bg-muted text-muted-foreground hover:bg-muted"}`}>
              {t === "main" ? "Main Team" : "Academy"}
            </button>
          ))}
        </div>
        <div className="text-right">
          <div className="text-xs text-muted-foreground">Squad Total Value</div>
          <div className="text-xl font-bold text-emerald-700 dark:text-emerald-400">{formatValue(totalValue)}</div>
        </div>
      </div>

      {positionOrder.map(pos => {
        const group = grouped[pos] || [];
        if (!group.length) return null;
        return (
          <div key={pos} className="mb-6">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              {pos.charAt(0).toUpperCase() + pos.slice(1)}s ({group.length})
            </h3>
            <div className="space-y-2">
              {group.map(({ player, valuation, listing }) => {
                const age = calcAge(player.dateOfBirth);
                const isValuating = valuateMutation.isPending && selectedPlayer === player.id;
                return (
                  <div key={player.id} className="bg-muted border border-border rounded-xl p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {player.firstName[0]}{player.lastName[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground truncate">{player.firstName} {player.lastName}</span>
                        {listing && <span className="text-xs bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 px-2 py-0.5 rounded-full">Listed</span>}
                      </div>
                      <div className="text-xs text-muted-foreground">{age}y • #{player.jerseyNumber || "—"} • {player.nationality || "—"}</div>
                    </div>
                    <div className="text-right min-w-[100px]">
                      {valuation ? (
                        <>
                          <div className="flex items-center gap-1 justify-end">
                            <TrendIcon trend={valuation.trend ?? undefined} />
                            <span className="font-bold text-emerald-700 dark:text-emerald-400 text-sm">{formatValue(valuation.estimatedValue)}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">Rating: {valuation.overallRating}/100</div>
                        </>
                      ) : (
                        <div className="text-xs text-muted-foreground">Not valued</div>
                      )}
                    </div>
                    <button
                      onClick={() => { setSelectedPlayer(player.id); valuateMutation.mutate({ playerId: player.id }); }}
                      disabled={isValuating}
                      className="flex-shrink-0 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs px-3 py-2 rounded-lg flex items-center gap-1 transition-colors">
                      {isValuating ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Brain className="w-3 h-3" />}
                      {isValuating ? "..." : "AI Value"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      {!squad?.length && (
        <div className="text-center py-16 text-muted-foreground">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No players found in this team.</p>
        </div>
      )}
    </div>
  );
}

// ─── Transfer Market Tab (with advanced filtering) ────────────────────────────
function TransferMarketTab() {
  const [filterType, setFilterType] = useState<"all" | "sale" | "loan" | "free_agent">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [positionFilter, setPositionFilter] = useState<string>("all");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [minAge, setMinAge] = useState<string>("");
  const [maxAge, setMaxAge] = useState<string>("");
  const [sortBy, setSortBy] = useState<"value" | "rating" | "age" | "price">("value");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [offerModal, setOfferModal] = useState<{ listingId: number; playerId: number; playerName: string } | null>(null);

  const { data: listings, refetch } = trpc.transferMarket.getListings.useQuery({
    status: "active",
    listingType: filterType === "all" ? "all" : filterType,
  });

  const { data: allPlayers } = trpc.players.getAll.useQuery();

  const createMutation = trpc.transferMarket.createListing.useMutation({
    onSuccess: (d) => {
      toast.success(`Listed! AI Valuation: ${formatValue(d.aiValuation)}`);
      setShowCreateModal(false);
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const offerMutation = trpc.transferMarket.makeOffer.useMutation({
    onSuccess: () => { toast.success("Offer submitted!"); setOfferModal(null); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const [createForm, setCreateForm] = useState({ playerId: 0, listingType: "sale" as any, askingPrice: "", description: "", agentName: "" });
  const [offerForm, setOfferForm] = useState({ offerAmount: "", offeringClub: "", message: "", offerType: "purchase" as any });

  const listingTypeColors: Record<string, string> = {
    sale: "bg-blue-500/20 text-blue-600 dark:text-blue-400",
    loan: "bg-orange-500/20 text-orange-700 dark:text-orange-400",
    free_agent: "bg-green-500/20 text-green-700 dark:text-green-400",
    swap: "bg-purple-500/20 text-purple-600 dark:text-purple-400",
  };

  // Apply client-side filters
  const filteredListings = (listings || []).filter(({ listing, player }) => {
    const age = calcAge(player.dateOfBirth);
    const breakdown = listing.valuationBreakdown ? JSON.parse(listing.valuationBreakdown) : null;
    const name = `${player.firstName} ${player.lastName}`.toLowerCase();

    if (searchQuery && !name.includes(searchQuery.toLowerCase())) return false;
    if (positionFilter !== "all" && player.position !== positionFilter) return false;
    if (minPrice && Number(listing.askingPrice) < Number(minPrice)) return false;
    if (maxPrice && Number(listing.askingPrice) > Number(maxPrice)) return false;
    if (minAge && age < Number(minAge)) return false;
    if (maxAge && age > Number(maxAge)) return false;
    return true;
  });

  const sortedListings = [...filteredListings].sort((a, b) => {
    const breakdown_a = a.listing.valuationBreakdown ? JSON.parse(a.listing.valuationBreakdown) : null;
    const breakdown_b = b.listing.valuationBreakdown ? JSON.parse(b.listing.valuationBreakdown) : null;
    let va = 0, vb = 0;
    if (sortBy === "value") { va = Number(a.listing.aiValuation || 0); vb = Number(b.listing.aiValuation || 0); }
    else if (sortBy === "rating") { va = breakdown_a?.overallRating || 0; vb = breakdown_b?.overallRating || 0; }
    else if (sortBy === "age") { va = calcAge(a.player.dateOfBirth); vb = calcAge(b.player.dateOfBirth); }
    else if (sortBy === "price") { va = Number(a.listing.askingPrice || 0); vb = Number(b.listing.askingPrice || 0); }
    return sortDir === "desc" ? vb - va : va - vb;
  });

  const activeFilterCount = [
    positionFilter !== "all",
    !!minPrice, !!maxPrice, !!minAge, !!maxAge,
  ].filter(Boolean).length;

  return (
    <div>
      {/* Search + Filter Bar */}
      <div className="flex flex-col gap-3 mb-4">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search players..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-muted border border-border rounded-lg pl-9 pr-3 py-2 text-foreground text-sm"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition-colors ${showFilters || activeFilterCount > 0 ? "bg-emerald-600/20 border-emerald-600 text-emerald-700 dark:text-emerald-400" : "bg-muted border-border text-muted-foreground"}`}>
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            {activeFilterCount > 0 && <span className="bg-emerald-600 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">{activeFilterCount}</span>}
          </button>
          <button
            onClick={() => setSortDir(d => d === "desc" ? "asc" : "desc")}
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm bg-muted border border-border text-muted-foreground">
            <ArrowUpDown className="w-4 h-4" />
          </button>
          <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}
            className="bg-muted border border-border rounded-lg px-3 py-2 text-foreground text-sm">
            <option value="value">Sort: AI Value</option>
            <option value="rating">Sort: Rating</option>
            <option value="price">Sort: Price</option>
            <option value="age">Sort: Age</option>
          </select>
          <button onClick={() => setShowCreateModal(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm px-4 py-2 rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap">
            <Plus className="w-4 h-4" /> List Player
          </button>
        </div>

        {/* Listing type quick filters */}
        <div className="flex gap-2 flex-wrap">
          {(["all", "sale", "loan", "free_agent"] as const).map(f => (
            <button key={f} onClick={() => setFilterType(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterType === f ? "bg-emerald-600 text-white" : "bg-muted text-muted-foreground hover:bg-muted"}`}>
              {f === "all" ? "All" : f === "free_agent" ? "Free Agent" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
          <span className="ml-auto text-xs text-muted-foreground self-center">{sortedListings.length} result{sortedListings.length !== 1 ? "s" : ""}</span>
        </div>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <div className="bg-muted/80 border border-border rounded-xl p-4 grid grid-cols-2 md:grid-cols-5 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Position</label>
              <select value={positionFilter} onChange={e => setPositionFilter(e.target.value)}
                className="w-full bg-muted border border-border rounded-lg px-2 py-1.5 text-foreground text-xs">
                <option value="all">All Positions</option>
                <option value="goalkeeper">Goalkeeper</option>
                <option value="defender">Defender</option>
                <option value="midfielder">Midfielder</option>
                <option value="forward">Forward</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Min Price ($)</label>
              <input type="number" value={minPrice} onChange={e => setMinPrice(e.target.value)}
                placeholder="0" className="w-full bg-muted border border-border rounded-lg px-2 py-1.5 text-foreground text-xs" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Max Price ($)</label>
              <input type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value)}
                placeholder="∞" className="w-full bg-muted border border-border rounded-lg px-2 py-1.5 text-foreground text-xs" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Min Age</label>
              <input type="number" value={minAge} onChange={e => setMinAge(e.target.value)}
                placeholder="16" className="w-full bg-muted border border-border rounded-lg px-2 py-1.5 text-foreground text-xs" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Max Age</label>
              <input type="number" value={maxAge} onChange={e => setMaxAge(e.target.value)}
                placeholder="40" className="w-full bg-muted border border-border rounded-lg px-2 py-1.5 text-foreground text-xs" />
            </div>
            <button onClick={() => { setPositionFilter("all"); setMinPrice(""); setMaxPrice(""); setMinAge(""); setMaxAge(""); }}
              className="col-span-2 md:col-span-5 text-xs text-muted-foreground hover:text-red-600 dark:hover:text-red-400 text-center transition-colors">
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Listings */}
      <div className="space-y-3">
        {sortedListings.map(({ listing, player }) => {
          const age = calcAge(player.dateOfBirth);
          const breakdown = listing.valuationBreakdown ? JSON.parse(listing.valuationBreakdown) : null;
          return (
            <div key={listing.id} className="bg-muted border border-border rounded-xl p-5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-bold flex-shrink-0">
                  {player.firstName[0]}{player.lastName[0]}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-foreground text-lg">{player.firstName} {player.lastName}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${listingTypeColors[listing.listingType]}`}>
                      {listing.listingType.replace("_", " ").toUpperCase()}
                    </span>
                    {breakdown?.trend && (
                      <span className={`text-xs flex items-center gap-1 ${breakdown.trend === "rising" ? "text-green-700 dark:text-green-400" : breakdown.trend === "declining" ? "text-red-600 dark:text-red-400" : "text-muted-foreground"}`}>
                        <TrendIcon trend={breakdown.trend} />{breakdown.trend}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground mt-0.5">{age}y • {player.position} • {player.nationality || "—"}</div>

                  <div className="flex items-center gap-6 mt-3 flex-wrap">
                    <div>
                      <div className="text-xs text-muted-foreground">Asking Price</div>
                      <div className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{formatValue(listing.askingPrice)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">AI Valuation</div>
                      <div className="text-lg font-bold text-purple-600 dark:text-purple-400">{formatValue(listing.aiValuation)}</div>
                    </div>
                    {breakdown && (
                      <div>
                        <div className="text-xs text-muted-foreground">Overall Rating</div>
                        <div className="text-lg font-bold text-yellow-700 dark:text-yellow-400">{breakdown.overallRating}/100</div>
                      </div>
                    )}
                  </div>

                  {breakdown && (
                    <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 mt-3">
                      {[
                        { label: "Technical", value: breakdown.technicalScore, color: "bg-blue-500" },
                        { label: "Physical", value: breakdown.physicalScore, color: "bg-orange-500" },
                        { label: "Mental", value: breakdown.mentalScore, color: "bg-purple-500" },
                        { label: "Performance", value: breakdown.performanceScore, color: "bg-emerald-500" },
                      ].map(({ label, value, color }) => (
                        <div key={label}>
                          <div className="flex justify-between text-xs text-muted-foreground mb-0.5">
                            <span>{label}</span><span>{value}</span>
                          </div>
                          <RatingBar value={value} color={color} />
                        </div>
                      ))}
                    </div>
                  )}
                  {listing.description && <p className="text-sm text-muted-foreground mt-2 italic">"{listing.description}"</p>}
                </div>

                <button
                  onClick={() => setOfferModal({ listingId: listing.id, playerId: player.id, playerName: `${player.firstName} ${player.lastName}` })}
                  className="flex-shrink-0 bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
                  <DollarSign className="w-4 h-4" /> Make Offer
                </button>
              </div>
            </div>
          );
        })}
        {!sortedListings.length && (
          <div className="text-center py-16 text-muted-foreground">
            <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>{listings?.length ? "No listings match your filters." : "No active listings. List a player to get started."}</p>
          </div>
        )}
      </div>

      {/* Create Listing Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-foreground">List Player for Transfer</h3>
              <button onClick={() => setShowCreateModal(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>
            <div className="space-y-3">
              <select value={createForm.playerId} onChange={e => setCreateForm(f => ({ ...f, playerId: Number(e.target.value) }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-foreground text-sm">
                <option value={0}>Select player...</option>
                {(allPlayers || []).map((p: any) => (
                  <option key={p.id} value={p.id}>{p.firstName} {p.lastName} ({p.position})</option>
                ))}
              </select>
              <select value={createForm.listingType} onChange={e => setCreateForm(f => ({ ...f, listingType: e.target.value as any }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-foreground text-sm">
                <option value="sale">For Sale</option>
                <option value="loan">Loan</option>
                <option value="free_agent">Free Agent</option>
                <option value="swap">Swap</option>
              </select>
              <input type="number" value={createForm.askingPrice} onChange={e => setCreateForm(f => ({ ...f, askingPrice: e.target.value }))}
                placeholder="Asking Price (USD)" className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-foreground text-sm" />
              <input type="text" value={createForm.agentName} onChange={e => setCreateForm(f => ({ ...f, agentName: e.target.value }))}
                placeholder="Agent Name (optional)" className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-foreground text-sm" />
              <textarea value={createForm.description} onChange={e => setCreateForm(f => ({ ...f, description: e.target.value }))}
                rows={2} placeholder="Description..." className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-foreground text-sm resize-none" />
              <div className="bg-purple-900/30 border border-purple-700/50 rounded-lg p-3 text-xs text-purple-600 dark:text-purple-300">
                <Brain className="w-4 h-4 inline mr-1" /> AI will automatically compute the player's market value when listed.
              </div>
              <button
                onClick={() => createMutation.mutate({ ...createForm, askingPrice: createForm.askingPrice ? Number(createForm.askingPrice) : undefined })}
                disabled={!createForm.playerId || createMutation.isPending}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white py-2.5 rounded-lg font-medium flex items-center justify-center gap-2">
                {createMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {createMutation.isPending ? "Computing AI Valuation..." : "List Player"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Make Offer Modal */}
      {offerModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-foreground">Make Offer for {offerModal.playerName}</h3>
              <button onClick={() => setOfferModal(null)}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>
            <div className="space-y-3">
              <select value={offerForm.offerType} onChange={e => setOfferForm(f => ({ ...f, offerType: e.target.value as any }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-foreground text-sm">
                <option value="purchase">Purchase</option>
                <option value="loan">Loan</option>
                <option value="swap">Swap</option>
              </select>
              <input type="number" value={offerForm.offerAmount} onChange={e => setOfferForm(f => ({ ...f, offerAmount: e.target.value }))}
                placeholder="Offer Amount (USD)" className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-foreground text-sm" />
              <input type="text" value={offerForm.offeringClub} onChange={e => setOfferForm(f => ({ ...f, offeringClub: e.target.value }))}
                placeholder="Your Club Name" className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-foreground text-sm" />
              <textarea value={offerForm.message} onChange={e => setOfferForm(f => ({ ...f, message: e.target.value }))}
                rows={2} placeholder="Message (optional)" className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-foreground text-sm resize-none" />
              <button
                onClick={() => offerMutation.mutate({ listingId: offerModal.listingId, playerId: offerModal.playerId, offerAmount: Number(offerForm.offerAmount), offerType: offerForm.offerType, offeringClub: offerForm.offeringClub, message: offerForm.message })}
                disabled={!offerForm.offerAmount || !offerForm.offeringClub || offerMutation.isPending}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2.5 rounded-lg font-medium flex items-center justify-center gap-2">
                {offerMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <DollarSign className="w-4 h-4" />}
                {offerMutation.isPending ? "Submitting..." : "Submit Offer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── AI Valuation Tab with Radar Chart ───────────────────────────────────────
function ValuationTab() {
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const [valuationResult, setValuationResult] = useState<any>(null);
  const { data: allPlayers } = trpc.players.getAll.useQuery();
  const valuateMutation = trpc.transferMarket.valuatePlayer.useMutation({
    onSuccess: (data) => { setValuationResult(data); toast.success("AI Valuation complete!"); },
    onError: (e) => toast.error(e.message),
  });
  const contractMutation = trpc.transferMarket.analyzeContractRisk.useMutation({
    onSuccess: () => toast.success("Contract analysis complete!"),
    onError: (e) => toast.error(e.message),
  });

  const factors = valuationResult ? [
    { label: "Technical", value: valuationResult.technicalScore, color: "bg-blue-500", icon: "⚽" },
    { label: "Physical", value: valuationResult.physicalScore, color: "bg-orange-500", icon: "💪" },
    { label: "Mental", value: valuationResult.mentalScore, color: "bg-purple-500", icon: "🧠" },
    { label: "Performance", value: valuationResult.performanceScore, color: "bg-emerald-500", icon: "📊" },
    { label: "Potential", value: valuationResult.potentialScore, color: "bg-yellow-500", icon: "🚀" },
    { label: "Market Demand", value: valuationResult.marketDemandScore, color: "bg-pink-500", icon: "📈" },
    { label: "Injury Safety", value: valuationResult.injuryRiskScore, color: "bg-teal-500", icon: "🏥" },
    { label: "Contract", value: valuationResult.contractScore, color: "bg-indigo-500", icon: "📋" },
  ] : [];

  const selectedPlayerName = allPlayers?.find((p: any) => p.id === selectedPlayerId);
  const playerName = selectedPlayerName ? `${selectedPlayerName.firstName} ${selectedPlayerName.lastName}` : "Player";

  return (
    <div className="max-w-4xl mx-auto">
      {/* Selection */}
      <div className="bg-muted border border-border rounded-2xl p-6 mb-6">
        <h3 className="text-lg font-bold text-foreground mb-1 flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-600 dark:text-purple-400" /> AI Player Valuation Engine
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Multi-factor AI model using technical skills, physical attributes, performance history, age potential, market demand, and injury risk — similar to CIES & StatsBomb methodologies.
        </p>
        <div className="flex gap-3">
          <select value={selectedPlayerId || ""} onChange={e => setSelectedPlayerId(Number(e.target.value))}
            className="flex-1 bg-muted border border-border rounded-lg px-3 py-2.5 text-foreground text-sm">
            <option value="">Select a player to valuate...</option>
            {(allPlayers || []).map((p: any) => (
              <option key={p.id} value={p.id}>{p.firstName} {p.lastName} ({p.position}, {calcAge(p.dateOfBirth)}y)</option>
            ))}
          </select>
          <button
            onClick={() => selectedPlayerId && valuateMutation.mutate({ playerId: selectedPlayerId })}
            disabled={!selectedPlayerId || valuateMutation.isPending}
            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors">
            {valuateMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            {valuateMutation.isPending ? "Analyzing..." : "Run AI Valuation"}
          </button>
        </div>
      </div>

      {/* Valuation Result */}
      {valuationResult && (
        <div className="space-y-4">
          {/* Main Value Card */}
          <div className="brand-gradient-subtle border border-purple-700/50 rounded-2xl p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-purple-600 dark:text-purple-300 mb-1">Estimated Market Value</div>
                <div className="text-4xl font-black text-foreground">{formatValue(valuationResult.estimatedValue)}</div>
                <div className="flex items-center gap-2 mt-2">
                  <TrendIcon trend={valuationResult.trend} />
                  <span className="text-sm text-muted-foreground capitalize">{valuationResult.trend} trend</span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-sm text-muted-foreground">{valuationResult.comparablePlayer}</span>
                </div>
              </div>
              <div className="text-center">
                <div className="text-5xl font-black text-yellow-700 dark:text-yellow-400">{valuationResult.overallRating}</div>
                <div className="text-xs text-muted-foreground">Overall Rating</div>
              </div>
            </div>
            {valuationResult.aiNarrative && (
              <div className="mt-4 p-3 bg-black/30 rounded-xl border border-purple-700/30">
                <p className="text-sm text-muted-foreground italic">"{valuationResult.aiNarrative}"</p>
              </div>
            )}
          </div>

          {/* Two-column: Radar + Factor Bars */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Radar Chart */}
            <ValuationRadarChart data={valuationResult} playerName={playerName} />

            {/* Factor Bars */}
            <div className="bg-muted border border-border rounded-2xl p-5">
              <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-700 dark:text-emerald-400" /> Score Breakdown
              </h4>
              <div className="space-y-3">
                {factors.map(({ label, value, color, icon }) => (
                  <div key={label}>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="text-muted-foreground">{icon} {label}</span>
                      <span className={`font-bold ${value >= 75 ? "text-green-700 dark:text-green-400" : value >= 55 ? "text-yellow-700 dark:text-yellow-400" : "text-red-600 dark:text-red-400"}`}>{value}</span>
                    </div>
                    <RatingBar value={value} color={color} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Contract Intelligence */}
          <div className="bg-muted border border-border rounded-2xl p-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-foreground flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Contract Intelligence
              </h4>
              <button
                onClick={() => selectedPlayerId && contractMutation.mutate({ playerId: selectedPlayerId })}
                disabled={contractMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-1">
                {contractMutation.isPending ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Brain className="w-3 h-3" />}
                Analyze Risk
              </button>
            </div>
            {contractMutation.data ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className={`px-3 py-1 rounded-full text-sm font-bold ${contractMutation.data.riskLevel === "low" ? "bg-green-500/20 text-green-700 dark:text-green-400" : contractMutation.data.riskLevel === "medium" ? "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400" : "bg-red-500/20 text-red-600 dark:text-red-400"}`}>
                    {contractMutation.data.riskLevel?.toUpperCase()} RISK
                  </div>
                  <div className="text-sm text-muted-foreground">Score: {contractMutation.data.riskScore}/100</div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Key Risks</div>
                    {contractMutation.data.keyRisks?.map((r: string, i: number) => (
                      <div key={i} className="text-sm text-muted-foreground flex items-start gap-2 mb-1">
                        <AlertTriangle className="w-3 h-3 text-yellow-700 dark:text-yellow-400 flex-shrink-0 mt-0.5" /> {r}
                      </div>
                    ))}
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Recommendations</div>
                    {contractMutation.data.recommendations?.map((r: string, i: number) => (
                      <div key={i} className="text-sm text-muted-foreground flex items-start gap-2 mb-1">
                        <CheckCircle2 className="w-3 h-3 text-green-700 dark:text-green-400 flex-shrink-0 mt-0.5" /> {r}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-muted rounded-lg p-3">
                    <div className="text-xs text-muted-foreground">Optimal Contract</div>
                    <div className="text-sm font-semibold text-foreground">{contractMutation.data.optimalContractLength}</div>
                  </div>
                  <div className="bg-muted rounded-lg p-3">
                    <div className="text-xs text-muted-foreground">Salary Benchmark</div>
                    <div className="text-sm font-semibold text-foreground">{contractMutation.data.salaryBenchmark}</div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Click "Analyze Risk" to get AI-powered contract intelligence for this player.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Player Comparison Tab ───────────────────────────────────────────────────
function PlayerComparisonTab() {
  const [playerAId, setPlayerAId] = useState<number | null>(null);
  const [playerBId, setPlayerBId] = useState<number | null>(null);
  const [resultA, setResultA] = useState<any>(null);
  const [resultB, setResultB] = useState<any>(null);
  const [isExporting, setIsExporting] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);
  const { data: allPlayers } = trpc.players.getAll.useQuery();
  const valuateA = trpc.transferMarket.valuatePlayer.useMutation({ onSuccess: (d) => { setResultA(d); toast.success("Player A valued!"); }, onError: (e) => toast.error(e.message) });
  const valuateB = trpc.transferMarket.valuatePlayer.useMutation({ onSuccess: (d) => { setResultB(d); toast.success("Player B valued!"); }, onError: (e) => toast.error(e.message) });
  const nameA = allPlayers?.find((p: any) => p.id === playerAId);
  const nameB = allPlayers?.find((p: any) => p.id === playerBId);
  const labelA = nameA ? `${nameA.firstName} ${nameA.lastName}` : "Player A";
  const labelB = nameB ? `${nameB.firstName} ${nameB.lastName}` : "Player B";

  const handleExportImage = useCallback(async () => {
    if (!exportRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(exportRef.current, { backgroundColor: "#1f2937", scale: 2, useCORS: true });
      const link = document.createElement("a");
      link.download = `${labelA}_vs_${labelB}_comparison.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("Image downloaded!");
    } catch { toast.error("Export failed"); } finally { setIsExporting(false); }
  }, [labelA, labelB]);

  const handleExportPDF = useCallback(async () => {
    if (!exportRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(exportRef.current, { backgroundColor: "#1f2937", scale: 2, useCORS: true });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [canvas.width / 2, canvas.height / 2] });
      pdf.addImage(imgData, "PNG", 0, 0, canvas.width / 2, canvas.height / 2);
      pdf.save(`${labelA}_vs_${labelB}_comparison.pdf`);
      toast.success("PDF downloaded!");
    } catch { toast.error("Export failed"); } finally { setIsExporting(false); }
  }, [labelA, labelB]);
  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-muted border border-border rounded-2xl p-6 mb-6">
        <h3 className="text-lg font-bold text-foreground mb-1 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> Player Comparison Engine</h3>
        <p className="text-sm text-muted-foreground mb-4">Select two players and run AI valuation on both to compare their 8-factor radar charts side-by-side.</p>
        <div className="grid grid-cols-2 gap-4">
          {[{id: playerAId, setId: setPlayerAId, label: "Player A", color: "bg-emerald-600 hover:bg-emerald-700", valuate: valuateA, pending: valuateA.isPending, accentBorder: "border-emerald-600"}, {id: playerBId, setId: setPlayerBId, label: "Player B", color: "bg-indigo-600 hover:bg-indigo-700", valuate: valuateB, pending: valuateB.isPending, accentBorder: "border-indigo-600"}].map(({id, setId, label, color, valuate, pending, accentBorder}) => (
            <div key={label} className={`bg-muted/50 border ${accentBorder} rounded-xl p-4`}>
              <div className="text-xs font-bold text-muted-foreground mb-2">{label}</div>
              <select value={id || ""} onChange={e => setId(Number(e.target.value))} className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-foreground text-sm mb-3">
                <option value="">Select player...</option>
                {(allPlayers || []).map((p: any) => <option key={p.id} value={p.id}>{p.firstName} {p.lastName} ({p.position})</option>)}
              </select>
              <button onClick={() => id && valuate.mutate({ playerId: id })} disabled={!id || pending} className={`w-full ${color} disabled:opacity-50 text-white text-sm px-3 py-2 rounded-lg flex items-center justify-center gap-2`}>
                {pending ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />} {pending ? "Analyzing..." : "Run AI Valuation"}
              </button>
            </div>
          ))}
        </div>
      </div>
      {(valuateA.isPending || valuateB.isPending) && (
        <div className="space-y-4 animate-pulse">
          <div className="bg-muted/50 border border-border rounded-2xl p-5">
            <div className="h-4 w-48 bg-muted rounded mb-4" />
            <div className="flex items-center justify-center" style={{ height: "320px" }}>
              <div className="w-64 h-64 rounded-full border-4 border-dashed border-border flex items-center justify-center">
                <div className="text-center">
                  <RefreshCw className="w-8 h-8 text-gray-600 animate-spin mx-auto mb-2" />
                  <div className="text-xs text-muted-foreground">{valuateA.isPending && valuateB.isPending ? "Analyzing both players..." : valuateA.isPending ? `Analyzing ${labelA}...` : `Analyzing ${labelB}...`}</div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              {[0,1].map(i => (
                <div key={i}>
                  <div className="h-3 w-24 bg-muted rounded mb-3" />
                  <div className="grid grid-cols-4 gap-1">
                    {Array(8).fill(0).map((_,j) => <div key={j} className="text-center"><div className="h-4 w-8 bg-muted rounded mx-auto mb-1" /><div className="h-2 w-full bg-muted rounded" /></div>)}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[0,1].map(i => <div key={i} className="bg-muted border border-border rounded-2xl p-5"><div className="h-3 w-20 bg-muted rounded mb-3" /><div className="h-8 w-32 bg-muted rounded mb-2" /><div className="h-3 w-full bg-muted rounded mb-2" /><div className="h-3 w-3/4 bg-muted rounded" /></div>)}
          </div>
        </div>
      )}
      {resultA && resultB ? (
        <div className="space-y-4">
          <div className="flex justify-end gap-2">
            <button onClick={handleExportImage} disabled={isExporting} className="flex items-center gap-2 bg-muted hover:bg-muted disabled:opacity-50 text-foreground text-xs px-3 py-2 rounded-lg transition-colors">
              {isExporting ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Image className="w-3 h-3" />} Export PNG
            </button>
            <button onClick={handleExportPDF} disabled={isExporting} className="flex items-center gap-2 bg-blue-700 hover:bg-blue-600 disabled:opacity-50 text-white text-xs px-3 py-2 rounded-lg transition-colors">
              {isExporting ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />} Export PDF
            </button>
          </div>
          <ComparisonRadarChart dataA={resultA} dataB={resultB} nameA={labelA} nameB={labelB} exportRef={exportRef} />
          <div className="grid grid-cols-2 gap-4">
            {[{name: labelA, r: resultA, color: "text-emerald-700 dark:text-emerald-400", bg: "from-emerald-900/30 to-teal-900/30", border: "border-emerald-700/50"}, {name: labelB, r: resultB, color: "text-indigo-600 dark:text-indigo-400", bg: "from-indigo-900/30 to-purple-900/30", border: "border-indigo-700/50"}].map(({name, r, color, bg, border}) => (
              <div key={name} className={`bg-gradient-to-br ${bg} border ${border} rounded-2xl p-5`}>
                <div className="text-sm text-muted-foreground mb-1">{name}</div>
                <div className={`text-3xl font-black ${color}`}>{formatValue(r.estimatedValue)}</div>
                <div className="flex items-center gap-2 mt-1"><TrendIcon trend={r.trend} /><span className="text-xs text-muted-foreground capitalize">{r.trend}</span></div>
                <div className="mt-2 text-xs text-muted-foreground">{r.aiNarrative}</div>
                <div className="mt-2 text-xs text-muted-foreground">Comparable: {r.comparablePlayer}</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground">
          <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Select two players and run AI Valuation on both to see the comparison.</p>
        </div>
      )}
    </div>
  );
}
// ─── Transfer History Tab ─────────────────────────────────────────────────────
function TransferHistoryTab() {
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const [histTypeFilter, setHistTypeFilter] = useState("all");
  const [histStatusFilter, setHistStatusFilter] = useState("all");
  const [histDateFrom, setHistDateFrom] = useState("");
  const [histDateTo, setHistDateTo] = useState("");
  const [histSortDir, setHistSortDir] = useState<"asc" | "desc">("desc");
  const { data: allPlayers } = trpc.players.getAll.useQuery();
  const { data: history, isLoading } = trpc.transferMarket.getTransferHistory.useQuery(
    { playerId: selectedPlayerId! },
    { enabled: !!selectedPlayerId }
  );
  const listingTypeColors: Record<string, string> = { sale: "bg-blue-500/20 text-blue-600 dark:text-blue-400", loan: "bg-orange-500/20 text-orange-700 dark:text-orange-400", free_agent: "bg-green-500/20 text-green-700 dark:text-green-400", swap: "bg-purple-500/20 text-purple-600 dark:text-purple-400" };
  const statusColors: Record<string, string> = { active: "text-yellow-700 dark:text-yellow-400", sold: "text-green-700 dark:text-green-400", expired: "text-muted-foreground", cancelled: "text-red-600 dark:text-red-400" };
  const filteredListings = (history?.listings || []).filter(({ listing }: any) => {
    if (histTypeFilter !== "all" && listing.listingType !== histTypeFilter) return false;
    if (histStatusFilter !== "all" && listing.status !== histStatusFilter) return false;
    if (histDateFrom && new Date(listing.createdAt) < new Date(histDateFrom)) return false;
    if (histDateTo && new Date(listing.createdAt) > new Date(histDateTo + "T23:59:59")) return false;
    return true;
  }).sort((a: any, b: any) => {
    const ta = new Date(a.listing.createdAt).getTime();
    const tb = new Date(b.listing.createdAt).getTime();
    return histSortDir === "desc" ? tb - ta : ta - tb;
  });
  const histActiveFilters = [histTypeFilter !== "all", histStatusFilter !== "all", !!histDateFrom, !!histDateTo].filter(Boolean).length;
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-muted border border-border rounded-2xl p-6 mb-6">
        <h3 className="text-lg font-bold text-foreground mb-1 flex items-center gap-2"><Clock className="w-5 h-5 text-orange-700 dark:text-orange-400" /> Transfer History Timeline</h3>
        <p className="text-sm text-muted-foreground mb-4">View a player's complete transfer listing history, past clubs, fees, and valuation trend over time.</p>
        <select value={selectedPlayerId || ""} onChange={e => setSelectedPlayerId(Number(e.target.value))} className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-foreground text-sm mb-4">
          <option value="">Select a player...</option>
          {(allPlayers || []).map((p: any) => <option key={p.id} value={p.id}>{p.firstName} {p.lastName} ({p.position}, {calcAge(p.dateOfBirth)}y)</option>)}
        </select>
        {selectedPlayerId && (
          <div className="border-t border-border pt-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Filter className="w-4 h-4" /> Filters
                {histActiveFilters > 0 && <span className="bg-emerald-600 text-white text-xs px-1.5 py-0.5 rounded-full">{histActiveFilters}</span>}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setHistSortDir(d => d === "desc" ? "asc" : "desc")} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground bg-muted px-2 py-1 rounded-lg">
                  <ArrowUpDown className="w-3 h-3" /> {histSortDir === "desc" ? "Newest first" : "Oldest first"}
                </button>
                {histActiveFilters > 0 && <button onClick={() => { setHistTypeFilter("all"); setHistStatusFilter("all"); setHistDateFrom(""); setHistDateTo(""); }} className="text-xs text-red-600 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300">Clear all</button>}
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Transfer Type</label>
                <select value={histTypeFilter} onChange={e => setHistTypeFilter(e.target.value)} className="w-full bg-muted border border-border rounded-lg px-2 py-1.5 text-foreground text-xs">
                  <option value="all">All Types</option>
                  <option value="sale">Sale</option>
                  <option value="loan">Loan</option>
                  <option value="free_agent">Free Agent</option>
                  <option value="swap">Swap</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Status</label>
                <select value={histStatusFilter} onChange={e => setHistStatusFilter(e.target.value)} className="w-full bg-muted border border-border rounded-lg px-2 py-1.5 text-foreground text-xs">
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="sold">Sold</option>
                  <option value="expired">Expired</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">From Date</label>
                <input type="date" value={histDateFrom} onChange={e => setHistDateFrom(e.target.value)} className="w-full bg-muted border border-border rounded-lg px-2 py-1.5 text-foreground text-xs" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">To Date</label>
                <input type="date" value={histDateTo} onChange={e => setHistDateTo(e.target.value)} className="w-full bg-muted border border-border rounded-lg px-2 py-1.5 text-foreground text-xs" />
              </div>
            </div>
          </div>
        )}
      </div>
      {isLoading && <div className="text-center py-10 text-muted-foreground"><RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" /> Loading history...</div>}
      {history && (
        <div className="space-y-6">
          {/* Valuation Trend */}
          {history.valuations.length > 0 && (
            <div className="bg-muted border border-border rounded-2xl p-5">
              <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-emerald-700 dark:text-emerald-400" /> Valuation History</h4>
              <div className="space-y-2">
                {history.valuations.map((v: any, i: number) => (
                  <div key={v.id} className="flex items-center gap-4">
                    <div className="w-24 text-xs text-muted-foreground">{new Date(v.createdAt).toLocaleDateString()}</div>
                    <div className="flex-1 bg-muted rounded-full h-2">
                      <div className="bg-gradient-to-r from-emerald-500 to-teal-400 h-2 rounded-full" style={{ width: `${Math.min((Number(v.estimatedValue) / 5000000) * 100, 100)}%` }} />
                    </div>
                    <div className="w-24 text-right">
                      <span className={`text-sm font-bold ${i === 0 ? "text-emerald-700 dark:text-emerald-400" : "text-muted-foreground"}`}>{formatValue(v.estimatedValue)}</span>
                    </div>
                    <div className="w-16">
                      <span className={`text-xs capitalize ${v.trend === "rising" ? "text-green-700 dark:text-green-400" : v.trend === "declining" ? "text-red-600 dark:text-red-400" : "text-muted-foreground"}`}>{v.trend}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Transfer Listings Timeline */}
          <div className="bg-muted border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-foreground flex items-center gap-2"><Globe className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Transfer Listing Timeline</h4>
              <span className="text-xs text-muted-foreground">{filteredListings.length} record{filteredListings.length !== 1 ? "s" : ""}</span>
            </div>
            {filteredListings.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">{histActiveFilters > 0 ? "No records match the current filters." : "No transfer listings found for this player."}</p>
            ) : (
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-muted" />
                <div className="space-y-4">
                  {filteredListings.map(({ listing }: any) => (
                    <div key={listing.id} className="flex gap-4 pl-10 relative">
                      <div className="absolute left-2.5 top-3 w-3 h-3 rounded-full bg-gray-600 border-2 border-gray-500" />
                      <div className="flex-1 bg-muted/50 border border-border rounded-xl p-4">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${listingTypeColors[listing.listingType] || "bg-gray-500/20 text-muted-foreground"}`}>{listing.listingType?.replace("_", " ")}</span>
                          <span className={`text-xs font-medium capitalize ${statusColors[listing.status] || "text-muted-foreground"}`}>{listing.status}</span>
                          <span className="text-xs text-muted-foreground ml-auto">{new Date(listing.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-6">
                          {listing.askingPrice && <div><div className="text-xs text-muted-foreground">Asking Price</div><div className="text-lg font-bold text-foreground">{formatValue(listing.askingPrice)}</div></div>}
                          {listing.aiValuation && <div><div className="text-xs text-muted-foreground">AI Valuation</div><div className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{formatValue(listing.aiValuation)}</div></div>}
                          {listing.currency && <div className="text-xs text-muted-foreground">{listing.currency}</div>}
                        </div>
                        {listing.description && <p className="text-xs text-muted-foreground mt-2 italic">{listing.description}</p>}
                        {listing.agentName && <p className="text-xs text-muted-foreground mt-1">Agent: {listing.agentName}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {!selectedPlayerId && !isLoading && (
        <div className="text-center py-16 text-muted-foreground">
          <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Select a player to view their transfer history and valuation timeline.</p>
        </div>
      )}
    </div>
  );
}
// ─── Watchlist Tab ────────────────────────────────────────────────────────────
function WatchlistTab() {
  const { data: watchlist, refetch } = trpc.transferMarket.getWatchlist.useQuery();
  const removeMutation = trpc.transferMarket.removeFromWatchlist.useMutation({
    onSuccess: () => { toast.success("Removed from watchlist"); refetch(); },
  });
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ playerId: 0, priority: "warm" as any, notes: "", budgetRange: "" });
  const { data: allPlayers } = trpc.players.getAll.useQuery();
  const addMutation = trpc.transferMarket.addToWatchlist.useMutation({
    onSuccess: (d) => {
      if (d.alreadyExists) toast.info("Already in watchlist");
      else toast.success("Added to watchlist!");
      setShowAdd(false);
      refetch();
    },
  });

  const priorityColors: Record<string, string> = {
    hot: "border-red-700/50",
    warm: "border-yellow-700/50",
    cold: "border-blue-700/50",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-foreground font-semibold flex items-center gap-2">
          <Bookmark className="w-4 h-4 text-yellow-700 dark:text-yellow-400" /> Scouting Watchlist ({watchlist?.length || 0})
        </h3>
        <button onClick={() => setShowAdd(true)}
          className="bg-yellow-600 hover:bg-yellow-700 text-black text-sm px-4 py-2 rounded-lg flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Player
        </button>
      </div>

      <div className="space-y-3">
        {(watchlist || []).map(({ watchlist: w, player }) => {
          const age = calcAge(player.dateOfBirth);
          return (
            <div key={w.id} className={`bg-muted border rounded-xl p-4 flex items-center gap-4 ${priorityColors[w.priority || "warm"]}`}>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-600 to-orange-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {player.firstName[0]}{player.lastName[0]}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">{player.firstName} {player.lastName}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${w.priority === "hot" ? "bg-red-500/20 text-red-600 dark:text-red-400 border-red-700/50" : w.priority === "warm" ? "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-700/50" : "bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-700/50"}`}>
                    {w.priority === "hot" ? "🔥" : w.priority === "warm" ? "⭐" : "❄️"} {w.priority?.toUpperCase()}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">{age}y • {player.position} • {player.nationality || "—"}</div>
                {w.notes && <p className="text-xs text-muted-foreground mt-1 italic">"{w.notes}"</p>}
                {w.budgetRange && <div className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">Budget: {w.budgetRange}</div>}
              </div>
              <button onClick={() => removeMutation.mutate({ watchlistId: w.id })}
                className="text-muted-foreground hover:text-red-600 dark:hover:text-red-400 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
        {!watchlist?.length && (
          <div className="text-center py-16 text-muted-foreground">
            <Bookmark className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No players in watchlist. Add players to track them.</p>
          </div>
        )}
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-foreground">Add to Watchlist</h3>
              <button onClick={() => setShowAdd(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>
            <div className="space-y-3">
              <select value={addForm.playerId} onChange={e => setAddForm(f => ({ ...f, playerId: Number(e.target.value) }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-foreground text-sm">
                <option value={0}>Select player...</option>
                {(allPlayers || []).map((p: any) => (
                  <option key={p.id} value={p.id}>{p.firstName} {p.lastName} ({p.position})</option>
                ))}
              </select>
              <select value={addForm.priority} onChange={e => setAddForm(f => ({ ...f, priority: e.target.value as any }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-foreground text-sm">
                <option value="hot">Hot Priority</option>
                <option value="warm">Warm Priority</option>
                <option value="cold">Cold Priority</option>
              </select>
              <input type="text" placeholder="Budget range (e.g. $200K - $500K)" value={addForm.budgetRange}
                onChange={e => setAddForm(f => ({ ...f, budgetRange: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-foreground text-sm" />
              <textarea placeholder="Scouting notes..." value={addForm.notes}
                onChange={e => setAddForm(f => ({ ...f, notes: e.target.value }))}
                rows={2} className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-foreground text-sm resize-none" />
              <button onClick={() => addMutation.mutate(addForm)}
                disabled={!addForm.playerId || addMutation.isPending}
                className="w-full bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 text-black py-2.5 rounded-lg font-medium">
                Add to Watchlist
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Offers Dashboard Tab ─────────────────────────────────────────────────────
function OffersDashboard() {
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "accepted" | "rejected" | "countered">("all");
  const [counterModal, setCounterModal] = useState<{ offerId: number; offeringClub: string; originalAmount: string } | null>(null);
  const [counterAmount, setCounterAmount] = useState("");
  const { data: offers, refetch } = trpc.transferMarket.getAllOffers.useQuery({ status: statusFilter });
  const respondMutation = trpc.transferMarket.respondToOffer.useMutation({
    onSuccess: (_, vars) => {
      toast.success(`Offer ${vars.status}!`);
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const counterMutation = trpc.transferMarket.respondToOffer.useMutation({
    onSuccess: () => { toast.success("Counter-offer sent!"); setCounterModal(null); setCounterAmount(""); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const statusConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
    pending: { color: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-700/50", icon: <Clock className="w-3 h-3" />, label: "Pending" },
    accepted: { color: "bg-green-500/20 text-green-700 dark:text-green-400 border-green-700/50", icon: <CheckCircle2 className="w-3 h-3" />, label: "Accepted" },
    rejected: { color: "bg-red-500/20 text-red-600 dark:text-red-400 border-red-700/50", icon: <XCircle className="w-3 h-3" />, label: "Rejected" },
    countered: { color: "bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-700/50", icon: <RefreshCw className="w-3 h-3" />, label: "Countered" },
    withdrawn: { color: "bg-gray-500/20 text-muted-foreground border-border/50", icon: <X className="w-3 h-3" />, label: "Withdrawn" },
  };

  // Summary stats
  const allOffers = offers || [];
  const summaryStats = {
    total: allOffers.length,
    pending: allOffers.filter(o => o.offer.status === "pending").length,
    accepted: allOffers.filter(o => o.offer.status === "accepted").length,
    rejected: allOffers.filter(o => o.offer.status === "rejected").length,
  };

  return (
    <div>
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Total Offers", value: summaryStats.total, color: "text-foreground", bg: "bg-muted" },
          { label: "Pending Review", value: summaryStats.pending, color: "text-yellow-700 dark:text-yellow-400", bg: "bg-yellow-500/10" },
          { label: "Accepted", value: summaryStats.accepted, color: "text-green-700 dark:text-green-400", bg: "bg-green-500/10" },
          { label: "Rejected", value: summaryStats.rejected, color: "text-red-600 dark:text-red-400", bg: "bg-red-500/10" },
        ].map(s => (
          <div key={s.label} className={`${s.bg} border border-border rounded-xl p-4 text-center`}>
            <div className={`text-3xl font-black ${s.color}`}>{s.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {(["all", "pending", "accepted", "rejected", "countered"] as const).map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${statusFilter === s ? "bg-emerald-600 text-white" : "bg-muted text-muted-foreground hover:bg-muted"}`}>
            {s === "all" ? "All Offers" : s}
            {s === "pending" && summaryStats.pending > 0 && (
              <span className="ml-1.5 bg-yellow-500 text-black text-xs w-4 h-4 rounded-full inline-flex items-center justify-center font-bold">{summaryStats.pending}</span>
            )}
          </button>
        ))}
      </div>

      {/* Offers List */}
      <div className="space-y-3">
        {allOffers.map(({ offer, player }) => {
          const cfg = statusConfig[offer.status] || statusConfig.pending;
          const age = player ? calcAge(player.dateOfBirth) : 0;
          return (
            <div key={offer.id} className="bg-muted border border-border rounded-xl p-5">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {player ? `${player.firstName[0]}${player.lastName[0]}` : "?"}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-foreground">{player ? `${player.firstName} ${player.lastName}` : "Unknown Player"}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border flex items-center gap-1 ${cfg.color}`}>
                      {cfg.icon} {cfg.label}
                    </span>
                    <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full capitalize">{offer.offerType}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {player ? `${age}y • ${player.position}` : ""} • From: <span className="text-foreground font-medium">{offer.offeringClub}</span>
                  </div>

                  <div className="flex items-center gap-6 mt-3">
                    <div>
                      <div className="text-xs text-muted-foreground">Offer Amount</div>
                      <div className="text-xl font-bold text-emerald-700 dark:text-emerald-400">{formatValue(offer.offerAmount)}</div>
                    </div>
                    {offer.counterOffer && (
                      <div>
                        <div className="text-xs text-muted-foreground">Counter Offer</div>
                        <div className="text-xl font-bold text-blue-600 dark:text-blue-400">{formatValue(offer.counterOffer)}</div>
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground ml-auto">
                      {new Date(offer.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  {offer.message && (
                    <div className="mt-2 p-2 bg-muted/50 rounded-lg text-sm text-muted-foreground italic">
                      "{offer.message}"
                    </div>
                  )}
                </div>

                {/* Action buttons for pending offers */}
                {offer.status === "pending" && (
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <button
                      onClick={() => respondMutation.mutate({ offerId: offer.id, status: "accepted" })}
                      disabled={respondMutation.isPending}
                      className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-xs px-3 py-2 rounded-lg flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Accept
                    </button>
                    <button
                      onClick={() => setCounterModal({ offerId: offer.id, offeringClub: offer.offeringClub, originalAmount: offer.offerAmount || "0" })}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-2 rounded-lg flex items-center gap-1">
                      <RefreshCw className="w-3 h-3" /> Counter
                    </button>
                    <button
                      onClick={() => respondMutation.mutate({ offerId: offer.id, status: "rejected" })}
                      disabled={respondMutation.isPending}
                      className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs px-3 py-2 rounded-lg flex items-center gap-1">
                      <XCircle className="w-3 h-3" /> Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
              {!allOffers.length && (
          <div className="text-center py-16 text-muted-foreground">
            <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No {statusFilter !== "all" ? statusFilter : ""} offers yet.</p>
          </div>
        )}
      </div>
      {/* Counter-Offer Modal */}
      {counterModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-muted border border-border rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-foreground mb-1 flex items-center gap-2"><RefreshCw className="w-5 h-5 text-blue-400" /> Counter Offer</h3>
            <p className="text-sm text-muted-foreground mb-4">Send a negotiated counter-offer to <span className="text-foreground font-medium">{counterModal.offeringClub}</span></p>
            <div className="mb-4">
              <div className="text-xs text-muted-foreground mb-1">Their Offer</div>
              <div className="text-2xl font-black text-yellow-700 dark:text-yellow-400">{formatValue(counterModal.originalAmount)}</div>
            </div>
            <div className="mb-5">
              <label className="text-sm text-muted-foreground mb-1 block">Your Counter-Offer Amount (USD)</label>
              <input
                type="number"
                placeholder="e.g. 1500000"
                value={counterAmount}
                onChange={e => setCounterAmount(e.target.value)}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-foreground text-sm"
              />
              {counterAmount && <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">= {formatValue(Number(counterAmount))}</div>}
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setCounterModal(null); setCounterAmount(""); }} className="flex-1 bg-muted hover:bg-muted text-foreground text-sm px-4 py-2.5 rounded-lg">Cancel</button>
              <button
                onClick={() => counterMutation.mutate({ offerId: counterModal.offerId, status: "countered", counterOffer: Number(counterAmount) })}
                disabled={!counterAmount || counterMutation.isPending}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm px-4 py-2.5 rounded-lg flex items-center justify-center gap-2">
                {counterMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} Send Counter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
// ─── Main Component ───────────────────────────────────────────────────────────
export default function ProClubHub() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [activeTab, setActiveTab] = useState<Tab>("squad");

  // Get pending offers count for badge
  const { data: pendingOffers } = trpc.transferMarket.getAllOffers.useQuery({ status: "pending" });
  const pendingCount = pendingOffers?.length || 0;

  const tabs: { id: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: "squad", label: isAr ? "الفريق" : "Squad", icon: <Users className="w-4 h-4" /> },
    { id: "market", label: isAr ? "سوق الانتقالات" : "Transfer Market", icon: <ShoppingCart className="w-4 h-4" /> },
    { id: "valuation", label: isAr ? "تقييم AI" : "AI Valuation", icon: <Brain className="w-4 h-4" /> },
    { id: "watchlist", label: isAr ? "المراقبة" : "Watchlist", icon: <Bookmark className="w-4 h-4" /> },
    { id: "offers", label: isAr ? "العروض" : "Offers", icon: <DollarSign className="w-4 h-4" />, badge: pendingCount },
    { id: "comparison", label: isAr ? "مقارنة" : "Compare", icon: <BarChart3 className="w-4 h-4" /> },
    { id: "history", label: isAr ? "السجل" : "History", icon: <Clock className="w-4 h-4" /> },
  ];

  return (
    <>
    <div className="text-foreground" dir={isAr ? "rtl" : "ltr"}>
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <Globe className="w-5 h-5 text-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-foreground">
                {isAr ? "مركز الفريق الاحترافي" : "Pro Club Hub"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isAr ? "سوق الانتقالات · تقييم الذكاء الاصطناعي · استخبارات العقود · إدارة العروض" : "Transfer Market · AI Valuation · Contract Intelligence · Offer Management"}
              </p>
            </div>
          </div>
        </div>

        {/* Market Stats */}
        <MarketStatsBanner />

        {/* Tabs */}
        <div className="flex gap-1 bg-card p-1 rounded-xl mb-6 overflow-x-auto">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex-1 justify-center relative ${activeTab === tab.id ? "bg-muted text-foreground shadow" : "text-muted-foreground hover:text-foreground"}`}>
              {tab.icon}
              {tab.label}
              {tab.badge && tab.badge > 0 && (
                <span className="absolute -top-1 -right-1 bg-yellow-500 text-black text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === "squad" && <SquadOverview />}
          {activeTab === "market" && <TransferMarketTab />}
          {activeTab === "valuation" && <ValuationTab />}
          {activeTab === "watchlist" && <WatchlistTab />}
          {activeTab === "offers" && <OffersDashboard />}
          {activeTab === "comparison" && <PlayerComparisonTab />}
          {activeTab === "history" && <TransferHistoryTab />}
        </div>
      </div>
    </div>
    </>
  );
}
