import { ai } from "@/configs/AiModel";
import { NextRequest, NextResponse } from "next/server";

const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json(
        {
          success: false,
          error: "Prompt is required",
        },
        { status: 400 }
      );
    }

    console.log("Prompt:", prompt);

    let response;

    // Retry up to 3 times for temporary Gemini 503 errors
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        response = await ai.models.generateContent({
          model: "gemini-3.5-flash-lite",
          contents: prompt,

          config: {
            temperature: 1,
            topP: 0.95,
            topK: 40,
            maxOutputTokens: 2048,

            responseMimeType: "application/json",

            responseSchema: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  imagePrompt: {
                    type: "string",
                  },
                  ContentText: {
                    type: "string",
                  },
                },
                required: ["imagePrompt", "ContentText"],
              },
            },
          },
        });

        // Request succeeded
        break;
      } catch (error: any) {
        console.error(`Gemini attempt ${attempt} failed:`, error);

        // Retry only for 503
        if (error?.status === 503 && attempt < 3) {
          console.log("Gemini temporarily unavailable. Retrying...");

          // Wait 2 seconds, then 4 seconds
          await sleep(attempt * 2000);

          continue;
        }

        throw error;
      }
    }

    if (!response) {
      throw new Error("Gemini did not return a response");
    }

    const responseText = response.text;

    console.log("Gemini Response:", responseText);

    if (!responseText) {
      throw new Error("Gemini returned an empty response");
    }

    const result = JSON.parse(responseText);

    return NextResponse.json(
      {
        success: true,
        result,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error during creation:", error);

    if (error?.status === 503) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Gemini is currently experiencing high demand. Please try again in a few seconds.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Something went wrong",
      },
      { status: 500 }
    );
  }
}
