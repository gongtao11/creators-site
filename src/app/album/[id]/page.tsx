"use client";

import { useEffect, useState, use, useRef } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Navbar } from "@/components/layout/Navbar";
import { ArrowLeft, Lock, Loader2, Play, Copy, ArrowRight, X, Eye } from "lucide-react";
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
  const videoRef = useRef<HTMLVideoElement>(null);

  const [showPay, setShowPay] = useState(false);
  const [wallets, setWallets] = useState<Record<string, string>>({});
  const [selectedCrypto, setSelectedCrypto] = useState("USDT-TRC20");
  const [txHash, setTxHash] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [payMessage, setPayMessage] = useState("");
  const [videoPlayer, setVideoPlayer] = useState<{ url: string; title: string } | null>(null);
  const [playerError, setPlayerError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user && !cancelled) {
          setUserId(user.id);
          setUserEmail(user.email || "");
          const { data: pd } = await supabase.from("profiles").select("*").eq("id", user.id).single();
          if (!cancelled) setProfile(pd as Profile);
        }

        const albumRes = await fetch(`/api/admin/albums`);
        if (!albumRes.ok) throw new Error("Failed to load");
        const albumData = await albumRes.json();
        const found = (albumData.albums || []).find((a: Album) => a.id === id);
        if (!cancelled) {
          if (!found) { setLoadError("Album not found"); setLoading(false); return; }
          setAlbum(found);
          if (!found.price) setHasAccess(true);
        }

        if (user && found && found.price) {
          const { data: purchases } = await supabase.from("purchases").select("*").eq("user_id", user.id).eq("content_id", id).eq("status", "active");
          if (!cancelled && purchases && purchases.length > 0) setHasAccess(true);
        }

        const imgRes = await fetch(`/api/admin/album-images?album_id=${id}`);
        if (imgRes.ok && !cancelled) {
          const imgData = await imgRes.json();
          setImages(imgData.images || []);
        }

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

  const cryptoList = Object.keys(wallets).filter(k => wallets[k]).length > 0
    ? Object.keys(wallets).filter(k => wallets[k])
    : ["BTC", "ETH", "USDT-TRC20", "USDT-ERC20"];
  const cryptoLabels: Record<string, string> = {
    BTC: "BTC", ETH: "ETH", "USDT-TRC20": "USDT TRC20", "USDT-ERC20": "USDT ERC20", BNB: "BNB", SOL: "SOL"
  };

  const openPlayer = (url: string, title: string) => {
    setPlayerError(false);
    setVideoPlayer({ url, title });
  };

  useEffect(() => {
    if (videoPlayer && videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(() => setPlayerError(true));
    }
  }, [videoPlayer]);

  const submitPayment = async () => {
    if (!txHash.trim()) { setPayMessage("Enter transaction hash"); return; }
    setSubmitting(true); setPayMessage("");
    try {
      const r = await fetch("/api/purchase", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ albumId: id, contentTitle: album?.title, amount: album?.price, cryptoType: selectedCrypto, txHash: txHash.trim(), userEmail }),
      });
      if (r.ok) { setPayMessage("Submitted! I'll verify and unlock soon."); setTimeout(() => setShowPay(false), 2500); }
      else { const err = await r.json(); setPayMessage(err.error || "Failed."); }
    } catch { setPayMessage("Network error."); }
    setSubmitting(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-pink-500" /></div>;
  if (loadError) return <div className="min-h-screen flex flex-col items-center justify-center gap-4"><p className="text-zinc-500">{loadError}</p><Link href="/" className="text-pink-500 text-sm underline">Back to Home</Link></div>;
  if (!album) return <div className="min-h-screen flex flex-col items-center justify-center gap-4"><p className="text-zinc-500">Album not found</p><Link href="/" className="text-pink-500 text-sm underline">Back to Home</Link></div>;

  const isLocked = !hasAccess && album.price && album.price > 0;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={profile ? { id: profile.id, username: profile.username, isAdmin: profile.is_admin } : null} />
      <main className="flex-1 max-w-6xl mx-auto px-4 py-8 w-full">
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 mb-6"><ArrowLeft className="w-4 h-4" /> Back</Link>

        <div className="mb-8">
          <span className="inline-block text-xs font-medium px-2 py-1 rounded-full bg-pink-100 dark:bg-pink-950 text-pink-600 mb-3 capitalize">{album.type}</span>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">{album.title}</h1>
          {album.description && <p className="text-zinc-500 dark:text-zinc-400">{album.description}</p>}
          <p className="text-zinc-400 text-sm mt-1">{images.length} items</p>
          {album.price ? <p className="text-pink-500 font-bold text-lg mt-2">${album.price}</p> : <p className="text-green-500 font-bold text-lg mt-2">Free</p>}
        </div>

        {/* Locked state - show blurred grid preview */}
        {isLocked && (
          <>
            <div className="text-center py-12">
              <div className="w-20 h-20 rounded-full bg-pink-100 dark:bg-pink-950 flex items-center justify-center mx-auto mb-6"><Lock className="w-10 h-10 text-pink-500" /></div>
              <h2 className="text-xl font-bold mb-2">Locked Album</h2>
              <p className="text-zinc-500 mb-2">Unlock to view all {images.length} items</p>
              <button
                onClick={() => { if (!userId) { window.location.href = `/login?redirect=/album/${id}`; return; } setShowPay(true); }}
                className="px-8 py-3 rounded-full font-semibold text-white bg-gradient-to-r from-pink-500 to-rose-500 hover:shadow-lg transition-all">
                Unlock for ${album.price}
              </button>
              {!userId && <p className="text-sm text-zinc-400 mt-3"><Link href={`/login?redirect=/album/${id}`} className="text-pink-500">Sign in</Link> to purchase</p>}
            </div>

            {/* Blurred preview grid */}
            {images.length > 0 && (
              <div className={album.type === "video" ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3" : "grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2"}>
                {images.slice(0, 12).map((img, idx) => (
                  <div key={img.id} className="relative bg-zinc-100 dark:bg-zinc-800 rounded-xl overflow-hidden">
                    {album.type === "video" ? (
                      <div className="aspect-video relative bg-zinc-900">
                        <img src="" alt="" className="hidden" onError={(e) => {}} />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                          <Play className="w-8 h-8 text-white opacity-60" />
                        </div>
                      </div>
                    ) : (
                      <div className="aspect-[3/4] relative">
                        <img src={img.url} alt="" className="w-full h-full object-cover blur-xl opacity-30" loading="lazy" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Eye className="w-6 h-6 text-white opacity-50" />
                        </div>
                      </div>
                    )}
                    <span className="absolute top-1 left-1 text-[9px] bg-black/50 text-white px-1 rounded">#{idx + 1}</span>
                  </div>
                ))}
                {images.length > 12 && (
                  <div className="flex items-center justify-center bg-zinc-50 dark:bg-zinc-800 rounded-xl aspect-[3/4]">
                    <p className="text-sm text-zinc-400">+{images.length - 12} more</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Unlocked state - full grid */}
        {!isLocked && images.length > 0 && (
          <div className={album.type === "video" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" : "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3"}>
            {images.map((img, idx) => (
              <div key={img.id} className="bg-zinc-100 dark:bg-zinc-800 rounded-xl overflow-hidden">
                {album.type === "video" ? (
                  <div
                    onClick={() => openPlayer(img.url, `${album.title} #${idx + 1}`)}
                    className="relative aspect-video bg-gradient-to-br from-zinc-800 to-black cursor-pointer hover:ring-2 hover:ring-pink-500 transition-all group"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter') openPlayer(img.url, `${album.title} #${idx + 1}`); }}
                  >
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                      <div className="w-16 h-16 rounded-full bg-pink-500/90 flex items-center justify-center group-hover:bg-pink-500 group-hover:scale-110 transition-all shadow-lg">
                        <Play className="w-7 h-7 text-white ml-0.5" />
                      </div>
                      <span className="text-white text-xs font-medium opacity-80">Play Video</span>
                    </div>
                    <span className="absolute bottom-2 left-2 text-[10px] bg-black/60 text-white px-2 py-0.5 rounded">#{idx + 1}</span>
                  </div>
                ) : (
                  <a href={img.url} target="_blank" rel="noopener noreferrer">
                    <img src={img.url} alt={`#${idx + 1}`} className="w-full aspect-[3/4] object-cover hover:scale-105 transition-transform cursor-pointer" loading="lazy" />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}

        {!isLocked && images.length === 0 && (
          <div className="text-center py-16 text-zinc-400"><p>No items in this album yet.</p></div>
        )}

        {/* Payment Modal */}
        {showPay && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowPay(false)}>
            <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
              <h2 className="text-lg font-bold mb-1">Pay ${album.price}</h2>
              <p className="text-xs text-zinc-400 mb-4">{album.title}</p>
              <div className="flex gap-1 mb-3 flex-wrap">
                {cryptoList.map(c => (
                  <button key={c} onClick={() => setSelectedCrypto(c)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium ${selectedCrypto === c ? "bg-pink-500 text-white" : "bg-zinc-100 dark:bg-zinc-800"}`}>
                    {cryptoLabels[c] || c}
                  </button>
                ))}
              </div>
              {wallets[selectedCrypto] ? (
                <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-3 mb-3">
                  <p className="text-xs text-zinc-400 mb-1">Send ${album.price} to:</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-[11px] break-all font-mono">{wallets[selectedCrypto]}</code>
                    <button onClick={() => navigator.clipboard.writeText(wallets[selectedCrypto] || "")} className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-700 shrink-0"><Copy className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ) : <p className="text-sm text-zinc-400 mb-3">Contact creator for payment info</p>}
              <div className="mb-3">
                <label className="text-xs font-medium">Transaction Hash</label>
                <input value={txHash} onChange={e => setTxHash(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border mt-0.5 bg-white dark:bg-zinc-800 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-pink-500/50"
                  placeholder="Paste your transaction hash" />
              </div>
              {payMessage && (
                <div className={`mb-3 p-2 rounded-lg text-xs ${payMessage.includes("error") || payMessage.includes("Failed") || payMessage.includes("Network") ? "bg-red-50 dark:bg-red-950 text-red-600" : "bg-green-50 dark:bg-green-950 text-green-600"}`}>
                  {payMessage}
                </div>
              )}
              <div className="flex gap-2">
                <button onClick={() => { setShowPay(false); setPayMessage(""); }} className="flex-1 py-2.5 rounded-full text-sm border">Cancel</button>
                <button onClick={submitPayment} disabled={submitting}
                  className="flex-1 py-2.5 rounded-full text-sm font-medium text-white bg-gradient-to-r from-pink-500 to-rose-500 disabled:opacity-50 flex items-center justify-center gap-1">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />} Submit
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Video Player Modal */}
      {videoPlayer && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95" onClick={() => setVideoPlayer(null)}>
          <div className="absolute top-4 right-4 z-10">
            <button onClick={() => setVideoPlayer(null)}
              className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="w-full max-w-5xl p-4" onClick={e => e.stopPropagation()}>
            <p className="text-white/60 text-sm mb-3 text-center truncate px-8">{videoPlayer?.title}</p>
            <video
              ref={videoRef}
              key={videoPlayer?.url}
              src={videoPlayer?.url}
              controls
              autoPlay
              playsInline
              className="w-full rounded-2xl bg-black max-h-[80vh]"
              onError={() => setPlayerError(true)}
              onCanPlay={() => setPlayerError(false)}
            />
            {playerError && (
              <div className="text-center py-8">
                <p className="text-white text-lg mb-2">Cannot play this video</p>
                <p className="text-zinc-400 text-sm mb-4">Your browser may not support this video format</p>
                <a
                  href={videoPlayer?.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-6 py-2.5 rounded-full bg-pink-500 text-white text-sm font-medium"
                >
                  Download Video
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
