import { useState, useEffect } from "react";
import {
  createFileRoute,
  Outlet,
  redirect,
  Link,
  useRouter,
  useRouterState,
} from "@tanstack/react-router";
import { useBusiness, businessQueryOptions } from "@/hooks/use-business";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Receipt,
  Wallet,
  Package,
  Users,
  Calendar,
  Globe,
  BarChart3,
  Settings,
  Store,
  LogOut,
  Bell,
  Crown,
  ChevronDown,
  Lock,
  Shield,
  CreditCard,
  Key,
  Sun,
  Moon,
  HelpCircle,
  LucideIcon,
  Car,
} from "lucide-react";
import { differenceInDays, parseISO } from "date-fns";
import { queryOptions, useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getSupportTickets } from "@/lib/support.functions";
import { listInstalledModules } from "@/lib/modules-store.functions";
import { MODULES, ModuleKey } from "@/lib/modules";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RoutePending, RouteError } from "@/components/dashboard/page-shell";
import { getBusinessRolePermissions } from "@/lib/role-permissions";

const installedModulesOptions = queryOptions({
  queryKey: ["installed-modules"],
  queryFn: () => listInstalledModules(),
});

const permissionsOptions = (businessId: string) =>
  queryOptions({
    queryKey: ["role-permissions", businessId],
    queryFn: () => getBusinessRolePermissions({ data: { businessId } }),
  });

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — BizkitOps" }] }),
  loader: async ({ context }) => {
    const b = await context.queryClient.ensureQueryData(businessQueryOptions);
    if (!b.business || !b.business.onboarding_completed) {
      throw redirect({ to: "/onboarding" });
    }
    await Promise.all([
      context.queryClient.ensureQueryData(installedModulesOptions),
      context.queryClient.ensureQueryData(permissionsOptions(b.business.id)),
    ]);
    return null;
  },
  component: DashboardLayout,
  pendingComponent: RoutePending,
  errorComponent: RouteError,
});

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/dashboard/invoices", label: "Invoices", icon: Receipt },
  { to: "/dashboard/customers", label: "Customers", icon: Users },
  { to: "/dashboard/expenses", label: "Expenses", icon: Wallet },
  { to: "/dashboard/inventory", label: "Inventory", icon: Package },
  { to: "/dashboard/crm", label: "CRM", icon: BarChart3 },
  { to: "/dashboard/appointments", label: "Appointments", icon: Calendar },
  { to: "/dashboard/staff", label: "Staff Manager", icon: Shield },
  { to: "/dashboard/permissions", label: "Access Control", icon: Key, adminOnly: true },
  { to: "/dashboard/reports", label: "Reports", icon: BarChart3 },
  { to: "/dashboard/website", label: "Website", icon: Globe },
  { to: "/dashboard/dealership", label: "Dealership", icon: Car },
  { to: "/dashboard/modules", label: "Module Store", icon: Store },
  { to: "/dashboard/billing", label: "Billing", icon: CreditCard },
  { to: "/dashboard/support", label: "Help & Support", icon: HelpCircle },
  { to: "/dashboard/settings", label: "Settings", icon: Settings },
];

const MODULE_KEYS: Record<string, ModuleKey> = {
  "/dashboard/invoices": "billing",
  "/dashboard/expenses": "expenses",
  "/dashboard/inventory": "inventory",
  "/dashboard/crm": "crm",
  "/dashboard/appointments": "appointments",
  "/dashboard/website": "website",
  "/dashboard/dealership": "dealership",
  "/dashboard/staff": "staff",
  "/dashboard/reports": "reports",
};

const ICONS: Record<string, LucideIcon> = {
  Receipt,
  Wallet,
  Package,
  Users,
  Calendar,
  Globe,
  Shield,
  BarChart3,
  Key,
  HelpCircle,
  Car,
};

