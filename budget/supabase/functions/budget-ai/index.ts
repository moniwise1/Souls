// Budget Partner: "Ask AI" (Supabase Edge Function)
//
// Answers the signed-in user's money questions with Claude, using a summary of
// their own budget plus web search for anything that needs fresh information
// (exchange rates, interest rates, prices, tax rules…).
//
// Private by design: only a signed-in user can call it, it answers only that
// user, and nothing is stored here. Chats live in the user's own account.
//
// Deploy:  supabase functions deploy budget-ai
// Secret:  supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
// Then set aiEnabled: true in budget/config.js.
import Anthropic from "npm:@anthropic-ai/sdk";
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const reply = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const SYSTEM = `You are the user's private personal-finance partner inside their budgeting app.
Be warm, direct and practical, like a trusted friend who is good with money. Use the user's currency.
Base answers on their real numbers (given below) and say so when you do. Keep answers short: a few sentences or a short list.
When a question needs current facts (rates, prices, regulations, news), search the web and mention where the information came from.
Give general education, not regulated financial advice: for big decisions (investing, loans, tax) explain options and trade-offs, and suggest a licensed professional when it matters.
Never invent numbers about the user. If something isn't in their data, say so and suggest how to track it.`;

type Msg = { role: "user" | "assistant"; content: string };

/** The API needs alternating turns that start with the user. */
function cleanHistory(raw: unknown): Msg[] {
  const out: Msg[] = [];
  for (const m of Array.isArray(raw) ? raw : []) {
    const role = m?.role === "assistant" ? "assistant" : m?.role === "user" ? "user" : null;
    const content = String(m?.content ?? "").slice(0, 4000).trim();
    if (!role || !content) continue;
    if (!out.length && role !== "user") continue;
    if (out.length && out[out.length - 1].role === role) out[out.length - 1].content += "\n\n" + content;
    else out.push({ role, content });
  }
  while (out.length && out[out.length - 1].role !== "user") out.pop();
  return out.slice(-12);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    const { data: me } = await supabase.auth.getUser();
    if (!me.user) return reply({ error: "Please sign in again." }, 401);

    const body = await req.json();
    const messages = cleanHistory(body.messages);
    if (!messages.length) return reply({ error: "Ask a question first." }, 400);
    const context = String(body.context ?? "").slice(0, 12000);

    const client = new Anthropic(); // reads ANTHROPIC_API_KEY
    const params = {
      model: "claude-opus-5-5",
      max_tokens: 16000,
      output_config: { effort: "low" }, // chat: quick, still thoughtful
      system: [
        { type: "text", text: SYSTEM },
        { type: "text", text: `The user's finances right now:\n${context}` },
      ],
      tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 4 }],
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      messages: messages as Anthropic.Beta.BetaMessageParam[],
    };

    // Web search can pause a long turn; continue it a few times if so.
    let convo = [...params.messages];
    let res: Anthropic.Beta.BetaMessage | null = null;
    for (let i = 0; i < 3; i++) {
      // deno-lint-ignore no-explicit-any
      res = await client.beta.messages.create({ ...params, messages: convo } as any);
      if (res.stop_reason !== "pause_turn") break;
      convo = [...convo, { role: "assistant", content: res.content }];
    }
    if (!res) throw new Error("No response");
    if (res.stop_reason === "refusal")
      return reply({ reply: "I can't help with that one. Try asking it a different way, or ask me about your budget." });

    let text = "";
    const sources: { url: string; title: string }[] = [];
    for (const block of res.content) {
      if (block.type === "text") {
        text += block.text;
        for (const c of block.citations ?? []) {
          // deno-lint-ignore no-explicit-any
          const cc = c as any;
          if (cc.url && !sources.some((s) => s.url === cc.url)) sources.push({ url: cc.url, title: cc.title || cc.url });
        }
      }
    }
    return reply({ reply: text.trim() || "Sorry, I don't have an answer for that.", sources: sources.slice(0, 5) });
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) return reply({ error: "The AI is busy. Try again in a minute." }, 429);
    if (e instanceof Anthropic.AuthenticationError) return reply({ error: "The AI key on the server isn't valid." }, 500);
    if (e instanceof Anthropic.APIError) return reply({ error: `AI error (${e.status}).` }, 502);
    return reply({ error: String((e as Error)?.message || e) }, 500);
  }
});
