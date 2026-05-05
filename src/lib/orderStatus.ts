/**
 * Shared order-status presentation helpers.
 *
 * These were duplicated across AdminOrders, AdminDashboard, Track and
 * Payment with slightly different logic each time. Centralising means
 * a status added here lights up everywhere consistently.
 */

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "returned";

export const ORDER_STATUSES: OrderStatus[] = [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
];

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  returned: "bg-orange-100 text-orange-800",
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  returned: "Returned",
};

const isOrderStatus = (status: string): status is OrderStatus =>
  (ORDER_STATUSES as string[]).includes(status);

export const getStatusColor = (status: string): string =>
  isOrderStatus(status)
    ? STATUS_COLORS[status]
    : "bg-gray-100 text-gray-800";

export const getStatusLabel = (status: string): string =>
  isOrderStatus(status)
    ? STATUS_LABELS[status]
    : status.charAt(0).toUpperCase() + status.slice(1);

/**
 * Existing storefront uses both `dhaka` (legacy) and `rajshahi` for
 * "inside Rajshahi" — keep both mappings until the data is migrated.
 */
export const getDeliveryLabel = (area: string | null | undefined): string => {
  switch (area) {
    case "dhaka":
    case "rajshahi":
      return "Inside Rajshahi";
    case "outside":
    case "outside_rajshahi":
      return "Outside Rajshahi";
    default:
      return area ?? "—";
  }
};
