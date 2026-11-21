"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Shield,
  KeyRound,
  Trash2,
  ArrowLeft,
  Sparkles,
  Database,
  Heart,
  Image as ImageIcon,
  RefreshCw,
  LogOut,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import StarryBackground from "@/components/StarryBackground";
import { Photo } from "@/types/photo";
import { formatTimeAgo } from "@/lib/utils/timeAgo";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState("");

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dataSource, setDataSource] = useState<string>("local");

  const fetchPhotos = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/photos");
      if (res.ok) {
        const data = await res.json();
        setPhotos(data.photos || []);
        setDataSource(data.source || "local");
      }
    } catch (err) {
      console.error("Erro ao carregar dados no admin:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const ADMIN_PASS = "duda15anos"; // Default admin key
    if (password === ADMIN_PASS || password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setAuthError("");
      sessionStorage.setItem("admin_auth", "true");
      fetchPhotos();
    } else {
      setAuthError("Senha incorreta. Tente novamente.");
    }
  };

  useEffect(() => {
    if (sessionStorage.getItem("admin_auth") === "true") {
      setIsAuthenticated(true);
      fetchPhotos();
    }
  }, [fetchPhotos]);

  const handleDeletePhoto = async (photoId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta foto permanentemente?")) return;

    try {
      const res = await fetch(`/api/photos/${photoId}`, {
        method: "DELETE",
        headers: {
          "x-admin-pass": password || "duda15anos",
        },
      });

      if (res.ok) {
        setPhotos((prev) => prev.filter((p) => p.id !== photoId));
      } else {
        const data = await res.json();
        alert(data.error || "Erro ao excluir foto.");
      }
    } catch (err) {
      console.error("Erro ao excluir foto:", err);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("admin_auth");
    setIsAuthenticated(false);
    setPassword("");
  };

  const totalLikes = photos.reduce((acc, p) => acc + (p.likes_count || 0), 0);

  return (
    <main className="min-h-screen relative bg-starry-night text-slate-100 p-4 sm:p-8 selection:bg-amber-500 selection:text-slate-950">
      <StarryBackground />

      <div className="max-w-6xl mx-auto z-10 relative">
        {/* Top Header */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-amber-500/20">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs sm:text-sm text-amber-300 hover:text-amber-200 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao Site Principal</span>
          </Link>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-amber-500/30 text-amber-300 text-xs font-semibold">
            <Shield className="w-4 h-4" />
            <span>Área Administrativa</span>
          </div>
        </div>

        {!isAuthenticated ? (
          /* Admin Password Auth Modal */
          <div className="max-w-md mx-auto my-12 p-8 glass-panel rounded-3xl border border-amber-500/30 shadow-2xl text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl gold-gradient-bg flex items-center justify-center text-slate-950 shadow-xl shadow-amber-500/20">
              <KeyRound className="w-8 h-8 stroke-[2.5]" />
            </div>

            <h2 className="font-serif text-2xl font-bold text-slate-100 mb-2">
              Acesso Restrito
            </h2>
            <p className="text-xs text-slate-300 font-light mb-6">
              Digite a senha de administrador para gerenciar o mural de memórias.
            </p>

            <form onSubmit={handleLogin} className="space-y-4">
              <input
                type="password"
                placeholder="Senha de acesso"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-950/70 border border-slate-700 focus:border-amber-400 text-slate-100 text-sm outline-none text-center tracking-widest placeholder:tracking-normal placeholder:text-slate-500"
              />

              {authError && (
                <p className="text-xs text-rose-400 font-medium">{authError}</p>
              )}

              <button
                type="submit"
                className="w-full py-3 rounded-xl gold-gradient-bg text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Entrar no Painel
              </button>
            </form>
          </div>
        ) : (
          /* Authenticated Dashboard */
          <div className="space-y-8">
            {/* Dashboard Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 glass-panel rounded-2xl border border-amber-500/20 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs text-amber-200/70 uppercase tracking-wider font-semibold">
                    Total de Fotos
                  </div>
                  <div className="font-serif text-2xl font-bold text-slate-100">
                    {photos.length}
                  </div>
                </div>
              </div>

              <div className="p-5 glass-panel rounded-2xl border border-amber-500/20 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                  <Heart className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs text-amber-200/70 uppercase tracking-wider font-semibold">
                    Total de Curtidas
                  </div>
                  <div className="font-serif text-2xl font-bold text-slate-100">
                    {totalLikes}
                  </div>
                </div>
              </div>

              <div className="p-5 glass-panel rounded-2xl border border-amber-500/20 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Database className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs text-amber-200/70 uppercase tracking-wider font-semibold">
                    Banco de Dados
                  </div>
                  <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 mt-1">
                    {isSupabaseConfigured ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Supabase Conectado</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 text-amber-400" />
                        <span>Modo Local ({dataSource})</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h2 className="font-serif text-xl font-bold text-slate-100">
                  Gerenciar Publicações ({photos.length})
                </h2>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={fetchPhotos}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                  <span>Atualizar Lista</span>
                </button>

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sair</span>
                </button>
              </div>
            </div>

            {/* Photos List Table / Grid */}
            {photos.length === 0 ? (
              <div className="p-12 glass-panel rounded-3xl text-center text-slate-400 border border-amber-500/20">
                Nenhuma foto foi publicada no mural ainda.
              </div>
            ) : (
              <div className="glass-panel rounded-3xl overflow-hidden border border-amber-500/20 shadow-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-slate-950/80 text-amber-200/80 uppercase tracking-wider font-semibold border-b border-slate-800">
                      <tr>
                        <th className="py-3.5 px-4">Foto</th>
                        <th className="py-3.5 px-4">Autor</th>
                        <th className="py-3.5 px-4">Legenda</th>
                        <th className="py-3.5 px-4">Data/Hora</th>
                        <th className="py-3.5 px-4">Curtidas</th>
                        <th className="py-3.5 px-4 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-light">
                      {photos.map((photo) => (
                        <tr key={photo.id} className="hover:bg-slate-900/40 transition-colors">
                          <td className="py-3 px-4">
                            <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-black border border-amber-500/30">
                              <Image
                                src={photo.image_url}
                                alt="Thumbnail"
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            </div>
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-200">
                            {photo.author || "Convidado Especial"}
                          </td>
                          <td className="py-3 px-4 max-w-xs truncate text-slate-300">
                            {photo.caption ? `"${photo.caption}"` : "-"}
                          </td>
                          <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                            {formatTimeAgo(photo.created_at)}
                          </td>
                          <td className="py-3 px-4 text-amber-300 font-bold">
                            {photo.likes_count || 0} ❤️
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => handleDeletePhoto(photo.id)}
                              className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition-colors"
                              title="Excluir publicação"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
