import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  CreditCard,
  ExternalLink,
} from "lucide-react";
import { Link } from "react-router-dom";

type SubmissionStatus = "pending" | "verified" | "rejected";

interface PaymentSubmission {
  id: string;
  order_id: string;
  method_key: string;
  customer_name: string | null;
  customer_phone: string | null;
  transaction_id: string;
  amount: number | null;
  status: string;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
}

const STATUS_LABEL: Record<SubmissionStatus, string> = {
  pending: "Pending",
  verified: "Verified",
  rejected: "Rejected",
};

const STATUS_VARIANT: Record<
  SubmissionStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending: "outline",
  verified: "default",
  rejected: "destructive",
};

const STATUS_ICON: Record<SubmissionStatus, typeof Clock> = {
  pending: Clock,
  verified: CheckCircle2,
  rejected: XCircle,
};

const AdminPayments = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<SubmissionStatus | "all">(
    "all",
  );
  const [editing, setEditing] = useState<PaymentSubmission | null>(null);
  const [editStatus, setEditStatus] = useState<SubmissionStatus>("pending");
  const [editNote, setEditNote] = useState("");

  const { data: submissions = [], isLoading } = useQuery<PaymentSubmission[]>({
    queryKey: ["admin-payment-submissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_submissions")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as PaymentSubmission[];
    },
  });

  // Goes through the verify_payment_submission RPC so that, on
  // status='verified', the matching order's payment_status is bumped
  // to 'delivery_paid' or 'fully_paid' (depending on the method's
  // payment_type). Falling back to plain UPDATE would leave the order
  // out of sync, which is the bug this RPC exists to prevent.
  const updateMutation = useMutation({
    mutationFn: async (params: {
      id: string;
      status: SubmissionStatus;
      admin_note: string;
    }) => {
      const { error } = await supabase.rpc("verify_payment_submission", {
        p_submission_id: params.id,
        p_status: params.status,
        p_admin_note: params.admin_note || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin-payment-submissions"],
      });
      // Order list shows payment_status badge → keep them in sync.
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast({ title: "Submission updated" });
      setEditing(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return submissions.filter((s) => {
      if (statusFilter !== "all" && s.status !== statusFilter) return false;
      if (!q) return true;
      return (
        s.order_id.toLowerCase().includes(q) ||
        s.transaction_id.toLowerCase().includes(q) ||
        (s.customer_name ?? "").toLowerCase().includes(q) ||
        (s.customer_phone ?? "").includes(q) ||
        s.method_key.toLowerCase().includes(q)
      );
    });
  }, [submissions, statusFilter, search]);

  const counts = useMemo(() => {
    const c = { pending: 0, verified: 0, rejected: 0 };
    submissions.forEach((s) => {
      if (s.status === "pending") c.pending += 1;
      else if (s.status === "verified") c.verified += 1;
      else if (s.status === "rejected") c.rejected += 1;
    });
    return c;
  }, [submissions]);

  return (
    <AdminLayout title="Payments">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Clock className="h-6 w-6 text-amber-500" />
            <div>
              <p className="text-xs text-muted-foreground">Pending review</p>
              <p className="text-2xl font-bold">{counts.pending}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-green-500" />
            <div>
              <p className="text-xs text-muted-foreground">Verified</p>
              <p className="text-2xl font-bold">{counts.verified}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <XCircle className="h-6 w-6 text-destructive" />
            <div>
              <p className="text-xs text-muted-foreground">Rejected</p>
              <p className="text-2xl font-bold">{counts.rejected}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by order ID, transaction ID, name, phone…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) =>
            setStatusFilter(v as SubmissionStatus | "all")
          }
        >
          <SelectTrigger className="w-full md:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <CreditCard className="h-10 w-10 mx-auto mb-2 opacity-40" />
            {submissions.length === 0
              ? "No payment submissions yet."
              : "No submissions match your filters."}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((s) => {
            const status = (s.status as SubmissionStatus) ?? "pending";
            const Icon = STATUS_ICON[status];
            return (
              <Card key={s.id}>
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge variant="outline" className="font-mono text-xs">
                          {s.method_key}
                        </Badge>
                        <Link
                          to={`/admin/orders?search=${s.order_id}`}
                          className="text-sm font-mono text-foreground hover:text-gold inline-flex items-center gap-1"
                        >
                          {s.order_id}
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                        <Badge variant={STATUS_VARIANT[status]}>
                          <Icon className="h-3 w-3 mr-1" />
                          {STATUS_LABEL[status]}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1 text-sm">
                        <div>
                          <span className="text-muted-foreground">TrxID:</span>{" "}
                          <span className="font-mono">{s.transaction_id}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Amount:</span>{" "}
                          {s.amount != null
                            ? `৳${Number(s.amount).toLocaleString()}`
                            : "—"}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Name:</span>{" "}
                          {s.customer_name || "—"}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Phone:</span>{" "}
                          {s.customer_phone || "—"}
                        </div>
                      </div>
                      {s.admin_note && (
                        <p className="text-xs text-muted-foreground mt-2">
                          <span className="font-semibold">Note:</span>{" "}
                          {s.admin_note}
                        </p>
                      )}
                      <p className="text-[11px] text-muted-foreground mt-1">
                        Submitted {new Date(s.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditing(s);
                          setEditStatus(status);
                          setEditNote(s.admin_note ?? "");
                        }}
                      >
                        Review
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog
        open={!!editing}
        onOpenChange={(open) => !open && setEditing(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Review submission</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div className="text-sm space-y-1">
                <p>
                  <span className="text-muted-foreground">Order:</span>{" "}
                  <span className="font-mono">{editing.order_id}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">Method:</span>{" "}
                  {editing.method_key}
                </p>
                <p>
                  <span className="text-muted-foreground">TrxID:</span>{" "}
                  <span className="font-mono">{editing.transaction_id}</span>
                </p>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={editStatus}
                  onValueChange={(v) =>
                    setEditStatus(v as SubmissionStatus)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Admin note (optional)</Label>
                <Textarea
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  rows={3}
                  placeholder="e.g. Confirmed receipt in bKash on 4 May 2026"
                />
              </div>
              <Button
                className="w-full"
                disabled={updateMutation.isPending}
                onClick={() =>
                  updateMutation.mutate({
                    id: editing.id,
                    status: editStatus,
                    admin_note: editNote.trim(),
                  })
                }
              >
                {updateMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Save
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminPayments;
