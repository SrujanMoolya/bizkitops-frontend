import { useQuery, queryOptions } from "@tanstack/react-query";
import { listInstalledModules } from "@/lib/modules-store.functions";

export type SpecializedIndustryKey = "dealership" | "restaurant" | "finance" | "real_estate";

export interface SpecializedIndustryMeta {
  key: SpecializedIndustryKey;
  name: string;
  badge: string;
  icon: string;
  colorClass: "amber" | "emerald" | "blue" | "purple";
  coreInventoryLabel: string;
  coreInventorySubtitle: string;
  coreCrmLabel: string;
  coreCrmSubtitle: string;
  specialInventoryName: string;
  specialCrmName: string;
  notices: {
    coreInventoryBanner: string;
    specialInventoryBanner: string;
    coreCrmBanner: string;
    specialCrmBanner: string;
  };
}

export const SPECIALIZED_INDUSTRIES: Record<SpecializedIndustryKey, SpecializedIndustryMeta> = {
  dealership: {
    key: "dealership",
    name: "Automobile Dealership",
    badge: "Showroom Hub",
    icon: "Car",
    colorClass: "amber",
    coreInventoryLabel: "Spare Parts & Accessories",
    coreInventorySubtitle: "General Stock, Helmets & Spare Parts",
    coreCrmLabel: "General Business CRM",
    coreCrmSubtitle: "Vendors, Partners & Corporate Accounts",
    specialInventoryName: "Showroom Vehicle Inventory",
    specialCrmName: "Showroom Buyer Inquiries",
    notices: {
      coreInventoryBanner: "Selling Cars or Bikes? Manage your showroom vehicle stock in the Dealership Hub.",
      specialInventoryBanner: "Need to manage spare parts, helmets, or engine oil stock? Go to General Inventory.",
      coreCrmBanner: "Managing vehicle buyer leads & test drives? Use the Dealership Inquiries hub.",
      specialCrmBanner: "General vendor directory and corporate partner accounts are managed in Core CRM.",
    },
  },
  restaurant: {
    key: "restaurant",
    name: "Restaurant & Cafe",
    badge: "Dining Hub",
    icon: "Utensils",
    colorClass: "emerald",
    coreInventoryLabel: "Raw Ingredients & Supplies",
    coreInventorySubtitle: "Kitchen Ingredients, Cutlery & Supplies",
    coreCrmLabel: "Supplier CRM",
    coreCrmSubtitle: "Food Suppliers & Distributors",
    specialInventoryName: "Menu & Dish Catalog",
    specialCrmName: "Table Reservations & Guests",
    notices: {
      coreInventoryBanner: "Managing restaurant recipes and menu pricing? Use the Restaurant Dining Hub.",
      specialInventoryBanner: "Need to track raw food ingredient stock or kitchen supplies? Go to General Inventory.",
      coreCrmBanner: "Managing table bookings or guest lists? Use the Restaurant Guest Hub.",
      specialCrmBanner: "Raw food suppliers and distributor accounts are managed in Core CRM.",
    },
  },
  finance: {
    key: "finance",
    name: "Finance & Lending",
    badge: "Lending Hub",
    icon: "Landmark",
    colorClass: "blue",
    coreInventoryLabel: "Office Assets & IT Hardware",
    coreInventorySubtitle: "Company Hardware, IT & Office Assets",
    coreCrmLabel: "B2B Institution Directory",
    coreCrmSubtitle: "Partner Institutions & Service Vendors",
    specialInventoryName: "Loan Portfolios",
    specialCrmName: "Borrowers & Applicants",
    notices: {
      coreInventoryBanner: "Managing customer loan packages & EMI products? Use the Finance Hub.",
      specialInventoryBanner: "Physical office assets and hardware equipment belong in General Inventory.",
      coreCrmBanner: "Managing loan applicants & borrower profiles? Use the Finance Hub.",
      specialCrmBanner: "Institutional partners and service vendors are managed in Core CRM.",
    },
  },
  real_estate: {
    key: "real_estate",
    name: "Real Estate & Housing",
    badge: "Property Hub",
    icon: "Building2",
    colorClass: "purple",
    coreInventoryLabel: "Marketing & Office Stock",
    coreInventorySubtitle: "Signboards, Brochures & Office Supplies",
    coreCrmLabel: "Vendor & Agent Network",
    coreCrmSubtitle: "Contractors, Sub-agents & Partners",
    specialInventoryName: "Property Listings",
    specialCrmName: "Buyer & Site Visit Leads",
    notices: {
      coreInventoryBanner: "Managing property listings and floor plans? Use the Real Estate Hub.",
      specialInventoryBanner: "Office equipment, signboards, and brochures belong in General Inventory.",
      coreCrmBanner: "Managing property buyers & site visits? Use the Real Estate Leads Hub.",
      specialCrmBanner: "Contractor networks and agency partners are managed in Core CRM.",
    },
  },
};

export const installedModulesQueryOptions = queryOptions({
  queryKey: ["installed-modules"],
  queryFn: () => listInstalledModules(),
});

/**
 * Returns active specialized industry metadata based on active module keys list or map
 */
export function getActiveIndustryMeta(activeModulesMapOrKeys?: Map<string, boolean> | string[]): SpecializedIndustryMeta | null {
  if (!activeModulesMapOrKeys) return null;
  if (activeModulesMapOrKeys instanceof Map) {
    for (const [key, isActive] of activeModulesMapOrKeys.entries()) {
      if (isActive && key in SPECIALIZED_INDUSTRIES) {
        return SPECIALIZED_INDUSTRIES[key as SpecializedIndustryKey];
      }
    }
  } else if (Array.isArray(activeModulesMapOrKeys)) {
    for (const key of activeModulesMapOrKeys) {
      if (key in SPECIALIZED_INDUSTRIES) {
        return SPECIALIZED_INDUSTRIES[key as SpecializedIndustryKey];
      }
    }
  }
  return null;
}

/**
 * React Hook to get current active industry metadata
 */
export function useActiveIndustryMeta(): SpecializedIndustryMeta | null {
  const { data: installed = [] } = useQuery(installedModulesQueryOptions);
  const activeMap = new Map(installed.map((m) => [m.module_key, m.is_active]));
  return getActiveIndustryMeta(activeMap);
}
