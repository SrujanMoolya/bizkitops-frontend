import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { businessQueryOptions } from "@/hooks/use-business";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ context, location }) => {
    let session = null;
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.warn("Auth getSession error:", error.message);
        await supabase.auth.signOut().catch(() => {});
      } else {
        session = data.session;
      }
    } catch (e) {
      console.error("Auth getSession failed:", e);
    }

    if (!session) {
      session = await new Promise<any>((resolve) => {
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, currentSession) => {
          subscription.unsubscribe();
          resolve(currentSession);
        });

        setTimeout(() => {
          subscription.unsubscribe();
          resolve(null);
        }, 2000);
      });
    }

    if (!session?.user) {
      throw redirect({ to: "/login", search: { redirect: location.href } as never });
    }

    const { access_token, refresh_token, expires_in } = session;
    document.cookie = `sb-access-token=${access_token}; path=/; max-age=${expires_in}; SameSite=Lax; Secure`;
    document.cookie = `sb-refresh-token=${refresh_token}; path=/; max-age=31536000; SameSite=Lax; Secure`;

    await context.queryClient.ensureQueryData(businessQueryOptions);
  },
  component: () => <Outlet />,
});
