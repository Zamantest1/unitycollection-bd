import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Upload, X, ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { uploadImageToStorage } from "@/lib/imageUpload";
import {
  SAMPLE_SIZE_GUIDES,
  findSampleSizeGuide,
} from "@/lib/sampleSizeGuides";

interface SizeGuideFieldProps {
  value: string | null | undefined;
  onChange: (url: string | null) => void;
}

/**
 * Compact picker for the size-guide image on a product.
 *
 * Three ways to populate the field:
 *  1. Pick one of the bundled sample charts (instant, no upload).
 *  2. Upload your own image (Supabase Storage, with compression).
 *  3. Paste a URL.
 *
 * The current value is always rendered as a small thumbnail with a
 * remove button. The storefront product page hides this section
 * entirely if the field is empty, so it's safe to leave blank.
 */
export function SizeGuideField({ value, onChange }: SizeGuideFieldProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [pasteUrl, setPasteUrl] = useState("");

  const sample = findSampleSizeGuide(value);

  const handleSamplePick = (key: string) => {
    if (key === "_none") {
      onChange(null);
      return;
    }
    const found = SAMPLE_SIZE_GUIDES.find((s) => s.key === key);
    if (found) onChange(found.url);
  };

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({ title: "Pick an image file", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const url = await uploadImageToStorage(file, "size-guides");
      onChange(url);
      toast({ title: "Size guide uploaded" });
    } catch (e) {
      toast({
        title: "Upload failed",
        description: e instanceof Error ? e.message : "Try a different file",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handlePaste = () => {
    const trimmed = pasteUrl.trim();
    if (!trimmed) return;
    try {
      // Allow site-relative paths (starts with `/`) too.
      if (!trimmed.startsWith("/")) new URL(trimmed);
    } catch {
      toast({ title: "Not a valid URL", variant: "destructive" });
      return;
    }
    onChange(trimmed);
    setPasteUrl("");
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">
          Size guide image
        </Label>
        {value && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => onChange(null)}
            className="h-7 text-xs text-muted-foreground hover:text-destructive"
          >
            <X className="h-3.5 w-3.5 mr-1" />
            Remove
          </Button>
        )}
      </div>

      {/* Preview */}
      {value ? (
        <div className="rounded-md border border-input bg-muted/30 p-3 flex items-center gap-3">
          <div className="h-16 w-24 rounded bg-background ring-1 ring-border overflow-hidden flex items-center justify-center shrink-0">
            <img
              src={value}
              alt="Size guide preview"
              className="max-h-full max-w-full object-contain"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-foreground truncate">
              {sample ? sample.label : "Custom size guide"}
            </p>
            <p className="text-[11px] text-muted-foreground truncate">{value}</p>
          </div>
        </div>
      ) : (
        <div className="rounded-md border border-dashed border-input bg-muted/20 p-3 flex items-center gap-2 text-xs text-muted-foreground">
          <ImageIcon className="h-4 w-4" />
          No size guide selected — customers will see only your sizes list.
        </div>
      )}

      {/* Sample picker */}
      <div className="space-y-1">
        <Label className="text-[11px] text-muted-foreground">
          Or pick a starter chart
        </Label>
        <Select
          value={sample?.key ?? "_none"}
          onValueChange={handleSamplePick}
        >
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Pick a sample size chart" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_none">No sample (use my own)</SelectItem>
            {SAMPLE_SIZE_GUIDES.map((g) => (
              <SelectItem key={g.key} value={g.key}>
                {g.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Upload */}
      <div className="space-y-1">
        <Label className="text-[11px] text-muted-foreground">
          Or upload your own
        </Label>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.target.value = "";
            }}
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="h-9"
          >
            {uploading ? (
              <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
            ) : (
              <Upload className="h-3.5 w-3.5 mr-2" />
            )}
            Upload image
          </Button>
          <span className="text-[11px] text-muted-foreground">
            JPEG, PNG, WebP, or SVG.
          </span>
        </div>
      </div>

      {/* Paste URL */}
      <div className="space-y-1">
        <Label className="text-[11px] text-muted-foreground">Or paste a URL</Label>
        <div className="flex items-center gap-2">
          <Input
            value={pasteUrl}
            onChange={(e) => setPasteUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handlePaste();
              }
            }}
            placeholder="https://… or /size-guides/yours.svg"
            className="h-9 text-xs"
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handlePaste}
            disabled={!pasteUrl.trim()}
            className="h-9"
          >
            Use URL
          </Button>
        </div>
      </div>
    </div>
  );
}
