/**
 * Supabase Client Wrapper
 * 
 * This file provides a centralized export of the Supabase client.
 * Use this import in your components instead of importing from the integrations folder:
 * 
 * import { supabase } from '@/lib/supabase';
 */

export { supabase } from '@/integrations/supabase/client';
export type { Database } from '@/integrations/supabase/types';
