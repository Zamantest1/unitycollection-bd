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
      <div className="max-w-xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-gold" />
              Scrolling Notice Bar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label>Notice Text</Label>
                <Input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="🎉 Free delivery inside Dhaka! | 🛒 Shop now for Eid collection!"
                />
                <p className="text-xs text-muted">
                  This text will scroll across the top of your store. Use emojis for visual appeal!
                </p>
              </div>

              <div className="flex items-center justify-between p-4 bg-gold-soft/30 rounded-lg">
                <div>
                  <Label className="text-base font-medium">Show Notice Bar</Label>
                  <p className="text-sm text-muted">Toggle visibility on the storefront</p>
                </div>
                <Switch
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
              </div>

              {/* Preview */}
              {text && (
                <div className="space-y-2">
                  <Label>Preview</Label>
                  <div className="bg-gold text-gold-foreground py-2 rounded-md overflow-hidden">
                    <div className="animate-marquee whitespace-nowrap">
                      <span className="mx-8 text-sm font-medium">{text}</span>
                      <span className="mx-8 text-sm font-medium">{text}</span>
                    </div>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-primary text-primary-foreground hover:bg-gold hover:text-gold-foreground"
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
