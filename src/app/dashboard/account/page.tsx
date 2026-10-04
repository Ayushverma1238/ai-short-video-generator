"use client";

import React from "react";
import {
  User,
  Mail,
  Coins,
  Pencil,
  Sparkles,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const AccountPage = () => {
  // You can later get these values from your database/auth context
  const user = {
    name: "Ayush Verma",
    email: "ayush@example.com",
  };

  const totalCredits = 150;
  const usedCredits = 30;
  const availableCredits = totalCredits - usedCredits;

  const creditPercentage = (availableCredits / totalCredits) * 100;

  return (
    <div className="min-h-screen bg-gray-800 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            Account
          </h1>

          <p className="mt-2 text-sm text-gray-400">
            Manage your profile and credits
          </p>
        </div>

        {/* Profile Card */}
        <div className="rounded-2xl border  bg-zinc-800 p-6 shadow-sm sm:p-8">
          
          {/* Card Header */}
          <div className="mb-8">
            <h2 className="text-xl text-gray-50 font-semibold">
              Profile Details
            </h2>

            <p className="mt-1 text-sm text-gray-400">
              Your personal account information
            </p>
          </div>

          {/* User */}
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">

            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-primary ring-1 text-lg font-semibold text-primary-foreground">
                  AV
                </AvatarFallback>
              </Avatar>

              <div>
                <h3 className="text-lg font-semibold">
                  {user.name}
                </h3>

                <p className="flex items-center gap-1.5 text-sm text-gray-400">
                  <Mail className="h-4 w-4" />
                  {user.email}
                </p>
              </div>
            </div>

            <Button variant="outline" className="gap-2 bg-gray-700 text-white">
              <Pencil className="h-4 w-4" />
              Edit Profile
            </Button>
          </div>

          {/* Details */}
          <div className="mt-8 grid gap-5 sm:grid-cols-2">

            <div className="rounded-xl border bg-muted/30 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm text-gray-300">
                <User className="h-4 w-4" />
                Full Name
              </div>

              <p className="font-medium text-gray-100">
                {user.name}
              </p>
            </div>

            <div className="rounded-xl border bg-muted/30 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm text-gray-300">
                <Mail className="h-4 w-4" />
                Email Address
              </div>

              <p className="font-medium break-all text-gray-100">
                {user.email}
              </p>
            </div>

          </div>
        </div>

        {/* Credits Card */}
        <div className="mt-6 rounded-2xl border bg-zinc-800 p-6 shadow-sm sm:p-8">

          {/* Header */}
          <div className="mb-8 flex items-start justify-between gap-4">

            <div>
              <h2 className="text-xl font-semibold text-gray-50">
                Credits
              </h2>

              <p className="mt-1 text-sm text-gray-400">
                Use credits to generate AI videos
              </p>
            </div>

            <div className="flex h-11 w-11 items-center ring-1 justify-center rounded-xl bg-primary/10">
              <Sparkles className="h-5 w-5 text-white" />
            </div>

          </div>

          {/* Credit Count */}
          <div className="rounded-2xl border bg-gray-800 text-white p-6">

            <div className="flex items-center justify-between">

              <div>
                <p className="flex items-center gap-2 text-sm text-gray-400">
                  <Coins className="h-4 w-4" />
                  Available Credits
                </p>

                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-4xl font-bold tracking-tight">
                    {availableCredits}
                  </span>

                  <span className="text-sm text-gray-400">
                    credits
                  </span>
                </div>
              </div>

              <div className="text-right">
                <p className="text-sm text-gray-400">
                  Total
                </p>

                <p className="font-semibold">
                  {totalCredits}
                </p>
              </div>

            </div>

            {/* Progress */}
            <div className="mt-6">
              <div className="mb-2 flex justify-between text-xs text-gray-400">
                <span>
                  {availableCredits} remaining
                </span>

                <span>
                  {usedCredits} used
                </span>
              </div>

              <Progress
                value={creditPercentage}
                className="h-2"
              />
            </div>

          </div>

          {/* Buy Credits */}
          <div className="mt-6 flex flex-col gap-4 rounded-xl border border-primary/20 bg-primary/5 p-5 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <h3 className="font-semibold">
                Need more credits?
              </h3>

              <p className="mt-1 text-sm text-gray-400">
                Purchase additional credits and keep creating.
              </p>
            </div>

            <Button className="gap-2">
              <CreditCard className="h-4 w-4" />
              Get More Credits
            </Button>

          </div>

        </div>

      </div>
    </div>
  );
};

export default AccountPage;