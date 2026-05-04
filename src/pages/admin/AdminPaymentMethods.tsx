import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Loader2, CreditCard } from "lucide-react";

type MethodType = "Send Money" | "Payment";

interface PaymentMethod {
  id: string;
  key: string;
  name: string;
  type: string;
  account_number: string;
  instructions: string | null;
  is_active: boolean | null;
  display_order: number | null;
}

interface MethodForm {
  key: string;
  name: string;
  type: MethodType;
  account_number: string;
  instructions: string;
  is_active: boolean;
  display_order: number;
}

const emptyForm: MethodForm = {
  key: "",
  name: "",
  type: "Send Money",
  account_number: "",
  instructions: "",
  is_active: true,
  display_order: 0,
};

const AdminPaymentMethods = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<MethodForm>(emptyForm);
  const [pendingDelete, setPendingDelete] = useState<PaymentMethod | null>(null);

  const { data: methods = [], isLoading } = useQuery<PaymentMethod[]>({
    queryKey: ["admin-payment-methods"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_methods")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as PaymentMethod[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editingId) {
        const { error } = await supabase
          .from("payment_methods")
          .update({
            key: form.key.trim().toLowerCase(),
            name: form.name.trim(),
            type: form.type,
            account_number: form.account_number.trim(),
            instructions: form.instructions.trim() || null,
            is_active: form.is_active,
            display_order: form.display_order,
          })
          .eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("payment_methods").insert({
          key: form.key.trim().toLowerCase(),
          name: form.name.trim(),
          type: form.type,
          account_number: form.account_number.trim(),
          instructions: form.instructions.trim() || null,
          is_active: form.is_active,
          display_order: form.display_order,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-payment-methods"] });
      toast({
        title: editingId ? "Payment method updated" : "Payment method added",
      });
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("payment_methods")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-payment-methods"] });
      toast({ title: "Payment method deleted" });
      setPendingDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (m: PaymentMethod) => {
    setForm({
      key: m.key,
      name: m.name,
      type: (m.type === "Payment" ? "Payment" : "Send Money") as MethodType,
      account_number: m.account_number,
      instructions: m.instructions ?? "",
      is_active: m.is_active ?? true,
      display_order: m.display_order ?? 0,
    });
    setEditingId(m.id);
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.key.trim() || !form.name.trim() || !form.account_number.trim()) {
      toast({
        title: "Missing fields",
        description: "Key, name and account number are required.",
        variant: "destructive",
      });
      return;
    }
    saveMutation.mutate();
  };

  return (
    <AdminLayout title="Payment Methods">
      <div className="flex justify-between items-start gap-4 mb-6 flex-wrap">
        <p className="text-sm text-muted-foreground max-w-xl">
          Customers see these on the <code>/payment/&lt;orderId&gt;</code> page.
          The <strong>key</strong> field maps to the URL slug
          (e.g. <code>bkash</code> → <code>/payment/UC-1234/bkash</code>).
        </p>
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            if (!open) resetForm();
            else setIsDialogOpen(true);
          }}
        >
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-gold hover:text-gold-foreground">
              <Plus className="h-4 w-4 mr-2" />
              Add Method
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Edit Payment Method" : "Add Payment Method"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Key (URL slug) *</Label>
                  <Input
                    value={form.key}
                    onChange={(e) =>
                      setForm({ ...form, key: e.target.value })
                    }
                    placeholder="bkash"
                    disabled={!!editingId}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Display name *</Label>
                  <Input
                    value={form.name}
                    onChange={(e) =>
                      setForm({ ...form, name: e.target.value })
                    }
                    placeholder="bKash"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type *</Label>
                  <Select
                    value={form.type}
                    onValueChange={(value: MethodType) =>
                      setForm({ ...form, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Send Money">Send Money</SelectItem>
                      <SelectItem value="Payment">Payment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Display order</Label>
                  <Input
                    type="number"
                    value={form.display_order}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        display_order: parseInt(e.target.value, 10) || 0,
                      })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Account number *</Label>
                <Input
                  value={form.account_number}
                  onChange={(e) =>
                    setForm({ ...form, account_number: e.target.value })
                  }
                  placeholder="01XXXXXXXXX"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Instructions</Label>
                <Textarea
                  value={form.instructions}
                  onChange={(e) =>
                    setForm({ ...form, instructions: e.target.value })
                  }
                  rows={4}
                  placeholder="Open your bKash app → Send Money → …"
                />
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={form.is_active}
                  onCheckedChange={(checked) =>
                    setForm({ ...form, is_active: checked })
                  }
                />
                <Label>Active</Label>
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {editingId ? "Update" : "Create"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : methods.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <CreditCard className="h-10 w-10 mx-auto mb-2 opacity-40" />
            No payment methods yet.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {methods.map((m) => (
            <Card key={m.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-bold text-foreground">{m.name}</h3>
                      <Badge variant="outline">{m.type}</Badge>
                      <Badge variant={m.is_active ? "default" : "secondary"}>
                        {m.is_active ? "Active" : "Inactive"}
                      </Badge>
                      <Badge variant="outline" className="font-mono text-xs">
                        {m.key}
                      </Badge>
                    </div>
                    <p className="font-mono text-sm text-foreground">
                      {m.account_number}
                    </p>
                    {m.instructions && (
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-3">
                        {m.instructions}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(m)}
                      aria-label="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setPendingDelete(m)}
                      aria-label="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog
        open={!!pendingDelete}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {pendingDelete?.name}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Customers will no longer see this payment option on checkout.
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                pendingDelete && deleteMutation.mutate(pendingDelete.id)
              }
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminPaymentMethods;
