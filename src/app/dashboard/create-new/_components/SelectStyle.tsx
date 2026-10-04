"use client";

import Image from "next/image";
import React, { useState } from "react";

interface UserSelectProps {
  onUserSelect: (field: string, value: string) => void;
}
const SelectStyle = ({ onUserSelect }: UserSelectProps) => {
  const styleOptions = [
    {
      name: "Realistic",
      image: "/styles/real.jpg",
    },
    {
      name: "Cartoon",
      image: "/styles/cartoon.jfif",
    },
    {
      name: "Comic",
      image: "/styles/comic.jfif",
    },
    {
      name: "WaterColor",
      image: "/styles/watercolor.jfif",
    },
    {
      name: "GTA",
      image: "/styles/gta.jfif",
    },
  ];
  const [selectedOption, setSelectedOption] = useState("");
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-zinc-100">Style</h2>
      <p className="text-zinc-300">Select a style for your video</p>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 xl:grid-cols-5">
        {styleOptions.map((option) => (
          <div
            key={option.name}
            className={` ${selectedOption === option.name ? "ring-2 ring-zinc-150 scale-105" : ""} flex flex-col items-center rounded-md hover:scale-106 transition-all gap-2 relative cursor-pointer`}
          >
            <Image
              src={option.image}
              alt={option.name}
              width={100}
              height={100}
              className="w-full h-50 object-cover rounded-md"
              onClick={() => {
                setSelectedOption(option.name as string);
                onUserSelect("imageStyle", option.name as string);
              }}
            />
            <span className="text-zinc-100 w-full bg-black/90 px-2 py-1 rounded-b-md absolute bottom-0">
              {option.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SelectStyle;
