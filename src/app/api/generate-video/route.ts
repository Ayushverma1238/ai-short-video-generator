import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

// ==========================================
// Types
// ==========================================

interface VideoImage {
  imageUrl: string;
  imagePrompt: string;
  ContentText: string;
}

interface Caption {
  text: string;
  start: number;
  end: number;
}

interface GenerateVideoRequest {
  images: VideoImage[];
  audioUrl: string;
  captions: Caption[];
}

// ==========================================
// POST
// ==========================================

export async function POST(req: NextRequest) {
  try {
    const {
      images,
      audioUrl,
      captions,
    }: GenerateVideoRequest = await req.json();

    // ==========================================
    // Validate request
    // ==========================================

    if (!images || images.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Images are required",
        },
        { status: 400 }
      );
    }

    if (!audioUrl) {
      return NextResponse.json(
        {
          success: false,
          error: "Audio URL is required",
        },
        { status: 400 }
      );
    }

    if (!captions || captions.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Captions are required",
        },
        { status: 400 }
      );
    }

    // ==========================================
    // Workspace
    // ==========================================

    const workspace = path.join(
      process.cwd(),
      "video-workspace"
    );

    await fs.mkdir(workspace, {
      recursive: true,
    });

    console.log("Workspace:", workspace);

    // ==========================================
    // Helper: Download file
    // ==========================================

    const downloadFile = async (
      url: string,
      filePath: string
    ) => {
      console.log("Downloading:", url);

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(
          `Failed to download file: ${url}`
        );
      }

      const buffer = Buffer.from(
        await response.arrayBuffer()
      );

      await fs.writeFile(filePath, buffer);
    };

    // ==========================================
    // 1. Download Images
    // ==========================================

    const imagePaths: string[] = [];

    for (let i = 0; i < images.length; i++) {
      const imagePath = path.join(
        workspace,
        `image-${i}.jpg`
      );

      await downloadFile(
        images[i].imageUrl,
        imagePath
      );

      imagePaths.push(imagePath);
    }

    console.log(
      `${imagePaths.length} images downloaded`
    );

    // ==========================================
    // 2. Download Audio
    // ==========================================

    const audioPath = path.join(
      workspace,
      "audio.mp3"
    );

    await downloadFile(
      audioUrl,
      audioPath
    );

    console.log("Audio downloaded");

    // ==========================================
    // 3. Create subtitles (.ass)
    // ==========================================

    const subtitlesPath = path.join(
      workspace,
      "captions.ass"
    );

    const formatAssTime = (
      seconds: number
    ): string => {
      const hours = Math.floor(
        seconds / 3600
      );

      const minutes = Math.floor(
        (seconds % 3600) / 60
      );

      const secs = Math.floor(seconds % 60);

      const centiseconds = Math.floor(
        (seconds % 1) * 100
      );

      return `${hours}:${String(minutes).padStart(
        2,
        "0"
      )}:${String(secs).padStart(
        2,
        "0"
      )}.${String(centiseconds).padStart(
        2,
        "0"
      )}`;
    };

    // Escape ASS special characters
    const escapeAssText = (
      text: string
    ): string => {
      return text
        .replace(/\\/g, "\\\\")
        .replace(/\{/g, "\\{")
        .replace(/\}/g, "\\}");
    };

    let assContent = `[Script Info]
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,60,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,1,0,0,0,100,100,0,0,1,3,1,2,100,100,80,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

    for (const caption of captions) {
      const start = formatAssTime(
        caption.start
      );

      const end = formatAssTime(
        caption.end
      );

      const text = escapeAssText(
        caption.text
      );

      assContent +=
        `Dialogue: 0,${start},${end},Default,,0,0,0,,${text}\n`;
    }

    await fs.writeFile(
      subtitlesPath,
      assContent,
      "utf8"
    );

    console.log("Captions file created");

    // ==========================================
    // 4. Create FFmpeg concat file
    // ==========================================

    const concatPath = path.join(
      workspace,
      "images.txt"
    );

    /*
      For now each image gets 5 seconds.

      Later we can calculate the duration
      automatically from captions.
    */

    const imageDuration = 5;

    let concatContent = "";

    for (const imagePath of imagePaths) {
      const dockerImagePath =
        `/workspace/${path.basename(
          imagePath
        )}`;

      concatContent +=
        `file '${dockerImagePath}'\n`;

      concatContent +=
        `duration ${imageDuration}\n`;
    }

    // FFmpeg concat requires last image
    // to be repeated.

    const lastImage =
      `/workspace/${path.basename(
        imagePaths[imagePaths.length - 1]
      )}`;

    concatContent += `file '${lastImage}'\n`;

    await fs.writeFile(
      concatPath,
      concatContent,
      "utf8"
    );

    console.log(
      "FFmpeg concat file created"
    );

    // ==========================================
    // 5. Output video
    // ==========================================

    const outputPath = path.join(
      workspace,
      "output.mp4"
    );

    // ==========================================
    // 6. Docker FFmpeg command
    // ==========================================

    const dockerArgs = [
      "compose",
      "run",
      "--rm",

      "ffmpeg",

      // --------------------------------------
      // Images
      // --------------------------------------

      "-f",
      "concat",

      "-safe",
      "0",

      "-i",
      "/workspace/images.txt",

      // --------------------------------------
      // Audio
      // --------------------------------------

      "-i",
      "/workspace/audio.mp3",

      // --------------------------------------
      // Video
      // --------------------------------------

      "-vf",

      "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,ass=/workspace/captions.ass",

      // --------------------------------------
      // Video codec
      // --------------------------------------

      "-c:v",
      "libx264",

      "-preset",
      "veryfast",

      "-crf",
      "23",

      "-pix_fmt",
      "yuv420p",

      // --------------------------------------
      // Audio codec
      // --------------------------------------

      "-c:a",
      "aac",

      "-b:a",
      "192k",

      // --------------------------------------
      // Stop when shortest stream ends
      // --------------------------------------

      "-shortest",

      // --------------------------------------
      // Output
      // --------------------------------------

      "/workspace/output.mp4",
    ];

    console.log(
      "Starting Docker FFmpeg..."
    );

    await execFileAsync(
      "docker",
      dockerArgs,
      {
        cwd: process.cwd(),
        maxBuffer: 1024 * 1024 * 10,
      }
    );

    console.log(
      "FFmpeg video generated successfully"
    );

    // ==========================================
    // 7. Read generated video
    // ==========================================

    const videoBuffer = await fs.readFile(
      outputPath
    );

    // ==========================================
    // 8. Cleanup temporary files
    // ==========================================

    const filesToDelete = [
      ...imagePaths,
      audioPath,
      subtitlesPath,
      concatPath,
      outputPath,
    ];

    await Promise.all(
      filesToDelete.map(async (file) => {
        try {
          await fs.unlink(file);
        } catch (error) {
          console.warn(
            "Cleanup failed:",
            file
          );
        }
      })
    );

    // ==========================================
    // 9. Return video
    // ==========================================

    return new NextResponse(
      videoBuffer,
      {
        status: 200,

        headers: {
          "Content-Type": "video/mp4",

          "Content-Disposition":
            'inline; filename="generated-video.mp4"',

          "Content-Length":
            videoBuffer.length.toString(),
        },
      }
    );
  } catch (error) {
    console.error(
      "================================"
    );

    console.error(
      "VIDEO GENERATION ERROR"
    );

    console.error(
      "================================"
    );

    console.error(error);

    return NextResponse.json(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Video generation failed",
      },
      {
        status: 500,
      }
    );
  }
}