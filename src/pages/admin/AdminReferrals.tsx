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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Loader2, Users, TrendingUp, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ReferralForm {
  referrer_name: string;
  code: string;
  commission_type: string;
  commission_value: string;
  is_active: boolean;
}

const defaultForm: ReferralForm = {
  referrer_name: "",
  code: "",
  commission_type: "fixed",
  commission_value: "",
  is_active: true,
};

const AdminReferrals = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ReferralForm>(defaultForm);

  const { data: referrals = [], isLoading } = useQuery({
    queryKey: ["admin-referrals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("referrals")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const { data: orders = [] } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("referral_code, total, status")
        .not("referral_code", "is", null);
      
      if (error) throw error;
      return data;
    },
  });

  // Calculate referral stats
  const getReferralStats = (code: string) => {
    const referralOrders = orders.filter(o => o.referral_code === code);
    const completedOrders = referralOrders.filter(o => o.status === "delivered");
    const totalSales = completedOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    
    const referral = referrals.find(r => r.code === code);
    let commission = 0;
    if (referral) {
      if (referral.commission_type === "fixed") {
        commission = completedOrders.length * referral.commission_value;
      } else {
        commission = (totalSales * referral.commission_value) / 100;
      }
    }
    
    return {
      totalOrders: referralOrders.length,
      completedOrders: completedOrders.length,
      totalSales,
      commission: Math.round(commission),
    };
  };

  const saveMutation = useMutation({
    mutationFn: async (data: ReferralForm) => {
      const referralData = {
        referrer_name: data.referrer_name,
        code: data.code.toUpperCase(),
        commission_type: data.commission_type,
        commission_value: parseFloat(data.commission_value) || 0,
        is_active: data.is_active,
      };

      if (editingId) {
        const { error } = await supabase
          .from("referrals")
          .update(referralData)
          .eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("referrals")
          .insert(referralData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-referrals"] });
      toast({ title: editingId ? "Referral updated!" : "Referral created!" });
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("referrals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-referrals"] });
      toast({ title: "Referral deleted!" });
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

  const handleEdit = (referral: any) => {
    setForm({
      referrer_name: referral.referrer_name,
      code: referral.code,
      commission_type: referral.commission_type,
      commission_value: referral.commission_value.toString(),
      is_active: referral.is_active,
    });
    setEditingId(referral.id);
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.referrer_name || !form.code || !form.commission_value) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }
    saveMutation.mutate(form);
  };

  // Overall stats
  const totalReferralOrders = orders.length;
  const totalReferralSales = orders.filter(o => o.status === "delivered").reduce((sum, o) => sum + (o.total || 0), 0);
  const totalCommission = referrals.reduce((sum, r) => {
    const stats = getReferralStats(r.code);
    return sum + stats.commission;
  }, 0);

  return (
    <AdminLayout title="Referrals">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Referral Orders</p>
              <p className="text-2xl font-bold">{totalReferralOrders}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-gold/10 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-gold" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Referral Sales</p>
              <p className="text-2xl font-bold text-gold">৳{totalReferralSales.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Commission</p>
              <p className="text-2xl font-bold text-green-600">৳{totalCommission.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold">Referral Codes</h2>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) resetForm(); else setIsDialogOpen(true); }}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-gold hover:text-gold-foreground">
              <Plus className="h-4 w-4 mr-2" />
              Add Referral
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Referral" : "Add Referral"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Referrer Name *</Label>
                <Input
                  value={form.referrer_name}
                  onChange={(e) => setForm({ ...form, referrer_name: e.target.value })}
                  placeholder="Enter referrer name"
                />
              </div>

              <div className="space-y-2">
                <Label>Referral Code *</Label>
                <Input
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="e.g., JOHN10"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Commission Type</Label>
                  <Select value={form.commission_type} onValueChange={(v) => setForm({ ...form, commission_type: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">Fixed Amount (৳)</SelectItem>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Commission Value *</Label>
                  <Input
                    type="number"
                    value={form.commission_value}
                    onChange={(e) => setForm({ ...form, commission_value: e.target.value })}
                    placeholder={form.commission_type === "fixed" ? "e.g., 50" : "e.g., 5"}
                  />
                </div>
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

      {/* Referrals List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : referrals.length > 0 ? (
        <div className="space-y-4">
          {referrals.map((referral) => {
            const stats = getReferralStats(referral.code);
            return (
              <Card key={referral.id}>
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-foreground">{referral.referrer_name}</h3>
                        <Badge variant="outline" className="font-mono">{referral.code}</Badge>
                        {!referral.is_active && (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Commission: {referral.commission_type === "fixed" ? `৳${referral.commission_value}` : `${referral.commission_value}%`} per order
                      </p>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-xs text-muted-foreground">Orders</p>
                        <p className="font-bold">{stats.totalOrders}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Sales</p>
                        <p className="font-bold text-gold">৳{stats.totalSales.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Commission</p>
                        <p className="font-bold text-green-600">৳{stats.commission.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(referral)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteMutation.mutate(referral.id)}
                        disabled={deleteMutation.isPending}
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
        <div className="text-center py-12 text-muted-foreground">
          <p>No referrals found</p>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminReferrals;
