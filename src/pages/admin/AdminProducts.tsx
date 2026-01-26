import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Loader2, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { MultiImageUpload } from "@/components/admin/MultiImageUpload";

interface ProductForm {
  name: string;
  description: string;
  price: string;
  discount_price: string;
  category_id: string;
  sizes: string;
  image_urls: string[];
  is_featured: boolean;
  is_active: boolean;
}

const defaultForm: ProductForm = {
  name: "",
  description: "",
  price: "",
  discount_price: "",
  category_id: "",
  sizes: "",
  image_urls: [],
  is_featured: false,
  is_active: true,
};

const AdminProducts = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(defaultForm);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name)")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name");
      
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: ProductForm) => {
      const productData = {
        name: data.name,
        description: data.description || null,
        price: parseFloat(data.price),
        discount_price: data.discount_price ? parseFloat(data.discount_price) : null,
        category_id: data.category_id || null,
        sizes: data.sizes ? data.sizes.split(",").map((s) => s.trim()) : [],
        image_urls: data.image_urls,
        is_featured: data.is_featured,
        is_active: data.is_active,
      };

      if (editingId) {
        const { error } = await supabase
          .from("products")
          .update(productData)
          .eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("products")
          .insert(productData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast({ title: editingId ? "Product updated!" : "Product created!" });
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast({ title: "Product deleted!" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setForm(defaultForm);
    setEditingId(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (product: any) => {
    setForm({
      name: product.name,
      description: product.description || "",
      price: product.price.toString(),
      discount_price: product.discount_price?.toString() || "",
      category_id: product.category_id || "",
      sizes: product.sizes?.join(", ") || "",
      image_urls: product.image_urls || [],
      is_featured: product.is_featured,
      is_active: product.is_active,
    });
    setEditingId(product.id);
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.price) {
      toast({ title: "Please fill required fields", variant: "destructive" });
      return;
    }
    saveMutation.mutate(form);
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout title="Products">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) resetForm(); else setIsDialogOpen(true); }}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-gold hover:text-gold-foreground">
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Product" : "Add Product"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Product name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Product description"
                  rows={3}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Price (৳) *</Label>
                  <Input
                    type="number"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Discount Price (৳)</Label>
                  <Input
                    type="number"
                    value={form.discount_price}
                    onChange={(e) => setForm({ ...form, discount_price: e.target.value })}
                    placeholder="Leave empty for no discount"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Sizes (comma separated)</Label>
                <Input
                  value={form.sizes}
                  onChange={(e) => setForm({ ...form, sizes: e.target.value })}
                  placeholder="S, M, L, XL"
                />
              </div>

              <div className="space-y-2">
                <Label>Product Images</Label>
                <MultiImageUpload
                  value={form.image_urls}
                  onChange={(urls) => setForm({ ...form, image_urls: urls })}
                  folder="unity-collection/products"
                  maxImages={10}
                />
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={form.is_featured}
                    onCheckedChange={(v) => setForm({ ...form, is_featured: v })}
                  />
                  <Label>Featured</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={form.is_active}
                    onCheckedChange={(v) => setForm({ ...form, is_active: v })}
                  />
                  <Label>Active</Label>
                </div>
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

      {/* Products Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product) => (
            <Card key={product.id}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="w-20 h-20 rounded-md overflow-hidden bg-muted flex-shrink-0">
                    {product.image_urls?.[0] ? (
                      <img src={product.image_urls[0]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted">No image</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{product.name}</h3>
                    <p className="text-sm text-muted truncate">{product.categories?.name || "Uncategorized"}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-gold font-bold">
                        ৳{(product.discount_price || product.price).toLocaleString()}
                      </span>
                      {product.discount_price && (
                        <span className="text-sm text-muted line-through">৳{product.price}</span>
                      )}
                    </div>
                    <div className="flex gap-1 mt-2">
                      {product.is_featured && <Badge variant="secondary" className="text-xs">Featured</Badge>}
                      {!product.is_active && <Badge variant="destructive" className="text-xs">Inactive</Badge>}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => handleEdit(product)}>
                    <Pencil className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteMutation.mutate(product.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted">
          <p>No products found</p>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminProducts;
