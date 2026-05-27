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
    const { input, style } = await request.json();

    if (!input?.trim()) {
      return Response.json({ error: "No source provided." }, { status: 400 });
    }

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 512,
      system:
        `You are an academic citation expert. Format the given source as a ${style} citation. ` +
        "Return a JSON object with exactly: " +
        '"citation" (the full reference list entry as a string) and ' +
        '"inText" (the in-text/parenthetical citation as a string). ' +
        "If information is missing, make reasonable academic assumptions. " +
        "Return ONLY valid JSON, no markdown.",
      messages: [{ role: "user", content: `Format this source as a ${style} citation:\n\n${input.slice(0, 2000)}` }],
    });

    const raw = message.content[0].type === "text" ? message.content[0].text : "";
    const parsed = JSON.parse(raw);

    return Response.json(parsed);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
