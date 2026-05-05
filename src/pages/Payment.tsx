import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Copy,
  CheckCircle2,
  MessageCircle,
  ShieldCheck,
  Phone,
  User,
  Hash,
  AlertCircle,
  Loader2,
  ChevronRight,
  CreditCard,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { useBackInterceptor } from "@/hooks/useBackInterceptor";
import { toast } from "sonner";

const WHATSAPP_NUMBER = "8801880545357";
const LOGO_URL =
  "https://res.cloudinary.com/dma4usxh0/image/upload/v1769446863/Unity_Collection_Logo_ophmui.png";

/**
 * Per-brand visual styling for the well-known mobile-banking methods.
 * Anything not in this map gets the neutral fallback below — so admins
 * can add brand-new methods from /admin/payment-methods without a code
 * change, just without the bespoke colour treatment.
 */
const BRAND_STYLES: Record<
  string,
  { color: string; colorDark: string; fg: string; logo: string }
> = {
  bkash: {
    color: "#E2136E",
    colorDark: "#9D0848",
    fg: "#FFFFFF",
    logo: "/payment/bkash.svg",
  },
  nagad: {
    color: "#EE1C25",
    colorDark: "#9F1318",
    fg: "#FFFFFF",
    logo: "/payment/nagad.svg",
  },
  rocket: {
    color: "#8C1F8E",
    colorDark: "#5A1359",
    fg: "#FFFFFF",
    logo: "/payment/rocket.svg",
  },
};

const DEFAULT_STYLE = {
  color: "#0F4D45",
  colorDark: "#0B3A34",
  fg: "#F8F6F2",
  logo: "",
};

interface PaymentMethodRow {
  id: string;
  key: string;
  name: string;
  type: string;
  payment_type: string | null;
  account_number: string;
  instructions: string | null;
  is_active: boolean | null;
  display_order: number | null;
}

type PaymentType = "advance_delivery" | "full_payment";

interface MethodConfig {
  key: string;
  name: string;
  type: "Send Money" | "Payment";
  paymentType: PaymentType;
  number: string;
  color: string;
  colorDark: string;
  fg: string;
  logo: string;
  instructions: string;
}

const toMethodConfig = (row: PaymentMethodRow): MethodConfig => {
  const style = BRAND_STYLES[row.key] ?? DEFAULT_STYLE;
  return {
    key: row.key,
    name: row.name,
    type: row.type === "Payment" ? "Payment" : "Send Money",
    paymentType:
      row.payment_type === "advance_delivery"
        ? "advance_delivery"
        : "full_payment",
    number: row.account_number,
    color: style.color,
    colorDark: style.colorDark,
    fg: style.fg,
    logo: style.logo,
    instructions: row.instructions ?? "",
  };
};

interface OrderRow {
  order_id: string;
  status: string;
  total: number;
  delivery_charge: number;
  customer_name_initial: string;
  phone_masked: string;
  payment_status: string | null;
  created_at: string;
}

