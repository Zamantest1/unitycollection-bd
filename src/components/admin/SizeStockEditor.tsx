import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SizeStockEditorProps {
  /**
   * Per-size stock map. The key order in the underlying object is
   * authoritative for display order.
   */
  value: Record<string, number>;
  onChange: (next: Record<string, number>) => void;
  /** Suggested chips shown above the table. Click to add. */
  presets?: string[];
}

const DEFAULT_PRESETS = ["S", "M", "L", "XL", "XXL", "XXXL"];

/**
 * Compact per-size stock table.
 *
 * The total ("sum across sizes") is what should populate
 * `products.stock_quantity`. Callers compute that from the value
 * map so this component stays presentational.
 *
 * If the admin doesn't want size variants they just leave this
 * empty — the form falls back to the legacy single-stock input.
 */
export function SizeStockEditor({
  value,
  onChange,
  presets = DEFAULT_PRESETS,
}: SizeStockEditorProps) {
  const [newSize, setNewSize] = useState("");

  const sizes = Object.keys(value);
  const total = sizes.reduce((sum, s) => sum + (Number(value[s]) || 0), 0);

  const addSize = (size: string) => {
    const trimmed = size.trim();
    if (!trimmed) return;
    if (Object.prototype.hasOwnProperty.call(value, trimmed)) return;
    onChange({ ...value, [trimmed]: 0 });
    setNewSize("");
  };

  const removeSize = (size: string) => {
    const next = { ...value };
    delete next[size];
    onChange(next);
  };

  const updateSize = (size: string, qty: number) => {
    onChange({ ...value, [size]: Math.max(0, qty) });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">
          Stock by size
        </Label>
        <span className="text-xs text-muted-foreground">
          Total:{" "}
          <span
            className={cn(
              "font-semibold",
              total === 0 ? "text-destructive" : "text-foreground",
            )}
          >
            {total}
          </span>
        </span>
      </div>

      {/* Quick-add chips */}
      <div className="flex flex-wrap items-center gap-1.5">
        {presets.map((p) => {
          const already = Object.prototype.hasOwnProperty.call(value, p);
          return (
            <button
              key={p}
              type="button"
              onClick={() => addSize(p)}
              disabled={already}
              className={cn(
                "px-2.5 py-1 rounded-full text-xs font-medium border transition",
                already
                  ? "bg-muted text-muted-foreground border-transparent cursor-not-allowed"
                  : "border-border hover:border-foreground hover:bg-accent",
              )}
            >
              {already ? `✓ ${p}` : `+ ${p}`}
            </button>
          );
        })}
        <div className="flex items-center gap-1">
          <Input
            value={newSize}
            onChange={(e) => setNewSize(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addSize(newSize);
              }
            }}
            placeholder="Custom size"
            className="h-8 w-28 text-xs"
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => addSize(newSize)}
            className="h-8 px-2"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Editable size rows */}
      {sizes.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">
          No size variants yet. Use a chip above or type a custom size to add one.
          Leave blank if this product is one-size-only.
        </p>
      ) : (
        <div className="rounded-md border border-input divide-y divide-border bg-background">
          {sizes.map((size) => (
            <div
              key={size}
              className="flex items-center gap-2 p-2"
            >
              <span className="inline-flex h-7 min-w-[3rem] items-center justify-center rounded bg-muted px-2 text-xs font-semibold text-foreground">
                {size}
              </span>
              <Input
                type="number"
                min={0}
                value={value[size] ?? 0}
                onChange={(e) =>
                  updateSize(size, parseInt(e.target.value, 10) || 0)
                }
                className="h-8 max-w-[7rem] text-sm"
              />
              <span className="text-xs text-muted-foreground">in stock</span>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => removeSize(size)}
                className="h-7 w-7 p-0 ml-auto text-muted-foreground hover:text-destructive"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
