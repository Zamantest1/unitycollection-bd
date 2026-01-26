import { supabase } from "@/integrations/supabase/client";

function uint8ToBase64(bytes: Uint8Array) {
  const chunkSize = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

/**
 * Uploads an image via the backend function.
 * Tries multipart/form-data first, then falls back to JSON (dataUri) if needed.
 */
export async function uploadImageToCloudinary(file: File, folder: string) {
  // Attempt 1: multipart/form-data
  {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);

    const res = await supabase.functions.invoke("cloudinary-upload", {
      body: formData,
    });

    if (!res.error && res.data?.url) {
      return res.data.url as string;
    }
  }

  // Attempt 2: JSON dataUri payload
  const arrayBuffer = await file.arrayBuffer();
  const base64 = uint8ToBase64(new Uint8Array(arrayBuffer));
  const dataUri = `data:${file.type};base64,${base64}`;

  const res2 = await supabase.functions.invoke("cloudinary-upload", {
    body: {
      folder,
      dataUri,
      fileType: file.type,
      fileName: file.name,
      fileSize: file.size,
    },
  });

  if (res2.error) {
    throw new Error(res2.error.message || "Upload failed");
  }

  if (!res2.data?.url) {
    throw new Error("Upload failed");
  }

  return res2.data.url as string;
}
