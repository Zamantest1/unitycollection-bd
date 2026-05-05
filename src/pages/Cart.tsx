import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/layout/Layout";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { PaymentLogos } from "@/components/payment/PaymentLogos";
import {
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowLeft,
  Loader2,
  Tag,
  Check,
  X,
  Users,
  CreditCard,
  PartyPopper,
  Truck,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Lock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const orderSchema = z.object({
  customerName: z.string().min(2, "Name must be at least 2 characters").max(100),
  phone: z.string().min(11, "Phone number must be at least 11 digits").max(15),
  address: z.string().min(10, "Please provide a complete address").max(500),
  deliveryArea: z.enum(["dhaka", "outside"]),
});

type OrderFormData = z.infer<typeof orderSchema>;

interface Member {
  id: string;
  member_code: string;
  name: string;
  phone: string;
  address: string | null;
  discount_value: number;
  discount_type: string;
  total_purchases: number;
}

const Cart = () => {
  const { items, removeItem, updateQuantity, clearCart, subtotal, itemCount } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [couponCode, setCouponCode] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(
    null,
  );
  const [validatedReferral, setValidatedReferral] = useState<string | null>(null);
  const [detectedMember, setDetectedMember] = useState<Member | null>(null);
  const [memberDiscount, setMemberDiscount] = useState(0);
  const [showMembershipCongrats, setShowMembershipCongrats] = useState(false);
  const [newMemberCode, setNewMemberCode] = useState<string | null>(null);
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);
  const [showCodes, setShowCodes] = useState(false);
  const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: { deliveryArea: "dhaka" },
  });

  const phoneValue = watch("phone");
  const deliveryArea = watch("deliveryArea");
  const deliveryCharge = deliveryArea === "dhaka" ? 60 : 120;
  const couponDiscount = appliedCoupon?.discount || 0;
  const totalDiscount = couponDiscount + memberDiscount;
  const total = subtotal + deliveryCharge - totalDiscount;

  const { data: settings } = useQuery({
    queryKey: ["membership-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("settings").select("*");
      if (error) throw error;
      const settingsMap: Record<string, unknown> = {};
      data?.forEach((s: { key: string; value: unknown }) => {
        settingsMap[s.key] = s.value;
      });
      return settingsMap;
    },
  });

  // Auto-detect member by phone
  useEffect(() => {
    const detectMember = async () => {
      if (!phoneValue || phoneValue.length < 11) {
        setDetectedMember(null);
        setMemberDiscount(0);
        return;
      }

      const { data, error } = await supabase
        .from("members")
        .select("*")
        .eq("phone", phoneValue)
        .eq("is_active", true)
        .maybeSingle();

      if (!error && data) {
        setDetectedMember(data as Member);
        let discount = 0;
        if (data.discount_type === "percentage") {
          discount = Math.round((subtotal * data.discount_value) / 100);
        } else {
          discount = data.discount_value;
        }
        setMemberDiscount(discount);

        if (!appliedCoupon) {
          toast({
            title: `Welcome back, ${data.name}!`,
            description: `Member discount of ${
              data.discount_type === "percentage"
                ? `${data.discount_value}%`
                : `৳${data.discount_value}`
            } applied`,
          });
        }
      } else {
        setDetectedMember(null);
        setMemberDiscount(0);
      }
    };

    const timeout = setTimeout(detectMember, 500);
    return () => clearTimeout(timeout);
  }, [phoneValue, subtotal, toast, appliedCoupon]);

  const validateCoupon = useMutation({
    mutationFn: async (code: string) => {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", code.toUpperCase())
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error("Invalid coupon code");
      if (data.expiry_date && new Date(data.expiry_date) < new Date())
        throw new Error("Coupon has expired");
      if (data.min_purchase && subtotal < data.min_purchase)
        throw new Error(`Minimum purchase of ৳${data.min_purchase} required`);

      let discountAmount = 0;
      if (data.discount_type === "fixed") discountAmount = data.discount_value;
      else discountAmount = Math.round((subtotal * data.discount_value) / 100);

      return { code: data.code, discount: discountAmount };
    },
    onSuccess: (data) => {
      setAppliedCoupon(data);
      toast({ title: "Coupon Applied!", description: `You saved ৳${data.discount}` });
    },
    onError: (error: Error) => {
      toast({ title: "Invalid Coupon", description: error.message, variant: "destructive" });
    },
  });

  const validateReferral = useMutation({
    mutationFn: async (code: string) => {
      const { data, error } = await supabase
        .from("referrals")
        .select("code")
        .eq("code", code.toUpperCase())
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error("Invalid referral code");
      return data.code;
    },
    onSuccess: (code) => {
      setValidatedReferral(code);
      toast({
        title: "Referral Code Applied!",
        description: "Thank you for using a referral code",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Invalid Referral Code",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createOrder = useMutation({
    mutationFn: async (data: OrderFormData) => {
      for (const item of items) {
        const { data: product, error } = await supabase
          .from("products")
          .select("stock_quantity")
          .eq("id", item.productId)
          .single();
        if (error) throw error;
        if (!product || product.stock_quantity < item.quantity) {
          throw new Error(`Insufficient stock for "${item.name}"`);
        }
      }

      const orderItems = items.map((item) => ({
        product_id: item.productId,
        name: item.name,
        price: item.price,
        size: item.size,
        quantity: item.quantity,
        product_code: item.productCode || null,
        image_url: item.imageUrl || null,
      }));

      const { data: orderId, error } = await supabase.rpc("create_customer_order", {
        p_customer_name: data.customerName,
        p_phone: data.phone,
        p_address: data.address,
        p_delivery_area: data.deliveryArea,
        p_delivery_charge: deliveryCharge,
        p_items: orderItems,
        p_subtotal: subtotal,
        p_discount_amount: totalDiscount,
        p_coupon_code: appliedCoupon?.code || null,
        p_referral_code: validatedReferral || null,
        p_member_id: detectedMember?.id || null,
        p_total: total,
      });
      if (error) throw error;
      if (!orderId) throw new Error("Order could not be created");

      return {
        order_id: orderId,
        customer_name: data.customerName,
        phone: data.phone,
        address: data.address,
        delivery_area: data.deliveryArea,
      };
    },
    onSuccess: async (order) => {
      const membershipThreshold =
        ((settings?.membership_threshold as { amount?: number } | undefined)?.amount) || 5000;
      const defaultDiscountSetting = settings?.default_member_discount as
        | { value?: number; type?: string }
        | undefined;
      const defaultDiscount = defaultDiscountSetting?.value || 5;
      const defaultDiscountType = defaultDiscountSetting?.type || "percentage";

      if (!detectedMember) {
        try {
          const { data: existingOrders } = await supabase
            .from("orders")
            .select("total")
            .eq("phone", order.phone);
          const totalPurchases =
            existingOrders?.reduce((sum, o) => sum + (o.total || 0), 0) || 0;
          if (totalPurchases >= membershipThreshold) {
            const { data: existingMember } = await supabase
              .from("members")
              .select("id")
              .eq("phone", order.phone)
              .maybeSingle();
            if (!existingMember) {
              const { data: newMember, error: memberError } = await supabase
                .from("members")
                .insert({
                  name: order.customer_name,
                  phone: order.phone,
                  address: order.address,
                  total_purchases: totalPurchases,
                  order_count: existingOrders?.length || 1,
                  discount_value: defaultDiscount,
                  discount_type: defaultDiscountType,
                  member_code: "",
                })
                .select("member_code")
                .single();
              if (!memberError && newMember) {
                setNewMemberCode(newMember.member_code);
                setShowMembershipCongrats(true);
              }
            }
          }
        } catch (err) {
          console.error("Auto-membership check error:", err);
        }
      }

      toast({
        title: "Order Placed!",
        description: `Order ID: ${order.order_id}. Continuing to payment…`,
      });

      clearCart();
      setPlacedOrderId(order.order_id);

      // Send the customer straight to the payment page where they can
      // pick a method and submit their TrxID. The membership modal still
      // shows on top of Cart for users who just qualified — its CTA also
      // routes to /payment.
      if (!showMembershipCongrats) {
        navigate(`/payment/${order.order_id}`);
      }
    },
    onError: (error: Error) => {
      toast({ title: "Order Failed", description: error.message, variant: "destructive" });
    },
  });

  const onSubmit = (data: OrderFormData) => {
    if (items.length === 0) {
      toast({
        title: "Cart is Empty",
        description: "Add items to your cart first",
        variant: "destructive",
      });
      return;
    }
    createOrder.mutate(data);
  };

  if (items.length === 0) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-md mx-auto text-center">
            <div className="mx-auto mb-5 w-20 h-20 rounded-full bg-gold-soft/40 flex items-center justify-center">
              <ShoppingBag className="h-9 w-9 text-primary" />
            </div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">
              Your cart is empty
            </h1>
            <p className="text-muted-foreground mb-7">
              Discover premium men&apos;s Punjabi & traditional wear, hand-picked for you.
            </p>
            <Link to="/shop">
              <Button
                size="lg"
                className="rounded-full bg-gradient-gold-strong text-gold-foreground hover:opacity-95 px-8"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Browse the collection
              </Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  /** Order summary card body — used in both desktop sticky and mobile collapsible. */
  const SummaryBody = (
    <div className="space-y-4">
      {/* Items list */}
      <ul className="divide-y divide-border max-h-72 overflow-y-auto -mx-1 px-1">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-3 py-2.5">
            <div className="relative shrink-0 w-12 h-14 rounded-md overflow-hidden bg-muted ring-1 ring-border">
              <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
              <span className="absolute -top-1.5 -right-1.5 inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold">
                {item.quantity}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{item.name}</p>
              {item.size && (
                <p className="text-xs text-muted-foreground">Size: {item.size}</p>
              )}
            </div>
            <p className="text-sm font-semibold whitespace-nowrap">
              ৳{(item.price * item.quantity).toLocaleString()}
            </p>
          </li>
        ))}
      </ul>

      {/* Coupon row */}
      <button
        type="button"
        onClick={() => setShowCodes((v) => !v)}
        className="w-full flex items-center justify-between text-sm font-medium py-2 border-t border-border"
        aria-expanded={showCodes}
      >
        <span className="inline-flex items-center gap-2 text-foreground">
          <Tag className="h-4 w-4 text-gold" />
          Have a coupon or referral code?
        </span>
        {showCodes ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </button>
      <AnimatePresence initial={false}>
        {showCodes && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="space-y-3 pt-1">
              {/* Coupon */}
              {appliedCoupon ? (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gold/10 border border-gold/30">
                  <Check className="h-4 w-4 text-gold" />
                  <span className="text-sm font-medium">{appliedCoupon.code}</span>
                  <span className="text-xs text-muted-foreground">
                    (−৳{appliedCoupon.discount})
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setAppliedCoupon(null);
                      setCouponCode("");
                    }}
                    className="ml-auto text-muted-foreground hover:text-foreground"
                    aria-label="Remove coupon"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    placeholder="Coupon code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="flex-1 h-10"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      couponCode.trim() && validateCoupon.mutate(couponCode.trim())
                    }
                    disabled={validateCoupon.isPending || !couponCode.trim()}
                    className="h-10 px-3 rounded-md"
                  >
                    {validateCoupon.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Apply"
                    )}
                  </Button>
                </div>
              )}

              {/* Referral */}
              {validatedReferral ? (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/30">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">{validatedReferral}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setValidatedReferral(null);
                      setReferralCode("");
                    }}
                    className="ml-auto text-muted-foreground hover:text-foreground"
                    aria-label="Remove referral"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    placeholder="Referral code (optional)"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                    className="flex-1 h-10"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      referralCode.trim() && validateReferral.mutate(referralCode.trim())
                    }
                    disabled={validateReferral.isPending || !referralCode.trim()}
                    className="h-10 px-3 rounded-md"
                  >
                    {validateReferral.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Users className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Totals */}
      <div className="space-y-1.5 pt-3 border-t border-border">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-medium">৳{subtotal.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Delivery</span>
          <span className="font-medium">৳{deliveryCharge}</span>
        </div>
        {totalDiscount > 0 && (
          <div className="flex justify-between text-sm text-green-700">
            <span>Discount</span>
            <span>−৳{totalDiscount}</span>
          </div>
        )}
        <div className="flex justify-between items-baseline pt-2 mt-2 border-t border-border">
          <span className="font-display font-semibold">Total</span>
          <span className="font-display text-2xl font-bold text-gold">
            ৳{total.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Trust badges */}
      <div className="flex items-center justify-center gap-4 text-[11px] text-muted-foreground pt-1">
        <span className="inline-flex items-center gap-1">
          <Lock className="h-3 w-3" /> Secure checkout
        </span>
        <span className="inline-flex items-center gap-1">
          <ShieldCheck className="h-3 w-3" /> COD available
        </span>
      </div>

      <PaymentLogos className="justify-center" />
    </div>
  );

  return (
    <Layout>
      <div className="bg-gold-soft/15 min-h-[calc(100vh-4rem)]">
        <div className="container mx-auto px-4 py-6 md:py-10">
          {/* Stepper */}
          <div className="mb-5 md:mb-8">
            <ol className="flex items-center justify-center gap-2 md:gap-4 text-xs md:text-sm">
              <Step n={1} label="Cart" active />
              <StepDivider active />
              <Step n={2} label="Details" active />
              <StepDivider />
              <Step n={3} label="Review &amp; place" />
            </ol>
          </div>

          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-1 text-center md:text-left">
            Checkout
          </h1>
          <p className="text-sm text-muted-foreground text-center md:text-left mb-6 md:mb-8">
            {itemCount} {itemCount === 1 ? "item" : "items"} · Premium men&apos;s wear,
            delivered to your door.
          </p>

          {/* Mobile sticky summary toggle */}
          <button
            type="button"
            onClick={() => setMobileSummaryOpen((v) => !v)}
            className="lg:hidden w-full mb-4 flex items-center justify-between rounded-xl border border-gold/30 bg-card px-4 py-3 shadow-sm"
            aria-expanded={mobileSummaryOpen}
          >
            <span className="inline-flex items-center gap-2 font-medium text-foreground">
              <ShoppingBag className="h-4 w-4 text-gold" />
              View order — <span className="text-gold">৳{total.toLocaleString()}</span>
            </span>
            {mobileSummaryOpen ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
          <AnimatePresence initial={false}>
            {mobileSummaryOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="lg:hidden overflow-hidden mb-5"
              >
                <div className="rounded-2xl border border-gold/20 bg-card p-4 shadow-sm">
                  {SummaryBody}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid lg:grid-cols-[1fr_380px] gap-6 md:gap-8">
            {/* LEFT: items + form */}
            <div className="space-y-6">
              {/* Items */}
              <section className="bg-card rounded-2xl border border-gold/15 shadow-sm overflow-hidden">
                <header className="flex items-center justify-between px-4 md:px-5 py-3 md:py-4 border-b border-border">
                  <h2 className="font-display text-base md:text-lg font-semibold text-foreground">
                    Your bag
                  </h2>
                  <Link
                    to="/shop"
                    className="text-xs md:text-sm text-primary hover:text-gold transition-colors inline-flex items-center gap-1"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Continue shopping
                  </Link>
                </header>
                <ul className="divide-y divide-border">
                  {items.map((item) => (
                    <li
                      key={item.id}
                      className="flex gap-3 md:gap-4 p-4 md:p-5 hover:bg-gold-soft/10 transition-colors"
                    >
                      <Link
                        to={`/product/${item.productId}`}
                        className="shrink-0 w-20 h-24 md:w-24 md:h-28 rounded-lg overflow-hidden ring-1 ring-border bg-muted"
                      >
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link
                          to={`/product/${item.productId}`}
                          className="block hover:text-primary"
                        >
                          <h3 className="font-display font-semibold text-sm md:text-base text-foreground line-clamp-2">
                            {item.name}
                          </h3>
                        </Link>
                        {item.size && (
                          <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
                            Size: <span className="font-medium">{item.size}</span>
                          </p>
                        )}
                        <div className="mt-1 flex items-center gap-2">
                          <span className="font-semibold text-gold">
                            ৳{item.price.toLocaleString()}
                          </span>
                          {item.originalPrice > item.price && (
                            <span className="text-xs text-muted-foreground line-through">
                              ৳{item.originalPrice.toLocaleString()}
                            </span>
                          )}
                        </div>

                        <div className="mt-3 flex items-center gap-2">
                          <div className="inline-flex items-center rounded-full border border-border bg-card overflow-hidden">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-none hover:bg-gold/10"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              aria-label="Decrease quantity"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </Button>
                            <span className="w-9 text-center text-sm font-medium">
                              {item.quantity}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-none hover:bg-gold/10"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              disabled={item.quantity >= item.stockQuantity}
                              aria-label="Increase quantity"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(item.id)}
                            className="ml-auto text-destructive hover:text-destructive hover:bg-destructive/10 rounded-full px-3"
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-1" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>

              {/* Details form */}
              <section className="bg-card rounded-2xl border border-gold/15 shadow-sm">
                <header className="px-4 md:px-5 py-3 md:py-4 border-b border-border">
                  <h2 className="font-display text-base md:text-lg font-semibold text-foreground">
                    Delivery details
                  </h2>
                  <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
                    Continue to payment after placing the order.
                  </p>
                </header>

                <form
                  onSubmit={handleSubmit(onSubmit)}
                  className="p-4 md:p-5 space-y-5"
                >
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="customerName">Full name</Label>
                      <Input
                        id="customerName"
                        placeholder="e.g. Rakib Hasan"
                        {...register("customerName")}
                        className={`h-11 rounded-lg focus-visible:ring-2 focus-visible:ring-gold ${
                          errors.customerName ? "border-destructive" : ""
                        }`}
                      />
                      {errors.customerName && (
                        <p className="text-xs text-destructive">
                          {errors.customerName.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="phone">Phone number</Label>
                      <Input
                        id="phone"
                        placeholder="01XXXXXXXXX"
                        inputMode="tel"
                        {...register("phone")}
                        className={`h-11 rounded-lg focus-visible:ring-2 focus-visible:ring-gold ${
                          errors.phone ? "border-destructive" : ""
                        }`}
                      />
                      {errors.phone && (
                        <p className="text-xs text-destructive">{errors.phone.message}</p>
                      )}
                    </div>
                  </div>

                  {detectedMember && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/10 border border-primary/30">
                      <CreditCard className="h-5 w-5 text-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">
                          Welcome back, {detectedMember.name}!
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Member {detectedMember.member_code} ·{" "}
                          {detectedMember.discount_type === "percentage"
                            ? `${detectedMember.discount_value}%`
                            : `৳${detectedMember.discount_value}`}{" "}
                          discount applied
                        </p>
                      </div>
                      <Check className="h-4 w-4 text-primary" />
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label htmlFor="address">Delivery address</Label>
                    <Textarea
                      id="address"
                      placeholder="House / Road / Area, City"
                      rows={3}
                      {...register("address")}
                      className={`rounded-lg focus-visible:ring-2 focus-visible:ring-gold ${
                        errors.address ? "border-destructive" : ""
                      }`}
                    />
                    {errors.address && (
                      <p className="text-xs text-destructive">{errors.address.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Delivery area</Label>
                    <RadioGroup
                      value={deliveryArea}
                      onValueChange={(value) =>
                        setValue("deliveryArea", value as OrderFormData["deliveryArea"], {
                          shouldValidate: true,
                          shouldDirty: true,
                        })
                      }
                      className="grid sm:grid-cols-2 gap-3"
                    >
                      <DeliveryRadio
                        id="dhaka"
                        value="dhaka"
                        active={deliveryArea === "dhaka"}
                        title="Inside Rajshahi"
                        sub="৳60 · 1–2 days"
                      />
                      <DeliveryRadio
                        id="outside"
                        value="outside"
                        active={deliveryArea === "outside"}
                        title="Outside Rajshahi"
                        sub="৳120 · 3–5 days"
                      />
                    </RadioGroup>
                  </div>

                  {/* Mobile-only place order */}
                  <div className="lg:hidden">
                    <Button
                      type="submit"
                      size="lg"
                      className="w-full h-12 rounded-full bg-gradient-gold-strong text-gold-foreground hover:opacity-95 shadow-lg"
                      disabled={createOrder.isPending}
                    >
                      {createOrder.isPending ? (
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      ) : (
                        <MessageCircle className="h-5 w-5 mr-2" />
                      )}
                      Place order · ৳{total.toLocaleString()}
                    </Button>
                  </div>
                </form>
              </section>
            </div>

            {/* RIGHT: sticky summary (desktop) */}
            <aside className="hidden lg:block">
              <div className="sticky top-24">
                <div className="bg-card rounded-2xl border border-gold/20 shadow-sm">
                  <header className="px-5 py-4 border-b border-border bg-gradient-to-r from-gold/10 to-transparent rounded-t-2xl">
                    <div className="flex items-center justify-between">
                      <h2 className="font-display text-lg font-semibold text-foreground">
                        Order summary
                      </h2>
                      <span className="text-xs text-muted-foreground">
                        {itemCount} {itemCount === 1 ? "item" : "items"}
                      </span>
                    </div>
                  </header>
                  <div className="p-5">{SummaryBody}</div>
                  <div className="px-5 pb-5">
                    <Button
                      type="button"
                      size="lg"
                      onClick={handleSubmit(onSubmit)}
                      className="w-full h-12 rounded-full bg-gradient-gold-strong text-gold-foreground hover:opacity-95 shadow-lg"
                      disabled={createOrder.isPending}
                    >
                      {createOrder.isPending ? (
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      ) : (
                        <Truck className="h-5 w-5 mr-2" />
                      )}
                      Place order · ৳{total.toLocaleString()}
                    </Button>
                    <p className="text-[11px] text-center text-muted-foreground mt-2">
                      You&apos;ll continue to the payment page after placing the order.
                    </p>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>

      {/* Membership congrats */}
      {showMembershipCongrats && newMemberCode && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl p-8 max-w-md w-full text-center shadow-2xl animate-in zoom-in-95">
            <PartyPopper className="h-16 w-16 text-gold mx-auto mb-4" />
            <h2 className="font-display text-2xl font-bold text-foreground mb-2">
              Congratulations!
            </h2>
            <p className="text-muted-foreground mb-4">
              You&apos;ve become a Unity Collection member.
            </p>
            <div className="bg-primary/10 rounded-lg p-4 mb-6">
              <p className="text-sm text-muted-foreground mb-1">Your Member Code</p>
              <p className="text-2xl font-bold text-primary">{newMemberCode}</p>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              You&apos;ll automatically receive discounts on future purchases with your
              registered phone number.
            </p>
            <Button
              onClick={() => {
                setShowMembershipCongrats(false);
                if (placedOrderId) {
                  navigate(`/payment/${placedOrderId}`);
                } else {
                  navigate("/");
                }
              }}
              className="w-full bg-gradient-gold-strong text-gold-foreground rounded-full"
            >
              {placedOrderId ? "Continue to Payment" : "Continue Shopping"}
            </Button>
          </div>
        </div>
      )}
    </Layout>
  );
};

function Step({ n, label, active }: { n: number; label: React.ReactNode; active?: boolean }) {
  return (
    <li className="inline-flex items-center gap-2">
      <span
        className={`shrink-0 inline-flex items-center justify-center w-6 h-6 md:w-7 md:h-7 rounded-full text-[11px] md:text-xs font-semibold border ${
          active
            ? "bg-gradient-gold-strong text-gold-foreground border-transparent"
            : "bg-card text-muted-foreground border-border"
        }`}
      >
        {n}
      </span>
      <span
        className={`whitespace-nowrap font-medium ${
          active ? "text-foreground" : "text-muted-foreground"
        }`}
      >
        {label}
      </span>
    </li>
  );
}

function StepDivider({ active }: { active?: boolean }) {
  return (
    <li
      aria-hidden
      className={`h-px w-6 md:w-12 ${active ? "bg-gold" : "bg-border"}`}
    />
  );
}

function DeliveryRadio({
  id,
  value,
  active,
  title,
  sub,
}: {
  id: string;
  value: string;
  active: boolean;
  title: string;
  sub: string;
}) {
  return (
    <Label
      htmlFor={id}
      className={`flex items-start gap-3 cursor-pointer rounded-xl border-2 p-3 transition-colors ${
        active ? "border-gold bg-gold/10" : "border-border hover:border-gold/40"
      }`}
    >
      <RadioGroupItem id={id} value={value} className="mt-0.5" />
      <div className="flex-1">
        <p className="font-medium text-foreground text-sm">{title}</p>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </div>
      <Truck
        className={`h-4 w-4 mt-0.5 ${
          active ? "text-gold" : "text-muted-foreground"
        }`}
      />
    </Label>
  );
}

export default Cart;
