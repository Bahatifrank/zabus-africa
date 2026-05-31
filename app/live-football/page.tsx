"use client";

import React, { useEffect, useState } from "react";
import { Clock, Trophy } from "lucide-react";

type Match = {
  id: number;
  home: string;
  away: string;
  league: string;
  time: string;
  score: string;
  status: string;
};

export default function LiveFootballPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const res = await fetch("/api/matches");
        const data = await res.json();

        const formatted: Match[] = (data.response || []).map((match: any) => ({
          id: match.fixture.id,
          home: match.teams.home.name,
          away: match.teams.away.name,
          league: match.league.name,
          time: match.fixture.status.elapsed
            ? `${match.fixture.status.elapsed}'`
            : match.fixture.status.long,
          score: `${match.goals.home ?? 0} - ${match.goals.away ?? 0}`,
          status: match.fixture.status.short,
        }));

        setMatches(formatted);
      } catch (err) {
        console.error("Error fetching matches:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-6 lg:p-10 pb-32">
      {/* HEADER */}
      <header className="flex justify-between items-center mb-10">
        <h1 className="text-4xl font-bold"> Live Matches</h1>
      </header>

      {/* CONTENT */}
      {loading ? (
        <p className="text-gray-400">Loading matches...</p>
      ) : matches.length === 0 ? (
        <p className="text-gray-400">No live matches right now</p>
      ) : (
        <div className="space-y-4">
          {matches.map((match) => (
            <div
              key={match.id}
              className="p-4 border border-white/10 rounded-xl bg-white/5 hover:bg-white/10 transition"
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-400 flex items-center gap-1">
                    <Trophy className="w-4 h-4" />
                    {match.league}
                  </p>
                  <h2 className="text-lg font-bold">
                    {match.home} vs {match.away}
                  </h2>
                </div>

                <div className="text-right">
                  <p className="text-xl font-bold">{match.score}</p>
                  <p className="text-sm text-gray-400 flex items-center gap-1 justify-end">
                    <Clock className="w-4 h-4" />
                    {match.time}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}