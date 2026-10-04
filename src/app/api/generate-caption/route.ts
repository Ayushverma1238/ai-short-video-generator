import { NextRequest, NextResponse } from "next/server";
import { AssemblyAI } from "assemblyai";
export async function POST(req: NextRequest) {
  try {
    const client = new AssemblyAI({
      apiKey: process.env.ASSEMBLYAI_API_KEY as string,
    });
    const { audioUrl } = await req.json();

    const FILE_URL = audioUrl as string;
    const data = {
      audio: FILE_URL as string,
    };

    const transcript = await client.transcripts.transcribe(data);
    console.log("transcript word", transcript.words);
    return NextResponse.json({ result: transcript.words });
  } catch (error) {
    return NextResponse.json({ error: error });
  }
}
