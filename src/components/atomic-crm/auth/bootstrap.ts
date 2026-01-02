import { supabaseClient } from "../providers/supabase/supabase";

export async function getBootstrapStatus(): Promise<{ setupRequired: boolean }> {
  const { data, error } = await supabaseClient.functions.invoke("bootstrap-status");
  if (error) {
    console.error("Bootstrap status check failed:", error);
    return { setupRequired: false };
  }
  return { setupRequired: Boolean((data as any)?.setupRequired) };
}
