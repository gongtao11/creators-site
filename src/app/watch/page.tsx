"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";

function WatchContent() {
  const params = useSearchParams();
  const url = params.get("url") || "";
  const title = params.get("title") || "";

  if (!url) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-zinc-500">
        <p>No video URL provided</p>
        <Link href="/" className="text-pink-500 text-sm underline">Back to Home</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-3 bg-black/80">
        <Link href="/" className="text-white/60 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        {title && <p className="text-white text-sm font-medium truncate">{title}</p>}
      </div>

      {/* Video player */}
      <div className="flex-1 flex items-center justify-center p-4">
        <video
          src={url}
          controls
          autoPlay
          playsInline
          className="max-w-full max-h-[85vh] rounded-lg shadow-2xl"
          onError={(e) => {
            const target = e.currentTarget;
            target.style.display = "none";
            const parent = target.parentElement;
            if (parent) {
              parent.innerHTML = '<div class="text-center text-white"><p class="text-xl mb-4">Cannot play this video</p><p class="text-sm text-zinc-400 mb-6">Your browser may not support this format</p><a href="' + target.src + '" class="inline-block px-6 py-3 rounded-full bg-pink-500 text-white text-sm font-medium hover:bg-pink-400 transition-colors">Download Video</a></div>';
            }
          }}
        />
      </div>
    </div>
  );
}

export default function WatchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
      </div>
    }>
      <WatchContent />
    </Suspense>
  );
}
