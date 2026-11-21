import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import { Photo } from "@/types/photo";
import fs from "fs";
import path from "path";

const DB_FILE = path.join(process.cwd(), "data", "photos.json");
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

function getLocalPhotos(): Photo[] {
  if (!fs.existsSync(DB_FILE)) return [];
  try {
    const content = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(content || "[]");
  } catch (err) {
    return [];
  }
}

function saveLocalPhotos(photos: Photo[]) {
  const dir = path.dirname(DB_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(DB_FILE, JSON.stringify(photos, null, 2), "utf-8");
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = req.headers.get("x-admin-pass");
    const sessionIdHeader = req.headers.get("x-session-id");
    const ADMIN_SECRET = process.env.ADMIN_PASSWORD || "duda15anos";

    const isAdmin = authHeader === ADMIN_SECRET;

    if (!id) {
      return NextResponse.json({ error: "ID da foto inválido." }, { status: 400 });
    }

    if (isSupabaseConfigured && supabase) {
      // Fetch photo details to check session ownership if not admin
      const { data: photo, error: fetchError } = await supabase
        .from("photos")
        .select("*")
        .eq("id", id)
        .single();

      if (fetchError || !photo) {
        return NextResponse.json({ error: "Foto não encontrada." }, { status: 404 });
      }

      const isOwner = sessionIdHeader && photo.session_id === sessionIdHeader;

      if (!isAdmin && !isOwner) {
        return NextResponse.json(
          { error: "Você não tem permissão para excluir esta foto." },
          { status: 403 }
        );
      }

      // Delete record from Supabase table
      const { data: deletedRows, error: deleteError } = await supabase
        .from("photos")
        .delete()
        .eq("id", id)
        .select("id");

      if (deleteError) {
        console.error("Supabase DB delete error:", deleteError);
        return NextResponse.json({ error: "O banco recusou a exclusão da foto." }, { status: 500 });
      }

      if (!deletedRows || deletedRows.length === 0) {
        return NextResponse.json(
          { error: "O banco não confirmou a exclusão. Verifique as permissões e tente novamente." },
          { status: 403 }
        );
      }

      // Only remove the image after the database confirms that its row is gone.
      if (photo.image_url) {
        try {
          const marker = "/storage/v1/object/public/memories/";
          const markerIndex = photo.image_url.indexOf(marker);
          if (markerIndex !== -1) {
            const objectPath = decodeURIComponent(photo.image_url.slice(markerIndex + marker.length).split("?")[0]);
            const { error: storageError } = await supabase.storage.from("memories").remove([objectPath]);
            if (storageError) console.error("Storage delete warning:", storageError);
          }
        } catch (e) {
          console.error("Storage delete warning:", e);
        }
      }

      return NextResponse.json({ success: true, message: "Foto excluída com sucesso." });
    }

    // Local Fallback Persistence Engine
    const photos = getLocalPhotos();
    const photo = photos.find((p) => p.id === id);

    if (!photo) {
      return NextResponse.json({ error: "Foto não encontrada." }, { status: 404 });
    }

    const isOwner = sessionIdHeader && photo.session_id === sessionIdHeader;

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: "Você não tem permissão para excluir esta foto." },
        { status: 403 }
      );
    }

    // Remove local file if it exists
    if (photo.image_url && photo.image_url.startsWith("/uploads/")) {
      const fileName = photo.image_url.replace("/uploads/", "");
      const filePath = path.join(UPLOAD_DIR, fileName);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (err) {
          console.error("Erro ao apagar arquivo local:", err);
        }
      }
    }

    const updatedPhotos = photos.filter((p) => p.id !== id);
    saveLocalPhotos(updatedPhotos);

    return NextResponse.json({ success: true, message: "Foto excluída com sucesso." });
  } catch (error) {
    console.error("Delete photo error:", error);
    return NextResponse.json({ error: "Erro ao excluir foto." }, { status: 500 });
  }
}
