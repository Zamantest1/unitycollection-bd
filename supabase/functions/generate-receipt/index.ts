import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrderItem {
  product_id: string;
  name: string;
  price: number;
  size?: string;
  quantity: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId } = await req.json();

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
    const items: OrderItem[] = typeof order.items === "string" 
      ? JSON.parse(order.items) 
      : order.items;

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
    page.drawText(order.customer_name, { x: leftMargin, y: yPos, size: 11, font: helveticaBold, color: textColor });

    yPos -= 15;
    page.drawText(order.phone, { x: leftMargin, y: yPos, size: 10, font: helvetica, color: textColor });

    yPos -= 15;
    // Wrap address if too long
    const addressLines = wrapText(order.address, 70);
    for (const line of addressLines) {
      page.drawText(line, { x: leftMargin, y: yPos, size: 10, font: helvetica, color: textColor });
      yPos -= 15;
    }

    yPos -= 5;
    page.drawText(`Delivery: ${order.delivery_area === "dhaka" ? "Inside Rajshahi" : "Outside Rajshahi"}`, { 
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
      const itemText = `${item.name}${item.size ? ` (Size: ${item.size})` : ""}${item.quantity > 1 ? ` x${item.quantity}` : ""}`;
      page.drawText(itemText, { x: leftMargin, y: yPos, size: 10, font: helvetica, color: textColor });
      
      const itemTotal = (item.price * (item.quantity || 1));
      page.drawText(`৳${itemTotal.toLocaleString()}`, { 
        x: rightMargin - 60, y: yPos, size: 10, font: helvetica, color: textColor 
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
    page.drawText(`৳${order.subtotal.toLocaleString()}`, { x: rightMargin - 60, y: yPos, size: 10, font: helvetica, color: textColor });

    // Delivery
    const deliveryCharge = order.delivery_area === "dhaka" ? 60 : 120;
    yPos -= 18;
    page.drawText("Delivery:", { x: rightMargin - 150, y: yPos, size: 10, font: helvetica, color: mutedColor });
    page.drawText(`৳${deliveryCharge}`, { x: rightMargin - 60, y: yPos, size: 10, font: helvetica, color: textColor });

    // Discount
    if (order.discount_amount && order.discount_amount > 0) {
      yPos -= 18;
      page.drawText(`Discount${order.coupon_code ? ` (${order.coupon_code})` : ""}:`, { 
        x: rightMargin - 150, y: yPos, size: 10, font: helvetica, color: primaryColor 
      });
      page.drawText(`-৳${order.discount_amount.toLocaleString()}`, { 
        x: rightMargin - 60, y: yPos, size: 10, font: helvetica, color: primaryColor 
      });
    }

    // Total
    yPos -= 25;
    page.drawText("TOTAL:", { x: rightMargin - 150, y: yPos, size: 12, font: helveticaBold, color: textColor });
    page.drawText(`৳${order.total.toLocaleString()}`, { x: rightMargin - 60, y: yPos, size: 12, font: helveticaBold, color: goldColor });

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
