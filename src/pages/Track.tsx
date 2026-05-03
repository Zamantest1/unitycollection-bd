import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Package,
  CheckCircle2,
  Truck,
  Home as HomeIcon,
  Search,
  XCircle,
  RotateCcw,
  Copy,
  MessageCircle,
  ArrowLeft,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const WHATSAPP_NUMBER = "8801880545357";

const TIMELINE_STEPS = [
  { key: "pending", label: "Order Received", icon: Package },
  { key: "confirmed", label: "Confirmed", icon: CheckCircle2 },
  { key: "shipped", label: "On the Way", icon: Truck },
  { key: "delivered", label: "Delivered", icon: HomeIcon },
] as const;

const STATUS_INDEX: Record<string, number> = {
  pending: 0,
  confirmed: 1,
  shipped: 2,
  delivered: 3,
};

interface TrackingOrder {
  order_id: string;
  status: string;
  delivery_area: string;
  delivery_charge: number;
  subtotal: number;
  discount_amount: number;
  total: number;
  items: Array<{
    name?: string;
    image_url?: string;
    quantity?: number;
    size?: string;
    price?: number;
  }>;
  customer_name_initial: string;
  phone_masked: string;
  created_at: string;
  updated_at: string;
}

export default function Track() {
  const { orderId: paramOrderId } = useParams();
  const navigate = useNavigate();
  const [input, setInput] = useState(paramOrderId ?? "");

  useEffect(() => {
    if (paramOrderId) setInput(paramOrderId);
  }, [paramOrderId]);

  const { data, isLoading, isFetching, error } = useQuery<TrackingOrder | null>({
    queryKey: ["order-tracking", paramOrderId],
    enabled: !!paramOrderId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_order_tracking", {
        p_order_id: paramOrderId!,
      });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : null;
      if (!row) return null;
      return {
        ...row,
        items: Array.isArray(row.items) ? (row.items as TrackingOrder["items"]) : [],
      } as TrackingOrder;
    },
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = input.trim();
    if (!id) {
      toast.error("Please enter your Order ID");
      return;
    }
    navigate(`/track/${encodeURIComponent(id)}`);
  };

  const order = data ?? null;
  const isCancelled = order?.status === "cancelled";
  const isReturned = order?.status === "returned";
  const stepIndex = order ? STATUS_INDEX[order.status] ?? -1 : -1;

  const copyTrackingLink = async () => {
    if (!order) return;
    const url = `${window.location.origin}/track/${order.order_id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Tracking link copied");
    } catch {
      toast.error("Could not copy link");
    }
  };

  const waMessage = order
    ? `Hi, I'm checking on my order ${order.order_id}. Current status: ${order.status}. Tracking link: ${window.location.origin}/track/${order.order_id}`
    : "";

  return (
    <Layout>
      <div className="min-h-[80vh] bg-gradient-section">
        {/* Hero band */}
        <div className="bg-gradient-primary text-primary-foreground">
          <div className="container mx-auto px-4 py-10 md:py-14 text-center">
            <p className="text-[11px] uppercase tracking-[0.2em] text-gold/90 mb-2">
              Unity Collection · Order Tracking
            </p>
            <h1 className="font-display text-3xl md:text-4xl font-semibold">
              Track Your Order
            </h1>
            <p className="text-sm md:text-base text-primary-foreground/80 mt-2 max-w-md mx-auto">
              Enter your Order ID (e.g. <span className="text-gold font-mono">UC-O0042</span>) to see live status.
            </p>

            <form onSubmit={onSubmit} className="mt-6 max-w-md mx-auto flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value.toUpperCase())}
                placeholder="UC-O____"
                className="bg-background text-foreground"
                aria-label="Order ID"
                autoFocus={!paramOrderId}
              />
              <Button
                type="submit"
                className="bg-gradient-gold text-gold-foreground hover:opacity-95"
              >
                <Search className="h-4 w-4 mr-1.5" />
                Track
              </Button>
            </form>
          </div>
        </div>

        {/* Result area */}
        <div className="container mx-auto px-4 py-8 md:py-12">
          {paramOrderId && (
            <div className="max-w-3xl mx-auto">
              <button
                onClick={() => navigate("/track")}
                className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Search a different order
              </button>

              {isLoading || isFetching ? (
                <Card className="p-8 text-center">
                  <div className="animate-pulse">
                    <div className="h-4 bg-muted rounded w-32 mx-auto mb-3" />
                    <div className="h-3 bg-muted rounded w-48 mx-auto" />
                  </div>
                </Card>
              ) : error || !order ? (
                <Card className="p-8 text-center">
                  <XCircle className="h-10 w-10 text-destructive mx-auto mb-3" />
                  <h2 className="font-display text-xl font-semibold mb-2">
                    No order found
                  </h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    We couldn&apos;t find an order with the ID
                    <span className="font-mono mx-1 text-foreground">{paramOrderId}</span>.
                    Please double-check the ID from your confirmation message.
                  </p>
                  <a
                    href={`https://wa.me/${WHATSAPP_NUMBER}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" size="sm">
                      <MessageCircle className="h-4 w-4 mr-1.5" />
                      Need help on WhatsApp
                    </Button>
                  </a>
                </Card>
              ) : (
                <div className="space-y-6">
                  {/* Order header */}
                  <Card className="p-6 md:p-7 bg-gradient-section border-gold/30">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Order ID</p>
                        <p className="font-mono text-lg font-semibold">{order.order_id}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Placed {new Date(order.created_at).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                          {" · "}
                          For {order.customer_name_initial}··· ({order.phone_masked})
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={copyTrackingLink}>
                          <Copy className="h-4 w-4 mr-1.5" />
                          Copy link
                        </Button>
                        <a
                          href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(waMessage)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button size="sm" className="bg-gradient-gold text-gold-foreground hover:opacity-95">
                            <MessageCircle className="h-4 w-4 mr-1.5" />
                            Ask on WhatsApp
                          </Button>
                        </a>
                      </div>
                    </div>

                    {/* Cancelled / Returned banner */}
                    {(isCancelled || isReturned) && (
                      <div className="mt-5 p-3 rounded-md bg-destructive/10 border border-destructive/30 text-destructive text-sm flex items-center gap-2">
                        {isCancelled ? <XCircle className="h-4 w-4" /> : <RotateCcw className="h-4 w-4" />}
                        This order is {order.status}.
                      </div>
                    )}

                    {/* Timeline */}
                    {!isCancelled && !isReturned && (
                      <div className="mt-6">
                        <ol className="relative grid grid-cols-4 gap-2">
                          {TIMELINE_STEPS.map((step, i) => {
                            const Icon = step.icon;
                            const isDone = i <= stepIndex;
                            const isCurrent = i === stepIndex;
                            return (
                              <li key={step.key} className="flex flex-col items-center text-center">
                                <motion.div
                                  initial={{ scale: 0.6, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  transition={{ delay: i * 0.1 }}
                                  className={`relative h-10 w-10 rounded-full flex items-center justify-center border-2 ${
                                    isDone
                                      ? "bg-gradient-gold border-gold text-gold-foreground"
                                      : "bg-background border-muted text-muted-foreground"
                                  }`}
                                >
                                  <Icon className="h-5 w-5" />
                                  {isCurrent && (
                                    <span aria-hidden className="absolute inset-0 rounded-full border-2 border-gold animate-ping" />
                                  )}
                                </motion.div>
                                <span className={`mt-2 text-[11px] md:text-xs font-medium ${
                                  isDone ? "text-foreground" : "text-muted-foreground"
                                }`}>
                                  {step.label}
                                </span>
                              </li>
                            );
                          })}
                        </ol>
                        {/* progress line */}
                        <div className="mt-3 relative h-1 rounded-full bg-muted overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.max(0, stepIndex) / 3 * 100}%` }}
                            transition={{ duration: 0.6 }}
                            className="absolute inset-y-0 left-0 bg-gradient-gold"
                          />
                        </div>
                      </div>
                    )}
                  </Card>

                  {/* Items */}
                  <Card className="p-6">
                    <h3 className="font-display text-lg font-semibold mb-4">Order Items</h3>
                    <ul className="divide-y">
                      {order.items.length === 0 && (
                        <li className="py-3 text-sm text-muted-foreground">No item details available.</li>
                      )}
                      {order.items.map((it, idx) => {
                        const img = it.image_url;
                        const unit = it.price ?? 0;
                        return (
                          <li key={idx} className="py-3 flex items-center gap-3">
                            {img ? (
                              <img src={img} alt="" className="h-14 w-14 rounded object-cover bg-muted" loading="lazy" />
                            ) : (
                              <div className="h-14 w-14 rounded bg-muted flex items-center justify-center">
                                <Package className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{it.name ?? "Item"}</p>
                              <p className="text-xs text-muted-foreground">
                                {it.size ? `Size ${it.size} · ` : ""}Qty {it.quantity ?? 1}
                              </p>
                            </div>
                            <p className="text-sm font-semibold text-primary">
                              ৳{(unit * (it.quantity ?? 1)).toLocaleString()}
                            </p>
                          </li>
                        );
                      })}
                    </ul>

                    <div className="mt-4 pt-4 border-t space-y-1.5 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>৳{Number(order.subtotal).toLocaleString()}</span>
                      </div>
                      {order.discount_amount > 0 && (
                        <div className="flex justify-between text-emerald-700">
                          <span>Discount</span>
                          <span>− ৳{Number(order.discount_amount).toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Delivery ({order.delivery_area})</span>
                        <span>৳{Number(order.delivery_charge).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between font-semibold text-base pt-2 border-t">
                        <span>Total</span>
                        <span className="text-primary">৳{Number(order.total).toLocaleString()}</span>
                      </div>
                      <div className="pt-3">
                        <Badge variant="outline" className="text-xs uppercase tracking-wider">
                          Status: {order.status}
                        </Badge>
                      </div>
                    </div>
                  </Card>
                </div>
              )}
            </div>
          )}

          {!paramOrderId && (
            <Card className="max-w-xl mx-auto p-6 md:p-8 text-center bg-gradient-section">
              <Truck className="h-10 w-10 text-gold mx-auto mb-3" />
              <h2 className="font-display text-xl font-semibold mb-2">
                Have an Order ID?
              </h2>
              <p className="text-sm text-muted-foreground">
                You&apos;ll find it in the WhatsApp message we sent after you placed your order. It looks like
                <span className="font-mono mx-1 text-foreground">UC-OXXXX</span>.
              </p>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}
