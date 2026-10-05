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
// FFmpeg Helper
// =====================================================

const runFFmpeg = async (args: string[]): Promise<void> => {
  console.log("Starting FFmpeg...");

  try {
    const { stdout, stderr } = await execFileAsync("ffmpeg", args, {
      maxBuffer: 1024 * 1024 * 20,
    });

    if (stdout) {
      console.log("FFmpeg stdout:");
      console.log(stdout);
    }

    if (stderr) {
      console.log("FFmpeg stderr:");
      console.log(stderr);
    }
  } catch (error) {
    console.error("FFmpeg execution failed:");

    if (error instanceof Error) {
      console.error(error.message);
    }

    throw error;
  }
};

// =====================================================
// Download File
// =====================================================

const downloadFile = async (url: string, filePath: string): Promise<void> => {
  console.log("Downloading:", url);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Failed to download file: ${url} (${response.status} ${response.statusText})`,
    );
  }

  const buffer = Buffer.from(await response.arrayBuffer());

  await fs.writeFile(filePath, buffer);

  console.log(`Downloaded successfully: ${filePath}`);
};

// =====================================================
// ASS Time Format
// =====================================================

const formatAssTime = (seconds: number): string => {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "0:00:00.00";
  }

  const hours = Math.floor(seconds / 3600);

  const minutes = Math.floor((seconds % 3600) / 60);

  const secs = Math.floor(seconds % 60);

  const centiseconds = Math.floor((seconds % 1) * 100);

  return `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(
    2,
    "0",
  )}.${String(centiseconds).padStart(2, "0")}`;
};

// =====================================================
// Escape ASS Text
// =====================================================

const escapeAssText = (text: string): string => {
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
  res: Response,
): Promise<void> => {
  let workspace = "";

  try {
    // =================================================
    // Get Request Data
    // =================================================

    const { images, audioUrl, captions }: GenerateVideoRequest = req.body;

    // =================================================
    // Validate Images
    // =================================================

    if (!images || !Array.isArray(images) || images.length === 0) {
      res.status(400).json({
        success: false,
        error: "Images are required",
      });

      return;
    }

    // =================================================
    // Validate Audio
    // =================================================

    if (!audioUrl || typeof audioUrl !== "string") {
      res.status(400).json({
        success: false,
        error: "Audio URL is required",
      });

      return;
    }

    // =================================================
    // Validate Captions
    // =================================================

    if (!captions || !Array.isArray(captions) || captions.length === 0) {
      res.status(400).json({
        success: false,
        error: "Captions are required",
      });

      return;
    }

    // =================================================
    // Create Unique Temporary Workspace
    // =================================================

    const workspaceId = crypto.randomUUID();

    workspace = path.join(os.tmpdir(), `video-${workspaceId}`);

    await fs.mkdir(workspace, {
      recursive: true,
    });

    console.log("========================================");

    console.log("VIDEO GENERATION STARTED");

    console.log("========================================");

    console.log("Workspace:", workspace);

    // =================================================
    // 1. Download Images
    // =================================================

    const imagePaths: string[] = [];

    for (let i = 0; i < images.length; i++) {
      const image = images[i];

      if (!image || !image.imageUrl) {
        throw new Error(`Image URL missing for scene ${i + 1}`);
      }

      const imagePath = path.join(workspace, `image-${i}.jpg`);

      await downloadFile(image.imageUrl, imagePath);

      imagePaths.push(imagePath);

      console.log(`Image ${i + 1}/${images.length} downloaded`);
    }

    // =================================================
    // 2. Download Audio
    // =================================================

    const audioPath = path.join(workspace, "audio.mp3");

    await downloadFile(audioUrl, audioPath);

    console.log("Audio downloaded successfully");

    // =================================================
    // 3. Create ASS Subtitle File
    // =================================================

    const subtitlesPath = path.join(workspace, "captions.ass");

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
      const start = formatAssTime(caption.start);

      const end = formatAssTime(caption.end);

      const text = escapeAssText(caption.text);

      assContent += `Dialogue: 0,${start},${end},Default,,0,0,0,,${text}\n`;
    }

    await fs.writeFile(subtitlesPath, assContent, "utf8");

    console.log("Captions file created");

    // =================================================
    // 4. Create FFmpeg Concat File
    // =================================================

    const concatPath = path.join(workspace, "images.txt");

    const imageDuration = 5;

    let concatContent = "";

    for (const imagePath of imagePaths) {
      /*
       * FFmpeg concat demuxer requires
       * file paths and duration.
       *
       * Use absolute paths because all files
       * are inside the same temporary workspace.
       */

      concatContent += `file '${imagePath}'\n`;
      concatContent += `duration ${imageDuration}\n`;
    }

    /*
     * FFmpeg concat requires the final image
     * to be repeated.
     */

    const lastImage = imagePaths[imagePaths.length - 1];

    if (!lastImage) {
      throw new Error("No images available for FFmpeg");
    }

    concatContent += `file '${lastImage}'\n`;

    await fs.writeFile(concatPath, concatContent, "utf8");

    console.log("FFmpeg concat file created");

    // =================================================
    // 5. Output File
    // =================================================

    const outputPath = path.join(workspace, "output.mp4");

    // =================================================
    // 6. FFmpeg Arguments
    // =================================================

    const ffmpegArgs: string[] = [
      // -----------------------------------------------
      // Input images
      // -----------------------------------------------

      "-f",
      "concat",

      "-safe",
      "0",

      "-i",
      concatPath,

      // -----------------------------------------------
      // Input audio
      // -----------------------------------------------

      "-i",
      audioPath,

      // -----------------------------------------------
      // Video filter
      // -----------------------------------------------

      "-vf",
      `scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,ass=${subtitlesPath}`,

      // -----------------------------------------------
      // Video codec
      // -----------------------------------------------

      "-c:v",
      "libx264",

      "-preset",
      "veryfast",

      "-crf",
      "23",

      "-pix_fmt",
      "yuv420p",

      // -----------------------------------------------
      // Audio codec
      // -----------------------------------------------

      "-c:a",
      "aac",

      "-b:a",
      "192k",

      // -----------------------------------------------
      // Stop when shortest input ends
      // -----------------------------------------------

      "-shortest",

      // -----------------------------------------------
      // Overwrite existing output
      // -----------------------------------------------

      "-y",

      // -----------------------------------------------
      // Output
      // -----------------------------------------------

      outputPath,
    ];

    // =================================================
    // 7. Run FFmpeg
    // =================================================

    console.log("Running FFmpeg...");

    await runFFmpeg(ffmpegArgs);

    console.log("FFmpeg video generated successfully");

    // =================================================
    // 8. Check Output
    // =================================================

    const videoBuffer = await fs.readFile(outputPath);

    if (!videoBuffer || videoBuffer.length === 0) {
      throw new Error("Generated video is empty");
    }

    console.log(`Video generated successfully: ${videoBuffer.length} bytes`);

    // =================================================
    // 9. Cleanup
    // =================================================

    await fs.rm(workspace, {
      recursive: true,
      force: true,
    });

    console.log("Temporary files cleaned");

    // =================================================
    // 10. Send Video Response
    // =================================================

    res.status(200);

    res.setHeader("Content-Type", "video/mp4");

    res.setHeader(
      "Content-Disposition",
      'inline; filename="generated-video.mp4"',
    );

    res.setHeader("Content-Length", videoBuffer.length.toString());

    res.send(videoBuffer);
  } catch (error) {
    // =================================================
    // Error Logging
    // =================================================

    console.error("========================================");

    console.error("VIDEO GENERATION ERROR");

    console.error("========================================");

    console.error(error);

    // =================================================
    // Cleanup Workspace
    // =================================================

    if (workspace) {
      try {
        await fs.rm(workspace, {
          recursive: true,
          force: true,
        });

        console.log("Workspace cleaned after error");
      } catch (cleanupError) {
        console.error("Cleanup failed:", cleanupError);
      }
    }

    // =================================================
    // Error Response
    // =================================================

    const message =
      error instanceof Error ? error.message : "Video generation failed";

    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: message,
      });
    }
  }
};
