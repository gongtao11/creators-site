"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { ArrowLeft, Users, Mail, Calendar, ShoppingBag, MessageCircle } from "lucide-react";

interface UserInfo {
  id: string; email: string; username: string; created_at: string;
  last_sign_in: string | null; purchase_count: number; message_count: number;
}

export default function AdminUsersPage() {
  return (
    <AuthGuard requireAdmin fallbackPath="/">
      <UsersContent />
    </AuthGuard>
  );
}

function UsersContent() {
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [total, setTotal] = useState(0);
  const [activeToday, setActiveToday] = useState(0);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/admin/users");
        if (r.ok && !cancelled) {
          const d = await r.json();
          setUsers(d.users || []);
          setTotal(d.total || 0);
          setActiveToday(d.activeToday || 0);
        }
      } catch {}
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={profile} />
      <main className="flex-1 max-w-5xl mx-auto px-4 py-8 w-full">
        <Link href="/admin" className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 mb-4">
          <ArrowLeft className="w-3 h-3" /> Admin
        </Link>
        <h1 className="text-2xl font-bold mb-2">Users</h1>
        <div className="flex gap-4 mb-6 text-sm">
          <span className="px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 font-medium">
            {total} registered
          </span>
          <span className="px-3 py-1.5 rounded-full bg-green-50 dark:bg-green-950 text-green-600 font-medium">
            {activeToday} active today
          </span>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <svg className="w-8 h-8 animate-spin text-pink-500" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-2xl border">
            <Users className="w-12 h-12 mx-auto mb-3 text-zinc-300" />
            <p className="text-zinc-500">No users registered yet</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-zinc-50 dark:bg-zinc-800 text-zinc-500 text-xs uppercase">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium">User</th>
                    <th className="text-left px-4 py-3 font-medium">Email</th>
                    <th className="text-center px-4 py-3 font-medium">Joined</th>
                    <th className="text-center px-4 py-3 font-medium">Purchases</th>
                    <th className="text-center px-4 py-3 font-medium">Messages</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center text-white text-xs font-bold">
                            {u.username?.[0]?.toUpperCase() || "?"}
                          </div>
                          <span className="font-medium text-zinc-800 dark:text-zinc-200">{u.username}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-zinc-500 text-xs">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" /> {u.email}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-zinc-500 text-xs">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${u.purchase_count > 0 ? "bg-pink-100 dark:bg-pink-950 text-pink-600" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400"}`}>
                          {u.purchase_count}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${u.message_count > 0 ? "bg-blue-100 dark:bg-blue-950 text-blue-600" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400"}`}>
                          {u.message_count}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
