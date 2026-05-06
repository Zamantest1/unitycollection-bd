import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Loader2, Check, EyeOff } from "lucide-react";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { BANNER_OVERLAYS, DEFAULT_OVERLAY_ID, getOverlay } from "@/lib/bannerOverlays";
import { cn } from "@/lib/utils";

interface BannerRow {
  id: string;
  title: string | null;
}

const AdminBanners = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<BannerRow | null>(null);
  const [form, setForm] = useState({
    image_url: "",
    title: "",
    subtitle: "",
    link: "",
    is_active: true,
    display_order: 0,
    overlay_type: DEFAULT_OVERLAY_ID,
  });

  const { data: banners = [], isLoading } = useQuery({
    queryKey: ["admin-banners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("banners")
        .select("*")
        .order("display_order");
      
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editingId) {
        const { error } = await supabase
          .from("banners")
          .update(form)
          .eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("banners").insert(form);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-banners"] });
      toast({ title: editingId ? "Banner updated!" : "Banner created!" });
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("banners").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-banners"] });
      toast({ title: "Banner deleted!" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("banners")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-banners"] });
    },
    onError: (error: Error) => {
      toast({ title: "Could not update", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setForm({
      image_url: "",
      title: "",
      subtitle: "",
      link: "",
      is_active: true,
      display_order: 0,
      overlay_type: DEFAULT_OVERLAY_ID,
    });
    setEditingId(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (banner: {
    id: string;
    image_url: string;
    title: string | null;
    subtitle: string | null;
    link: string | null;
    is_active: boolean;
    display_order: number;
    overlay_type: string | null;
  }) => {
    setForm({
      image_url: banner.image_url,
      title: banner.title || "",
      subtitle: banner.subtitle || "",
      link: banner.link || "",
      is_active: banner.is_active,
      display_order: banner.display_order,
      overlay_type: banner.overlay_type || DEFAULT_OVERLAY_ID,
    });
    setEditingId(banner.id);
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.image_url.trim()) {
      toast({ title: "Please upload a banner image", variant: "destructive" });
      return;
    }
    saveMutation.mutate();
  };

  return (
    <AdminLayout title="Banners">
      <div className="flex justify-end mb-6">
        <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) resetForm(); else setIsDialogOpen(true); }}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-gold hover:text-gold-foreground">
              <Plus className="h-4 w-4 mr-2" />
              Add Banner
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Banner" : "Add Banner"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Banner Image *</Label>
                <ImageUpload
                  value={form.image_url}
                  onChange={(url) => setForm({ ...form, image_url: url })}
                  folder="unity-collection/banners"
                  placeholder="Upload banner image"
                />
              </div>
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Banner title"
                />
              </div>
              <div className="space-y-2">
                <Label>Subtitle</Label>
                <Input
                  value={form.subtitle}
                  onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                  placeholder="Banner subtitle"
                />
              </div>
              <div className="space-y-2">
                <Label>Link</Label>
                <Input
                  value={form.link}
                  onChange={(e) => setForm({ ...form, link: e.target.value })}
                  placeholder="/shop"
                />
              </div>
              <div className="space-y-2">
                <Label>Display Order</Label>
                <Input
                  type="number"
                  value={form.display_order}
                  onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Overlay colour</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {BANNER_OVERLAYS.map((opt) => {
                    const selected = form.overlay_type === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setForm({ ...form, overlay_type: opt.id })}
                        className={cn(
                          "group flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-xs transition-colors",
                          selected
                            ? "border-primary ring-2 ring-primary/30 bg-primary/5"
                            : "border-border hover:border-primary/40",
                        )}
                      >
                        <span
                          className="h-6 w-6 shrink-0 rounded-full border border-black/10 shadow-inner"
                          style={{ backgroundColor: opt.swatch }}
                          aria-hidden
                        />
                        <span className="flex-1 truncate font-medium text-foreground">
                          {opt.label}
                        </span>
                        {selected && <Check className="h-3.5 w-3.5 text-primary" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {form.image_url && (
                <div className="space-y-2">
                  <Label>Live preview</Label>
                  <div
                    className="relative h-32 w-full overflow-hidden rounded-lg bg-cover bg-center ring-1 ring-border"
                    style={{ backgroundImage: `url(${form.image_url})` }}
                  >
                    <div
                      className="absolute inset-0"
                      style={{ background: getOverlay(form.overlay_type).gradient }}
                    />
                    <div className="relative flex h-full items-center px-4 text-white">
                      <div className="max-w-[70%]">
                        {form.title && (
                          <p className="font-display text-base font-semibold leading-tight md:text-lg">
                            {form.title}
                          </p>
                        )}
                        {form.subtitle && (
                          <p className="mt-1 text-[11px] opacity-90 line-clamp-2">
                            {form.subtitle}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.is_active}
                  onCheckedChange={(v) => setForm({ ...form, is_active: v })}
                />
                <Label>Active</Label>
              </div>
              <div className="flex gap-2 justify-end pt-4">
                <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingId ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : banners.length > 0 ? (
        <div className="space-y-4">
          {banners.map((banner) => {
            const overlay = getOverlay(banner.overlay_type);
            return (
              <Card key={banner.id} className={cn(!banner.is_active && "opacity-60")}> 
                <CardContent className="p-4">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center">
                    <div
                      className="relative h-20 w-full flex-shrink-0 overflow-hidden rounded-md bg-cover bg-center md:w-32"
                      style={{ backgroundImage: `url(${banner.image_url})` }}
                    >
                      <div
                        className="absolute inset-0"
                        style={{ background: overlay.gradient }}
                        aria-hidden
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-foreground truncate">
                          {banner.title || "Untitled banner"}
                        </h3>
                        {banner.is_active ? (
                          <Badge variant="outline" className="border-emerald-400 text-emerald-700 bg-emerald-50">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-muted-foreground/30 text-muted-foreground">
                            <EyeOff className="h-3 w-3 mr-1" /> Hidden
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {banner.subtitle || "No subtitle"}
                      </p>
                      <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
                        <span>Order: {banner.display_order}</span>
                        <span className="inline-flex items-center gap-1.5">
                          <span
                            className="h-3 w-3 rounded-full border border-black/10"
                            style={{ backgroundColor: overlay.swatch }}
                            aria-hidden
                          />
                          {overlay.label}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-3 md:justify-end">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={banner.is_active}
                          onCheckedChange={(checked) =>
                            toggleActiveMutation.mutate({ id: banner.id, is_active: checked })
                          }
                          disabled={toggleActiveMutation.isPending}
                          aria-label="Toggle banner active"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(banner)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() =>
                            setPendingDelete({
                              id: banner.id,
                              title: banner.title,
                            })
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <p className="font-medium">No banners yet</p>
          <p className="text-sm">Add your first banner to feature it on the homepage carousel.</p>
        </div>
      )}

      <DeleteConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title={`Delete "${pendingDelete?.title || "this banner"}"?`}
        description="This banner will be removed from the home page immediately."
        isPending={deleteMutation.isPending}
        onConfirm={() => {
          if (pendingDelete) {
            deleteMutation.mutate(pendingDelete.id, {
              onSuccess: () => setPendingDelete(null),
            });
          }
        }}
      />
    </AdminLayout>
  );
};

export default AdminBanners;
