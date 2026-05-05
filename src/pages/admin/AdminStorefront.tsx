import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Sparkles, ArrowRight, Loader2, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  DEFAULT_SPOTLIGHT,
  SPOTLIGHT_PRESETS,
  SPOTLIGHT_SETTING_KEY,
  getPresetColors,
  normaliseSpotlight,
  resolveSpotlightColors,
  type SpotlightColors,
  type SpotlightPresetKey,
  type SpotlightSettings,
} from "@/lib/editorialSpotlight";

const COLOR_LABELS: { key: keyof SpotlightColors; label: string; hint: string }[] = [
  { key: "bgFrom", label: "Gradient start", hint: "Top-left of the card" },
  { key: "bgTo", label: "Gradient end", hint: "Bottom-right of the card" },
  { key: "highlight", label: "Highlighted word", hint: "Color of the gold word in the headline" },
  { key: "eyebrow", label: "Eyebrow text", hint: "Tiny uppercase label color" },
  { key: "textColor", label: "Body text", hint: "Headline + subtitle color" },
  { key: "ctaPrimaryBg", label: "Primary button fill", hint: 'The "Shop now" button' },
  { key: "ctaPrimaryFg", label: "Primary button text", hint: "Text inside the primary button" },
];

const AdminStorefront = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<SpotlightSettings>(DEFAULT_SPOTLIGHT);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const { data, isLoading } = useQuery<SpotlightSettings>({
    queryKey: ["admin-editorial-spotlight"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("settings")
        .select("value")
        .eq("key", SPOTLIGHT_SETTING_KEY)
        .maybeSingle();
      if (error) throw error;
      return normaliseSpotlight(data?.value);
    },
  });

  // Keep the local draft in sync with the server-side value on first load
  // and after a successful save (when the query is re-fetched).
  useEffect(() => {
    if (data) {
      setDraft(data);
      setAdvancedOpen(data.presetKey === "custom");
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async (next: SpotlightSettings) => {
      const { error } = await supabase
        .from("settings")
        .upsert({
          key: SPOTLIGHT_SETTING_KEY,
          value: next as unknown as Record<string, unknown>,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-editorial-spotlight"] });
      // Storefront component uses its own queryKey — bust it so the
      // homepage picks up the new copy on next nav without a refresh.
      queryClient.invalidateQueries({ queryKey: ["editorial-spotlight"] });
      toast({ title: "Storefront updated" });
    },
    onError: (error: Error) => {
      toast({
        title: "Could not save",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onChoosePreset = (preset: SpotlightPresetKey) => {
    setAdvancedOpen(preset === "custom");
    setDraft((prev) => ({
      ...prev,
      presetKey: preset,
      // Snapshot the preset's colors into the draft so admins can then
      // tweak them in advanced without losing the starting point.
      colors:
        preset === "custom"
          ? prev.colors
          : { ...getPresetColors(preset) },
    }));
  };

  const updateColor = (key: keyof SpotlightColors, value: string) => {
    setDraft((prev) => ({
      ...prev,
      // Editing a colour automatically pivots the row into "custom" so
      // we don't silently drop their tweak the next time the preset
      // re-renders.
      presetKey: "custom",
      colors: { ...prev.colors, [key]: value },
    }));
  };

  const onResetToDefaults = () => {
    setDraft(DEFAULT_SPOTLIGHT);
    setAdvancedOpen(false);
  };

  const previewColors = resolveSpotlightColors(draft);

  return (
    <AdminLayout title="Storefront">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        {/* ---------- Editor ---------- */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  Homepage editorial spotlight
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  Promo card shown between Categories and Featured products.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="enabled" className="text-xs">
                  {draft.enabled ? "Visible" : "Hidden"}
                </Label>
                <Switch
                  id="enabled"
                  checked={draft.enabled}
                  onCheckedChange={(checked) =>
                    setDraft((p) => ({ ...p, enabled: checked }))
                  }
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Theme presets */}
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                  Theme
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {SPOTLIGHT_PRESETS.map((preset) => {
                    const isActive = draft.presetKey === preset.key;
                    const c = preset.colors;
                    return (
                      <button
                        key={preset.key}
                        type="button"
                        onClick={() => onChoosePreset(preset.key)}
                        className={cn(
                          "relative rounded-lg p-3 text-left text-xs font-medium transition-all border",
                          isActive
                            ? "border-foreground ring-2 ring-foreground/30"
                            : "border-border hover:border-muted-foreground/40",
                        )}
                        style={{
                          background: `linear-gradient(135deg, ${c.bgFrom}, ${c.bgTo})`,
                          color: c.textColor,
                        }}
                      >
                        <span
                          className="block text-[10px] uppercase tracking-[0.18em] mb-1"
                          style={{ color: c.eyebrow }}
                        >
                          {preset.key === "custom" ? "Custom" : "Theme"}
                        </span>
                        <span
                          className="block font-semibold"
                          style={{ color: c.textColor }}
                        >
                          {preset.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Pick a preset for one-click theming, or open Advanced below to
                  fine-tune individual colours.
                </p>
              </div>

              {/* Copy */}
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="eyebrow">Eyebrow (small label)</Label>
                  <Input
                    id="eyebrow"
                    value={draft.eyebrow}
                    onChange={(e) =>
                      setDraft((p) => ({ ...p, eyebrow: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="prefix">Headline (before highlight)</Label>
                  <Input
                    id="prefix"
                    value={draft.headlinePrefix}
                    onChange={(e) =>
                      setDraft((p) => ({ ...p, headlinePrefix: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="highlight">Highlighted word</Label>
                  <Input
                    id="highlight"
                    value={draft.headlineHighlight}
                    onChange={(e) =>
                      setDraft((p) => ({
                        ...p,
                        headlineHighlight: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="suffix">Headline (after highlight)</Label>
                  <Input
                    id="suffix"
                    value={draft.headlineSuffix}
                    onChange={(e) =>
                      setDraft((p) => ({ ...p, headlineSuffix: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="subtitle">Subtitle</Label>
                  <Textarea
                    id="subtitle"
                    rows={2}
                    value={draft.subtitle}
                    onChange={(e) =>
                      setDraft((p) => ({ ...p, subtitle: e.target.value }))
                    }
                  />
                </div>
              </div>

              {/* CTAs */}
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="cta1Label">Primary button label</Label>
                  <Input
                    id="cta1Label"
                    value={draft.ctaPrimaryLabel}
                    onChange={(e) =>
                      setDraft((p) => ({
                        ...p,
                        ctaPrimaryLabel: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cta1Href">Primary button URL</Label>
                  <Input
                    id="cta1Href"
                    value={draft.ctaPrimaryHref}
                    onChange={(e) =>
                      setDraft((p) => ({
                        ...p,
                        ctaPrimaryHref: e.target.value,
                      }))
                    }
                    placeholder="/shop or https://…"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cta2Label">Secondary button label</Label>
                  <Input
                    id="cta2Label"
                    value={draft.ctaSecondaryLabel}
                    onChange={(e) =>
                      setDraft((p) => ({
                        ...p,
                        ctaSecondaryLabel: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cta2Href">Secondary button URL</Label>
                  <Input
                    id="cta2Href"
                    value={draft.ctaSecondaryHref}
                    onChange={(e) =>
                      setDraft((p) => ({
                        ...p,
                        ctaSecondaryHref: e.target.value,
                      }))
                    }
                    placeholder="/categories or https://…"
                  />
                </div>
              </div>

              {/* Advanced color editor */}
              <div className="space-y-3 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={() => setAdvancedOpen((v) => !v)}
                  className="text-xs font-medium text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                >
                  {advancedOpen ? "▼" : "▶"} Advanced — pick custom colours
                </button>
                {advancedOpen && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {COLOR_LABELS.map(({ key, label, hint }) => (
                      <div key={key} className="space-y-1">
                        <Label className="text-xs">{label}</Label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={draft.colors[key]}
                            onChange={(e) => updateColor(key, e.target.value)}
                            className="h-9 w-12 rounded border border-border cursor-pointer bg-transparent"
                          />
                          <Input
                            value={draft.colors[key]}
                            onChange={(e) => updateColor(key, e.target.value)}
                            className="font-mono text-xs"
                          />
                        </div>
                        <p className="text-[11px] text-muted-foreground">{hint}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action row */}
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <Button
                  onClick={() => saveMutation.mutate(draft)}
                  disabled={saveMutation.isPending || isLoading}
                >
                  {saveMutation.isPending && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Save changes
                </Button>
                <Button
                  variant="outline"
                  onClick={onResetToDefaults}
                  disabled={saveMutation.isPending}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset to defaults
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ---------- Preview ---------- */}
        <div>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Live preview</CardTitle>
              <span className="text-[11px] text-muted-foreground">
                Reflects unsaved edits
              </span>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl bg-[#F5F4EE] p-4 md:p-6">
                <div
                  className="relative overflow-hidden rounded-2xl shadow-md ring-1"
                  style={{
                    background: `linear-gradient(135deg, ${previewColors.bgFrom} 0%, ${previewColors.bgTo} 100%)`,
                    color: previewColors.textColor,
                    ["--tw-ring-color" as string]: `${previewColors.highlight}40`,
                  }}
                >
                  <div
                    aria-hidden
                    className="absolute inset-0 opacity-[0.07] pointer-events-none"
                    style={{
                      backgroundImage: `linear-gradient(120deg, transparent 60%, ${previewColors.highlight} 60%, ${previewColors.highlight} 60.6%, transparent 60.6%)`,
                    }}
                  />
                  <div
                    aria-hidden
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: `radial-gradient(circle at 12% 0%, ${previewColors.highlight}22 0%, transparent 45%)`,
                    }}
                  />
                  <div className="relative flex flex-col md:flex-row items-center gap-3 md:gap-8 px-4 py-4 md:px-10 md:py-8">
                    <div className="text-center md:text-left flex-1 min-w-0">
                      <p
                        className="inline-flex items-center gap-1.5 text-[9px] md:text-[11px] uppercase tracking-[0.25em] md:tracking-[0.3em] mb-1.5 md:mb-2"
                        style={{ color: previewColors.eyebrow }}
                      >
                        <Sparkles className="h-2.5 w-2.5 md:h-3 md:w-3" />
                        {draft.eyebrow}
                      </p>
                      <h3
                        className="font-display text-[15px] md:text-2xl lg:text-3xl font-bold leading-snug md:leading-tight"
                        style={{ color: previewColors.textColor }}
                      >
                        {draft.headlinePrefix}
                        {draft.headlineHighlight && (
                          <>
                            {" "}
                            <span style={{ color: previewColors.highlight }}>
                              {draft.headlineHighlight}
                            </span>{" "}
                          </>
                        )}
                        {draft.headlineSuffix}
                      </h3>
                      <p
                        className="text-[12px] md:text-[15px] mt-1.5 md:mt-3 max-w-xl mx-auto md:mx-0 leading-snug"
                        style={{ color: `${previewColors.textColor}d9` }}
                      >
                        {draft.subtitle}
                      </p>
                    </div>
                    <div className="shrink-0 flex flex-row gap-2 md:gap-3 justify-center md:justify-end mt-1 md:mt-0">
                      <span
                        className="inline-flex items-center justify-center gap-1.5 rounded-full px-3.5 md:px-5 py-2 md:py-2.5 text-[12px] md:text-sm font-semibold"
                        style={{
                          background: previewColors.ctaPrimaryBg,
                          color: previewColors.ctaPrimaryFg,
                        }}
                      >
                        {draft.ctaPrimaryLabel}
                        <ArrowRight className="h-3.5 w-3.5 md:h-4 md:w-4" />
                      </span>
                      <span
                        className="inline-flex items-center justify-center rounded-full px-3.5 md:px-5 py-2 md:py-2.5 text-[12px] md:text-sm font-semibold"
                        style={{
                          border: `1px solid ${previewColors.highlight}99`,
                          color: previewColors.textColor,
                        }}
                      >
                        {draft.ctaSecondaryLabel}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <p className="mt-3 text-[11px] text-muted-foreground">
                Save to push changes live. Customers will see the new look on
                their next visit (cached for ~1 minute).
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminStorefront;
