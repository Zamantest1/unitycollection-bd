-- Lightweight page-view analytics for the admin dashboard.
--
-- We deliberately keep this small:
--   * one row per (visitor session, path, hour) — the client throttles to one
--     ping per path per hour using sessionStorage, so even heavy refreshing
--     does not balloon row counts.
--   * a single SECURITY DEFINER write RPC with input length-clamping.
--   * read access is gated by `is_admin()` via SECURITY DEFINER aggregates,
--     so the raw page_views table never has to be queryable by anon.

CREATE TABLE IF NOT EXISTS public.page_views (
  id          BIGSERIAL PRIMARY KEY,
  path        TEXT        NOT NULL,
  session_id  TEXT        NOT NULL,
  user_agent  TEXT,
  referrer    TEXT,
  visited_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS page_views_visited_at_idx
  ON public.page_views (visited_at DESC);
CREATE INDEX IF NOT EXISTS page_views_path_idx
  ON public.page_views (path);
CREATE INDEX IF NOT EXISTS page_views_session_id_idx
  ON public.page_views (session_id);

ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

-- Even though aggregates go through SECURITY DEFINER RPCs, lock down direct
-- table access so a bug elsewhere can't accidentally expose visitor data.
DROP POLICY IF EXISTS "Admins can read page views" ON public.page_views;
CREATE POLICY "Admins can read page views"
  ON public.page_views FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Anon write: routed through the RPC below, never directly.
-- (Intentionally no INSERT/UPDATE/DELETE policy.)

-- Public tracker — anon callable, fire-and-forget.
CREATE OR REPLACE FUNCTION public.track_page_view(
  p_path        TEXT,
  p_session_id  TEXT,
  p_user_agent  TEXT,
  p_referrer    TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_path IS NULL OR p_session_id IS NULL THEN
    RETURN;
  END IF;
  INSERT INTO public.page_views (path, session_id, user_agent, referrer)
  VALUES (
    LEFT(p_path,       200),
    LEFT(p_session_id, 100),
    LEFT(COALESCE(p_user_agent, ''), 500),
    LEFT(COALESCE(p_referrer,   ''), 500)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.track_page_view(TEXT, TEXT, TEXT, TEXT)
  TO anon, authenticated;

-- Admin aggregates ----------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_visit_stats()
RETURNS TABLE (
  visits_today           BIGINT,
  visits_7d              BIGINT,
  visits_30d             BIGINT,
  unique_visitors_today  BIGINT,
  unique_visitors_7d     BIGINT,
  unique_visitors_30d    BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  RETURN QUERY
    SELECT
      COUNT(*) FILTER (WHERE visited_at >= now() - interval '1 day')   AS visits_today,
      COUNT(*) FILTER (WHERE visited_at >= now() - interval '7 days')  AS visits_7d,
      COUNT(*) FILTER (WHERE visited_at >= now() - interval '30 days') AS visits_30d,
      COUNT(DISTINCT session_id) FILTER (WHERE visited_at >= now() - interval '1 day')   AS unique_visitors_today,
      COUNT(DISTINCT session_id) FILTER (WHERE visited_at >= now() - interval '7 days')  AS unique_visitors_7d,
      COUNT(DISTINCT session_id) FILTER (WHERE visited_at >= now() - interval '30 days') AS unique_visitors_30d
    FROM public.page_views;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_visit_stats() TO authenticated;

CREATE OR REPLACE FUNCTION public.get_top_pages(
  p_days  INTEGER,
  p_limit INTEGER
)
RETURNS TABLE (
  path             TEXT,
  views            BIGINT,
  unique_visitors  BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  RETURN QUERY
    SELECT
      pv.path,
      COUNT(*)::BIGINT                AS views,
      COUNT(DISTINCT pv.session_id)::BIGINT AS unique_visitors
    FROM public.page_views pv
    WHERE pv.visited_at >= now() - (GREATEST(p_days, 1) || ' days')::interval
    GROUP BY pv.path
    ORDER BY views DESC
    LIMIT GREATEST(p_limit, 1);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_top_pages(INTEGER, INTEGER)
  TO authenticated;

CREATE OR REPLACE FUNCTION public.get_visits_by_day(p_days INTEGER)
RETURNS TABLE (
  day              DATE,
  views            BIGINT,
  unique_visitors  BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  RETURN QUERY
    WITH days AS (
      SELECT generate_series(
        (now() - (GREATEST(p_days, 1) - 1 || ' days')::interval)::date,
        now()::date,
        '1 day'::interval
      )::date AS day
    )
    SELECT
      d.day,
      COALESCE(COUNT(pv.id), 0)::BIGINT                   AS views,
      COALESCE(COUNT(DISTINCT pv.session_id), 0)::BIGINT  AS unique_visitors
    FROM days d
    LEFT JOIN public.page_views pv
      ON date_trunc('day', pv.visited_at AT TIME ZONE 'UTC')::date = d.day
    GROUP BY d.day
    ORDER BY d.day ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_visits_by_day(INTEGER) TO authenticated;
