"use client";
import { Search, Radio, Music, Play, X, Loader2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { usePlayerStore } from "@/app/store/usePlayerStore";
import { createClient } from "@/utils/supabase/client"; // Updated import
import { motion, AnimatePresence } from "framer-motion";

export default function Header() {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const { setCurrentSong, setPlaying } = usePlayerStore();
  const searchRef = useRef<HTMLDivElement>(null);
  const supabase = createClient(); // Initialize the client

  useEffect(() => {
    const searchDatabase = async () => {
      if (query.trim().length < 2) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      
      // Explicitly searching YOUR database tables
      const { data, error } = await supabase
        .from('songs') 
        .select('*')
        .or(`title.ilike.%${query}%,artist_name.ilike.%${query}%`)
        .limit(8);

      if (!error && data) {
        setResults(data);
      }
      setIsLoading(false);
    };

    const timer = setTimeout(searchDatabase, 300);
    return () => clearTimeout(timer);
  }, [query, supabase]);

  const handleSelect = (item: any) => {
    setCurrentSong(item);
    setTimeout(() => {
      setPlaying(true);
    }, 50);
    setQuery("");
    setIsFocused(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-black border-b border-white/5 z-[100] px-6 flex items-center justify-between">
      <div className="flex items-center gap-2 min-w-fit">
        <span className="text-orange-500 font-black italic text-xl tracking-tighter uppercase">Zabus.Africa</span>
      </div>

      <div ref={searchRef} className="relative w-full max-w-xl mx-auto px-4">
        <div className="relative flex items-center">
          {isLoading ? (
            <Loader2 className="absolute left-4 text-orange-500 animate-spin" size={18} />
          ) : (
            <Search className={`absolute left-4 ${isFocused ? 'text-orange-500' : 'text-zinc-500'}`} size={18} />
          )}
          
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            placeholder="Search Artists, Songs, Live EPL..."
            className="w-full bg-zinc-900 border border-white/10 rounded-full py-2 pl-12 pr-10 text-sm text-white focus:outline-none focus:border-orange-500/50 transition-all placeholder:text-zinc-600"
          />
        </div>

        <AnimatePresence>
          {isFocused && query.length >= 2 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: 10 }}
              className="absolute top-full left-0 right-0 mt-2 bg-zinc-950 border border-white/10 rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.8)] z-[110]"
            >
              <div className="p-2 max-h-[450px] overflow-y-auto">
                {results.length > 0 ? (
                  results.map((item) => (
                    <div
                      key={item.id}
                      onMouseDown={() => handleSelect(item)}
                      className="w-full flex items-center justify-between p-3 hover:bg-white/5 rounded-xl transition-all group cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-white/5 flex items-center justify-center overflow-hidden">
                          {item.media_type === 'live' ? (
                             <Radio size={18} className="text-red-500" />
                          ) : (
                             <img src={item.cover_url} className="w-full h-full object-cover" alt="" />
                          )}
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-bold text-white group-hover:text-orange-500 transition-colors">
                            {item.title}
                          </p>
                          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                            {item.artist_name}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        {item.media_type === 'live' && (
                          <span className="text-[8px] bg-red-600 px-1.5 py-0.5 rounded text-white font-bold animate-pulse uppercase">Live</span>
                        )}
                        <Play size={14} className="text-zinc-600 group-hover:text-white" />
                      </div>
                    </div>
                  ))
                ) : !isLoading && (
                  <div className="p-10 text-center">
                    <p className="text-zinc-500 text-sm italic font-medium">No internal results for "{query}"</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-3 min-w-fit">
        <button className="bg-orange-600 hover:bg-orange-500 text-white text-[10px] font-black px-6 py-2 rounded-full transition-all uppercase tracking-tighter">
          Home of Entertainment
        </button>
      </div>
    </header>
  );
}