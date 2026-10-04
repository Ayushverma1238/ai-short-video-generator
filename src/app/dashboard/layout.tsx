// "use client"
import { auth } from "@clerk/nextjs/server";
import React from "react";
import Header from "./_components/Header";
import Sidebar from "./_components/Sidebar";
import { VideoDataProvider } from "../_context/VideoDataContex";


const DashboardLayout = async ({ children }: { children: React.ReactNode }) => {
  await auth.protect();
  // const [videoData, setVideoData] = useState<VideoData[]>([])
  return (
    <VideoDataProvider>

    <div className="bg-black/90 min-h-screen text-white">
      <div className="hidden md:block h-screen bg-gray-700 fixed mt-19.5 w-64">
        <Sidebar />
      </div>
      <div className="">
        <Header />
        <div className="md:ml-64">{children}</div>
      </div>
    </div>
    </VideoDataProvider>
  );
};

export default DashboardLayout;
