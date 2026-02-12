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
import { Plus, Pencil, Trash2, Loader2, Search, Package, AlertTriangle } from "lucide-react";
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
  stock_quantity: string;
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
  stock_quantity: "0",
};

const AdminProducts = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [restockDialogOpen, setRestockDialogOpen] = useState(false);
  const [restockProduct, setRestockProduct] = useState<any>(null);
  const [restockAmount, setRestockAmount] = useState("");
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
        stock_quantity: parseInt(data.stock_quantity) || 0,
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

  const restockMutation = useMutation({
    mutationFn: async ({ id, amount }: { id: string; amount: number }) => {
      const { data: product } = await supabase
        .from("products")
        .select("stock_quantity")
        .eq("id", id)
        .single();
      
      const newStock = (product?.stock_quantity || 0) + amount;
      
      const { error } = await supabase
        .from("products")
        .update({ stock_quantity: newStock })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast({ title: "Stock updated!" });
      setRestockDialogOpen(false);
      setRestockProduct(null);
      setRestockAmount("");
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
      stock_quantity: product.stock_quantity?.toString() || "0",
    });
    setEditingId(product.id);
    setIsDialogOpen(true);
  };

  const handleRestock = (product: any) => {
    setRestockProduct(product);
    setRestockAmount("");
    setRestockDialogOpen(true);
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

  const lowStockCount = products.filter((p) => p.stock_quantity === 1).length;

  return (
    <AdminLayout title="Products">
      {/* Low Stock Alert */}
      {lowStockCount > 0 && (
        <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive" />
         <span className="text-sm text-destructive font-medium animate-pulse">
            ⚠️ {lowStockCount} product(s) have only 1 item left in stock - restock soon!
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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

              <div className="grid md:grid-cols-3 gap-4">
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
                <div className="space-y-2">
                  <Label>Stock Quantity *</Label>
                  <Input
                    type="number"
                    min="0"
                    value={form.stock_quantity}
                    onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })}
                    placeholder="0"
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
                  folder="products"
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

      {/* Restock Dialog */}
      <Dialog open={restockDialogOpen} onOpenChange={setRestockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restock {restockProduct?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Current stock: <span className="font-medium text-foreground">{restockProduct?.stock_quantity || 0}</span>
            </div>
            <div className="space-y-2">
              <Label>Add Stock Quantity</Label>
              <Input
                type="number"
                min="1"
                value={restockAmount}
                onChange={(e) => setRestockAmount(e.target.value)}
                placeholder="Enter quantity to add"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setRestockDialogOpen(false)}>Cancel</Button>
              <Button
                onClick={() => {
                  const amount = parseInt(restockAmount);
                  if (amount > 0 && restockProduct) {
                    restockMutation.mutate({ id: restockProduct.id, amount });
                  }
                }}
                disabled={restockMutation.isPending || !restockAmount || parseInt(restockAmount) < 1}
              >
                {restockMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Add Stock
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Products Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product) => {
            const isLowStock = product.stock_quantity === 1;
            const isOutOfStock = product.stock_quantity === 0;
            
            return (
              <Card key={product.id} className={isOutOfStock ? "border-destructive/50" : isLowStock ? "border-destructive/40" : ""}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="w-20 h-20 rounded-md overflow-hidden bg-muted flex-shrink-0 relative">
                      {product.image_urls?.[0] ? (
                        <img src={product.image_urls[0]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">No image</div>
                      )}
                      {isOutOfStock && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <span className="text-xs text-white font-medium">Out of Stock</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">{product.name}</h3>
                      <p className="text-sm text-muted-foreground truncate">{product.categories?.name || "Uncategorized"}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-gold font-bold">
                          ৳{(product.discount_price || product.price).toLocaleString()}
                        </span>
                        {product.discount_price && (
                          <span className="text-sm text-muted-foreground line-through">৳{product.price}</span>
                        )}
                      </div>
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {product.is_featured && <Badge variant="secondary" className="text-xs">Featured</Badge>}
                        {!product.is_active && <Badge variant="destructive" className="text-xs">Inactive</Badge>}
                        {isOutOfStock ? (
                          <Badge variant="destructive" className="text-xs">Out of Stock</Badge>
                        ) : isLowStock ? (
                          <Badge className="text-xs bg-destructive/20 text-destructive animate-pulse">Only 1 Left!</Badge>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  
                  {/* Stock Info */}
                  <div className="mt-3 pt-3 border-t border-border grid grid-cols-3 gap-2 text-center text-xs">
                    <div>
                      <p className="text-muted-foreground">Stock</p>
                      <p className={`font-semibold ${isOutOfStock ? "text-destructive" : isLowStock ? "text-destructive" : "text-foreground"}`}>
                        {product.stock_quantity}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Sold</p>
                      <p className="font-semibold text-foreground">{product.sold_count || 0}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Available</p>
                      <p className="font-semibold text-foreground">{product.stock_quantity}</p>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => handleEdit(product)}>
                      <Pencil className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleRestock(product)}>
                      <Package className="h-4 w-4" />
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
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <p>No products found</p>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminProducts;
