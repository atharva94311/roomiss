"use client";

import { nanoid } from "nanoid";
import { supabase } from "./client";

const MAX_SLIP_BYTES = 10 * 1024 * 1024;       // 10 MB
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;      // 5 MB
const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;  // 5 MB

const SLIP_TYPES = ["application/pdf", "image/jpeg", "image/png"];
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

function sanitizeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(-80);
}

async function currentUserId(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("not_authenticated");
  return data.user.id;
}

export interface UploadResult {
  path: string;        // bucket-relative path
  publicUrl?: string;  // only for public buckets (avatars)
}

/**
 * Uploads a verification slip to the private `slips` bucket under the user's
 * own folder. Returns the bucket-relative path. Admins fetch a signed URL via
 * {@link signedSlipUrl} to display it.
 */
export async function uploadSlip(file: File): Promise<UploadResult> {
  if (file.size > MAX_SLIP_BYTES) throw new Error("slip_too_large");
  if (!SLIP_TYPES.includes(file.type)) throw new Error("slip_wrong_type");
  const uid = await currentUserId();
  const path = `${uid}/${nanoid(10)}-${sanitizeName(file.name)}`;
  const { error } = await supabase.storage.from("slips").upload(path, file, {
    cacheControl: "3600", upsert: false, contentType: file.type,
  });
  if (error) throw error;
  return { path };
}

export async function signedSlipUrl(path: string, expiresInSec = 60): Promise<string> {
  const cleaned = path.replace(/^slips:\/\//, "").replace(/^slips\//, "");
  const { data, error } = await supabase.storage.from("slips")
    .createSignedUrl(cleaned, expiresInSec);
  if (error) throw error;
  return data.signedUrl;
}

/**
 * Uploads an avatar to the public `avatars` bucket. Returns both the path and
 * the public URL (safe to embed directly in <img src>).
 */
export async function uploadAvatar(file: File): Promise<UploadResult> {
  if (file.size > MAX_AVATAR_BYTES) throw new Error("avatar_too_large");
  if (!IMAGE_TYPES.includes(file.type)) throw new Error("avatar_wrong_type");
  const uid = await currentUserId();
  const path = `${uid}/${nanoid(10)}-${sanitizeName(file.name)}`;
  const { error } = await supabase.storage.from("avatars").upload(path, file, {
    cacheControl: "3600", upsert: false, contentType: file.type,
  });
  if (error) throw error;
  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  return { path, publicUrl: data.publicUrl };
}

/**
 * Uploads a chat image attachment to the private `attachments` bucket scoped
 * under the chat id. RLS on `storage.objects` enforces that only current
 * participants of that chat can read.
 */
export async function uploadAttachment(chatId: string, file: File): Promise<UploadResult> {
  if (file.size > MAX_ATTACHMENT_BYTES) throw new Error("attachment_too_large");
  if (!IMAGE_TYPES.includes(file.type)) throw new Error("attachment_wrong_type");
  const uid = await currentUserId();
  const path = `${chatId}/${uid}/${nanoid(10)}-${sanitizeName(file.name)}`;
  const { error } = await supabase.storage.from("attachments").upload(path, file, {
    cacheControl: "3600", upsert: false, contentType: file.type,
  });
  if (error) throw error;
  return { path };
}

export async function signedAttachmentUrl(path: string, expiresInSec = 120): Promise<string> {
  const cleaned = path.replace(/^attachments\//, "");
  const { data, error } = await supabase.storage.from("attachments")
    .createSignedUrl(cleaned, expiresInSec);
  if (error) throw error;
  return data.signedUrl;
}
