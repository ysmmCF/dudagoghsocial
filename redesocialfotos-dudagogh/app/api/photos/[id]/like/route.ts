import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import { Photo } from "@/types/photo";
import fs from "fs";
import path from "path";

const DB_FILE = path.join(process.cwd(), "data", "photos.json");

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

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const sessionId = body.sessionId || "anonymous";

    if (!id) {
      return NextResponse.json({ error: "ID da foto inválido." }, { status: 400 });
    }

    if (isSupabaseConfigured && supabase) {
      // 1. Fetch current photo record from Supabase
      const { data: photo, error: fetchError } = await supabase
        .from("photos")
        .select("*")
        .eq("id", id)
        .single();

      if (!fetchError && photo) {
        let likedBy: string[] = Array.isArray(photo.liked_by) ? photo.liked_by : [];
        let newLikesCount = photo.likes_count || 0;
        let isLiked = likedBy.includes(sessionId);

        if (isLiked) {
          // Unlike
          likedBy = likedBy.filter((sid) => sid !== sessionId);
          newLikesCount = Math.max(0, newLikesCount - 1);
        } else {
          // Like
          likedBy.push(sessionId);
          newLikesCount += 1;
        }

        const { data: updatedPhoto, error: updateError } = await supabase
          .from("photos")
          .update({
            likes_count: newLikesCount,
            liked_by: likedBy,
          })
          .eq("id", id)
          .select()
          .single();

        if (!updateError && updatedPhoto) {
          return NextResponse.json({ photo: updatedPhoto, isLiked: !isLiked });
        }
      }
    }

    // Local Persistence Fallback
    const photos = getLocalPhotos();
    const index = photos.findIndex((p) => p.id === id);

    if (index === -1) {
      return NextResponse.json({ error: "Publicação não encontrada." }, { status: 404 });
    }

    const targetPhoto = photos[index];
    let likedBy: string[] = Array.isArray(targetPhoto.liked_by) ? targetPhoto.liked_by : [];
    let likesCount = targetPhoto.likes_count || 0;
    let isLiked = likedBy.includes(sessionId);

    if (isLiked) {
      likedBy = likedBy.filter((sid) => sid !== sessionId);
      likesCount = Math.max(0, likesCount - 1);
    } else {
      likedBy.push(sessionId);
      likesCount += 1;
    }

    photos[index] = {
      ...targetPhoto,
      likes_count: likesCount,
      liked_by: likedBy,
    };

    saveLocalPhotos(photos);

    return NextResponse.json({ photo: photos[index], isLiked: !isLiked });
  } catch (error) {
    console.error("Like error:", error);
    return NextResponse.json({ error: "Erro ao processar curtida." }, { status: 500 });
  }
}
