"use client";

import { useEffect, useState, useRef } from "react";
import { RefreshCw, WifiOff, Play, Clock, X, Tv, ArrowLeft } from "lucide-react";
import Hls from "hls.js";

type Match = {
  match_id: number;
  team_one_name: string;
  team_two_name: string;
  start_time: string;
  score: string;
  iframe_source: string;
  m3u8_source: string;
};

const SPORT_SLUGS = [
  { slug: "football1", label: "Football " },
//  { slug: "tennis", label: "Tennis " },
 // { slug: "cricket", label: "Cricket " },
];

// Reusable HLS Video Player Component for .m3u8 streams
function HlsPlayer({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let hls: Hls | null = null;

    if (Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });
      hls.loadSource(src);
      hls.attachMedia(video);
    } else if (video && typeof video.canPlayType === "function" && video.canPlayType("application/vnd.apple.mpegurl")) {
      // Safely checked native fallback (Safari, iOS Safari) with no typescript warnings
      video.src = src;
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [src]);

  return (
    <video
      ref={videoRef}
      controls
      autoPlay
      playsInline
      className="w-full max-w-5xl aspect-video rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl"
    />
  );
}

export default function LiveFootballPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSlug, setActiveSlug] = useState("football1");
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMatches(activeSlug);
    const interval = setInterval(() => fetchMatches(activeSlug), 60000);
    return () => clearInterval(interval);
  }, [activeSlug]);

  async function fetchMatches(slug: string) {
    setLoading(true);
    setError(null);
    try {
      const today = new Date().toISOString().split("T")[0];
      const res = await fetch(`/api/sports?slug=${slug}&date=${today}`);
      const raw = await res.json();

      let allMatches: Match[] = [];

      if (Array.isArray(raw)) {
        raw.forEach((item: any) => {
          if (item?.match_id) {
            allMatches.push(item);
          } else if (Array.isArray(item?.data)) {
            allMatches.push(...item.data);
          }
        });
      } else if (Array.isArray(raw?.data)) {
        allMatches = raw.data;
      }

      allMatches.sort(
        (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
      );

      setMatches(allMatches);
      setLastUpdated(new Date());
    } catch (e) {
      console.error("Failed to fetch matches:", e);
      setError("Failed to load matches.");
    } finally {
      setLoading(false);
    }
  }

  function isLive(match: Match) {
    const start = new Date(match.start_time).getTime();
    const now = Date.now();
    return now >= start && now <= start + 2 * 60 * 60 * 1000;
  }

  function isUpcoming(match: Match) {
    return new Date(match.start_time).getTime() > Date.now();
  }

  const liveMatches = matches.filter(isLive);
  const upcomingMatches = matches.filter(isUpcoming);
  const pastMatches = matches.filter((m) => !isLive(m) && !isUpcoming(m));

  function MatchCard({ match }: { match: Match }) {
    const live = isLive(match);
    const upcoming = isUpcoming(match);
    const hasStream = !!(match.iframe_source || match.m3u8_source);
    const [home, away] = (match.score || "0:0").split(":");

    // Dynamic sport labeling to prevent displaying "Cricket" on a football match
    const getSportLabel = () => {
      const teamNames = `${match.team_one_name} ${match.team_two_name}`.toLowerCase();
      
      const footballKeywords = [
        "fc", "united", "arsenal", "bayern", "stuttgart", "barcelona", 
        "bilbao", "kups", "vardar", "athletic", "atlanta", "colegiales",
        "argentino", "laferrere", "brown de adr"
      ];
      const basketballKeywords = ["lakers", "celtics", "warriors", "bulls", "knicks"];
      const tennisKeywords = ["nadal", "federer", "djokovic", "alcaraz", "open"];
      
      if (footballKeywords.some(keyword => teamNames.includes(keyword))) {
        return "Football ";
      }
    if (basketballKeywords.some(keyword => teamNames.includes(keyword))) {
        return "Basketball ";
      }
      if (tennisKeywords.some(keyword => teamNames.includes(keyword))) {
        return "Tennis ";
      }
      
      const currentTab = SPORT_SLUGS.find((s) => s.slug === activeSlug);
      return currentTab ? currentTab.label : "Sports ";
    };

    return (
      <div className={`bg-zinc-900/60 border rounded-2xl p-5 transition-all hover:bg-zinc-900 ${
        live ? "border-red-500/40 shadow-lg shadow-red-500/5" : "border-white/5"
      }`}>
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">
            {getSportLabel()}
          </span>
          {live ? (
            <span className="flex items-center gap-1.5 bg-red-500/15 text-red-400 text-[10px] font-black px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
              LIVE
            </span>
          ) : upcoming ? (
            <span className="flex items-center gap-1.5 bg-blue-500/10 text-blue-400 text-[10px] font-black px-2.5 py-1 rounded-full">
              <Clock size={10} />
              {new Date(match.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          ) : (
            <span className="text-[10px] text-zinc-600 font-bold uppercase">Finished</span>
          )}
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="font-black text-sm truncate">{match.team_one_name}</p>
          </div>
          <div className="shrink-0 text-center px-3">
            {!upcoming ? (
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black">{home}</span>
                <span className="text-zinc-600">-</span>
                <span className="text-2xl font-black">{away}</span>
              </div>
            ) : (
              <span className="text-orange-500 font-black text-sm">VS</span>
            )}
          </div>
          <div className="flex-1 min-w-0 text-right">
            <p className="font-black text-sm truncate">{match.team_two_name}</p>
          </div>
        </div>

        {(live || !upcoming) && hasStream && (
          <button
            onClick={() => setSelectedMatch(match)}
            className="mt-4 w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white font-black text-xs uppercase tracking-widest py-2.5 rounded-xl transition-all"
          >
            <Play size={12} fill="white" />
            {live ? "Watch Live" : "Replay"}
          </button>
        )}

        {live && !hasStream && (
          <div className="mt-4 w-full flex items-center justify-center gap-2 bg-zinc-800 text-zinc-500 font-black text-xs uppercase py-2.5 rounded-xl">
            <Tv size={12} />
            Stream Unavailable
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-32">
      <div className="flex items-center justify-between flex-wrap gap-4">
        {/* Navigation Arrow and Heading section */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => window.history.back()}
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-zinc-900 border border-white/5 hover:border-white/20 hover:bg-zinc-800 transition-all group shrink-0"
            aria-label="Go Back"
          >
            <ArrowLeft size={18} className="text-zinc-400 group-hover:text-white transition-colors group-hover:-translate-x-0.5 duration-200" />
          </button>
          <div>
            <h1 className="text-4xl font-black italic uppercase tracking-tighter flex items-center gap-3">
              <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              Live Sports
            </h1>
            <p className="text-zinc-500 text-xs uppercase tracking-widest mt-1">
              {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : "Loading..."}
            </p>
          </div>
        </div>
        <button
          onClick={() => fetchMatches(activeSlug)}
          className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-white/5 px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {SPORT_SLUGS.map((s) => (
          <button
            key={s.slug}
            onClick={() => setActiveSlug(s.slug)}
            className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap border transition-all ${
              activeSlug === s.slug
                ? "bg-orange-500 text-black border-orange-500"
                : "bg-zinc-900 text-zinc-400 border-white/5 hover:border-white/20"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-red-400 text-sm font-bold">
          ⚠️ {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-zinc-900 animate-pulse rounded-2xl h-36" />
          ))}
        </div>
      ) : matches.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 bg-zinc-900/20 rounded-3xl border border-dashed border-white/5">
          <WifiOff size={48} className="text-zinc-700 mb-4" />
          <h2 className="font-black uppercase text-sm text-zinc-500">No Matches Today</h2>
          <p className="text-zinc-600 text-xs mt-2">Try a different sport or check back later</p>
        </div>
      ) : (
        <div className="space-y-10">
          {liveMatches.length > 0 && (
            <section>
              <h2 className="text-lg font-black uppercase tracking-tight mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                Live Now ({liveMatches.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {liveMatches.map((m) => <MatchCard key={m.match_id} match={m} />)}
              </div>
            </section>
          )}

          {upcomingMatches.length > 0 && (
            <section>
              <h2 className="text-lg font-black uppercase tracking-tight mb-4 flex items-center gap-2">
                <Clock size={16} className="text-blue-400" />
                Upcoming ({upcomingMatches.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingMatches.map((m) => <MatchCard key={m.match_id} match={m} />)}
              </div>
            </section>
          )}

          {pastMatches.length > 0 && (
            <section>
              <h2 className="text-lg font-black uppercase tracking-tight mb-4 text-zinc-500">
                Earlier Today ({pastMatches.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {pastMatches.map((m) => <MatchCard key={m.match_id} match={m} />)}
              </div>
            </section>
          )}
        </div>
      )}

      {selectedMatch && (
        <div className="fixed inset-0 bg-black/98 backdrop-blur-xl z-[99999] flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-900 shrink-0">
            <div className="flex flex-col min-w-0">
              <span className="font-black text-sm uppercase truncate">
                {selectedMatch.team_one_name}
                <span className="text-orange-500 mx-2">{selectedMatch.score}</span>
                {selectedMatch.team_two_name}
              </span>
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest mt-0.5">
                {isLive(selectedMatch) ? " Live Now" : "Replay"}
              </span>
            </div>
            <button onClick={() => setSelectedMatch(null)} className="text-zinc-400 hover:text-white p-2 shrink-0">
              <X size={24} />
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center p-4">
            {selectedMatch.iframe_source ? (
              <iframe
                src={selectedMatch.iframe_source}
                className="w-full max-w-5xl aspect-video rounded-2xl border border-zinc-800 bg-zinc-950"
                allowFullScreen
                allow="autoplay; encrypted-media; picture-in-picture"
              />
            ) : selectedMatch.m3u8_source ? (
              <HlsPlayer src={selectedMatch.m3u8_source} />
            ) : (
              <div className="w-full max-w-5xl aspect-video rounded-2xl border border-zinc-800 bg-zinc-950 flex flex-col items-center justify-center gap-4">
                <WifiOff size={48} className="text-zinc-700" />
                <p className="text-zinc-500 font-bold text-sm">No Stream Available</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
