"use client";

import React from "react";
import { motion } from "framer-motion";
import { Sparkles, Heart, PlusCircle, Stars } from "lucide-react";

interface HeroSectionProps {
  memoryCount: number;
  onOpenUpload: () => void;
}

export default function HeroSection({ memoryCount, onOpenUpload }: HeroSectionProps) {
  return (
    <section className="relative pt-6 pb-8 px-4 sm:px-6 max-w-4xl mx-auto text-center z-10">
      {/* Decorative ambient star badge */}
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/80 border border-amber-500/30 text-amber-300 text-xs sm:text-sm font-medium mb-4 shadow-xl backdrop-blur-md"
      >
        <Stars className="w-4 h-4 text-amber-400 animate-pulse" />
        <span>Rede Social Exclusiva da Festa</span>
        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
      </motion.div>

      {/* Main Title */}
      <motion.h1
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, delay: 0.1 }}
        className="font-serif text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-slate-100 mb-3 leading-tight"
      >
        15 Anos da <span className="gold-gradient-text">Eduarda</span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.2 }}
        className="text-slate-300 text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed mb-6 font-light"
      >
        Bem-vindo à nossa noite mágica sob as estrelas. Compartilhe suas fotos,
        deixe suas legendas e eternize cada momento da comemoração!
      </motion.p>

      {/* Real Memory Counter Badge */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.3 }}
        className="inline-flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 p-4 rounded-2xl glass-panel max-w-md mx-auto mb-8 w-full border border-amber-500/25 shadow-2xl"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Heart className="w-6 h-6 fill-amber-400/20 stroke-amber-400" />
          </div>
          <div className="text-left">
            <div className="font-serif text-2xl sm:text-3xl font-bold text-slate-100 leading-none">
              {memoryCount}
            </div>
            <div className="text-xs text-amber-200/80 font-medium tracking-wide uppercase mt-1">
              {memoryCount === 1 ? "memória compartilhada" : "memórias compartilhadas"}
            </div>
          </div>
        </div>

        <div className="h-px w-full sm:w-px sm:h-10 bg-amber-500/20" />

        <button
          onClick={onOpenUpload}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl gold-gradient-bg text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-amber-500/20 hover:scale-105 active:scale-95 transition-transform duration-200 w-full sm:w-auto"
        >
          <PlusCircle className="w-4 h-4 stroke-[2.5]" />
          <span>Compartilhar Foto</span>
        </button>
      </motion.div>
    </section>
  );
}
