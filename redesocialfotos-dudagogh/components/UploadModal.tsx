"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, Sparkles, User, MessageSquare, Loader2, Camera } from "lucide-react";
import confetti from "canvas-confetti";
import { compressImage } from "@/lib/utils/imageCompressor";
import { getGuestSessionId } from "@/lib/utils/session";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: () => void;
}

export default function UploadModal({
  isOpen,
  onClose,
  onUploadSuccess,
}: UploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [author, setAuthor] = useState("");
  const [caption, setCaption] = useState("");
  const [isCompressing, setIsCompressing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const resetForm = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setAuthor("");
    setCaption("");
    setErrorMsg("");
    setIsCompressing(false);
    setIsUploading(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMsg("Por favor, selecione um arquivo de imagem válido.");
      return;
    }

    setErrorMsg("");
    setIsCompressing(true);

    try {
      // Compress image client-side before previewing/uploading
      const { file: compressedFile, dataUrl } = await compressImage(file, {
        maxWidth: 1920,
        quality: 0.85,
      });

      setSelectedFile(compressedFile);
      setPreviewUrl(dataUrl);
    } catch (err: any) {
      console.error("Erro ao comprimir imagem:", err);
      // Fallback to uncompressed file preview
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    } finally {
      setIsCompressing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMsg("Selecione uma foto para publicar.");
      return;
    }

    setIsUploading(true);
    setErrorMsg("");

    try {
      const sessionId = getGuestSessionId();
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("author", author.trim() || "Convidado Especial");
      formData.append("caption", caption.trim());
      formData.append("sessionId", sessionId);

      const response = await fetch("/api/photos", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Falha ao enviar foto.");
      }

      // Fire celebratory starlight confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#f5b027", "#fde047", "#60a5fa", "#ffffff"],
      });

      onUploadSuccess();
      handleClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Ocorreu um erro ao tentar publicar. Tente novamente.");
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
        />

        {/* Dialog Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg glass-panel rounded-3xl p-6 sm:p-8 border border-amber-500/30 shadow-2xl z-10 my-auto"
        >
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-100 rounded-full bg-slate-900/60 border border-slate-700/50 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Modal Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl gold-gradient-bg flex items-center justify-center text-slate-950 shadow-md">
              <Camera className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-serif text-xl font-bold text-slate-100">
                Compartilhar Memória
              </h3>
              <p className="text-xs text-amber-200/70">
                Festa de 15 Anos da Eduarda
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* File Dropzone / Picker */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            {!previewUrl ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-48 border-2 border-dashed border-amber-500/30 hover:border-amber-400 rounded-2xl bg-slate-950/40 hover:bg-slate-900/60 flex flex-col items-center justify-center p-6 cursor-pointer transition-all group text-center"
              >
                <div className="w-14 h-14 rounded-full bg-slate-900 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform mb-3 shadow-lg">
                  {isCompressing ? (
                    <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
                  ) : (
                    <Upload className="w-6 h-6 stroke-[2]" />
                  )}
                </div>
                <p className="text-sm font-semibold text-slate-200 group-hover:text-amber-300">
                  {isCompressing
                    ? "Otimizando foto..."
                    : "Toque para escolher uma foto ou tirar foto"}
                </p>
                <p className="text-xs text-slate-400 font-light mt-1">
                  JPG, PNG ou WebP (otimização automática)
                </p>
              </div>
            ) : (
              <div className="relative w-full h-56 rounded-2xl overflow-hidden bg-slate-950 border border-amber-500/30 group">
                <Image
                  src={previewUrl}
                  alt="Pré-visualização da memória"
                  fill
                  className="object-contain"
                  unoptimized
                />
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewUrl(null);
                  }}
                  className="absolute top-3 right-3 px-3 py-1.5 rounded-full bg-slate-950/80 text-amber-300 text-xs font-semibold border border-amber-500/30 hover:bg-slate-900"
                >
                  Trocar foto
                </button>
              </div>
            )}

            {/* Author Input */}
            <div>
              <label className="block text-xs font-semibold text-amber-200/90 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-amber-400" />
                <span>Seu Nome (opcional)</span>
              </label>
              <input
                type="text"
                placeholder="Ex: Yasmim"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                maxLength={40}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 focus:border-amber-400 text-slate-100 text-sm placeholder-slate-500 outline-none transition-colors"
              />
            </div>

            {/* Caption Input */}
            <div>
              <label className="block text-xs font-semibold text-amber-200/90 mb-1.5 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                <span>Escreva uma legenda</span>
              </label>
              <textarea
                rows={3}
                placeholder="Uma noite inesquecível sob as estrelas..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                maxLength={300}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 focus:border-amber-400 text-slate-100 text-sm placeholder-slate-500 outline-none resize-none transition-colors"
              />
            </div>

            {/* Error banner */}
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium">
                {errorMsg}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isUploading || isCompressing || !selectedFile}
              className="w-full py-3 px-6 rounded-xl gold-gradient-bg text-slate-950 font-bold text-sm shadow-xl shadow-amber-500/25 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2 transition-all"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Publicando memória...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Publicar no Mural</span>
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
