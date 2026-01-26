import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
  format: string;
  width: number;
  height: number;
}

// SHA-1 implementation for Cloudinary signature
async function sha1(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-1", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.log("No auth header found");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: authError } = await supabase.auth.getClaims(token);
    
    if (authError || !claims?.claims) {
      console.log("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user is admin
    const { data: isAdmin } = await supabase.rpc("is_admin");
    if (!isAdmin) {
      console.log("User is not admin");
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Accept both multipart/form-data (preferred) and JSON payloads (fallback)
    // JSON payload format:
    //   { folder: string, dataUri: string, fileType?: string, fileName?: string, fileSize?: number }
    let folder = "unity-collection";
    let file: File | null = null;
    let dataUri: string | null = null;
    let fileType: string | null = null;
    let fileName: string | null = null;
    let fileSize: number | null = null;

    try {
      const formData = await req.clone().formData();
      const maybeFile = formData.get("file");
      if (maybeFile instanceof File) {
        file = maybeFile;
        fileType = file.type;
        fileName = file.name;
        fileSize = file.size;
      }

      const maybeFolder = formData.get("folder");
      if (typeof maybeFolder === "string" && maybeFolder.trim()) {
        folder = maybeFolder.trim();
      }
    } catch (e) {
      console.log("formData parse failed, trying JSON payload", e);
      const payload = await req.json().catch(() => null) as any;
      if (payload && typeof payload === "object") {
        if (typeof payload.folder === "string" && payload.folder.trim()) {
          folder = payload.folder.trim();
        }
        if (typeof payload.dataUri === "string" && payload.dataUri.startsWith("data:")) {
          dataUri = payload.dataUri;
        }
        if (typeof payload.fileType === "string") fileType = payload.fileType;
        if (typeof payload.fileName === "string") fileName = payload.fileName;
        if (typeof payload.fileSize === "number") fileSize = payload.fileSize;
      }
    }

    if (!file && !dataUri) {
      console.log("No file/dataUri provided");
      return new Response(
        JSON.stringify({ error: "No file provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    const resolvedType = file?.type || fileType || "";
    if (resolvedType && !allowedTypes.includes(resolvedType)) {
      return new Response(
        JSON.stringify({ error: "Invalid file type. Allowed: JPEG, PNG, WebP, GIF" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    const resolvedSize = file?.size ?? fileSize;
    if (typeof resolvedSize === "number" && resolvedSize > maxSize) {
      return new Response(
        JSON.stringify({ error: "File too large. Maximum size is 10MB" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (file) {
      console.log(`Processing file: ${file.name}, type: ${file.type}, size: ${file.size}`);
    } else {
      console.log(`Processing JSON upload: name=${fileName ?? "(unknown)"}, type=${resolvedType || "(unknown)"}, size=${resolvedSize ?? "(unknown)"}`);
    }

    // Get Cloudinary credentials
    const cloudName = Deno.env.get("CLOUDINARY_CLOUD_NAME");
    const apiKey = Deno.env.get("CLOUDINARY_API_KEY");
    // support both env var spellings
    const apiSecret = Deno.env.get("CLOUDINARY_API_SECRET") ?? Deno.env.get("CLOUDINARY_API_Secret");

    console.log(`Cloudinary config - cloudName: ${cloudName ? "set" : "missing"}, apiKey: ${apiKey ? "set" : "missing"}, apiSecret: ${apiSecret ? "set" : "missing"}`);

    if (!cloudName || !apiKey || !apiSecret) {
      console.error("Missing Cloudinary credentials");
      return new Response(
        JSON.stringify({ error: "Cloudinary not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Convert file to data URI if needed
    if (!dataUri) {
      const arrayBuffer = await file!.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      const chunkSize = 0x8000;
      let binary = "";
      for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
      }
      const base64 = btoa(binary);
      dataUri = `data:${file!.type};base64,${base64}`;
    }

    // Generate timestamp and signature for Cloudinary
    const timestamp = Math.floor(Date.now() / 1000);
    
    // Cloudinary requires SHA-1 signature with specific format
    // Parameters must be sorted alphabetically
    const paramsToSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
    const signature = await sha1(paramsToSign);

    console.log(`Uploading to Cloudinary folder: ${folder}`);

    // Upload to Cloudinary
    const cloudinaryFormData = new FormData();
    cloudinaryFormData.append("file", dataUri);
    cloudinaryFormData.append("api_key", apiKey);
    cloudinaryFormData.append("timestamp", timestamp.toString());
    cloudinaryFormData.append("signature", signature);
    cloudinaryFormData.append("folder", folder);

    const cloudinaryResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: "POST",
        body: cloudinaryFormData,
      }
    );

    if (!cloudinaryResponse.ok) {
      const errorText = await cloudinaryResponse.text();
      console.error("Cloudinary upload failed:", errorText);
      return new Response(
        JSON.stringify({ error: "Failed to upload to Cloudinary", details: errorText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result: CloudinaryUploadResponse = await cloudinaryResponse.json();
    console.log(`Image uploaded successfully: ${result.secure_url}`);

    return new Response(
      JSON.stringify({
        url: result.secure_url,
        public_id: result.public_id,
        format: result.format,
        width: result.width,
        height: result.height,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Upload error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: "Internal server error", details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
