// Souls by Zamani — Paystack webhook (Supabase Edge Function)
// Marks orders as paid when Paystack confirms a card/bank/USSD payment.
//
// Deploy (one time):
//   supabase functions deploy paystack-webhook --no-verify-jwt
//   supabase secrets set PAYSTACK_SECRET_KEY=sk_live_xxx
// Then in Paystack → Settings → API Keys & Webhooks, set the webhook URL to
//   https://<your-project>.supabase.co/functions/v1/paystack-webhook
import { createClient } from "npm:@supabase/supabase-js@2";

const secret = Deno.env.get("PAYSTACK_SECRET_KEY") ?? "";
const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

async function hmacSha512(key: string, body: string) {
  const k = await crypto.subtle.importKey("raw", new TextEncoder().encode(key), { name: "HMAC", hash: "SHA-512" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(body));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  const body = await req.text();
  if ((await hmacSha512(secret, body)) !== req.headers.get("x-paystack-signature")) {
    return new Response("invalid signature", { status: 401 });
  }
  const event = JSON.parse(body);
  if (event.event !== "charge.success") return new Response("ignored");

  const tx = event.data;
  const orderId = String(tx.metadata?.order ?? tx.reference ?? "").split("-")[0];
  const { data: order } = await db.from("orders").select("id,total").eq("id", orderId).maybeSingle();
  if (!order) return new Response("order not found", { status: 200 });

  const amount = Math.round(tx.amount / 100);
  await db.from("payments").insert({
    order_id: order.id, provider: "paystack", reference: tx.reference, amount,
    status: "success", verified: true, raw: tx,
  });
  if (amount >= order.total) {
    await db.from("orders").update({ payment_status: "paid", status: "confirmed" }).eq("id", order.id);
  }
  return new Response("ok");
});
