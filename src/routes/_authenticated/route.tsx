import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { authClient, neonAuthConfigured } from "@/integrations/neon/auth-client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    if (!neonAuthConfigured() || !authClient) {
      throw redirect({ to: "/auth", search: { next: location.pathname } });
    }
    const { data, error } = await authClient.getSession();
    const user = data?.user;
    if (error || !user) {
      throw redirect({ to: "/auth", search: { next: location.pathname } });
    }
    return { user };
  },
  component: () => <Outlet />,
});
