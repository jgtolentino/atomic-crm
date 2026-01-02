import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { getBootstrapStatus } from "./bootstrap";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const nav = useNavigate();
  const loc = useLocation();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const { setupRequired } = await getBootstrapStatus();

      // If setup IS required, force /sign-up as default
      if (setupRequired && loc.pathname !== "/sign-up") {
        nav("/sign-up", { replace: true });
      }

      // If setup is NOT required, force /sign-in as default
      if (!setupRequired && loc.pathname !== "/sign-in") {
        nav("/sign-in", { replace: true });
      }

      setReady(true);
    })();
  }, [loc.pathname, nav]);

  if (!ready) return null;
  return <>{children}</>;
}
