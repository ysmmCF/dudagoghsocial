"use client";

import React from "react";
import { motion } from "framer-motion";
import { Sparkles, Camera, Stars } from "lucide-react";

interface EmptyStateProps {
  onOpenUpload: () => void;
}

export default function EmptyState({ onOpenUpload }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
      className="max-w-md mx-auto my-8 p-8 rounded-3xl glass-panel text-center border border-amber-500/30 shadow-2xl relative overflow-hidden"
    >
      {/* Decorative star background glow */}
      <div className="absolute -top-16 -right-16 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Floating starry icon */}
      <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-tr from-slate-900 via-slate-800 to-indigo-950 border border-amber-500/30 flex items-center justify-center shadow-xl shadow-amber-500/10 group relative">
        <Stars className="w-10 h-10 text-amber-400 animate-pulse" />
        <Sparkles className="w-4 h-4 text-amber-300 absolute top-3 right-3 animate-spin-slow" />
      </div>

      <h3 className="font-serif text-2xl font-bold text-slate-100 mb-2">
        À espera das primeiras memórias
      </h3>

      <p className="text-slate-300 text-sm font-light leading-relaxed mb-6">
        Compartilhe uma foto e faça parte da história desta noite especial de 15 anos da Eduarda.
      </p>

      <button
        onClick={onOpenUpload}
        className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full gold-gradient-bg text-slate-950 font-bold text-sm shadow-xl shadow-amber-500/25 hover:scale-105 active:scale-95 transition-all duration-200"
      >
        <Camera className="w-4 h-4 stroke-[2.5]" />
        <span>Compartilhar primeira foto</span>
      </button>
    </motion.div>
  );
}
