"use client";

import { CheckCircle2, Plus } from "lucide-react";

interface AddToPlaylistModalProps {
  open: boolean;
  playlists: any[];
  addedStatus: string | null;
  onAdd: (playlistId: string) => void;
  onClose: () => void;
}

export default function AddToPlaylistModal({
  open,
  playlists,
  addedStatus,
  onAdd,
  onClose,
}: AddToPlaylistModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-zinc-900 w-full max-w-md rounded-2xl p-6">
        <h2 className="text-lg font-bold mb-4 text-white">
          Add to playlist
        </h2>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {playlists.length === 0 && (
            <p className="text-zinc-400 text-sm">No playlists found</p>
          )}

          {playlists.map((playlist) => (
            <button
              key={playlist.id}
              onClick={() => onAdd(playlist.id)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition"
            >
              <span className="text-white">{playlist.title}</span>

              {addedStatus === playlist.id ? (
                <CheckCircle2 className="text-green-500" size={18} />
              ) : (
                <Plus className="text-orange-500" size={18} />
              )}
            </button>
          ))}
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full py-2 rounded-xl bg-zinc-700 hover:bg-zinc-600 text-white"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
