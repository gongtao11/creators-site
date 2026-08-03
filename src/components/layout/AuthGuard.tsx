"use client";

import { useEffect, useState, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

interface Props {
  children: ReactNode;
  requireAdmin?: boolean;
  fallbackPath?: string;
}

export function AuthGuard({ children, requireAdmin = false, fallbackPath = "/login" }: Props) {
  const [status, setStatus] = useState<"loading" | "allowed" | "denied">("loading");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (!cancelled) setStatus("denied");
        return;
      }
      if (requireAdmin) {
        const { data: pd } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
        if (!pd?.is_admin) {
          if (!cancelled) setStatus("denied");
          return;
        }
      }
      if (!cancelled) setStatus("allowed");
    })();
    return () => { cancelled = true; };
  }, [requireAdmin]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
      </div>
    );
  }

  if (status === "denied") {
    return <RedirectTo path={fallbackPath} />;
  }

  return <>{children}</>;
}

function RedirectTo({ path }: { path: string }) {
  useEffect(() => {
    // Use replace to avoid adding to browser history
    window.location.replace(path);
  }, [path]);
  return null;
}
