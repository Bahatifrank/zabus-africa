"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const supabase = createClient();
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    // .toLowerCase() is critical here to match your database records
    const { error } = await supabase.auth.signUp({
      email: email.toLowerCase().trim(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Check your email for the confirmation link!");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-white">
      <div className="w-full max-w-md bg-[#0a0a0a] border border-white/5 p-10 rounded-[3rem] shadow-2xl">
        <h1 className="text-4xl font-black italic uppercase tracking-tighter mb-2 text-center">Join Zabus</h1>
        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest text-center mb-8">Create an account to start your library</p>

        <form onSubmit={handleSignUp} className="space-y-4">
          <input
            type="email"
            placeholder="Email Address"
            // Removed 'uppercase' class so users can see what they are typing properly
            className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl focus:outline-none focus:border-orange-500 transition-all font-bold text-sm text-white"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            // Removed 'uppercase' class to prevent password character confusion
            className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl focus:outline-none focus:border-orange-500 transition-all font-bold text-sm text-white"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            disabled={loading}
            className="w-full bg-orange-500 text-black font-black py-4 rounded-2xl uppercase tracking-widest text-xs hover:scale-[1.02] transition-all disabled:opacity-50 shadow-lg shadow-orange-500/20"
          >
            {loading ? "CREATING..." : "CREATE ACCOUNT"}
          </button>
        </form>

        {message && (
          <p className="mt-6 text-orange-500 text-[10px] font-black uppercase text-center bg-orange-500/10 py-2 rounded-lg">
            {message}
          </p>
        )}

        <p className="mt-8 text-center text-zinc-500 text-[10px] font-black uppercase tracking-widest">
          Already have an account?{" "}
          <Link href="/login" className="text-white hover:text-orange-500 underline underline-offset-4">SIGN IN</Link>
        </p>
      </div>
    </div>
  );
}