import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PageHeader } from "@/components/dashboard/page-shell";
import { toast } from "sonner";
import { Loader2, MessageSquare, Plus, RefreshCw, Send, AlertCircle, HelpCircle, Phone, MessageCircle, Headphones, ExternalLink } from "lucide-react";
import { RoutePending, RouteError } from "@/components/dashboard/page-shell";
import { getSupportTickets, createSupportTicket } from "@/lib/support.functions";

export const Route = createFileRoute("/_authenticated/dashboard/support/")({
  head: () => ({ meta: [{ title: "Help & Support — BizkitOps" }] }),
  component: SupportPage,
  pendingComponent: RoutePending,
  errorComponent: RouteError,
});

interface SupportTicket {
  id: string;
  business_id: string;
  user_id: string | null;
  subject: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

function SupportPage() {
  const queryClient = useQueryClient();
  const getTicketsFn = useServerFn(getSupportTickets);
  const createTicketFn = useServerFn(createSupportTicket);

  const [createOpen, setCreateOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<"billing" | "technical" | "feature_request" | "general">("general");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");

  const { data: tickets = [], isLoading, isRefetching, refetch } = useQuery<SupportTicket[]>({
    queryKey: ["support-tickets"],
    queryFn: async () => {
      const res = await getTicketsFn();
      return res as unknown as SupportTicket[];
    },
  });

  useEffect(() => {
    if (tickets && tickets.length > 0) {
      const seenList = tickets.map((t) => ({ id: t.id, admin_notes: t.admin_notes }));
      localStorage.setItem("bizkitops_seen_tickets", JSON.stringify(seenList));
    }
  }, [tickets]);

  const createMutation = useMutation({
    mutationFn: (data: {
      subject: string;
      description: string;
      category: "billing" | "technical" | "feature_request" | "general";
      priority: "low" | "medium" | "high" | "urgent";
    }) => createTicketFn({ data }),
    onSuccess: () => {
      toast.success("Support ticket raised successfully!");
      setCreateOpen(false);
      setSubject("");
      setDescription("");
      setCategory("general");
      setPriority("medium");
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
    },
    onError: (err) => {
      let message = (err as Error).message || "Failed to raise support ticket";
      if (typeof message === "string" && message.trim().startsWith("[")) {
        try {
          const parsed = JSON.parse(message);
          if (Array.isArray(parsed) && parsed[0]?.message) {
            message = parsed
              .map((i: any) => (i.path?.length ? `${i.path.join(".")}: ${i.message}` : i.message))
              .join("; ");
          }
        } catch {}
      }
      toast.error(message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanSubject = subject.trim();
    const cleanDescription = description.trim();

    if (!cleanSubject || !cleanDescription) {
      toast.error("Please fill in all required fields.");
      return;
    }
    if (cleanSubject.length < 3) {
      toast.error("Subject must be at least 3 characters long.");
      return;
    }
    if (cleanDescription.length < 10) {
      toast.error("Detailed description must be at least 10 characters long.");
      return;
    }
    createMutation.mutate({ subject: cleanSubject, description: cleanDescription, category, priority });
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "in_progress":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "resolved":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case "closed":
        return "bg-slate-500/10 text-slate-500 border-slate-500/20";
      default:
        return "bg-slate-500/10 text-slate-500 border-slate-500/20";
    }
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case "low":
        return "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400";
      case "medium":
        return "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400";
      case "high":
        return "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400";
      case "urgent":
        return "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-semibold";
      default:
        return "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400";
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <PageHeader
          title="Help & Support"
          description="Contact platform support via WhatsApp, Call, or raise technical/billing tickets."
        />
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 gap-1.5 font-semibold shadow-sm">
            <a href="https://wa.me/917899535703?text=Hi%20BizkitOps%20Support,%20I%20need%20assistance%20with%20my%20account." target="_blank" rel="noreferrer">
              <MessageCircle className="h-4 w-4 fill-emerald-500/20" /> WhatsApp
            </a>
          </Button>
          <Button asChild size="sm" variant="outline" className="border-blue-500/40 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 text-xs h-9 gap-1.5 font-semibold">
            <a href="tel:+917899535703">
              <Phone className="h-4 w-4" /> Call 7899535703
            </a>
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={isLoading || isRefetching}
            className="h-9 w-9 shrink-0"
            title="Refresh tickets"
          >
            <RefreshCw className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`} />
          </Button>

          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 h-9 text-xs font-semibold">
                <Plus className="h-4 w-4" /> Raise Ticket
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Raise Support Ticket</DialogTitle>
                <DialogDescription>
                  Tell us what is wrong, and our superadmin team will get back to you shortly.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <Label htmlFor="category">Category</Label>
                  <select
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="general">General Query</option>
                    <option value="technical">Technical Issue</option>
                    <option value="billing">Billing Inquiry</option>
                    <option value="feature_request">Feature Request</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="priority">Priority</Label>
                  <select
                    id="priority"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="subject">Subject</Label>
                    <span className={`text-[11px] ${subject.trim().length > 0 && subject.trim().length < 3 ? "text-rose-500 font-medium" : "text-muted-foreground"}`}>
                      Min 3 chars
                    </span>
                  </div>
                  <Input
                    id="subject"
                    placeholder="Brief summary of the issue"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="description">Detailed Description</Label>
                    <span className={`text-[11px] ${description.trim().length > 0 && description.trim().length < 10 ? "text-rose-500 font-medium" : "text-muted-foreground"}`}>
                      {description.trim().length}/10 chars min
                    </span>
                  </div>
                  <Textarea
                    id="description"
                    placeholder="Explain the issue with relevant details (at least 10 characters)..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    required
                  />
                </div>

                <Button type="submit" className="w-full gap-2" disabled={createMutation.isPending}>
                  {createMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Submit Ticket
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Quick Support Channels Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* WhatsApp Card */}
        <Card className="border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <MessageCircle className="h-5 w-5 fill-emerald-500/20" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-foreground">WhatsApp Chat</p>
              <p className="text-[11px] text-muted-foreground truncate">+91 7899535703</p>
            </div>
            <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 gap-1 shadow-xs">
              <a href="https://wa.me/917899535703?text=Hi%20BizkitOps%20Support,%20I%20need%20assistance%20with%20my%20account." target="_blank" rel="noreferrer">
                Chat <ExternalLink className="h-3 w-3" />
              </a>
            </Button>
          </CardContent>
        </Card>

        {/* Direct Call Card */}
        <Card className="border border-blue-500/30 bg-gradient-to-br from-blue-500/10 via-transparent to-transparent shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Phone className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-foreground">Direct Call</p>
              <p className="text-[11px] text-muted-foreground truncate">+91 7899535703</p>
            </div>
            <Button asChild size="sm" variant="outline" className="border-blue-500/40 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 text-xs h-8 gap-1">
              <a href="tel:+917899535703">
                Call <Phone className="h-3 w-3" />
              </a>
            </Button>
          </CardContent>
        </Card>

        {/* Ticket Support Card */}
        <Card className="border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-transparent to-transparent shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Headphones className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-foreground">Ticket Support</p>
              <p className="text-[11px] text-muted-foreground truncate">Superadmin responses</p>
            </div>
            <Button size="sm" onClick={() => setCreateOpen(true)} className="text-xs h-8 gap-1 bg-primary text-primary-foreground shadow-xs">
              <Plus className="h-3.5 w-3.5" /> Ticket
            </Button>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Loading support history...</span>
        </div>
      ) : tickets.length === 0 ? (
        <Card className="border border-dashed border-border/80 p-8 flex flex-col items-center text-center justify-center bg-slate-50/50 dark:bg-slate-900/30">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
            <HelpCircle className="h-6 w-6" />
          </div>
          <CardTitle className="text-lg">No support tickets found</CardTitle>
          <CardDescription className="max-w-md mt-1.5">
            Need help or encountered an issue? Raise a ticket and our administrative team will address it.
          </CardDescription>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {tickets.map((ticket) => (
            <Card key={ticket.id} className="border border-border/80 hover:shadow-soft transition-all">
              <CardHeader className="pb-3 flex flex-row items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className={getStatusBadgeColor(ticket.status)}>
                      {ticket.status.replace("_", " ").toUpperCase()}
                    </Badge>
                    <Badge variant="outline" className={getPriorityBadgeColor(ticket.priority)}>
                      {ticket.priority.toUpperCase()}
                    </Badge>
                    <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider bg-muted/60 px-2 py-0.5 rounded">
                      {ticket.category.replace("_", " ")}
                    </span>
                  </div>
                  <CardTitle className="text-base pt-1">{ticket.subject}</CardTitle>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(ticket.created_at).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {ticket.description}
                </p>

                {ticket.admin_notes ? (
                  <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-500/10 space-y-1.5">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      <MessageSquare className="h-3.5 w-3.5" /> Support Response
                    </span>
                    <p className="text-xs text-emerald-950 dark:text-emerald-100 whitespace-pre-wrap leading-normal">
                      {ticket.admin_notes}
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/30 p-2.5 rounded-lg border border-border/40">
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span>Waiting for support response. Typically answered within 2 hours.</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
