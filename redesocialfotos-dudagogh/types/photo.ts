export interface Photo {
  id: string;
  image_url: string;
  author: string;
  caption: string;
  likes_count: number;
  liked_by: string[]; // List of session IDs that liked this photo
  session_id?: string; // Session ID of the creator (for permission to delete own photo)
  created_at: string;
}

export interface CreatePhotoPayload {
  image_url: string;
  author?: string;
  caption?: string;
  session_id: string;
}

export type SortMode = "recent" | "highlights"; // recent = newest first, highlights = most liked first

export interface AdminAuth {
  isAuthenticated: boolean;
  token?: string;
}
