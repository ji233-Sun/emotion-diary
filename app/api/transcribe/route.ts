import { NextResponse } from "next/server";
import { transcribeAudio } from "@/src/lib/bailian";

const MAX_AUDIO_BYTES = 12 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const audio = formData.get("audio");

    if (!(audio instanceof File)) {
      return NextResponse.json({ error: "audio file is required" }, { status: 400 });
    }

    if (audio.size > MAX_AUDIO_BYTES) {
      return NextResponse.json({ error: "audio file is too large" }, { status: 413 });
    }

    const audioDataUrl = await fileToDataUrl(audio);
    const text = await transcribeAudio(audioDataUrl);

    return NextResponse.json({ text });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 502 });
  }
}

async function fileToDataUrl(file: File) {
  const bytes = Buffer.from(await file.arrayBuffer());
  const mimeType = file.type || "audio/webm";

  return `data:${mimeType};base64,${bytes.toString("base64")}`;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Failed to transcribe audio.";
}
