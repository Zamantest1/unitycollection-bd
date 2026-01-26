-- Allow 'returned' status on orders
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'orders_status_check'
      AND conrelid = 'public.orders'::regclass
  ) THEN
    EXECUTE 'ALTER TABLE public.orders DROP CONSTRAINT orders_status_check';
  END IF;
END $$;

ALTER TABLE public.orders
ADD CONSTRAINT orders_status_check
CHECK (
  status = ANY (
    ARRAY[
      'pending'::text,
      'confirmed'::text,
      'shipped'::text,
      'delivered'::text,
      'cancelled'::text,
      'returned'::text
    ]
  )
);
