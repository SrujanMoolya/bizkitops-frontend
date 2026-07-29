import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { queryOptions, useSuspenseQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useBusiness, businessQueryOptions } from "@/hooks/use-business";
import { getBusinessRolePermissions, saveBusinessRolePermissions } from "@/lib/role-permissions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/dashboard/page-shell";
import { toast } from "sonner";
import { Shield, Key, Loader2, Save, Lock, ArrowLeft, Info, HelpCircle } from "lucide-react";
import { RoutePending, RouteError } from "@/components/dashboard/page-shell";

const permissionsOptions = (businessId: string) =>
  queryOptions({
    queryKey: ["role-permissions", businessId],
    queryFn: () => getBusinessRolePermissions({ data: { businessId } }),
  });

export const Route = createFileRoute("/_authenticated/dashboard/permissions")({
  head: () => ({ meta: [{ title: "Access Control — BizkitOps" }] }),
  loader: async ({ context }) => {
    const b = await context.queryClient.ensureQueryData(businessQueryOptions);
    if (!b.business) {
      throw redirect({ to: "/onboarding" });
    }
    // Block non-owners and non-admins from loading this page
    if (b.role !== "owner" && b.role !== "admin") {
      throw redirect({ to: "/dashboard" });
    }
    await context.queryClient.ensureQueryData(permissionsOptions(b.business.id));
    return null;
  },
  component: PermissionsPage,
  pendingComponent: RoutePending,
  errorComponent: RouteError,
});

const PAGES = [
  { path: "/dashboard", label: "Dashboard Overview", desc: "Main summary metrics, KPIs, and recent alerts" },
  { path: "/dashboard/invoices", label: "Invoices", desc: "Creating, editing, sending, and downloading customer invoices" },
  { path: "/dashboard/customers", label: "Customers", desc: "Customer list, balances, payments, and account history" },
  { path: "/dashboard/expenses", label: "Expenses", desc: "Logging cash outflows, vendor records, and expense categories" },
  { path: "/dashboard/inventory", label: "Inventory", desc: "Product directories, stock counts, and purchase logs" },
  { path: "/dashboard/crm", label: "CRM (Leads)", desc: "Contact feed, lead status, deal stages, and pipelines" },
  { path: "/dashboard/appointments", label: "Appointments", desc: "Calendar view, booking forms, and service schedules" },
  { path: "/dashboard/staff", label: "Staff Manager", desc: "Inviting team members, deleting staff, and listing roles" },
  { path: "/dashboard/reports", label: "Reports & Analytics", desc: "Platform charts, profit margins, and financial records" },
  { path: "/dashboard/storefront", label: "Storefront Web", desc: "Public ecommerce storefront configuration and settings" },
  { path: "/dashboard/modules", label: "Module Store", desc: "Turning system modules on or off" },
  { path: "/dashboard/billing", label: "Billing Ledger", desc: "Platform payments, subscriptions, invoices, and SLA tiers" },
  { path: "/dashboard/settings", label: "Settings", desc: "Core business details, currency, address, and profile settings" },
  { path: "/dashboard/permissions", label: "Access Control Matrix", desc: "Modify role-based routing and page configurations" }
];

const ROLES = [
  { key: "owner", label: "Owner", editable: false, badge: "Full Access" },
  { key: "admin", label: "Admin", editable: true, badge: "High" },
  { key: "manager", label: "Manager", editable: true, badge: "Medium" },
  { key: "staff", label: "Staff", editable: true, badge: "Low" },
  { key: "viewer", label: "Viewer", editable: true, badge: "Read-Only" }
];

