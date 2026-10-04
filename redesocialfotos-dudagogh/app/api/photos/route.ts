import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import { Photo } from "@/types/photo";
import fs from "fs";
import path from "path";

// File paths for local fallback storage engine
const DB_FILE = path.join(process.cwd(), "data", "photos.json");
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

function ensureLocalDirs() {
  const dataDir = path.dirname(DB_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify([]), "utf-8");
  }
}

function getLocalPhotos(): Photo[] {
  ensureLocalDirs();
  try {
    const content = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(content || "[]");
  } catch (err) {
    console.error("Erro ao ler banco local:", err);
    return [];
  }
}

function saveLocalPhotos(photos: Photo[]) {
  ensureLocalDirs();
  fs.writeFileSync(DB_FILE, JSON.stringify(photos, null, 2), "utf-8");
}

export async function GET() {
  try {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from("photos")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Supabase GET error, falling back:", error);
      } else if (data) {
        return NextResponse.json({ photos: data, source: "supabase" });
      }
    }

    // Fallback to local server persistent database
    const localPhotos = getLocalPhotos();
    return NextResponse.json({ photos: localPhotos, source: "local" });
  } catch (error) {
    console.error("GET photos error:", error);
    return NextResponse.json({ error: "Erro ao buscar publicações." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const author = (formData.get("author") as string) || "Convidado Especial";
    const caption = (formData.get("caption") as string) || "";
    const sessionId = (formData.get("sessionId") as string) || "anonymous";

    if (!file) {
      return NextResponse.json({ error: "Nenhuma foto foi selecionada." }, { status: 400 });
    }

    const fileExt = file.name.split(".").pop() || "webp";
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

    let imageUrl = "";

    if (isSupabaseConfigured && supabase) {
      // 1. Upload file to Supabase Storage
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const { data: storageData, error: storageError } = await supabase.storage
        .from("memories")
        .upload(fileName, buffer, {
          contentType: file.type || "image/webp",
          upsert: false,
        });

      if (storageError) {
        console.error("Supabase Storage upload error:", storageError);
      } else {
        const { data: publicUrlData } = supabase.storage
          .from("memories")
          .getPublicUrl(fileName);
        imageUrl = publicUrlData.publicUrl;

        // 2. Insert record into Supabase Database
        const { data: dbData, error: dbError } = await supabase
          .from("photos")
          .insert([
            {
              image_url: imageUrl,
              author: author.trim() || "Convidado Especial",
              caption: caption.trim(),
              likes_count: 0,
              liked_by: [],
              session_id: sessionId,
            },
          ])
          .select()
          .single();

        if (!dbError && dbData) {
          return NextResponse.json({ photo: dbData, source: "supabase" });
        }
        console.error("Supabase DB Insert Error:", dbError);
      }
    }

    // Local Fallback Storage Engine
    ensureLocalDirs();
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const localFilePath = path.join(UPLOAD_DIR, fileName);
    fs.writeFileSync(localFilePath, buffer);

    imageUrl = `/uploads/${fileName}`;

    const newPhoto: Photo = {
      id: "photo_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
      image_url: imageUrl,
      author: author.trim() || "Convidado Especial",
      caption: caption.trim(),
      likes_count: 0,
      liked_by: [],
      session_id: sessionId,
      created_at: new Date().toISOString(),
    };

    const photos = getLocalPhotos();
    photos.unshift(newPhoto);
    saveLocalPhotos(photos);

    return NextResponse.json({ photo: newPhoto, source: "local" });
  } catch (error) {
    console.error("POST photo error:", error);
    return NextResponse.json({ error: "Erro ao publicar foto." }, { status: 500 });
  }
}
