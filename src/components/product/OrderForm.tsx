import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle, Loader2, Tag, Check, X, Users } from "lucide-react";

const orderSchema = z.object({
  customerName: z.string().min(2, "Name must be at least 2 characters").max(100),
  phone: z.string().min(11, "Phone number must be at least 11 digits").max(15),
  address: z.string().min(10, "Please provide a complete address").max(500),
  deliveryArea: z.enum(["dhaka", "outside"]),
  couponCode: z.string().max(50).optional(),
  referralCode: z.string().max(50).optional(),
});

type OrderFormData = z.infer<typeof orderSchema>;

interface OrderFormProps {
  product: {
    id: string;
    name: string;
    price: number;
    size?: string;
    stockQuantity?: number;
  };
}

const WHATSAPP_NUMBER = "8801880545357";

export function OrderForm({ product }: OrderFormProps) {
  const { toast } = useToast();
  const [couponCode, setCouponCode] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount: number;
  } | null>(null);
  const [validatedReferral, setValidatedReferral] = useState<string | null>(null);

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

  const deliveryArea = watch("deliveryArea");
  const deliveryCharge = deliveryArea === "dhaka" ? 60 : 120;
  const subtotal = product.price;
  const discount = appliedCoupon?.discount || 0;
  const total = subtotal + deliveryCharge - discount;

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

      // Check expiry
      if (data.expiry_date && new Date(data.expiry_date) < new Date()) {
        throw new Error("Coupon has expired");
      }

      // Check minimum purchase
      if (data.min_purchase && subtotal < data.min_purchase) {
        throw new Error(`Minimum purchase of ৳${data.min_purchase} required`);
      }

      // Calculate discount
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
      toast({
        title: "Coupon Applied!",
        description: `You saved ৳${data.discount}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Invalid Coupon",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Validate referral code
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

  // Create order
  const createOrder = useMutation({
    mutationFn: async (data: OrderFormData) => {
      // First verify stock is still available
      const { data: currentProduct, error: stockError } = await supabase
        .from("products")
        .select("stock_quantity")
        .eq("id", product.id)
        .single();

      if (stockError) throw stockError;
      if (!currentProduct || currentProduct.stock_quantity < 1) {
        throw new Error("Sorry, this product is now out of stock");
      }

      // Generate a temporary order_id - the trigger will replace it
      const tempOrderId = `UC-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
      
      const orderData = {
        order_id: tempOrderId,
        customer_name: data.customerName,
        phone: data.phone,
        address: data.address,
        delivery_area: data.deliveryArea,
        items: [
          {
            product_id: product.id,
            name: product.name,
            price: product.price,
            size: product.size,
            quantity: 1,
          },
        ],
        subtotal,
        discount_amount: discount,
        coupon_code: appliedCoupon?.code || null,
        referral_code: validatedReferral || null,
        total: total,
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
      // Generate WhatsApp message
      const message = encodeURIComponent(
        `🛍️ *New Order from Unity Collection*\n\n` +
        `📋 *Order ID:* ${order.order_id}\n` +
        `👤 *Name:* ${order.customer_name}\n` +
        `📞 *Phone:* ${order.phone}\n` +
        `📍 *Address:* ${order.address}\n` +
        `🚚 *Delivery:* ${order.delivery_area === "dhaka" ? "Inside Rajshahi" : "Outside Rajshahi"}\n\n` +
        `🛒 *Product:*\n` +
        `• ${product.name}${product.size ? ` (Size: ${product.size})` : ""} - ৳${product.price}\n\n` +
        `💰 *Subtotal:* ৳${subtotal}\n` +
        `🚚 *Delivery:* ৳${deliveryCharge}\n` +
        (discount > 0 ? `🎟️ *Discount:* -৳${discount}\n` : "") +
        (validatedReferral ? `👥 *Referral:* ${validatedReferral}\n` : "") +
        `✅ *Total:* ৳${total}\n\n` +
        `🔗 *Product Link:* ${window.location.href}`
      );

      // Redirect to WhatsApp
      window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, "_blank");

      toast({
        title: "Order Placed!",
        description: `Order ID: ${order.order_id}. Redirecting to WhatsApp...`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Order Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: OrderFormData) => {
    // Final stock check before submission
    if (product.stockQuantity !== undefined && product.stockQuantity < 1) {
      toast({
        title: "Out of Stock",
        description: "Sorry, this product is currently out of stock",
        variant: "destructive",
      });
      return;
    }
    createOrder.mutate(data);
  };

  const handleApplyCoupon = () => {
    if (couponCode.trim()) {
      validateCoupon.mutate(couponCode.trim());
    }
  };

  const handleApplyReferral = () => {
    if (referralCode.trim()) {
      validateReferral.mutate(referralCode.trim());
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
  };

  const removeReferral = () => {
    setValidatedReferral(null);
    setReferralCode("");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 border-t border-border pt-6">
      <h3 className="font-display text-xl font-semibold text-foreground">
        Order via WhatsApp
      </h3>

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
      <div className="space-y-3">
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
              onClick={removeCoupon}
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
              onClick={handleApplyCoupon}
              disabled={validateCoupon.isPending || !couponCode.trim()}
            >
              {validateCoupon.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Tag className="h-4 w-4" />
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Referral Code */}
      <div className="space-y-2">
        <Label>Referral Code (Optional)</Label>
        {validatedReferral ? (
          <div className="flex items-center gap-2 p-3 bg-green-500/10 rounded-md">
            <Check className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium">{validatedReferral}</span>
            <button
              type="button"
              onClick={removeReferral}
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
              onClick={handleApplyReferral}
              disabled={validateReferral.isPending || !referralCode.trim()}
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

      {/* Order Summary */}
      <div className="bg-muted/50 rounded-lg p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span>Subtotal</span>
          <span>৳{subtotal.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Delivery</span>
          <span>৳{deliveryCharge}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-sm text-primary">
            <span>Discount</span>
            <span>-৳{discount}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-lg border-t border-border pt-2">
          <span>Total</span>
          <span className="text-gold">৳{total.toLocaleString()}</span>
        </div>
      </div>

      {/* Submit Button */}
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
  );
}
