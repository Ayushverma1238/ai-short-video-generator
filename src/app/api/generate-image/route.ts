import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { InferenceClient } from "@huggingface/inference";

// ==========================================
// Cloudinary Configuration
// ==========================================

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ==========================================
// Hugging Face Configuration
// ==========================================

const hfToken = process.env.HF_TOKEN;

if (!hfToken) {
  console.error("HF_TOKEN is missing from environment variables");
}

const hf = new InferenceClient(hfToken);

// ==========================================
// Constants
// ==========================================

const MODEL = "black-forest-labs/FLUX.1-schnell";

const IMAGE_WIDTH = 576;
const IMAGE_HEIGHT = 1024;

const MAX_RETRIES = 3;

// ==========================================
// Helper: Generate image
// ==========================================

async function generateImage(prompt: string): Promise<Buffer> {
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`Generating image - attempt ${attempt}/${MAX_RETRIES}`);

      const image = await hf.textToImage({
        model: MODEL,
        inputs: prompt,

        parameters: {
          width: IMAGE_WIDTH,
          height: IMAGE_HEIGHT,
          num_inference_steps: 4,
        },
      });

      console.log("Hugging Face response received");

      // ==========================================
      // Convert Hugging Face result to Buffer
      // ==========================================

      let imageBuffer: Buffer;

      if (typeof image === "string") {
        console.log("Response type: string");

        // Base64 image
        if (image.startsWith("data:image/")) {
          const base64Data = image.split(",")[1];

          if (!base64Data) {
            throw new Error("Invalid base64 image returned by Hugging Face");
          }

          imageBuffer = Buffer.from(base64Data, "base64");
        }

        // URL
        else if (image.startsWith("http://") || image.startsWith("https://")) {
          console.log("Downloading image URL...");

          const response = await fetch(image);

          if (!response.ok) {
            throw new Error(
              `Image download failed: ${response.status} ${response.statusText}`,
            );
          }

          imageBuffer = Buffer.from(await response.arrayBuffer());
        } else {
          throw new Error("Hugging Face returned an invalid image string");
        }
      }

      // ==========================================
      // Blob / binary response
      // ==========================================
      else {
        console.log("Response type: binary image");

        /*
         * The Hugging Face SDK returns a Blob-like
         * object here.
         *
         * Cast it explicitly because the installed
         * SDK TypeScript definition incorrectly
         * narrows the type to `never`.
         */

        const blob = image as unknown as Blob;

        imageBuffer = Buffer.from(await blob.arrayBuffer());
      }

      // ==========================================
      // Validate buffer
      // ==========================================

      if (!imageBuffer || imageBuffer.length === 0) {
        throw new Error("Hugging Face returned an empty image");
      }

      console.log(`Image generated successfully: ${imageBuffer.length} bytes`);

      return imageBuffer;
    } catch (error: unknown) {
      lastError = error;

      console.error(`Image generation attempt ${attempt} failed:`, error);

      // ==========================================
      // Retry
      // ==========================================

      if (attempt < MAX_RETRIES) {
        const delay = attempt * 2000;

        console.log(`Retrying in ${delay}ms...`);

        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  if (lastError instanceof Error) {
    throw lastError;
  }

  throw new Error("Image generation failed after all retries");
}

// ==========================================
// Helper: Upload to Cloudinary
// ==========================================

async function uploadToCloudinary(
  imageBuffer: Buffer,
  id: string,
): Promise<{
  secure_url: string;
  public_id: string;
  resource_type: string;
  format: string;
}> {
  if (!imageBuffer || imageBuffer.length === 0) {
    throw new Error("Cannot upload empty image to Cloudinary");
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "image",

        folder: "ai-short-video-generator/images",

        public_id: id,

        format: "png",

        overwrite: true,
      },

      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        if (!result) {
          reject(new Error("Cloudinary returned no upload result"));

          return;
        }

        if (!result.secure_url) {
          reject(new Error("Cloudinary did not return a secure URL"));

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

    uploadStream.end(imageBuffer);
  });
}

// ==========================================
// POST /api/generate-image
// ==========================================

export async function POST(req: NextRequest) {
  try {
    // ==========================================
    // 1. Check Hugging Face token
    // ==========================================

    if (!hfToken) {
      return NextResponse.json(
        {
          success: false,
          error: "Hugging Face token is not configured",
        },
        {
          status: 500,
        },
      );
    }

    // ==========================================
    // 2. Parse request
    // ==========================================

    const body = await req.json();

    const prompt = body.prompt as string | undefined;

    const id = body.id as string | undefined;

    // ==========================================
    // 3. Validate prompt
    // ==========================================

    if (!prompt?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "Image prompt is required",
        },
        {
          status: 400,
        },
      );
    }

    // ==========================================
    // 4. Validate ID
    // ==========================================

    if (!id?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "Image ID is required",
        },
        {
          status: 400,
        },
      );
    }

    console.log("==========================================");

    console.log("Starting image generation");

    console.log("ID:", id);

    console.log("Prompt:", prompt);

    console.log("Model:", MODEL);

    console.log(`Resolution: ${IMAGE_WIDTH}x${IMAGE_HEIGHT}`);

    console.log("==========================================");

    // ==========================================
    // 5. Generate image
    // ==========================================

    const imageBuffer = await generateImage(prompt.trim());

    // ==========================================
    // 6. Validate generated image
    // ==========================================

    if (!imageBuffer || imageBuffer.length < 1000) {
      throw new Error(
        `Generated image is invalid or too small: ${
          imageBuffer?.length ?? 0
        } bytes`,
      );
    }

    console.log("Image validation successful");

    console.log("Image size:", imageBuffer.length, "bytes");

    // ==========================================
    // 7. Upload to Cloudinary
    // ==========================================

    console.log("Uploading image to Cloudinary...");

    const uploadResult = await uploadToCloudinary(imageBuffer, id.trim());

    console.log("Image uploaded successfully");

    console.log("Cloudinary URL:", uploadResult.secure_url);

    // ==========================================
    // 8. Return response
    // ==========================================

    return NextResponse.json(
      {
        success: true,

        id: id.trim(),

        imageUrl: uploadResult.secure_url,

        publicId: uploadResult.public_id,

        format: uploadResult.format,

        prompt: prompt.trim(),

        model: MODEL,

        width: IMAGE_WIDTH,

        height: IMAGE_HEIGHT,

        message: "Image generated and uploaded successfully",
      },
      {
        status: 200,
      },
    );
  } catch (error: unknown) {
    // ==========================================
    // Error handling
    // ==========================================

    console.error("==========================================");

    console.error("IMAGE GENERATION ERROR");

    console.error(error);

    console.error("==========================================");

    let errorMessage = "Failed to generate image";

    if (error instanceof Error) {
      errorMessage = error.message;
    }

    // ==========================================
    // Return error
    // ==========================================

    return NextResponse.json(
      {
        success: false,

        error: errorMessage,

        message: "Image generation failed",
      },
      {
        status: 500,
      },
    );
  }
}
