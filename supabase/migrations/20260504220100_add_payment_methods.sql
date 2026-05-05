-- Admin-controlled payment methods (bKash, Nagad, Rocket, …).
--
-- The Payment.tsx page used to hardcode receiving numbers ("01XXXXXXXXX") and
-- a comment promised they would move to a table in "PR 3". This is that PR.
-- Admins can now edit numbers / instructions / order live without redeploying.

CREATE TABLE IF NOT EXISTS public.payment_methods (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key             TEXT        NOT NULL UNIQUE,
  name            TEXT        NOT NULL,
  type            TEXT        NOT NULL,
  account_number  TEXT        NOT NULL,
  instructions    TEXT,
  is_active       BOOLEAN     DEFAULT TRUE,
  display_order   INTEGER     DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS payment_methods_active_order_idx
  ON public.payment_methods (is_active, display_order);

ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active payment methods"
  ON public.payment_methods;
CREATE POLICY "Anyone can view active payment methods"
  ON public.payment_methods FOR SELECT
  USING (is_active = TRUE OR public.is_admin());

DROP POLICY IF EXISTS "Admins can manage payment methods"
  ON public.payment_methods;
CREATE POLICY "Admins can manage payment methods"
  ON public.payment_methods FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP TRIGGER IF EXISTS update_payment_methods_updated_at
  ON public.payment_methods;
CREATE TRIGGER update_payment_methods_updated_at
  BEFORE UPDATE ON public.payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed the three methods the storefront already shows so the Payment page
-- keeps working immediately after the migration is applied. The numbers are
-- placeholders the admin should edit straight away.
INSERT INTO public.payment_methods (key, name, type, account_number, instructions, display_order)
VALUES
  ('bkash',  'bKash',  'Send Money', '01XXXXXXXXX',
   'Open your bKash app → tap Send Money → enter the number above → enter the amount → confirm. Then submit the Transaction ID below.',
   1),
  ('nagad',  'Nagad',  'Send Money', '01XXXXXXXXX',
   'Open your Nagad app → tap Send Money → enter the number above → enter the amount → confirm. Then submit the Transaction ID below.',
   2),
  ('rocket', 'Rocket', 'Payment',    '01XXXXXXXXX',
   'Dial *322# → tap Payment → enter the merchant number above → enter the amount → confirm. Then submit the Transaction ID below.',
   3)
ON CONFLICT (key) DO NOTHING;
