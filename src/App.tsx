import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { PageViewTracker } from "@/components/analytics/PageViewTracker";
import RequireAdmin from "@/components/admin/RequireAdmin";
import Index from "./pages/Index";
import Shop from "./pages/Shop";
import ProductDetail from "./pages/ProductDetail";
import Categories from "./pages/Categories";
import Contact from "./pages/Contact";
import About from "./pages/About";
import Cart from "./pages/Cart";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminBanners from "./pages/admin/AdminBanners";
import AdminCoupons from "./pages/admin/AdminCoupons";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminNotice from "./pages/admin/AdminNotice";
import AdminReferrals from "./pages/admin/AdminReferrals";
import AdminMembers from "./pages/admin/AdminMembers";
import AdminPayments from "./pages/admin/AdminPayments";
import AdminPaymentMethods from "./pages/admin/AdminPaymentMethods";
import Track from "./pages/Track";
import Payment from "./pages/Payment";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <CartProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <PageViewTracker />
          <Routes>
            {/* Customer Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/about" element={<About />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/track" element={<Track />} />
            <Route path="/track/:orderId" element={<Track />} />
            <Route path="/payment/:orderId" element={<Payment />} />
            <Route path="/payment/:orderId/:method" element={<Payment />} />

            {/* Admin login (outside the auth gate) */}
            <Route path="/admin/login" element={<AdminLogin />} />

            {/* Admin routes — auth + role check runs ONCE in RequireAdmin */}
            <Route element={<RequireAdmin />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/products" element={<AdminProducts />} />
              <Route path="/admin/categories" element={<AdminCategories />} />
              <Route path="/admin/banners" element={<AdminBanners />} />
              <Route path="/admin/coupons" element={<AdminCoupons />} />
              <Route path="/admin/referrals" element={<AdminReferrals />} />
              <Route path="/admin/members" element={<AdminMembers />} />
              <Route path="/admin/orders" element={<AdminOrders />} />
              <Route path="/admin/notice" element={<AdminNotice />} />
              <Route path="/admin/payments" element={<AdminPayments />} />
              <Route
                path="/admin/payment-methods"
                element={<AdminPaymentMethods />}
              />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </CartProvider>
  </QueryClientProvider>
);

export default App;
