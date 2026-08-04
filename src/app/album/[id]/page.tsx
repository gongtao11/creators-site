"use client";

import { useEffect, useState, use, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Navbar } from "@/components/layout/Navbar";
import { ArrowLeft, Lock, Loader2, Play, Copy, ArrowRight, X, Eye, ChevronLeft, ChevronRight } from "lucide-react";
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

  // Photo lightbox
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  // Video player
  const [playingVideo, setPlayingVideo] = useState<{ url: string; title: string } | null>(null);

  const [showPay, setShowPay] = useState(false);
  const [wallets, setWallets] = useState<Record<string, string>>({});
  const [selectedCrypto, setSelectedCrypto] = useState("USDT-TRC20");
  const [txHash, setTxHash] = useState("");
  const [payNote, setPayNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [payMessage, setPayMessage] = useState("");

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

        const albumRes = await fetch("/api/admin/albums");
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

  // Keyboard navigation for lightbox
  const handleKey = useCallback((e: KeyboardEvent) => {
    if (lightboxIdx !== null) {
      if (e.key === "Escape") setLightboxIdx(null);
      if (e.key === "ArrowLeft" && lightboxIdx > 0) setLightboxIdx(lightboxIdx - 1);
      if (e.key === "ArrowRight" && lightboxIdx < images.length - 1) setLightboxIdx(lightboxIdx + 1);
    }
    if (playingVideo) {
      if (e.key === "Escape") setPlayingVideo(null);
    }
  }, [lightboxIdx, playingVideo, images.length]);

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  const cryptoList = Object.keys(wallets).filter(k => wallets[k]).length > 0
    ? Object.keys(wallets).filter(k => wallets[k])
    : ["BTC", "ETH", "USDT-TRC20", "USDT-ERC20"];
  const cryptoLabels: Record<string, string> = {
    BTC: "BTC", ETH: "ETH", "USDT-TRC20": "USDT (TRC20)", "USDT-ERC20": "USDT (ERC20)", BNB: "BNB", SOL: "SOL"
  };

  const submitPayment = async () => {
    if (!txHash.trim()) { setPayMessage("Enter transaction hash"); return; }
    setSubmitting(true); setPayMessage("");
    try {
      const r = await fetch("/api/purchase", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ albumId: id, contentTitle: album?.title, amount: album?.price, cryptoType: selectedCrypto, txHash: txHash.trim(), userEmail, note: payNote.trim() }),
      });
      if (r.ok) { setPayMessage("Submitted!"); setTimeout(() => setShowPay(false), 2500); }
      else { const err = await r.json(); setPayMessage(err.error || "Failed."); }
    } catch { setPayMessage("Network error."); }
    setSubmitting(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-pink-500" /></div>;
  if (loadError || !album) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <p className="text-zinc-500">{loadError || "Album not found"}</p>
      <Link href="/" className="text-pink-500 text-sm underline">Back to Home</Link>
    </div>
  );

  const isLocked = album.price && album.price > 0 && !hasAccess;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={profile ? { id: profile.id, username: profile.username, isAdmin: profile.is_admin } : null} />
      <main className="flex-1 max-w-6xl mx-auto px-4 py-8 w-full">
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>

        <div className="mb-8">
          <span className="inline-block text-xs font-medium px-2 py-1 rounded-full bg-pink-100 dark:bg-pink-950 text-pink-600 mb-3 capitalize">{album.type}</span>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">{album.title}</h1>
          {album.description && <p className="text-zinc-500 dark:text-zinc-400">{album.description}</p>}
          <p className="text-zinc-400 text-sm mt-1">{images.length} items</p>
          {album.price ? <p className="text-pink-500 font-bold text-lg mt-2">${album.price}</p> : <p className="text-green-500 font-bold text-lg mt-2">Free</p>}
        </div>

        {/* LOCKED */}
        {isLocked && (
          <>
            <div className="text-center py-12">
              <div className="w-20 h-20 rounded-full bg-pink-100 dark:bg-pink-950 flex items-center justify-center mx-auto mb-6">
                <Lock className="w-10 h-10 text-pink-500" />
              </div>
              <h2 className="text-xl font-bold mb-2">Locked Album</h2>
              <p className="text-zinc-500 mb-6">Unlock to view all {images.length} items</p>
              <button
                onClick={() => { if (!userId) { window.location.href = `/login?redirect=/album/${id}`; return; } setShowPay(true); }}
                className="px-8 py-3 rounded-full font-semibold text-white bg-gradient-to-r from-pink-500 to-rose-500 hover:shadow-lg transition-all">
                Unlock for ${album.price}
              </button>
              {!userId && (
                <p className="text-sm text-zinc-400 mt-3">
                  <Link href={`/login?redirect=/album/${id}`} className="text-pink-500 underline">Sign in</Link> to purchase
                </p>
              )}
            </div>
            {images.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                {images.slice(0, 12).map((img, idx) => {
                  const isVideo = /\.(mp4|webm|mov|avi|mkv)(\?|$)/i.test(img.url);
                  return (
                    <div key={img.id} className={`relative bg-zinc-100 dark:bg-zinc-800 rounded-xl overflow-hidden ${isVideo ? "aspect-video" : "aspect-[3/4]"}`}>
                      <img src={img.url} alt="" className="w-full h-full object-cover blur-xl opacity-20" loading="lazy" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        {isVideo ? <Play className="w-6 h-6 text-white/50" /> : <Eye className="w-6 h-6 text-white/50" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* UNLOCKED GRID - auto-detect photo vs video per file */}
        {!isLocked && images.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {images.map((img, idx) => {
              const isVideo = /\.(mp4|webm|mov|avi|mkv)(\?|$)/i.test(img.url);
              if (isVideo) {
                return (
                  <button
                    key={img.id}
                    onClick={() => setPlayingVideo({ url: img.url, title: `${album.title} #${idx + 1}` })}
                    className="group relative aspect-video bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-xl overflow-hidden hover:ring-2 hover:ring-pink-500 transition-all flex flex-col items-center justify-center gap-2"
                  >
                    <Play className="w-12 h-12 text-pink-500 group-hover:scale-110 transition-transform" />
                    <span className="text-white text-xs font-medium">Video #{idx + 1}</span>
                  </button>
                );
              }
              return (
                <button
                  key={img.id}
                  onClick={() => setLightboxIdx(idx)}
                  className="bg-zinc-100 dark:bg-zinc-800 rounded-xl overflow-hidden cursor-pointer hover:ring-2 hover:ring-pink-500 transition-all"
                >
                  <img src={img.url} alt={`#${idx + 1}`} className="w-full aspect-[3/4] object-cover hover:scale-105 transition-transform" loading="lazy" />
                </button>
              );
            })}
          </div>
        )}
        {!isLocked && images.length === 0 && (
          <div className="text-center py-16 text-zinc-400"><p>No items in this album yet.</p></div>
        )}

        {/* === PHOTO LIGHTBOX === */}
        {lightboxIdx !== null && (
          <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center" onClick={() => setLightboxIdx(null)}>
            {/* Close button */}
            <button onClick={() => setLightboxIdx(null)} className="absolute top-4 right-4 z-20 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
            {/* Counter */}
            <span className="absolute top-4 left-4 z-20 text-white text-sm bg-black/50 px-3 py-1.5 rounded-full">
              {lightboxIdx + 1} / {images.length}
            </span>
            {/* Prev */}
            {lightboxIdx > 0 && (
              <button onClick={(e) => { e.stopPropagation(); setLightboxIdx(lightboxIdx - 1); }}
                className="absolute left-4 z-20 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors">
                <ChevronLeft className="w-8 h-8" />
              </button>
            )}
            {/* Image */}
            <img
              src={images[lightboxIdx].url}
              alt={`${lightboxIdx + 1}`}
              className="max-w-full max-h-full object-contain p-8 select-none"
              onClick={(e) => e.stopPropagation()}
              draggable={false}
            />
            {/* Next */}
            {lightboxIdx < images.length - 1 && (
              <button onClick={(e) => { e.stopPropagation(); setLightboxIdx(lightboxIdx + 1); }}
                className="absolute right-4 z-20 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors">
                <ChevronRight className="w-8 h-8" />
              </button>
            )}
          </div>
        )}

        {/* === VIDEO PLAYER === */}
        {playingVideo && (
          <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center" onClick={() => setPlayingVideo(null)}>
            <div className="flex items-center justify-between w-full px-4 py-3">
              <span className="text-white text-sm">{playingVideo.title}</span>
              <button onClick={() => setPlayingVideo(null)} className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 flex items-center justify-center p-4 w-full">
              <video
                key={playingVideo.url}
                src={playingVideo.url}
                controls
                autoPlay
                playsInline
                className="max-w-full max-h-[80vh] rounded-lg"
                onClick={(e) => e.stopPropagation()}
                onError={(e) => {
                  const el = e.currentTarget;
                  el.style.display = "none";
                  const p = el.parentElement;
                  if (p) p.innerHTML = `<div class="text-center text-white p-8">
                    <p class="text-xl mb-4">This video cannot play in the browser</p>
                    <a href="${el.src}" class="inline-block px-6 py-3 rounded-full bg-pink-500 text-white text-sm font-medium hover:bg-pink-400 transition-colors" download>Download Video</a>
                    <p class="text-zinc-400 text-xs mt-2">Right-click → Save Link As</p>
                  </div>`;
                }}
              />
            </div>
          </div>
        )}

        {/* Payment Modal */}
        {showPay && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowPay(false)}>
            <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">Pay ${album.price}</h2>
                <button onClick={() => setShowPay(false)} className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"><X className="w-5 h-5" /></button>
              </div>
              <p className="text-xs text-zinc-500 mb-4">{album.title}</p>
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
              <div className="mb-3">
                <label className="text-xs font-medium">Message (optional)</label>
                <textarea value={payNote} onChange={e => setPayNote(e.target.value)} rows={2}
                  className="w-full px-3 py-2.5 rounded-xl border mt-0.5 bg-white dark:bg-zinc-800 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-pink-500/50"
                  placeholder="Leave a note or message for the creator..." />
              </div>
              {payMessage && (
                <div className={`mb-3 p-2 rounded-lg text-xs ${payMessage.includes("Failed") || payMessage.includes("Network") || payMessage.includes("error") ? "bg-red-50 dark:bg-red-950 text-red-600" : "bg-green-50 dark:bg-green-950 text-green-600"}`}>
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
    </div>
  );
}
