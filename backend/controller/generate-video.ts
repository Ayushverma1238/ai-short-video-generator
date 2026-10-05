import fs from "fs/promises";
import path from "path";
import os from "os";
import crypto from "crypto";
import { execFile } from "child_process";
import { promisify } from "util";
import type { Request, Response } from "express";

const execFileAsync = promisify(execFile);

// =====================================================
// Types
// =====================================================

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

// =====================================================
// FFmpeg helper
// =====================================================

const runFFmpeg = async (args: string[]) => {
  console.log("Starting FFmpeg...");

  const { stdout, stderr } = await execFileAsync(
    "ffmpeg",
    args,
    {
      maxBuffer: 1024 * 1024 * 20,
    }
  );

  if (stdout) {
    console.log(stdout);
  }

  if (stderr) {
    console.log(stderr);
  }
};

// =====================================================
// Download file
// =====================================================

const downloadFile = async (
  url: string,
  filePath: string
): Promise<void> => {
  console.log("Downloading:", url);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Failed to download file: ${url} (${response.status})`
    );
  }

  const buffer = Buffer.from(
    await response.arrayBuffer()
  );

  await fs.writeFile(filePath, buffer);
};

// =====================================================
// ASS time format
// =====================================================

const formatAssTime = (
  seconds: number
): string => {
  const hours = Math.floor(seconds / 3600);

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

// =====================================================
// Escape ASS text
// =====================================================

const escapeAssText = (
  text: string
): string => {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/\{/g, "\\{")
    .replace(/\}/g, "\\}");
};

// =====================================================
// Generate Video
// =====================================================

export const generateVideo = async (
  req: Request,
  res: Response
): Promise<void> => {
  let workspace = "";

  try {
    const {
      images,
      audioUrl,
      captions,
    }: GenerateVideoRequest = req.body;

    // =================================================
    // Validate request
    // =================================================

    if (
      !images ||
      !Array.isArray(images) ||
      images.length === 0
    ) {
      res.status(400).json({
        success: false,
        error: "Images are required",
      });

      return;
    }

    if (!audioUrl) {
      res.status(400).json({
        success: false,
        error: "Audio URL is required",
      });

      return;
    }

    if (
      !captions ||
      !Array.isArray(captions) ||
      captions.length === 0
    ) {
      res.status(400).json({
        success: false,
        error: "Captions are required",
      });

      return;
    }

    // =================================================
    // Create unique workspace
    // =================================================

    const workspaceId = crypto.randomUUID();

    workspace = path.join(
      os.tmpdir(),
      `video-${workspaceId}`
    );

    await fs.mkdir(workspace, {
      recursive: true,
    });

    console.log("================================");
    console.log("VIDEO GENERATION STARTED");
    console.log("Workspace:", workspace);
    console.log("================================");

    // =================================================
    // 1. Download Images
    // =================================================

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

      console.log(
        `Image ${i + 1}/${images.length} downloaded`
      );
    }

    // =================================================
    // 2. Download Audio
    // =================================================

    const audioPath = path.join(
      workspace,
      "audio.mp3"
    );

    await downloadFile(
      audioUrl,
      audioPath
    );

    console.log("Audio downloaded");

    // =================================================
    // 3. Create ASS subtitles
    // =================================================

    const subtitlesPath = path.join(
      workspace,
      "captions.ass"
    );

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

    // =================================================
    // 4. Create FFmpeg concat file
    // =================================================

    const concatPath = path.join(
      workspace,
      "images.txt"
    );

    const imageDuration = 5;

    let concatContent = "";

    for (const imagePath of imagePaths) {
      // FFmpeg concat file uses absolute paths
      concatContent += `file '${imagePath}'\n`;
      concatContent += `duration ${imageDuration}\n`;
    }

    // FFmpeg concat requires last image twice
    const lastImage =
      imagePaths[imagePaths.length - 1];

    concatContent += `file '${lastImage}'\n`;

    await fs.writeFile(
      concatPath,
      concatContent,
      "utf8"
    );

    console.log(
      "FFmpeg concat file created"
    );

    // =================================================
    // 5. Output
    // =================================================

    const outputPath = path.join(
      workspace,
      "output.mp4"
    );

    // =================================================
    // 6. Run FFmpeg
    // =================================================

    const ffmpegArgs = [
      // Image concat
      "-f",
      "concat",

      "-safe",
      "0",

      "-i",
      concatPath,

      // Audio
      "-i",
      audioPath,

      // Video processing
      "-vf",
      `scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,ass=${subtitlesPath}`,

      // Video codec
      "-c:v",
      "libx264",

      "-preset",
      "veryfast",

      "-crf",
      "23",

      "-pix_fmt",
      "yuv420p",

      // Audio codec
      "-c:a",
      "aac",

      "-b:a",
      "192k",

      // Stop when shortest stream ends
      "-shortest",

      // Overwrite output
      "-y",

      outputPath,
    ];

    console.log(
      "Running FFmpeg..."
    );

    await runFFmpeg(ffmpegArgs);

    console.log(
      "FFmpeg video generated successfully"
    );

    // =================================================
    // 7. Read generated video
    // =================================================

    const videoBuffer = await fs.readFile(
      outputPath
    );

    if (!videoBuffer.length) {
      throw new Error(
        "Generated video is empty"
      );
    }

    console.log(
      `Video size: ${videoBuffer.length} bytes`
    );

    // =================================================
    // 8. Cleanup
    // =================================================

    await fs.rm(workspace, {
      recursive: true,
      force: true,
    });

    console.log(
      "Temporary files cleaned"
    );

    // =================================================
    // 9. Return video
    // =================================================

    res.status(200);

    res.setHeader(
      "Content-Type",
      "video/mp4"
    );

    res.setHeader(
      "Content-Disposition",
      'inline; filename="generated-video.mp4"'
    );

    res.setHeader(
      "Content-Length",
      videoBuffer.length.toString()
    );

    res.send(videoBuffer);

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

    // Cleanup even if generation fails
    if (workspace) {
      try {
        await fs.rm(workspace, {
          recursive: true,
          force: true,
        });
      } catch (cleanupError) {
        console.error(
          "Cleanup failed:",
          cleanupError
        );
      }
    }

    const message =
      error instanceof Error
        ? error.message
        : "Video generation failed";

    res.status(500).json({
      success: false,
      error: message,
    });
  }
};