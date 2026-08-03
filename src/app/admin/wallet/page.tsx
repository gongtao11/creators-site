"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Navbar } from "@/components/layout/Navbar";
import { ArrowLeft, Save, Wallet, Loader2, CheckCircle } from "lucide-react";
import type { Profile } from "@/types";

const DEFAULT_WALLETS: Record<string, string> = {
  BTC: "",
  ETH: "",
  "USDT-TRC20": "",
  "USDT-ERC20": "",
  BNB: "",
  SOL: "",
};

const WALLET_LABELS: Record<string, string> = {
  BTC: "Bitcoin (BTC)",
  ETH: "Ethereum (ETH)",
  "USDT-TRC20": "USDT-TRC20 (TRON network)",
  "USDT-ERC20": "USDT-ERC20 (Ethereum network)",
  BNB: "Binance Coin (BNB / BSC)",
  SOL: "Solana (SOL)",
};

export default function AdminWalletPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [wallets, setWallets] = useState<Record<string, string>>({ ...DEFAULT_WALLETS });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = "/login"; return; }
      const { data: p } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (!(p as Profile)?.is_admin) { window.location.href = "/"; return; }
      setProfile(p as Profile);

      try {
        const res = await fetch("/api/admin/wallet");
        if (res.ok) {
          const d = await res.json();
          if (d.wallets && Object.keys(d.wallets).length > 0) {
            setWallets(prev => ({ ...prev, ...d.wallets }));
          }
        }
      } catch { }
      setLoading(false);
    }
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    for (const [key, value] of Object.entries(wallets)) {
      if (value.trim()) {
        await fetch("/api/admin/wallet", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key, value: value.trim() }),
        });
      }
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={profile ? { id: profile.id, username: profile.username, isAdmin: profile.is_admin } : null} />
      <main className="flex-1 max-w-2xl mx-auto px-4 py-8 w-full">
        <Link href="/admin" className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 mb-4">
          <ArrowLeft className="w-3 h-3" /> Admin
        </Link>

        <h1 className="text-2xl font-bold mb-2">Crypto Wallet Settings</h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-8">
          Users will send crypto payments to these addresses. USDT has two networks - fill one or both.
        </p>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-5">
          {Object.entries(wallets).map(([crypto, address]) => (
            <div key={crypto}>
              <label className="block text-sm font-medium mb-1.5 text-zinc-700 dark:text-zinc-300">
                {WALLET_LABELS[crypto] || crypto}
              </label>
              <div className="relative">
                <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setWallets({ ...wallets, [crypto]: e.target.value })}
                  placeholder={`Your ${WALLET_LABELS[crypto] || crypto} address`}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-pink-500/50"
                />
              </div>
            </div>
          ))}

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 rounded-full font-medium text-white bg-gradient-to-r from-pink-500 to-rose-500 hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saved ? "Saved!" : "Save Wallet Addresses"}
          </button>
        </div>
      </main>
    </div>
  );
}
