"use client";
import { useRouter } from "next/navigation";
import { usePlayerStore } from "@/app/store/usePlayerStore";
import { 
  Play, Pause, SkipForward, SkipBack, Volume2, X, Maximize2, 
  Shuffle, Repeat, Loader2, Eye, Heart, MessageSquare, Send, Download 
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/utils/supabase/client";

export default function Player() {
  const { 
    currentSong, 
    isPlaying, 
    isLoading, 
    setIsPlaying, 
    setIsLoading,
    isExpanded, 
    setIsExpanded,
    playNext,
    playPrevious,
    incrementView,
    toggleLike
  } = usePlayerStore();

  const mediaRef = useRef<HTMLVideoElement>(null); 
  const supabase = createClient();
  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [hasIncrementedView, setHasIncrementedView] = useState(false);
  
  const [isMiniPlayer, setIsMiniPlayer] = useState(false);
  
  // New States for Subscriptions and Comments Layout
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentInput, setCommentInput] = useState("");
  const [comments, setComments] = useState<any[]>([]);
  

  const activeMediaUrl = currentSong?.audio_url || currentSong?.media_url;

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (isPlaying && currentSong && !hasIncrementedView) {
      incrementView(currentSong.id);
      setHasIncrementedView(true);
    }
  }, [isPlaying, currentSong?.id, hasIncrementedView, incrementView]);

  useEffect(() => {
    setHasIncrementedView(false);
    // Reset subscription visual state when track shifts
    setIsSubscribed(false); 
    fetchComments();
  }, [currentSong?.id]);

  useEffect(() => {
    const video = mediaRef.current;
    if (!video || !activeMediaUrl) return;
    
    video.volume = volume;

    if (video.src !== activeMediaUrl) {
      video.src = activeMediaUrl;
      video.load();
    }

    if (isPlaying) {
      const playTimeout = setTimeout(() => {
        video.play().catch((err) => {
          if (err.name !== "AbortError") console.error("Playback failed:", err);
        });
      }, 10);
      return () => clearTimeout(playTimeout);
    } else {
      video.pause();
    }
  }, [isPlaying, activeMediaUrl, volume]);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPlaying(!isPlaying);
  };

  const handleEnded = () => {
    if (isRepeat && mediaRef.current) {
      mediaRef.current.currentTime = 0;
      mediaRef.current.play();
    } else {
      playNext();
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    setCurrentTime(time);
    if (mediaRef.current) mediaRef.current.currentTime = time;
  };

  // Handler Placeholder Actions
  const handleToggleSubscribe = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSubscribed(!isSubscribed);
    // TODO: Connect with backend user/artist subscription routing
  };
  const fetchComments = async () => {
  if (!currentSong) return;

  const { data, error } = await supabase
    .from("comments")
    .select(`
      id,
      comment,
      created_at,
      profiles (
        username
      )
    `)
    .eq("song_id", currentSong.id)
    .order("created_at", { ascending: true });

  if (error) {
    console.error(error);
    return;
  }

  setComments(data || []);
};

  const handleSendComment = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!commentInput.trim() || !currentSong) return;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    alert("Please login first.");
    return;
  }

  const { error } = await supabase.from("comments").insert({
    song_id: currentSong.id,
    user_id: user.id,
    comment: commentInput.trim(),
  });

  if (error) {
    console.log("COMMENT ERROR:", error);
    if (error.code === "23503") {
      alert("Comment submission failed: Account record setup incomplete. Please ensure your profile is fully initialized.");
    } else {
      alert(error.message);
    }
    return;
  }

  setCommentInput("");
  fetchComments();
};



  // Safe client-side Blob media downloader function
  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation(); 
    if (!activeMediaUrl) return;

    try {
      const response = await fetch(activeMediaUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.href = blobUrl;
      
      // Fallback file name formatting using track name
      const fileName = `${currentSong.title.replace(/\s+/g, "_")}_Zabus.mp4`; 
      link.download = fileName;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Download failed, falling back to new tab window opening:", error);
      window.open(activeMediaUrl, "_blank");
    }
  };

  if (!currentSong || !mounted) return null;

  return createPortal(
    <div className="relative">
      <AnimatePresence>
        {(isExpanded && !isMiniPlayer) && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-[99999990] flex flex-col h-screen w-screen overflow-hidden pb-24 md:pb-28"
          >
            {/* Header */}
            <div className="h-16 px-4 md:px-6 flex items-center justify-between bg-zinc-950 border-b border-white/5 flex-shrink-0">
              <span className="text-orange-500 font-black italic tracking-tighter uppercase text-sm md:text-base">ZABUS</span>
              <button 
                onClick={() => setIsExpanded(false)} 
                className="bg-white/10 px-3 py-1.5 rounded-full text-white text-[10px] md:text-xs font-bold uppercase flex items-center gap-2 hover:bg-orange-500 transition-colors"
              >
                Minimize <X size={16} />
              </button>
            </div>
            
            {/* Content Container Frame */}
            <div className="flex-1 flex flex-col lg:flex-row p-4 md:p-6 lg:p-8 gap-6 overflow-hidden min-h-0">
                {/* Visualizer Video Section */}
                <div className="w-full lg:flex-[3] aspect-video rounded-2xl md:rounded-3xl flex items-center justify-center bg-zinc-950/50 border border-white/5 overflow-hidden max-h-[35vh] sm:max-h-[45vh] lg:max-h-full self-center">
                   {isLoading && (
                     <div className="flex flex-col items-center gap-4">
                        <Loader2 className="animate-spin text-orange-500 w-12 h-12" />
                        <span className="text-white/50 font-black uppercase tracking-widest text-[10px] animate-pulse">loading...</span>
                     </div>
                   )}
                </div>
                
                {/* Details and Info Context Frame */}
                <div className="flex-1 flex flex-col gap-4 min-w-[300px] lg:max-w-[450px] h-full overflow-hidden">
                  <div className="bg-zinc-900/80 p-4 md:p-6 rounded-2xl md:rounded-3xl border border-white/5 flex justify-between items-center flex-shrink-0">
                    <div className="truncate pr-4">
                      <h2 className={`text-xl md:text-2xl font-black italic uppercase truncate ${isLoading ? 'animate-pulse text-zinc-600' : 'text-white'}`}>
                        {isLoading ? "Assembling Track..." : currentSong.title}
                      </h2>
                      <p className="text-orange-500 font-bold uppercase text-[10px] md:text-xs tracking-widest">{currentSong.artist_name}</p>
                    </div>

                    <div className="flex gap-4 border-l border-white/10 pl-4 flex-shrink-0">
                      <div className="flex flex-col items-center">
                        <div className="flex items-center gap-1.5 text-zinc-400">
                          <Eye size={16} className="md:size-[18px]" />
                          <span className="font-black text-xs md:text-sm">{(currentSong.views || 0).toLocaleString()}</span>
                        </div>
                        <span className="text-[7px] md:text-[8px] text-zinc-500 uppercase font-bold tracking-tighter">Views</span>
                      </div>

                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLike(currentSong.id, currentSong.likes || 0);
                        }}
                        className="flex flex-col items-center group"
                      >
                        <div className="flex items-center gap-1.5 text-zinc-400 group-hover:text-red-500 transition-colors">
                          <Heart 
                            size={16} 
                            className={`md:size-[18px] group-active:scale-125 transition-transform ${
                              (currentSong.likes > 0) ? "fill-red-500 text-red-500" : ""
                            }`} 
                          />
                          <span className="font-black text-xs md:text-sm">{(currentSong.likes || 0).toLocaleString()}</span>
                        </div>
                        <span className="text-[7px] md:text-[8px] text-zinc-500 uppercase font-bold tracking-tighter">Likes</span>
                      </button>
                    </div>
                  </div>

                  {/* Comments Panel inside Expanded Player View */}
                  <div className="bg-zinc-900/40 p-4 rounded-2xl border border-white/5 flex-1 flex flex-col overflow-hidden min-h-0">
                    <div className="border-b border-white/5 pb-2 mb-2 flex justify-between items-center flex-shrink-0">
                      <span className="text-xs font-black tracking-widest text-zinc-400 uppercase">Comments</span>
                      <span className="text-[10px] text-zinc-500 bg-white/5 px-2 py-0.5 rounded-full">{comments.length} chats</span>
                    </div>

                    {/* Scrollable Comments List Container */}
                    <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2.5 mb-3 custom-scrollbar min-h-0">
                      {comments.map((comment) => (
                        <div key={comment.id} className="text-xs bg-white/5 p-2 rounded-xl border border-white/[0.02]">
                          <span className="font-bold text-orange-400 block mb-0.5">@{comment.profiles?.username || "anonymous"}</span>
                          <p className="text-zinc-300 leading-relaxed">{comment.comment}</p>
                        </div>
                      ))}
                    </div>

                    {/* Pinned Input Bar - Visible & Screen Safe */}
                    <form onSubmit={handleSendComment} className="flex gap-2 items-center bg-zinc-950 p-2 rounded-xl border border-white/10 flex-shrink-0">
                      <input 
                        type="text"
                        value={commentInput}
                        onChange={(e) => setCommentInput(e.target.value)}
                        placeholder="Add your public comment..."
                        className="bg-transparent border-none text-xs flex-1 px-2 py-1 text-white placeholder-zinc-600 focus:outline-none"
                      />
                      <button 
                        type="submit" 
                        className="p-1.5 bg-orange-500 hover:bg-orange-600 rounded-lg text-white transition-colors flex-shrink-0"
                      >
                        <Send size={12} />
                      </button>
                    </form>
                  </div>
                </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div 
        onClick={(e) => {
            if (isMiniPlayer) {
                setIsMiniPlayer(false);
                setIsExpanded(true);
            } else {
                togglePlay(e);
            }
        }}
        className={`fixed transition-all duration-500 ease-in-out cursor-pointer group shadow-2xl overflow-hidden ${
          isExpanded 
          ? isMiniPlayer 
            ? 'z-[99999995] bottom-24 right-4 md:right-8 w-64 md:w-80 aspect-video rounded-xl border border-white/20' 
            : 'z-[99999995] top-[80px] left-4 right-4 lg:left-[48px] lg:right-auto w-[calc(100%-32px)] lg:w-[calc(75%-72px)] h-auto aspect-video rounded-2xl md:rounded-3xl opacity-100' 
          : 'z-[-1] bottom-24 left-6 w-0 h-0 opacity-0 pointer-events-none'
        }`}
      >
        <video 
          ref={mediaRef}
          preload="auto"
          crossOrigin="anonymous" 
          onLoadedData={() => setIsLoading(false)}
          onPlaying={() => setIsLoading(false)} 
          onWaiting={() => setIsLoading(true)} 
          onTimeUpdate={() => setCurrentTime(mediaRef.current?.currentTime || 0)}
          onLoadedMetadata={() => setDuration(mediaRef.current?.duration || 0)}
          onEnded={handleEnded}
          className={`w-full h-full object-cover bg-transparent transition-opacity duration-500 ${isLoading ? 'opacity-30' : 'opacity-100'}`}
          playsInline
        />
        
        {isMiniPlayer && (
            <button 
                onClick={(e) => {
                    e.stopPropagation();
                    setIsMiniPlayer(false);
                    setIsExpanded(false);
                }}
                className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-orange-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all z-20"
            >
                <X size={14} />
            </button>
        )}

        {!isMiniPlayer && (
             <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 pointer-events-none">
                {isPlaying ? <Pause size={48} className="text-white/50" /> : <Play size={48} className="text-white/50" />}
             </div>
        )}
      </div>

      {/* Persistent Audio Bar */}
      <div className="fixed bottom-0 left-0 right-0 h-20 md:h-24 bg-black/95 border-t border-white/10 px-4 md:px-6 flex items-center justify-between z-[99999999] backdrop-blur-xl">
        <div className="flex items-center gap-3 md:gap-4 w-[30%] sm:w-[28%] md:w-[30%]">
          <div className="relative group flex-shrink-0">
            <img 
              src={currentSong.cover_url} 
              className={`h-10 w-10 md:h-12 md:w-12 rounded-lg object-cover border border-white/10 cursor-pointer transition-all duration-500 ${isLoading ? 'blur-sm scale-90' : 'blur-0 scale-100'}`} 
              onClick={() => {
                setIsMiniPlayer(false);
                setIsExpanded(true);
              }} 
            />
            {isLoading && <Loader2 size={16} className="absolute inset-0 m-auto animate-spin text-orange-500" />}
          </div>
          <div className="hidden sm:block truncate pr-2">
            <h4 className={`text-[10px] md:text-xs font-bold truncate ${isLoading ? 'animate-pulse text-zinc-500' : 'text-white'}`}>
              {isLoading ? "LOADING..." : currentSong.title}
            </h4>
            
            {/* Added Subscription Button Inline Layout */}
            <div className="flex items-center gap-2 mt-0.5 max-w-full">
              <p className="text-[8px] md:text-[10px] text-zinc-500 font-bold uppercase truncate max-w-[60%]">
                {currentSong.artist_name}
              </p>
              <button 
                onClick={handleToggleSubscribe}
                className={`text-[7px] md:text-[9px] px-2 py-0.5 rounded-full transition-all duration-300 flex-shrink-0 font-extrabold uppercase tracking-tight ${
                  isSubscribed 
                    ? 'bg-zinc-800 text-zinc-400 border border-white/5' 
                    : 'bg-orange-500 hover:bg-orange-600 text-white'
                }`}
              >
                {isSubscribed ? "Subscribed" : "Subscribe"}
              </button>
            </div>
          </div>
          
          {/* Quick Trigger to launch Full View Comments Area */}
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setIsMiniPlayer(false);
              setIsExpanded(true);
            }}
            className="text-zinc-500 hover:text-white transition-colors ml-1 hidden md:block flex-shrink-0"
            title="Open Tracker Details & Comments"
          >
            <MessageSquare size={15} />
          </button>
        </div>

        <div className="flex flex-col items-center gap-1 md:gap-2 w-[55%] sm:w-[50%] md:w-[40%]">
          <div className="flex items-center gap-4 md:gap-6">
            <Shuffle size={16} onClick={() => setIsShuffle(!isShuffle)} className={`cursor-pointer hidden sm:block ${isShuffle ? 'text-orange-500' : 'text-zinc-500 hover:text-white'}`} />
            <SkipBack onClick={playPrevious} className="text-zinc-400 hover:text-white cursor-pointer" size={18} />
            
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsPlaying(!isPlaying);
              }} 
              className="bg-white p-2 md:p-2.5 rounded-full hover:scale-110 active:scale-95 transition"
            >
              {isLoading ? (
                <Loader2 size={18} className="animate-spin text-black" />
              ) : isPlaying ? (
                <Pause fill="black" size={18} className="text-black"/>
              ) : (
                <Play fill="black" size={18} className="text-black ml-0.5"/>
              )}
            </button>

            <SkipForward onClick={playNext} className="text-zinc-400 hover:text-white cursor-pointer" size={18} />
            <Repeat size={16} onClick={() => setIsRepeat(!isRepeat)} className={`cursor-pointer hidden sm:block ${isRepeat ? 'text-orange-500' : 'text-zinc-500 hover:text-white'}`} />
          </div>
          
          <div className="relative w-full group flex items-center h-4">
            <input 
              type="range" min="0" max={duration || 0} value={currentTime} onChange={handleSeek}
              className="absolute w-full h-1 bg-zinc-800 rounded-full appearance-none cursor-pointer z-10 opacity-0 group-hover:opacity-100 transition-opacity"
            />
            <div className="absolute w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className={`h-full bg-orange-500 transition-all duration-100 ${isLoading ? 'animate-pulse opacity-50' : ''}`} 
                style={{ width: `${(currentTime / (duration || 1)) * 100}%` }} 
              />
            </div>
          </div>
        </div>

        <div className="w-[15%] sm:w-[22%] md:w-[30%] flex justify-end items-center gap-2 md:gap-4">
            {/* Added: Track Downloader Option Action */}
            <button 
                onClick={handleDownload}
                className="text-zinc-500 hover:text-white transition-colors"
                title="Download Track"
            >
                <Download size={18} />
            </button>

            <button 
                onClick={(e) => {
                    e.stopPropagation();
                    setIsMiniPlayer(!isMiniPlayer);
                }}
                className={`hidden md:block transition-colors ${isMiniPlayer ? 'text-orange-500' : 'text-zinc-500 hover:text-white'}`}
                title="Toggle Miniplayer"
            >
                <Maximize2 size={18} className="rotate-180" />
            </button>

            <div className="hidden md:flex items-center">
                <Volume2 size={18} className="text-zinc-500 mr-2" />
                <input type="range" min="0" max="1" step="0.01" value={volume} onChange={(e) => setVolume(Number(e.target.value))} className="w-16 lg:w-24 accent-orange-500 cursor-pointer" />
            </div>
            
            <button onClick={(e) => {
                e.stopPropagation();
                setIsMiniPlayer(false);
                setIsExpanded(true);
            }} className="md:hidden text-zinc-400">
                <Maximize2 size={18} />
            </button>
        </div>
      </div>
    </div>,
    document.body
  );
}