export default function Payment() {
  const { orderId, method: methodParam } = useParams<{
    orderId: string;
    method?: string;
  }>();
  const navigate = useNavigate();

  // Order summary (uses the same anon-safe RPC as /track)
  const {
    data: order,
    isLoading,
    error,
  } = useQuery<OrderRow | null>({
    queryKey: ["payment-order", orderId],
    enabled: !!orderId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_order_tracking", {
        p_order_id: orderId!,
      });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : null;
      return row as OrderRow | null;
    },
  });

  // Admin-controlled method list (active only)
  const { data: methodRows, isLoading: methodsLoading } = useQuery<
    PaymentMethodRow[]
  >({
    queryKey: ["payment-methods-public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_methods")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as PaymentMethodRow[];
    },
  });

  const methodMap = useMemo(() => {
    const m: Record<string, MethodConfig> = {};
    (methodRows ?? []).forEach((row) => {
      m[row.key] = toMethodConfig(row);
    });
    return m;
  }, [methodRows]);

  const method = methodParam && methodParam in methodMap ? methodParam : null;
  const selectedConfig = method ? methodMap[method] : null;

  // Form state for the method-specific page. Hydrated from localStorage
  // on mount so refresh / accidental close doesn't lose the customer's
  // typing.
  const storageKey = orderId ? `unity:payment:${orderId}` : null;
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [trxId, setTrxId] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const hydratedRef = useRef(false);

  // One-shot hydrate.
  useEffect(() => {
    if (!storageKey || hydratedRef.current) return;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as {
          name?: string;
          phone?: string;
          trxId?: string;
          method?: string;
        };
        if (parsed.name) setName(parsed.name);
        if (parsed.phone) setPhone(parsed.phone);
        if (parsed.trxId) setTrxId(parsed.trxId);
        // If they had a method picked previously and the URL doesn't
        // already point at one, restore it so they land back on the
        // same screen they left.
        if (
          parsed.method &&
          !methodParam &&
          parsed.method in (methodMap || {})
        ) {
          navigate(`/payment/${orderId}/${parsed.method}`, { replace: true });
        }
      }
    } catch {
      // ignore corrupt JSON
    }
    hydratedRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey, methodMap]);

  // Persist any later edits.
  useEffect(() => {
    if (!storageKey || !hydratedRef.current) return;
    try {
      window.localStorage.setItem(
        storageKey,
        JSON.stringify({ name, phone, trxId, method: methodParam ?? null }),
      );
    } catch {
      // quota / private mode — silently ignore
    }
  }, [storageKey, name, phone, trxId, methodParam]);

  // Reset form / submission state when method changes (but not the
  // saved name / phone — those are stable across method choices).
  useEffect(() => {
    setSubmitted(false);
    setTrxId("");
  }, [methodParam]);

  const orderTotal = order?.total ?? 0;
  const deliveryCharge = order?.delivery_charge ?? 0;
  // Amount to charge for the chosen method depends on its payment_type:
  // advance_delivery → just the delivery charge; full_payment → entire total.
  const amount =
    selectedConfig?.paymentType === "advance_delivery"
      ? deliveryCharge
      : orderTotal;
  const totalPretty = useMemo(() => `৳${amount.toLocaleString()}`, [amount]);
  const orderTotalPretty = useMemo(
    () => `৳${orderTotal.toLocaleString()}`,
    [orderTotal],
  );
  const deliveryPretty = useMemo(
    () => `৳${deliveryCharge.toLocaleString()}`,
    [deliveryCharge],
  );

  const submitPayment = useMutation({
    mutationFn: async (params: {
      methodKey: string;
      transactionId: string;
      name: string;
      phone: string;
      amount: number;
    }) => {
      if (!orderId) throw new Error("Missing order id");
      const { data, error } = await supabase.rpc("submit_payment", {
        p_order_id: orderId,
        p_method_key: params.methodKey,
        p_customer_name: params.name,
        p_customer_phone: params.phone,
        p_transaction_id: params.transactionId,
        p_amount: params.amount,
      });
      if (error) throw error;
      return data;
    },
    onError: (err: Error) => {
      toast.error(err.message || "Could not submit payment");
    },
  });

  const cancelOrder = useMutation({
    mutationFn: async () => {
      if (!orderId) throw new Error("Missing order id");
      // RPC defined in 20260507000000_abandoned_order_recovery.sql.
      // Idempotent + safe: refuses if a payment has been verified.
      const { data, error } = await supabase.rpc("cancel_pending_order", {
        p_order_id: orderId,
        p_reason: "customer_back_out",
      });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      return row as
        | { cancelled: boolean; status: string | null; message: string }
        | null;
    },
  });

  // Back-button intercept state. Populated by useBackInterceptor
  // (defined below) when the user presses Back. We hold the "release"
  // callback so a Yes-click on the dialog can actually leave the page.
  const [cancelOpen, setCancelOpen] = useState(false);
  const releaseRef = useRef<(() => void) | null>(null);

  // Disable the intercept once the customer has actually submitted
  // payment — at that point Back should just navigate normally.
  const interceptActive =
    !!orderId &&
    !submitted &&
    !cancelOrder.isPending &&
    order?.status === "pending";

  useBackInterceptor(interceptActive, (release) => {
    releaseRef.current = release;
    setCancelOpen(true);
  });

  const handleConfirmCancel = async () => {
    try {
      const result = await cancelOrder.mutateAsync();
      if (storageKey) window.localStorage.removeItem(storageKey);
      if (result && result.cancelled) {
        toast.success("Order cancelled");
      } else if (result?.message) {
        toast.message(result.message);
      }
    } catch (err) {
      toast.error((err as Error).message || "Could not cancel order");
    } finally {
      setCancelOpen(false);
      // Release the back-button trap and let the natural back happen.
      const release = releaseRef.current;
      releaseRef.current = null;
      if (release) release();
      else navigate("/", { replace: true });
    }
  };

  const handleStay = () => {
    setCancelOpen(false);
    releaseRef.current = null;
    // The interceptor has already re-armed itself, so doing nothing
    // keeps the user on /payment.
  };

  // Renders through Radix's portal, so it floats above whichever
  // /payment screen is currently active.
  const cancelDialogJsx = (
    <AlertDialog open={cancelOpen} onOpenChange={(o) => !o && handleStay()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure you want to cancel this order?</AlertDialogTitle>
          <AlertDialogDescription>
            You can place a new order from the shop anytime.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleStay} disabled={cancelOrder.isPending}>
            No, keep order
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleConfirmCancel();
            }}
            disabled={cancelOrder.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {cancelOrder.isPending && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            Yes, cancel
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  const copyNumber = async (n: string) => {
    try {
      await navigator.clipboard.writeText(n);
      toast.success("Number copied");
    } catch {
      toast.error("Could not copy");
    }
  };

  const buildWhatsAppMessage = (methodCfg: MethodConfig) => {
    const lines = [
      "📥 *Payment submitted — Unity Collection*",
      ``,
      `📋 *Order ID:* ${orderId}`,
      `💳 *Method:* ${methodCfg.name} (${methodCfg.type})`,
      `📞 *Sent to:* ${methodCfg.number}`,
      `💰 *Amount:* ৳${amount.toLocaleString()}`,
      ``,
      `👤 *Name:* ${name || "—"}`,
      `📱 *My number:* ${phone || "—"}`,
      `🧾 *Transaction ID:* ${trxId || "—"}`,
      ``,
      `Please verify and confirm my order.`,
    ];
    return encodeURIComponent(lines.join("\n"));
  };

  /* ----------------------------------------------------------- */
  /*  Loading / error states                                     */
  /* ----------------------------------------------------------- */
  if (!orderId) {
    return (
      <Layout hideHeader>
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="font-display text-2xl font-bold">Missing order</h1>
          <p className="text-muted-foreground mt-2">
            We couldn&apos;t find an order ID in the URL.
          </p>
          <Link to="/" className="inline-block mt-6">
            <Button className="rounded-full bg-gradient-gold-strong text-gold-foreground">
              Back to home
            </Button>
          </Link>
        </div>
      </Layout>
    );
  }

  if (isLoading || methodsLoading) {
    return (
      <Layout hideHeader>
        <div className="container mx-auto px-4 py-16 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gold" />
        </div>
      </Layout>
    );
  }

  if (error || !order) {
    return (
      <Layout hideHeader>
        <div className="container mx-auto px-4 py-16 max-w-md text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-3">
            <AlertCircle className="h-7 w-7 text-destructive" />
          </div>
          <h1 className="font-display text-2xl font-bold">Order not found</h1>
          <p className="text-muted-foreground mt-2">
            We couldn&apos;t find an order with ID
            <span className="font-mono ml-1">{orderId}</span>. Double-check the link
            from your confirmation message.
          </p>
          <Link to={`/track/${orderId}`} className="inline-block mt-6">
            <Button className="rounded-full bg-gradient-gold-strong text-gold-foreground">
              Try tracking instead
            </Button>
          </Link>
        </div>
      </Layout>
    );
  }

  /* ----------------------------------------------------------- */
  /*  Header — shown on selector + method form                   */
  /* ----------------------------------------------------------- */
  const Header = ({
    accent,
    accentDark,
    fg,
  }: {
    accent: string;
    accentDark: string;
    fg: string;
  }) => (
    <div
      className="relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${accent} 0%, ${accentDark} 100%)`,
        color: fg,
      }}
    >
      <div
        aria-hidden
        className="absolute inset-0 opacity-20 mix-blend-overlay"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 0%, rgba(255,255,255,0.4) 0%, transparent 40%)",
        }}
      />
      <div className="relative container mx-auto px-4 py-5 md:py-7 flex items-center gap-3">
        <span className="inline-flex items-center justify-center h-11 w-11 rounded-full bg-white/15 ring-2 ring-white/30 shadow-md backdrop-blur-sm">
          <img
            src={LOGO_URL}
            alt="Unity Collection"
            className="h-7 w-7 object-contain"
          />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-[0.25em] opacity-80">
            Unity Collection
          </p>
          <h1 className="font-display text-base md:text-lg font-bold truncate">
            Pay {totalPretty}
            <span className="hidden md:inline"> · For Men, Bangladesh</span>
          </h1>
          <p className="text-[11px] md:text-xs opacity-80 mt-0.5">
            Invoice No: <span className="font-mono">{order.order_id}</span>
          </p>
        </div>
      </div>
    </div>
  );

  /* ----------------------------------------------------------- */
  /*  Step 3 — Confirmation                                      */
  /* ----------------------------------------------------------- */
  if (submitted && method) {
    const cfg = methodMap[method];
    return (
      <Layout hideHeader>
        <div className="bg-gold-soft/15 min-h-[calc(100vh-4rem)]">
          <Header accent={cfg.color} accentDark={cfg.colorDark} fg={cfg.fg} />

          <div className="container mx-auto px-4 py-8 max-w-md">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-2xl shadow-md ring-1 ring-gold/15 p-6 md:p-8 text-center"
            >
              <span className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-500/15 text-green-600 mb-4">
                <CheckCircle2 className="h-7 w-7" />
              </span>
              <h2 className="font-display text-xl md:text-2xl font-bold text-foreground">
                Payment submitted for review
              </h2>
              <p className="text-muted-foreground mt-2">
                We&apos;ll verify your transaction and confirm your order shortly. You
                can check the status anytime from your tracking page.
              </p>

              <dl className="text-left text-sm mt-5 space-y-2 rounded-xl bg-gold-soft/30 p-4 border border-gold/15">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Order</dt>
                  <dd className="font-mono">{order.order_id}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Method</dt>
                  <dd className="font-medium">{cfg.name}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Amount</dt>
                  <dd className="font-semibold">{totalPretty}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">TrxID</dt>
                  <dd className="font-mono break-all text-right max-w-[60%]">
                    {trxId || "—"}
                  </dd>
                </div>
              </dl>

              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=${buildWhatsAppMessage(cfg)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 w-full inline-flex items-center justify-center gap-2 h-12 rounded-full bg-[#25D366] text-white font-medium hover:bg-[#1DB954] transition-colors shadow-[0_10px_30px_-8px_rgba(37,211,102,0.55)]"
              >
                <MessageCircle className="h-5 w-5" />
                Send to WhatsApp
              </a>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <Link to={`/track/${order.order_id}`}>
                  <Button
                    variant="outline"
                    className="w-full rounded-full border-gold/30"
                  >
                    Track order
                  </Button>
                </Link>
                <Link to="/shop">
                  <Button
                    variant="outline"
                    className="w-full rounded-full border-gold/30"
                  >
                    Continue shopping
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </Layout>
    );
  }

  /* ----------------------------------------------------------- */
  /*  Step 2 — Method-specific branded page                       */
  /* ----------------------------------------------------------- */
  if (method) {
    const cfg = methodMap[method];
    const formValid =
      name.trim().length >= 2 &&
      phone.trim().length >= 11 &&
      trxId.trim().length >= 4;

    const onSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!formValid) {
        toast.error("Please fill in name, phone and Transaction ID.");
        return;
      }
      try {
        await submitPayment.mutateAsync({
          methodKey: cfg.key,
          transactionId: trxId.trim(),
          name: name.trim(),
          phone: phone.trim(),
          amount,
        });
        setSubmitted(true);
        // Customer has paid — drop the saved form draft so the next
        // visit starts clean.
        if (storageKey) {
          try {
            window.localStorage.removeItem(storageKey);
          } catch {
            /* ignore */
          }
        }
      } catch {
        // Toast already shown by onError handler.
      }
    };

    return (
      <Layout hideHeader>
        <div className="bg-gold-soft/15 min-h-[calc(100vh-4rem)]">
          <Header accent={cfg.color} accentDark={cfg.colorDark} fg={cfg.fg} />

          <div className="container mx-auto px-4 py-6 max-w-xl">
            <button
              type="button"
              onClick={() => navigate(`/payment/${order.order_id}`)}
              className="text-sm text-muted-foreground hover:text-foreground mb-3 inline-flex items-center gap-1"
            >
              <ArrowLeft className="h-4 w-4" />
              Choose a different method
            </button>

            {/* Method card */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl bg-card shadow-md ring-1 ring-gold/15 overflow-hidden"
            >
              <div
                className="flex items-center gap-3 px-4 py-3"
                style={{ background: `${cfg.color}10` }}
              >
                <span className="inline-flex items-center justify-center h-11 w-11 rounded-xl bg-white shadow ring-1 ring-black/5">
                  {cfg.logo ? (
                    <img src={cfg.logo} alt={cfg.name} className="h-6 w-auto" />
                  ) : (
                    <CreditCard
                      className="h-6 w-6"
                      style={{ color: cfg.color }}
                    />
                  )}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-display font-bold text-foreground">{cfg.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {cfg.type} · Manual verification
                  </p>
                </div>
                <Badge
                  className="border-0"
                  style={{ background: cfg.color, color: cfg.fg }}
                >
                  {totalPretty}
                </Badge>
              </div>

              {/* Receiving number block */}
              <div className="px-4 md:px-5 py-5 border-b border-border">
                <p
                  className="text-[10px] uppercase tracking-[0.2em] font-semibold mb-1.5"
                  style={{ color: cfg.colorDark }}
                >
                  {cfg.type === "Send Money"
                    ? "Send Money to this number"
                    : "Pay to this merchant number"}
                </p>
                <p className="text-xs text-muted-foreground mb-2">
                  {cfg.paymentType === "advance_delivery" ? (
                    <>
                      Send <strong>{totalPretty}</strong> as the delivery
                      charge. The remaining{" "}
                      <strong>
                        ৳{(orderTotal - deliveryCharge).toLocaleString()}
                      </strong>{" "}
                      is collected in cash on delivery.
                    </>
                  ) : (
                    <>
                      Send the full order amount{" "}
                      <strong>{totalPretty}</strong>. Nothing is owed on
                      delivery.
                    </>
                  )}
                </p>
                <div className="flex items-center gap-3">
                  <p className="font-mono text-xl md:text-2xl font-bold text-foreground tracking-wide">
                    {cfg.number}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => copyNumber(cfg.number)}
                    className="rounded-full ml-auto h-9"
                  >
                    <Copy className="h-3.5 w-3.5 mr-1" />
                    Copy
                  </Button>
                </div>
                {cfg.instructions && (
                  <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                    {cfg.instructions}
                  </p>
                )}
              </div>

              {/* Form */}
              <form onSubmit={onSubmit} className="p-4 md:p-5 space-y-4">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="pay-name"
                      className="text-xs font-medium text-muted-foreground inline-flex items-center gap-1"
                    >
                      <User className="h-3 w-3" /> Your name
                    </Label>
                    <Input
                      id="pay-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="As on order"
                      className="h-11 rounded-lg"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="pay-phone"
                      className="text-xs font-medium text-muted-foreground inline-flex items-center gap-1"
                    >
                      <Phone className="h-3 w-3" /> Your phone (sender)
                    </Label>
                    <Input
                      id="pay-phone"
                      inputMode="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="01XXXXXXXXX"
                      className="h-11 rounded-lg"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="pay-trx"
                    className="text-xs font-medium text-muted-foreground inline-flex items-center gap-1"
                  >
                    <Hash className="h-3 w-3" /> Transaction ID (TrxID)
                  </Label>
                  <Input
                    id="pay-trx"
                    value={trxId}
                    onChange={(e) => setTrxId(e.target.value.toUpperCase())}
                    placeholder="e.g. 8N7C4D1Z2A"
                    className="h-12 rounded-lg font-mono tracking-wider text-center text-lg"
                    style={{ borderColor: `${cfg.color}55` }}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    You&apos;ll find this in your {cfg.name} app message after a
                    successful {cfg.type.toLowerCase()}.
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={submitPayment.isPending}
                  className="w-full h-12 rounded-full shadow-md"
                  style={{
                    background: `linear-gradient(135deg, ${cfg.color}, ${cfg.colorDark})`,
                    color: cfg.fg,
                  }}
                >
                  {submitPayment.isPending && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Submit & confirm payment
                </Button>

                <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground justify-center">
                  <ShieldCheck className="h-3 w-3" />
                  Your payment is verified manually by Unity Collection. No card data
                  is collected.
                </p>
              </form>
            </motion.div>
          </div>
        </div>
        {cancelDialogJsx}
      </Layout>
    );
  }

  /* ----------------------------------------------------------- */
  /*  Step 1 — Method selector                                   */
  /* ----------------------------------------------------------- */
  const methodList = Object.values(methodMap).sort(
    (a, b) => (BRAND_STYLES[a.key] ? 0 : 1) - (BRAND_STYLES[b.key] ? 0 : 1),
  );
  const advanceMethods = methodList.filter(
    (m) => m.paymentType === "advance_delivery",
  );
  const fullMethods = methodList.filter(
    (m) => m.paymentType === "full_payment",
  );
  const remainingAfterDelivery = Math.max(0, orderTotal - deliveryCharge);

  const renderMethodCard = (cfg: MethodConfig, displayAmount: number) => (
    <motion.li
      key={cfg.key}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Link
        to={`/payment/${order.order_id}/${cfg.key}`}
        className="group flex items-center gap-4 rounded-2xl bg-card ring-1 ring-border hover:ring-gold/40 hover:shadow-md transition-all p-3 md:p-4"
      >
        <span
          className="inline-flex items-center justify-center h-12 w-12 md:h-14 md:w-14 rounded-xl bg-white shadow-sm ring-1 ring-black/5"
          style={{ background: `${cfg.color}10` }}
        >
          {cfg.logo ? (
            <img src={cfg.logo} alt={cfg.name} className="h-7 w-auto" />
          ) : (
            <CreditCard
              className="h-7 w-7"
              style={{ color: cfg.color }}
            />
          )}
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-display font-bold text-foreground">{cfg.name}</p>
          <p className="text-xs text-muted-foreground">
            {cfg.type} ·{" "}
            <span className="font-mono">{cfg.number}</span>
          </p>
        </div>
        <div className="text-right shrink-0">
          <p
            className="font-display font-bold text-sm md:text-base"
            style={{ color: cfg.colorDark }}
          >
            ৳{displayAmount.toLocaleString()}
          </p>
          <ChevronRight
            className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 ml-auto"
            aria-hidden
          />
        </div>
      </Link>
    </motion.li>
  );

  return (
    <Layout hideHeader>
      <div className="bg-gold-soft/15 min-h-[calc(100vh-4rem)]">
        {/* Brand header */}
        <Header
          accent="#0F4D45"
          accentDark="#0B3A34"
          fg="#F8F6F2"
        />

        <div className="container mx-auto px-4 py-6 max-w-xl">
          <Link
            to={`/track/${order.order_id}`}
            className="text-sm text-muted-foreground hover:text-foreground mb-3 inline-flex items-center gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            View order details
          </Link>

          {/* Order summary */}
          <div className="rounded-2xl bg-card shadow-sm ring-1 ring-gold/15 p-4 md:p-5 mb-4">
            <p className="text-[10px] uppercase tracking-[0.25em] text-gold font-semibold">
              Order summary
            </p>
            <div className="mt-2 flex items-baseline justify-between">
              <p className="font-display font-bold text-lg text-foreground">
                Invoice No
              </p>
              <p className="font-mono text-sm text-foreground">
                {order.order_id}
              </p>
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <p className="text-sm text-muted-foreground">Customer</p>
              <p className="text-sm text-foreground">
                {order.customer_name_initial}
                <span className="ml-2 font-mono text-muted-foreground">
                  {order.phone_masked}
                </span>
              </p>
            </div>
            <div className="mt-3 flex items-baseline justify-between border-t border-border pt-3">
              <p className="text-sm text-muted-foreground">Order total</p>
              <p className="font-display text-2xl font-bold text-gold">
                {orderTotalPretty}
              </p>
            </div>
            {deliveryCharge > 0 && (
              <div className="mt-1 flex items-baseline justify-between text-xs text-muted-foreground">
                <span>includes delivery charge</span>
                <span className="font-mono">{deliveryPretty}</span>
              </div>
            )}
          </div>

          <h2 className="font-display text-base font-semibold text-foreground mb-2">
            Choose how you&apos;d like to pay
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            All methods are verified manually. After paying, submit your
            Transaction ID and we&apos;ll confirm shortly.
          </p>

          {methodList.length === 0 ? (
            <div className="rounded-2xl bg-card ring-1 ring-border p-6 text-center text-sm text-muted-foreground">
              No payment methods are currently available. Please contact support
              on WhatsApp to complete your order.
            </div>
          ) : (
            <div className="space-y-6">
              {advanceMethods.length > 0 && (
                <section>
                  <div className="flex items-baseline justify-between mb-2">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.18em] font-semibold text-amber-700">
                        Pay delivery charge only
                      </p>
                      <h3 className="font-display text-sm font-semibold text-foreground">
                        Send {deliveryPretty} now ·{" "}
                        <span className="text-muted-foreground font-normal">
                          rest paid in cash on delivery
                        </span>
                      </h3>
                    </div>
                    <span className="hidden sm:block text-[11px] text-muted-foreground">
                      ৳{remainingAfterDelivery.toLocaleString()} on delivery
                    </span>
                  </div>
                  <ul className="space-y-3">
                    <AnimatePresence initial={false}>
                      {advanceMethods.map((cfg) =>
                        renderMethodCard(cfg, deliveryCharge),
                      )}
                    </AnimatePresence>
                  </ul>
                </section>
              )}

              {fullMethods.length > 0 && (
                <section>
                  <div className="flex items-baseline justify-between mb-2">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.18em] font-semibold text-emerald-700">
                        Pay full amount
                      </p>
                      <h3 className="font-display text-sm font-semibold text-foreground">
                        Send {orderTotalPretty} ·{" "}
                        <span className="text-muted-foreground font-normal">
                          nothing owed on delivery
                        </span>
                      </h3>
                    </div>
                  </div>
                  <ul className="space-y-3">
                    <AnimatePresence initial={false}>
                      {fullMethods.map((cfg) =>
                        renderMethodCard(cfg, orderTotal),
                      )}
                    </AnimatePresence>
                  </ul>
                </section>
              )}
            </div>
          )}

          <p className="mt-5 flex items-center gap-1.5 text-[11px] text-muted-foreground justify-center">
            <ShieldCheck className="h-3 w-3" />
            Manual verification · No card details required.
          </p>
        </div>
      </div>
      {cancelDialogJsx}
    </Layout>
  );
}
