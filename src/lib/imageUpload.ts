import { supabase } from "@/lib/supabase";

const MAX_DIMENSION = 1200;
const QUALITY = 0.8;

/**
 * Compress and resize an image using canvas
 * Outputs WebP format for better compression
 */
async function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    img.onload = () => {
      let { width, height } = img;

      // Calculate new dimensions maintaining aspect ratio
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width > height) {
          height = (height / width) * MAX_DIMENSION;
          width = MAX_DIMENSION;
        } else {
          width = (width / height) * MAX_DIMENSION;
          height = MAX_DIMENSION;
        }
      }

      canvas.width = width;
      canvas.height = height;

      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      // Draw image with white background (for transparency)
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to WebP blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Could not compress image"));
          }
        },
        "image/webp",
        QUALITY
      );
    };

    img.onerror = () => reject(new Error("Could not load image"));

    // Load the image from file
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

/**
 * Generate a unique filename with timestamp
 */
function generateFilename(originalName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = "webp"; // Always WebP after compression
  const baseName = originalName.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9]/g, "-").substring(0, 50);
  return `${baseName}-${timestamp}-${random}.${extension}`;
}

/**
 * Upload an image to Supabase Storage with compression
 * @param file - The image file to upload
 * @param folder - Optional subfolder within the bucket
 * @returns The public URL of the uploaded image
 */
export async function uploadImageToStorage(file: File, folder: string = ""): Promise<string> {
  // Compress the image
  const compressedBlob = await compressImage(file);
  
  // Generate unique filename
  const filename = generateFilename(file.name);
  const path = folder ? `${folder}/${filename}` : filename;

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from("product-images")
    .upload(path, compressedBlob, {
      contentType: "image/webp",
      cacheControl: "31536000", // 1 year cache
      upsert: false,
    });

  if (error) {
    console.error("Storage upload error:", error);
    throw new Error(error.message || "Failed to upload image");
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from("product-images")
    .getPublicUrl(data.path);

  return publicUrl;
}

/**
 * Delete an image from Supabase Storage
 * @param url - The public URL of the image to delete
 */
export async function deleteImageFromStorage(url: string): Promise<void> {
  // Extract the path from the URL
  const bucketUrl = supabase.storage.from("product-images").getPublicUrl("").data.publicUrl;
  const path = url.replace(bucketUrl, "");
  
  if (!path) return;

  const { error } = await supabase.storage
    .from("product-images")
    .remove([path]);

  if (error) {
    console.error("Storage delete error:", error);
    // Don't throw - deletion failures shouldn't block operations
  }
}
