import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      { error: "ANTHROPIC_API_KEY is not configured. Add it to your .env.local file." },
      { status: 500 }
    );
  }

  try {
    const { text } = await request.json();

    if (!text || text.trim().length < 50) {
      return Response.json({ error: "Text too short to summarise." }, { status: 400 });
    }

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system:
        "You are a study assistant. When given notes or text, return a JSON object with exactly these keys: " +
        '"summary" (a concise paragraph summary), ' +
        '"keyPoints" (array of 4-7 key takeaway strings), ' +
        '"topics" (array of 2-5 short topic/subject tags). ' +
        "Return ONLY valid JSON, no markdown, no extra text.",
      messages: [{ role: "user", content: `Summarise these notes:\n\n${text.slice(0, 8000)}` }],
    });

    const raw = message.content[0].type === "text" ? message.content[0].text : "";
    const parsed = JSON.parse(raw);

    return Response.json(parsed);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
