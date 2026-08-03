"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Navbar } from "@/components/layout/Navbar";
import { ArrowLeft, Lock, Loader2, Wallet, Copy, ArrowRight } from "lucide-react";
import type { Profile } from "@/types";

interface Album { id: string; title: string; description?: string; type: string; cover_url?: string; price?: number; is_published: boolean; }
interface AlbumImage { id: string; url: string; sort_order: number; }

export default function AlbumPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [album, setAlbum] = useState<Album | null>(null);
  const [images, setImages] = useState<AlbumImage[]>([]);
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [showPay, setShowPay] = useState(false);
  const [wallets, setWallets] = useState<Record<string, string>>({});
  const [selectedCrypto, setSelectedCrypto] = useState("USDT");
  const [txHash, setTxHash] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [payMessage, setPayMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Get user
        const { data: { user } } = await supabase.auth.getUser();
        if (user && !cancelled) {
          setUserId(user.id);
          setUserEmail(user.email || "");
          const { data: pd } = await supabase.from("profiles").select("*").eq("id", user.id).single();
          if (!cancelled) setProfile(pd as Profile);
        }

        // Load album via API (works with anon key since RLS is off)
        const albumRes = await fetch(`/api/admin/albums`);
        if (!albumRes.ok) throw new Error("Failed to load album");
        const albumData = await albumRes.json();
        const found = (albumData.albums || []).find((a: Album) => a.id === id);
        if (!cancelled) {
          if (!found) { setLoadError("Album not found"); setLoading(false); return; }
          setAlbum(found);
          if (!found.price) setHasAccess(true);
        }

        // Check purchase
        if (user && found && found.price) {
          const purchasesRes = await fetch(`/api/admin/verify-purchase`);
          if (purchasesRes.ok) {
            const purData = await purchasesRes.json();
            const bought = (purData.purchases || []).some(
              (p: any) => p.user_id === user.id && p.content_id === id && p.status === "active"
            );
            if (!cancelled && bought) setHasAccess(true);
          }
        }

        // Load images via API
        const imgRes = await fetch(`/api/admin/album-images?album_id=${id}`);
        if (imgRes.ok) {
          const imgData = await imgRes.json();
          if (!cancelled) setImages(imgData.images || []);
        }

        // Load wallets
        try {
          const wRes = await fetch("/api/admin/wallet");
          if (wRes.ok) { const d = await wRes.json(); if (!cancelled && d.wallets) setWallets(d.wallets); }
        } catch {}

      } catch (err: unknown) {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : "Load failed");
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [id]);

  const walletAddress = wallets[selectedCrypto] || "";
  const cryptoList = Object.keys(wallets).length > 0 ? Object.keys(wallets) : ["BTC", "ETH", "USDT-TRC20", "USDT-ERC20"];
  const cryptoLabels: Record<string, string> = {
    BTC: "BTC", ETH: "ETH", "USDT-TRC20": "USDT (TRC20)", "USDT-ERC20": "USDT (ERC20)", BNB: "BNB", SOL: "SOL"
  };
  const icons: Record<string, string> = { BTC: "₿", ETH: "Ξ", "USDT-TRC20": "₮", "USDT-ERC20": "₮", BNB: "⚡", SOL: "◎" };

  const submitPayment = async () => {
    if (!txHash.trim()) { setPayMessage("Enter transaction hash"); return; }
    setSubmitting(true); setPayMessage("");
    try {
      const r = await fetch("/api/purchase", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ albumId: id, contentTitle: album?.title, amount: album?.price, cryptoType: selectedCrypto, txHash: txHash.trim(), userEmail }),
      });
      if (r.ok) {
        setPayMessage("Submitted! I'll verify and unlock soon.");
        setTimeout(() => setShowPay(false), 2500);
      } else {
        const err = await r.json();
        setPayMessage(err.error || "Failed. Try again.");
      }
    } catch {
      setPayMessage("Network error. Please try again.");
    }
    setSubmitting(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-pink-500" /></div>;
  if (loadError) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <p className="text-zinc-500">{loadError}</p>
      <Link href="/" className="text-pink-500 text-sm hover:underline">Back to Home</Link>
    </div>
  );
  if (!album) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <p className="text-zinc-500">Album not found</p>
      <Link href="/" className="text-pink-500 text-sm hover:underline">Back to Home</Link>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={profile ? { id: profile.id, username: profile.username, isAdmin: profile.is_admin } : null} />
      <main className="flex-1 max-w-6xl mx-auto px-4 py-8 w-full">
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 mb-6"><ArrowLeft className="w-4 h-4" /> Back</Link>

        <div className="mb-8">
          <span className="inline-block text-xs font-medium px-2 py-1 rounded-full bg-pink-100 dark:bg-pink-950 text-pink-600 mb-3 capitalize">{album.type}</span>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">{album.title}</h1>
          {album.description && <p className="text-zinc-500 dark:text-zinc-400">{album.description}</p>}
          <p className="text-zinc-400 text-sm mt-1">{images.length} items in this album</p>
          {album.price ? <p className="text-pink-500 font-bold text-lg mt-2">${album.price}</p> : <p className="text-green-500 font-bold text-lg mt-2">Free</p>}
        </div>

        {!hasAccess && album.price ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-pink-100 dark:bg-pink-950 flex items-center justify-center mx-auto mb-6"><Lock className="w-10 h-10 text-pink-500" /></div>
            <h2 className="text-xl font-bold mb-2">Locked Album</h2>
            <p className="text-zinc-500 mb-6">Unlock this album to view all {images.length} items</p>
            <button
              onClick={() => {
                if (!userId) { window.location.href = `/login?redirect=/album/${id}`; return; }
                setShowPay(true);
              }}
              className="px-8 py-3 rounded-full font-semibold text-white bg-gradient-to-r from-pink-500 to-rose-500 hover:shadow-lg transition-all">
              Unlock for ${album.price}
            </button>
            {!userId && <p className="text-sm text-zinc-400 mt-3"><Link href={`/login?redirect=/album/${id}`} className="text-pink-500">Sign in</Link> to purchase</p>}
          </div>
        ) : (
          images.length > 0 ? (
            <div className={album.type === "video" ? "grid grid-cols-1 sm:grid-cols-2 gap-4" : "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3"}>
              {images.map((img) => (
                <div key={img.id} className="bg-zinc-100 dark:bg-zinc-800 rounded-xl overflow-hidden">
                  {album.type === "video" ? (
                    <video src={img.url} controls className="w-full aspect-video object-cover" preload="metadata" />
                  ) : (
                    <img src={img.url} alt="" className="w-full aspect-[3/4] object-cover hover:scale-105 transition-transform cursor-pointer" loading="lazy" />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-zinc-400"><p>No images in this album yet.</p></div>
          )
        )}

        {showPay && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
              <h2 className="text-lg font-bold mb-1">Pay ${album.price} with Crypto</h2>
              <p className="text-xs text-zinc-400 mb-4">{album.title}</p>
              <div className="flex gap-1 mb-3 flex-wrap">{cryptoList.map(c => <button key={c} onClick={() => setSelectedCrypto(c)} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${selectedCrypto === c ? "bg-pink-500 text-white" : "bg-zinc-100 dark:bg-zinc-800"}`}>{icons[c] || ""} {cryptoLabels[c] || c}</button>)}</div>
              {walletAddress ? (
                <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-3 mb-3">
                  <p className="text-xs text-zinc-400 mb-1">Send ${album.price} {selectedCrypto} to:</p>
                  <div className="flex items-center gap-2"><code className="flex-1 text-xs break-all font-mono">{walletAddress}</code><button onClick={() => navigator.clipboard.writeText(walletAddress)} className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-700 shrink-0"><Copy className="w-3.5 h-3.5" /></button></div>
                </div>
              ) : <p className="text-sm text-zinc-400 mb-3">Contact creator for payment info</p>}
              <div className="mb-3"><label className="text-xs font-medium">Transaction Hash (TX ID)</label><input value={txHash} onChange={e => setTxHash(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border mt-0.5 bg-white dark:bg-zinc-800 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-pink-500/50" placeholder="Paste your transaction hash here" /></div>
              {payMessage && <div className={`mb-3 p-2 rounded-lg text-xs ${payMessage.includes("Failed") || payMessage.includes("error") ? "bg-red-50 dark:bg-red-950 text-red-600" : "bg-green-50 dark:bg-green-950 text-green-600"}`}>{payMessage}</div>}
              <div className="flex gap-2">
                <button onClick={() => { setShowPay(false); setPayMessage(""); }} className="flex-1 py-2.5 rounded-full text-sm border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800">Cancel</button>
                <button onClick={submitPayment} disabled={submitting} className="flex-1 py-2.5 rounded-full text-sm font-medium text-white bg-gradient-to-r from-pink-500 to-rose-500 disabled:opacity-50 flex items-center justify-center gap-1">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />} Submit Payment
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
