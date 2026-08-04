"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Mail, Lock, User, Loader2, CheckCircle } from "lucide-react";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, username }),
      });
      const result = await res.json();
      if (!res.ok) {
        // If user already exists, try direct login
        if (result.error && result.error.includes("already been registered")) {
          const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
          if (loginError) throw new Error("This email is already registered. Try logging in instead.");
          window.location.href = "/?welcome=1";
          return;
        }
        throw new Error(result.error || "Registration failed");
      }

      // Auto-login after registration
      const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
      if (loginError) throw loginError;

      setSuccess(true);
      setTimeout(() => { window.location.href = "/?welcome=1"; }, 1000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <CheckCircle className="w-16 h-16 text-green-500" />
        <h1 className="text-xl font-bold">Account Created!</h1>
        <p className="text-zinc-500">Redirecting...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-lg border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center">
          <Link href="/" className="font-bold text-lg bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">Exclusive</Link>
        </div>
      </nav>
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">Create Account</h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm">Join and unlock exclusive content</p>
          </div>
          <form onSubmit={handleRegister} className="space-y-4">
            {error && <div className="bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 text-sm p-3 rounded-xl">{error}</div>}
            <div>
              <label className="block text-sm font-medium mb-1.5 text-zinc-700 dark:text-zinc-300">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input type="text" value={username} onChange={e => setUsername(e.target.value)} required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/50" placeholder="your_username" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-zinc-700 dark:text-zinc-300">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/50" placeholder="you@example.com" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-zinc-700 dark:text-zinc-300">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/50" placeholder="Min 6 characters" />
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-2.5 rounded-full font-semibold text-white bg-gradient-to-r from-pink-500 to-rose-500 hover:shadow-lg hover:shadow-pink-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{loading ? "Creating account..." : "Create Account"}</span>
            </button>
          </form>
          <p className="text-center text-sm text-zinc-500 dark:text-zinc-400 mt-6">
            Already have an account?{" "}<Link href="/login" className="text-pink-500 hover:text-pink-600 font-medium">Sign In</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
