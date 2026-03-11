import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface OrderItem {
  product_id: string;
  name: string;
  price: number;
  size?: string;
  quantity: number;
}

// Strip non-ASCII characters for PDF compatibility (pdf-lib only supports WinAnsi/Latin)
function sanitizeText(text: string): string {
  if (!text) return "";
  return text
    .replace(/[\u202A-\u202E\u2066-\u2069]/g, "")
    .replace(/[^\x20-\x7E]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// For product names with "English | Bengali" format, extract just the English part
function sanitizeProductName(name: string): string {
  if (!name) return "";
  const parts = name.split("|");
  const englishPart = parts[0].trim();
  return sanitizeText(englishPart) || sanitizeText(name) || "Product";
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { orderId } = await req.json();

    console.log("generate-receipt: request", { orderId });

    if (!orderId) {
      return new Response(
        JSON.stringify({ error: "Order ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch order
    const { data: order, error } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (error || !order) {
      console.error("Order fetch error:", error);
      return new Response(
        JSON.stringify({ error: "Order not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse items
    let items: OrderItem[] = [];
    try {
      items = (typeof order.items === "string" ? JSON.parse(order.items) : order.items) as OrderItem[];
    } catch (e) {
      console.error("Items parse error:", e);
      items = [];
    }

    // Create PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
    const { width, height } = page.getSize();
    
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Colors
    const primaryColor = rgb(0.059, 0.302, 0.271); // Dark Green #0F4D45
    const goldColor = rgb(0.788, 0.635, 0.302); // Gold #C9A24D
    const textColor = rgb(0.118, 0.118, 0.118); // #1E1E1E
    const mutedColor = rgb(0.42, 0.447, 0.502); // #6B7280

    let yPos = height - 50;
    const leftMargin = 50;
    const rightMargin = width - 50;

    // Header
    page.drawText("UNITY COLLECTION", {
      x: leftMargin,
      y: yPos,
      size: 24,
      font: helveticaBold,
      color: primaryColor,
    });

    yPos -= 20;
    page.drawText("Premium Bangladeshi Punjabi", {
      x: leftMargin,
      y: yPos,
      size: 10,
      font: helvetica,
      color: mutedColor,
    });

    // Invoice label
    yPos -= 40;
    page.drawText("INVOICE", {
      x: leftMargin,
      y: yPos,
      size: 18,
      font: helveticaBold,
      color: goldColor,
    });

    // Line
    yPos -= 15;
    page.drawLine({
      start: { x: leftMargin, y: yPos },
      end: { x: rightMargin, y: yPos },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    });

    // Order details
    yPos -= 30;
    page.drawText("Order ID:", { x: leftMargin, y: yPos, size: 10, font: helvetica, color: mutedColor });
    page.drawText(order.order_id, { x: leftMargin + 80, y: yPos, size: 10, font: helveticaBold, color: textColor });

    yPos -= 18;
    page.drawText("Date:", { x: leftMargin, y: yPos, size: 10, font: helvetica, color: mutedColor });
    page.drawText(new Date(order.created_at).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }), { x: leftMargin + 80, y: yPos, size: 10, font: helvetica, color: textColor });

    yPos -= 18;
    page.drawText("Status:", { x: leftMargin, y: yPos, size: 10, font: helvetica, color: mutedColor });
    page.drawText(order.status.charAt(0).toUpperCase() + order.status.slice(1), { 
      x: leftMargin + 80, y: yPos, size: 10, font: helvetica, color: textColor 
    });

    // Line
    yPos -= 20;
    page.drawLine({
      start: { x: leftMargin, y: yPos },
      end: { x: rightMargin, y: yPos },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    });

    // Customer details
    yPos -= 25;
    page.drawText("BILL TO", { x: leftMargin, y: yPos, size: 10, font: helveticaBold, color: primaryColor });

    yPos -= 18;
    page.drawText(sanitizeText(order.customer_name), { x: leftMargin, y: yPos, size: 11, font: helveticaBold, color: textColor });

    yPos -= 15;
    page.drawText(order.phone, { x: leftMargin, y: yPos, size: 10, font: helvetica, color: textColor });

    yPos -= 15;
    // Wrap address if too long
    const addressLines = wrapText(sanitizeText(order.address), 70);
    for (const line of addressLines) {
      page.drawText(line, { x: leftMargin, y: yPos, size: 10, font: helvetica, color: textColor });
      yPos -= 15;
    }

    yPos -= 5;
    const deliveryLabel = (order.delivery_area === "dhaka" || order.delivery_area === "rajshahi") ? "Inside Rajshahi" : "Outside Rajshahi";
    page.drawText(`Delivery: ${deliveryLabel}`, { 
      x: leftMargin, y: yPos, size: 10, font: helvetica, color: mutedColor 
    });

    // Line
    yPos -= 20;
    page.drawLine({
      start: { x: leftMargin, y: yPos },
      end: { x: rightMargin, y: yPos },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    });

    // Items header
    yPos -= 25;
    page.drawText("ITEMS", { x: leftMargin, y: yPos, size: 10, font: helveticaBold, color: primaryColor });
    page.drawText("PRICE", { x: rightMargin - 60, y: yPos, size: 10, font: helveticaBold, color: primaryColor });

    yPos -= 15;
    page.drawLine({
      start: { x: leftMargin, y: yPos },
      end: { x: rightMargin, y: yPos },
      thickness: 0.5,
      color: rgb(0.9, 0.9, 0.9),
    });

    // Items
    for (const item of items) {
      yPos -= 20;
      const itemName = sanitizeProductName(item.name);
      const safeSize = sanitizeText(item.size || "");
      const safeQty = Number(item.quantity || 1);
      const itemText = `${itemName}${safeSize ? ` (Size: ${safeSize})` : ""}${safeQty > 1 ? ` x${safeQty}` : ""}`;
      page.drawText(itemText, { x: leftMargin, y: yPos, size: 10, font: helvetica, color: textColor });
      
      const itemTotal = Number(item.price || 0) * safeQty;
      page.drawText(`Tk. ${itemTotal.toLocaleString()}`, { 
        x: rightMargin - 70, y: yPos, size: 10, font: helvetica, color: textColor 
      });
    }

    // Totals section
    yPos -= 30;
    page.drawLine({
      start: { x: leftMargin, y: yPos },
      end: { x: rightMargin, y: yPos },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    });

    // Subtotal
    yPos -= 20;
    page.drawText("Subtotal:", { x: rightMargin - 150, y: yPos, size: 10, font: helvetica, color: mutedColor });
    page.drawText(`Tk. ${order.subtotal.toLocaleString()}`, { x: rightMargin - 70, y: yPos, size: 10, font: helvetica, color: textColor });

    // Delivery
    const deliveryCharge = order.delivery_charge != null ? Number(order.delivery_charge) : ((order.delivery_area === "dhaka" || order.delivery_area === "rajshahi") ? 60 : 120);
    yPos -= 18;
    page.drawText("Delivery:", { x: rightMargin - 150, y: yPos, size: 10, font: helvetica, color: mutedColor });
    page.drawText(`Tk. ${deliveryCharge}`, { x: rightMargin - 70, y: yPos, size: 10, font: helvetica, color: textColor });

    // Discount
    if (order.discount_amount && order.discount_amount > 0) {
      yPos -= 18;
      page.drawText(`Discount${order.coupon_code ? ` (${order.coupon_code})` : ""}:`, { 
        x: rightMargin - 150, y: yPos, size: 10, font: helvetica, color: primaryColor 
      });
      page.drawText(`-Tk. ${order.discount_amount.toLocaleString()}`, { 
        x: rightMargin - 70, y: yPos, size: 10, font: helvetica, color: primaryColor 
      });
    }

    // Total
    yPos -= 25;
    page.drawText("TOTAL:", { x: rightMargin - 150, y: yPos, size: 12, font: helveticaBold, color: textColor });
    page.drawText(`Tk. ${order.total.toLocaleString()}`, { x: rightMargin - 70, y: yPos, size: 12, font: helveticaBold, color: goldColor });

    // Thank you message
    yPos -= 50;
    page.drawLine({
      start: { x: leftMargin, y: yPos },
      end: { x: rightMargin, y: yPos },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    });

    yPos -= 25;
    page.drawText("Thank you for shopping with Unity Collection!", { 
      x: leftMargin, y: yPos, size: 11, font: helveticaBold, color: primaryColor 
    });

    yPos -= 18;
    page.drawText("Contact: +8801880545357 | unitycollectionbd@gmail.com", { 
      x: leftMargin, y: yPos, size: 9, font: helvetica, color: mutedColor 
    });

    // Footer - Designed by Shomik
    const footerY = 40;
    page.drawLine({
      start: { x: leftMargin, y: footerY + 15 },
      end: { x: rightMargin, y: footerY + 15 },
      thickness: 0.5,
      color: rgb(0.85, 0.85, 0.85),
    });

    page.drawText("Designed by Shomik", { 
      x: leftMargin, y: footerY, size: 8, font: helvetica, color: mutedColor 
    });
    page.drawText("shomikujzaman.vercel.app", { 
      x: leftMargin + 100, y: footerY, size: 8, font: helvetica, color: primaryColor 
    });

    // Generate PDF bytes and encode as base64
    const pdfBytes = await pdfDoc.save();
    
    // Convert to base64 for safe transport via JSON
    let binary = "";
    const bytes = new Uint8Array(pdfBytes);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64Pdf = btoa(binary);

    return new Response(
      JSON.stringify({ 
        pdf: base64Pdf, 
        filename: `receipt-${order.order_id}.pdf` 
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );

  } catch (error) {
    console.error("Error generating receipt:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate receipt" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Helper function to wrap text
function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    if ((currentLine + " " + word).length > maxChars) {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = currentLine ? `${currentLine} ${word}` : word;
    }
  }
  if (currentLine) lines.push(currentLine);

  return lines;
}
