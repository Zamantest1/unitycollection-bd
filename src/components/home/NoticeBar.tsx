import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function NoticeBar() {
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

  return (
    <div className="bg-gold text-gold-foreground py-2 overflow-hidden">
      <div className="animate-marquee whitespace-nowrap">
        <span className="mx-8 text-sm font-medium">{notice.text}</span>
        <span className="mx-8 text-sm font-medium">{notice.text}</span>
        <span className="mx-8 text-sm font-medium">{notice.text}</span>
      </div>
    </div>
  );
}
