"use client";

import React, { useContext, useState } from "react";
import axios, { AxiosError } from "axios";
import { v4 as uuidv4 } from "uuid";

import SelectTopic from "./_components/SelectTopic";
import SelectStyle from "./_components/SelectStyle";
import SelectDuration from "./_components/SelectDuration";
import CustomLoading from "./_components/CustomLoading";

import { Button } from "@/components/ui/button";
import { VideoDataContext } from "@/app/_context/VideoDataContex";

// =====================================================
// Types
// =====================================================

interface VideoScriptProps {
  imagePrompt: string;
  ContentText: string;
}

interface GeneratedImage {
  imageUrl: string;
  imagePrompt: string;
  ContentText: string;
}

interface Caption {
  text: string;
  start: number;
  end: number;
}

interface VideoApiResponse {
  success: boolean;
  error?: string;
}

// =====================================================
// Generation Steps
// =====================================================

type GenerationStep =
  | "idle"
  | "script"
  | "audio"
  | "caption"
  | "images"
  | "video"
  | "completed"
  | "error";

const CreateNew = () => {
  // =====================================================
  // Form
  // =====================================================

  const [formData, setFormData] = useState<Record<string, string>>({});

  // =====================================================
  // Loading
  // =====================================================

  const [loading, setLoading] = useState<boolean>(false);

  const [currentStep, setCurrentStep] = useState<GenerationStep>("idle");

  const [errorMessage, setErrorMessage] = useState<string>("");

  // =====================================================
  // Generated Data
  // =====================================================

  const [videoScript, setVideoScript] = useState<VideoScriptProps[]>([]);

  const [audioUrl, setAudioUrl] = useState<string>("");

  const [captions, setCaptions] = useState<Caption[]>([]);

  const [images, setImages] = useState<GeneratedImage[]>([]);

  const [videoUrl, setVideoUrl] = useState<string>("");

  // =====================================================
  // Context
  // =====================================================

  const context = useContext(VideoDataContext);

  if (!context) {
    throw new Error("CreateNew must be used inside VideoDataProvider");
  }

  const { setVideoDate } = context;

  // =====================================================
  // Handle Input
  // =====================================================

  const onHandleInputChange = (field: string, value: string): void => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // =====================================================
  // Step 1: Generate Script
  // =====================================================

  const getVideoScript = async (): Promise<VideoScriptProps[]> => {
    setCurrentStep("script");

    const prompt = `
Write a script for a ${formData.duration} video.

Topic:
${formData.topic}

Image Style:
${formData.imageStyle}

Requirements:

1. Divide the video into multiple scenes.
2. Each scene must contain narration text.
3. Each scene must contain an AI image generation prompt.
4. The image prompt should match the selected image style.
5. Return ONLY valid JSON.
6. Do not include markdown.
7. Do not include code fences.

Return this exact structure:

[
  {
    "imagePrompt": "Detailed visual prompt",
    "ContentText": "Narration for this scene"
  }
]
`;

    const response = await axios.post<{
      result: VideoScriptProps[];
    }>("/api/get-video-script", {
      prompt,
    });

    const result = response.data.result;

    if (!Array.isArray(result) || result.length === 0) {
      throw new Error("No video scenes were generated.");
    }

    setVideoScript(result);

    setVideoDate((prev) => ({
      ...prev,
      videoScript: result,
    }));

    return result;
  };

  // =====================================================
  // Step 2: Generate Audio
  // =====================================================

  const generateAudioFile = async (
    scriptData: VideoScriptProps[],
  ): Promise<string> => {
    setCurrentStep("audio");

    const script = scriptData.map((scene) => scene.ContentText).join(" ");

    if (!script.trim()) {
      throw new Error("No narration text available for audio generation.");
    }

    const id = uuidv4();

    const response = await axios.post<{
      audioUrl: string;
    }>("/api/generate-audio", {
      text: script,
      id,
    });

    const generatedAudioUrl = response.data.audioUrl;

    if (!generatedAudioUrl) {
      throw new Error("Audio generation failed.");
    }

    setAudioUrl(generatedAudioUrl);

    setVideoDate((prev) => ({
      ...prev,
      audioUrl: generatedAudioUrl,
    }));

    return generatedAudioUrl;
  };

  // =====================================================
  // Step 3: Generate Captions
  // =====================================================

  const generateCaption = async (
    generatedAudioUrl: string,
  ): Promise<Caption[]> => {
    setCurrentStep("caption");

    const response = await axios.post<{
      result: Caption[];
    }>("/api/generate-caption", {
      audioUrl: generatedAudioUrl,
    });

    const generatedCaptions = response.data.result;

    if (!Array.isArray(generatedCaptions) || generatedCaptions.length === 0) {
      throw new Error("Caption generation failed.");
    }

    setCaptions(generatedCaptions);

    setVideoDate((prev) => ({
      ...prev,
      caption: generatedCaptions,
    }));

    return generatedCaptions;
  };

  // =====================================================
  // Step 4: Generate Images
  // =====================================================

  const generateImages = async (
    scriptData: VideoScriptProps[],
  ): Promise<GeneratedImage[]> => {
    setCurrentStep("images");

    const generatedImages: GeneratedImage[] = [];

    for (let i = 0; i < scriptData.length; i++) {
      const scene = scriptData[i];

      const id = uuidv4();

      console.log(`Generating image ${i + 1}/${scriptData.length}`);

      const response = await axios.post<{
        imageUrl: string;
      }>("/api/generate-image", {
        prompt: scene.imagePrompt,
        id,
      });

      const imageUrl = response.data.imageUrl;

      if (!imageUrl) {
        throw new Error(`Image generation failed for scene ${i + 1}.`);
      }

      const imageData: GeneratedImage = {
        imageUrl,
        imagePrompt: scene.imagePrompt,
        ContentText: scene.ContentText,
      };

      generatedImages.push(imageData);

      // Update UI progressively
      setImages([...generatedImages]);

      setVideoDate((prev) => ({
        ...prev,
        images: [...generatedImages],
      }));
    }

    return generatedImages;
  };

  // =====================================================
  // Step 5: Generate Final Video
  // =====================================================

  const generateVideo = async (
    generatedImages: GeneratedImage[],
    generatedAudioUrl: string,
    generatedCaptions: Caption[],
  ): Promise<string> => {
    setCurrentStep("video");

    if (generatedImages.length === 0) {
      throw new Error("No images available for video generation.");
    }

    if (!generatedAudioUrl) {
      throw new Error("No audio available for video generation.");
    }

    if (generatedCaptions.length === 0) {
      throw new Error("No captions available for video generation.");
    }

    console.log("Sending assets to video generator...");

    const response = await axios.post(
      "/api/generate-video",
      {
        images: generatedImages,
        audioUrl: generatedAudioUrl,
        captions: generatedCaptions,
      },
      {
        responseType: "blob",
      },
    );

    if (!response.data || response.data.size === 0) {
      throw new Error("Video generation returned an empty file.");
    }

    const videoBlob = new Blob([response.data], {
      type: "video/mp4",
    });

    const generatedVideoUrl = URL.createObjectURL(videoBlob);

    setVideoUrl(generatedVideoUrl);

    return generatedVideoUrl;
  };

  // =====================================================
  // Main Video Generation Pipeline
  // =====================================================

  const generateHandler = async (): Promise<void> => {
    try {
      // ----------------------------------------------
      // Reset previous state
      // ----------------------------------------------

      setLoading(true);
      setErrorMessage("");
      setVideoUrl("");

      setVideoScript([]);
      setAudioUrl("");
      setCaptions([]);
      setImages([]);

      // ----------------------------------------------
      // Validate form
      // ----------------------------------------------

      if (!formData.topic) {
        throw new Error("Please select a video topic.");
      }

      if (!formData.imageStyle) {
        throw new Error("Please select an image style.");
      }

      if (!formData.duration) {
        throw new Error("Please select a video duration.");
      }

      console.log("================================");

      console.log("STARTING VIDEO GENERATION");

      console.log("================================");

      // ----------------------------------------------
      // 1. Generate Script
      // ----------------------------------------------

      const script = await getVideoScript();

      console.log("✓ Script generated");

      // ----------------------------------------------
      // 2. Generate Audio
      // ----------------------------------------------

      const generatedAudioUrl = await generateAudioFile(script);

      console.log("✓ Audio generated");

      // ----------------------------------------------
      // 3. Generate Captions
      // ----------------------------------------------

      const generatedCaptions = await generateCaption(generatedAudioUrl);

      console.log("✓ Captions generated");

      // ----------------------------------------------
      // 4. Generate Images
      // ----------------------------------------------

      const generatedImages = await generateImages(script);

      console.log("✓ Images generated");

      // ----------------------------------------------
      // 5. Generate Final Video
      // ----------------------------------------------

      const generatedVideoUrl = await generateVideo(
        generatedImages,
        generatedAudioUrl,
        generatedCaptions,
      );

      console.log("✓ Final video generated");

      // ----------------------------------------------
      // Store final video
      // ----------------------------------------------

      setVideoDate((prev) => ({
        ...prev,
        videoUrl: generatedVideoUrl,
      }));

      setCurrentStep("completed");

      console.log("================================");

      console.log("VIDEO GENERATION COMPLETED");

      console.log("================================");
    } catch (error) {
      console.error("Video generation failed:", error);

      setCurrentStep("error");

      let message = "Something went wrong while generating the video.";

      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<{
          error?: string;
        }>;

        message =
          axiosError.response?.data?.error || axiosError.message || message;
      } else if (error instanceof Error) {
        message = error.message;
      }

      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // Status Helpers
  // =====================================================

  const getStepLabel = (): string => {
    switch (currentStep) {
      case "script":
        return "Generating your video script...";

      case "audio":
        return "Generating voice narration...";

      case "caption":
        return "Generating captions...";

      case "images":
        return "Generating scene images...";

      case "video":
        return "Creating your final video with FFmpeg...";

      case "completed":
        return "Video generated successfully!";

      case "error":
        return "Video generation failed.";

      default:
        return "";
    }
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="min-h-screen p-6 md:p-10 lg:px-20">
      {/* ============================================= */}
      {/* Header */}
      {/* ============================================= */}

      <div className="max-w-5xl mx-auto">
        <div className="text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-purple-500">
            Create New
          </h2>

          <p className="text-gray-400 mt-3">
            Turn your idea into an AI-generated short video.
          </p>
        </div>

        {/* =========================================== */}
        {/* Form */}
        {/* =========================================== */}

        <div className="mt-10 space-y-6 ring-1 ring-gray-700 shadow-xl p-6 md:p-10 rounded-2xl bg-zinc-800">
          <SelectTopic onUserSelect={onHandleInputChange} />

          <SelectStyle onUserSelect={onHandleInputChange} />

          <SelectDuration onUserSelect={onHandleInputChange} />

          {/* Generate Button */}

          <Button
            onClick={generateHandler}
            disabled={loading}
            className="px-4 py-6 bg-purple-500 w-full hover:bg-purple-600 text-black font-semibold text-base"
          >
            {loading ? "Generating Video..." : "Create Short Video"}
          </Button>
        </div>

        {/* =========================================== */}
        {/* Generation Progress */}
        {/* =========================================== */}

        {loading && (
          <>
            {/* Background overlay */}
            <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" />

            {/* Generation Progress Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="w-full max-w-2xl rounded-2xl border border-zinc-700 bg-zinc-900 shadow-2xl">
                {/* Header */}
                <div className="border-b border-zinc-700 p-6">
                  <div className="flex items-center gap-4">
                    <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/15">
                      <div className="absolute inset-0 animate-ping rounded-full bg-purple-500/20" />

                      <div className="relative h-3 w-3 rounded-full bg-purple-500" />
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        Creating Your Video
                      </h3>

                      <p className="mt-1 text-sm text-gray-400">
                        {getStepLabel()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Steps */}
                <div className="p-6">
                  <div className="space-y-4">
                    {[
                      {
                        key: "script",
                        label: "Generate Script",
                        description: "Creating scenes and narration",
                      },
                      {
                        key: "audio",
                        label: "Generate Audio",
                        description: "Creating voice narration",
                      },
                      {
                        key: "caption",
                        label: "Generate Captions",
                        description: "Synchronizing captions",
                      },
                      {
                        key: "images",
                        label: "Generate Images",
                        description: "Creating scene visuals",
                      },
                      {
                        key: "video",
                        label: "Create Final Video",
                        description: "Combining everything with FFmpeg",
                      },
                    ].map((step, index) => {
                      const steps = [
                        "script",
                        "audio",
                        "caption",
                        "images",
                        "video",
                      ];

                      const currentIndex = steps.indexOf(currentStep);

                      const stepIndex = index;

                      const isActive = currentStep === step.key;

                      const isCompleted =
                        currentIndex > stepIndex || currentStep === "completed";

                      return (
                        <div
                          key={step.key}
                          className={`
                    flex items-center gap-4 rounded-xl border p-4
                    transition-all duration-300
                    ${
                      isActive
                        ? "border-purple-500 bg-purple-500/10"
                        : isCompleted
                          ? "border-green-500/30 bg-green-500/5"
                          : "border-zinc-800 bg-zinc-800/50"
                    }
                  `}
                        >
                          {/* Step Icon */}
                          <div
                            className={`
                      flex h-10 w-10 shrink-0 items-center justify-center
                      rounded-full text-sm font-bold
                      ${
                        isCompleted
                          ? "bg-green-500 text-black"
                          : isActive
                            ? "bg-purple-500 text-black"
                            : "bg-zinc-700 text-gray-500"
                      }
                    `}
                          >
                            {isCompleted ? (
                              "✓"
                            ) : isActive ? (
                              <div className="h-3 w-3 animate-pulse rounded-full bg-black" />
                            ) : (
                              index + 1
                            )}
                          </div>

                          {/* Step Content */}
                          <div className="flex-1">
                            <p
                              className={`
                        font-medium
                        ${
                          isActive
                            ? "text-purple-400"
                            : isCompleted
                              ? "text-green-400"
                              : "text-gray-500"
                        }
                      `}
                            >
                              {step.label}
                            </p>

                            <p className="mt-1 text-xs text-gray-500">
                              {step.description}
                            </p>
                          </div>

                          {/* Status */}
                          {isActive && (
                            <div className="flex items-center gap-1">
                              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-purple-500" />
                              <span
                                className="h-1.5 w-1.5 animate-bounce rounded-full bg-purple-500"
                                style={{ animationDelay: "150ms" }}
                              />
                              <span
                                className="h-1.5 w-1.5 animate-bounce rounded-full bg-purple-500"
                                style={{ animationDelay: "300ms" }}
                              />
                            </div>
                          )}

                          {isCompleted && (
                            <span className="text-xs font-medium text-green-400">
                              Done
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Bottom message */}
                  <div className="mt-6 rounded-lg bg-zinc-800/70 p-4 text-center">
                    <p className="text-sm text-gray-400">
                      Please wait while AI creates your video.
                    </p>

                    <p className="mt-1 text-xs text-gray-600">
                      This may take a few minutes depending on the video length.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* =========================================== */}
        {/* Error */}
        {/* =========================================== */}

        {errorMessage && (
          <div className="mt-6 p-5 rounded-xl bg-red-950/40 border border-red-800">
            <p className="text-red-400 font-semibold">
              Video generation failed
            </p>

            <p className="text-red-300 text-sm mt-2">{errorMessage}</p>

            <Button
              onClick={generateHandler}
              className="mt-4 bg-red-600 hover:bg-red-700"
            >
              Try Again
            </Button>
          </div>
        )}

        {/* =========================================== */}
        {/* Success */}
        {/* =========================================== */}

        {currentStep === "completed" && videoUrl && (
          <div className="mt-8 p-5 rounded-xl bg-green-950/30 border border-green-800">
            <p className="text-green-400 font-semibold">
              Your video is ready 🎉
            </p>

            <p className="text-gray-400 text-sm mt-1">
              Your script, images, narration, captions and video have been
              generated successfully.
            </p>
          </div>
        )}

        {/* =========================================== */}
        {/* Final Video */}
        {/* =========================================== */}

        {videoUrl && (
          <div className="mt-8 rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-700">
            <div className="p-5 border-b border-zinc-700">
              <h3 className="text-xl font-semibold text-white">Final Video</h3>

              <p className="text-gray-400 text-sm mt-1">
                Generated with your images, narration and captions.
              </p>
            </div>

            <div className="p-5">
              <video controls src={videoUrl} className="w-full rounded-xl" />

              <a
                href={videoUrl}
                download="generated-video.mp4"
                className="mt-4 inline-flex w-full items-center justify-center rounded-lg bg-purple-500 hover:bg-purple-600 text-black font-semibold py-3"
              >
                Download Video
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateNew;
