"use client";

import React, { useState } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";


interface UserSelectProps {
  onUserSelect: (field: string, value: string) => void;
}

const SelectTopic = ({ onUserSelect }: UserSelectProps) => {
  const options = [
    "Custom Prompt",
    "Random AI Story",
    "Scary Story",
    "Historical Facts",
    "Bed Time Story",
    "Motivational",
    "Fun Fact",
  ];
  const [selectedType, setSelectedType] = useState("");
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-zinc-100">Content</h2>
      <p className="text-zinc-300">What is the topic of your short video?</p>

      <Select
        value={selectedType}
        onValueChange={(value) =>{ setSelectedType(value || "")
            value !== "Custom Prompt" && onUserSelect("topic", value || "")}
        }
      >
        <SelectTrigger className="w-full mt-2 p-6 py-4 text-lg">
          <SelectValue placeholder="Content Type" />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedType === "Custom Prompt" && (
        <Textarea
          className="w-full mt-2 p-6 text-lg"
          onChange={(e) => onUserSelect("topic", e.target.value)}
          placeholder="Write prompt on which you want the AI to generate content..."
        />
      )}
    </div>
  );
};

export default SelectTopic;
