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
import { Badge } from "@/components/ui/badge";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";

type CouponFilter = "all" | "active" | "inactive" | "expired";

interface CouponRow {
  id: string;
  code: string;
}

const AdminCoupons = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<CouponRow | null>(null);
  const [filter, setFilter] = useState<CouponFilter>("all");
  const [form, setForm] = useState({
    code: "",
    discount_type: "fixed" as "fixed" | "percentage",
    discount_value: "",
    min_purchase: "",
    expiry_date: "",
    is_active: true,
  });

  const { data: coupons = [], isLoading } = useQuery({
    queryKey: ["admin-coupons"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const data = {
        code: form.code.toUpperCase(),
        discount_type: form.discount_type,
        discount_value: parseFloat(form.discount_value),
        min_purchase: form.min_purchase ? parseFloat(form.min_purchase) : 0,
        expiry_date: form.expiry_date || null,
        is_active: form.is_active,
      };

      if (editingId) {
        const { error } = await supabase.from("coupons").update(data).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("coupons").insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
      toast({ title: editingId ? "Coupon updated!" : "Coupon created!" });
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("coupons").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
      toast({ title: "Coupon deleted!" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setForm({ code: "", discount_type: "fixed", discount_value: "", min_purchase: "", expiry_date: "", is_active: true });
    setEditingId(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (coupon: any) => {
    setForm({
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value.toString(),
      min_purchase: coupon.min_purchase?.toString() || "",
      expiry_date: coupon.expiry_date ? coupon.expiry_date.split("T")[0] : "",
      is_active: coupon.is_active,
    });
    setEditingId(coupon.id);
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim() || !form.discount_value) {
      toast({ title: "Please fill required fields", variant: "destructive" });
      return;
    }
    saveMutation.mutate();
  };

  const filteredCoupons = coupons.filter((c) => {
    const isExpired =
      !!c.expiry_date && new Date(c.expiry_date) < new Date();
    switch (filter) {
      case "active":
        return c.is_active && !isExpired;
      case "inactive":
        return !c.is_active;
      case "expired":
        return isExpired;
      default:
        return true;
    }
  });

  return (
    <AdminLayout title="Coupons">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
        <Select value={filter} onValueChange={(v) => setFilter(v as CouponFilter)}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All coupons</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) resetForm(); else setIsDialogOpen(true); }}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-gold hover:text-gold-foreground">
              <Plus className="h-4 w-4 mr-2" />
              Add Coupon
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Coupon" : "Add Coupon"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Code *</Label>
                <Input
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="SAVE20"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type *</Label>
                  <Select value={form.discount_type} onValueChange={(v: "fixed" | "percentage") => setForm({ ...form, discount_type: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">Fixed (৳)</SelectItem>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Value *</Label>
                  <Input
                    type="number"
                    value={form.discount_value}
                    onChange={(e) => setForm({ ...form, discount_value: e.target.value })}
                    placeholder={form.discount_type === "fixed" ? "100" : "10"}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Min. Purchase (৳)</Label>
                <Input
                  type="number"
                  value={form.min_purchase}
                  onChange={(e) => setForm({ ...form, min_purchase: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label>Expiry Date</Label>
                <Input
                  type="date"
                  value={form.expiry_date}
                  onChange={(e) => setForm({ ...form, expiry_date: e.target.value })}
                />
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
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : filteredCoupons.length > 0 ? (
        <div className="space-y-4">
          {filteredCoupons.map((coupon) => {
            const isExpired =
              !!coupon.expiry_date && new Date(coupon.expiry_date) < new Date();
            return (
            <Card key={coupon.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-lg text-foreground">{coupon.code}</h3>
                      {!coupon.is_active && <Badge variant="destructive">Inactive</Badge>}
                      {isExpired && <Badge variant="outline">Expired</Badge>}
                    </div>
                    <p className="text-gold font-medium">
                      {coupon.discount_type === "fixed" ? `৳${coupon.discount_value}` : `${coupon.discount_value}%`} off
                    </p>
                    <p className="text-sm text-muted">
                      Min. ৳{coupon.min_purchase || 0} • Used: {coupon.usage_count} times
                      {coupon.expiry_date && ` • Expires: ${new Date(coupon.expiry_date).toLocaleDateString()}`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(coupon)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() =>
                        setPendingDelete({ id: coupon.id, code: coupon.code })
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 text-muted">
          <p>{coupons.length === 0 ? "No coupons yet" : "No coupons match this filter"}</p>
        </div>
      )}

      <DeleteConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title={`Delete coupon "${pendingDelete?.code}"?`}
        description='Customers using this code at checkout will get an "invalid coupon" error.'
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

export default AdminCoupons;
