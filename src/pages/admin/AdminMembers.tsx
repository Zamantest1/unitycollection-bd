import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Pencil, Trash2, Loader2, Settings, History, CreditCard } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Member {
  id: string;
  member_code: string;
  name: string;
  phone: string;
  address: string | null;
  email: string | null;
  total_purchases: number;
  order_count: number;
  discount_value: number;
  discount_type: string;
  is_active: boolean;
  created_at: string;
}

interface MemberFormData {
  name: string;
  phone: string;
  address: string;
  email: string;
  discount_value: number;
  discount_type: string;
  is_active: boolean;
}

const AdminMembers = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editMember, setEditMember] = useState<Member | null>(null);
  const [deleteMember, setDeleteMember] = useState<Member | null>(null);
  const [viewHistoryMember, setViewHistoryMember] = useState<Member | null>(null);
  const [thresholdAmount, setThresholdAmount] = useState("");
  const [defaultDiscount, setDefaultDiscount] = useState("");
  const [defaultDiscountType, setDefaultDiscountType] = useState("percentage");
  const [formData, setFormData] = useState<MemberFormData>({
    name: "",
    phone: "",
    address: "",
    email: "",
    discount_value: 5,
    discount_type: "percentage",
    is_active: true,
  });

  // Fetch members
  const { data: members = [], isLoading } = useQuery({
    queryKey: ["admin-members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("members")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Member[];
    },
  });

  // Fetch settings
  const { data: settings } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("settings")
        .select("*");
      
      if (error) throw error;
      
      const settingsMap: Record<string, any> = {};
      data?.forEach((s: { key: string; value: any }) => {
        settingsMap[s.key] = s.value;
      });
      return settingsMap;
    },
    staleTime: 0,
  });

  // Load settings into state when data is fetched
  useEffect(() => {
    if (settings) {
      if (settings.membership_threshold?.amount !== undefined) {
        setThresholdAmount(settings.membership_threshold.amount.toString());
      }
      if (settings.default_member_discount?.value !== undefined) {
        setDefaultDiscount(settings.default_member_discount.value.toString());
      }
      if (settings.default_member_discount?.type) {
        setDefaultDiscountType(settings.default_member_discount.type);
      }
    }
  }, [settings]);

  // Fetch member orders when viewing history
  const { data: memberOrders = [] } = useQuery({
    queryKey: ["member-orders", viewHistoryMember?.id],
    queryFn: async () => {
      if (!viewHistoryMember) return [];
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("member_id", viewHistoryMember.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!viewHistoryMember,
  });

  // Create/Update member
  const saveMemberMutation = useMutation({
    mutationFn: async (data: MemberFormData & { id?: string }) => {
      if (data.id) {
        const { error } = await supabase
          .from("members")
          .update({
            name: data.name,
            phone: data.phone,
            address: data.address || null,
            email: data.email || null,
            discount_value: data.discount_value,
            discount_type: data.discount_type,
            is_active: data.is_active,
          })
          .eq("id", data.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("members")
          .insert({
            name: data.name,
            phone: data.phone,
            address: data.address || null,
            email: data.email || null,
            discount_value: data.discount_value,
            discount_type: data.discount_type,
            is_active: data.is_active,
            member_code: "", // Will be auto-generated by trigger
          });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-members"] });
      toast({ title: editMember ? "Member updated!" : "Member created!" });
      handleCloseDialog();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Delete member
  const deleteMemberMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("members").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-members"] });
      toast({ title: "Member deleted!" });
      setDeleteMember(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Update settings
  const updateSettingsMutation = useMutation({
    mutationFn: async ({ threshold, discount, discountType }: { threshold: number; discount: number; discountType: string }) => {
      const updates = [
        supabase.from("settings").upsert({ 
          key: "membership_threshold", 
          value: { amount: threshold } 
        }),
        supabase.from("settings").upsert({ 
          key: "default_member_discount", 
          value: { value: discount, type: discountType } 
        }),
      ];
      
      const results = await Promise.all(updates);
      results.forEach(({ error }) => { if (error) throw error; });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
      toast({ title: "Settings updated!" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditMember(null);
    setFormData({
      name: "",
      phone: "",
      address: "",
      email: "",
      discount_value: 5,
      discount_type: "percentage",
      is_active: true,
    });
  };

  const handleEdit = (member: Member) => {
    setEditMember(member);
    setFormData({
      name: member.name,
      phone: member.phone,
      address: member.address || "",
      email: member.email || "",
      discount_value: member.discount_value,
      discount_type: member.discount_type,
      is_active: member.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMemberMutation.mutate({
      ...formData,
      id: editMember?.id,
    });
  };

  const handleSaveSettings = () => {
    const threshold = parseFloat(thresholdAmount) || settings?.membership_threshold?.amount || 5000;
    const discount = parseFloat(defaultDiscount) || settings?.default_member_discount?.value || 5;
    updateSettingsMutation.mutate({ threshold, discount, discountType: defaultDiscountType });
  };

  const filteredMembers = members.filter(
    (member) =>
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.phone.includes(searchQuery) ||
      member.member_code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout title="Members">
      <Tabs defaultValue="members">
        <TabsList className="mb-6">
          <TabsTrigger value="members" className="flex items-center gap-2 text-foreground">
            <CreditCard className="h-4 w-4" />
            Members
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2 text-foreground">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members">
          {/* Header */}
          <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, phone, or member code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Member
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editMember ? "Edit Member" : "Add New Member"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Name *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone *</Label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Address</Label>
                    <Input
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Discount Value</Label>
                      <Input
                        type="number"
                        value={formData.discount_value}
                        onChange={(e) => setFormData({ ...formData, discount_value: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Discount Type</Label>
                      <Select
                        value={formData.discount_type}
                        onValueChange={(value) => setFormData({ ...formData, discount_type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">Percentage (%)</SelectItem>
                          <SelectItem value="fixed">Fixed (৳)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                    <Label>Active</Label>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button type="button" variant="outline" onClick={handleCloseDialog}>
                        Cancel
                      </Button>
                    </DialogClose>
                    <Button type="submit" disabled={saveMemberMutation.isPending}>
                      {saveMemberMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      {editMember ? "Update" : "Create"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Members List */}
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : filteredMembers.length > 0 ? (
            <div className="space-y-4">
              {filteredMembers.map((member) => (
                <Card key={member.id}>
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-bold text-foreground">{member.member_code}</h3>
                          <Badge variant={member.is_active ? "default" : "secondary"}>
                            {member.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium text-foreground">{member.name}</p>
                        <p className="text-sm text-muted-foreground">{member.phone}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Joined: {new Date(member.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Total Purchases</p>
                        <p className="text-gold font-bold text-lg">৳{member.total_purchases.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">{member.order_count} orders</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Discount</p>
                        <p className="font-medium text-primary">
                          {member.discount_type === "percentage" 
                            ? `${member.discount_value}%` 
                            : `৳${member.discount_value}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => setViewHistoryMember(member)}>
                          <History className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleEdit(member)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => setDeleteMember(member)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No members found</p>
              <p className="text-sm">Add your first member to get started</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardContent className="p-6 space-y-6">
              <div>
                <h3 className="font-semibold text-foreground mb-4">Membership Settings</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Purchase Threshold for Auto-Membership (৳)</Label>
                    <Input
                      type="number"
                      placeholder={settings?.membership_threshold?.amount?.toString() || "5000"}
                      value={thresholdAmount}
                      onChange={(e) => setThresholdAmount(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Customers who spend this amount will automatically become members
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Default Member Discount</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder={settings?.default_member_discount?.value?.toString() || "5"}
                        value={defaultDiscount}
                        onChange={(e) => setDefaultDiscount(e.target.value)}
                        className="flex-1"
                      />
                      <Select
                        value={defaultDiscountType}
                        onValueChange={setDefaultDiscountType}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">%</SelectItem>
                          <SelectItem value="fixed">৳</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Default discount for new members
                    </p>
                  </div>
                </div>
              </div>
              <Button 
                onClick={handleSaveSettings} 
                disabled={updateSettingsMutation.isPending}
              >
                {updateSettingsMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Order History Modal */}
      <Dialog open={!!viewHistoryMember} onOpenChange={(open) => !open && setViewHistoryMember(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Order History - {viewHistoryMember?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {memberOrders.length > 0 ? (
              memberOrders.map((order: any) => (
                <div key={order.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{order.order_id}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gold">৳{order.total}</p>
                      <Badge className="mt-1">{order.status}</Badge>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">No orders found for this member</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteMember} onOpenChange={(open) => !open && setDeleteMember(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteMember?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this member. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteMember && deleteMemberMutation.mutate(deleteMember.id)}
              disabled={deleteMemberMutation.isPending}
            >
              {deleteMemberMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminMembers;
