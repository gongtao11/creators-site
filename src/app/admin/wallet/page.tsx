"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { StableButton } from "@/components/layout/StableButton";
import { ArrowLeft, Wallet } from "lucide-react";
import type { Profile } from "@/types";

const DEFAULT_WALLETS: Record<string, string> = {
  BTC: "", ETH: "", "USDT-TRC20": "", "USDT-ERC20": "", BNB: "", SOL: "",
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
  return (
    <AuthGuard requireAdmin fallbackPath="/">
      <WalletContent />
    </AuthGuard>
  );
}

function WalletContent() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [wallets, setWallets] = useState<Record<string, string>>({ ...DEFAULT_WALLETS });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: { user } } = await (await import("@/lib/supabase")).supabase.auth.getUser();
        if (user && !cancelled) {
          const { data: p } = await (await import("@/lib/supabase")).supabase.from("profiles").select("*").eq("id", user.id).single();
          if (!cancelled) setProfile(p as Profile);
        }
        const res = await fetch("/api/admin/wallet");
        if (res.ok && !cancelled) {
          const d = await res.json();
          if (d.wallets && Object.keys(d.wallets).length > 0) {
            setWallets(prev => ({ ...prev, ...d.wallets }));
          }
        }
      } catch {}
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      for (const [key, value] of Object.entries(wallets)) {
        if (value.trim()) {
          await fetch("/api/admin/wallet", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ key, value: value.trim() }),
          });
        }
      }
      setSaved(true);
    } catch {}
    setSaving(false);
    setTimeout(() => setSaved(false), 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar user={null} />
        <div className="flex-1 flex items-center justify-center">
          <svg className="w-8 h-8 animate-spin text-pink-500" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
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
        <p className="text-zinc-500 text-sm mb-8">Users send payments to these addresses. USDT has separate TRC20 and ERC20 networks.</p>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl border p-6 space-y-5">
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
                  onChange={e => setWallets(prev => ({ ...prev, [crypto]: e.target.value }))}
                  placeholder={`Your ${WALLET_LABELS[crypto] || crypto} address`}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-pink-500/50"
                />
              </div>
            </div>
          ))}
          <StableButton onClick={handleSave} loading={saving} className="w-full">
            {saved ? "Saved!" : "Save Wallet Addresses"}
          </StableButton>
        </div>
      </main>
    </div>
  );
}
