"use client";

import React from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, Heart, User, Clock } from "lucide-react";
import { Photo } from "@/types/photo";
import { formatTimeAgo } from "@/lib/utils/timeAgo";
import { getGuestSessionId } from "@/lib/utils/session";

interface LightboxModalProps {
  photo: Photo | null;
  onClose: () => void;
  onLike: (photoId: string) => Promise<void>;
}

export default function LightboxModal({
  photo,
  onClose,
  onLike,
}: LightboxModalProps) {
  if (!photo) return null;

  const guestSessionId = getGuestSessionId();
  const isLikedByMe = Array.isArray(photo.liked_by) && photo.liked_by.includes(guestSessionId);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="relative max-w-4xl w-full glass-panel rounded-3xl overflow-hidden border border-amber-500/30 shadow-2xl z-10 flex flex-col md:flex-row my-auto max-h-[90vh]"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2 rounded-full bg-slate-950/70 border border-slate-700/60 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Large Image View */}
          <div className="relative flex-1 bg-black min-h-[300px] md:min-h-[480px] flex items-center justify-center">
            <Image
              src={photo.image_url}
              alt={photo.caption || "Foto da festa de 15 anos da Eduarda"}
              fill
              className="object-contain"
              unoptimized
            />
          </div>

          {/* Details Sidebar */}
          <div className="w-full md:w-80 p-6 bg-slate-950/80 flex flex-col justify-between border-t md:border-t-0 md:border-l border-amber-500/20 overflow-y-auto">
            <div>
              <div className="flex items-center gap-3 pb-4 mb-4 border-b border-slate-800/60">
                <div className="w-10 h-10 rounded-full bg-slate-900 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-100 text-sm">
                    {photo.author || "Convidado Especial"}
                  </h4>
                  <p className="text-xs text-amber-200/60 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{formatTimeAgo(photo.created_at)}</span>
                  </p>
                </div>
              </div>

              {photo.caption && (
                <p className="text-slate-200 text-sm font-light leading-relaxed mb-6 italic">
                  "{photo.caption}"
                </p>
              )}
            </div>

            <div className="pt-4 border-t border-slate-800/60 flex items-center justify-between">
              <button
                onClick={() => onLike(photo.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                  isLikedByMe
                    ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                    : "bg-slate-900 text-slate-200 hover:text-amber-300 border border-slate-700"
                }`}
              >
                <Heart
                  className={`w-4 h-4 ${
                    isLikedByMe ? "fill-rose-400 stroke-rose-400" : ""
                  }`}
                />
                <span>{photo.likes_count || 0} curtidas</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
