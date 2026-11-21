"use client";

import React, { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Heart, User, Trash2, Maximize2 } from "lucide-react";
import { Photo } from "@/types/photo";
import { formatTimeAgo } from "@/lib/utils/timeAgo";
import { getGuestSessionId } from "@/lib/utils/session";

interface PhotoCardProps {
  photo: Photo;
  onLike: (photoId: string) => Promise<void>;
  onDelete: (photoId: string) => Promise<void>;
  onOpenLightbox: (photo: Photo) => void;
  isAdmin: boolean;
}

export default function PhotoCard({
  photo,
  onLike,
  onDelete,
  onOpenLightbox,
  isAdmin,
}: PhotoCardProps) {
  const [isLiking, setIsLiking] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const guestSessionId = getGuestSessionId();

  const isLikedByMe = Array.isArray(photo.liked_by) && photo.liked_by.includes(guestSessionId);
  const isMyPhoto = photo.session_id === guestSessionId;
  const canDelete = isAdmin || isMyPhoto;

  const handleLikeClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLiking) return;
    setIsLiking(true);
    try {
      await onLike(photo.id);
    } finally {
      setIsLiking(false);
    }
  };

  const handleDeleteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDeleting) return;
    if (confirm("Deseja realmente excluir esta memória?")) {
      setIsDeleting(true);
      try {
        await onDelete(photo.id);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.4 }}
      className="glass-card rounded-2xl overflow-hidden flex flex-col group relative border border-amber-500/15 hover:border-amber-500/40"
    >
      {/* Header: Author & Time */}
      <div className="p-3.5 flex items-center justify-between border-b border-slate-800/60 bg-slate-950/40">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <User className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-semibold text-slate-100 truncate">
              {photo.author || "Convidado Especial"}
            </h4>
            <p className="text-[10px] text-amber-200/60 font-light">
              {formatTimeAgo(photo.created_at)}
            </p>
          </div>
        </div>

        {/* Delete action button for creator or admin */}
        {canDelete && (
          <button
            onClick={handleDeleteClick}
            disabled={isDeleting}
            title={isAdmin ? "Excluir como Administrador" : "Excluir minha foto"}
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-full transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Image Container with click-to-lightbox */}
      <div
        onClick={() => onOpenLightbox(photo)}
        className="relative w-full aspect-[4/3] sm:aspect-square bg-slate-950 overflow-hidden cursor-pointer group/img"
      >
        <Image
          src={photo.image_url}
          alt={photo.caption || `Foto da festa por ${photo.author}`}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover group-hover/img:scale-105 transition-transform duration-500"
          unoptimized
        />

        {/* Hover zoom overlay badge */}
        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover/img:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="px-3 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md border border-amber-500/30 text-amber-300 text-xs font-medium flex items-center gap-1.5 shadow-lg">
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Ver em tela cheia</span>
          </div>
        </div>
      </div>

      {/* Footer: Likes & Caption */}
      <div className="p-4 flex flex-col gap-2.5 bg-slate-950/30 grow justify-between">
        {/* Caption */}
        {photo.caption && (
          <p className="text-xs sm:text-sm text-slate-200 font-light leading-relaxed break-words line-clamp-3">
            "{photo.caption}"
          </p>
        )}

        {/* Likes Row */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-800/40">
          <button
            onClick={handleLikeClick}
            disabled={isLiking}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${
              isLikedByMe
                ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm shadow-rose-500/20"
                : "bg-slate-900/70 text-slate-300 hover:text-amber-300 hover:bg-slate-800 border border-slate-700/50"
            }`}
          >
            <motion.div
              animate={isLikedByMe ? { scale: [1, 1.3, 1] } : { scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Heart
                className={`w-4 h-4 ${
                  isLikedByMe ? "fill-rose-400 stroke-rose-400" : "stroke-current"
                }`}
              />
            </motion.div>
            <span>{photo.likes_count || 0}</span>
          </button>

          <span className="text-[10px] text-amber-200/50 font-light">
            {photo.likes_count === 1 ? "1 curtida" : `${photo.likes_count || 0} curtidas`}
          </span>
        </div>
      </div>
    </motion.article>
  );
}
