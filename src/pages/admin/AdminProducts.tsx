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
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Search,
  Package,
  AlertTriangle,
  LayoutGrid,
  Rows3,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { MultiImageUpload } from "@/components/admin/MultiImageUpload";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { SizeStockEditor } from "@/components/admin/SizeStockEditor";
import { SizeGuideField } from "@/components/admin/SizeGuideField";
import { useLocalStoragePref } from "@/hooks/useLocalStoragePref";
import { cn } from "@/lib/utils";

type StockFilter = "all" | "out" | "low" | "in_stock";
type ViewMode = "card" | "grid";

interface ProductRow {
  id: string;
  name: string;
  product_code: string | null;
  stock_quantity: number;
  category_id: string | null;
  is_active: boolean;
}

interface ProductForm {
  name: string;
  description: string;
  price: string;
  discount_price: string;
  category_id: string;
  size_stock: Record<string, number>;
  image_urls: string[];
  size_guide_url: string | null;
  is_featured: boolean;
  is_active: boolean;
  /** Used only when size_stock is empty (single-stock product). */
  stock_quantity: string;
}

const defaultForm: ProductForm = {
  name: "",
  description: "",
  price: "",
  discount_price: "",
  category_id: "",
  size_stock: {},
  image_urls: [],
  size_guide_url: null,
  is_featured: false,
  is_active: true,
  stock_quantity: "0",
};

