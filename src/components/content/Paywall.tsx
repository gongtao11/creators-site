"use client";

import { Lock, Crown, CreditCard } from "lucide-react";
import { useState } from "react";

interface Props {
  contentTitle: string;
  price: number;
  contentType: "photo" | "video";
  onPurchase: () => Promise<void>;
}

export function Paywall({ contentTitle, price, contentType, onPurchase }: Props) {
  const [loading, setLoading] = useState(false);

  const handlePurchase = async () => {
    setLoading(true);
    try {
      await onPurchase();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-16 h-16 rounded-full bg-pink-100 dark:bg-pink-950 flex items-center justify-center mb-6">
        <Lock className="w-8 h-8 text-pink-500" />
      </div>

      <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
        Unlock This {contentType === "video" ? "Video" : "Photo Set"}
      </h2>
      <p className="text-zinc-500 dark:text-zinc-400 mb-6 max-w-sm">
        Get access to <strong>{contentTitle}</strong> and all exclusive content
        from my collection.
      </p>

      <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-6 mb-6 w-full max-w-xs">
        <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
          ${price}
        </div>
        <div className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          One-time purchase • Lifetime access
        </div>
      </div>

      <button
        onClick={handlePurchase}
        disabled={loading}
        className="w-full max-w-xs px-6 py-3 rounded-full font-semibold text-white bg-gradient-to-r from-pink-500 to-rose-500 hover:shadow-lg hover:shadow-pink-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? (
          <span className="animate-pulse">Processing...</span>
        ) : (
          <>
            <CreditCard className="w-4 h-4" />
            Buy Now
          </>
        )}
      </button>

      <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-4">
        Secure payment powered by Lemon Squeezy
      </p>
    </div>
  );
}

export function SubscriptionCTA() {
  return (
    <div className="bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-950/30 dark:to-rose-950/30 rounded-2xl p-6 text-center">
      <Crown className="w-8 h-8 text-pink-500 mx-auto mb-3" />
      <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100 mb-1">
        Save more with a subscription
      </h3>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
        Get unlimited access from just $5/month
      </p>
      <button
        onClick={() => (window.location.href = "/subscribe")}
        className="px-6 py-2.5 rounded-full font-medium text-sm bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:shadow-lg hover:shadow-pink-500/25 transition-all"
      >
        View Plans
      </button>
    </div>
  );
}
