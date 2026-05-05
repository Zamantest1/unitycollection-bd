import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Package,
  ShoppingCart,
  Tag,
  FolderOpen,
  DollarSign,
  TrendingUp,
  Warehouse,
  Percent,
  Eye,
  Users,
  CalendarDays,
} from "lucide-react";
import { Link } from "react-router-dom";
import { getStatusColor, getStatusLabel } from "@/lib/orderStatus";

interface VisitStats {
  visits_today: number;
  visits_7d: number;
  visits_30d: number;
  unique_visitors_today: number;
  unique_visitors_7d: number;
  unique_visitors_30d: number;
}

interface TopPage {
  path: string;
  views: number;
  unique_visitors: number;
}

const AdminDashboard = () => {
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [products, orders, categories, coupons] = await Promise.all([
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("id", { count: "exact", head: true }),
        supabase.from("categories").select("id", { count: "exact", head: true }),
        supabase.from("coupons").select("id", { count: "exact", head: true }),
      ]);

      return {
        products: products.count || 0,
        orders: orders.count || 0,
        categories: categories.count || 0,
        coupons: coupons.count || 0,
      };
    },
  });

  const { data: businessStats } = useQuery({
    queryKey: ["admin-business-stats"],
    queryFn: async () => {
      const [productsData, ordersData] = await Promise.all([
        supabase.from("products").select("stock_quantity, sold_count"),
        supabase.from("orders").select("total, discount_amount, status, items"),
      ]);

      const products = productsData.data || [];
      const orders = ordersData.data || [];

      return {
        totalRevenue: orders.filter(o => o.status === "delivered").reduce((sum, o) => sum + Number(o.total), 0),
        itemsSold: orders.filter(o => o.status === "delivered").reduce((sum, o) => {
          const items = Array.isArray(o.items) ? o.items : [];
          return sum + items.reduce((iSum: number, item: any) => iSum + (item.quantity || 0), 0);
        }, 0),
        totalStock: products.reduce((sum, p) => sum + (p.stock_quantity || 0), 0),
        discountsGiven: orders.reduce((sum, o) => sum + Number(o.discount_amount || 0), 0),
      };
    },
  });

  const { data: recentOrders = [] } = useQuery({
    queryKey: ["recent-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data;
    },
  });

  // Visitor analytics — backed by RPCs that aggregate the page_views table.
  // The RPCs are SECURITY DEFINER and only return data when the caller is
  // an admin, so this query simply renders nothing if the user isn't.
  const { data: visitStats } = useQuery<VisitStats | null>({
    queryKey: ["admin-visit-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_visit_stats");
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      return (row as VisitStats) ?? null;
    },
  });

  const { data: topPages = [] } = useQuery<TopPage[]>({
    queryKey: ["admin-top-pages"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_top_pages", {
        p_days: 7,
        p_limit: 5,
      });
      if (error) throw error;
      return (data ?? []) as TopPage[];
    },
  });

  const statCards = [
    { title: "Products", value: stats?.products || 0, icon: Package, link: "/admin/products", color: "text-primary" },
    { title: "Orders", value: stats?.orders || 0, icon: ShoppingCart, link: "/admin/orders", color: "text-gold" },
    { title: "Categories", value: stats?.categories || 0, icon: FolderOpen, link: "/admin/categories", color: "text-primary" },
    { title: "Coupons", value: stats?.coupons || 0, icon: Tag, link: "/admin/coupons", color: "text-gold" },
  ];

  const businessCards = [
    { title: "Total Sales", value: `৳${businessStats?.totalRevenue || 0}`, icon: DollarSign, color: "text-green-600" },
    { title: "Items Sold", value: businessStats?.itemsSold || 0, icon: TrendingUp, color: "text-blue-600" },
    { title: "Total Stock", value: businessStats?.totalStock || 0, icon: Warehouse, color: "text-purple-600" },
    { title: "Discounts Given", value: `৳${businessStats?.discountsGiven || 0}`, icon: Percent, color: "text-orange-600" },
  ];

  return (
    <AdminLayout title="Dashboard">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {statCards.map((stat) => (
          <Link key={stat.title} to={stat.link}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Business Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {businessCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Visitor Analytics */}
      {visitStats && (
        <Card className="mb-8">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                Visitor Analytics
              </CardTitle>
              <p className="text-xs text-muted mt-1">
                Storefront page views — admin pages excluded
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="rounded-lg border bg-card p-4">
                <div className="flex items-center gap-2 text-xs text-muted">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Today
                </div>
                <div className="mt-2 text-2xl font-bold text-foreground">
                  {visitStats.visits_today}
                </div>
                <div className="text-xs text-muted flex items-center gap-1 mt-1">
                  <Users className="h-3 w-3" />
                  {visitStats.unique_visitors_today} unique
                </div>
              </div>
              <div className="rounded-lg border bg-card p-4">
                <div className="flex items-center gap-2 text-xs text-muted">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Last 7 days
                </div>
                <div className="mt-2 text-2xl font-bold text-foreground">
                  {visitStats.visits_7d}
                </div>
                <div className="text-xs text-muted flex items-center gap-1 mt-1">
                  <Users className="h-3 w-3" />
                  {visitStats.unique_visitors_7d} unique
                </div>
              </div>
              <div className="rounded-lg border bg-card p-4">
                <div className="flex items-center gap-2 text-xs text-muted">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Last 30 days
                </div>
                <div className="mt-2 text-2xl font-bold text-foreground">
                  {visitStats.visits_30d}
                </div>
                <div className="text-xs text-muted flex items-center gap-1 mt-1">
                  <Users className="h-3 w-3" />
                  {visitStats.unique_visitors_30d} unique
                </div>
              </div>
            </div>

            {topPages.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-foreground mb-3">
                  Top pages · last 7 days
                </h3>
                <div className="space-y-2">
                  {topPages.map((p) => (
                    <div
                      key={p.path}
                      className="flex items-center justify-between text-sm border-b border-border last:border-0 pb-2 last:pb-0"
                    >
                      <span className="font-mono text-foreground truncate max-w-[60%]">
                        {p.path}
                      </span>
                      <span className="text-muted-foreground">
                        <span className="font-medium text-foreground">
                          {p.views}
                        </span>{" "}
                        views · {p.unique_visitors} unique
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recent Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Orders</CardTitle>
          <Link to="/admin/orders" className="text-sm text-primary hover:text-gold">
            View all
          </Link>
        </CardHeader>
        <CardContent>
          {recentOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted">Order ID</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted">Customer</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted">Total</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="border-b border-border last:border-0">
                      <td className="py-3 px-2 text-sm font-medium">{order.order_id}</td>
                      <td className="py-3 px-2 text-sm">{order.customer_name}</td>
                      <td className="py-3 px-2 text-sm text-gold font-medium">৳{order.total}</td>
                      <td className="py-3 px-2">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {getStatusLabel(order.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-muted py-8">No orders yet</p>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default AdminDashboard;
