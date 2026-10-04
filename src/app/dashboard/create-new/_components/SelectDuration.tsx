"use client";

import React, { useState } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface UserSelectProps {
  onUserSelect: (field: string, value: string) => void;
}

const SelectTopic = ({ onUserSelect }: UserSelectProps) => {
  const [selectedType, setSelectedType] = useState("");
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-zinc-100">Duration</h2>
      <p className="text-zinc-300">How long should your short video be?</p>

      <Select
        value={selectedType}
        onValueChange={(value) => {
          setSelectedType(value || "");
          onUserSelect("duration", value || "");
        }}
      >
        <SelectTrigger className="w-full mt-2 p-6 py-4 text-lg">
          <SelectValue placeholder="Select Duration" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="15 seconds">15 Seconds</SelectItem>
          <SelectItem value="30 seconds">30 Seconds</SelectItem>
          <SelectItem value="60 seconds">60 Seconds</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default SelectTopic;