const AdminProducts = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [restockDialogOpen, setRestockDialogOpen] = useState(false);
  // Loose typing to keep this drop-in compatible with the legacy
  // restock dialog while we transition products to per-size stock.
  const [restockProduct, setRestockProduct] = useState<Record<string, unknown> | null>(null);
  const [restockAmount, setRestockAmount] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(defaultForm);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");
  const [pendingDelete, setPendingDelete] = useState<ProductRow | null>(null);
  const [view, setView] = useLocalStoragePref<ViewMode>(
    "admin-products-view",
    "card",
  );

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
      // Per-size stock is the source of truth when populated; the
      // single stock_quantity field is only used for one-size products.
      const sizeKeys = Object.keys(data.size_stock);
      const totalFromSizes = sizeKeys.reduce(
        (sum, s) => sum + (Number(data.size_stock[s]) || 0),
        0,
      );
      const productData = {
        name: data.name,
        description: data.description || null,
        price: parseFloat(data.price),
        discount_price: data.discount_price ? parseFloat(data.discount_price) : null,
        category_id: data.category_id || null,
        sizes: sizeKeys,
        size_stock: data.size_stock,
        size_guide_url: data.size_guide_url,
        image_urls: data.image_urls,
        is_featured: data.is_featured,
        is_active: data.is_active,
        stock_quantity:
          sizeKeys.length > 0
            ? totalFromSizes
            : parseInt(data.stock_quantity) || 0,
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
          .insert(productData as never);
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

  const handleEdit = (product: Record<string, unknown>) => {
    const sizes = (product.sizes as string[] | null) || [];
    const storedMap = (product.size_stock as Record<string, number> | null) || {};
    // If the row predates size_stock but still has sizes[], seed the
    // map with zeroes so the editor has rows to edit.
    const seeded: Record<string, number> = { ...storedMap };
    sizes.forEach((s) => {
      if (!Object.prototype.hasOwnProperty.call(seeded, s)) seeded[s] = 0;
    });

    setForm({
      name: product.name as string,
      description: (product.description as string) || "",
      price: String(product.price ?? ""),
      discount_price: product.discount_price ? String(product.discount_price) : "",
      category_id: (product.category_id as string) || "",
      size_stock: seeded,
      image_urls: (product.image_urls as string[]) || [],
      size_guide_url: (product.size_guide_url as string) || null,
      is_featured: Boolean(product.is_featured),
      is_active: Boolean(product.is_active),
      stock_quantity: String(product.stock_quantity ?? 0),
    });
    setEditingId(product.id as string);
    setIsDialogOpen(true);
  };

  const handleRestock = (product: Record<string, unknown>) => {
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

  const filteredProducts = products.filter((p) => {
    const q = searchQuery.toLowerCase();
    const matchesQuery =
      !q ||
      p.name.toLowerCase().includes(q) ||
      (p.product_code as string)?.toLowerCase().includes(q);
    const matchesCategory =
      categoryFilter === "all" || p.category_id === categoryFilter;
    const stock = p.stock_quantity ?? 0;
    const matchesStock =
      stockFilter === "all" ||
      (stockFilter === "out" && stock === 0) ||
      (stockFilter === "low" && stock > 0 && stock <= 3) ||
      (stockFilter === "in_stock" && stock > 3);
    return matchesQuery && matchesCategory && matchesStock;
  });

  const lowStockCount = products.filter(
    (p) => p.stock_quantity > 0 && p.stock_quantity <= 3,
  ).length;
  const outOfStockCount = products.filter(
    (p) => p.stock_quantity === 0,
  ).length;

  const sizeKeyCount = Object.keys(form.size_stock).length;

  return (
    <AdminLayout title="Products">
      {/* Low / out-of-stock alert */}
      {(lowStockCount > 0 || outOfStockCount > 0) && (
        <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-3 flex-wrap">
          <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
          <span className="text-sm text-destructive font-medium">
            {outOfStockCount > 0 && `${outOfStockCount} out of stock`}
            {outOfStockCount > 0 && lowStockCount > 0 && " · "}
            {lowStockCount > 0 && `${lowStockCount} low (≤3 left)`}
            {" — restock soon."}
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
        <div className="flex flex-col md:flex-row gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full md:w-44">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={stockFilter}
            onValueChange={(v) => setStockFilter(v as StockFilter)}
          >
            <SelectTrigger className="w-full md:w-44">
              <SelectValue placeholder="Stock" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All stock</SelectItem>
              <SelectItem value="in_stock">In stock (&gt;3)</SelectItem>
              <SelectItem value="low">Low (≤3)</SelectItem>
              <SelectItem value="out">Out of stock</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          {/* Card / grid view toggle (preference saved per browser) */}
          <div className="inline-flex rounded-md border border-input bg-background p-0.5">
            <button
              type="button"
              onClick={() => setView("card")}
              title="Card view"
              className={cn(
                "inline-flex items-center justify-center h-8 w-8 rounded text-muted-foreground transition-colors",
                view === "card"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted",
              )}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setView("grid")}
              title="Compact list"
              className={cn(
                "inline-flex items-center justify-center h-8 w-8 rounded text-muted-foreground transition-colors",
                view === "grid"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted",
              )}
            >
              <Rows3 className="h-4 w-4" />
            </button>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) resetForm(); else setIsDialogOpen(true); }}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:bg-gold hover:text-gold-foreground">
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit Product" : "Add Product"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-5">
                {editingId && (
                  <div className="p-3 bg-muted rounded-md">
                    <p className="text-xs text-muted-foreground">Product Code</p>
                    <p className="font-mono font-semibold text-foreground">{products.find(p => p.id === editingId)?.product_code as string}</p>
                  </div>
                )}
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
                  <RichTextEditor
                    value={form.description}
                    onChange={(html) => setForm({ ...form, description: html })}
                    placeholder="Describe the product. Paste from anywhere — formatting is preserved."
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Use the toolbar for headings, lists and links. Cmd/Ctrl+B for bold,
                    Cmd/Ctrl+I for italic.
                  </p>
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
                    <Label>
                      Stock {sizeKeyCount > 0 && (
                        <span className="text-xs text-muted-foreground font-normal">
                          (auto from sizes)
                        </span>
                      )}
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      value={form.stock_quantity}
                      onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })}
                      placeholder="0"
                      disabled={sizeKeyCount > 0}
                    />
                  </div>
                </div>

                <div className="rounded-md border border-border bg-muted/20 p-3">
                  <SizeStockEditor
                    value={form.size_stock}
                    onChange={(next) => setForm({ ...form, size_stock: next })}
                  />
                </div>

                <SizeGuideField
                  value={form.size_guide_url}
                  onChange={(url) => setForm({ ...form, size_guide_url: url })}
                />

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
      </div>

      {/* Restock Dialog */}
      <Dialog open={restockDialogOpen} onOpenChange={setRestockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restock {restockProduct?.name as string}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Current stock: <span className="font-medium text-foreground">{(restockProduct?.stock_quantity as number) || 0}</span>
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
                    restockMutation.mutate({ id: restockProduct.id as string, amount });
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

      {/* Products list */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No products found</p>
        </div>
      ) : view === "grid" ? (
        <ProductGridList
          products={filteredProducts}
          onEdit={handleEdit}
          onRestock={handleRestock}
          onDelete={(p) => setPendingDelete(p as ProductRow)}
        />
      ) : (
        <ProductCardList
          products={filteredProducts}
          onEdit={handleEdit}
          onRestock={handleRestock}
          onDelete={(p) => setPendingDelete(p as ProductRow)}
        />
      )}

      <DeleteConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title={`Delete "${pendingDelete?.name}"?`}
        description="This product will be permanently removed from the catalog. Past orders containing it are unaffected."
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

interface ListProps {
  products: Record<string, unknown>[];
  onEdit: (p: Record<string, unknown>) => void;
  onRestock: (p: Record<string, unknown>) => void;
  onDelete: (p: Record<string, unknown>) => void;
}

