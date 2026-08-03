import { Lock, Eye, Image, Video } from "lucide-react";
import Link from "next/link";
import type { Content } from "@/types";

interface Props {
  content: Content;
}

export function ContentCard({ content }: Props) {
  const isFree = !content.price;
  const Icon = content.type === "video" ? Video : Image;

  return (
    <Link
      href={`/content/${content.id}`}
      className="group block rounded-2xl overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:shadow-lg transition-all"
    >
      {/* 预览图 */}
      <div className="relative aspect-[3/4] bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
        {content.preview_url ? (
          <img
            src={content.preview_url}
            alt={content.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-zinc-300 dark:text-zinc-600">
            <Icon className="w-12 h-12" />
          </div>
        )}

        {/* 类型标签 */}
        <span className="absolute top-2 left-2 bg-black/60 backdrop-blur text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
          <Icon className="w-3 h-3" />
          {content.type}
        </span>

        {/* 付费/免费标签 */}
        <span
          className={`absolute top-2 right-2 text-xs px-2 py-1 rounded-full flex items-center gap-1 backdrop-blur ${
            isFree
              ? "bg-green-500/80 text-white"
              : "bg-pink-500/80 text-white"
          }`}
        >
          {isFree ? (
            <>
              <Eye className="w-3 h-3" /> Free
            </>
          ) : (
            <>
              <Lock className="w-3 h-3" /> ${content.price}
            </>
          )}
        </span>
      </div>

      {/* 信息 */}
      <div className="p-4">
        <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 truncate">
          {content.title}
        </h3>
        {content.description && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">
            {content.description}
          </p>
        )}
      </div>
    </Link>
  );
}
