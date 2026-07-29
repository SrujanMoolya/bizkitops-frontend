import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Resolve the active business id for the authenticated user.
 * Owned businesses win over membership; throws if none found.
 */
export async function resolveBusinessId(supabase: SupabaseClient, userId: string): Promise<string> {
  const { data: owned } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (owned) return owned.id;

  const { data: mem } = await supabase
    .from("business_members")
    .select("business_id")
    .eq("user_id", userId)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();
  if (mem) return mem.business_id;

  throw new Error("No business found for user. Complete onboarding first.");
}
