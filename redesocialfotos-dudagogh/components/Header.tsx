"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, Shield, Camera } from "lucide-react";

interface HeaderProps {
  onOpenUpload: () => void;
}

export default function Header({ onOpenUpload }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-amber-500/20 px-4 py-3 sm:px-8">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand logo & title */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 via-amber-300 to-indigo-900 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform duration-300">
            <Sparkles className="w-5 h-5 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="font-serif text-lg sm:text-xl font-bold tracking-wide text-slate-100 flex items-center gap-2">
              Eduarda <span className="gold-gradient-text">15 Anos</span>
            </h1>
            <p className="text-[10px] sm:text-xs text-amber-200/70 font-medium tracking-wider uppercase">
              Mural da Noite Estrelada
            </p>
          </div>
        </Link>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={onOpenUpload}
            className="flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold rounded-full gold-gradient-bg text-slate-950 shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-105 active:scale-95 transition-all duration-200"
          >
            <Camera className="w-4 h-4 text-slate-950" />
            <span className="hidden xs:inline">Publicar Foto</span>
            <span className="xs:hidden">Publicar</span>
          </button>

          <Link
            href="/admin"
            title="Área Administrativa"
            className="p-2 text-slate-400 hover:text-amber-300 hover:bg-slate-800/50 rounded-full transition-colors"
          >
            <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
          </Link>
        </div>
      </div>
    </header>
  );
}
