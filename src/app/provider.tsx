"use client";

import { useUser } from "@clerk/nextjs";
import React, { useEffect } from "react";

const Provider = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoaded } = useUser();

  useEffect(() => {

    if (!isLoaded) {
      console.log("Clerk is still loading");
      return;
    }

    if (!user) {
      console.log("No Clerk user");
      return;
    }

    const createUser = async () => {
      try {
        const response = await fetch("/api/users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: user.fullName,
            email: user.primaryEmailAddress?.emailAddress,
            imageUrl: user.imageUrl,
          }),
        });

        const data = await response.json();

      } catch (error) {
        console.error("Create user error:", error);
      }
    };

    createUser();
  }, [isLoaded, user]);

  return <>{children}</>;
};

export default Provider;