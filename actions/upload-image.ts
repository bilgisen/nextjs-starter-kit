// app/actions/upload-image.ts
"use server";

import { uploadImageAssets } from "@/lib/upload/r2";

export async function uploadImage(formData: FormData) {
  const file = formData.get("file") as File;
  if (!file || !file.name) {
    throw new Error("No file provided");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const key = `${Date.now()}-${file.name}`;
  const url = await uploadImageAssets(buffer, key);
  return { url };
}
