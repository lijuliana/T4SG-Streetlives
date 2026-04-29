"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useStore, REFERRAL_CATEGORIES, profileToNavigator } from "@/lib/store";
import type { NavigatorProfile, ReferralCategory } from "@/lib/store";
import { cn } from "@/lib/utils";

const COMMON_LANGUAGES = [
  "English", "Spanish", "Mandarin", "Cantonese", "Russian",
  "French", "Haitian Creole", "Bengali", "Arabic", "Korean",
  "Polish", "Urdu", "Italian", "Vietnamese", "Tagalog",
];

const DAYS_OF_WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const NAV_GROUPS: { value: string; label: string }[] = [
  { value: "CUNY_PIN", label: "CUNY PIN" },
  { value: "HOUSING_WORKS", label: "Housing Works" },
  { value: "DYCD", label: "DYCD" },
];

interface FormValues {
  name: string;
  nav_group: string;
  capacity: number;
  availability_start: string;
  availability_end: string;
}

interface Props {
  initialProfile: NavigatorProfile | null;
  auth0UserId: string;
}

export default function NavigatorProfileForm({ initialProfile, auth0UserId }: Props) {
  const router = useRouter();
  const setOwnProfile = useStore((s) => s.setOwnProfile);
  const setNavigators = useStore((s) => s.setNavigators);
  const navigators = useStore((s) => s.navigators);

  const [languages, setLanguages] = useState<string[]>(
    initialProfile?.languages ?? []
  );
  const [specialties, setSpecialties] = useState<ReferralCategory[]>(
    initialProfile?.specialties ?? []
  );
  const [availabilityDays, setAvailabilityDays] = useState<string[]>(
    initialProfile?.availability_days ?? []
  );
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      name: initialProfile?.name ?? "",
      nav_group: initialProfile?.nav_group ?? "",
      capacity: initialProfile?.capacity ?? 5,
      availability_start: initialProfile?.availability_start ?? "09:00",
      availability_end: initialProfile?.availability_end ?? "17:00",
    },
  });

  const toggleLanguage = (lang: string) =>
    setLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    );

  const toggleSpecialty = (cat: ReferralCategory) =>
    setSpecialties((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );

  const toggleDay = (day: string) =>
    setAvailabilityDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );

  const onSubmit = async (data: FormValues) => {
    if (languages.length === 0) {
      toast.error("Select at least one language");
      return;
    }
    if (specialties.length === 0) {
      toast.error("Select at least one area of expertise");
      return;
    }

    const payload = {
      ...data,
      auth0_user_id: initialProfile?.auth0_user_id ?? auth0UserId,
      languages,
      specialties,
      status: "available",
      availability_days: availabilityDays,
    };
    setSubmitting(true);

    try {
      const res = await fetch("/api/navigators/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { message?: string; error?: string };
        throw new Error(err.message ?? err.error ?? `Request failed (${res.status})`);
      }

      const profile: NavigatorProfile = await res.json();
      setOwnProfile(profile);

      const nav = profileToNavigator(profile);
      setNavigators(
        initialProfile
          ? navigators.map((n) => (n.id === nav.id ? nav : n))
          : [...navigators.filter((n) => n.id !== nav.id), nav]
      );

      toast.success("Profile saved");
      router.push("/dashboard/navigator");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-lg">
      {/* Display name */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Display name
        </label>
        <input
          {...register("name", { required: "Name is required" })}
          placeholder="Your full name"
          className="w-full text-sm border border-gray-200 rounded-md px-3 py-2.5 outline-none focus:ring-2 focus:ring-brand-yellow placeholder-gray-400"
        />
        {errors.name && (
          <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
        )}
      </div>

      {/* Languages */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">
          Languages{" "}
          <span className="text-gray-400 font-normal">(select all you speak)</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {COMMON_LANGUAGES.map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => toggleLanguage(lang)}
              className={cn(
                "text-xs px-3 py-1.5 rounded-full border transition",
                languages.includes(lang)
                  ? "bg-brand-yellow border-brand-yellow text-gray-900 font-medium"
                  : "border-gray-200 text-gray-600 hover:border-gray-300"
              )}
            >
              {lang}
            </button>
          ))}
        </div>
      </div>

      {/* Specialties */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">
          Areas of expertise{" "}
          <span className="text-gray-400 font-normal">(used for routing)</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {REFERRAL_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => toggleSpecialty(cat)}
              className={cn(
                "text-xs px-3 py-1.5 rounded-full border transition",
                specialties.includes(cat)
                  ? "bg-brand-yellow border-brand-yellow text-gray-900 font-medium"
                  : "border-gray-200 text-gray-600 hover:border-gray-300"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Nav group */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Navigator group
        </label>
        <select
          {...register("nav_group", { required: "Group is required" })}
          className="w-full text-sm border border-gray-200 rounded-md px-3 py-2.5 outline-none focus:ring-2 focus:ring-brand-yellow bg-white"
        >
          <option value="">Select a group…</option>
          {NAV_GROUPS.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        {errors.nav_group && (
          <p className="mt-1 text-xs text-red-500">{errors.nav_group.message}</p>
        )}
      </div>

      {/* Capacity */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Max concurrent sessions
        </label>
        <input
          type="number"
          min={1}
          max={20}
          {...register("capacity", {
            required: true,
            valueAsNumber: true,
            min: 1,
            max: 20,
          })}
          className="w-full text-sm border border-gray-200 rounded-md px-3 py-2.5 outline-none focus:ring-2 focus:ring-brand-yellow"
        />
      </div>

      {/* Availability — days + hours */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">
          Availability
        </label>
        <div className="flex flex-wrap gap-2 mb-3">
          {DAYS_OF_WEEK.map((day) => (
            <button
              key={day}
              type="button"
              onClick={() => toggleDay(day)}
              className={cn(
                "text-xs px-3 py-1.5 rounded-full border transition",
                availabilityDays.includes(day)
                  ? "bg-brand-yellow border-brand-yellow text-gray-900 font-medium"
                  : "border-gray-200 text-gray-600 hover:border-gray-300"
              )}
            >
              {day}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">From</label>
            <input
              type="time"
              {...register("availability_start")}
              className="w-full text-sm border border-gray-200 rounded-md px-3 py-2.5 outline-none focus:ring-2 focus:ring-brand-yellow"
            />
          </div>
          <span className="text-gray-400 text-sm mt-5">–</span>
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">To</label>
            <input
              type="time"
              {...register("availability_end")}
              className="w-full text-sm border border-gray-200 rounded-md px-3 py-2.5 outline-none focus:ring-2 focus:ring-brand-yellow"
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-brand-yellow text-gray-900 font-medium text-sm py-3 rounded-md hover:brightness-95 transition disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {submitting
          ? "Saving…"
          : initialProfile
          ? "Save changes"
          : "Create profile"}
      </button>
    </form>
  );
}
