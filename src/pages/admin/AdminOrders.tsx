import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Search, Eye, Trash2, RotateCcw, Loader2, Download, Pencil, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// NOTE:
// - We allow filtering by "returned" so admins can find returned orders.
// - We DO NOT allow setting "returned" via the generic status dropdown; use the dedicated Return button instead.
const filterStatusOptions = ["all", "pending", "confirmed", "shipped", "delivered", "cancelled", "returned"];
const updateStatusOptions = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

const getDeliveryLabel = (area: string) => {
  switch (area) {
    case "dhaka":
    case "rajshahi":
      return "Inside Rajshahi";
    case "outside":
    case "outside_rajshahi":
      return "Outside Rajshahi";
    default:
      return area;
  }
};

const AdminOrders = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [referralFilter, setReferralFilter] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [deleteOrder, setDeleteOrder] = useState<any>(null);
  const [returnOrder, setReturnOrder] = useState<any>(null);
  const [editOrder, setEditOrder] = useState<any>(null);
  const [editForm, setEditForm] = useState<any>(null);
  const [editItems, setEditItems] = useState<any[]>([]);
  const [couponLoading, setCouponLoading] = useState(false);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const { data: coupons = [] } = useQuery({
    queryKey: ["admin-coupons-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coupons")
        .select("code, discount_type, discount_value, is_active")
        .order("code");
      if (error) throw error;
      return data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("orders").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast({ title: "Order status updated!" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteOrderMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("orders").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast({ title: "Order deleted! Stock has been restored." });
      setDeleteOrder(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const returnOrderMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("orders").update({ status: "returned" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast({ title: "Order marked as returned! Stock has been restored." });
      setReturnOrder(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Edit order mutation
  const editOrderMutation = useMutation({
    mutationFn: async (updates: any) => {
      const { error } = await supabase.from("orders").update(updates).eq("id", editOrder.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast({ title: "Order updated successfully!" });
      setEditOrder(null);
      setEditForm(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Open edit modal
  const openEditModal = (order: any) => {
    const items = parseItems(order.items);
    setEditOrder(order);
    setEditForm({
      customer_name: order.customer_name,
      phone: order.phone,
      address: order.address,
      delivery_area: order.delivery_area,
      coupon_code: order.coupon_code || "",
      custom_discount: order.custom_discount || 0,
      delivery_charge: order.delivery_charge || 0,
    });
    setEditItems(items.map((item: any) => ({ ...item, quantity: item.quantity || 1 })));
  };

  // Recalculate totals
  const recalcEditTotals = async (items: any[], couponCode: string, customDiscount: number = 0, deliveryCharge: number = 0) => {
    const subtotal = items.reduce((sum: number, item: any) => sum + (Number(item.price) * Number(item.quantity || 1)), 0);
    let couponDiscount = 0;

    if (couponCode.trim()) {
      setCouponLoading(true);
      const { data: coupon } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", couponCode.trim())
        .eq("is_active", true)
        .maybeSingle();
      setCouponLoading(false);

      if (coupon) {
        if (coupon.discount_type === "percentage") {
          couponDiscount = Math.round(subtotal * coupon.discount_value / 100);
        } else {
          couponDiscount = coupon.discount_value;
        }
      }
    }

    const totalDiscount = couponDiscount + Number(customDiscount || 0);
    const dc = Number(deliveryCharge || 0);
    return { subtotal, discount_amount: totalDiscount, custom_discount: Number(customDiscount || 0), delivery_charge: dc, total: Math.max(subtotal + dc - totalDiscount, 0) };
  };

  const handleEditSave = async () => {
    if (!editForm || !editOrder) return;
    const validItems = editItems.filter((item) => item.quantity > 0);
    if (validItems.length === 0) {
      toast({ title: "Order must have at least one item", variant: "destructive" });
      return;
    }
    const totals = await recalcEditTotals(validItems, editForm.coupon_code, editForm.custom_discount, editForm.delivery_charge);
    editOrderMutation.mutate({
      customer_name: editForm.customer_name,
      phone: editForm.phone,
      address: editForm.address,
      delivery_area: editForm.delivery_area,
      coupon_code: editForm.coupon_code || null,
      custom_discount: totals.custom_discount,
      delivery_charge: totals.delivery_charge,
      items: validItems,
      subtotal: totals.subtotal,
      discount_amount: totals.discount_amount,
      total: totals.total,
    });
  };

  // Download receipt
  const downloadReceipt = async (orderId: string, orderCode: string) => {
    try {
      toast({ title: "Generating receipt..." });
      
      const { data, error } = await supabase.functions.invoke("generate-receipt", {
        body: { orderId },
      });

      if (error) throw error;
      if (!data || !data.pdf) throw new Error("Failed to generate PDF");

      // Decode base64 PDF
      const binaryString = atob(data.pdf);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Create blob and download
      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `receipt-${orderCode}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({ title: "Receipt downloaded!" });
    } catch (error: any) {
      console.error("Download error:", error);
      toast({ title: "Failed to download receipt", description: error.message, variant: "destructive" });
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.order_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.phone.includes(searchQuery);
    
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    const matchesReferral = !referralFilter || order.referral_code?.toLowerCase().includes(referralFilter.toLowerCase());

    return matchesSearch && matchesStatus && matchesReferral;
  });

  const downloadCustomerCSV = () => {
    if (filteredOrders.length === 0) {
      toast({ title: "No orders to export", variant: "destructive" });
      return;
    }

    const customerMap = new Map<string, { name: string; phone: string; address: string; delivery_area: string; order_count: number; total_spent: number; last_order: string }>();

    filteredOrders.forEach((order) => {
      const existing = customerMap.get(order.phone);
      if (existing) {
        existing.order_count += 1;
        existing.total_spent += Number(order.total);
        if (new Date(order.created_at) > new Date(existing.last_order)) {
          existing.last_order = order.created_at;
          existing.name = order.customer_name;
          existing.address = order.address;
          existing.delivery_area = order.delivery_area;
        }
      } else {
        customerMap.set(order.phone, {
          name: order.customer_name,
          phone: order.phone,
          address: order.address,
          delivery_area: order.delivery_area,
          order_count: 1,
          total_spent: Number(order.total),
          last_order: order.created_at,
        });
      }
    });

    const headers = ["Customer Name", "Phone", "Address", "Delivery Area", "Order Count", "Total Spent", "Last Order Date"];
    const rows = Array.from(customerMap.values()).map((c) => [
      `"${c.name.replace(/"/g, '""')}"`,
      c.phone,
      `"${c.address.replace(/"/g, '""')}"`,
      getDeliveryLabel(c.delivery_area),
      c.order_count,
      c.total_spent,
      new Date(c.last_order).toLocaleDateString(),
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `customers-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({ title: `Downloaded ${customerMap.size} unique customers!` });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "confirmed": return "bg-blue-100 text-blue-800";
      case "shipped": return "bg-purple-100 text-purple-800";
      case "delivered": return "bg-green-100 text-green-800";
      case "cancelled": return "bg-red-100 text-red-800";
      case "returned": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const parseItems = (items: any) => {
    if (typeof items === "string") {
      try {
        return JSON.parse(items);
      } catch {
        return [];
      }
    }
    return items || [];
  };

  return (
    <AdminLayout title="Orders">
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by Order ID, name, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Input
          placeholder="Filter by referral code..."
          value={referralFilter}
          onChange={(e) => setReferralFilter(e.target.value)}
          className="w-full md:w-48"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            {filterStatusOptions.map((status) => (
              <SelectItem key={status} value={status}>
                {status === "all" ? "All Statuses" : status.charAt(0).toUpperCase() + status.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={downloadCustomerCSV} className="w-full md:w-auto">
          <Download className="h-4 w-4 mr-2" />
          Download Customers
        </Button>
      </div>

      {/* Orders List */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 bg-muted animate-pulse rounded" />
          ))}
        </div>
      ) : filteredOrders.length > 0 ? (
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">Order</th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground hidden md:table-cell">Customer</th>
                  <th className="text-right px-3 py-2 font-medium text-muted-foreground">Total</th>
                  <th className="text-center px-3 py-2 font-medium text-muted-foreground">Status</th>
                  <th className="text-right px-3 py-2 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-3 py-2">
                      <div className="font-semibold text-foreground">{order.order_id}</div>
                      <div className="text-xs text-muted-foreground md:hidden">{order.customer_name}</div>
                      <div className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</div>
                    </td>
                    <td className="px-3 py-2 hidden md:table-cell">
                      <div className="text-foreground">{order.customer_name}</div>
                      <div className="text-xs text-muted-foreground">{order.phone}</div>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="font-bold text-gold">৳{order.total}</div>
                      {order.discount_amount > 0 && (
                        <div className="text-xs text-muted-foreground">-৳{order.discount_amount}</div>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <Select
                        value={order.status}
                        onValueChange={(status) => updateStatusMutation.mutate({ id: order.id, status })}
                      >
                        <SelectTrigger className="h-7 w-28 text-xs mx-auto">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {updateStatusOptions.map((status) => (
                            <SelectItem key={status} value={status}>
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {order.referral_code && (
                        <div className="text-xs text-muted-foreground mt-1">Ref: {order.referral_code}</div>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-end gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setSelectedOrder(order)}>
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEditModal(order)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        {order.status !== "returned" && order.status !== "cancelled" && (
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setReturnOrder(order)}>
                            <RotateCcw className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteOrder(order)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <p>No orders found</p>
        </div>
      )}

      {/* Order Detail Modal */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Order {selectedOrder?.order_id}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Customer</p>
                  <p className="font-medium">{selectedOrder.customer_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Phone</p>
                  <p className="font-medium">{selectedOrder.phone}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground">Address</p>
                  <p className="font-medium">{selectedOrder.address}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Delivery Area</p>
                  <p className="font-medium">{getDeliveryLabel(selectedOrder.delivery_area)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <Badge className={getStatusColor(selectedOrder.status)}>
                    {selectedOrder.status}
                  </Badge>
                </div>
                {selectedOrder.referral_code && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Referral Code</p>
                    <p className="font-medium">{selectedOrder.referral_code}</p>
                  </div>
                )}
              </div>

              <div className="border-t border-border pt-4">
                <p className="font-medium mb-2">Items</p>
                {parseItems(selectedOrder.items).map((item: any, index: number) => (
                  <div key={index} className="flex justify-between text-sm py-1">
                    <span>
                      {item.name}
                      {item.product_code && <span className="text-muted-foreground font-mono text-xs ml-1">({item.product_code})</span>}
                      {item.size && ` (${item.size})`}
                      {item.quantity && item.quantity > 1 && ` × ${item.quantity}`}
                    </span>
                    <span className="text-gold">৳{item.price}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-border pt-4 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>৳{selectedOrder.subtotal}</span>
                </div>
                {selectedOrder.delivery_charge > 0 && (
                  <div className="flex justify-between">
                    <span>Delivery Charge</span>
                    <span>৳{selectedOrder.delivery_charge}</span>
                  </div>
                )}
                {selectedOrder.discount_amount > 0 && (
                  <div className="flex justify-between text-primary">
                    <span>Discount {selectedOrder.coupon_code ? `(${selectedOrder.coupon_code})` : ""}</span>
                    <span>-৳{selectedOrder.discount_amount}</span>
                  </div>
                )}
                {selectedOrder.custom_discount > 0 && (
                  <div className="flex justify-between text-primary">
                    <span>Custom Discount</span>
                    <span>-৳{selectedOrder.custom_discount}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg pt-2">
                  <span>Total</span>
                  <span className="text-gold">৳{selectedOrder.total}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4">
                <p className="text-xs text-muted-foreground">
                  Ordered: {new Date(selectedOrder.created_at).toLocaleString()}
                </p>
                <Button
                  size="sm"
                  onClick={() => downloadReceipt(selectedOrder.id, selectedOrder.order_id)}
                  className="bg-primary text-primary-foreground"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Receipt
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Order Modal */}
      <Dialog open={!!editOrder} onOpenChange={(open) => { if (!open) { setEditOrder(null); setEditForm(null); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Order {editOrder?.order_id}</DialogTitle>
          </DialogHeader>
          {editForm && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Customer Name</Label>
                  <Input value={editForm.customer_name} onChange={(e) => setEditForm({ ...editForm, customer_name: e.target.value })} />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
                </div>
                <div className="col-span-2">
                  <Label>Address</Label>
                  <Input value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} />
                </div>
                <div>
                  <Label>Delivery Area</Label>
                  <Select value={editForm.delivery_area} onValueChange={(v) => setEditForm({ ...editForm, delivery_area: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rajshahi">Inside Rajshahi</SelectItem>
                      <SelectItem value="outside_rajshahi">Outside Rajshahi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Coupon Code</Label>
                  <div className="relative">
                    <Input value={editForm.coupon_code} onChange={(e) => setEditForm({ ...editForm, coupon_code: e.target.value })} placeholder="Enter coupon" />
                    {couponLoading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />}
                  </div>
                </div>
                <div>
                  <Label>Custom Discount (৳)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={editForm.custom_discount}
                    onChange={(e) => setEditForm({ ...editForm, custom_discount: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label>Delivery Charge (৳)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={editForm.delivery_charge}
                    onChange={(e) => setEditForm({ ...editForm, delivery_charge: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <Label className="mb-2 block">Items</Label>
                {editItems.map((item, index) => (
                  <div key={index} className="flex items-center gap-2 mb-2">
                    <span className="flex-1 text-sm truncate">{item.name} {item.size ? `(${item.size})` : ""}</span>
                    <span className="text-sm text-muted-foreground">৳{item.price}</span>
                    <Input
                      type="number"
                      min={0}
                      value={item.quantity}
                      onChange={(e) => {
                        const updated = [...editItems];
                        updated[index] = { ...updated[index], quantity: parseInt(e.target.value) || 0 };
                        setEditItems(updated);
                      }}
                      className="w-16 text-center"
                    />
                    <Button size="sm" variant="ghost" onClick={() => setEditItems(editItems.filter((_, i) => i !== index))}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => { setEditOrder(null); setEditForm(null); }}>Cancel</Button>
                <Button onClick={handleEditSave} disabled={editOrderMutation.isPending}>
                  {editOrderMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteOrder} onOpenChange={(open) => !open && setDeleteOrder(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Order {deleteOrder?.order_id}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this order and restore the stock for all items in the order. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteOrder && deleteOrderMutation.mutate(deleteOrder.id)}
              disabled={deleteOrderMutation.isPending}
            >
              {deleteOrderMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete Order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Return Confirmation Dialog */}
      <AlertDialog open={!!returnOrder} onOpenChange={(open) => !open && setReturnOrder(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark Order {returnOrder?.order_id} as Returned?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark the order as returned and restore the stock for all items. The order will remain in records for tracking purposes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => returnOrder && returnOrderMutation.mutate(returnOrder.id)}
              disabled={returnOrderMutation.isPending}
            >
              {returnOrderMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Mark as Returned
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminOrders;
