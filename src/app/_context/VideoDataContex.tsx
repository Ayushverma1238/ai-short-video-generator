"use client";

import React, {
  createContext,
  useState,
  ReactNode,
} from "react";

interface VideoScript {
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

interface VideoData {
  videoScript: VideoScript[];
  audioUrl: string;
  caption: Caption[];
  images: GeneratedImage[];
}

interface VideoDataContextType {
  videoData: VideoData;
  setVideoDate: React.Dispatch<
    React.SetStateAction<VideoData>
  >;
}

export const VideoDataContext =
  createContext<VideoDataContextType | undefined>(
    undefined
  );

interface VideoDataProviderProps {
  children: ReactNode;
}

export const VideoDataProvider = ({
  children,
}: VideoDataProviderProps) => {
  const [videoData, setVideoDate] = useState<VideoData>({
    videoScript: [],
    audioUrl: "",
    caption: [],
    images: [],
  });

  return (
    <VideoDataContext.Provider
      value={{
        videoData,
        setVideoDate,
      }}
    >
      {children}
    </VideoDataContext.Provider>
  );
};