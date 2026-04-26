// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { type, record } = await req.json();

    if (type === "INSERT" && record.table === "orders") {
      await supabaseClient.from("notifications").insert({
        user_id: record.user_id,
        order_id: record.id,
        title: "Order Placed",
        message: `Your order #${record.queue_number || "pending"} has been placed successfully!`,
      });
    }

    if (type === "UPDATE" && record.table === "orders") {
      const statusMessages: Record<string, string> = {
        preparing: "Your order is being prepared!",
        ready: "Your order is ready for pickup!",
        completed: "Order completed. Thank you!",
        cancelled: "Your order has been cancelled.",
      };

      const message = statusMessages[record.status];
      if (message) {
        await supabaseClient.from("notifications").insert({
          user_id: record.user_id,
          order_id: record.id,
          title: `Order ${record.status.charAt(0).toUpperCase() + record.status.slice(1)}`,
          message: `${message} Queue #${record.queue_number || "—"}`,
        });
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
