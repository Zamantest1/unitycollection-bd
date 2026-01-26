import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Search, Eye, Trash2, RotateCcw, Loader2, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const statusOptions = ["all", "pending", "confirmed", "shipped", "delivered", "cancelled", "returned"];

const AdminOrders = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [referralFilter, setReferralFilter] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [deleteOrder, setDeleteOrder] = useState<any>(null);
  const [returnOrder, setReturnOrder] = useState<any>(null);

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
            {statusOptions.map((status) => (
              <SelectItem key={status} value={status}>
                {status === "all" ? "All Statuses" : status.charAt(0).toUpperCase() + status.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Orders List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : filteredOrders.length > 0 ? (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <Card key={order.id}>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-bold text-foreground">{order.order_id}</h3>
                      <Badge className={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                      {order.referral_code && (
                        <Badge variant="outline" className="text-xs">
                          Ref: {order.referral_code}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-foreground">{order.customer_name}</p>
                    <p className="text-sm text-muted-foreground">{order.phone}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(order.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-gold font-bold text-lg">৳{order.total}</p>
                    {order.discount_amount > 0 && (
                      <p className="text-xs text-muted-foreground">Discount: ৳{order.discount_amount}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Select
                      value={order.status}
                      onValueChange={(status) => updateStatusMutation.mutate({ id: order.id, status })}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.filter((s) => s !== "all").map((status) => (
                          <SelectItem key={status} value={status}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button size="sm" variant="outline" onClick={() => setSelectedOrder(order)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    {order.status !== "returned" && order.status !== "cancelled" && (
                      <Button size="sm" variant="outline" onClick={() => setReturnOrder(order)}>
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    )}
                    <Button size="sm" variant="destructive" onClick={() => setDeleteOrder(order)}>
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
                  <p className="font-medium capitalize">{selectedOrder.delivery_area}</p>
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
                {selectedOrder.discount_amount > 0 && (
                  <div className="flex justify-between text-primary">
                    <span>Discount ({selectedOrder.coupon_code})</span>
                    <span>-৳{selectedOrder.discount_amount}</span>
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
