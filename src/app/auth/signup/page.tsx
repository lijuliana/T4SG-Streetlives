"use client";

import { useForm } from "react-hook-form";
import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface FormValues {
  email: string;
  password: string;
}

export default function SignUpPage() {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>();

  const onSubmit = async () => {
    setIsLoading(true);
    toast.info("Authentication is not available in this demo.");
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-brand-yellow flex flex-col">
      {/* Header */}
      <div className="px-5 pt-12 pb-8">
        <h1 className="text-3xl font-black text-gray-900">Create account</h1>
        <p className="mt-1 text-sm text-gray-700">
          Join StreetLives to access services and community.
        </p>
      </div>

      {/* Form card */}
      <div className="flex-1 bg-white rounded-t-3xl px-5 pt-8 pb-10 shadow-inner">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-sm">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
              Email
            </label>
            <input
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Enter a valid email",
                },
              })}
              className={cn(
                "w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-yellow focus:border-transparent transition",
                errors.email ? "border-red-400" : "border-gray-300"
              )}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
              Password
            </label>
            <input
              type="password"
              autoComplete="new-password"
              placeholder="Min. 6 characters"
              {...register("password", {
                required: "Password is required",
                minLength: { value: 6, message: "At least 6 characters" },
              })}
              className={cn(
                "w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-yellow focus:border-transparent transition",
                errors.password ? "border-red-400" : "border-gray-300"
              )}
            />
            {errors.password && (
              <p className="mt-1 text-xs text-red-500">
                {errors.password.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-brand-yellow text-gray-900 font-bold py-3 rounded-xl hover:brightness-95 transition disabled:opacity-60 disabled:cursor-not-allowed mt-2"
          >
            {isLoading ? "Creating account…" : "Create Account"}
          </button>
        </form>

        <p className="mt-6 text-sm text-gray-500">
          Already have an account?{" "}
          <Link
            href="/auth/signin"
            className="font-semibold text-gray-900 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
