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
import {
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowLeft,
  MessageCircle,
  Loader2,
  Tag,
  Check,
  X,
  Users,
  CreditCard,
  PartyPopper,
} from "lucide-react";

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

const WHATSAPP_NUMBER = "8801880545357";

const Cart = () => {
  const { items, removeItem, updateQuantity, clearCart, subtotal, itemCount } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [couponCode, setCouponCode] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount: number;
  } | null>(null);
  const [validatedReferral, setValidatedReferral] = useState<string | null>(null);
  const [detectedMember, setDetectedMember] = useState<Member | null>(null);
  const [memberDiscount, setMemberDiscount] = useState(0);
  const [showMembershipCongrats, setShowMembershipCongrats] = useState(false);
  const [newMemberCode, setNewMemberCode] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      deliveryArea: "dhaka",
    },
  });

  const phoneValue = watch("phone");
  const deliveryArea = watch("deliveryArea");
  const deliveryCharge = deliveryArea === "dhaka" ? 60 : 120;
  const couponDiscount = appliedCoupon?.discount || 0;
  const totalDiscount = couponDiscount + memberDiscount;
  const total = subtotal + deliveryCharge - totalDiscount;

  // Fetch membership threshold settings
  const { data: settings } = useQuery({
    queryKey: ["membership-settings"],
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
        // Calculate member discount
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
            description: `Member discount of ${data.discount_type === "percentage" ? `${data.discount_value}%` : `৳${data.discount_value}`} applied`,
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

  // Validate coupon
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

      if (data.expiry_date && new Date(data.expiry_date) < new Date()) {
        throw new Error("Coupon has expired");
      }

      if (data.min_purchase && subtotal < data.min_purchase) {
        throw new Error(`Minimum purchase of ৳${data.min_purchase} required`);
      }

      let discountAmount = 0;
      if (data.discount_type === "fixed") {
        discountAmount = data.discount_value;
      } else {
        discountAmount = Math.round((subtotal * data.discount_value) / 100);
      }

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

  // Validate referral
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
      toast({ title: "Referral Code Applied!", description: "Thank you for using a referral code" });
    },
    onError: (error: Error) => {
      toast({ title: "Invalid Referral Code", description: error.message, variant: "destructive" });
    },
  });

  // Create order
  const createOrder = useMutation({
    mutationFn: async (data: OrderFormData) => {
      // Verify stock for all items
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

      const tempOrderId = `UC-${Math.floor(Math.random() * 10000).toString().padStart(4, "0")}`;

      const orderData = {
        order_id: tempOrderId,
        customer_name: data.customerName,
        phone: data.phone,
        address: data.address,
        delivery_area: data.deliveryArea,
        items: items.map((item) => ({
          product_id: item.productId,
          name: item.name,
          price: item.price,
          size: item.size,
          quantity: item.quantity,
        })),
        subtotal,
        discount_amount: totalDiscount,
        coupon_code: appliedCoupon?.code || null,
        referral_code: validatedReferral || null,
        member_id: detectedMember?.id || null,
        total,
      };

      const { data: order, error } = await supabase
        .from("orders")
        .insert(orderData)
        .select()
        .single();

      if (error) throw error;
      return order;
    },
    onSuccess: (order) => {
      const itemsList = items
        .map((item) => `• ${item.name}${item.size ? ` (Size: ${item.size})` : ""} x${item.quantity} - ৳${item.price * item.quantity}`)
        .join("\n");

      const message = encodeURIComponent(
        `🛍️ *New Order from Unity Collection*\n\n` +
          `📋 *Order ID:* ${order.order_id}\n` +
          `👤 *Name:* ${order.customer_name}\n` +
          `📞 *Phone:* ${order.phone}\n` +
          `📍 *Address:* ${order.address}\n` +
          `🚚 *Delivery:* ${order.delivery_area === "dhaka" ? "Inside Rajshahi" : "Outside Rajshahi"}\n\n` +
          `🛒 *Products:*\n${itemsList}\n\n` +
          `💰 *Subtotal:* ৳${subtotal}\n` +
          `🚚 *Delivery:* ৳${deliveryCharge}\n` +
          (totalDiscount > 0 ? `🎟️ *Discount:* -৳${totalDiscount}\n` : "") +
          (validatedReferral ? `👥 *Referral:* ${validatedReferral}\n` : "") +
          `✅ *Total:* ৳${total}`
      );

      window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, "_blank");

      toast({
        title: "Order Placed!",
        description: `Order ID: ${order.order_id}. Redirecting to WhatsApp...`,
      });

      clearCart();
      navigate("/");
    },
    onError: (error: Error) => {
      toast({ title: "Order Failed", description: error.message, variant: "destructive" });
    },
  });

  const onSubmit = (data: OrderFormData) => {
    if (items.length === 0) {
      toast({ title: "Cart is Empty", description: "Add items to your cart first", variant: "destructive" });
      return;
    }
    createOrder.mutate(data);
  };

  if (items.length === 0) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 text-center">
          <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="font-display text-2xl font-bold text-foreground mb-2">Your cart is empty</h1>
          <p className="text-muted-foreground mb-6">Add some products to get started</p>
          <Link to="/shop">
            <Button className="bg-primary text-primary-foreground">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Continue Shopping
            </Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-8">
          Shopping Cart ({itemCount} {itemCount === 1 ? "item" : "items"})
        </h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex gap-4 bg-card rounded-lg p-4 shadow-sm"
              >
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-20 h-24 object-cover rounded-md"
                />
                <div className="flex-1 min-w-0">
                  <Link to={`/product/${item.productId}`} className="hover:text-primary">
                    <h3 className="font-semibold text-foreground truncate">{item.name}</h3>
                  </Link>
                  {item.size && (
                    <p className="text-sm text-muted-foreground">Size: {item.size}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-bold text-gold">৳{item.price}</span>
                    {item.originalPrice > item.price && (
                      <span className="text-sm text-muted-foreground line-through">
                        ৳{item.originalPrice}
                      </span>
                    )}
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-2 mt-3">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      disabled={item.quantity >= item.stockQuantity}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive ml-auto"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            <Link to="/shop" className="inline-flex items-center text-primary hover:underline mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Continue Shopping
            </Link>
          </div>

          {/* Checkout Form */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-lg p-6 shadow-sm sticky top-24">
              <h2 className="font-display text-xl font-semibold text-foreground mb-6">
                Complete Your Order
              </h2>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Customer Name */}
                <div className="space-y-2">
                  <Label htmlFor="customerName">Full Name *</Label>
                  <Input
                    id="customerName"
                    placeholder="Enter your name"
                    {...register("customerName")}
                    className={errors.customerName ? "border-destructive" : ""}
                  />
                  {errors.customerName && (
                    <p className="text-sm text-destructive">{errors.customerName.message}</p>
                  )}
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    placeholder="01XXXXXXXXX"
                    {...register("phone")}
                    className={errors.phone ? "border-destructive" : ""}
                  />
                  {errors.phone && (
                    <p className="text-sm text-destructive">{errors.phone.message}</p>
                  )}
                  {/* Member Detection */}
                  {detectedMember && (
                    <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-md border border-primary/20">
                      <CreditCard className="h-4 w-4 text-primary" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">
                          Welcome back, {detectedMember.name}!
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Member {detectedMember.member_code} • {detectedMember.discount_type === "percentage" 
                            ? `${detectedMember.discount_value}%` 
                            : `৳${detectedMember.discount_value}`} discount applied
                        </p>
                      </div>
                      <Check className="h-4 w-4 text-primary" />
                    </div>
                  )}
                </div>

                {/* Address */}
                <div className="space-y-2">
                  <Label htmlFor="address">Delivery Address *</Label>
                  <Textarea
                    id="address"
                    placeholder="Enter your full address"
                    rows={3}
                    {...register("address")}
                    className={errors.address ? "border-destructive" : ""}
                  />
                  {errors.address && (
                    <p className="text-sm text-destructive">{errors.address.message}</p>
                  )}
                </div>

                {/* Delivery Area */}
                <div className="space-y-2">
                  <Label>Delivery Area *</Label>
                  <RadioGroup defaultValue="dhaka" {...register("deliveryArea")}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="dhaka" id="dhaka" />
                      <Label htmlFor="dhaka" className="font-normal cursor-pointer">
                        Inside Rajshahi (৳60)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="outside" id="outside" />
                      <Label htmlFor="outside" className="font-normal cursor-pointer">
                        Outside Rajshahi (৳120)
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Coupon */}
                <div className="space-y-2">
                  <Label>Coupon Code</Label>
                  {appliedCoupon ? (
                    <div className="flex items-center gap-2 p-3 bg-gold/10 rounded-md">
                      <Check className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">{appliedCoupon.code}</span>
                      <span className="text-sm text-muted-foreground">(-৳{appliedCoupon.discount})</span>
                      <button
                        type="button"
                        onClick={() => {
                          setAppliedCoupon(null);
                          setCouponCode("");
                        }}
                        className="ml-auto text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter coupon code"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => couponCode.trim() && validateCoupon.mutate(couponCode.trim())}
                        disabled={validateCoupon.isPending || !couponCode.trim()}
                      >
                        {validateCoupon.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Tag className="h-4 w-4" />}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Referral */}
                <div className="space-y-2">
                  <Label>Referral Code (Optional)</Label>
                  {validatedReferral ? (
                    <div className="flex items-center gap-2 p-3 bg-green-500/10 rounded-md">
                      <Check className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">{validatedReferral}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setValidatedReferral(null);
                          setReferralCode("");
                        }}
                        className="ml-auto text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter referral code"
                        value={referralCode}
                        onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => referralCode.trim() && validateReferral.mutate(referralCode.trim())}
                        disabled={validateReferral.isPending || !referralCode.trim()}
                      >
                        {validateReferral.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Order Summary */}
                <div className="bg-muted/50 rounded-lg p-4 space-y-2 mt-6">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>৳{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Delivery</span>
                    <span>৳{deliveryCharge}</span>
                  </div>
                  {totalDiscount > 0 && (
                    <div className="flex justify-between text-sm text-primary">
                      <span>Discount</span>
                      <span>-৳{totalDiscount}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg border-t border-border pt-2">
                    <span>Total</span>
                    <span className="text-gold">৳{total.toLocaleString()}</span>
                  </div>
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  size="lg"
                  className="w-full bg-primary text-primary-foreground hover:bg-gold hover:text-gold-foreground transition-colors"
                  disabled={createOrder.isPending}
                >
                  {createOrder.isPending ? (
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  ) : (
                    <MessageCircle className="h-5 w-5 mr-2" />
                  )}
                  Order via WhatsApp
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Cart;
