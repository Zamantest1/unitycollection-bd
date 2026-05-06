import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
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
import {
  Clock,
  MessageCircle,
  Phone,
  Loader2,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AbandonedRow {
  id: string;
  order_id: string;
  customer_name: string;
  phone: string;
  delivery_area: string | null;
  total: number;
  delivery_charge: number;
  item_count: number;
  has_submission: boolean;
  created_at: string;
  age_minutes: number;
}

const AGE_BUCKETS = [
  { label: "Older than 4 hours", minutes: 240 },
  { label: "Older than 12 hours", minutes: 720 },
  { label: "Older than 24 hours", minutes: 1440 },
  { label: "Older than 3 days", minutes: 4320 },
  { label: "All pending", minutes: 0 },
];

const formatAge = (mins: number) => {
  if (mins < 60) return `${mins}m ago`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h}h ${mins % 60}m ago`;
  const d = Math.floor(h / 24);
  return `${d}d ${h % 24}h ago`;
};

const buildWhatsAppLink = (
  phone: string,
  orderId: string,
  customerName: string,
  total: number,
) => {
  // Strip everything except digits, then ensure country code prefix.
  // Bangladesh local numbers usually start with `01…`; the wa.me link
  // needs them prefixed with the BD country code (880).
  const digits = phone.replace(/\D+/g, "");
  let intl = digits;
  if (intl.startsWith("0")) intl = `880${intl.slice(1)}`;
  if (intl.startsWith("88") && !intl.startsWith("880")) intl = `8${intl}`;

  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://unitycollectionbd.com";
  const greeting = customerName?.split(" ")[0] || "there";

  const message = [
    `Hi ${greeting}, this is Unity Collection.`,
    `Your order *${orderId}* (৳${Number(total).toLocaleString()}) is still pending payment.`,
    `Please complete it here: ${origin}/payment/${orderId}`,
    `Reply if you'd like help, or let us know if you'd like to cancel.`,
  ].join("\n");

  return `https://wa.me/${intl}?text=${encodeURIComponent(message)}`;
};

