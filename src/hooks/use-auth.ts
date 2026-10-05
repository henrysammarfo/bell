import { useEffect, useState } from "react";
import { authClient, neonAuthConfigured } from "@/integrations/neon/auth-client";

export type BellAuthUser = {
  id: string;
  email?: string | null;
  name?: string | null;
};

export function useAuth() {
  const [user, setUser] = useState<BellAuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (!neonAuthConfigured() || !authClient) {
      setUser(null);
      setLoading(false);
      return;
    }

    const sync = async () => {
      try {
        const { data } = await authClient.getSession();
        if (!active) return;
        const u = data?.user;
        setUser(
          u?.id
            ? {
                id: String(u.id),
                email: (u as { email?: string | null }).email ?? null,
                name: (u as { name?: string | null }).name ?? null,
              }
            : null,
        );
      } catch {
        if (active) setUser(null);
      } finally {
        if (active) setLoading(false);
      }
    };

    void sync();
    const interval = window.setInterval(() => void sync(), 30_000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  return { user, loading };
}
