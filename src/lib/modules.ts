// Plan + module capability map. Mirrors public.subscription_plans seed.
export type PlanKey = "trial" | "basic" | "pro" | "custom";
export type ModuleKey =
  | "billing"
  | "expenses"
  | "inventory"
  | "crm"
  | "appointments"
  | "website"
  | "staff"
  | "reports";

export interface ModuleMeta {
  key: ModuleKey;
  name: string;
  description: string;
  minPlan: PlanKey;
  icon: string; // lucide icon name
  category: "Finance" | "Operations" | "Sales" | "HR" | "Marketing";
}

export const MODULES: ModuleMeta[] = [
  {
    key: "billing",
    name: "Billing & Invoicing",
    description: "Create GST-compliant invoices in 30 seconds. Send via WhatsApp or email.",
    minPlan: "basic",
    icon: "Receipt",
    category: "Finance",
  },
  {
    key: "expenses",
    name: "Expense Tracker",
    description: "Log expenses on the go. Snap receipts, categorise, and never lose a bill.",
    minPlan: "basic",
    icon: "Wallet",
    category: "Finance",
  },
  {
    key: "inventory",
    name: "Inventory",
    description: "Track stock levels in real time. Get alerts before you run out.",
    minPlan: "basic",
    icon: "Package",
    category: "Operations",
  },
  {
    key: "crm",
    name: "CRM & Leads",
    description: "Follow up on leads, track deals, and never miss a sales opportunity.",
    minPlan: "pro",
    icon: "Users",
    category: "Sales",
  },
  {
    key: "appointments",
    name: "Appointments",
    description: "Let customers book slots online. Manage your calendar effortlessly.",
    minPlan: "pro",
    icon: "Calendar",
    category: "Operations",
  },
  {
    key: "website",
    name: "Storefront",
    description: "Public business page customers can find and contact you from.",
    minPlan: "basic",
    icon: "Globe",
    category: "Marketing",
  },
  {
    key: "staff",
    name: "Staff Manager",
    description: "Add staff, assign roles, and control what they can access.",
    minPlan: "pro",
    icon: "Shield",
    category: "HR",
  },
  {
    key: "reports",
    name: "Reports",
    description: "Revenue, expenses, P&L, GST and aging — all in one place.",
    minPlan: "basic",
    icon: "BarChart3",
    category: "Finance",
  },
];

export const PLAN_RANK: Record<PlanKey, number> = {
  trial: 2, // trial behaves like Pro during the 7 days
  basic: 1,
  pro: 2,
  custom: 3,
};

export function canAccessModule(plan: PlanKey, moduleKey: ModuleKey, trialEndsAt?: string): boolean {
  const mod = MODULES.find((m) => m.key === moduleKey);
  if (!mod) return false;

  if (plan === "trial") {
    if (trialEndsAt) {
      const isExpired = new Date(trialEndsAt) <= new Date();
      if (isExpired) return false; // Trial expired
    }
    return true; // During active 7-day trial, every module is free to use
  }

  return PLAN_RANK[plan] >= PLAN_RANK[mod.minPlan];
}

export const PLAN_INFO: Record<
  Exclude<PlanKey, "trial">,
  { name: string; monthly: number | null; yearly: number | null; tagline: string }
> = {
  basic: {
    name: "Basic",
    monthly: 499,
    yearly: 4730, // 21% discount on 499*12 (5988 -> 4730)
    tagline: "For small businesses getting started.",
  },
  pro: { 
    name: "Pro", 
    monthly: 1499, 
    yearly: 14210, // 21% discount on 1499*12 (17988 -> 14210)
    tagline: "Everything you need to grow." 
  },
  custom: { name: "Custom", monthly: null, yearly: null, tagline: "Tailored for enterprises." },
};
