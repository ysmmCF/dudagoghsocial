"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Clock, Flame } from "lucide-react";
import { Photo, SortMode } from "@/types/photo";
import PhotoCard from "./PhotoCard";
import EmptyState from "./EmptyState";

interface PhotoGridProps {
  photos: Photo[];
  onLike: (photoId: string) => Promise<void>;
  onDelete: (photoId: string) => Promise<void>;
  onOpenLightbox: (photo: Photo) => void;
  onOpenUpload: () => void;
  isAdmin: boolean;
}

export default function PhotoGrid({
  photos,
  onLike,
  onDelete,
  onOpenLightbox,
  onOpenUpload,
  isAdmin,
}: PhotoGridProps) {
  const [sortMode, setSortMode] = useState<SortMode>("recent");

  // Sorted photos based on active tab mode
  const sortedPhotos = useMemo(() => {
    const list = [...photos];
    if (sortMode === "highlights") {
      // Sort by likes_count DESC, then created_at DESC
      list.sort((a, b) => {
        if (b.likes_count !== a.likes_count) {
          return b.likes_count - a.likes_count;
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
    } else {
      // Sort by created_at DESC (newest first)
      list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    return list;
  }, [photos, sortMode]);

  if (photos.length === 0) {
    return <EmptyState onOpenUpload={onOpenUpload} />;
  }

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-6 z-10 relative">
      {/* Tabs Switcher: "Todas as Memórias" vs "Momentos em Destaque" */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6 pb-4 border-b border-amber-500/20">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-slate-100">
            Mural de Memórias
          </h2>
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-full bg-slate-950/80 border border-amber-500/20 backdrop-blur-md">
          <button
            onClick={() => setSortMode("recent")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
              sortMode === "recent"
                ? "gold-gradient-bg text-slate-950 shadow-md shadow-amber-500/20"
                : "text-slate-400 hover:text-slate-100"
            }`}
          >
            <Clock className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Mais Recentes</span>
          </button>

          <button
            onClick={() => setSortMode("highlights")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
              sortMode === "highlights"
                ? "gold-gradient-bg text-slate-950 shadow-md shadow-amber-500/20"
                : "text-slate-400 hover:text-slate-100"
            }`}
          >
            <Flame className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Momentos em Destaque</span>
          </button>
        </div>
      </div>

      {/* Grid of memory cards */}
      <motion.div
        layout
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <AnimatePresence mode="popLayout">
          {sortedPhotos.map((photo) => (
            <PhotoCard
              key={photo.id}
              photo={photo}
              onLike={onLike}
              onDelete={onDelete}
              onOpenLightbox={onOpenLightbox}
              isAdmin={isAdmin}
            />
          ))}
        </AnimatePresence>
      </motion.div>
    </section>
  );
}