const AdminAbandoned = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [minAgeMinutes, setMinAgeMinutes] = useState(240);
  const [pendingCancel, setPendingCancel] = useState<AbandonedRow | null>(null);

  const {
    data: rows = [],
    isLoading,
    refetch,
    isFetching,
    error,
  } = useQuery({
    queryKey: ["admin-abandoned", minAgeMinutes],
    queryFn: async () => {
      // RPC defined in 20260507000000_abandoned_order_recovery.sql.
      const { data, error } = await supabase.rpc("list_abandoned_orders", {
        p_min_age_minutes: minAgeMinutes,
      });
      if (error) throw error;
      return (data ?? []) as AbandonedRow[];
    },
    // Manual-refresh-only: don't reload on tab focus / remount /
    // reconnect, and don't auto-retry on error (the default 3 retries
    // make a failing RPC look like an "auto refresh" loop).  The
    // Refresh button is the single source of truth for refetching.
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: false,
  });

  const cancelMut = useMutation({
    mutationFn: async (orderId: string) => {
      const { data, error } = await supabase.rpc("admin_cancel_pending_order", {
        p_order_id: orderId,
        p_reason: "admin_dashboard",
      });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      return row as { cancelled: boolean; message: string } | null;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["admin-abandoned"] });
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      if (result?.cancelled) {
        toast({ title: "Order cancelled and stock restored." });
      } else if (result?.message) {
        toast({ title: result.message });
      }
    },
    onError: (err: Error) => {
      toast({ title: "Could not cancel order", description: err.message, variant: "destructive" });
    },
  });

  const totalAbandoned = rows.length;
  const totalValueAtRisk = useMemo(
    () => rows.reduce((sum, r) => sum + Number(r.total || 0), 0),
    [rows],
  );

  return (
    <AdminLayout title="Abandoned Orders">
      <div className="mb-4 p-4 rounded-lg border border-amber-400 bg-amber-100 dark:border-amber-700 dark:bg-amber-950/40 flex flex-col md:flex-row md:items-center gap-3 shadow-sm">
        <div className="flex items-center gap-2 text-amber-900 dark:text-amber-100">
          <Clock className="h-5 w-5" />
          <span className="text-sm font-semibold">
            {totalAbandoned} pending {totalAbandoned === 1 ? "order" : "orders"}
            {" — "}
            ৳{totalValueAtRisk.toLocaleString()} at risk
          </span>
        </div>
        <p className="text-xs text-amber-900/80 dark:text-amber-200/90 md:ml-auto">
          Customer placed an order but never paid. Send a reminder, or cancel
          to free up stock.
        </p>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Select
          value={String(minAgeMinutes)}
          onValueChange={(v) => setMinAgeMinutes(parseInt(v))}
        >
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {AGE_BUCKETS.map((b) => (
              <SelectItem key={b.minutes} value={String(b.minutes)}>
                {b.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw
            className={`h-4 w-4 mr-1 ${isFetching ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-6 text-center">
          <XCircle className="h-8 w-8 mx-auto mb-2 text-destructive" />
          <p className="font-medium text-destructive">
            Could not load abandoned orders
          </p>
          <p className="text-sm text-muted-foreground mt-1 break-words">
            {(error as Error).message}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isFetching ? "animate-spin" : ""}`} />
            Try again
          </Button>
        </div>
      ) : isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-20 bg-muted animate-pulse rounded-lg"
            />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-12 text-center text-muted-foreground">
          <Clock className="h-8 w-8 mx-auto mb-2 opacity-40" />
          <p className="font-medium">Nothing here</p>
          <p className="text-sm">
            No abandoned orders match this filter. New unpaid orders appear here
            after the time threshold passes.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="text-left font-semibold px-4 py-3">Order</th>
                  <th className="text-left font-semibold px-4 py-3">Customer</th>
                  <th className="text-left font-semibold px-4 py-3 hidden md:table-cell">Phone</th>
                  <th className="text-left font-semibold px-4 py-3 hidden lg:table-cell">Area</th>
                  <th className="text-right font-semibold px-4 py-3">Total</th>
                  <th className="text-right font-semibold px-4 py-3 hidden md:table-cell">Items</th>
                  <th className="text-left font-semibold px-4 py-3">Age</th>
                  <th className="text-right font-semibold px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((r) => {
                  const wa = buildWhatsAppLink(r.phone, r.order_id, r.customer_name, r.total);
                  return (
                    <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs">{r.order_id}</td>
                      <td className="px-4 py-3 font-medium">{r.customer_name}</td>
                      <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                        <a
                          href={`tel:${r.phone}`}
                          className="inline-flex items-center gap-1 hover:text-foreground"
                        >
                          <Phone className="h-3 w-3" />
                          {r.phone}
                        </a>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">
                        {r.delivery_area || "—"}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">
                        ৳{Number(r.total).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right hidden md:table-cell text-muted-foreground">
                        {r.item_count}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-muted-foreground">
                            {formatAge(r.age_minutes)}
                          </span>
                          {r.has_submission && (
                            <Badge variant="outline" className="w-fit text-[10px]">
                              Submission attached
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <a
                            href={wa}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-1 h-9 px-3 rounded-full bg-[#25D366] text-white text-xs font-medium hover:bg-[#1DB954] transition-colors"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Remind</span>
                          </a>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-9 text-destructive hover:text-destructive"
                            onClick={() => setPendingCancel(r)}
                            disabled={cancelMut.isPending}
                          >
                            <XCircle className="h-3.5 w-3.5 mr-1" />
                            Cancel
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
      )}

      <AlertDialog
        open={!!pendingCancel}
        onOpenChange={(o) => !o && setPendingCancel(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Cancel order {pendingCancel?.order_id}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              The order will be marked cancelled and stock for{" "}
              {pendingCancel?.item_count}{" "}
              {pendingCancel?.item_count === 1 ? "item" : "items"} will be
              restored. Any pending payment submission will be rejected. This
              cannot be undone — the customer will need to place a fresh order
              if they change their mind.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelMut.isPending}>Keep order</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (!pendingCancel) return;
                cancelMut.mutate(pendingCancel.order_id, {
                  onSettled: () => setPendingCancel(null),
                });
              }}
              disabled={cancelMut.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {cancelMut.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Cancel order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminAbandoned;
