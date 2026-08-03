"use client";

import { useEffect, useState } from "react";
import { Lock, Wallet, Copy, CheckCircle, Loader2, ArrowRight } from "lucide-react";

interface Props {
  contentId: string;
  contentTitle: string;
  price: number;
  contentType: "photo" | "video";
  userEmail: string;
  onPurchased: () => void;
}

export function Paywall({ contentId, contentTitle, price, contentType, userEmail, onPurchased }: Props) {
  const [wallets, setWallets] = useState<Record<string, string>>({});
  const [selectedCrypto, setSelectedCrypto] = useState("USDT");
  const [txHash, setTxHash] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"info" | "success" | "error">("info");

  useEffect(() => {
    fetch("/api/admin/wallet")
      .then((r) => r.json())
      .then((d) => {
        if (d.wallets) setWallets(d.wallets);
      })
      .catch(() => {});
  }, []);

  const walletAddress = wallets[selectedCrypto] || "";
  const cryptoOptions = Object.keys(wallets).length > 0
    ? Object.keys(wallets)
    : ["BTC", "ETH", "USDT"];

  const copyAddress = () => {
    if (!walletAddress) return;
    navigator.clipboard.writeText(walletAddress);
    setCopied(selectedCrypto);
    setTimeout(() => setCopied(""), 2000);
  };

  const handleSubmit = async () => {
    if (!txHash.trim()) {
      setMessage("Please enter your transaction hash");
      setMessageType("error");
      return;
    }
    setSubmitting(true);
    setMessage("");

    try {
      const res = await fetch("/api/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentId,
          contentTitle,
          amount: price,
          cryptoType: selectedCrypto,
          txHash: txHash.trim(),
          userEmail,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");

      setMessage("Submitted! I'll verify your payment soon. Check back in a few minutes.");
      setMessageType("success");
      setTimeout(onPurchased, 3000);
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : "Submit failed");
      setMessageType("error");
    } finally {
      setSubmitting(false);
    }
  };

  const cryptoIcons: Record<string, string> = {
    BTC: "₿",
    ETH: "Ξ",
    USDT: "₮",
  };

  return (
    <div className="max-w-md mx-auto py-8 px-4">
      {/* Step 1: Price */}
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-full bg-pink-100 dark:bg-pink-950 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-7 h-7 text-pink-500" />
        </div>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-1">
          Unlock {contentTitle}
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {contentType === "video" ? "Video" : "Photo set"} &middot; One-time purchase
        </p>
        <div className="mt-3 text-3xl font-bold text-pink-500">${price}</div>
      </div>

      {/* Step 2: Choose crypto */}
      <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-5 mb-4">
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3 flex items-center gap-1.5">
          <Wallet className="w-4 h-4" /> Pay with crypto
        </p>

        {/* Crypto selector */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {cryptoOptions.map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCrypto(c)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                selectedCrypto === c
                  ? "bg-pink-500 text-white shadow"
                  : "bg-white dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-600"
              }`}
            >
              {cryptoIcons[c]} {c}
            </button>
          ))}
        </div>

        {/* Wallet address */}
        {walletAddress ? (
          <div className="bg-white dark:bg-zinc-900 rounded-xl p-3 border border-zinc-200 dark:border-zinc-700">
            <p className="text-xs text-zinc-400 mb-1.5">{selectedCrypto} address:</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs break-all text-zinc-700 dark:text-zinc-300 font-mono">
                {walletAddress}
              </code>
              <button
                onClick={copyAddress}
                className="shrink-0 p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                title="Copy"
              >
                {copied === selectedCrypto ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4 text-zinc-400" />
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-zinc-400 text-sm">
            <Wallet className="w-8 h-8 mx-auto mb-2 opacity-30" />
            No wallet configured yet. Please contact the creator.
          </div>
        )}
      </div>

      {/* Step 3: Transaction hash */}
      <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-5 mb-4">
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
          After sending payment, paste transaction hash:
        </p>
        <input
          type="text"
          value={txHash}
          onChange={(e) => setTxHash(e.target.value)}
          placeholder="0x... or tx ID"
          className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/50 font-mono"
        />
      </div>

      {/* Message */}
      {message && (
        <div
          className={`mb-4 p-3 rounded-xl text-sm ${
            messageType === "success"
              ? "bg-green-50 dark:bg-green-950 text-green-600"
              : messageType === "error"
              ? "bg-red-50 dark:bg-red-950 text-red-600"
              : "bg-blue-50 dark:bg-blue-950 text-blue-600"
          }`}
        >
          {message}
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={submitting || !txHash.trim()}
        className="w-full py-3 rounded-full font-semibold text-white bg-gradient-to-r from-pink-500 to-rose-500 hover:shadow-lg hover:shadow-pink-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {submitting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <ArrowRight className="w-4 h-4" />
        )}
        {submitting ? "Submitting..." : "I've Paid - Submit"}
      </button>

      <p className="text-center text-xs text-zinc-400 mt-4">
        Your payment will be verified manually. Once confirmed, you'll get access.
      </p>
    </div>
  );
}
