import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * NoticeBar — animated marquee announcing the active store notice.
 * - Single-track (no duplicated spans hack).
 * - Pause-on-hover for readability.
 * - Respects prefers-reduced-motion.
 * - Gold gradient strip with a brand divider (✦) between repeats.
 */
export function NoticeBar() {
  const [paused, setPaused] = useState(false);

  const { data: notice } = useQuery({
    queryKey: ["notice"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notice_settings")
        .select("*")
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  if (!notice?.text) return null;

  // The track is two copies of the content side-by-side; the keyframe
  // animates from translateX(0) to translateX(-50%) so the second copy
  // arrives at the position of the first, looping seamlessly.
  const segment = (
    <div className="flex items-center shrink-0 px-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <span key={i} className="flex items-center">
          <span className="mx-6 text-sm font-medium tracking-wide whitespace-nowrap">
            {notice.text}
          </span>
          <span aria-hidden className="text-gold-foreground/70 text-sm">✦</span>
        </span>
      ))}
    </div>
  );

  return (
    <div
      role="status"
      aria-label="Store announcement"
      className="relative bg-gradient-gold-strong text-gold-foreground py-2 overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {/* Edge fades for premium feel */}
      <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-gold to-transparent" />
      <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-gold to-transparent" />

      <div
        className={`flex w-max animate-marquee ${paused ? "marquee-paused" : ""}`}
        style={{ ["--marquee-duration" as string]: "45s" }}
      >
        {segment}
        {segment}
      </div>
    </div>
  );
}
