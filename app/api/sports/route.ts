import { NextRequest, NextResponse } from "next/server";

const BASE = "https://www.thesportsdb.com/api/v1/json/123";

// Major league IDs
const LEAGUE_IDS = {
  soccer: [4328, 4480, 4335, 4331, 4332, 4334, 4399, 4502], 
  // EPL, UCL, La Liga, Bundesliga, Serie A, Ligue 1, World Cup, CAF
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sport = searchParams.get("slug") || "soccer";
  const today = new Date().toISOString().split("T")[0];

  try {
    // Fetch today's events by sport
    const todayRes = await fetch(
      `${BASE}/eventsday.php?d=${today}&s=Soccer`,
      { cache: "no-store" }
    );
    const todayData = await todayRes.json();
    const todayEvents = todayData?.events || [];

    // Fetch next events from top leagues
    const leagueIds = LEAGUE_IDS[sport as keyof typeof LEAGUE_IDS] || LEAGUE_IDS.soccer;
    const upcomingPromises = leagueIds.slice(0, 4).map((id) =>
      fetch(`${BASE}/eventsnextleague.php?id=${id}`, { cache: "no-store" })
        .then((r) => r.json())
        .then((d) => d?.events || [])
        .catch(() => [])
    );
    const upcomingArrays = await Promise.all(upcomingPromises);
    const upcomingEvents = upcomingArrays.flat();

    // Merge and deduplicate by idEvent
    const allEvents = [...todayEvents, ...upcomingEvents];
    const seen = new Set();
    const unique = allEvents.filter((e: any) => {
      if (seen.has(e.idEvent)) return false;
      seen.add(e.idEvent);
      return true;
    });

    // Normalize to our match shape
    const matches = unique.map((e: any) => ({
      match_id: e.idEvent,
      team_one_name: e.strHomeTeam,
      team_two_name: e.strAwayTeam,
      team_one_badge: e.strHomeTeamBadge || e.strThumb || null,
      team_two_badge: e.strAwayTeamBadge || null,
      league_name: e.strLeague,
      league_badge: e.strLeagueBadge || null,
      venue: e.strVenue || null,
      start_time: `${e.dateEvent}T${e.strTime || "00:00:00"}`,
      score: e.intHomeScore !== null && e.intAwayScore !== null
        ? `${e.intHomeScore}:${e.intAwayScore}`
        : null,
      status: e.strStatus || null,
      thumb: e.strThumb || null,
      iframe_source: null,
      m3u8_source: null,
    }));

    // Sort by start time
    matches.sort((a: any, b: any) =>
      new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    );

    console.log(`Returning ${matches.length} matches`);
    return NextResponse.json(matches);

  } catch (e: any) {
    console.error("Sports route error:", e.message);
    return NextResponse.json([]);
  }
}