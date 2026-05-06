import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Loader2, ArrowUp, ArrowDown } from "lucide-react";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";

interface CategoryRow {
  id: string;
  name: string;
}

interface AdminCategory {
  id: string;
  name: string;
  image_url: string | null;
  display_order: number;
}

const AdminCategories = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [pendingDelete, setPendingDelete] = useState<CategoryRow | null>(null);

  // `display_order` was added in 20260508010000_add_categories_display_order.sql.
  // If that migration hasn't been applied yet, ordering by it raises
  // "column display_order does not exist" and the page goes blank.
  // We try the ordered query first and gracefully fall back to a plain
  // alphabetical fetch so the page is never broken just because the
  // migration is pending.
  const { data: queryResult, isLoading } = useQuery<{
    rows: AdminCategory[];
    reorderEnabled: boolean;
  }>({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const ordered = await supabase
        .from("categories")
        .select("*")
        .order("display_order", { ascending: true })
        .order("name", { ascending: true });

      if (ordered.error) {
        // Postgres "column does not exist" code is 42703.
        // Anything that smells like a missing column → fall back.
        const msg = ordered.error.message?.toLowerCase() ?? "";
        const isMissingColumn =
          ordered.error.code === "42703" || msg.includes("display_order");
        if (!isMissingColumn) throw ordered.error;
        const fallback = await supabase
          .from("categories")
          .select("*")
          .order("name", { ascending: true });
        if (fallback.error) throw fallback.error;
        const rows = (fallback.data ?? []).map(
          (c: { id: string; name: string; image_url: string | null }) => ({
            id: c.id,
            name: c.name,
            image_url: c.image_url ?? null,
            display_order: 0,
          }),
        );
        return { rows, reorderEnabled: false };
      }

      const rows = (ordered.data ?? []).map(
        (c: { id: string; name: string; image_url: string | null; display_order?: number | null }) => ({
          id: c.id,
          name: c.name,
          image_url: c.image_url ?? null,
          display_order: c.display_order ?? 0,
        }),
      );
      return { rows, reorderEnabled: true };
    },
  });

  const categories = queryResult?.rows ?? [];
  const reorderEnabled = queryResult?.reorderEnabled ?? true;

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editingId) {
        const { error } = await supabase
          .from("categories")
          .update({ name, image_url: imageUrl || null })
          .eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("categories")
          .insert({ name, image_url: imageUrl || null });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      toast({ title: editingId ? "Category updated!" : "Category created!" });
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      toast({ title: "Category deleted!" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Swap display_order between two categories.  Two writes is the simplest
  // approach that doesn't need a custom RPC; collisions on the
  // display_order value are fine because there's no unique constraint.
  const reorderMutation = useMutation({
    mutationFn: async ({ a, b }: { a: AdminCategory; b: AdminCategory }) => {
      const { error: e1 } = await supabase
        .from("categories")
        .update({ display_order: b.display_order })
        .eq("id", a.id);
      if (e1) throw e1;
      const { error: e2 } = await supabase
        .from("categories")
        .update({ display_order: a.display_order })
        .eq("id", b.id);
      if (e2) throw e2;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      // Storefront also reads from `categories`; bust its cache too so
      // the home page mirror updates without a hard reload.
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Could not reorder",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const moveCategory = (index: number, direction: -1 | 1) => {
    const a = categories[index];
    const b = categories[index + direction];
    if (!a || !b) return;
    // If display_order ties (e.g. all 0 because the column was just
    // added), bump them to their visual indexes first so the swap
    // produces a visible change.
    if (a.display_order === b.display_order) {
      reorderMutation.mutate({
        a: { ...a, display_order: index },
        b: { ...b, display_order: index + direction },
      });
    } else {
      reorderMutation.mutate({ a, b });
    }
  };

  const resetForm = () => {
    setName("");
    setImageUrl("");
    setEditingId(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (category: AdminCategory) => {
    setName(category.name);
    setImageUrl(category.image_url || "");
    setEditingId(category.id);
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({ title: "Please enter a name", variant: "destructive" });
      return;
    }
    saveMutation.mutate();
  };

  return (
    <AdminLayout title="Categories">
      <div className="flex justify-end mb-6">
        <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) resetForm(); else setIsDialogOpen(true); }}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-gold hover:text-gold-foreground">
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Category" : "Add Category"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Category name"
                />
              </div>
              <div className="space-y-2">
                <Label>Category Image</Label>
                <ImageUpload
                  value={imageUrl}
                  onChange={setImageUrl}
                  folder="unity-collection/categories"
                  placeholder="Upload category image"
                />
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : categories.length > 0 ? (
        <>
          {reorderEnabled ? (
            <p className="text-xs text-muted-foreground mb-3">
              Use the arrow buttons to set the order categories appear in on the storefront.
            </p>
          ) : (
            <div className="mb-3 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              Reordering is disabled because the <code className="font-mono">display_order</code> column hasn't been applied yet. Run the latest Supabase migrations and refresh this page to enable up/down arrows.
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category, index) => {
              const canMoveUp = reorderEnabled && index > 0;
              const canMoveDown = reorderEnabled && index < categories.length - 1;
              return (
                <Card key={category.id}>
                  <CardContent className="p-4">
                    <div className="flex gap-4 items-center">
                      <div className="w-16 h-16 rounded-md overflow-hidden bg-muted flex-shrink-0">
                        {category.image_url ? (
                          <img src={category.image_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary to-secondary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground truncate">{category.name}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Position {index + 1}
                        </p>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-7 w-7"
                          onClick={() => moveCategory(index, -1)}
                          disabled={!canMoveUp || reorderMutation.isPending}
                          aria-label={`Move ${category.name} up`}
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-7 w-7"
                          onClick={() => moveCategory(index, 1)}
                          disabled={!canMoveDown || reorderMutation.isPending}
                          aria-label={`Move ${category.name} down`}
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => handleEdit(category)}>
                        <Pencil className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() =>
                          setPendingDelete({ id: category.id, name: category.name })
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <p className="font-medium">No categories yet</p>
          <p className="text-sm">Add your first category and you can reorder them with the arrow buttons.</p>
        </div>
      )}

      <DeleteConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title={`Delete "${pendingDelete?.name}"?`}
        description="Products in this category will need to be reassigned. This cannot be undone."
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

export default AdminCategories;
