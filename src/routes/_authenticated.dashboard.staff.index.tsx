import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { queryOptions, useSuspenseQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  listStaffMembers,
  inviteStaffMember,
  updateStaffMemberRole,
  deleteStaffMember,
} from "@/lib/staff.functions";
import { listInstalledModules } from "@/lib/modules-store.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Loader2, Shield, Trash2, Users, Mail, UserCheck } from "lucide-react";
import { PageHeader, EmptyState } from "@/components/dashboard/page-shell";
import { toast } from "sonner";
import { RoutePending, RouteError } from "@/components/dashboard/page-shell";

const staffOptions = queryOptions({
  queryKey: ["staff-members"],
  queryFn: () => listStaffMembers(),
});

const installedModulesOptions = queryOptions({
  queryKey: ["installed-modules"],
  queryFn: () => listInstalledModules(),
});

export const Route = createFileRoute("/_authenticated/dashboard/staff/")({
  head: () => ({ meta: [{ title: "Staff Manager — BizkitOps" }] }),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(staffOptions),
      context.queryClient.ensureQueryData(installedModulesOptions),
    ]),
  component: StaffPage,
  pendingComponent: RoutePending,
  errorComponent: RouteError,
});

type StaffMember = Awaited<ReturnType<typeof listStaffMembers>>[number];

function StaffPage() {
  const { data: staff } = useSuspenseQuery(staffOptions);
  const { data: installed } = useSuspenseQuery(installedModulesOptions);

  const isModuleActive = installed.some((m) => m.module_key === "staff" && m.is_active);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  if (!isModuleActive) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Staff Manager"
          description="Manage your team, assign roles, and control access."
        />
        <Card className="max-w-md mx-auto text-center p-8 mt-12 shadow-md border-border bg-card">
          <CardHeader className="flex flex-col items-center">
            <div className="h-16 w-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
              <Shield className="h-8 w-8" />
            </div>
            <CardTitle className="text-xl">Staff Manager is Disabled</CardTitle>
            <CardDescription className="mt-2 text-sm text-muted-foreground">
              Activate the Staff Manager module to add your team members, assign secure roles
              (Admin, Manager, Staff), and manage their platform access.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center mt-4">
            <Button asChild>
              <Link to="/dashboard/modules">Go to Module Store</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filtered = staff.filter((s) => {
    const name = s.profiles?.full_name || "";
    const email = s.profiles?.email || s.invited_email || "";
    return [name, email, s.role, s.status].join(" ").toLowerCase().includes(query.toLowerCase());
  });

  const activeCount = staff.filter((s) => s.status === "active").length;
  const pendingCount = staff.filter((s) => s.status === "invited").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff Manager"
        description="Add staff members, assign roles, and manage permissions."
        action={
          <Button onClick={() => setOpen(true)} className="gap-1">
            <Plus className="h-4 w-4" /> Invite Staff
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                Active Members
              </p>
              <h3 className="text-2xl font-bold mt-1 text-emerald-600">{activeCount}</h3>
            </div>
            <div className="h-10 w-10 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-600">
              <UserCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                Pending Invitations
              </p>
              <h3 className="text-2xl font-bold mt-1 text-amber-500">{pendingCount}</h3>
            </div>
            <div className="h-10 w-10 bg-amber-500/10 rounded-lg flex items-center justify-center text-amber-500">
              <Mail className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                Total Team Size
              </p>
              <h3 className="text-2xl font-bold mt-1">{staff.length}</h3>
            </div>
            <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {staff.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No team members yet"
          description="Invite your first staff member to help manage your business operations."
          action={{ label: "Invite Staff", onClick: () => setOpen(true) }}
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="p-4 border-b">
              <div className="relative max-w-sm">
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search team member by name, email, or role..."
                />
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((s) => {
                  const name = s.profiles?.full_name ?? "Pending Registration";
                  const email = s.profiles?.email ?? s.invited_email;
                  const initials = (s.profiles?.full_name || "P")
                    .split(" ")
                    .map((x) => x[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase();

                  return (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-secondary text-secondary-foreground text-xs font-semibold flex items-center justify-center">
                            {initials}
                          </div>
                          <div>
                            <p className="font-semibold text-sm leading-none">{name}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <RoleSelector id={s.id} currentRole={s.role} />
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={s.status === "active" ? "default" : "secondary"}
                          className={
                            s.status === "active"
                              ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                              : "bg-amber-100 hover:bg-amber-100 text-amber-800 border-none"
                          }
                        >
                          {s.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(s.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <DeleteButton id={s.id} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <InviteDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}

function RoleSelector({ id, currentRole }: { id: string; currentRole: string }) {
  const qc = useQueryClient();
  const updateRole = useServerFn(updateStaffMemberRole);
  const m = useMutation({
    mutationFn: updateRole,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["staff-members"] });
      toast.success("Role updated successfully");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <Select
      value={currentRole}
      disabled={m.isPending}
      onValueChange={(val: "admin" | "manager" | "staff" | "viewer") => {
        m.mutate({ data: { id, role: val } });
      }}
    >
      <SelectTrigger className="w-[120px] h-8 text-xs">
        <SelectValue placeholder="Select role" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="admin">Admin</SelectItem>
        <SelectItem value="manager">Manager</SelectItem>
        <SelectItem value="staff">Staff</SelectItem>
        <SelectItem value="viewer">Viewer</SelectItem>
      </SelectContent>
    </Select>
  );
}

function DeleteButton({ id }: { id: string }) {
  const qc = useQueryClient();
  const del = useServerFn(deleteStaffMember);
  const m = useMutation({
    mutationFn: del,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["staff-members"] });
      toast.success("Member removed");
    },
    onError: (e) => toast.error((e as Error).message),
  });
  return (
    <Button
      variant="ghost"
      size="icon"
      disabled={m.isPending}
      onClick={() => {
        if (confirm("Are you sure you want to remove this staff member from your business?")) {
          m.mutate({ data: { id } });
        }
      }}
    >
      {m.isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Trash2 className="h-4 w-4 text-destructive" />
      )}
    </Button>
  );
}

function InviteDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const qc = useQueryClient();
  const invite = useServerFn(inviteStaffMember);
  const m = useMutation({
    mutationFn: invite,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["staff-members"] });
      toast.success("Invitation sent successfully!");
      onOpenChange(false);
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    m.mutate({
      data: {
        email: String(f.get("email") ?? ""),
        role: String(f.get("role") ?? "staff") as "admin" | "manager" | "staff" | "viewer",
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Invite Team Member</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email Address</Label>
            <Input id="email" name="email" type="email" required placeholder="name@company.com" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="role">Role</Label>
            <Select name="role" defaultValue="staff">
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin (Full Control)</SelectItem>
                <SelectItem value="manager">Manager (Read & Write except settings)</SelectItem>
                <SelectItem value="staff">Staff (Limited operations)</SelectItem>
                <SelectItem value="viewer">Viewer (Read-only)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={m.isPending}>
              {m.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Invite Member
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
