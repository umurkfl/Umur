// Supabase Edge Function: Gus Asistan
// Receives the user's goals and a short list of candidate restaurants (built from real receipts)
// and asks Claude to pick the best matches. The API key lives only on the server.
//
// Deploy:
//   supabase functions deploy assistant --no-verify-jwt=false
//   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
// The web app calls it at <SUPABASE_URL>/functions/v1/assistant with the anon key.

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const { budget, goals, vibe, city, candidates } = await req.json();
    if (!Array.isArray(candidates) || candidates.length === 0) {
      return new Response(JSON.stringify({ picks: [] }), { headers: { ...CORS, "Content-Type": "application/json" } });
    }

    const prompt = `Sen grazer uygulamasının restoran asistanı Gus'sun. Aşağıdaki gerçek adisyon verilerinden kullanıcıya en uygun 3 mekanı seç.
Kullanıcı: kişi başı bütçe en fazla ${budget ?? "belirtilmedi"} TL, hedefler: ${(goals ?? []).join(", ") || "yok"}, ortam: ${vibe ?? "belirtilmedi"}, şehir: ${city ?? "fark etmez"}.
Kurallar: Sadece aşağıdaki listeden seç. Beslenme hedefi için kesin bilgin yoksa yorumlardaki ipuçlarına dayan ve "yorumlara göre" de. Kısa, samimi, Türkçe yaz.
Sadece şu JSON'u döndür: {"picks":[{"name":"<listedeki ad>","why":"<tek cümle>"}]}

Mekanlar:
${JSON.stringify(candidates).slice(0, 12000)}`;

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": Deno.env.get("ANTHROPIC_API_KEY") ?? "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({ model: "claude-haiku-5-5", max_tokens: 600, messages: [{ role: "user", content: prompt }] }),
    });
    const data = await res.json();
    const text: string = data?.content?.[0]?.text ?? "{}";
    const json = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1));
    return new Response(JSON.stringify({ picks: json.picks ?? [] }), { headers: { ...CORS, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...CORS, "Content-Type": "application/json" } });
  }
});