function PermissionsPage() {
  const { data: bData } = useBusiness();
  const businessId = bData.business!.id;
  const currentRole = bData.role;

  const { data: dbPermissions } = useSuspenseQuery(permissionsOptions(businessId));
  const queryClient = useQueryClient();
  const saveFn = useServerFn(saveBusinessRolePermissions);

  const [localPermissions, setLocalPermissions] = useState<Record<string, string[]>>(() => {
    return JSON.parse(JSON.stringify(dbPermissions));
  });

  const [savingRole, setSavingRole] = useState<string | null>(null);

  const saveMutation = useMutation({
    mutationFn: async (payload: { role: string; allowedRoutes: string[] }) => {
      setSavingRole(payload.role);
      return saveFn({ data: { businessId, role: payload.role, allowedRoutes: payload.allowedRoutes } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["role-permissions", businessId] });
      toast.success("Role permissions updated successfully!");
    },
    onError: (err) => {
      toast.error((err as Error).message || "Failed to update permissions");
    },
    onSettled: () => {
      setSavingRole(null);
    }
  });

  const handleToggle = (role: string, path: string) => {
    setLocalPermissions((prev) => {
      const allowed = prev[role] || [];
      const updated = allowed.includes(path)
        ? allowed.filter((r) => r !== path)
        : [...allowed, path];

      return {
        ...prev,
        [role]: updated
      };
    });
  };

  const handleSaveRole = (role: string) => {
    const allowedRoutes = localPermissions[role] || [];
    saveMutation.mutate({ role, allowedRoutes });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <PageHeader
          title="Access Control Matrix"
          description="Grant or restrict access to specific dashboard pages for each team role."
        />
        <Button asChild variant="outline" size="sm" className="gap-1.5">
          <Link to="/dashboard/staff">
            <ArrowLeft className="h-4 w-4" /> Back to Staff
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* Info panel */}
        <div className="xl:col-span-1 space-y-4">
          <Card className="bg-card shadow-sm border-border">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Security Guardrails
              </CardTitle>
              <CardDescription>
                System safety parameters that protect your configuration.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3.5 text-xs text-muted-foreground">
              <div className="flex items-start gap-2">
                <Lock className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-foreground font-semibold">Owner Lockout Protection:</strong>
                  <p className="mt-0.5">Owners always have access to all pages. Their permissions cannot be modified.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-foreground font-semibold">Admin Restriction Warnings:</strong>
                  <p className="mt-0.5">We recommend leaving access to critical sections (like Settings & Access Control) enabled for Admin role.</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <HelpCircle className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-foreground font-semibold">Real-Time Routing Gating:</strong>
                  <p className="mt-0.5">Changing permissions immediately restricts team members upon their next page load.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Matrix Table */}
        <div className="xl:col-span-3">
          <Card className="bg-card shadow-sm border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50 dark:bg-slate-900/30">
                  <TableHead className="font-semibold text-sm w-[300px]">Dashboard Page</TableHead>
                  {ROLES.map((role) => (
                    <TableHead key={role.key} className="text-center font-semibold text-sm min-w-[100px]">
                      <div className="flex flex-col items-center">
                        <span>{role.label}</span>
                        <span className="text-[10px] font-normal text-muted-foreground mt-0.5">
                          {role.badge}
                        </span>
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {PAGES.map((page) => (
                  <TableRow key={page.path} className="hover:bg-slate-50/30 dark:hover:bg-slate-900/10">
                    <TableCell>
                      <div>
                        <p className="font-semibold text-sm text-foreground">{page.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{page.desc}</p>
                      </div>
                    </TableCell>

                    {ROLES.map((role) => {
                      const isOwner = role.key === "owner";
                      const isChecked = isOwner ? true : (localPermissions[role.key]?.includes(page.path) ?? false);
                      
                      return (
                        <TableCell key={role.key} className="text-center">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            disabled={!role.editable}
                            onChange={() => handleToggle(role.key, page.path)}
                            className={`h-4.5 w-4.5 rounded border-border text-primary focus:ring-primary ${!role.editable ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                          />
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {/* Footer saves row */}
            <div className="p-4 bg-slate-50/50 dark:bg-slate-900/30 border-t flex flex-wrap items-center justify-end gap-3">
              <span className="text-xs text-muted-foreground mr-auto">
                * Click save on the right to commit permissions for each role.
              </span>
              {ROLES.filter((r) => r.editable).map((role) => (
                <Button
                  key={role.key}
                  size="sm"
                  onClick={() => handleSaveRole(role.key)}
                  disabled={saveMutation.isPending}
                  className="gap-1.5 h-8 text-xs font-semibold"
                >
                  {savingRole === role.key ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Save className="h-3.5 w-3.5" />
                  )}
                  Save {role.label}
                </Button>
              ))}
            </div>
          </Card>
        </div>
        
      </div>
    </div>
  );
}
