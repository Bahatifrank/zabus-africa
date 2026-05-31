"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorStatus, setErrorStatus] = useState(false); // New state for error UI
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorStatus(false); // Reset error state on new attempt
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setLoading(false);
      setErrorStatus(true); // Trigger the red button
      
      // Reset the button back to orange after 3 seconds
      setTimeout(() => {
        setErrorStatus(false);
      }, 3000);
      return;
    }

    if (data.session) {
      if (email === "your-admin-email@gmail.com") {
        window.location.href = "/admin/dashboard";
      } else {
        window.location.href = "/playlists";
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-black p-4">
      <div className="w-full max-w-md bg-zinc-900 p-10 rounded-[2.5rem] border border-zinc-800 shadow-2xl">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-orange-500 italic tracking-tighter">
            ZABUS<span className="text-white">.AFRICA</span>
          </h1>
          <p className="text-zinc-500 text-[10px] mt-2 font-black uppercase tracking-widest">
            Welcome Back to the Sound
          </p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-[10px] font-black text-zinc-400 uppercase mb-2 ml-1 tracking-widest">
              Email Address
            </label>
            <input 
              type="email" 
              className={`w-full bg-black border p-4 rounded-2xl text-white outline-none transition font-medium ${
                errorStatus ? 'border-red-500' : 'border-zinc-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500'
              }`}
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-zinc-400 uppercase mb-2 ml-1 tracking-widest">
              Password
            </label>
            <input 
              type="password" 
              className={`w-full bg-black border p-4 rounded-2xl text-white outline-none transition font-medium ${
                errorStatus ? 'border-red-500' : 'border-zinc-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500'
              }`}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button 
            disabled={loading}
            className={`w-full font-black py-4 rounded-2xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg uppercase text-xs tracking-widest ${
              errorStatus 
                ? "bg-red-600 text-white animate-shake shadow-red-500/20" 
                : "bg-orange-500 hover:bg-orange-400 text-black shadow-orange-500/20"
            }`}
          >
            {loading ? "AUTHENTICATING..." : errorStatus ? "WRONG CREDENTIALS" : "SIGN IN"}
          </button>
        </form>

        <div className="mt-10 text-center border-t border-white/5 pt-8">
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">
            New to Zabus?{" "}
            <Link 
              href="/signup" 
              className="text-white hover:text-orange-500 underline underline-offset-4 transition-colors ml-1"
            >
              Create an Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}