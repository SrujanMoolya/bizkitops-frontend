import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getCurrentBusiness } from "@/lib/business.functions";

export const businessQueryOptions = queryOptions({
  queryKey: ["current-business"],
  queryFn: () => getCurrentBusiness(),
  staleTime: 1000 * 60,
});

export function useBusiness() {
  return useSuspenseQuery(businessQueryOptions);
}
