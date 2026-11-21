"use client";

import React, { useState, useEffect, useCallback } from "react";
import StarryBackground from "@/components/StarryBackground";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import PhotoGrid from "@/components/PhotoGrid";
import UploadModal from "@/components/UploadModal";
import LightboxModal from "@/components/LightboxModal";
import { Photo } from "@/types/photo";
import { getGuestSessionId } from "@/lib/utils/session";
import { Sparkles, Heart } from "lucide-react";

export default function Home() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isIntroVisible, setIsIntroVisible] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [activeLightboxPhoto, setActiveLightboxPhoto] = useState<Photo | null>(null);

  const fetchPhotos = useCallback(async () => {
    try {
      const res = await fetch("/api/photos");
      if (res.ok) {
        const data = await res.json();
        setPhotos(data.photos || []);
      }
    } catch (err) {
      console.error("Erro ao buscar publicações:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  useEffect(() => {
    const introTimer = window.setTimeout(() => setIsIntroVisible(false), 2000);
    return () => window.clearTimeout(introTimer);
  }, []);

  const handleLike = async (photoId: string) => {
    const sessionId = getGuestSessionId();

    // Optimistic UI update
    setPhotos((prev) =>
      prev.map((photo) => {
        if (photo.id !== photoId) return photo;
        const likedBy = Array.isArray(photo.liked_by) ? photo.liked_by : [];
        const isLiked = likedBy.includes(sessionId);
        const newLikedBy = isLiked
          ? likedBy.filter((s) => s !== sessionId)
          : [...likedBy, sessionId];
        const newCount = isLiked
          ? Math.max(0, photo.likes_count - 1)
          : photo.likes_count + 1;

        return {
          ...photo,
          likes_count: newCount,
          liked_by: newLikedBy,
        };
      })
    );

    // Also update active lightbox photo if open
    if (activeLightboxPhoto && activeLightboxPhoto.id === photoId) {
      setActiveLightboxPhoto((prev) => {
        if (!prev) return null;
        const likedBy = Array.isArray(prev.liked_by) ? prev.liked_by : [];
        const isLiked = likedBy.includes(sessionId);
        const newLikedBy = isLiked
          ? likedBy.filter((s) => s !== sessionId)
          : [...likedBy, sessionId];
        const newCount = isLiked ? Math.max(0, prev.likes_count - 1) : prev.likes_count + 1;
        return { ...prev, likes_count: newCount, liked_by: newLikedBy };
      });
    }

    try {
      const res = await fetch(`/api/photos/${photoId}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.photo) {
          setPhotos((prev) =>
            prev.map((p) => (p.id === photoId ? data.photo : p))
          );
        }
      }
    } catch (err) {
      console.error("Erro ao sincronizar curtida:", err);
      // Revert fetch on error
      fetchPhotos();
    }
  };

  const handleDelete = async (photoId: string) => {
    const sessionId = getGuestSessionId();

    try {
      const res = await fetch(`/api/photos/${photoId}`, {
        method: "DELETE",
        headers: {
          "x-session-id": sessionId,
        },
      });

      if (res.ok) {
        setPhotos((prev) => prev.filter((p) => p.id !== photoId));
        if (activeLightboxPhoto?.id === photoId) {
          setActiveLightboxPhoto(null);
        }
      } else {
        const data = await res.json();
        alert(data.error || "Não foi possível excluir esta foto.");
      }
    } catch (err) {
      console.error("Erro ao excluir foto:", err);
    }
  };

  return (
    <main className="min-h-screen relative bg-starry-night text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950">
      {isIntroVisible && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#060919] px-6 text-center" aria-label="Introdução da festa">
          <div className="animate-pulse">
            <p className="mb-3 text-sm tracking-[0.35em] text-amber-300 uppercase">Uma noite para guardar</p>
            <h1 className="font-serif text-4xl font-bold text-slate-100 sm:text-6xl">
              15 Anos da <span className="gold-gradient-text">Eduarda</span>
            </h1>
            <p className="mt-4 text-sm text-slate-300 sm:text-base">Memórias sob as estrelas</p>
          </div>
        </div>
      )}
      {/* Background Animated Canvas */}
      <StarryBackground />

      {/* Navigation Bar */}
      <Header onOpenUpload={() => setIsUploadOpen(true)} />

      {/* Main Content Area */}
      <div className="flex-1 max-w-7xl w-full mx-auto pb-16 z-10">
        <HeroSection
          memoryCount={photos.length}
          onOpenUpload={() => setIsUploadOpen(true)}
        />

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-10 h-10 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
            <p className="text-xs text-amber-200/70">Carregando memórias da noite...</p>
          </div>
        ) : (
          <PhotoGrid
            photos={photos}
            onLike={handleLike}
            onDelete={handleDelete}
            onOpenLightbox={(photo) => setActiveLightboxPhoto(photo)}
            onOpenUpload={() => setIsUploadOpen(true)}
            isAdmin={false}
          />
        )}
      </div>

      {/* Floating Mobile Action Button (FAB) */}
      <button
        onClick={() => setIsUploadOpen(true)}
        className="fixed bottom-6 right-6 z-40 sm:hidden p-4 rounded-full gold-gradient-bg text-slate-950 shadow-2xl shadow-amber-500/40 hover:scale-110 active:scale-95 transition-all flex items-center justify-center border border-amber-300"
        title="Publicar Foto"
      >
        <Sparkles className="w-6 h-6 stroke-[2.5]" />
      </button>

      {/* Footer */}
      <footer className="z-10 py-6 border-t border-amber-500/10 text-center text-xs text-amber-200/40 font-light glass-panel">
        <p className="flex items-center justify-center gap-1">
          <span>Criado com carinho para os 15 Anos da Eduarda</span>
          <Heart className="w-3.5 h-3.5 fill-amber-400/40 text-amber-400" />
        </p>
      </footer>

      {/* Modals */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={fetchPhotos}
      />

      <LightboxModal
        photo={activeLightboxPhoto}
        onClose={() => setActiveLightboxPhoto(null)}
        onLike={handleLike}
      />
    </main>
  );
}
