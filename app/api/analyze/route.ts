import { NextResponse } from "next/server";
import { analyzeDiaryText } from "@/src/lib/bailian";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { text?: unknown };
    if (typeof body.text !== "string" || !body.text.trim()) {
      return NextResponse.json({ error: "text is required" }, { status: 400 });
    }

    const result = await analyzeDiaryText(body.text);

    return NextResponse.json({ result });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 502 });
  }
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Failed to analyze diary text.";
}