const ProductCardList = ({ products, onEdit, onRestock, onDelete }: ListProps) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {products.map((product) => {
      const stockQty = Number(product.stock_quantity) || 0;
      const isLowStock = stockQty === 1;
      const isOutOfStock = stockQty === 0;
      const categories = product.categories as { name: string } | null;

      return (
        <Card
          key={product.id as string}
          className={cn(
            isOutOfStock && "border-destructive/50",
            !isOutOfStock && isLowStock && "border-destructive/40",
          )}
        >
          <CardContent className="p-4">
            <div className="flex gap-4">
              <div className="w-20 h-20 rounded-md overflow-hidden bg-muted flex-shrink-0 relative">
                {(product.image_urls as string[])?.[0] ? (
                  <img
                    src={(product.image_urls as string[])[0]}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                    No image
                  </div>
                )}
                {isOutOfStock && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <span className="text-xs text-white font-medium">Out of Stock</span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground truncate">{product.name as string}</h3>
                  <Badge variant="outline" className="text-xs font-mono shrink-0">{product.product_code as string}</Badge>
                </div>
                <p className="text-sm text-muted-foreground truncate">{categories?.name || "Uncategorized"}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-gold font-bold">
                    ৳{Number(product.discount_price || product.price).toLocaleString()}
                  </span>
                  {product.discount_price ? (
                    <span className="text-sm text-muted-foreground line-through">৳{Number(product.price).toLocaleString()}</span>
                  ) : null}
                </div>
                <div className="flex gap-1 mt-2 flex-wrap">
                  {Boolean(product.is_featured) && <Badge variant="secondary" className="text-xs">Featured</Badge>}
                  {!product.is_active && <Badge variant="destructive" className="text-xs">Inactive</Badge>}
                  {isOutOfStock ? (
                    <Badge variant="destructive" className="text-xs">Out of Stock</Badge>
                  ) : isLowStock ? (
                    <Badge className="text-xs bg-destructive/20 text-destructive animate-pulse">Only 1 Left!</Badge>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-border grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <p className="text-muted-foreground">Stock</p>
                <p
                  className={cn(
                    "font-semibold",
                    isOutOfStock || isLowStock ? "text-destructive" : "text-foreground",
                  )}
                >
                  {stockQty}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Sold</p>
                <p className="font-semibold text-foreground">{(product.sold_count as number) || 0}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Available</p>
                <p className="font-semibold text-foreground">{stockQty}</p>
              </div>
            </div>

            <div className="flex gap-2 mt-4 pt-4 border-t border-border">
              <Button size="sm" variant="outline" className="flex-1" onClick={() => onEdit(product)}>
                <Pencil className="h-4 w-4 mr-1" />
                Edit
              </Button>
              <Button size="sm" variant="outline" onClick={() => onRestock(product)}>
                <Package className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onDelete(product)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    })}
  </div>
);

const ProductGridList = ({ products, onEdit, onRestock, onDelete }: ListProps) => (
  <div className="rounded-lg border border-border bg-card overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-muted-foreground">
          <tr>
            <th className="text-left font-semibold px-4 py-3">Product</th>
            <th className="text-left font-semibold px-4 py-3 hidden md:table-cell">Code</th>
            <th className="text-left font-semibold px-4 py-3 hidden lg:table-cell">Category</th>
            <th className="text-right font-semibold px-4 py-3">Price</th>
            <th className="text-right font-semibold px-4 py-3">Stock</th>
            <th className="text-right font-semibold px-4 py-3 hidden md:table-cell">Sold</th>
            <th className="text-right font-semibold px-4 py-3">Status</th>
            <th className="text-right font-semibold px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {products.map((product) => {
            const stockQty = Number(product.stock_quantity) || 0;
            const isOut = stockQty === 0;
            const isLow = !isOut && stockQty <= 3;
            const categories = product.categories as { name: string } | null;
            return (
              <tr key={product.id as string} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-muted overflow-hidden shrink-0">
                      {(product.image_urls as string[])?.[0] ? (
                        <img
                          src={(product.image_urls as string[])[0]}
                          alt=""
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate max-w-[14rem]">{product.name as string}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-2.5 hidden md:table-cell font-mono text-xs text-muted-foreground">
                  {product.product_code as string}
                </td>
                <td className="px-4 py-2.5 hidden lg:table-cell text-muted-foreground">
                  {categories?.name || "—"}
                </td>
                <td className="px-4 py-2.5 text-right">
                  <span className="font-semibold text-foreground">
                    ৳{Number(product.discount_price || product.price).toLocaleString()}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <span
                    className={cn(
                      "font-semibold",
                      isOut || isLow ? "text-destructive" : "text-foreground",
                    )}
                  >
                    {stockQty}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right hidden md:table-cell text-muted-foreground">
                  {(product.sold_count as number) || 0}
                </td>
                <td className="px-4 py-2.5 text-right">
                  {isOut ? (
                    <Badge variant="destructive" className="text-[10px]">Out</Badge>
                  ) : isLow ? (
                    <Badge className="bg-destructive/20 text-destructive text-[10px]">Low</Badge>
                  ) : !product.is_active ? (
                    <Badge variant="outline" className="text-[10px]">Inactive</Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[10px]">Active</Badge>
                  )}
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center justify-end gap-1">
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => onEdit(product)} title="Edit">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => onRestock(product)} title="Restock">
                      <Package className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive hover:text-destructive" onClick={() => onDelete(product)} title="Delete">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </div>
);

export default AdminProducts;
