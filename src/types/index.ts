export interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  is_admin: boolean;
  created_at: string;
}

export interface Content {
  id: string;
  title: string;
  description: string;
  type: "photo" | "video";
  preview_url: string;
  full_url: string;
  price: number | null;
  is_published: boolean;
  created_at: string;
}

export interface Purchase {
  id: string;
  user_id: string;
  content_id: string | null;
  plan: "monthly" | "yearly" | "single" | null;
  status: "active" | "expired" | "cancelled";
  expires_at: string | null;
  created_at: string;
}

export interface Message {
  id: string;
  sender_id: string | null;
  receiver_id: string;
  content: string;
  is_ai: boolean;
  trigger_keyword: string | null;
  created_at: string;
}

export interface Conversation {
  userId: string;
  username: string;
  avatarUrl: string | null;
  lastMessage: string;
  lastMessageAt: string;
  unread: number;
}

export interface ScriptEntry {
  keywords: string[];
  response: string;
  category: string;
}

export interface AiMatchResult {
  matched: boolean;
  response: string;
  triggerKeyword: string | null;
  category: string;
  source: "keyword" | "claude" | "default";
}
