const SPACE = "https://aryan3107-shatakshi-ai.hf.space/gradio_api/call/chat";

export default async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  // Optional: only accept calls from your own site (set ALLOWED_ORIGIN, e.g. https://yoursite.netlify.app)
  const allowed = Netlify.env.get("ALLOWED_ORIGIN");
  if (allowed && req.headers.get("origin") !== allowed) {
    return new Response("Forbidden", { status: 403 });
  }

  let body;
  try { body = await req.json(); } catch { return new Response("Bad request", { status: 400 }); }
  const message = String(body.message || "").trim().slice(0, 300);
  if (!message) return new Response("Empty message", { status: 400 });

  const auth = { Authorization: `Bearer ${Netlify.env.get("HF_TOKEN")}` };

  // Generation settings are fixed here so visitors can't ask for huge outputs.
  const start = await fetch(SPACE, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...auth },
    body: JSON.stringify({ data: [message, 220, 0.7, 40] }),
  });
  if (!start.ok) return new Response("Upstream error", { status: 502 });

  const { event_id } = await start.json();
  const stream = await fetch(`${SPACE}/${event_id}`, { headers: auth });
  if (!stream.ok) return new Response("Upstream error", { status: 502 });

  return new Response(stream.body, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
  });
};

export const config = { path: "/api/chat" };
