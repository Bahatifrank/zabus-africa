"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { decrypt } from "@/utils/encryption";
import { MessageCircle, Loader2, User } from "lucide-react";

const supabase = createClient();

type ConversationRow = {
  id: string;
  otherUserId: string | null;
  artistName: string;
  avatarUrl: string | null;
  lastMessage: string;
  lastMessageAt: string | null;
};

export default function InboxPage() {
  const params = useParams();
  const activeId = params?.conversationId as string | undefined;

  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<ConversationRow[]>([]);

  useEffect(() => {
    loadConversations();
  }, []);

  async function loadConversations() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data: myMemberships } = await supabase
      .from("conversation_members")
      .select("conversation_id")
      .eq("user_id", user.id);

    if (!myMemberships || myMemberships.length === 0) { setLoading(false); return; }

    const conversationIds = myMemberships.map((m) => m.conversation_id);

    const { data: allMembers } = await supabase
      .from("conversation_members")
      .select("conversation_id, user_id")
      .in("conversation_id", conversationIds);

    const otherUserByConvo: Record<string, string> = {};
    (allMembers || []).forEach((m) => {
      if (m.user_id !== user.id) otherUserByConvo[m.conversation_id] = m.user_id;
    });

    const otherUserIds = Array.from(new Set(Object.values(otherUserByConvo)));

    const artistNameByUserId: Record<string, string> = {};
    const avatarByUserId: Record<string, string> = {};

    if (otherUserIds.length > 0) {
      // Try songs first for artist name
      const { data: songRows } = await supabase
        .from("songs")
        .select("user_id, artist_name")
        .in("user_id", otherUserIds);

      (songRows || []).forEach((s) => {
        if (s.user_id && !artistNameByUserId[s.user_id])
          artistNameByUserId[s.user_id] = s.artist_name;
      });

      // Fetch profiles for avatar + username/email fallback
      const { data: profileRows } = await supabase
        .from("profiles")
        .select("id, avatar_url, username, email")
        .in("id", otherUserIds);

      (profileRows || []).forEach((p) => {
        if (p.avatar_url) avatarByUserId[p.id] = p.avatar_url;
        // Fallback name if no song found
        if (!artistNameByUserId[p.id]) {
          artistNameByUserId[p.id] = p.username || p.email || "Unknown User";
        }
      });
    }

    const { data: lastMessages } = await supabase
      .from("messages")
      .select("conversation_id, message, created_at")
      .in("conversation_id", conversationIds)
      .order("created_at", { ascending: false });

    const lastMessageByConvo: Record<string, { message: string; created_at: string }> = {};
    (lastMessages || []).forEach((m) => {
      if (!lastMessageByConvo[m.conversation_id]) lastMessageByConvo[m.conversation_id] = m;
    });

    const rows: ConversationRow[] = conversationIds.map((id) => {
      const otherUserId = otherUserByConvo[id] || null;
      const artistName = otherUserId
        ? artistNameByUserId[otherUserId] || "Unknown User"
        : "Unknown User";
      const last = lastMessageByConvo[id];

      return {
        id,
        otherUserId,
        artistName,
        avatarUrl: otherUserId ? avatarByUserId[otherUserId] || null : null,
        lastMessage: last?.message ? decrypt(last.message) : "No messages yet",
        lastMessageAt: last?.created_at || null,
      };
    });

    rows.sort((a, b) => {
      if (!a.lastMessageAt) return 1;
      if (!b.lastMessageAt) return -1;
      return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
    });

    setConversations(rows);
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="animate-spin text-orange-500" size={40} />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-64px)] w-full bg-black text-white flex overflow-hidden min-h-0">
      <div className="w-full md:w-[340px] border-r border-zinc-800 flex flex-col h-full min-h-0 shrink-0">
        <div className="border-b border-white/5 px-6 py-5 shrink-0">
          <h1 className="text-3xl font-black italic uppercase tracking-tight">Inbox</h1>
          <p className="text-zinc-500 text-xs uppercase mt-2 tracking-widest">Private conversations</p>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-2">
          {conversations.length === 0 && (
            <div className="text-center mt-12 px-4">
              <MessageCircle className="mx-auto text-zinc-700 mb-4" size={48} />
              <h2 className="font-black uppercase text-sm">No Conversations</h2>
              <p className="text-zinc-500 text-xs mt-1">Start chatting with an artist.</p>
            </div>
          )}

          {conversations.map((c) => {
            const isActive = c.id === activeId;
            return (
              <Link key={c.id} href={`/inbox/${c.id}`} className="block">
                <div className={`rounded-xl border p-3.5 transition ${
                  isActive ? "bg-zinc-900 border-orange-500/40" : "bg-zinc-900/60 border-white/5 hover:bg-zinc-800"
                }`}>
                  <div className="flex items-center gap-3">
                    {c.avatarUrl ? (
                      <img
                        src={c.avatarUrl}
                        className="h-9 w-9 rounded-full object-cover shrink-0 border border-white/10"
                        alt={c.artistName}
                      />
                    ) : (
                      <div className="h-9 w-9 rounded-full bg-orange-500 flex items-center justify-center font-black text-black text-sm shrink-0">
                        {c.artistName?.charAt(0)?.toUpperCase() || <User size={14} />}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h2 className="font-bold text-sm truncate">{c.artistName}</h2>
                      <p className="text-zinc-500 text-xs truncate mt-0.5">{c.lastMessage}</p>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="hidden md:flex flex-1 items-center justify-center bg-zinc-950">
        <div className="text-center">
          <h2 className="text-2xl font-black text-white">Select a conversation</h2>
          <p className="text-zinc-500 mt-3">Your messages will appear here.</p>
        </div>
      </div>
    </div>
  );
}