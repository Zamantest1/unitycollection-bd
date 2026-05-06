import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  DEFAULT_SPOTLIGHT,
  normaliseSpotlight,
  resolveSpotlightColors,
  SPOTLIGHT_SETTING_KEY,
  type SpotlightSettings,
} from "@/lib/editorialSpotlight";

/**
 * Slim editorial slot — single unified gradient band, no inner card.
 * Lives between Categories and Featured.
 *
 * All copy + colours are admin-controlled via the
 * `settings.editorial_spotlight` row. While the row is loading we
 * render the local DEFAULT_SPOTLIGHT to avoid a layout flash.
 */
export function EditorialSpotlight() {
  const { data } = useQuery<SpotlightSettings>({
    queryKey: ["editorial-spotlight"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("settings")
        .select("value")
        .eq("key", SPOTLIGHT_SETTING_KEY)
        .maybeSingle();
      if (error) throw error;
      return normaliseSpotlight(data?.value);
    },
    // Keeps the homepage snappy — admins rarely change this more than
    // once a season, but we still pick up edits on the next page nav.
    staleTime: 60_000,
  });

  const settings = data ?? DEFAULT_SPOTLIGHT;
  if (!settings.enabled) return null;

  const colors = resolveSpotlightColors(settings);
  const isInternal = (href: string) =>
    href.startsWith("/") && !href.startsWith("//");

  return (
    <section className="bg-background py-4 md:py-10">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.45 }}
          className="relative overflow-hidden rounded-2xl shadow-[0_20px_45px_-20px_rgba(0,0,0,0.45)] ring-1"
          style={{
            background: `linear-gradient(135deg, ${colors.bgFrom} 0%, ${colors.bgTo} 100%)`,
            color: colors.textColor,
            // Faint warm ring so the card pops away from off-white pages.
            boxShadow: `0 20px 45px -20px ${colors.bgTo}`,
            // Tailwind's `ring-1` needs a colour — feed it the highlight
            // at low opacity so each preset gets a matching edge glow.
            ["--tw-ring-color" as string]: `${colors.highlight}40`,
          }}
        >
          {/* Diagonal sheen — same shape as before, tinted to highlight. */}
          <div
            aria-hidden
            className="absolute inset-0 opacity-[0.07] pointer-events-none"
            style={{
              backgroundImage: `linear-gradient(120deg, transparent 60%, ${colors.highlight} 60%, ${colors.highlight} 60.6%, transparent 60.6%)`,
            }}
          />
          {/* Soft radial glow from the top-left, tinted to highlight. */}
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(circle at 12% 0%, ${colors.highlight}22 0%, transparent 45%)`,
            }}
          />
          <div className="relative flex flex-col md:flex-row items-center gap-3 md:gap-8 px-4 py-4 md:px-10 md:py-8">
            <div className="text-center md:text-left flex-1 min-w-0">
              <p
                className="inline-flex items-center gap-1.5 text-[9px] md:text-[11px] uppercase tracking-[0.25em] md:tracking-[0.3em] mb-1.5 md:mb-2"
                style={{ color: colors.eyebrow }}
              >
                <Sparkles className="h-2.5 w-2.5 md:h-3 md:w-3" />
                {settings.eyebrow}
              </p>
              <h3
                className="font-display text-[15px] md:text-2xl lg:text-3xl font-bold leading-snug md:leading-tight"
                style={{ color: colors.textColor }}
              >
                {settings.headlinePrefix}
                {settings.headlineHighlight && (
                  <>
                    {" "}
                    <span style={{ color: colors.highlight }}>
                      {settings.headlineHighlight}
                    </span>{" "}
                  </>
                )}
                {settings.headlineSuffix}
              </h3>
              <p
                className="text-[12px] md:text-[15px] mt-1.5 md:mt-3 max-w-xl mx-auto md:mx-0 leading-snug"
                style={{ color: `${colors.textColor}d9` }}
              >
                {settings.subtitle}
              </p>
            </div>

            <div className="shrink-0 flex flex-row gap-2 md:gap-3 justify-center md:justify-end mt-1 md:mt-0">
              <SpotlightCta
                href={settings.ctaPrimaryHref}
                label={settings.ctaPrimaryLabel}
                isInternal={isInternal(settings.ctaPrimaryHref)}
                primary
                colors={colors}
              />
              <SpotlightCta
                href={settings.ctaSecondaryHref}
                label={settings.ctaSecondaryLabel}
                isInternal={isInternal(settings.ctaSecondaryHref)}
                colors={colors}
              />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

interface CtaProps {
  href: string;
  label: string;
  isInternal: boolean;
  primary?: boolean;
  colors: ReturnType<typeof resolveSpotlightColors>;
}

const SpotlightCta = ({
  href,
  label,
  isInternal,
  primary,
  colors,
}: CtaProps) => {
  const className =
    "inline-flex items-center justify-center gap-1.5 rounded-full px-3.5 md:px-5 py-2 md:py-2.5 text-[12px] md:text-sm font-semibold transition-colors whitespace-nowrap";

  const style = primary
    ? {
        background: colors.ctaPrimaryBg,
        color: colors.ctaPrimaryFg,
        boxShadow: `0 6px 18px -8px ${colors.ctaPrimaryBg}`,
      }
    : {
        border: `1px solid ${colors.highlight}99`,
        color: colors.textColor,
      };

  const inner = (
    <span className={className} style={style}>
      {label}
      {primary && <ArrowRight className="h-3.5 w-3.5 md:h-4 md:w-4" />}
    </span>
  );

  return isInternal ? (
    <Link to={href} className="flex-none">
      {inner}
    </Link>
  ) : (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="flex-none"
    >
      {inner}
    </a>
  );
};
