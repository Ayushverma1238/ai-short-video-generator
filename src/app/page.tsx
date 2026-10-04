"use client";

import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { UserButton } from "@clerk/nextjs";
import { InfoIcon } from "lucide-react";
import { useState } from "react";

export default function Home() {
  const [isbuttonClick, setIsbuttonClick] = useState(false);
  return (
    <div className="flex bg-gray-600 min-h-screen flex-col gap-10 items-center p-24">
      <h1 className="text-2xl font-bold">Welcome to Next.js!</h1>
      <Button variant="outline" className="bg-gray-800 text-white m-10 hover:bg-gray-600">
        Click me
      </Button>

      <button className='bg-gray-900 text-white hover:bg-gray-700 px-4 py-2 rounded' onClick={() => setIsbuttonClick(!isbuttonClick)}>
        Normal Button
      </button>
      {isbuttonClick && (
        <Alert>
          <InfoIcon />
          <AlertTitle>Heads up!</AlertTitle>
          <AlertDescription>
            You can add components and dependencies to your app using the cli.
          </AlertDescription>
          <AlertAction>
            <Button variant="outline">Enable</Button>
          </AlertAction>
        </Alert>
      )}
      <UserButton />
    </div>
  );
}
