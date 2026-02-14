import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

export function SupabaseConnectionTest() {
  const [status, setStatus] = useState<'loading' | 'connected' | 'error'>('loading');
  const [message, setMessage] = useState('Testing Supabase connection...');

  useEffect(() => {
    const testConnection = async () => {
      try {
        // Test 1: Check if client is initialized
        if (!supabase) {
          setStatus('error');
          setMessage('Supabase client is not initialized');
          return;
        }

        // Test 2: Try to fetch from a table (products is a safe choice)
        const { data, error } = await supabase
          .from('products')
          .select('count', { count: 'exact' })
          .limit(1);

        if (error) {
          setStatus('error');
          setMessage(`Database error: ${error.message}`);
          return;
        }

        setStatus('connected');
        setMessage('✓ Connected to Supabase successfully!');
      } catch (err) {
        setStatus('error');
        setMessage(`Connection failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    };

    testConnection();
  }, []);

  const statusColors = {
    loading: 'bg-blue-50 border-blue-200 text-blue-800',
    connected: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
  };

  return (
    <div className={`border rounded-lg p-4 ${statusColors[status]}`}>
      <div className="flex items-center gap-2">
        {status === 'loading' && <Loader2 className="h-5 w-5 animate-spin" />}
        {status === 'connected' && <CheckCircle2 className="h-5 w-5" />}
        {status === 'error' && <AlertCircle className="h-5 w-5" />}
        <span className="font-medium">{message}</span>
      </div>
    </div>
  );
}
