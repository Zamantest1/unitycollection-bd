import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Bell } from "lucide-react";

const AdminNotice = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [text, setText] = useState("");
  const [isActive, setIsActive] = useState(true);

  const { data: notice, isLoading } = useQuery({
    queryKey: ["admin-notice"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notice_settings")
        .select("*")
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      
      if (data) {
        setText(data.text);
        setIsActive(data.is_active);
      }
      
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (notice) {
        const { error } = await supabase
          .from("notice_settings")
          .update({ text, is_active: isActive })
          .eq("id", notice.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("notice_settings")
          .insert({ text, is_active: isActive });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-notice"] });
      toast({ title: "Notice bar updated!" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      toast({ title: "Please enter notice text", variant: "destructive" });
      return;
    }
    saveMutation.mutate();
  };

  if (isLoading) {
    return (
      <AdminLayout title="Notice Bar">
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Notice Bar">
      <div className="w-full max-w-xl mx-auto">
        <Card className="w-full overflow-hidden">
          <CardHeader className="px-3 sm:px-6 py-4">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-gold flex-shrink-0" />
              <span>Scrolling Notice Bar</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-4">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <div className="space-y-2">
                <Label className="text-sm sm:text-base">Notice Text</Label>
                <Input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="🎉 Free delivery inside Dhaka!"
                  className="text-sm sm:text-base w-full"
                />
                <p className="text-xs text-muted-foreground break-words">
                  This text will scroll across the top of your store. Use emojis for visual appeal!
                </p>
              </div>

              <div className="flex items-center justify-between gap-3 p-3 sm:p-4 bg-gold-soft/30 rounded-lg">
                <div className="flex-1 min-w-0">
                  <Label className="text-sm sm:text-base font-medium block">Show Notice Bar</Label>
                  <p className="text-xs sm:text-sm text-muted-foreground">Toggle visibility</p>
                </div>
                <Switch
                  checked={isActive}
                  onCheckedChange={setIsActive}
                  className="flex-shrink-0"
                />
              </div>

              {/* Preview */}
              {text && (
                <div className="space-y-2">
                  <Label className="text-sm sm:text-base">Preview</Label>
                  <div className="bg-gold text-gold-foreground py-2 rounded-md overflow-hidden">
                    <div className="animate-marquee whitespace-nowrap">
                      <span className="mx-4 sm:mx-8 text-xs sm:text-sm font-medium">{text}</span>
                      <span className="mx-4 sm:mx-8 text-xs sm:text-sm font-medium">{text}</span>
                    </div>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-primary text-primary-foreground hover:bg-gold hover:text-gold-foreground text-sm sm:text-base py-2 sm:py-2.5"
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminNotice;
