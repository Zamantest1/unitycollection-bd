import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  Eye,
  Minus,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface VisitStats {
  visits_today: number;
  visits_7d: number;
  visits_30d: number;
  unique_visitors_today: number;
  unique_visitors_7d: number;
  unique_visitors_30d: number;
}

interface TopPage {
  path: string;
  views: number;
  unique_visitors: number;
}

interface DailyVisit {
  day: string;
  views: number;
  unique_visitors: number;
}

const formatDay = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

const Delta = ({ today, yesterday }: { today: number; yesterday: number }) => {
  if (yesterday === 0 && today === 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[11px] text-muted-foreground">
        <Minus className="h-3 w-3" />
        no traffic yet
      </span>
    );
  }
  if (yesterday === 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-emerald-600">
        <ArrowUpRight className="h-3 w-3" />
        first visits
      </span>
    );
  }
  const diff = today - yesterday;
  const pct = Math.round((diff / yesterday) * 100);
  if (pct === 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[11px] text-muted-foreground">
        <Minus className="h-3 w-3" />
        flat vs yesterday
      </span>
    );
  }
  const positive = pct > 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-[11px] font-medium",
        positive ? "text-emerald-600" : "text-rose-600",
      )}
    >
      {positive ? (
        <ArrowUpRight className="h-3 w-3" />
      ) : (
        <ArrowDownRight className="h-3 w-3" />
      )}
      {positive ? "+" : ""}
      {pct}% vs yesterday
    </span>
  );
};

export function VisitorInsights() {
  const { data: stats } = useQuery<VisitStats | null>({
    queryKey: ["admin-visit-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_visit_stats");
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      return (row as VisitStats) ?? null;
    },
  });

  const { data: daily = [] } = useQuery<DailyVisit[]>({
    queryKey: ["admin-visits-by-day"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_visits_by_day", {
        p_days: 30,
      });
      if (error) throw error;
      return (data ?? []) as DailyVisit[];
    },
  });

  const { data: topPages = [] } = useQuery<TopPage[]>({
    queryKey: ["admin-top-pages"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_top_pages", {
        p_days: 7,
        p_limit: 6,
      });
      if (error) throw error;
      return (data ?? []) as TopPage[];
    },
  });

  const yesterday = useMemo(() => {
    if (daily.length < 2) return 0;
    return daily[daily.length - 2]?.views ?? 0;
  }, [daily]);

  const today = stats?.visits_today ?? 0;
  const max7d = useMemo(() => {
    if (topPages.length === 0) return 1;
    return Math.max(...topPages.map((p) => p.views), 1);
  }, [topPages]);

  if (!stats) return null;

  return (
    <Card className="mb-6 overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-border/50">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <Eye className="h-4 w-4 text-primary" />
            Visitor Insights
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Storefront page views — admin pages excluded
          </p>
        </div>
        <span className="hidden sm:inline-flex text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Last 30 days
        </span>
      </CardHeader>

      <CardContent className="pt-4 space-y-5">
        {/* Stat tiles */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-md border bg-card p-3">
            <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
              <CalendarDays className="h-3 w-3" />
              Today
            </div>
            <div className="mt-1 text-2xl font-bold text-foreground tabular-nums">
              {stats.visits_today.toLocaleString()}
            </div>
            <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-0.5">
                <Users className="h-3 w-3" />
                {stats.unique_visitors_today}
              </span>
              <Delta today={today} yesterday={yesterday} />
            </div>
          </div>

          <div className="rounded-md border bg-card p-3">
            <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
              <CalendarDays className="h-3 w-3" />
              7 days
            </div>
            <div className="mt-1 text-2xl font-bold text-foreground tabular-nums">
              {stats.visits_7d.toLocaleString()}
            </div>
            <div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
              <Users className="h-3 w-3" />
              {stats.unique_visitors_7d} unique
            </div>
          </div>

          <div className="rounded-md border bg-card p-3">
            <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
              <CalendarDays className="h-3 w-3" />
              30 days
            </div>
            <div className="mt-1 text-2xl font-bold text-foreground tabular-nums">
              {stats.visits_30d.toLocaleString()}
            </div>
            <div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
              <Users className="h-3 w-3" />
              {stats.unique_visitors_30d} unique
            </div>
          </div>
        </div>

        {/* Sparkline */}
        {daily.length > 0 && (
          <div className="rounded-md border bg-card p-3">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-semibold text-foreground">
                Daily visits
              </p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Views · Unique
              </p>
            </div>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={daily}
                  margin={{ top: 6, right: 4, bottom: 0, left: -22 }}
                >
                  <defs>
                    <linearGradient id="vi-views" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="vi-unique" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--gold))" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="hsl(var(--gold))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis
                    dataKey="day"
                    tickFormatter={formatDay}
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={6}
                    minTickGap={24}
                  />
                  <YAxis
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    width={32}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid hsl(var(--border))",
                      fontSize: 12,
                      padding: "6px 8px",
                    }}
                    labelFormatter={(d: string) => formatDay(d)}
                    formatter={(value: number, key: string) => [
                      value.toLocaleString(),
                      key === "views" ? "Views" : "Unique",
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="views"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#vi-views)"
                  />
                  <Area
                    type="monotone"
                    dataKey="unique_visitors"
                    stroke="hsl(var(--gold))"
                    strokeWidth={1.5}
                    fill="url(#vi-unique)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Top pages */}
        {topPages.length > 0 && (
          <div className="rounded-md border bg-card p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-foreground">
                Top pages · last 7 days
              </p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Views · Unique
              </p>
            </div>
            <div className="space-y-1.5">
              {topPages.map((p) => {
                const pct = Math.round((p.views / max7d) * 100);
                return (
                  <div key={p.path} className="space-y-1">
                    <div className="flex items-center justify-between gap-2 text-[12px]">
                      <span className="font-mono text-foreground truncate">
                        {p.path}
                      </span>
                      <span className="shrink-0 tabular-nums text-muted-foreground">
                        <span className="font-semibold text-foreground">
                          {p.views}
                        </span>
                        {" · "}
                        {p.unique_visitors}
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary/80 to-gold/80"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
