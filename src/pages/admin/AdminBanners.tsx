import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";

const AdminBanners = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    image_url: "",
    title: "",
    subtitle: "",
    link: "",
    is_active: true,
    display_order: 0,
    overlay_type: "green" as "green" | "gold" | "none",
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

  const resetForm = () => {
    setForm({ image_url: "", title: "", subtitle: "", link: "", is_active: true, display_order: 0, overlay_type: "green" });
    setEditingId(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (banner: any) => {
    setForm({
      image_url: banner.image_url,
      title: banner.title || "",
      subtitle: banner.subtitle || "",
      link: banner.link || "",
      is_active: banner.is_active,
      display_order: banner.display_order,
      overlay_type: banner.overlay_type || "green",
    });
    setEditingId(banner.id);
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.image_url.trim()) {
      toast({ title: "Please enter an image URL", variant: "destructive" });
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
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Banner" : "Add Banner"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Image URL *</Label>
                <Input
                  value={form.image_url}
                  onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                  placeholder="https://example.com/banner.jpg"
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
                <Label>Overlay Type</Label>
                <Select 
                  value={form.overlay_type} 
                  onValueChange={(v: "green" | "gold" | "none") => setForm({ ...form, overlay_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select overlay" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="green">Green (Default)</SelectItem>
                    <SelectItem value="gold">Gold</SelectItem>
                    <SelectItem value="none">None (Dark)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
          {banners.map((banner) => (
            <Card key={banner.id}>
              <CardContent className="p-4">
                <div className="flex gap-4 items-center">
                  <div className="w-32 h-20 rounded-md overflow-hidden bg-muted flex-shrink-0">
                    <img src={banner.image_url} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{banner.title || "No title"}</h3>
                    <p className="text-sm text-muted">{banner.subtitle || "No subtitle"}</p>
                    <p className="text-xs text-muted mt-1">Order: {banner.display_order}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(banner)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteMutation.mutate(banner.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted">
          <p>No banners yet</p>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminBanners;
