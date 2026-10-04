"use client";

import React from "react";
import {
  Check,
  Sparkles,
  MessageSquare,
  Coins,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const UpgradeSection = () => {
  return (
    <section className="w-full px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold tracking-tight text-white">
            Upgrade Your Credits
          </h2>

          <p className="mt-2 text-sm text-zinc-400">
            Choose a credit plan that works for you.
          </p>
        </div>

        {/* Plans */}
        <div className="grid w-full gap-6 lg:grid-cols-2">

          {/* ================= STARTER ================= */}
          <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-[#0d0d0f] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-zinc-700 hover:shadow-2xl hover:shadow-black/30">

            {/* Glow */}
            <div className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />

            {/* Badge */}
            <div className="relative mb-5 inline-flex w-fit items-center gap-2 ring-1 text-white rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium">
              <Sparkles className="h-3.5 w-3.5 " />
              Popular
            </div>

            <h3 className="relative text-xl font-semibold text-white">
              Starter
            </h3>

            <p className="relative mt-2 text-sm leading-6 text-zinc-400">
              Perfect for creating AI videos regularly.
            </p>

            {/* Price */}
            <div className="relative mt-7 flex items-end gap-2">
              <span className="text-4xl font-bold tracking-tight text-white">
                $10
              </span>

              <span className="mb-1 text-sm text-zinc-500">
                one-time
              </span>
            </div>

            {/* Credits */}
            <div className="relative mt-6 flex items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <Coins className="h-5 w-5 text-primary" />
              </div>

              <div>
                <p className="text-2xl font-bold text-white">
                  1,000
                </p>

                <p className="text-xs text-zinc-500">
                  AI Video Credits
                </p>
              </div>
            </div>

            {/* Features */}
            <div className="relative mt-7 space-y-3">
              <div className="flex items-center gap-3 text-sm text-zinc-300">
                <Check className="h-4 w-4 shrink-0 text-gray-400" />
                1,000 generation credits
              </div>

              <div className="flex items-center gap-3 text-sm text-zinc-300">
                <Check className="h-4 w-4 shrink-0 text-gray-400" />
                Credits never expire
              </div>

              <div className="flex items-center gap-3 text-sm text-zinc-300">
                <Check className="h-4 w-4 shrink-0 text-gray-400" />
                Generate AI videos
              </div>
            </div>

            {/* Button */}
            <Button className="relative mt-8 h-11 w-full">
              Buy 1,000 Credits
            </Button>
          </div>

          {/* ================= CUSTOM ================= */}
          <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-[#0d0d0f] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-zinc-700 hover:shadow-2xl hover:shadow-black/30">

            {/* Badge */}
            <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-xs font-medium text-zinc-300">
              <MessageSquare className="h-3.5 w-3.5" />
              Custom
            </div>

            <h3 className="text-xl font-semibold text-white">
              Custom Request
            </h3>

            <p className="mt-2 text-sm leading-6 text-zinc-400">
              Need more credits or a custom solution?
            </p>

            {/* Price */}
            <div className="mt-7">
              <span className="text-4xl font-bold tracking-tight text-white">
                Custom
              </span>

              <p className="mt-2 text-sm text-zinc-500">
                Pricing based on your requirements
              </p>
            </div>

            {/* Custom Credits */}
            <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
              <p className="text-sm text-zinc-500">
                Credits
              </p>

              <p className="mt-1 text-2xl font-bold text-white">
                Custom Amount
              </p>

              <p className="mt-1 text-xs text-zinc-500">
                Choose the amount that fits your needs
              </p>
            </div>

            {/* Features */}
            <div className="mt-7 space-y-3">
              <div className="flex items-center gap-3 text-sm text-zinc-300">
                <Check className="h-4 w-4 shrink-0 text-gray-400" />
                Custom credit amount
              </div>

              <div className="flex items-center gap-3 text-sm text-zinc-300">
                <Check className="h-4 w-4 shrink-0 text-gray-400" />
                Custom pricing
              </div>

              <div className="flex items-center gap-3 text-sm text-zinc-300">
                <Check className="h-4 w-4 shrink-0 text-gray-400" />
                Priority support
              </div>
            </div>

            {/* Button */}
            <Button
              variant="outline"
              className="mt-8 h-11 w-full gap-2 border-zinc-700 bg-transparent text-zinc-200 hover:bg-zinc-800 hover:text-white"
            >
              <MessageSquare className="h-4 w-4" />
              Request Custom Plan
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default UpgradeSection;