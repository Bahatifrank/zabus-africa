"use client";

import { useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    loadTheme();
  }, []);

  async function loadTheme() {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Default dark
    document.documentElement.setAttribute("data-theme", "dark");
    
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("theme")
      .eq("id", user.id)
      .maybeSingle();

    const theme = profile?.theme || "dark";
    document.documentElement.setAttribute("data-theme", theme);
  }

  return <>{children}</>;
}