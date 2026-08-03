"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export default function WatchPage() {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setUrl(params.get("url") || "");
    setTitle(params.get("title") || "");
  }, []);

  if (!url) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4 text-zinc-500">
        {url === "" ? <Loader2 className="w-8 h-8 animate-spin text-pink-500" /> : (
          <>
            <p>No video URL provided</p>
            <Link href="/" className="text-pink-500 text-sm underline">Back to Home</Link>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <div className="flex items-center gap-3 px-4 py-3 bg-black/80 z-10">
        <Link href="/" className="text-white/60 hover:text-white transition-colors">
          ← Back
        </Link>
        {title && <p className="text-white text-sm font-medium truncate">{title}</p>}
      </div>
      <div className="flex-1 flex items-center justify-center p-4">
        <video
          src={url}
          controls
          autoPlay
          playsInline
          className="max-w-full max-h-[85vh] rounded-lg"
          onError={(e) => {
            const target = e.currentTarget;
            target.style.display = "none";
            const parent = target.parentElement;
            if (parent) {
              parent.innerHTML = '<div class="text-center text-white"><p class="text-xl mb-4">Cannot play this video</p><p class="text-sm text-zinc-400 mb-6">Try downloading instead</p><a href="' + target.src + '" class="inline-block px-6 py-3 rounded-full bg-pink-500 text-white text-sm font-medium">Download Video</a></div>';
            }
          }}
        />
      </div>
    </div>
  );
}
