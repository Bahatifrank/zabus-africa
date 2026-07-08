"use client";

import { useParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { encrypt, decrypt } from "@/utils/encryption";
import Link from "next/link";
import { Send, ArrowLeft, Check, CheckCheck } from "lucide-react";

const supabase = createClient();

function timeAgo(date: string) {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function AvatarSmall({ src, name }: { src?: string | null; name: string }) {
  return (
    <div className="relative shrink-0 h-7 w-7">
      {src ? (
        <img src={src} className="h-7 w-7 rounded-full object-cover" alt={name} />
      ) : (
        <div className="h-7 w-7 rounded-full bg-orange-500 flex items-center justify-center font-black text-black text-xs">
          {name?.charAt(0)?.toUpperCase() || "?"}
        </div>
      )}
    </div>
  );
}

function AvatarLarge({ src, name, online }: { src?: string | null; name: string; online?: boolean }) {
  return (
    <div className="relative shrink-0 h-9 w-9">
      {src ? (
        <img src={src} className="h-9 w-9 rounded-full object-cover" alt={name} />
      ) : (
        <div className="h-9 w-9 rounded-full bg-orange-500 flex items-center justify-center font-black text-black text-sm">
          {name?.charAt(0)?.toUpperCase() || "?"}
        </div>
      )}
      {online && (
        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-black" />
      )}
    </div>
  );
}

export default function ConversationPage() {
  const { conversationId } = useParams();
  const id = Array.isArray(conversationId) ? conversationId[0] : conversationId;

  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [user, setUser] = useState<any>(null);
  const [artistName, setArtistName] = useState("Conversation");
  const [otherAvatar, setOtherAvatar] = useState<string | null>(null);
  const [myAvatar, setMyAvatar] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOtherOnline, setIsOtherOnline] = useState(false);
  const [otherLastSeen, setOtherLastSeen] = useState<string | null>(null);
  const [otherIsTyping, setOtherIsTyping] = useState(false);
  const [seenAt, setSeenAt] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const presenceChannelRef = useRef<any>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

  useEffect(() => { init(); }, [id]);

  async function init() {
    setLoading(true);
    const { data: { user: authUser } } = await supabase.auth.getUser();
    setUser(authUser);

    if (authUser && id) {
      const { data: myProfile } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("id", authUser.id)
        .maybeSingle();
      if (myProfile?.avatar_url) setMyAvatar(myProfile.avatar_url);

      const otherId = await loadOtherParticipant(authUser.id);
      await loadMessages();
      if (otherId) setupPresence(authUser.id, otherId);
    }
    setLoading(false);
  }

  async function loadOtherParticipant(myId: string): Promise<string | null> {
    const { data: members } = await supabase
      .from("conversation_members")
      .select("user_id")
      .eq("conversation_id", id);

    const other = members?.find((m) => m.user_id !== myId);
    if (!other) return null;

    const { data: song } = await supabase
      .from("songs")
      .select("artist_name")
      .eq("user_id", other.user_id)
      .limit(1)
      .maybeSingle();

    const { data: profile } = await supabase
      .from("profiles")
      .select("avatar_url, username, email")
      .eq("id", other.user_id)
      .maybeSingle();

    if (profile?.avatar_url) setOtherAvatar(profile.avatar_url);

    const name = song?.artist_name || profile?.username || profile?.email || "Unknown User";
    setArtistName(name);

    return other.user_id;
  }

  function setupPresence(myId: string, otherId: string) {
    if (presenceChannelRef.current) supabase.removeChannel(presenceChannelRef.current);

    const channel = supabase.channel(`presence-${id}`, {
      config: { presence: { key: myId } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const otherPresence = (state as any)[otherId];
        if (otherPresence?.length > 0) {
          const data = otherPresence[0] as any;
          setIsOtherOnline(true);
          setOtherIsTyping(data.typing === true);
          setOtherLastSeen(null);
          setSeenAt(new Date().toISOString());
        } else {
          setIsOtherOnline(false);
          setOtherIsTyping(false);
        }
      })
      .on("presence", { event: "join" }, ({ key }: any) => {
        if (key === otherId) {
          setIsOtherOnline(true);
          setSeenAt(new Date().toISOString());
        }
      })
      .on("presence", { event: "leave" }, ({ key, leftPresences }: any) => {
        if (key === otherId) {
          setTimeout(() => {
            const currentState = channel.presenceState();
            if (!(currentState as any)[otherId]) {
              setIsOtherOnline(false);
              setOtherIsTyping(false);
              const left = leftPresences?.[0] as any;
              if (left?.last_seen) {
                setOtherLastSeen(left.last_seen);
                setSeenAt(left.last_seen);
              }
            }
          }, 1500);
        }
      })
      .subscribe(async (status: string) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ user_id: myId, typing: false, last_seen: new Date().toISOString() });
        }
      });

    presenceChannelRef.current = channel;
  }

  async function handleTyping(value: string) {
    setText(value);
    if (!presenceChannelRef.current || !user) return;
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (value.length > 0) {
      await presenceChannelRef.current.track({ user_id: user.id, typing: true, last_seen: new Date().toISOString() });
      typingTimeoutRef.current = setTimeout(async () => {
        await presenceChannelRef.current?.track({ user_id: user.id, typing: false, last_seen: new Date().toISOString() });
      }, 2000);
    } else {
      await presenceChannelRef.current.track({ user_id: user.id, typing: false, last_seen: new Date().toISOString() });
    }
  }

  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`conversation-${id}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "messages",
        filter: `conversation_id=eq.${id}`,
      }, () => loadMessages())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (presenceChannelRef.current) supabase.removeChannel(presenceChannelRef.current);
    };
  }, [id]);

  useEffect(() => { scrollToBottom(); }, [messages, otherIsTyping]);

  async function loadMessages() {
    if (!id) return;
    const { data, error } = await supabase
      .from("messages").select("*")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true });
    if (error) { console.error("loadMessages error:", error); return; }

    const decrypted = (data || []).map((m: any) => ({ ...m, message: decrypt(m.message) }));

    setMessages((prev) => {
      const optimistic = prev.filter((m) => m.id.startsWith("temp-"));
      const dbTimes = new Set(decrypted.map((m: any) => new Date(m.created_at).toISOString().slice(0, 16)));
      const stillPending = optimistic.filter((m) => !dbTimes.has(new Date(m.created_at).toISOString().slice(0, 16)));
      return [...decrypted, ...stillPending];
    });
  }

  async function sendMessage() {
    if (!text.trim() || !user || !id) return;
    const messageText = text.trim();
    setText("");

    await presenceChannelRef.current?.track({ user_id: user.id, typing: false, last_seen: new Date().toISOString() });

    const tempId = `temp-${Date.now()}`;
    setMessages((prev) => [...prev, {
      id: tempId, conversation_id: id, sender_id: user.id,
      message: messageText, created_at: new Date().toISOString(),
    }]);

    const { error } = await supabase.from("messages").insert({
      conversation_id: id, sender_id: user.id, message: encrypt(messageText),
    });

    if (error) {
      console.error("sendMessage error:", error);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      alert("Failed to send: " + error.message);
    }
  }

  return (
    <div className="absolute inset-0 bg-black text-white flex flex-col overflow-hidden z-10">
      {/* Header */}
      <div className="h-16 border-b border-zinc-900 flex items-center px-4 sm:px-6 shrink-0 gap-3 bg-zinc-950">
        <Link href="/inbox" className="md:hidden text-zinc-400 hover:text-white">
          <ArrowLeft size={20} />
        </Link>
        <AvatarLarge src={otherAvatar} name={artistName} online={isOtherOnline} />
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-black uppercase tracking-widest text-zinc-200 truncate leading-tight">
            {artistName}
          </span>
          <span className="text-[10px] leading-tight">
            {otherIsTyping ? (
              <span className="text-orange-400 animate-pulse">typing...</span>
            ) : isOtherOnline ? (
              <span className="text-green-500">Online</span>
            ) : otherLastSeen ? (
              <span className="text-zinc-500">Last seen {timeAgo(otherLastSeen)}</span>
            ) : (
              <span className="text-zinc-600">Offline</span>
            )}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-6 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center h-full text-zinc-500 text-sm">
            Loading messages...
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-zinc-500">No messages yet. Say hi 👋</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.sender_id === user?.id;
            const isTemp = msg.id.startsWith("temp-");
            const isLastMine = isMe && index === messages
              .map((m, i) => m.sender_id === user?.id ? i : -1)
              .filter(i => i >= 0).slice(-1)[0];
            const isSeen = isLastMine && seenAt && new Date(seenAt) > new Date(msg.created_at);

            return (
              <div key={msg.id} className={`flex items-end gap-2 ${isMe ? "justify-end" : "justify-start"}`}>
                {!isMe && <AvatarSmall src={otherAvatar} name={artistName} />}
                <div className={`max-w-[75%] sm:max-w-md px-4 py-2.5 rounded-2xl text-sm ${
                  isMe ? "bg-orange-500 text-black rounded-br-sm" : "bg-zinc-800 text-white rounded-bl-sm"
                }`}>
                  <p>{msg.message}</p>
                  <div className={`flex items-center gap-1 mt-1 ${isMe ? "justify-end" : "justify-start"}`}>
                    <p className={`text-[10px] ${isMe ? "text-black/50" : "text-zinc-500"}`}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                    {isMe && (
                      isTemp
                        ? <Check size={12} className="text-black/30" />
                        : isSeen
                          ? <CheckCheck size={12} className="text-blue-900" />
                          : <Check size={12} className="text-black/50" />
                    )}
                  </div>
                </div>
                {isMe && <AvatarSmall src={myAvatar} name={user?.email || "Me"} />}
              </div>
            );
          })
        )}

        {otherIsTyping && (
          <div className="flex items-end gap-2 justify-start">
            <AvatarSmall src={otherAvatar} name={artistName} />
            <div className="bg-zinc-800 px-4 py-3 rounded-2xl rounded-bl-sm flex gap-1 items-center">
              <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-zinc-900 p-4 shrink-0 bg-zinc-950/40">
        <div className="flex gap-3 items-center">
          <input
            value={text}
            onChange={(e) => handleTyping(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") sendMessage(); }}
            placeholder="Type your message..."
            className="flex-1 min-w-0 bg-zinc-900 border border-zinc-800 focus:border-orange-500 rounded-xl px-4 py-3 outline-none text-sm text-white placeholder-zinc-500"
          />
          <button
            onClick={sendMessage}
            disabled={!text.trim()}
            className="bg-orange-500 hover:bg-orange-600 disabled:opacity-40 h-11 w-11 flex items-center justify-center rounded-xl text-black shrink-0"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}