function DashboardLayout() {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("theme") || "light";
    }
    return "light";
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const { data } = useBusiness();
  const business = data.business!;
  const userRole = data.role || "viewer";
  const router = useRouter();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const { data: installed } = useSuspenseQuery(installedModulesOptions);
  const activeModules = new Map(installed.map((m) => [m.module_key, m.is_active]));

  const { data: rolePermissions } = useSuspenseQuery(permissionsOptions(business.id));
  const allowedRoutes = rolePermissions[userRole] || [];

  // Check if current route is allowed. Owner has unrestricted access.
  const isRouteAllowed = userRole === "owner" || allowedRoutes.some((route) => 
    currentPath === route || currentPath.startsWith(route + "/")
  );

  const trialDays =
    business.plan === "trial" && business.trial_ends_at
      ? Math.max(0, differenceInDays(parseISO(business.trial_ends_at), new Date()))
      : null;

  const signOut = async () => {
    try {
      await supabase.auth.signOut().catch(async (err) => {
        console.warn("Web sign out API failed, performing local sign out:", err);
        await supabase.auth.signOut({ scope: "local" }).catch(() => {});
      });
    } catch (e) {
      console.error("Web logout error:", e);
    }
    // Force clear session cookies manually just in case
    document.cookie = `sb-access-token=; path=/; max-age=0; SameSite=Lax; Secure`;
    document.cookie = `sb-refresh-token=; path=/; max-age=0; SameSite=Lax; Secure`;
    router.navigate({ to: "/login" });
  };

  const initials = (business.name || "B")
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  // Support notifications logic
  const getTicketsFn = useServerFn(getSupportTickets);
  const { data: supportTickets = [] } = useQuery<any[]>({
    queryKey: ["support-tickets-badge"],
    queryFn: async () => {
      try {
        const res = await getTicketsFn();
        return res as any[];
      } catch {
        return [];
      }
    },
    refetchInterval: 30000,
  });

  const hasUnreadResponse = (() => {
    if (currentPath === "/dashboard/support") return false;
    try {
      const seenRaw = localStorage.getItem("bizkitops_seen_tickets");
      const seenList: { id: string; admin_notes: string | null }[] = seenRaw ? JSON.parse(seenRaw) : [];
      const seenMap = new Map(seenList.map((x) => [x.id, x.admin_notes]));

      return supportTickets.some((ticket) => {
        if (!ticket.admin_notes) return false;
        return !seenMap.has(ticket.id) || seenMap.get(ticket.id) !== ticket.admin_notes;
      });
    } catch {
      return false;
    }
  })();

  // Find if current path is gated by a module key
  const activeRouteEntry = Object.entries(MODULE_KEYS).find(([route]) =>
    currentPath.startsWith(route),
  );
  const activeRouteModuleKey = activeRouteEntry?.[1];
  const isModuleActive = activeRouteModuleKey
    ? (activeModules.get(activeRouteModuleKey) ?? false)
    : true;

  // Filter NAV items based on current role permissions
  const filteredNav = NAV.filter((item) => {
    if (item.adminOnly && userRole !== "owner" && userRole !== "admin") {
      return false;
    }
    if (userRole === "owner") return true;
    return allowedRoutes.some((route) => item.to === route || item.to.startsWith(route + "/"));
  });

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <Link to="/dashboard" className="flex items-center gap-2 px-2 py-2">
            <img src="/logo.png" alt="BizkitOps Logo" className="h-8 w-8 object-contain rounded" />
            <div>
              <p className="font-display font-bold leading-tight">BizkitOps</p>
              <p className="text-xs text-muted-foreground leading-tight truncate max-w-[140px]">
                {business.name}
              </p>
            </div>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Manage</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredNav.map((item) => {
                  const mKey = MODULE_KEYS[item.to];
                  const mActive = mKey ? (activeModules.get(mKey) ?? false) : true;
                  const showSupportBadge = item.to === "/dashboard/support" && hasUnreadResponse;

                  return (
                    <SidebarMenuItem key={item.to}>
                      <SidebarMenuButton asChild tooltip={item.label}>
                        <Link
                          to={item.to}
                          activeOptions={{ exact: !!item.exact }}
                          activeProps={{ "data-active": "true" } as never}
                          className="data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground flex items-center justify-between w-full"
                        >
                          <span className="flex items-center gap-2">
                            <item.icon className="h-4 w-4" />
                            <span>{item.label}</span>
                            {showSupportBadge && (
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                              </span>
                            )}
                          </span>
                          {!mActive && (
                            <Lock className="h-3 w-3 text-muted-foreground opacity-60" />
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          {trialDays !== null && (
            <div className="rounded-lg bg-primary-soft p-3 text-sm">
              <p className="font-medium text-primary flex items-center gap-1">
                <Crown className="h-4 w-4" /> Trial · {trialDays} days left
              </p>
              <Button asChild size="sm" className="mt-2 w-full">
                <Link to="/dashboard/settings">Upgrade plan</Link>
              </Button>
            </div>
          )}
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-card/80 backdrop-blur px-4">
          <SidebarTrigger />
          <div className="flex-1" />
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="text-muted-foreground hover:text-foreground"
            title={theme === "dark" ? "Switch to Day Mode" : "Switch to Night Mode"}
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4 text-amber-500" />
            ) : (
              <Moon className="h-4 w-4 text-slate-700" />
            )}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 h-9">
                <div className="h-7 w-7 rounded-full bg-secondary text-secondary-foreground text-xs font-medium flex items-center justify-center">
                  {initials}
                </div>
                <span className="hidden sm:inline text-sm">
                  {data.profile?.full_name ?? "Account"}
                </span>
                <ChevronDown className="h-3 w-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <p className="text-sm">{data.profile?.full_name}</p>
                <p className="text-xs font-normal text-muted-foreground text-capitalize">{data.profile?.email} ({userRole})</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/dashboard/settings">Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={signOut}>
                <LogOut className="h-4 w-4" /> Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <div className="p-4 md:p-6">
          {!isModuleActive ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
              <Card className="max-w-md w-full text-center p-8 shadow-sm border-border bg-card">
                <CardHeader className="flex flex-col items-center">
                  <div className="h-16 w-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
                    <Lock className="h-8 w-8" />
                  </div>
                  <CardTitle className="text-xl font-display font-bold">
                    {MODULES.find((m) => m.key === activeRouteModuleKey)?.name ?? "Module"} is
                    disabled
                  </CardTitle>
                  <CardDescription className="mt-2 text-sm text-muted-foreground">
                    This module is currently turned off for your business. Enable it in the Module
                    Store to start using this feature.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center mt-4">
                  <Button asChild>
                    <Link to="/dashboard/modules">Go to Module Store</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : !isRouteAllowed ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
              <Card className="max-w-md w-full text-center p-8 shadow-sm border-border bg-card">
                <CardHeader className="flex flex-col items-center">
                  <div className="h-16 w-16 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mb-4">
                    <Lock className="h-8 w-8" />
                  </div>
                  <CardTitle className="text-xl font-display font-bold text-rose-600">
                    Access Denied
                  </CardTitle>
                  <CardDescription className="mt-2 text-sm text-muted-foreground">
                    Your role <strong className="text-foreground capitalize">{userRole}</strong> does not have permission to access this page. Please contact your business administrator or owner.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center mt-4">
                  <Button asChild>
                    <Link to="/dashboard">Go to Dashboard</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Outlet />
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
