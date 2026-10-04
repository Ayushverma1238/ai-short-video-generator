import { NextRequest, NextResponse } from "next/server";
import textToSpeech from "@google-cloud/text-to-speech";
import { v2 as cloudinary } from "cloudinary";

// ==========================================
// Cloudinary configuration
// ==========================================

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ==========================================
// Google Text-to-Speech client
// ==========================================

const client = new textToSpeech.TextToSpeechClient({
  apiKey: process.env.GOOGLE_API_KEY,
});

// ==========================================
// POST /api/generate-audio
// ==========================================

export async function POST(req: NextRequest) {
  try {
    // ==========================================
    // 1. Get request body
    // ==========================================

    const body = await req.json();

    const text = body.text as string | undefined;
    const id = body.id as string | undefined;

    // ==========================================
    // 2. Validate input
    // ==========================================

    if (!text?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "Text is required",
        },
        { status: 400 },
      );
    }

    if (!id?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "ID is required",
        },
        { status: 400 },
      );
    }

    // ==========================================
    // 3. Google TTS request
    // ==========================================

    const request = {
      input: {
        text: text.trim(),
      },

      voice: {
        languageCode: "en-US",
        ssmlGender: "NEUTRAL" as const,
      },

      audioConfig: {
        audioEncoding: "MP3" as const,
      },
    };

    // ==========================================
    // 4. Generate speech
    // ==========================================

    const [response] = await client.synthesizeSpeech(request);

    if (!response.audioContent) {
      throw new Error("No audio content received from Google TTS");
    }

    // ==========================================
    // 5. Convert audioContent to Buffer
    // ==========================================

    let audioBuffer: Buffer;

    if (typeof response.audioContent === "string") {
      audioBuffer = Buffer.from(response.audioContent, "base64");
    } else {
      audioBuffer = Buffer.from(response.audioContent);
    }

    console.log("Audio generated successfully");
    console.log("Audio size:", audioBuffer.length);

    // ==========================================
    // 6. Upload MP3 to Cloudinary
    // ==========================================

    const uploadResult = await new Promise<{
      secure_url: string;
      public_id: string;
      resource_type: string;
      format: string;
    }>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: "video",
          folder: "ai-short-video-generator/audio",
          public_id: id,
          format: "mp3",
        },
        (error, result) => {
          if (error) {
            reject(error);
            return;
          }

          if (!result) {
            reject(new Error("Cloudinary upload returned no result"));
            return;
          }

          resolve({
            secure_url: result.secure_url,
            public_id: result.public_id,
            resource_type: result.resource_type,
            format: result.format,
          });
        },
      );

      uploadStream.end(audioBuffer);
    });

    console.log("Cloudinary upload successful");
    console.log("Audio URL:", uploadResult.secure_url);

    // ==========================================
    // 7. Return audio URL
    // ==========================================

    return NextResponse.json(
      {
        success: true,

        id,

        audioUrl: uploadResult.secure_url,

        publicId: uploadResult.public_id,

        format: uploadResult.format,

        message: "Audio generated and uploaded successfully",
      },
      {
        status: 200,
      },
    );
  } catch (error: unknown) {
    // ==========================================
    // Error handling
    // ==========================================

    console.error("Text-to-speech error:", error);

    return NextResponse.json(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Failed to generate audio",
      },
      {
        status: 500,
      },
    );
  }
}
